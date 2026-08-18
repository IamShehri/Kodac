import assert from "node:assert/strict"
import { execFile, spawn } from "node:child_process"
import { createHash } from "node:crypto"
import { chmod, mkdtemp, readFile, rm, stat } from "node:fs/promises"
import { createServer, type Socket } from "node:net"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"

import { validateGvisorTtlPhysicalArmAcknowledgement } from "../src/execution/gateway-gvisor-ttl.ts"
import {
  KDO_H4_R3G_D_ARM_EVIDENCE_CLASS,
  KDO_H4_R3G_D_ARM_RECORD_VERSION,
  KDO_H4_R3G_D_CLOCK_NAME,
  KDO_H4_R3G_D_CONTROL_PEER_VERSION,
  KDO_H4_R3G_D_TERMINAL_EVIDENCE_CLASS,
  KDO_H4_R3G_D_TERMINAL_RECORD_VERSION,
  KDO_H4_R3G_D_WATCHDOG_PROTOCOL_VERSION,
  validateGvisorTtlArmRecord,
  validateGvisorTtlTerminalRecord,
  type GvisorTtlArmRecord,
  type GvisorTtlTerminalRecord,
} from "../src/trust/sandbox-lifecycle-gvisor-ttl.ts"

const execFileAsync = promisify(execFile)
const TEST_DIR = dirname(fileURLToPath(import.meta.url))
const RUNTIME_DIR = resolve(TEST_DIR, "..")
const WATCHDOG_SOURCE = join(RUNTIME_DIR, "native", "gvisor-ttl-watchdog.c")
const CONTAINER_ID = "1".repeat(64)
const BOOT_ID = "123e4567-e89b-42d3-a456-426614174000"
const TTL_MS = 60_000
const LEASE_START_NS = "100000000000"
const ID = Object.freeze({
  execution: "2".repeat(64),
  requirement: "3".repeat(64),
  workload: "4".repeat(64),
  binding: "5".repeat(64),
  runtime: "6".repeat(64),
  watchdog: "7".repeat(64),
  runscArtifact: "8".repeat(64),
  runscSha: "9".repeat(64),
  lease: "a".repeat(64),
  registry: "b".repeat(64),
  owner: "c".repeat(64),
  claim: "d".repeat(64),
  armAck: "e".repeat(64),
})

function r3gdHash(domain: string, value: unknown): string {
  return createHash("sha256")
    .update(Buffer.from(`KODAC-H4-R3G-D\0${domain}\0V1\0`, "ascii"))
    .update(Buffer.from(JSON.stringify(value), "utf8"))
    .digest("hex")
}

function watchdogHash(domain: string, parts: readonly string[]): string {
  const digest = createHash("sha256")
  for (const value of ["KODAC-H4-R3G-D-WATCHDOG", domain, "V1", ...parts]) {
    digest.update(Buffer.from(value, "utf8"))
    digest.update(Buffer.of(0))
  }
  return digest.digest("hex")
}

function withoutRecordIdentity<T extends { readonly recordIdentity: string }>(value: T): Omit<T, "recordIdentity"> {
  const { recordIdentity: _ignored, ...base } = value
  return base
}

