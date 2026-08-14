import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"
import test from "node:test"

import {
  KDO_H4_R2B_DONOR_COMMIT,
  KDO_H4_R2B_DONOR_LICENSE_BLOB,
  KDO_H4_R2B_DONOR_NATIVE_BLOB,
  KDO_H4_R2B_DONOR_NATIVE_PATH,
  KDO_H4_R2B_DONOR_PROFILE_BLOB,
  KDO_H4_R2B_DONOR_PROFILE_PATH,
  KDO_H4_R2B_LINUX_LANDLOCK_CLAIM_SET,
  KDO_H4_R2B_LINUX_LANDLOCK_FULL_CLAIM_ABI,
  KDO_H4_R2B_LINUX_LANDLOCK_LAUNCHER_FAILURE_EXIT,
  classifyLinuxLandlockProbe,
  createLinuxLandlockBackendDescriptor,
  createLinuxLandlockLaunchPlan,
  materializeLinuxLandlockInvocation,
  validateLinuxLandlockLaunchPlan,
} from "../src/trust/confinement-linux-landlock.ts"

const source = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8")

function gitBlobSha1(text: string): string {
  const canonical = text.replace(/\r\n/g, "\n")
  const body = Buffer.from(canonical, "utf8")
  return createHash("sha1").update(`blob ${body.byteLength}\0`).update(body).digest("hex")
}

function linuxOnly(name: string, fn: () => void): void {
  test(name, { skip: process.platform !== "linux" }, fn)
}

test("H4-R2B donor provenance claim set and backend descriptor are exact", () => {
  assert.equal(KDO_H4_R2B_DONOR_COMMIT, "47f943859bef60e4160492346772ded9b24f765a")
  assert.equal(KDO_H4_R2B_DONOR_NATIVE_PATH, "native/landlock-run/packages/entry/src/main.c")
  assert.equal(KDO_H4_R2B_DONOR_NATIVE_BLOB, "af0cc2a988b219a699f35aeb911dbd66f1946fd9")
  assert.equal(KDO_H4_R2B_DONOR_PROFILE_PATH, "packages/sandbox/sandbox-local/src/profiles.ts")
  assert.equal(KDO_H4_R2B_DONOR_PROFILE_BLOB, "5b76390319c9b0729cb64f3213e714ff2df702d7")
  assert.equal(KDO_H4_R2B_DONOR_LICENSE_BLOB, "8187059c9a2f14902c3eb5ab18d207906794f3b3")
  assert.equal(KDO_H4_R2B_LINUX_LANDLOCK_CLAIM_SET, "kodac-linux-landlock-fs-v1")
  assert.equal(KDO_H4_R2B_LINUX_LANDLOCK_FULL_CLAIM_ABI, 5)
  assert.equal(KDO_H4_R2B_LINUX_LANDLOCK_LAUNCHER_FAILURE_EXIT, 125)

  const descriptor = createLinuxLandlockBackendDescriptor()
  assert.equal(descriptor.name, "linux-landlock")
  assert.equal(descriptor.platform, "linux")
  assert.deepEqual(descriptor.supportedModes, ["read-only", "workspace-write"])
})

test("launch plans are deterministic immutable validated and preserve target argv", () => {
  const input = {
    launcherPath: "/opt/kodac/landlock-run",
    mode: "workspace-write" as const,
    readOnlyRoots: ["/"],
    readWriteRoots: ["/dev/null", "/workspace"],
    targetArgv: ["/usr/bin/node", "-e", "console.log('x')", ""],
  }
  const first = createLinuxLandlockLaunchPlan(input)
  const second = createLinuxLandlockLaunchPlan(input)
  assert.equal(first.planIdentity, second.planIdentity)
  assert.equal(Object.isFrozen(first), true)
  assert.equal(Object.isFrozen(first.readOnlyRoots), true)
  assert.equal(Object.isFrozen(first.readWriteRoots), true)
  assert.equal(Object.isFrozen(first.targetArgv), true)
  assert.deepEqual(first.launcherArgv, [
    "--ro", "/",
    "--rw", "/dev/null",
    "--rw", "/workspace",
    "--",
    "/usr/bin/node", "-e", "console.log('x')", "",
  ])
  assert.deepEqual(validateLinuxLandlockLaunchPlan(JSON.parse(JSON.stringify(first))), first)

  const materialized = materializeLinuxLandlockInvocation(first)
  assert.equal(materialized.file, "/opt/kodac/landlock-run")
  assert.deepEqual(materialized.args, first.launcherArgv)
  materialized.args[0] = "mutated"
  assert.equal(first.launcherArgv[0], "--ro")

  assert.throws(() => validateLinuxLandlockLaunchPlan({ ...first, launcherArgv: ["--", "/bin/false"] }))
  assert.throws(() => validateLinuxLandlockLaunchPlan({ ...first, planIdentity: "0".repeat(64) }))
  assert.throws(() => validateLinuxLandlockLaunchPlan({ ...first, extra: true }))
})

