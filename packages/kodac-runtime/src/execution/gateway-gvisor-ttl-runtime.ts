import { spawn, type ChildProcess } from "node:child_process"
import { constants } from "node:fs"
import { open, readFile, type FileHandle } from "node:fs/promises"
import { createHash } from "node:crypto"
import type { Readable } from "node:stream"

import type { WorkspaceFileSystem } from "../edit/filesystem.ts"
import { createReceipt, type ExecutionReceipt } from "../evidence/receipt.ts"
import { ExecutionBlockedError, ExecutionFailedError, ExecutionGateway, ExecutionUnprovenError, type ExecutionObserver } from "./gateway.ts"
import {
  createGvisorTtlPhysicalArmAcknowledgementIdentity,
  createGvisorTtlPhysicalClaimRecordIdentity,
  createGvisorTtlPhysicalClockDomainIdentity,
  createGvisorTtlPhysicalControlPeerIdentity,
  createGvisorTtlPhysicalLeaseIdentity,
  createGvisorTtlPhysicalRegistryRecordIdentity,
  createGvisorTtlWatchdogProtocolIdentity,
  validateGvisorTtlPhysicalArmAcknowledgement,
  type GvisorTtlPhysicalArmAcknowledgement,
  type GvisorTtlPhysicalArmExpectation,
} from "./gateway-gvisor-ttl.ts"
import { validateSandboxExecutionRequirement, type SandboxExecutionRequirement } from "../trust/sandbox-backend-evidence.ts"
import {
  KDO_H4_R3G_D_ARM_ACK_VERSION,
  KDO_H4_R3G_D_CAPABILITY,
  KDO_H4_R3G_D_LIMITS,
  KDO_H4_R3G_D_TERMINAL_EVIDENCE_CLASS,
  KDO_H4_R3G_D_TERMINAL_RECORD_VERSION,
  createGvisorTtlArmRecord,
  createGvisorTtlControlPeerBinding,
  createGvisorTtlEvidenceCommit,
  createGvisorTtlPreparedIntent,
  createGvisorTtlWatchdogImplementationIdentity,
  createGvisorTtlWatchdogLeaseRecord,
  payloadDigest,
  validateGvisorTtlArmAcknowledgement,
  validateGvisorTtlArmRecord,
  validateGvisorTtlEvidenceCommit,
  validateGvisorTtlRuntimeConfig,
  validateGvisorTtlSubjectBinding,
  validateGvisorTtlTerminalRecord,
  type GvisorTtlArmAcknowledgement,
  type GvisorTtlArmRecord,
  type GvisorTtlPreparedIntent,
  type GvisorTtlRuntimeConfig,
  type GvisorTtlSubjectBinding,
  type GvisorTtlTerminalRecord,
  type GvisorTtlWatchdogLeaseRecord,
} from "../trust/sandbox-lifecycle-gvisor-ttl.ts"
import type { PolicyEngine, PolicyResult, ExecutionIntent } from "../trust/policy.ts"

const WATCHDOG_TERMINAL_LINE_VERSION = "kodac-gvisor-ttl-terminal-v1" as const
const BOOT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const SHA256 = /^[0-9a-f]{64}$/
const UINT = /^(?:0|[1-9][0-9]*)$/
const MAX_UINT64 = 18_446_744_073_709_551_615n
const WATCHDOG_CHILD_FD = 3
// Must match native KODAC_TERMINATION_ACK_TIMEOUT_MS; a regression test locks this parity.
const WATCHDOG_TERMINATION_ACK_TIMEOUT_MS = 30_000
const WATCHDOG_POST_TERMINAL_EXIT_TIMEOUT_MS = 5_000

export interface GvisorTtlExecutionGatewayConfig {
  readonly filesystem: WorkspaceFileSystem
  readonly policy: PolicyEngine
  readonly ttlRuntime: GvisorTtlRuntimeConfig
}

export interface GvisorTtlEnforcementResult {
  readonly arm: GvisorTtlArmRecord
  readonly terminal: GvisorTtlTerminalRecord
}

export interface GvisorTtlPhysicalTerminalAcknowledgement {
  readonly version: typeof WATCHDOG_TERMINAL_LINE_VERSION
  readonly leaseIdentity: string
  readonly armOperationIdentity: string
  readonly runtimeInstanceIdentity: string
  readonly terminalOutcome: "natural-exit" | "ttl-expired"
  readonly ownerInstanceIdentity: string
  readonly terminalFenceToken: string
  readonly claimRecordIdentity: string
  readonly controlPeerBindingIdentity: string
  readonly socketDevice: string
  readonly socketInode: string
  readonly peerPid: number
  readonly peerUid: string
  readonly peerGid: string
  readonly retainedPidfdProcessIdentity: string
  readonly runscArtifactIdentity: string
  readonly verifiedRunscSha256: string
  readonly retainedRunscExecutableIdentity: string
  readonly clockDomainIdentity: string
  readonly linuxBootId: string
  readonly exitEventObservedBoottimeNs: string | null
  readonly liveAtExpiryObservedBoottimeNs: string | null
  readonly liveAtExpiryProbeIdentity: string | null
  readonly liveAtExpiryProcessSetIdentity: string | null
  readonly signalAcknowledgementIdentity: string | null
  readonly terminationAcknowledgementIdentity: string
  readonly registryTerminalRecordIdentity: string
}

interface TrustedWatchdogArtifact {
  readonly handle: FileHandle
  readonly sha256: string
  readonly sizeBytes: number
  readonly implementationIdentity: string
  readonly stat: Awaited<ReturnType<FileHandle["stat"]>>
}

interface ChildExit { readonly code: number | null; readonly signal: NodeJS.Signals | null }
interface DrainedText { readonly text: string; readonly overflow: boolean }