function syntheticArm(): GvisorTtlArmRecord {
  const armPayload = Object.freeze({
    executionAttemptIdentity: ID.execution,
    requirementIdentity: ID.requirement,
    workloadIdentity: ID.workload,
    containerBindingIdentity: ID.binding,
    containerId: CONTAINER_ID,
    runtimeInstanceIdentity: ID.runtime,
    ttlMs: TTL_MS,
    watchdogImplementationIdentity: ID.watchdog,
  })
  const canonicalArmPayloadDigest = r3gdHash("ARM_PAYLOAD", armPayload)
  const armOperationIdentity = r3gdHash("ARM_OPERATION", armPayload)
  const controlPeerBase = Object.freeze({
    version: KDO_H4_R3G_D_CONTROL_PEER_VERSION,
    runtimeInstanceIdentity: ID.runtime,
    socketDevice: "42",
    socketInode: "43",
    peerPid: 4242,
    peerUid: "1000",
    peerGid: "1000",
    processStartTicks: "123456789",
    executableDevice: "2049",
    executableInode: "987654321",
    executableSize: "12345678",
    runscArtifactIdentity: ID.runscArtifact,
    verifiedRunscSha256: ID.runscSha,
    helperProtocolVersion: KDO_H4_R3G_D_WATCHDOG_PROTOCOL_VERSION,
  })
  const controlPeer = Object.freeze({
    ...controlPeerBase,
    controlPeerBindingIdentity: r3gdHash("CONTROL_PEER", [
      controlPeerBase.runtimeInstanceIdentity,
      controlPeerBase.peerPid,
      controlPeerBase.peerUid,
      controlPeerBase.peerGid,
      controlPeerBase.socketDevice,
      controlPeerBase.socketInode,
      controlPeerBase.processStartTicks,
      controlPeerBase.executableDevice,
      controlPeerBase.executableInode,
      controlPeerBase.executableSize,
      controlPeerBase.runscArtifactIdentity,
      controlPeerBase.verifiedRunscSha256,
      controlPeerBase.helperProtocolVersion,
    ]),
  })
  const deadlineBoottimeNs = (BigInt(LEASE_START_NS) + BigInt(TTL_MS) * 1_000_000n).toString()
  const base = Object.freeze({
    version: KDO_H4_R3G_D_ARM_RECORD_VERSION,
    evidenceClass: KDO_H4_R3G_D_ARM_EVIDENCE_CLASS,
    armOperationIdentity,
    canonicalArmPayloadDigest,
    leaseIdentity: ID.lease,
    ...armPayload,
    controlPeer,
    controlPeerBindingIdentity: controlPeer.controlPeerBindingIdentity,
    runscArtifactIdentity: ID.runscArtifact,
    verifiedRunscSha256: ID.runscSha,
    watchdogRegistryRecordIdentity: ID.registry,
    clockDomainIdentity: r3gdHash("CLOCK_DOMAIN", [BOOT_ID, KDO_H4_R3G_D_CLOCK_NAME]),
    linuxBootId: BOOT_ID,
    leaseStartBoottimeNs: LEASE_START_NS,
    deadlineBoottimeNs,
    ownerInstanceIdentity: ID.owner,
    terminalFenceToken: "1",
    claimRecordIdentity: ID.claim,
    armAcknowledgementIdentity: ID.armAck,
  })
  return Object.freeze({ ...base, recordIdentity: r3gdHash("ARM_RECORD", base) })
}

function physicalControlPeerIdentity(arm: GvisorTtlArmRecord): string {
  return watchdogHash("CONTROL_PEER", [
    arm.runtimeInstanceIdentity,
    arm.containerId,
    arm.controlPeer.socketDevice,
    arm.controlPeer.socketInode,
    String(arm.controlPeer.peerPid),
    arm.controlPeer.peerUid,
    arm.controlPeer.peerGid,
    arm.controlPeer.processStartTicks,
    arm.controlPeer.executableDevice,
    arm.controlPeer.executableInode,
    arm.controlPeer.executableSize,
    arm.verifiedRunscSha256,
  ])
}

function terminalRegistryIdentity(base: Omit<GvisorTtlTerminalRecord, "registryTerminalRecordIdentity" | "recordIdentity">, arm: GvisorTtlArmRecord, controlPeerIdentity = physicalControlPeerIdentity(arm)): string {
  return watchdogHash("TERMINAL_REGISTRY", [
    base.armOperationIdentity,
    base.leaseIdentity,
    base.runtimeInstanceIdentity,
    base.terminalOutcome,
    base.ownerInstanceIdentity,
    base.terminalFenceToken,
    base.claimRecordIdentity,
    controlPeerIdentity,
    base.retainedPidfdProcessIdentity,
    base.runscArtifactIdentity,
    base.verifiedRunscSha256,
    base.retainedRunscExecutableIdentity,
    base.clockDomainIdentity,
    base.linuxBootId,
    base.exitEventObservedBoottimeNs ?? "-",
    base.liveAtExpiryObservedBoottimeNs ?? "-",
    base.liveAtExpiryProbeIdentity ?? "-",
    base.liveAtExpiryProcessSetIdentity ?? "-",
    base.signalAcknowledgementIdentity ?? "-",
    base.terminationAcknowledgementIdentity,
  ])
}