test("materialization rejects proxy structural hooks before invoking traps", () => {
  const plan = createLinuxLandlockLaunchPlan({
    launcherPath: "/launcher",
    mode: "read-only",
    readOnlyRoots: ["/"],
    readWriteRoots: [],
    targetArgv: ["/bin/true"],
  })
  let traps = 0
  const proxied = new Proxy(plan, {
    getPrototypeOf() {
      traps += 1
      return Object.prototype
    },
    ownKeys() {
      traps += 1
      return []
    },
    get(target, property, receiver) {
      traps += 1
      return Reflect.get(target, property, receiver)
    },
  })
  assert.throws(() => materializeLinuxLandlockInvocation(proxied))
  assert.equal(traps, 0)
})

test("launch-plan authority rejects unsupported modes PATH resolution ambiguity and unsafe grants", () => {
  assert.throws(() => createLinuxLandlockLaunchPlan({
    launcherPath: "/launcher",
    mode: "danger-full-access" as never,
    readOnlyRoots: ["/"],
    readWriteRoots: [],
    targetArgv: ["/bin/true"],
  }))
  assert.throws(() => createLinuxLandlockLaunchPlan({
    launcherPath: "launcher",
    mode: "read-only",
    readOnlyRoots: ["/"],
    readWriteRoots: [],
    targetArgv: ["/bin/true"],
  }))
  assert.throws(() => createLinuxLandlockLaunchPlan({
    launcherPath: "/launcher",
    mode: "read-only",
    readOnlyRoots: ["/"],
    readWriteRoots: [],
    targetArgv: ["node"],
  }))
  assert.throws(() => createLinuxLandlockLaunchPlan({
    launcherPath: "/launcher",
    mode: "workspace-write",
    readOnlyRoots: ["/"],
    readWriteRoots: ["/z", "/a"],
    targetArgv: ["/bin/true"],
  }))
  assert.throws(() => createLinuxLandlockLaunchPlan({
    launcherPath: "/launcher",
    mode: "workspace-write",
    readOnlyRoots: ["/", "/workspace"],
    readWriteRoots: ["/workspace"],
    targetArgv: ["/bin/true"],
  }))
  assert.throws(() => createLinuxLandlockLaunchPlan({
    launcherPath: "/launcher",
    mode: "read-only",
    readOnlyRoots: ["/"],
    readWriteRoots: ["/tmp"],
    targetArgv: ["/bin/true"],
  }))
  assert.throws(() => createLinuxLandlockLaunchPlan({
    launcherPath: "/launcher",
    mode: "workspace-write",
    readOnlyRoots: ["/"],
    readWriteRoots: [],
    targetArgv: ["/bin/true"],
  }))
})

test("launch-plan inputs are bounded strict and reject structural hooks without executing them", () => {
  const tooManyRoots = Array.from({ length: 257 }, (_, index) => `/r${String(index).padStart(3, "0")}`)
  assert.throws(() => createLinuxLandlockLaunchPlan({
    launcherPath: "/launcher",
    mode: "workspace-write",
    readOnlyRoots: ["/"],
    readWriteRoots: tooManyRoots,
    targetArgv: ["/bin/true"],
  }))
  assert.throws(() => createLinuxLandlockLaunchPlan({
    launcherPath: `/${"界".repeat(1400)}`,
    mode: "read-only",
    readOnlyRoots: ["/"],
    readWriteRoots: [],
    targetArgv: ["/bin/true"],
  }))
  assert.throws(() => createLinuxLandlockLaunchPlan({
    launcherPath: "/launcher",
    mode: "read-only",
    readOnlyRoots: ["/"],
    readWriteRoots: [],
    targetArgv: ["/bin/true", "界".repeat(22000)],
  }))

  let traps = 0
  const proxied = new Proxy({
    launcherPath: "/launcher",
    mode: "read-only" as const,
    readOnlyRoots: ["/"],
    readWriteRoots: [] as string[],
    targetArgv: ["/bin/true"],
  }, {
    getPrototypeOf() {
      traps += 1
      return Object.prototype
    },
    ownKeys() {
      traps += 1
      return []
    },
  })
  assert.throws(() => createLinuxLandlockLaunchPlan(proxied))
  assert.equal(traps, 0)
})

