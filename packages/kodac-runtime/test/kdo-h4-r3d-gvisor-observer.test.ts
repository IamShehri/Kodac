import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { spawn, spawnSync } from "node:child_process"
import { closeSync, mkdtempSync, openSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"

import {
  KDO_H4_R3D_EVIDENCE_CLASS,
  KDO_H4_R3D_GVISOR_CANDIDATE_VERSION,
  KDO_H4_R3D_GVISOR_OBSERVER_PLAN_VERSION,
  KDO_H4_R3D_GVISOR_PROCESS_VERSION,
  KDO_H4_R3D_GVISOR_RUNTIME_CLASS,
  KDO_H4_R3D_GVISOR_STATE_VERSION,
  KDO_H4_R3D_GVISOR_STATS_VERSION,
  KDO_H4_R3D_NATIVE_FAILURE_EXIT,
  KDO_H4_R3D_RUNSC_ARTIFACT_FD,
  createGvisorObserverPlan,
  createGvisorRuntimeObservationCandidate,
  materializeGvisorStateCommand,
  materializeGvisorStatsCommand,
  parseGvisorProcessObservation,
  parseGvisorStateOutput,
  parseGvisorStatsOutput,
  validateGvisorObserverPlan,
  validateGvisorProcessObservation,
  validateGvisorRuntimeObservationCandidate,
  validateGvisorStateObservation,
  validateGvisorStatsObservation,
} from "../src/trust/sandbox-observer-gvisor.ts"

const FIXTURE_CONTAINER_ID = "1".repeat(64)
const FIXTURE_RUNSC_SHA = "c".repeat(64)
const FIXTURE_BUNDLE = `/run/containerd/io.containerd.runtime.v2.task/moby/${FIXTURE_CONTAINER_ID}`

function fixturePlan() {
  return createGvisorObserverPlan({
    runscPath: "/usr/local/bin/runsc",
    expectedRunscSha256: FIXTURE_RUNSC_SHA,
    runtimeRoot: "/var/run/runsc",
    containerId: FIXTURE_CONTAINER_ID,
  })
}

function fixtureState(plan = fixturePlan(), annotations: Record<string, string> | undefined = undefined) {
  return parseGvisorStateOutput(JSON.stringify({
    ociVersion: "1.2.0",
    id: FIXTURE_CONTAINER_ID,
    status: "running",
    pid: 4242,
    bundle: FIXTURE_BUNDLE,
    ...(annotations === undefined ? {} : { annotations }),
  }), plan)
}

function fixtureStats(plan = fixturePlan()) {
  return parseGvisorStatsOutput(JSON.stringify({
    type: "stats",
    id: FIXTURE_CONTAINER_ID,
    data: {
      cpu: { usage: { total: 123 } },
      memory: { usage: { limit: 1024, usage: 512 } },
      pids: { current: 2 },
      network_interfaces: [],
    },
  }), plan)
}

function fixtureProcess() {
  return parseGvisorProcessObservation(
    "kodac-gvisor-proc-v1 pid=4242 start-ticks=123456789 exe-dev=2049 exe-ino=987654321 exe-size=12345678\n",
  )
}

function fixtureCandidate() {
  const plan = fixturePlan()
  return createGvisorRuntimeObservationCandidate({ plan, state: fixtureState(plan), stats: fixtureStats(plan), process: fixtureProcess() })
}


function linuxOnly(name: string, fn: () => void | Promise<void>): void {
  test(name, { skip: process.platform !== "linux" }, fn)
}

function source(relative: string): string {
  return readFileSync(new URL(relative, import.meta.url), "utf8")
}

function gitBlobSha1(text: string): string {
  const canonical = text.replace(/\r\n/g, "\n")
  const body = Buffer.from(canonical, "utf8")
  return createHash("sha1").update(`blob ${body.byteLength}\0`).update(body).digest("hex")
}

test("H4-R3D constants and five normative identity vectors are exact", () => {
  assert.equal(KDO_H4_R3D_GVISOR_OBSERVER_PLAN_VERSION, "kodac-h4-r3d-gvisor-observer-plan-v1")
  assert.equal(KDO_H4_R3D_GVISOR_STATE_VERSION, "kodac-h4-r3d-gvisor-state-v1")
  assert.equal(KDO_H4_R3D_GVISOR_STATS_VERSION, "kodac-h4-r3d-gvisor-stats-v1")
  assert.equal(KDO_H4_R3D_GVISOR_PROCESS_VERSION, "kodac-h4-r3d-gvisor-process-v1")
  assert.equal(KDO_H4_R3D_GVISOR_CANDIDATE_VERSION, "kodac-h4-r3d-gvisor-runtime-candidate-v1")
  assert.equal(KDO_H4_R3D_GVISOR_RUNTIME_CLASS, "gvisor")
  assert.equal(KDO_H4_R3D_EVIDENCE_CLASS, "e3-candidate")
  assert.equal(KDO_H4_R3D_RUNSC_ARTIFACT_FD, 3)
  assert.equal(KDO_H4_R3D_NATIVE_FAILURE_EXIT, 125)

  const plan = fixturePlan()
  const state = fixtureState(plan)
  const stats = fixtureStats(plan)
  const processObservation = fixtureProcess()
  const candidate = createGvisorRuntimeObservationCandidate({ plan, state, stats, process: processObservation })

  assert.equal(plan.planIdentity, "394a27478223785ad07321b84cc8e1afce0eba33bb5d2d89448e95f3b428f69a")
  assert.equal(state.stateIdentity, "9b2f66fd6cd170674533c0d897c4f4a4c523df6e1222fc588cc2f9a099fa8548")
  assert.equal(stats.statsIdentity, "354262819bf9670637ca1f4497f7298c08e7353f984503143fe57e84f6364092")
  assert.equal(processObservation.processIdentity, "bec3dc32697a4caab26112a2a999f62dd8500df26ab35c89d837997fb121dd07")
  assert.equal(candidate.candidateIdentity, "eb8d117f4998baf6574e394aab3a923f10ceea78c6996e25ad8c74b674484b21")

  assert.deepEqual(validateGvisorObserverPlan(plan), plan)
  assert.deepEqual(validateGvisorStateObservation(state), state)
  assert.deepEqual(validateGvisorStatsObservation(stats), stats)
  assert.deepEqual(validateGvisorProcessObservation(processObservation), processObservation)
  assert.deepEqual(validateGvisorRuntimeObservationCandidate(candidate, { plan, state, stats, process: processObservation }), candidate)
})

test("observer plan is deterministic frozen strict and materializes only inert exact commands", () => {
  const plan = fixturePlan()
  const second = fixturePlan()
  assert.deepEqual(plan, second)
  assert.equal(Object.isFrozen(plan), true)
  assert.deepEqual(materializeGvisorStateCommand(plan), {
    file: "/usr/local/bin/runsc",
    args: ["--root", "/var/run/runsc", "state", FIXTURE_CONTAINER_ID],
  })
  assert.deepEqual(materializeGvisorStatsCommand(plan), {
    file: "/usr/local/bin/runsc",
    args: ["--root", "/var/run/runsc", "events", "--stats", FIXTURE_CONTAINER_ID],
  })

  for (const input of [
    { ...plan, runscPath: "runsc" },
    { ...plan, runscPath: "/usr/local/bin/../bin/runsc" },
    { ...plan, runtimeRoot: "/var/run/runsc/" },
    { ...plan, expectedRunscSha256: "C".repeat(64) },
    { ...plan, expectedRunscSha256: "c".repeat(63) },
    { ...plan, containerId: FIXTURE_CONTAINER_ID.slice(0, 12) },
    { ...plan, containerId: "G".repeat(64) },
    { ...plan, extra: true },
  ]) assert.throws(() => validateGvisorObserverPlan(input))

  const base = { runscPath: "/usr/local/bin/runsc", expectedRunscSha256: FIXTURE_RUNSC_SHA, runtimeRoot: "/var/run/runsc", containerId: FIXTURE_CONTAINER_ID }
  let traps = 0
  const proxy = new Proxy(base, { getPrototypeOf() { traps += 1; return Object.prototype }, ownKeys() { traps += 1; return [] } })
  assert.throws(() => createGvisorObserverPlan(proxy))
  assert.equal(traps, 0)

  const accessor = { ...base } as Record<string, unknown>
  Object.defineProperty(accessor, "runscPath", { enumerable: true, get: () => "/usr/local/bin/runsc" })
  assert.throws(() => createGvisorObserverPlan(accessor as never), /data property/)
})

test("state parsing is closed bounded duplicate-safe and annotations never affect identity", () => {
  const plan = fixturePlan()
  const noAnnotations = fixtureState(plan)
  const annotations = fixtureState(plan, { "": "", source: "diagnostic" })
  assert.equal(annotations.stateIdentity, noAnnotations.stateIdentity)
  assert.equal(Object.isFrozen(annotations), true)
  assert.equal(Object.isFrozen(annotations.annotations), true)

  for (const status of ["creating", "created", "stopped", "paused"]) {
    assert.throws(() => parseGvisorStateOutput(JSON.stringify({ ociVersion: "1.2.0", id: FIXTURE_CONTAINER_ID, status, pid: 4242, bundle: FIXTURE_BUNDLE }), plan), /status/)
  }
  for (const pid of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => parseGvisorStateOutput(JSON.stringify({ ociVersion: "1.2.0", id: FIXTURE_CONTAINER_ID, status: "running", pid, bundle: FIXTURE_BUNDLE }), plan), /pid/)
  }
  assert.throws(() => parseGvisorStateOutput(JSON.stringify({ ociVersion: "1.2.0", id: "2".repeat(64), status: "running", pid: 4242, bundle: FIXTURE_BUNDLE }), plan), /container id/)
  assert.throws(() => parseGvisorStateOutput(JSON.stringify({ ociVersion: "1.2.0", id: FIXTURE_CONTAINER_ID, status: "running", pid: 4242, bundle: "relative" }), plan), /absolute/)
  assert.throws(() => parseGvisorStateOutput(JSON.stringify({ ociVersion: "1.2.0", id: FIXTURE_CONTAINER_ID, status: "running", pid: 4242, bundle: FIXTURE_BUNDLE, extra: true }), plan), /unknown key/)
  assert.throws(() => parseGvisorStateOutput(`{"ociVersion":"1.2.0","id":"${FIXTURE_CONTAINER_ID}","status":"running","pid":4242,"bundle":"${FIXTURE_BUNDLE}","id":"${FIXTURE_CONTAINER_ID}"}`, plan), /duplicate JSON object key/)
  assert.throws(() => parseGvisorStateOutput(`{"ociVersion":"1.2.0","id":"${FIXTURE_CONTAINER_ID}","status":"running","pid":4242,"bundle":"${FIXTURE_BUNDLE}","annotations":{"a":"x","\\u0061":"y"}}`, plan), /duplicate JSON object key/)
  assert.throws(() => parseGvisorStateOutput(`${JSON.stringify({ ociVersion: "1.2.0", id: FIXTURE_CONTAINER_ID, status: "running", pid: 4242, bundle: FIXTURE_BUNDLE })}{}`, plan), /trailing JSON/)
  assert.throws(() => parseGvisorStateOutput("x".repeat(65537), plan), /65536/)
})