function syntheticTerminal(arm: GvisorTtlArmRecord, outcome: "natural-exit" | "ttl-expired"): GvisorTtlTerminalRecord {
  const natural = outcome === "natural-exit"
  const base = Object.freeze({
    version: KDO_H4_R3G_D_TERMINAL_RECORD_VERSION,
    evidenceClass: KDO_H4_R3G_D_TERMINAL_EVIDENCE_CLASS,
    armOperationIdentity: arm.armOperationIdentity,
    leaseIdentity: arm.leaseIdentity,
    armRecordIdentity: arm.recordIdentity,
    runtimeInstanceIdentity: arm.runtimeInstanceIdentity,
    terminalOutcome: outcome,
    ownerInstanceIdentity: arm.ownerInstanceIdentity,
    terminalFenceToken: arm.terminalFenceToken,
    claimRecordIdentity: arm.claimRecordIdentity,
    controlPeerBindingIdentity: arm.controlPeerBindingIdentity,
    socketDevice: arm.controlPeer.socketDevice,
    socketInode: arm.controlPeer.socketInode,
    peerPid: arm.controlPeer.peerPid,
    peerUid: arm.controlPeer.peerUid,
    peerGid: arm.controlPeer.peerGid,
    retainedPidfdProcessIdentity: watchdogHash("PIDFD_PROCESS", [String(arm.controlPeer.peerPid), arm.controlPeer.processStartTicks, arm.controlPeer.executableDevice, arm.controlPeer.executableInode, arm.controlPeer.executableSize, arm.runtimeInstanceIdentity]),
    runscArtifactIdentity: arm.runscArtifactIdentity,
    verifiedRunscSha256: arm.verifiedRunscSha256,
    retainedRunscExecutableIdentity: watchdogHash("RUNSC_EXECUTABLE", [arm.verifiedRunscSha256, arm.controlPeer.executableDevice, arm.controlPeer.executableInode, arm.controlPeer.executableSize, arm.runscArtifactIdentity]),
    clockDomainIdentity: arm.clockDomainIdentity,
    linuxBootId: arm.linuxBootId,
    exitEventObservedBoottimeNs: natural ? arm.leaseStartBoottimeNs : null,
    liveAtExpiryProbeIdentity: natural ? null : "1".repeat(64),
    liveAtExpiryObservedBoottimeNs: natural ? null : arm.deadlineBoottimeNs,
    liveAtExpiryProcessSetIdentity: natural ? null : "2".repeat(64),
    signalAcknowledgementIdentity: natural ? null : "3".repeat(64),
    terminationAcknowledgementIdentity: "4".repeat(64),
  })
  const registryTerminalRecordIdentity = terminalRegistryIdentity(base, arm)
  const withRegistry = Object.freeze({ ...base, registryTerminalRecordIdentity })
  return Object.freeze({ ...withRegistry, recordIdentity: r3gdHash("TERMINAL_RECORD", withRegistry) })
}

function rebuildTerminal(value: GvisorTtlTerminalRecord, arm: GvisorTtlArmRecord): GvisorTtlTerminalRecord {
  const { registryTerminalRecordIdentity: _registry, recordIdentity: _record, ...base } = value
  const registryTerminalRecordIdentity = terminalRegistryIdentity(base, arm)
  const withRegistry = Object.freeze({ ...base, registryTerminalRecordIdentity })
  return Object.freeze({ ...withRegistry, recordIdentity: r3gdHash("TERMINAL_RECORD", withRegistry) })
}

test("H4-R3G-D standalone arm validator rederives semantic arm identities", () => {
  const arm = syntheticArm()
  assert.deepEqual(validateGvisorTtlArmRecord(arm), arm)

  for (const forgedValue of [
    { ...arm, canonicalArmPayloadDigest: "f".repeat(64) },
    { ...arm, armOperationIdentity: "f".repeat(64) },
    { ...arm, executionAttemptIdentity: "f".repeat(64) },
  ]) {
    const forgedBase = withoutRecordIdentity(forgedValue)
    const forged = { ...forgedBase, recordIdentity: r3gdHash("ARM_RECORD", forgedBase) }
    assert.throws(() => validateGvisorTtlArmRecord(forged), /semantic arm identity/)
  }
})