function logicalHash(domain: string, value: unknown): string {
  if (!/^[A-Z0-9_]+$/.test(domain)) throw new TypeError("R3G-D logical adapter hash domain must be canonical uppercase ASCII")
  return createHash("sha256")
    .update(Buffer.from(`KODAC-H4-R3G-D\0${domain}\0V1\0`, "ascii"))
    .update(Buffer.from(JSON.stringify(value), "utf8"))
    .digest("hex")
}
function textSha256(value: string): string { return createHash("sha256").update(value, "utf8").digest("hex") }
function immutableIntent(intent: ExecutionIntent): ExecutionIntent { return Object.freeze({ capability: intent.capability, paths: Object.freeze([...intent.paths]) as unknown as string[], inputDigest: intent.inputDigest }) }
function immutablePolicy(value: PolicyResult): PolicyResult {
  if (value.decision !== "allow" && value.decision !== "ask" && value.decision !== "deny") throw new TypeError("policy decision is invalid")
  if (typeof value.reason !== "string") throw new TypeError("policy reason must be a string")
  return Object.freeze({ decision: value.decision, reason: value.reason })
}
function canonicalSha(value: unknown, label: string): string {
  if (typeof value !== "string" || !SHA256.test(value)) throw new TypeError(`${label} must be a lowercase SHA-256 identity`)
  return value
}
function canonicalUint(value: unknown, label: string, allowZero = true): string {
  if (typeof value !== "string" || !UINT.test(value)) throw new TypeError(`${label} must be canonical unsigned decimal`)
  const parsed = BigInt(value)
  if ((!allowZero && parsed === 0n) || parsed > MAX_UINT64) throw new TypeError(`${label} is outside uint64 range`)
  return value
}
function canonicalPid(value: unknown): number {
  if (typeof value !== "string" || !UINT.test(value)) throw new TypeError("peer-pid must be canonical unsigned decimal")
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed <= 0 || parsed > 2_147_483_647) throw new TypeError("peer-pid must be a positive Linux pid")
  return parsed
}
function canonicalBootId(value: string): string {
  if (!BOOT_ID.test(value)) throw new TypeError("Linux boot id must be canonical lowercase UUID text")
  return value
}
function nullableIdentity(value: string, label: string): string | null { return value === "-" ? null : canonicalSha(value, label) }
function nullableUint(value: string, label: string): string | null { return value === "-" ? null : canonicalUint(value, label) }
function watchdogNullable(value: string | null): string { return value === null ? "-" : value }

function sameStat(left: Awaited<ReturnType<FileHandle["stat"]>>, right: Awaited<ReturnType<FileHandle["stat"]>>): boolean {
  return left.dev === right.dev && left.ino === right.ino && left.size === right.size && left.mode === right.mode && left.uid === right.uid && left.gid === right.gid && left.nlink === right.nlink && left.mtimeMs === right.mtimeMs && left.ctimeMs === right.ctimeMs
}
async function hashFileHandle(handle: FileHandle, sizeBytes: number): Promise<string> {
  const digest = createHash("sha256"); const buffer = Buffer.allocUnsafe(Math.min(64 * 1024, sizeBytes)); let offset = 0
  while (offset < sizeBytes) {
    const wanted = Math.min(buffer.byteLength, sizeBytes - offset)
    const { bytesRead } = await handle.read(buffer, 0, wanted, offset)
    if (bytesRead <= 0) throw new Error("R3G-D watchdog changed while its retained descriptor was hashed")
    digest.update(buffer.subarray(0, bytesRead)); offset += bytesRead
  }
  return digest.digest("hex")
}
async function observeTrustedWatchdog(runtime: GvisorTtlRuntimeConfig): Promise<TrustedWatchdogArtifact> {
  const handle = await open(runtime.watchdogPath, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const before = await handle.stat()
    if (!before.isFile()) throw new Error("R3G-D watchdog must be a regular non-symlink file")
    if (!Number.isSafeInteger(before.size) || before.size <= 0 || before.size > KDO_H4_R3G_D_LIMITS.maxWatchdogBytes) throw new Error("R3G-D watchdog size is outside the authorized bound")
    const observedSha256 = await hashFileHandle(handle, before.size); const after = await handle.stat()
    if (!sameStat(before, after)) throw new Error("R3G-D watchdog metadata changed during same-FD verification")
    if (observedSha256 !== runtime.expectedWatchdogSha256) throw new Error("R3G-D watchdog SHA-256 does not match trusted runtime identity")
    return Object.freeze({ handle, sha256: observedSha256, sizeBytes: before.size, implementationIdentity: createGvisorTtlWatchdogImplementationIdentity({ watchdogSha256: observedSha256, watchdogSizeBytes: before.size }), stat: before })
  } catch (error) { await handle.close().catch(() => {}); throw error }
}
async function reverifyTrustedWatchdog(value: TrustedWatchdogArtifact): Promise<void> {
  const before = await value.handle.stat(); if (!sameStat(value.stat, before)) throw new Error("R3G-D watchdog descriptor metadata changed before execution")
  const digest = await hashFileHandle(value.handle, value.sizeBytes); const after = await value.handle.stat()
  if (!sameStat(value.stat, after) || digest !== value.sha256) throw new Error("R3G-D watchdog descriptor bytes changed before execution")
}

async function persistReceipt(observer: ExecutionObserver | undefined, receipt: ExecutionReceipt): Promise<void> {
  try { await observer?.onReceipt?.(receipt) } catch (error) { throw new ExecutionUnprovenError("Execution evidence could not be persisted.", receipt, { cause: error }) }
}
async function boundedTrusted<T>(label: string, timeoutMs: number, operation: () => Promise<T> | T): Promise<T> {
  let timer: NodeJS.Timeout | undefined
  try {
    return await Promise.race([
      Promise.resolve().then(operation),
      new Promise<never>((_, rejectPromise) => { timer = setTimeout(() => rejectPromise(new Error(`${label} timed out`)), timeoutMs) }),
    ])
  } finally { if (timer !== undefined) clearTimeout(timer) }
}
async function commitExact(label: string, runtimeCommit: () => Promise<unknown> | unknown, expected: { kind: "prepared" | "arm" | "terminal"; armOperationIdentity: string; leaseIdentity: string | null; recordIdentity: string; payloadDigest: string }): Promise<void> {
  const raw = await boundedTrusted(label, KDO_H4_R3G_D_LIMITS.evidenceCommitTimeoutMs, runtimeCommit)
  validateGvisorTtlEvidenceCommit(raw, expected)
}