test("stats parsing proves exact subject RPC shape only and never resource authority", () => {
  const plan = fixturePlan()
  const stats = fixtureStats(plan)
  assert.equal(stats.eventType, "stats")
  assert.deepEqual(Object.keys(stats).sort(), ["containerId", "eventType", "statsIdentity", "version"])
  assert.equal("cpu" in stats, false)
  assert.equal("memory" in stats, false)
  assert.equal("networkPolicy" in stats, false)

  const good = { type: "stats", id: FIXTURE_CONTAINER_ID, data: { nested: { values: [1, true, null, "x"] } } }
  assert.doesNotThrow(() => parseGvisorStatsOutput(JSON.stringify(good), plan))
  assert.throws(() => parseGvisorStatsOutput(JSON.stringify({ ...good, type: "oom" }), plan), /event type/)
  assert.throws(() => parseGvisorStatsOutput(JSON.stringify({ ...good, id: "2".repeat(64) }), plan), /container id/)
  assert.throws(() => parseGvisorStatsOutput(JSON.stringify({ ...good, extra: true }), plan), /contain exactly/)
  assert.throws(() => parseGvisorStatsOutput(JSON.stringify({ ...good, data: null }), plan), /plain object/)
  assert.throws(() => parseGvisorStatsOutput(`{"type":"stats","id":"${FIXTURE_CONTAINER_ID}","data":{"x":1,"x":2}}`, plan), /duplicate JSON object key/)
  assert.throws(() => parseGvisorStatsOutput("x".repeat(262145), plan), /262144/)
})