test("H4-R3G-D terminal validator requires authoritative arm and rederives physical terminal identities", () => {
  const arm = syntheticArm()
  const natural = syntheticTerminal(arm, "natural-exit")
  const expired = syntheticTerminal(arm, "ttl-expired")
  assert.deepEqual(validateGvisorTtlTerminalRecord(natural, arm), natural)
  assert.deepEqual(validateGvisorTtlTerminalRecord(expired, arm), expired)
  assert.throws(() => validateGvisorTtlTerminalRecord(natural), /authoritative arm record/)

  const forgedPidfd = rebuildTerminal({ ...natural, retainedPidfdProcessIdentity: "5".repeat(64) }, arm)
  assert.throws(() => validateGvisorTtlTerminalRecord(forgedPidfd, arm), /retained pidfd process identity/)

  const forgedRunsc = rebuildTerminal({ ...natural, retainedRunscExecutableIdentity: "6".repeat(64) }, arm)
  assert.throws(() => validateGvisorTtlTerminalRecord(forgedRunsc, arm), /retained runsc executable identity/)

  const forgedRegistryBase = { ...withoutRecordIdentity(natural), registryTerminalRecordIdentity: "7".repeat(64) }
  const forgedRegistry = { ...forgedRegistryBase, recordIdentity: r3gdHash("TERMINAL_RECORD", forgedRegistryBase) }
  assert.throws(() => validateGvisorTtlTerminalRecord(forgedRegistry, arm), /terminal registry identity/)

  assert.notEqual(physicalControlPeerIdentity(arm), arm.controlPeerBindingIdentity, "native physical control-peer identity must remain distinct from the logical arm peer identity")
  const { registryTerminalRecordIdentity: _registry, recordIdentity: _record, ...terminalBase } = natural
  const wrongLogicalRegistry = terminalRegistryIdentity(terminalBase, arm, arm.controlPeerBindingIdentity)
  const wrongLogicalBase = { ...terminalBase, registryTerminalRecordIdentity: wrongLogicalRegistry }
  const wrongLogical = { ...wrongLogicalBase, recordIdentity: r3gdHash("TERMINAL_RECORD", wrongLogicalBase) }
  assert.throws(() => validateGvisorTtlTerminalRecord(wrongLogical, arm), /terminal registry identity/)
})

function parseStartTicks(statText: string): bigint {
  const close = statText.lastIndexOf(")")
  assert.ok(close > 0)
  const fields = statText.slice(close + 2).trim().split(/\s+/)
  assert.ok(fields.length >= 20)
  return BigInt(fields[19])
}
async function sha256File(path: string): Promise<string> { return createHash("sha256").update(await readFile(path)).digest("hex") }
function runChild(executable: string, args: string[]): Promise<{ code: number | null; signal: NodeJS.Signals | null; stdout: string; stderr: string }> {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(executable, args, { stdio: ["ignore", "pipe", "pipe"] })
    let stdout = ""; let stderr = ""
    child.stdout.setEncoding("utf8"); child.stderr.setEncoding("utf8")
    child.stdout.on("data", (chunk: string) => { stdout += chunk })
    child.stderr.on("data", (chunk: string) => { stderr += chunk })
    child.once("error", rejectPromise)
    child.once("exit", (code, signal) => resolvePromise({ code, signal, stdout, stderr }))
  })
}
async function closeServer(server: ReturnType<typeof createServer>): Promise<void> {
  await new Promise<void>((resolvePromise, rejectPromise) => server.close((error) => error ? rejectPromise(error) : resolvePromise()))
}