test("probe classification is exact bounded and never upgrades partial or malformed evidence", () => {
  const full = classifyLinuxLandlockProbe({
    exitCode: 0,
    stdout: "kodac-landlock-v1 abi=9 claim-set=kodac-linux-landlock-fs-v1 enforcement=full\n",
    stderr: "",
  })
  assert.equal(full.observedAbi, 9)
  assert.equal(full.enforcement, "full")

  const partial = classifyLinuxLandlockProbe({
    exitCode: 0,
    stdout: "kodac-landlock-v1 abi=3 claim-set=kodac-linux-landlock-fs-v1 enforcement=partial\n",
    stderr: "",
  })
  assert.equal(partial.observedAbi, 3)
  assert.equal(partial.enforcement, "partial")

  assert.equal(classifyLinuxLandlockProbe({
    exitCode: 125,
    stdout: "",
    stderr: "kodac-landlock: unavailable\n",
  }).enforcement, "unavailable")
  assert.equal(classifyLinuxLandlockProbe({
    exitCode: 0,
    stdout: "kodac-landlock-v1 abi=3 claim-set=kodac-linux-landlock-fs-v1 enforcement=full\n",
    stderr: "",
  }).enforcement, "unavailable")
  assert.equal(classifyLinuxLandlockProbe({
    exitCode: 0,
    stdout: "malformed\n",
    stderr: "",
  }).enforcement, "unavailable")
  assert.equal(classifyLinuxLandlockProbe({
    exitCode: 0,
    stdout: `${"x".repeat(5000)}\n`,
    stderr: "",
  }).enforcement, "unavailable")
})