test("native process record parsing preserves uint64 precision and rejects grammar ambiguity", () => {
  const processObservation = fixtureProcess()
  assert.equal(processObservation.pid, 4242)
  assert.equal(processObservation.startTicks, "123456789")

  const huge = parseGvisorProcessObservation("kodac-gvisor-proc-v1 pid=4242 start-ticks=18446744073709551615 exe-dev=18446744073709551615 exe-ino=18446744073709551615 exe-size=18446744073709551615\n")
  assert.equal(huge.exeIno, "18446744073709551615")
  assert.notEqual(Number(huge.exeIno).toString(), huge.exeIno)

  for (const text of [
    "kodac-gvisor-proc-v1 pid=04242 start-ticks=1 exe-dev=1 exe-ino=1 exe-size=1\n",
    "kodac-gvisor-proc-v1 pid=+4242 start-ticks=1 exe-dev=1 exe-ino=1 exe-size=1\n",
    "kodac-gvisor-proc-v1 pid=4242 start-ticks=01 exe-dev=1 exe-ino=1 exe-size=1\n",
    "kodac-gvisor-proc-v1 pid=4242 start-ticks=1 exe-dev=1 exe-ino=1 exe-size=1 extra=1\n",
    "kodac-gvisor-proc-v1 pid=4242 start-ticks=1 exe-dev=1 exe-ino=1 exe-size=1\nextra\n",
    "kodac-gvisor-proc-v1 pid=4242 start-ticks=1 exe-dev=1 exe-ino=1\n",
  ]) assert.throws(() => parseGvisorProcessObservation(text), /malformed/)
  assert.throws(() => parseGvisorProcessObservation("kodac-gvisor-proc-v1 pid=4242 start-ticks=18446744073709551616 exe-dev=1 exe-ino=1 exe-size=1\n"), /uint64/)
})