function createPhysicalExpectation(prepared: GvisorTtlPreparedIntent, subject: GvisorTtlSubjectBinding, linuxBootId: string): GvisorTtlPhysicalArmExpectation {
  return Object.freeze({
    armOperationIdentity: prepared.armOperationIdentity,
    canonicalArmPayloadDigest: prepared.canonicalArmPayloadDigest,
    executionAttemptIdentity: prepared.executionAttemptIdentity,
    requirementIdentity: prepared.requirementIdentity,
    workloadIdentity: prepared.workloadIdentity,
    containerBindingIdentity: prepared.containerBindingIdentity,
    containerId: prepared.containerId,
    runtimeInstanceIdentity: prepared.runtimeInstanceIdentity,
    ttlMs: prepared.ttlMs,
    watchdogImplementationIdentity: prepared.watchdogImplementationIdentity,
    socketDevice: subject.controlEndpoint.device,
    socketInode: subject.controlEndpoint.inode,
    peerPid: subject.process.pid,
    peerUid: subject.expectedPeerUid,
    peerGid: subject.expectedPeerGid,
    processStartTicks: subject.process.startTicks,
    executableDevice: subject.process.exeDev,
    executableInode: subject.process.exeIno,
    executableSize: subject.process.exeSize,
    runscArtifactIdentity: subject.runscArtifact.artifactIdentity,
    verifiedRunscSha256: subject.runscArtifact.sha256,
    expectedLinuxBootId: canonicalBootId(linuxBootId),
  })
}

function adaptGvisorTtlPhysicalArmAcknowledgement(input: { prepared: GvisorTtlPreparedIntent; subject: GvisorTtlSubjectBinding; physical: GvisorTtlPhysicalArmAcknowledgement }): { lease: GvisorTtlWatchdogLeaseRecord; acknowledgement: GvisorTtlArmAcknowledgement; arm: GvisorTtlArmRecord } {
  const prepared = input.prepared
  const subject = validateGvisorTtlSubjectBinding(input.subject)
  const physical = input.physical
  const lease = createGvisorTtlWatchdogLeaseRecord({ prepared, linuxBootId: physical.linuxBootId, leaseStartBoottimeNs: physical.leaseStartBoottimeNs })
  const controlPeer = createGvisorTtlControlPeerBinding({ subject, socketDevice: subject.controlEndpoint.device, socketInode: subject.controlEndpoint.inode, peerPid: subject.process.pid, peerUid: subject.expectedPeerUid, peerGid: subject.expectedPeerGid, processStartTicks: subject.process.startTicks, executableDevice: subject.process.exeDev, executableInode: subject.process.exeIno, executableSize: subject.process.exeSize, verifiedRunscSha256: subject.runscArtifact.sha256 })
  const base = Object.freeze({
    version: KDO_H4_R3G_D_ARM_ACK_VERSION,
    leaseIdentity: lease.leaseIdentity,
    armOperationIdentity: prepared.armOperationIdentity,
    runtimeInstanceIdentity: prepared.runtimeInstanceIdentity,
    controlPeer,
    controlPeerBindingIdentity: controlPeer.controlPeerBindingIdentity,
    runscArtifactIdentity: subject.runscArtifact.artifactIdentity,
    verifiedRunscSha256: subject.runscArtifact.sha256,
    watchdogRegistryRecordIdentity: lease.registryRecordIdentity,
    clockDomainIdentity: lease.clockDomainIdentity,
    linuxBootId: lease.linuxBootId,
    leaseStartBoottimeNs: lease.leaseStartBoottimeNs,
    deadlineBoottimeNs: lease.deadlineBoottimeNs,
    ownerInstanceIdentity: physical.ownerInstanceIdentity,
    terminalFenceToken: physical.terminalFenceToken,
    claimRecordIdentity: physical.claimRecordIdentity,
  })
  const acknowledgement = validateGvisorTtlArmAcknowledgement(Object.freeze({ ...base, armAcknowledgementIdentity: logicalHash("ARM_ACK", base) }), prepared, subject, lease)
  const arm = createGvisorTtlArmRecord({ prepared, lease, acknowledgement, subject })
  return Object.freeze({ lease, acknowledgement, arm })
}