async function nativeFixture(root: string, binary: string, socketPath: string) {
  await execFileAsync("cc", ["-std=c11", "-O2", "-Wall", "-Wextra", "-Werror", WATCHDOG_SOURCE, "-o", binary])
  const socketStat = await stat(socketPath, { bigint: true })
  const exeStat = await stat("/proc/self/exe", { bigint: true })
  const startTicks = parseStartTicks(await readFile("/proc/self/stat", "utf8"))
  const runscSha256 = await sha256File("/proc/self/exe")
  const expectedLinuxBootId = (await readFile("/proc/sys/kernel/random/boot_id", "utf8")).trim()
  const getuid = process.getuid; const getgid = process.getgid
  assert.equal(typeof getuid, "function"); assert.equal(typeof getgid, "function")
  if (typeof getuid !== "function" || typeof getgid !== "function") throw new Error("Linux uid/gid primitives unavailable")
  const uid = getuid(); const gid = getgid()
  const physical = Object.freeze({
    armOperationIdentity: "2".repeat(64), canonicalArmPayloadDigest: "3".repeat(64), executionAttemptIdentity: "4".repeat(64), requirementIdentity: "5".repeat(64), workloadIdentity: "6".repeat(64), containerBindingIdentity: "7".repeat(64), containerId: CONTAINER_ID, runtimeInstanceIdentity: "8".repeat(64), ttlMs: 1_000, watchdogImplementationIdentity: "9".repeat(64), socketDevice: String(socketStat.dev), socketInode: String(socketStat.ino), peerPid: process.pid, peerUid: String(uid), peerGid: String(gid), processStartTicks: String(startTicks), executableDevice: String(exeStat.dev), executableInode: String(exeStat.ino), executableSize: String(exeStat.size), runscArtifactIdentity: "a".repeat(64), verifiedRunscSha256: runscSha256, expectedLinuxBootId,
  })
  const args = [
    "--arm", "--registry-root", root, "--arm-operation", physical.armOperationIdentity, "--arm-payload-digest", physical.canonicalArmPayloadDigest,
    "--execution-attempt", physical.executionAttemptIdentity, "--requirement", physical.requirementIdentity, "--workload", physical.workloadIdentity,
    "--container-binding", physical.containerBindingIdentity, "--container-id", physical.containerId, "--runtime-instance", physical.runtimeInstanceIdentity,
    "--ttl-ms", String(physical.ttlMs), "--watchdog-implementation", physical.watchdogImplementationIdentity, "--control-socket", socketPath,
    "--socket-device-inode", `${physical.socketDevice}:${physical.socketInode}`, "--peer-pid-uid-gid", `${physical.peerPid}:${physical.peerUid}:${physical.peerGid}`,
    "--process-tuple", `${physical.processStartTicks}:${physical.executableDevice}:${physical.executableInode}:${physical.executableSize}`,
    "--runsc-artifact", physical.runscArtifactIdentity, "--runsc-sha256", physical.verifiedRunscSha256,
  ]
  return { args, physical }
}

test("H4-R3G-D compiled watchdog stdout arm acknowledgement is independently verified by TypeScript", { skip: process.platform !== "linux", timeout: 20_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "kodac-r3gd-cross-language-")); await chmod(root, 0o700)
  const binary = join(root, "watchdog"); const socketPath = join(root, "control.sock")
  const sockets = new Set<Socket>(); let waitSocket: Socket | undefined
  const server = createServer((socket) => {
    sockets.add(socket); socket.once("close", () => sockets.delete(socket))
    let buffered = ""; socket.setEncoding("utf8")
    socket.on("data", (chunk: string) => {
      buffered += chunk
      let request: { method?: unknown; arg?: unknown }
      try { request = JSON.parse(buffered) as { method?: unknown; arg?: unknown } } catch { return }
      buffered = ""
      if (request.method === "containerManager.Wait") { waitSocket = socket; return }
      if (request.method === "containerManager.Processes") { socket.write(JSON.stringify({ success: true, err: "", result: [{ pid: 1 }] })); return }
      if (request.method === "containerManager.Signal") {
        socket.write(JSON.stringify({ success: true, err: "", result: null }))
        setTimeout(() => waitSocket?.write(JSON.stringify({ success: true, err: "", result: 0 })), 5)
      }
    })
  })
  try {
    await new Promise<void>((resolvePromise, rejectPromise) => { server.once("error", rejectPromise); server.listen(socketPath, () => { server.off("error", rejectPromise); resolvePromise() }) })
    const { args, physical } = await nativeFixture(root, binary, socketPath)
    const result = await runChild(binary, args)
    assert.equal(result.signal, null); assert.equal(result.code, 0, result.stderr)
    const armLine = result.stdout.trim().split("\n")[0]
    const acknowledgement = validateGvisorTtlPhysicalArmAcknowledgement(armLine, physical)
    assert.equal(acknowledgement.armOperationIdentity, physical.armOperationIdentity)
    assert.equal(acknowledgement.runtimeInstanceIdentity, physical.runtimeInstanceIdentity)
    assert.throws(() => validateGvisorTtlPhysicalArmAcknowledgement(armLine, { ...physical, expectedLinuxBootId: "00000000-0000-4000-8000-000000000000" }), /Linux boot identity mismatch/)
  } finally {
    for (const socket of sockets) socket.destroy()
    if (server.listening) await closeServer(server).catch(() => {})
    await rm(root, { recursive: true, force: true })
  }
})