test("candidate remains a bounded E3 candidate and cannot smuggle R3B physical facts", () => {
  const candidate = fixtureCandidate()
  assert.equal(candidate.runtimeClass, "gvisor")
  assert.equal(candidate.evidenceClass, "e3-candidate")
  assert.equal(Object.isFrozen(candidate), true)
  assert.deepEqual(Object.keys(candidate).sort(), [
    "candidateIdentity", "evidenceClass", "planIdentity", "processIdentity", "runtimeClass", "stateIdentity", "statsIdentity", "version",
  ])
  for (const forbidden of ["observedSourceDigest", "observedNetworkPolicy", "observedResourcePolicy", "observedCredentialBindingIdentity", "downgradeOccurred", "observationIdentity"]) {
    assert.equal(forbidden in candidate, false)
  }

  const plan = fixturePlan()
  const wrongPid = parseGvisorProcessObservation("kodac-gvisor-proc-v1 pid=4243 start-ticks=123456789 exe-dev=2049 exe-ino=987654321 exe-size=12345678\n")
  assert.throws(() => createGvisorRuntimeObservationCandidate({ plan, state: fixtureState(plan), stats: fixtureStats(plan), process: wrongPid }), /process pid/)
  assert.throws(() => validateGvisorRuntimeObservationCandidate(
    { ...candidate, candidateIdentity: "0".repeat(64) },
    { plan, state: fixtureState(plan), stats: fixtureStats(plan), process: fixtureProcess() },
  ), /candidateIdentity mismatch/)
})