function parseTerminalLine(line: string): GvisorTtlPhysicalTerminalAcknowledgement {
  if (typeof line !== "string" || line.length === 0 || Buffer.byteLength(line, "utf8") > KDO_H4_R3G_D_LIMITS.maxTerminalBytes || line.includes("\0") || line.includes("\n") || line.includes("\r")) throw new TypeError("physical terminal acknowledgement must be one bounded line")
  const expectedKeys = ["lease", "arm-operation", "runtime-instance", "outcome", "owner-instance", "terminal-fence-token", "claim-record", "control-peer", "socket-device", "socket-inode", "peer-pid", "peer-uid", "peer-gid", "retained-pidfd-process", "runsc-artifact", "verified-runsc-sha256", "retained-runsc-executable", "clock-domain", "boot-id", "exit-event-boottime-ns", "live-at-expiry-boottime-ns", "live-probe", "process-set", "signal-ack", "termination-ack", "registry-terminal"] as const
  const tokens = line.split(" ")
  if (tokens.length !== expectedKeys.length + 1 || tokens[0] !== WATCHDOG_TERMINAL_LINE_VERSION) throw new TypeError("physical terminal acknowledgement grammar mismatch")
  const values = new Map<string, string>()
  for (let index = 0; index < expectedKeys.length; index += 1) {
    const token = tokens[index + 1]; const split = token.indexOf("=")
    if (split <= 0 || token.indexOf("=", split + 1) !== -1) throw new TypeError("physical terminal acknowledgement field grammar mismatch")
    const key = token.slice(0, split); const value = token.slice(split + 1)
    if (key !== expectedKeys[index] || value.length === 0) throw new TypeError("physical terminal acknowledgement field order/name mismatch")
    values.set(key, value)
  }
  const outcome = values.get("outcome")
  if (outcome !== "natural-exit" && outcome !== "ttl-expired") throw new TypeError("physical terminal outcome must be natural-exit or ttl-expired")
  return Object.freeze({
    version: WATCHDOG_TERMINAL_LINE_VERSION,
    leaseIdentity: canonicalSha(values.get("lease"), "physical terminal leaseIdentity"),
    armOperationIdentity: canonicalSha(values.get("arm-operation"), "physical terminal armOperationIdentity"),
    runtimeInstanceIdentity: canonicalSha(values.get("runtime-instance"), "physical terminal runtimeInstanceIdentity"),
    terminalOutcome: outcome,
    ownerInstanceIdentity: canonicalSha(values.get("owner-instance"), "physical terminal ownerInstanceIdentity"),
    terminalFenceToken: canonicalUint(values.get("terminal-fence-token"), "physical terminal fence token", false),
    claimRecordIdentity: canonicalSha(values.get("claim-record"), "physical terminal claimRecordIdentity"),
    controlPeerBindingIdentity: canonicalSha(values.get("control-peer"), "physical terminal controlPeerBindingIdentity"),
    socketDevice: canonicalUint(values.get("socket-device"), "physical terminal socketDevice", false),
    socketInode: canonicalUint(values.get("socket-inode"), "physical terminal socketInode", false),
    peerPid: canonicalPid(values.get("peer-pid")),
    peerUid: canonicalUint(values.get("peer-uid"), "physical terminal peerUid"),
    peerGid: canonicalUint(values.get("peer-gid"), "physical terminal peerGid"),
    retainedPidfdProcessIdentity: canonicalSha(values.get("retained-pidfd-process"), "physical terminal retainedPidfdProcessIdentity"),
    runscArtifactIdentity: canonicalSha(values.get("runsc-artifact"), "physical terminal runscArtifactIdentity"),
    verifiedRunscSha256: canonicalSha(values.get("verified-runsc-sha256"), "physical terminal verifiedRunscSha256"),
    retainedRunscExecutableIdentity: canonicalSha(values.get("retained-runsc-executable"), "physical terminal retainedRunscExecutableIdentity"),
    clockDomainIdentity: canonicalSha(values.get("clock-domain"), "physical terminal clockDomainIdentity"),
    linuxBootId: canonicalBootId(values.get("boot-id") ?? ""),
    exitEventObservedBoottimeNs: nullableUint(values.get("exit-event-boottime-ns") ?? "", "physical terminal exitEventObservedBoottimeNs"),
    liveAtExpiryObservedBoottimeNs: nullableUint(values.get("live-at-expiry-boottime-ns") ?? "", "physical terminal liveAtExpiryObservedBoottimeNs"),
    liveAtExpiryProbeIdentity: nullableIdentity(values.get("live-probe") ?? "", "physical terminal liveAtExpiryProbeIdentity"),
    liveAtExpiryProcessSetIdentity: nullableIdentity(values.get("process-set") ?? "", "physical terminal liveAtExpiryProcessSetIdentity"),
    signalAcknowledgementIdentity: nullableIdentity(values.get("signal-ack") ?? "", "physical terminal signalAcknowledgementIdentity"),
    terminationAcknowledgementIdentity: canonicalSha(values.get("termination-ack"), "physical terminal terminationAcknowledgementIdentity"),
    registryTerminalRecordIdentity: canonicalSha(values.get("registry-terminal"), "physical terminal registryTerminalRecordIdentity"),
  })
}

function validatePhysicalArmObject(physicalArm: GvisorTtlPhysicalArmAcknowledgement, expectation: GvisorTtlPhysicalArmExpectation): GvisorTtlPhysicalArmAcknowledgement {
  if (physicalArm.armOperationIdentity !== expectation.armOperationIdentity || physicalArm.runtimeInstanceIdentity !== expectation.runtimeInstanceIdentity || physicalArm.runscArtifactIdentity !== expectation.runscArtifactIdentity || physicalArm.verifiedRunscSha256 !== expectation.verifiedRunscSha256) throw new TypeError("physical arm object subject/artifact identity mismatch")
  if (physicalArm.linuxBootId !== expectation.expectedLinuxBootId) throw new TypeError("physical arm object Linux boot identity mismatch")
  const deadline = BigInt(physicalArm.leaseStartBoottimeNs) + BigInt(expectation.ttlMs) * 1_000_000n
  if (deadline > MAX_UINT64 || physicalArm.deadlineBoottimeNs !== deadline.toString()) throw new TypeError("physical arm object immutable deadline mismatch")
  if (physicalArm.clockDomainIdentity !== createGvisorTtlPhysicalClockDomainIdentity(physicalArm.linuxBootId)) throw new TypeError("physical arm object clock-domain identity mismatch")
  if (physicalArm.leaseIdentity !== createGvisorTtlPhysicalLeaseIdentity(expectation, physicalArm)) throw new TypeError("physical arm object lease identity mismatch")
  if (physicalArm.claimRecordIdentity !== createGvisorTtlPhysicalClaimRecordIdentity(expectation, physicalArm)) throw new TypeError("physical arm object owner-claim identity mismatch")
  if (physicalArm.controlPeerBindingIdentity !== createGvisorTtlPhysicalControlPeerIdentity(expectation)) throw new TypeError("physical arm object control-peer identity mismatch")
  if (physicalArm.watchdogRegistryRecordIdentity !== createGvisorTtlPhysicalRegistryRecordIdentity(expectation, physicalArm)) throw new TypeError("physical arm object durable registry identity mismatch")
  const { physicalArmAcknowledgementIdentity: _ignored, ...withoutIdentity } = physicalArm
  if (physicalArm.physicalArmAcknowledgementIdentity !== createGvisorTtlPhysicalArmAcknowledgementIdentity(expectation, withoutIdentity)) throw new TypeError("physical arm object identity mismatch")
  return physicalArm
}