test("native source and notices preserve donor license local claim boundaries and absolute execution", () => {
  const native = source("../native/landlock-run.c")
  const notices = source("../THIRD_PARTY_NOTICES.md")
  assert.match(native, /SPDX-License-Identifier: BSD-3-Clause/)
  assert.match(native, /47f943859bef60e4160492346772ded9b24f765a/)
  assert.match(native, /af0cc2a988b219a699f35aeb911dbd66f1946fd9/)
  assert.match(native, /KODAC_FS_CLAIM_ABI 5L/)
  assert.match(native, /kodac-linux-landlock-fs-v1/)
  assert.match(native, /PR_SET_NO_NEW_PRIVS/)
  assert.match(native, /__NR_landlock_restrict_self/)
  assert.match(native, /target executable must be an absolute path/)
  assert.match(native, /execv\(/)
  assert.doesNotMatch(native, /execvp\(|LANDLOCK_ACCESS_NET|LANDLOCK_SCOPE_|seccomp|unshare\(|mount\(/)

  assert.match(notices, /DeepSeek Harness Landlock launcher adaptation/)
  assert.match(notices, /BSD 3-Clause License/)
  assert.match(notices, /Copyright \(c\) 2026, node-addon-landlock-run contributors/)
  assert.match(notices, /8187059c9a2f14902c3eb5ab18d207906794f3b3/)
})

test("TypeScript adapter remains pure and protected authority surfaces stay byte-identical", () => {
  const adapter = source("../src/trust/confinement-linux-landlock.ts")
  const importSpecifiers = [...adapter.matchAll(/from\s+"([^"]+)"/g)].map((match) => match[1]).sort()
  assert.deepEqual(importSpecifiers, ["./confinement.ts", "node:crypto", "node:path", "node:util"])
  assert.doesNotMatch(adapter, /process\.env|\bspawnSync\s*\(|\bspawn\s*\(|\bexecFile\s*\(|\bBun\.spawn\b|\bDeno\.Command\b|import\s*\(/)

  assert.equal(gitBlobSha1(source("../src/execution/gateway.ts")), "411c2ce42fa9bbf0abd24d4d2a3c8ec97e5db0be")
  assert.equal(gitBlobSha1(source("../src/trust/confinement.ts")), "873f235120645c0a12f10a5bff7e9591db6bb341")
  assert.equal(gitBlobSha1(source("../src/trust/policy.ts")), "b4134e430204123bebe053ffc9105f05fca611c9")
  assert.equal(gitBlobSha1(source("../src/trust/approval.ts")), "d36a604cb1957bc65dac3978c626ba48a9b299fb")
  assert.equal(gitBlobSha1(source("../src/evidence/receipt.ts")), "3f84753e4864b0a6df3e60baa1aad370c40a802b")
  assert.equal(gitBlobSha1(source("../src/verification/done-gate.ts")), "067e147569fa52cc2b04c5df26fbe20a01e958e9")
  assert.equal(gitBlobSha1(source("../src/agent/loop.ts")), "a5b7c2bbb2a5f7658f683e7baf45655b41b775f8")
  assert.equal(gitBlobSha1(source("../src/tools/registry.ts")), "0bdf5cfd02efda7cab0c81976c7735bc7b46081b")
  assert.equal(gitBlobSha1(source("../package.json")), "af4c20a3dae387c15cc5fb2eb28d415c8f115b95")
  assert.equal(gitBlobSha1(source("../scripts/run-tests.mjs")), "9a0bcde0e565168c78eb7fe4d3cf08236d24baa7")
})

linuxOnly("Linux native launcher compiles probes and enforces read-only/workspace-write file effects", () => {
  const root = mkdtempSync(join(tmpdir(), "kodac-h4-r2b-"))
  try {
    const nativePath = fileURLToPath(new URL("../native/landlock-run.c", import.meta.url))
    const binary = join(root, "kodac-landlock-run")
    const compile = spawnSync("cc", ["-std=c11", "-O2", "-Wall", "-Wextra", "-Werror", nativePath, "-o", binary], {
      encoding: "utf8",
      shell: false,
    })
    assert.equal(compile.status, 0, `native compile failed: ${compile.stderr}`)
    assert.equal(existsSync(binary), true)

    const relativeTarget = spawnSync(binary, [
      "--ro", "/", "--",
      "node",
      "-e",
      "process.stdout.write('TARGET_EXECUTED')",
    ], { encoding: "utf8", shell: false })
    assert.equal(relativeTarget.status, KDO_H4_R2B_LINUX_LANDLOCK_LAUNCHER_FAILURE_EXIT)
    assert.equal(relativeTarget.stdout.includes("TARGET_EXECUTED"), false)

    const probe = spawnSync(binary, ["--probe"], { encoding: "utf8", shell: false })
    assert.equal(probe.status, 0, `Landlock probe unavailable: ${probe.stderr}`)
    const classification = classifyLinuxLandlockProbe({
      exitCode: probe.status ?? 255,
      stdout: probe.stdout,
      stderr: probe.stderr,
    })
    assert.notEqual(classification.enforcement, "unavailable")
    assert.ok((classification.observedAbi ?? 0) >= 1)
    console.log(`H4_R2B_LANDLOCK_PROBE ${JSON.stringify({
      abi: classification.observedAbi,
      enforcement: classification.enforcement,
      claimSet: classification.claimSet,
    })}`)

    const allowed = join(root, "allowed")
    const denied = join(root, "denied")
    mkdirSync(allowed)
    mkdirSync(denied)

    const read = spawnSync(binary, [
      "--ro", "/", "--",
      process.execPath,
      "-e",
      "require('node:fs').readFileSync('/etc/hosts')",
    ], { encoding: "utf8", shell: false })
    assert.equal(read.status, 0, `read-only profile could not read host file: ${read.stderr}`)

    const readOnlyDeniedFile = join(denied, "read-only-denied.txt")
    const readOnlyWrite = spawnSync(binary, [
      "--ro", "/", "--",
      process.execPath,
      "-e",
      `require('node:fs').writeFileSync(${JSON.stringify(readOnlyDeniedFile)}, 'denied')`,
    ], { encoding: "utf8", shell: false })
    assert.notEqual(readOnlyWrite.status, 0)
    assert.notEqual(readOnlyWrite.status, KDO_H4_R2B_LINUX_LANDLOCK_LAUNCHER_FAILURE_EXIT)
    assert.equal(existsSync(readOnlyDeniedFile), false)

    const allowedFile = join(allowed, "allowed.txt")
    const workspaceWrite = spawnSync(binary, [
      "--ro", "/", "--rw", allowed, "--",
      process.execPath,
      "-e",
      `require('node:fs').writeFileSync(${JSON.stringify(allowedFile)}, 'allowed')`,
    ], { encoding: "utf8", shell: false })
    assert.equal(workspaceWrite.status, 0, `workspace-write grant failed: ${workspaceWrite.stderr}`)
    assert.equal(readFileSync(allowedFile, "utf8"), "allowed")

    const siblingDeniedFile = join(denied, "sibling-denied.txt")
    const siblingWrite = spawnSync(binary, [
      "--ro", "/", "--rw", allowed, "--",
      process.execPath,
      "-e",
      `require('node:fs').writeFileSync(${JSON.stringify(siblingDeniedFile)}, 'denied')`,
    ], { encoding: "utf8", shell: false })
    assert.notEqual(siblingWrite.status, 0)
    assert.notEqual(siblingWrite.status, KDO_H4_R2B_LINUX_LANDLOCK_LAUNCHER_FAILURE_EXIT)
    assert.equal(existsSync(siblingDeniedFile), false)

    const setupFailure = spawnSync(binary, [
      "--ro", "/", "--rw", join(root, "missing"), "--",
      process.execPath,
      "-e",
      "process.stdout.write('TARGET_EXECUTED')",
    ], { encoding: "utf8", shell: false })
    assert.equal(setupFailure.status, KDO_H4_R2B_LINUX_LANDLOCK_LAUNCHER_FAILURE_EXIT)
    assert.equal(setupFailure.stdout.includes("TARGET_EXECUTED"), false)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