test("protected K2 R3A R3B receipt Done Gate and dependency surfaces remain byte-identical", () => {
  const protectedBlobs: Record<string, string> = {
    "../src/execution/gateway.ts": "ecf9cc9d3eda6a2280a280ed2f9a2e472f397560",
    "../src/evidence/receipt.ts": "214403398751c9d22bf695786c7fd7c6fd7e35e1",
    "../src/verification/done-gate.ts": "067e147569fa52cc2b04c5df26fbe20a01e958e9",
    "../src/agent/loop.ts": "576ad425db7e845b9705c982e95dd4f7522f8c43",
    "../src/trust/sandbox-workload.ts": "84ee9f8ec49bd5e187d564ae4433cfe0a44f7af8",
    "../src/trust/sandbox-backend-evidence.ts": "b9242c5cecc18fd43b2b80aeffd974ef5311fded",
    "../package.json": "af4c20a3dae387c15cc5fb2eb28d415c8f115b95",
    "../scripts/run-tests.mjs": "9a0bcde0e565168c78eb7fe4d3cf08236d24baa7",
    "../THIRD_PARTY_NOTICES.md": "aaa1ce56d27f5b7dd185f9aaa257d978c2a56c76",
  }
  for (const [path, expected] of Object.entries(protectedBlobs)) assert.equal(gitBlobSha1(source(path)), expected, path)
  assert.doesNotMatch(source("../src/agent/loop.ts"), /sandbox-observer-gvisor|gvisor-proc-observe|GvisorRuntimeObservationCandidate/)
})