export function validateGvisorTtlPhysicalTerminalAcknowledgement(line: string, expectationValue: GvisorTtlPhysicalArmExpectation, physicalArmValue: GvisorTtlPhysicalArmAcknowledgement): GvisorTtlPhysicalTerminalAcknowledgement {
  const expectation = createPhysicalExpectationFromValue(expectationValue)
  const physicalArm = validatePhysicalArmObject(physicalArmValue, expectation)
  const terminal = parseTerminalLine(line)
  if (terminal.leaseIdentity !== physicalArm.leaseIdentity || terminal.armOperationIdentity !== physicalArm.armOperationIdentity || terminal.runtimeInstanceIdentity !== physicalArm.runtimeInstanceIdentity || terminal.ownerInstanceIdentity !== physicalArm.ownerInstanceIdentity || terminal.terminalFenceToken !== physicalArm.terminalFenceToken || terminal.claimRecordIdentity !== physicalArm.claimRecordIdentity || terminal.controlPeerBindingIdentity !== physicalArm.controlPeerBindingIdentity || terminal.runscArtifactIdentity !== physicalArm.runscArtifactIdentity || terminal.verifiedRunscSha256 !== physicalArm.verifiedRunscSha256 || terminal.clockDomainIdentity !== physicalArm.clockDomainIdentity || terminal.linuxBootId !== physicalArm.linuxBootId) throw new TypeError("physical terminal acknowledgement does not match physical arm generation")
  if (terminal.socketDevice !== expectation.socketDevice || terminal.socketInode !== expectation.socketInode || terminal.peerPid !== expectation.peerPid || terminal.peerUid !== expectation.peerUid || terminal.peerGid !== expectation.peerGid) throw new TypeError("physical terminal acknowledgement control peer tuple mismatch")
  const expectedPidfd = createGvisorTtlWatchdogProtocolIdentity("PIDFD_PROCESS", [String(expectation.peerPid), expectation.processStartTicks, expectation.executableDevice, expectation.executableInode, expectation.executableSize, expectation.runtimeInstanceIdentity])
  if (terminal.retainedPidfdProcessIdentity !== expectedPidfd) throw new TypeError("physical terminal retained pidfd process identity mismatch")
  const expectedRunsc = createGvisorTtlWatchdogProtocolIdentity("RUNSC_EXECUTABLE", [expectation.verifiedRunscSha256, expectation.executableDevice, expectation.executableInode, expectation.executableSize, expectation.runscArtifactIdentity])
  if (terminal.retainedRunscExecutableIdentity !== expectedRunsc) throw new TypeError("physical terminal retained runsc executable identity mismatch")
  if (terminal.terminalOutcome === "natural-exit") {
    if (terminal.exitEventObservedBoottimeNs === null || terminal.liveAtExpiryObservedBoottimeNs !== null || terminal.liveAtExpiryProbeIdentity !== null || terminal.liveAtExpiryProcessSetIdentity !== null || terminal.signalAcknowledgementIdentity !== null) throw new TypeError("physical natural-exit acknowledgement contains contradictory expiry fields")
    const event = BigInt(terminal.exitEventObservedBoottimeNs)
    if (event < BigInt(physicalArm.leaseStartBoottimeNs) || event >= BigInt(physicalArm.deadlineBoottimeNs)) throw new TypeError("physical natural-exit event is outside immutable lease interval")
  } else {
    if (terminal.exitEventObservedBoottimeNs !== null || terminal.liveAtExpiryObservedBoottimeNs === null || terminal.liveAtExpiryProbeIdentity === null || terminal.liveAtExpiryProcessSetIdentity === null || terminal.signalAcknowledgementIdentity === null) throw new TypeError("physical ttl-expired acknowledgement is missing required expiry fields")
    if (BigInt(terminal.liveAtExpiryObservedBoottimeNs) < BigInt(physicalArm.deadlineBoottimeNs)) throw new TypeError("physical expiry liveness precedes immutable deadline")
  }
  const expectedRegistry = createGvisorTtlWatchdogProtocolIdentity("TERMINAL_REGISTRY", [
    physicalArm.armOperationIdentity,
    physicalArm.leaseIdentity,
    physicalArm.runtimeInstanceIdentity,
    terminal.terminalOutcome,
    physicalArm.ownerInstanceIdentity,
    physicalArm.terminalFenceToken,
    physicalArm.claimRecordIdentity,
    physicalArm.controlPeerBindingIdentity,
    terminal.retainedPidfdProcessIdentity,
    physicalArm.runscArtifactIdentity,
    physicalArm.verifiedRunscSha256,
    terminal.retainedRunscExecutableIdentity,
    physicalArm.clockDomainIdentity,
    physicalArm.linuxBootId,
    watchdogNullable(terminal.exitEventObservedBoottimeNs),
    watchdogNullable(terminal.liveAtExpiryObservedBoottimeNs),
    watchdogNullable(terminal.liveAtExpiryProbeIdentity),
    watchdogNullable(terminal.liveAtExpiryProcessSetIdentity),
    watchdogNullable(terminal.signalAcknowledgementIdentity),
    terminal.terminationAcknowledgementIdentity,
  ])
  if (terminal.registryTerminalRecordIdentity !== expectedRegistry) throw new TypeError("physical terminal durable registry identity mismatch")
  return terminal
}

function createPhysicalExpectationFromValue(value: GvisorTtlPhysicalArmExpectation): GvisorTtlPhysicalArmExpectation {
  return Object.freeze({
    armOperationIdentity: canonicalSha(value.armOperationIdentity, "armOperationIdentity"),
    canonicalArmPayloadDigest: canonicalSha(value.canonicalArmPayloadDigest, "canonicalArmPayloadDigest"),
    executionAttemptIdentity: canonicalSha(value.executionAttemptIdentity, "executionAttemptIdentity"),
    requirementIdentity: canonicalSha(value.requirementIdentity, "requirementIdentity"),
    workloadIdentity: canonicalSha(value.workloadIdentity, "workloadIdentity"),
    containerBindingIdentity: canonicalSha(value.containerBindingIdentity, "containerBindingIdentity"),
    containerId: value.containerId,
    runtimeInstanceIdentity: canonicalSha(value.runtimeInstanceIdentity, "runtimeInstanceIdentity"),
    ttlMs: value.ttlMs,
    watchdogImplementationIdentity: canonicalSha(value.watchdogImplementationIdentity, "watchdogImplementationIdentity"),
    socketDevice: canonicalUint(value.socketDevice, "socketDevice", false),
    socketInode: canonicalUint(value.socketInode, "socketInode", false),
    peerPid: value.peerPid,
    peerUid: canonicalUint(value.peerUid, "peerUid"),
    peerGid: canonicalUint(value.peerGid, "peerGid"),
    processStartTicks: canonicalUint(value.processStartTicks, "processStartTicks", false),
    executableDevice: canonicalUint(value.executableDevice, "executableDevice", false),
    executableInode: canonicalUint(value.executableInode, "executableInode", false),
    executableSize: canonicalUint(value.executableSize, "executableSize", false),
    runscArtifactIdentity: canonicalSha(value.runscArtifactIdentity, "runscArtifactIdentity"),
    verifiedRunscSha256: canonicalSha(value.verifiedRunscSha256, "verifiedRunscSha256"),
    expectedLinuxBootId: canonicalBootId(value.expectedLinuxBootId),
  })
}