test("H4-R3G-D partial pre-deadline Wait response cannot stall expiry enforcement", { skip: process.platform !== "linux", timeout: 20_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "kodac-r3gd-wait-stall-")); await chmod(root, 0o700)
  const binary = join(root, "watchdog"); const socketPath = join(root, "control.sock")
  const sockets = new Set<Socket>(); const methods: string[] = []; let waitSocket: Socket | undefined
  const server = createServer((socket) => {
    sockets.add(socket); socket.once("close", () => sockets.delete(socket))
    let buffered = ""; socket.setEncoding("utf8")
    socket.on("data", (chunk: string) => {
      buffered += chunk
      let request: { method?: unknown }
      try { request = JSON.parse(buffered) as { method?: unknown } } catch { return }
      buffered = ""
      if (typeof request.method !== "string") return
      methods.push(request.method)
      if (request.method === "containerManager.Wait") { waitSocket = socket; socket.write("{"); return }
      if (request.method === "containerManager.Processes") { socket.write(JSON.stringify({ success: true, err: "", result: [{ pid: 1 }] })); return }
      if (request.method === "containerManager.Signal") {
        socket.write(JSON.stringify({ success: true, err: "", result: null }))
        setTimeout(() => waitSocket?.write(JSON.stringify({ success: true, err: "", result: 0 })), 5)
      }
    })
  })
  try {
    await new Promise<void>((resolvePromise, rejectPromise) => { server.once("error", rejectPromise); server.listen(socketPath, () => { server.off("error", rejectPromise); resolvePromise() }) })
    const { args } = await nativeFixture(root, binary, socketPath)
    const result = await runChild(binary, args)
    assert.equal(result.signal, null); assert.equal(result.code, 0, result.stderr)
    assert.match(result.stdout, / outcome=ttl-expired /)
    assert.deepEqual(methods, ["containerManager.Wait", "containerManager.Processes", "containerManager.Signal"])
  } finally {
    for (const socket of sockets) socket.destroy()
    if (server.listening) await closeServer(server).catch(() => {})
    await rm(root, { recursive: true, force: true })
  }
})

test("H4-R3G-D failed retained Wait dispatch emits no positive physical arm acknowledgement", { skip: process.platform !== "linux", timeout: 20_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "kodac-r3gd-wait-fail-")); await chmod(root, 0o700)
  const binary = join(root, "watchdog"); const socketPath = join(root, "control.sock")
  const sockets = new Set<Socket>(); let accepted = 0
  const server = createServer((socket) => {
    accepted += 1
    sockets.add(socket); socket.once("close", () => sockets.delete(socket)); socket.on("error", () => {})
    if (accepted === 1) socket.destroy()
  })
  try {
    await new Promise<void>((resolvePromise, rejectPromise) => { server.once("error", rejectPromise); server.listen(socketPath, () => { server.off("error", rejectPromise); resolvePromise() }) })
    const { args } = await nativeFixture(root, binary, socketPath)
    const result = await runChild(binary, args)
    assert.equal(result.signal, null)
    assert.ok(result.code === 125 || result.code === 126, result.stderr)
    assert.equal(result.stdout, "", "positive arm acknowledgement must not be emitted when retained Wait dispatch fails")
    if (result.code === 126) assert.match(result.stderr, /retained Wait request failed before positive arm acknowledgement/)
  } finally {
    for (const socket of sockets) socket.destroy()
    if (server.listening) await closeServer(server).catch(() => {})
    await rm(root, { recursive: true, force: true })
  }
})