test("production TypeScript module is pure and excludes execution/provider authority imports", () => {
  const module = readFileSync(new URL("../src/trust/sandbox-observer-gvisor.ts", import.meta.url), "utf8")
  const imports = [...module.matchAll(/from\s+"([^"]+)"/g)].map((match) => match[1]).sort()
  assert.deepEqual(imports, ["node:crypto", "node:path", "node:util"])
  assert.doesNotMatch(module, /node:child_process|node:fs|node:net|node:http|node:https|dockerode|OpenSandbox|ExecutionGateway|createReceipt|DoneGate/)
  assert.doesNotMatch(module, /\bspawn\s*\(|\bexecFile\s*\(|\bfetch\s*\(|process\.env/)
})

linuxOnly("Linux native observer compiles and binds a live pid to inherited FD3 artifact", async () => {
  const root = mkdtempSync(join(tmpdir(), "kodac-h4-r3d-"))
  const nativePath = fileURLToPath(new URL("../native/gvisor-proc-observe.c", import.meta.url))
  const helper = join(root, "kodac-gvisor-proc-observe")
  try {
    const compile = spawnSync("cc", ["-std=c11", "-O2", "-Wall", "-Wextra", "-Werror", nativePath, "-o", helper], { encoding: "utf8", shell: false })
    assert.equal(compile.status, 0, compile.stderr)

    const selfExeFd = openSync("/proc/self/exe", "r")
    try {
      const success = spawnSync(helper, ["--pid", String(process.pid)], { encoding: "utf8", shell: false, stdio: ["ignore", "pipe", "pipe", selfExeFd] })
      assert.equal(success.status, 0, success.stderr)
      assert.equal(success.stderr, "")
      assert.match(success.stdout, new RegExp(`^kodac-gvisor-proc-v1 pid=${process.pid} start-ticks=[1-9][0-9]* exe-dev=(?:0|[1-9][0-9]*) exe-ino=[1-9][0-9]* exe-size=[1-9][0-9]*\\n$`))
      assert.equal(parseGvisorProcessObservation(success.stdout).pid, process.pid)
    } finally { closeSync(selfExeFd) }

    const wrongFd = openSync("/bin/sh", "r")
    try {
      const mismatch = spawnSync(helper, ["--pid", String(process.pid)], { encoding: "utf8", shell: false, stdio: ["ignore", "pipe", "pipe", wrongFd] })
      assert.equal(mismatch.status, KDO_H4_R3D_NATIVE_FAILURE_EXIT)
      assert.equal(mismatch.stdout, "")
      assert.match(mismatch.stderr, /^kodac-gvisor-proc:/)
    } finally { closeSync(wrongFd) }

    for (const pid of ["0", "01", "+1", "-1", "9999999999"]) {
      const bad = spawnSync(helper, ["--pid", pid], { encoding: "utf8", shell: false, stdio: ["ignore", "pipe", "pipe", "ignore"] })
      assert.equal(bad.status, KDO_H4_R3D_NATIVE_FAILURE_EXIT)
      assert.equal(bad.stdout, "")
      assert.match(bad.stderr, /^kodac-gvisor-proc:/)
    }

    const missingFd = spawnSync(helper, ["--pid", String(process.pid)], { encoding: "utf8", shell: false, stdio: ["ignore", "pipe", "pipe", "ignore"] })
    assert.equal(missingFd.status, KDO_H4_R3D_NATIVE_FAILURE_EXIT)

    const nonexistent = openSync("/proc/self/exe", "r")
    try {
      const missingPid = spawnSync(helper, ["--pid", "2147483647"], { encoding: "utf8", shell: false, stdio: ["ignore", "pipe", "pipe", nonexistent] })
      assert.equal(missingPid.status, KDO_H4_R3D_NATIVE_FAILURE_EXIT)
    } finally { closeSync(nonexistent) }

    const fixtureSource = join(root, "tricky-comm.c")
    const fixtureExe = join(root, "tricky-comm")
    writeFileSync(fixtureSource, `#define _GNU_SOURCE\n#include <sys/prctl.h>\n#include <signal.h>\n#include <unistd.h>\nint main(void){ if(prctl(PR_SET_NAME, "a ) tricky",0,0,0)!=0) return 2; for(;;) pause(); }\n`)
    const fixtureCompile = spawnSync("cc", ["-std=c11", "-O2", "-Wall", "-Wextra", "-Werror", fixtureSource, "-o", fixtureExe], { encoding: "utf8", shell: false })
    assert.equal(fixtureCompile.status, 0, fixtureCompile.stderr)
    const child = spawn(fixtureExe, [], { stdio: "ignore" })
    try {
      const childPid = child.pid
      assert.ok(childPid)
      await new Promise<void>((resolvePromise) => setTimeout(resolvePromise, 30))
      const fixtureFd = openSync(fixtureExe, "r")
      try {
        const tricky = spawnSync(helper, ["--pid", String(childPid)], { encoding: "utf8", shell: false, stdio: ["ignore", "pipe", "pipe", fixtureFd] })
        assert.equal(tricky.status, 0, tricky.stderr)
        assert.match(tricky.stdout, new RegExp(`pid=${childPid} start-ticks=[1-9][0-9]*`))
      } finally { closeSync(fixtureFd) }
    } finally { child.kill("SIGKILL") }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test("native source is read-only pidfd/process binding and contains no execution or backend authority", () => {
  const native = readFileSync(new URL("../native/gvisor-proc-observe.c", import.meta.url), "utf8")
  assert.match(native, /pidfd_open/)
  assert.match(native, /\/proc\/%ld\/exe/)
  assert.match(native, /\/proc\/%ld\/stat/)
  assert.match(native, /strrchr\(/)
  assert.match(native, /KODAC_RUNSC_ARTIFACT_FD 3/)
  assert.doesNotMatch(native, /\bkill\s*\(|\bptrace\s*\(|\bexecv?p?\s*\(|\bsocket\s*\(|\bconnect\s*\(|\bmount\s*\(|\bunshare\s*\(|setns\s*\(|docker|containerd/)
})