function adaptGvisorTtlPhysicalTerminalAcknowledgement(input: { arm: GvisorTtlArmRecord; expectation: GvisorTtlPhysicalArmExpectation; physical: GvisorTtlPhysicalTerminalAcknowledgement }): GvisorTtlTerminalRecord {
  const arm = validateGvisorTtlArmRecord(input.arm); const physical = input.physical
  const physicalControlPeer = createGvisorTtlPhysicalControlPeerIdentity(input.expectation)
  const base = Object.freeze({
    version: KDO_H4_R3G_D_TERMINAL_RECORD_VERSION,
    evidenceClass: KDO_H4_R3G_D_TERMINAL_EVIDENCE_CLASS,
    armOperationIdentity: arm.armOperationIdentity,
    leaseIdentity: arm.leaseIdentity,
    armRecordIdentity: arm.recordIdentity,
    runtimeInstanceIdentity: arm.runtimeInstanceIdentity,
    terminalOutcome: physical.terminalOutcome,
    ownerInstanceIdentity: arm.ownerInstanceIdentity,
    terminalFenceToken: arm.terminalFenceToken,
    claimRecordIdentity: arm.claimRecordIdentity,
    controlPeerBindingIdentity: arm.controlPeerBindingIdentity,
    socketDevice: arm.controlPeer.socketDevice,
    socketInode: arm.controlPeer.socketInode,
    peerPid: arm.controlPeer.peerPid,
    peerUid: arm.controlPeer.peerUid,
    peerGid: arm.controlPeer.peerGid,
    retainedPidfdProcessIdentity: physical.retainedPidfdProcessIdentity,
    runscArtifactIdentity: arm.runscArtifactIdentity,
    verifiedRunscSha256: arm.verifiedRunscSha256,
    retainedRunscExecutableIdentity: physical.retainedRunscExecutableIdentity,
    clockDomainIdentity: arm.clockDomainIdentity,
    linuxBootId: arm.linuxBootId,
    exitEventObservedBoottimeNs: physical.exitEventObservedBoottimeNs,
    liveAtExpiryProbeIdentity: physical.liveAtExpiryProbeIdentity,
    liveAtExpiryObservedBoottimeNs: physical.liveAtExpiryObservedBoottimeNs,
    liveAtExpiryProcessSetIdentity: physical.liveAtExpiryProcessSetIdentity,
    signalAcknowledgementIdentity: physical.signalAcknowledgementIdentity,
    terminationAcknowledgementIdentity: physical.terminationAcknowledgementIdentity,
  })
  const registryTerminalRecordIdentity = createGvisorTtlWatchdogProtocolIdentity("TERMINAL_REGISTRY", [
    base.armOperationIdentity,
    base.leaseIdentity,
    base.runtimeInstanceIdentity,
    base.terminalOutcome,
    base.ownerInstanceIdentity,
    base.terminalFenceToken,
    base.claimRecordIdentity,
    physicalControlPeer,
    base.retainedPidfdProcessIdentity,
    base.runscArtifactIdentity,
    base.verifiedRunscSha256,
    base.retainedRunscExecutableIdentity,
    base.clockDomainIdentity,
    base.linuxBootId,
    watchdogNullable(base.exitEventObservedBoottimeNs),
    watchdogNullable(base.liveAtExpiryObservedBoottimeNs),
    watchdogNullable(base.liveAtExpiryProbeIdentity),
    watchdogNullable(base.liveAtExpiryProcessSetIdentity),
    watchdogNullable(base.signalAcknowledgementIdentity),
    base.terminationAcknowledgementIdentity,
  ])
  const withRegistry = Object.freeze({ ...base, registryTerminalRecordIdentity })
  return validateGvisorTtlTerminalRecord(Object.freeze({ ...withRegistry, recordIdentity: logicalHash("TERMINAL_RECORD", withRegistry) }), arm)
}

async function* boundedLineIterator(stream: Readable, maximumBytes: number): AsyncGenerator<string> {
  let total = 0; let buffered = Buffer.alloc(0)
  for await (const chunk of stream) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string)
    total += bytes.byteLength
    if (total > maximumBytes) throw new Error(`R3G-D watchdog stdout exceeds ${maximumBytes} bytes`)
    buffered = Buffer.concat([buffered, bytes])
    while (true) {
      const newline = buffered.indexOf(0x0a); if (newline < 0) break
      const lineBytes = buffered.subarray(0, newline); buffered = buffered.subarray(newline + 1)
      if (lineBytes.includes(0x0d)) throw new Error("R3G-D watchdog stdout uses non-canonical line endings")
      yield lineBytes.toString("utf8")
    }
  }
  if (buffered.byteLength !== 0) throw new Error("R3G-D watchdog stdout ended with an unterminated line")
}
async function drainBoundedText(stream: Readable, maximumBytes: number): Promise<DrainedText> {
  let stored = 0; let observed = 0; let overflow = false; const chunks: Buffer[] = []
  for await (const chunk of stream) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string)
    observed += bytes.byteLength
    if (observed > maximumBytes) overflow = true
    const remaining = maximumBytes - stored
    if (remaining > 0) { const accepted = bytes.subarray(0, remaining); chunks.push(Buffer.from(accepted)); stored += accepted.byteLength }
  }
  return Object.freeze({ text: Buffer.concat(chunks, stored).toString("utf8"), overflow })
}
function waitForChild(child: ChildProcess): Promise<ChildExit> {
  return new Promise((resolvePromise, rejectPromise) => { child.once("error", rejectPromise); child.once("exit", (code, signal) => resolvePromise(Object.freeze({ code, signal }))) })
}
async function withTimeout<T>(label: string, timeoutMs: number, value: Promise<T>): Promise<T> {
  let timer: NodeJS.Timeout | undefined
  try { return await Promise.race([value, new Promise<never>((_, rejectPromise) => { timer = setTimeout(() => rejectPromise(new Error(`${label} timed out`)), timeoutMs) })]) }
  finally { if (timer !== undefined) clearTimeout(timer) }
}
async function drainAfterPending(pending: Promise<IteratorResult<string>>, lines: AsyncIterator<string>, exit: Promise<ChildExit>, stderr: Promise<DrainedText>): Promise<void> {
  await pending.catch(() => undefined)
  try { while (!(await lines.next()).done) {} } catch {}
  await Promise.allSettled([exit, stderr])
}
async function drainRemaining(lines: AsyncIterator<string>, exit: Promise<ChildExit>, stderr: Promise<DrainedText>): Promise<void> {
  try { while (!(await lines.next()).done) {} } catch {}
  await Promise.allSettled([exit, stderr])
}

function buildWatchdogArgs(runtime: GvisorTtlRuntimeConfig, prepared: GvisorTtlPreparedIntent, subject: GvisorTtlSubjectBinding): string[] {
  return [
    "--arm",
    "--registry-root", runtime.registryRoot,
    "--arm-operation", prepared.armOperationIdentity,
    "--arm-payload-digest", prepared.canonicalArmPayloadDigest,
    "--execution-attempt", prepared.executionAttemptIdentity,
    "--requirement", prepared.requirementIdentity,
    "--workload", prepared.workloadIdentity,
    "--container-binding", prepared.containerBindingIdentity,
    "--container-id", prepared.containerId,
    "--runtime-instance", prepared.runtimeInstanceIdentity,
    "--ttl-ms", String(prepared.ttlMs),
    "--watchdog-implementation", prepared.watchdogImplementationIdentity,
    "--control-socket", subject.controlEndpoint.path,
    "--socket-device-inode", `${subject.controlEndpoint.device}:${subject.controlEndpoint.inode}`,
    "--peer-pid-uid-gid", `${subject.process.pid}:${subject.expectedPeerUid}:${subject.expectedPeerGid}`,
    "--process-tuple", `${subject.process.startTicks}:${subject.process.exeDev}:${subject.process.exeIno}:${subject.process.exeSize}`,
    "--runsc-artifact", subject.runscArtifact.artifactIdentity,
    "--runsc-sha256", subject.runscArtifact.sha256,
  ]
}

export class GvisorTtlExecutionGateway extends ExecutionGateway {
  private readonly ttlPolicy: PolicyEngine
  private readonly ttlRuntime: GvisorTtlRuntimeConfig

  constructor(config: GvisorTtlExecutionGatewayConfig) {
    super(config.filesystem, config.policy)
    this.ttlPolicy = config.policy
    this.ttlRuntime = validateGvisorTtlRuntimeConfig(config.ttlRuntime)
  }

  async enforceGvisorTtl(requirementValue: SandboxExecutionRequirement, observer?: ExecutionObserver, options: { signal?: AbortSignal } = {}): Promise<GvisorTtlEnforcementResult> {
    const startedAt = new Date().toISOString(); const requirement = validateSandboxExecutionRequirement(requirementValue)
    const intent = immutableIntent({ capability: KDO_H4_R3G_D_CAPABILITY, paths: [], inputDigest: textSha256(JSON.stringify({ version: "kodac-h4-r3g-d-intent-v1", requirementIdentity: requirement.requirementIdentity, workloadIdentity: requirement.workload.workloadIdentity, ttlMs: requirement.workload.resourcePolicy.ttlMs, semanticRuntimeClass: requirement.requiredSemanticRuntimeClass })) })
    await observer?.onIntent?.(intent)
    const policy = immutablePolicy(await this.ttlPolicy.evaluate(intent)); await observer?.onPolicy?.(intent, policy)
    const block = async (reason: string, message: string): Promise<never> => {
      const receipt = createReceipt({ capability: intent.capability, inputDigest: intent.inputDigest, paths: intent.paths, policy, startedAt, completedAt: new Date().toISOString(), result: { status: "blocked", reason } }); await persistReceipt(observer, receipt); throw new ExecutionBlockedError(message, receipt)
    }
    if (policy.decision === "deny") return block(policy.reason, `Execution denied: ${policy.reason}`)
    if (policy.decision === "ask") return block("R3G-D physical lifecycle approval is not authorized", "Approval unavailable: R3G-D physical lifecycle enforcement does not authorize ask")
    if (requirement.requiredSemanticRuntimeClass !== "gvisor") return block("R3G-D requires requiredSemanticRuntimeClass=gvisor", "R3G-D lifecycle enforcement unavailable: gVisor required")
    if (process.platform !== "linux") return block("R3G-D physical lifecycle enforcement requires Linux", "R3G-D lifecycle enforcement unavailable: Linux required")
    if (options.signal?.aborted) return block("R3G-D enforcement aborted before subject resolution", "R3G-D lifecycle enforcement aborted before arm")

    let watchdog: TrustedWatchdogArtifact | undefined
    let child: ChildProcess | undefined
    let lines: AsyncIterator<string> | undefined
    let exitPromise: Promise<ChildExit> | undefined
    let stderrPromise: Promise<DrainedText> | undefined
    let pendingDrainOwned = false
    try {
      watchdog = await observeTrustedWatchdog(this.ttlRuntime)
      const rawSubject = await boundedTrusted("R3G-D trusted subject resolution", KDO_H4_R3G_D_LIMITS.armAckTimeoutMs, () => this.ttlRuntime.resolveSubject(requirement, { signal: options.signal }))
      const subject = validateGvisorTtlSubjectBinding(rawSubject, requirement)
      if (options.signal?.aborted) return block("R3G-D enforcement aborted before PREPARED commit", "R3G-D lifecycle enforcement aborted before arm")
      const prepared = createGvisorTtlPreparedIntent({ requirement, subject, watchdogImplementationIdentity: watchdog.implementationIdentity })
      const preparedExpected = createGvisorTtlEvidenceCommit({ kind: "prepared", armOperationIdentity: prepared.armOperationIdentity, leaseIdentity: null, recordIdentity: prepared.intentIdentity, payloadDigest: payloadDigest(prepared) })
      await commitExact("R3G-D PREPARED evidence commit", () => this.ttlRuntime.commitPreparedIntent(prepared), preparedExpected)
      if (options.signal?.aborted) return block("R3G-D enforcement aborted after PREPARED but before watchdog spawn", "R3G-D lifecycle enforcement aborted before physical arm")
      const linuxBootId = canonicalBootId((await readFile("/proc/sys/kernel/random/boot_id", "utf8")).trim())
      await reverifyTrustedWatchdog(watchdog)
      const expectation = createPhysicalExpectation(prepared, subject, linuxBootId)
      const args = buildWatchdogArgs(this.ttlRuntime, prepared, subject)
      child = spawn(`/proc/self/fd/${WATCHDOG_CHILD_FD}`, args, { cwd: "/", env: { LANG: "C", LC_ALL: "C" }, windowsHide: true, shell: false, stdio: ["ignore", "pipe", "pipe", watchdog.handle.fd] })
      const stdout = child.stdout; const stderr = child.stderr
      if (!stdout || !stderr) throw new Error("R3G-D watchdog did not expose bounded stdout/stderr")
      const iterator = boundedLineIterator(stdout, KDO_H4_R3G_D_LIMITS.maxAckBytes + KDO_H4_R3G_D_LIMITS.maxTerminalBytes + 2); lines = iterator[Symbol.asyncIterator](); exitPromise = waitForChild(child); stderrPromise = drainBoundedText(stderr, KDO_H4_R3G_D_LIMITS.maxStderrBytes)
      const armPending = lines.next()
      let armNext: IteratorResult<string>
      try { armNext = await withTimeout("R3G-D physical arm acknowledgement", KDO_H4_R3G_D_LIMITS.armAckTimeoutMs, armPending) }
      catch (error) { pendingDrainOwned = true; void drainAfterPending(armPending, lines, exitPromise, stderrPromise); throw error }
      if (armNext.done || armNext.value.length === 0) throw new Error("R3G-D watchdog exited before physical arm acknowledgement")
      if (Buffer.byteLength(armNext.value, "utf8") > KDO_H4_R3G_D_LIMITS.maxAckBytes) throw new Error("R3G-D physical arm acknowledgement exceeds authorized bound")
      const physicalArm = validateGvisorTtlPhysicalArmAcknowledgement(armNext.value, expectation)
      const logical = adaptGvisorTtlPhysicalArmAcknowledgement({ prepared, subject, physical: physicalArm })
      const armExpected = createGvisorTtlEvidenceCommit({ kind: "arm", armOperationIdentity: logical.arm.armOperationIdentity, leaseIdentity: logical.arm.leaseIdentity, recordIdentity: logical.arm.recordIdentity, payloadDigest: payloadDigest(logical.arm) })
      await commitExact("R3G-D arm evidence commit", () => this.ttlRuntime.commitArmEvidence(logical.arm), armExpected)

      const terminalPending = lines.next()
      let terminalNext: IteratorResult<string>
      try { terminalNext = await withTimeout("R3G-D physical terminal acknowledgement", prepared.ttlMs + WATCHDOG_TERMINATION_ACK_TIMEOUT_MS, terminalPending) }
      catch (error) { pendingDrainOwned = true; void drainAfterPending(terminalPending, lines, exitPromise, stderrPromise); throw error }
      if (terminalNext.done || terminalNext.value.length === 0) throw new Error("R3G-D watchdog exited without a physical terminal acknowledgement")
      if (Buffer.byteLength(terminalNext.value, "utf8") > KDO_H4_R3G_D_LIMITS.maxTerminalBytes) throw new Error("R3G-D physical terminal acknowledgement exceeds authorized bound")
      const physicalTerminal = validateGvisorTtlPhysicalTerminalAcknowledgement(terminalNext.value, expectation, physicalArm)
      const terminal = adaptGvisorTtlPhysicalTerminalAcknowledgement({ arm: logical.arm, expectation, physical: physicalTerminal })
      const terminalExpected = createGvisorTtlEvidenceCommit({ kind: "terminal", armOperationIdentity: terminal.armOperationIdentity, leaseIdentity: terminal.leaseIdentity, recordIdentity: terminal.recordIdentity, payloadDigest: payloadDigest(terminal) })
      await commitExact("R3G-D terminal evidence commit", () => this.ttlRuntime.commitTerminalEvidence(terminal), terminalExpected)
      const extraPending = lines.next()
      let extra: IteratorResult<string>
      try { extra = await withTimeout("R3G-D watchdog post-terminal stdout close", WATCHDOG_POST_TERMINAL_EXIT_TIMEOUT_MS, extraPending) }
      catch (error) { pendingDrainOwned = true; void drainAfterPending(extraPending, lines, exitPromise, stderrPromise); throw error }
      if (!extra.done) throw new Error("R3G-D watchdog emitted unexpected output after terminal acknowledgement")
      const [exit, stderrResult] = await withTimeout("R3G-D watchdog post-terminal exit", WATCHDOG_POST_TERMINAL_EXIT_TIMEOUT_MS, Promise.all([exitPromise, stderrPromise]))
      if (stderrResult.overflow) throw new Error("R3G-D watchdog stderr exceeded the authorized bound")
      if (exit.code !== 0 || exit.signal !== null) throw new Error(`R3G-D watchdog failed after terminal acknowledgement: code=${String(exit.code)} signal=${String(exit.signal)} stderr=${stderrResult.text}`)
      const serialized = JSON.stringify(terminal); const receipt = createReceipt({ capability: intent.capability, inputDigest: intent.inputDigest, paths: intent.paths, policy, startedAt, completedAt: new Date().toISOString(), result: { status: "success", outputDigest: textSha256(serialized), outputBytes: Buffer.byteLength(serialized, "utf8"), exitCode: 0 } }); await persistReceipt(observer, receipt)
      return Object.freeze({ arm: logical.arm, terminal })
    } catch (error) {
      if (!pendingDrainOwned && lines !== undefined && exitPromise !== undefined && stderrPromise !== undefined) void drainRemaining(lines, exitPromise, stderrPromise)
      if (error instanceof ExecutionBlockedError || error instanceof ExecutionUnprovenError || error instanceof ExecutionFailedError) throw error
      const message = error instanceof Error ? error.message : String(error)
      const receipt = createReceipt({ capability: intent.capability, inputDigest: intent.inputDigest, paths: intent.paths, policy, startedAt, completedAt: new Date().toISOString(), result: { status: "failure", error: message } }); await persistReceipt(observer, receipt)
      throw new ExecutionFailedError(`${KDO_H4_R3G_D_CAPABILITY} failed: ${message}`, receipt, { cause: error })
    } finally { await watchdog?.handle.close().catch(() => {}) }
  }
}
