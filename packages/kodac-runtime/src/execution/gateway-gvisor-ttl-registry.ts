import { constants } from "node:fs"
import { open, readFile, readdir, type FileHandle } from "node:fs/promises"
import { posix } from "node:path"

import { createGvisorTtlWatchdogProtocolIdentity } from "./gateway-gvisor-ttl.ts"

const SHA256 = /^[0-9a-f]{64}$/
const UINT = /^(?:0|[1-9][0-9]*)$/
const BOOT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const OPERATION_FILE = /^([0-9a-f]{64})\.(lock|claim|lease|terminal)$/
const REGISTRY_SUFFIX = /\.(?:lock|claim|lease|terminal)$/
const MAX_UINT64 = 18_446_744_073_709_551_615n
const MAX_RECORD_BYTES = 16_384n
const MAX_REGISTRY_ENTRIES = 4_096
const MAX_PATH_BYTES = 4_096
const WATCHDOG_LEASE_VERSION = "kodac-h4-r3g-d-watchdog-lease-v1"
const OWNER_CLAIM_VERSION = "kodac-h4-r3g-d-owner-claim-v1"
const TERMINAL_REGISTRY_VERSION = "kodac-h4-r3g-d-terminal-registry-v1"
const CLOCK_NAME = "CLOCK_BOOTTIME"

export type GvisorTtlPhysicalClockContinuity = "SAME_BOOT" | "UNRECOVERABLE_CLOCK_DOMAIN"

export interface GvisorTtlPhysicalOwnerClaim {
  readonly version: typeof OWNER_CLAIM_VERSION
  readonly armOperationIdentity: string
  readonly ownerInstanceIdentity: string
  readonly terminalFenceToken: string
  readonly linuxBootId: string
  readonly claimRecordIdentity: string
}

export interface GvisorTtlPhysicalLeaseRecord {
  readonly version: typeof WATCHDOG_LEASE_VERSION
  readonly armOperationIdentity: string
  readonly canonicalArmPayloadDigest: string
  readonly leaseIdentity: string
  readonly executionAttemptIdentity: string
  readonly requirementIdentity: string
  readonly workloadIdentity: string
  readonly containerBindingIdentity: string
  readonly containerId: string
  readonly runtimeInstanceIdentity: string
  readonly ttlMs: number
  readonly linuxBootId: string
  readonly clockDomainIdentity: string
  readonly leaseStartBoottimeNs: string
  readonly deadlineBoottimeNs: string
  readonly watchdogImplementationIdentity: string
  readonly physicalArmState: "ARMED"
  readonly ownerInstanceIdentity: string
  readonly terminalFenceToken: string
  readonly claimRecordIdentity: string
  readonly registryRecordIdentity: string
}

export interface GvisorTtlPhysicalTerminalRecord {
  readonly version: typeof TERMINAL_REGISTRY_VERSION
  readonly armOperationIdentity: string
  readonly leaseIdentity: string
  readonly runtimeInstanceIdentity: string
  readonly terminalOutcome: "natural-exit" | "ttl-expired"
  readonly ownerInstanceIdentity: string
  readonly terminalFenceToken: string
  readonly claimRecordIdentity: string
  readonly controlPeerBindingIdentity: string
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

export interface GvisorTtlPhysicalRegistrySnapshot {
  readonly armOperationIdentity: string
  readonly clockContinuity: GvisorTtlPhysicalClockContinuity
  readonly claim: GvisorTtlPhysicalOwnerClaim
  readonly lease: GvisorTtlPhysicalLeaseRecord
  readonly terminal: GvisorTtlPhysicalTerminalRecord | null
}

type RegistryKind = "lock" | "claim" | "lease" | "terminal"
type Fingerprint = Readonly<{ dev: bigint; ino: bigint; size: bigint; mtimeNs: bigint; ctimeNs: bigint }>
type PinnedLeaf = Readonly<{ name: string; text: string | null; fingerprint: Fingerprint }>

function identity(value: string, label: string): string {
  if (!SHA256.test(value)) throw new TypeError(`${label} must be a lowercase SHA-256 identity`)
  return value
}

function canonicalUint(value: string, label: string, allowZero = true): string {
  if (!UINT.test(value)) throw new TypeError(`${label} must be canonical unsigned decimal`)
  const parsed = BigInt(value)
  if ((!allowZero && parsed === 0n) || parsed > MAX_UINT64) throw new TypeError(`${label} is outside uint64 range`)
  return value
}

function bootId(value: string): string {
  if (!BOOT_ID.test(value)) throw new TypeError("linuxBootId must be a canonical lowercase Linux boot id")
  return value
}

function nullableIdentity(value: string, label: string): string | null {
  return value === "-" ? null : identity(value, label)
}

function nullableUint(value: string, label: string): string | null {
  return value === "-" ? null : canonicalUint(value, label)
}

function canonicalRegistryRoot(value: string): string {
  if (typeof value !== "string" || Buffer.byteLength(value, "utf8") > MAX_PATH_BYTES || value.includes("\0") || !posix.isAbsolute(value) || posix.normalize(value) !== value || (value.length > 1 && value.endsWith("/"))) {
    throw new TypeError("R3G-D registryRoot must be a canonical bounded absolute POSIX path")
  }
  return value
}

function parseCanonicalRecord(text: string, keys: readonly string[], label: string): Record<string, string> {
  if (Buffer.byteLength(text, "utf8") === 0 || BigInt(Buffer.byteLength(text, "utf8")) > MAX_RECORD_BYTES || text.includes("\0") || text.includes("\r") || !text.endsWith("\n")) {
    throw new TypeError(`${label} bytes are not canonical or bounded`)
  }
  const lines = text.slice(0, -1).split("\n")
  if (lines.length !== keys.length) throw new TypeError(`${label} field count is not canonical`)
  const result: Record<string, string> = Object.create(null) as Record<string, string>
  for (let index = 0; index < keys.length; index += 1) {
    const line = lines[index]
    const separator = line.indexOf("=")
    if (separator <= 0 || line.indexOf("=", separator + 1) !== -1) throw new TypeError(`${label} line grammar is invalid`)
    const key = line.slice(0, separator)
    const value = line.slice(separator + 1)
    if (key !== keys[index] || value.length === 0 || Object.hasOwn(result, key)) throw new TypeError(`${label} field ordering is not canonical`)
    result[key] = value
  }
  return result
}

export function parseGvisorTtlPhysicalOwnerClaimRecord(text: string): GvisorTtlPhysicalOwnerClaim {
  const record = parseCanonicalRecord(text, ["version", "armOperationIdentity", "ownerInstanceIdentity", "terminalFenceToken", "linuxBootId", "claimRecordIdentity"], "R3G-D physical owner claim")
  if (record.version !== OWNER_CLAIM_VERSION) throw new TypeError("R3G-D physical owner claim version mismatch")
  const armOperationIdentity = identity(record.armOperationIdentity, "armOperationIdentity")
  const ownerInstanceIdentity = identity(record.ownerInstanceIdentity, "ownerInstanceIdentity")
  const terminalFenceToken = canonicalUint(record.terminalFenceToken, "terminalFenceToken", false)
  const linuxBootId = bootId(record.linuxBootId)
  const expected = createGvisorTtlWatchdogProtocolIdentity("OWNER_CLAIM", [armOperationIdentity, ownerInstanceIdentity, terminalFenceToken, linuxBootId])
  if (identity(record.claimRecordIdentity, "claimRecordIdentity") !== expected) throw new TypeError("R3G-D physical owner claim identity mismatch")
  return Object.freeze({ version: OWNER_CLAIM_VERSION, armOperationIdentity, ownerInstanceIdentity, terminalFenceToken, linuxBootId, claimRecordIdentity: expected })
}

export function parseGvisorTtlPhysicalLeaseRecord(text: string, claimValue?: GvisorTtlPhysicalOwnerClaim): GvisorTtlPhysicalLeaseRecord {
  const record = parseCanonicalRecord(text, [
    "version", "armOperationIdentity", "canonicalArmPayloadDigest", "leaseIdentity", "executionAttemptIdentity", "requirementIdentity", "workloadIdentity", "containerBindingIdentity", "containerId", "runtimeInstanceIdentity", "ttlMs", "linuxBootId", "clockDomainIdentity", "leaseStartBoottimeNs", "deadlineBoottimeNs", "watchdogImplementationIdentity", "physicalArmState", "ownerInstanceIdentity", "terminalFenceToken", "claimRecordIdentity", "registryRecordIdentity",
  ], "R3G-D physical lease")
  if (record.version !== WATCHDOG_LEASE_VERSION || record.physicalArmState !== "ARMED") throw new TypeError("R3G-D physical lease version/state mismatch")
  const armOperationIdentity = identity(record.armOperationIdentity, "armOperationIdentity")
  const canonicalArmPayloadDigest = identity(record.canonicalArmPayloadDigest, "canonicalArmPayloadDigest")
  const executionAttemptIdentity = identity(record.executionAttemptIdentity, "executionAttemptIdentity")
  const requirementIdentity = identity(record.requirementIdentity, "requirementIdentity")
  const workloadIdentity = identity(record.workloadIdentity, "workloadIdentity")
  const containerBindingIdentity = identity(record.containerBindingIdentity, "containerBindingIdentity")
  const containerId = identity(record.containerId, "containerId")
  const runtimeInstanceIdentity = identity(record.runtimeInstanceIdentity, "runtimeInstanceIdentity")
  const ttlText = canonicalUint(record.ttlMs, "ttlMs", false)
  const ttlValue = BigInt(ttlText)
  if (ttlValue > 86_400_000n) throw new TypeError("R3G-D physical lease ttlMs exceeds the authorized bound")
  const ttlMs = Number(ttlValue)
  const linuxBootId = bootId(record.linuxBootId)
  const leaseStartBoottimeNs = canonicalUint(record.leaseStartBoottimeNs, "leaseStartBoottimeNs")
  const deadlineBoottimeNs = canonicalUint(record.deadlineBoottimeNs, "deadlineBoottimeNs")
  const computedDeadline = BigInt(leaseStartBoottimeNs) + ttlValue * 1_000_000n
  if (computedDeadline > MAX_UINT64 || computedDeadline.toString() !== deadlineBoottimeNs) throw new TypeError("R3G-D physical lease deadline is not the immutable start+ttl deadline")
  const watchdogImplementationIdentity = identity(record.watchdogImplementationIdentity, "watchdogImplementationIdentity")
  const ownerInstanceIdentity = identity(record.ownerInstanceIdentity, "ownerInstanceIdentity")
  const terminalFenceToken = canonicalUint(record.terminalFenceToken, "terminalFenceToken", false)
  const claimRecordIdentity = identity(record.claimRecordIdentity, "claimRecordIdentity")
  const clockDomainIdentity = createGvisorTtlWatchdogProtocolIdentity("CLOCK_DOMAIN", [linuxBootId, CLOCK_NAME])
  if (identity(record.clockDomainIdentity, "clockDomainIdentity") !== clockDomainIdentity) throw new TypeError("R3G-D physical lease clock-domain identity mismatch")
  const leaseIdentity = createGvisorTtlWatchdogProtocolIdentity("LEASE", [armOperationIdentity, canonicalArmPayloadDigest, runtimeInstanceIdentity, linuxBootId, leaseStartBoottimeNs, deadlineBoottimeNs, watchdogImplementationIdentity])
  if (identity(record.leaseIdentity, "leaseIdentity") !== leaseIdentity) throw new TypeError("R3G-D physical lease identity mismatch")
  const registryRecordIdentity = createGvisorTtlWatchdogProtocolIdentity("LEASE_REGISTRY", [
    WATCHDOG_LEASE_VERSION, armOperationIdentity, canonicalArmPayloadDigest, leaseIdentity, executionAttemptIdentity, requirementIdentity, workloadIdentity, containerBindingIdentity, containerId, runtimeInstanceIdentity, ttlText, linuxBootId, clockDomainIdentity, leaseStartBoottimeNs, deadlineBoottimeNs, watchdogImplementationIdentity, ownerInstanceIdentity, terminalFenceToken, claimRecordIdentity,
  ])
  if (identity(record.registryRecordIdentity, "registryRecordIdentity") !== registryRecordIdentity) throw new TypeError("R3G-D physical lease registry identity mismatch")
  if (claimValue !== undefined) {
    const claim = claimValue
    if (claim.armOperationIdentity !== armOperationIdentity || claim.ownerInstanceIdentity !== ownerInstanceIdentity || claim.terminalFenceToken !== terminalFenceToken || claim.linuxBootId !== linuxBootId || claim.claimRecordIdentity !== claimRecordIdentity) {
      throw new TypeError("R3G-D physical lease does not match authoritative owner claim")
    }
  }
  return Object.freeze({
    version: WATCHDOG_LEASE_VERSION,
    armOperationIdentity,
    canonicalArmPayloadDigest,
    leaseIdentity,
    executionAttemptIdentity,
    requirementIdentity,
    workloadIdentity,
    containerBindingIdentity,
    containerId,
    runtimeInstanceIdentity,
    ttlMs,
    linuxBootId,
    clockDomainIdentity,
    leaseStartBoottimeNs,
    deadlineBoottimeNs,
    watchdogImplementationIdentity,
    physicalArmState: "ARMED",
    ownerInstanceIdentity,
    terminalFenceToken,
    claimRecordIdentity,
    registryRecordIdentity,
  })
}

export function parseGvisorTtlPhysicalTerminalRecord(text: string, leaseValue: GvisorTtlPhysicalLeaseRecord): GvisorTtlPhysicalTerminalRecord {
  const record = parseCanonicalRecord(text, [
    "version", "armOperationIdentity", "leaseIdentity", "runtimeInstanceIdentity", "terminalOutcome", "ownerInstanceIdentity", "terminalFenceToken", "claimRecordIdentity", "controlPeerBindingIdentity", "retainedPidfdProcessIdentity", "runscArtifactIdentity", "verifiedRunscSha256", "retainedRunscExecutableIdentity", "clockDomainIdentity", "linuxBootId", "exitEventObservedBoottimeNs", "liveAtExpiryObservedBoottimeNs", "liveAtExpiryProbeIdentity", "liveAtExpiryProcessSetIdentity", "signalAcknowledgementIdentity", "terminationAcknowledgementIdentity", "registryTerminalRecordIdentity",
  ], "R3G-D physical terminal registry")
  if (record.version !== TERMINAL_REGISTRY_VERSION || (record.terminalOutcome !== "natural-exit" && record.terminalOutcome !== "ttl-expired")) throw new TypeError("R3G-D physical terminal version/outcome mismatch")
  const terminalOutcome = record.terminalOutcome
  const armOperationIdentity = identity(record.armOperationIdentity, "armOperationIdentity")
  const leaseIdentity = identity(record.leaseIdentity, "leaseIdentity")
  const runtimeInstanceIdentity = identity(record.runtimeInstanceIdentity, "runtimeInstanceIdentity")
  const ownerInstanceIdentity = identity(record.ownerInstanceIdentity, "ownerInstanceIdentity")
  const terminalFenceToken = canonicalUint(record.terminalFenceToken, "terminalFenceToken", false)
  const claimRecordIdentity = identity(record.claimRecordIdentity, "claimRecordIdentity")
  const controlPeerBindingIdentity = identity(record.controlPeerBindingIdentity, "controlPeerBindingIdentity")
  const retainedPidfdProcessIdentity = identity(record.retainedPidfdProcessIdentity, "retainedPidfdProcessIdentity")
  const runscArtifactIdentity = identity(record.runscArtifactIdentity, "runscArtifactIdentity")
  const verifiedRunscSha256 = identity(record.verifiedRunscSha256, "verifiedRunscSha256")
  const retainedRunscExecutableIdentity = identity(record.retainedRunscExecutableIdentity, "retainedRunscExecutableIdentity")
  const clockDomainIdentity = identity(record.clockDomainIdentity, "clockDomainIdentity")
  const linuxBootId = bootId(record.linuxBootId)
  const exitEventObservedBoottimeNs = nullableUint(record.exitEventObservedBoottimeNs, "exitEventObservedBoottimeNs")
  const liveAtExpiryObservedBoottimeNs = nullableUint(record.liveAtExpiryObservedBoottimeNs, "liveAtExpiryObservedBoottimeNs")
  const liveAtExpiryProbeIdentity = nullableIdentity(record.liveAtExpiryProbeIdentity, "liveAtExpiryProbeIdentity")
  const liveAtExpiryProcessSetIdentity = nullableIdentity(record.liveAtExpiryProcessSetIdentity, "liveAtExpiryProcessSetIdentity")
  const signalAcknowledgementIdentity = nullableIdentity(record.signalAcknowledgementIdentity, "signalAcknowledgementIdentity")
  const terminationAcknowledgementIdentity = identity(record.terminationAcknowledgementIdentity, "terminationAcknowledgementIdentity")
  if (
    armOperationIdentity !== leaseValue.armOperationIdentity || leaseIdentity !== leaseValue.leaseIdentity || runtimeInstanceIdentity !== leaseValue.runtimeInstanceIdentity ||
    ownerInstanceIdentity !== leaseValue.ownerInstanceIdentity || terminalFenceToken !== leaseValue.terminalFenceToken || claimRecordIdentity !== leaseValue.claimRecordIdentity ||
    clockDomainIdentity !== leaseValue.clockDomainIdentity || linuxBootId !== leaseValue.linuxBootId
  ) throw new TypeError("R3G-D physical terminal does not match authoritative lease generation")
  if (terminalOutcome === "natural-exit") {
    if (exitEventObservedBoottimeNs === null || liveAtExpiryObservedBoottimeNs !== null || liveAtExpiryProbeIdentity !== null || liveAtExpiryProcessSetIdentity !== null || signalAcknowledgementIdentity !== null) throw new TypeError("R3G-D natural-exit physical terminal contains contradictory expiry fields")
    const event = BigInt(exitEventObservedBoottimeNs)
    if (event < BigInt(leaseValue.leaseStartBoottimeNs) || event >= BigInt(leaseValue.deadlineBoottimeNs)) throw new TypeError("R3G-D natural-exit physical terminal timestamp is outside the immutable lease interval")
  } else {
    if (exitEventObservedBoottimeNs !== null || liveAtExpiryObservedBoottimeNs === null || liveAtExpiryProbeIdentity === null || liveAtExpiryProcessSetIdentity === null || signalAcknowledgementIdentity === null) throw new TypeError("R3G-D ttl-expired physical terminal is missing positive expiry fields")
    if (BigInt(liveAtExpiryObservedBoottimeNs) < BigInt(leaseValue.deadlineBoottimeNs)) throw new TypeError("R3G-D physical live-at-expiry timestamp precedes the immutable deadline")
  }
  const registryTerminalRecordIdentity = createGvisorTtlWatchdogProtocolIdentity("TERMINAL_REGISTRY", [
    armOperationIdentity,
    leaseIdentity,
    runtimeInstanceIdentity,
    terminalOutcome,
    ownerInstanceIdentity,
    terminalFenceToken,
    claimRecordIdentity,
    controlPeerBindingIdentity,
    retainedPidfdProcessIdentity,
    runscArtifactIdentity,
    verifiedRunscSha256,
    retainedRunscExecutableIdentity,
    clockDomainIdentity,
    linuxBootId,
    record.exitEventObservedBoottimeNs,
    record.liveAtExpiryObservedBoottimeNs,
    record.liveAtExpiryProbeIdentity,
    record.liveAtExpiryProcessSetIdentity,
    record.signalAcknowledgementIdentity,
    terminationAcknowledgementIdentity,
  ])
  if (identity(record.registryTerminalRecordIdentity, "registryTerminalRecordIdentity") !== registryTerminalRecordIdentity) throw new TypeError("R3G-D physical terminal registry identity mismatch")
  return Object.freeze({
    version: TERMINAL_REGISTRY_VERSION,
    armOperationIdentity,
    leaseIdentity,
    runtimeInstanceIdentity,
    terminalOutcome,
    ownerInstanceIdentity,
    terminalFenceToken,
    claimRecordIdentity,
    controlPeerBindingIdentity,
    retainedPidfdProcessIdentity,
    runscArtifactIdentity,
    verifiedRunscSha256,
    retainedRunscExecutableIdentity,
    clockDomainIdentity,
    linuxBootId,
    exitEventObservedBoottimeNs,
    liveAtExpiryObservedBoottimeNs,
    liveAtExpiryProbeIdentity,
    liveAtExpiryProcessSetIdentity,
    signalAcknowledgementIdentity,
    terminationAcknowledgementIdentity,
    registryTerminalRecordIdentity,
  })
}

function fingerprint(stat: Awaited<ReturnType<FileHandle["stat"]>>): Fingerprint {
  const value = stat as unknown as { dev: bigint; ino: bigint; size: bigint; mtimeNs: bigint; ctimeNs: bigint }
  return Object.freeze({ dev: value.dev, ino: value.ino, size: value.size, mtimeNs: value.mtimeNs, ctimeNs: value.ctimeNs })
}

function equalFingerprint(left: Fingerprint, right: Fingerprint): boolean {
  return left.dev === right.dev && left.ino === right.ino && left.size === right.size && left.mtimeNs === right.mtimeNs && left.ctimeNs === right.ctimeNs
}

async function openPinnedLeaf(procRoot: string, name: string, euid: number, allowEmpty: boolean): Promise<PinnedLeaf> {
  let handle: FileHandle | undefined
  try {
    handle = await open(`${procRoot}/${name}`, constants.O_RDONLY | constants.O_NOFOLLOW)
    const before = await handle.stat({ bigint: true })
    if (!before.isFile() || before.uid !== BigInt(euid) || before.nlink !== 1n || (before.mode & 0o077n) !== 0n || before.size > MAX_RECORD_BYTES || (!allowEmpty && before.size === 0n)) {
      throw new TypeError(`R3G-D registry leaf ${name} metadata is unsafe`)
    }
    const text = allowEmpty ? null : await handle.readFile({ encoding: "utf8" })
    const after = await handle.stat({ bigint: true })
    const beforeFingerprint = fingerprint(before as never)
    const afterFingerprint = fingerprint(after as never)
    if (!equalFingerprint(beforeFingerprint, afterFingerprint)) throw new TypeError(`R3G-D registry leaf ${name} changed during read`)
    return Object.freeze({ name, text, fingerprint: afterFingerprint })
  } catch (error) {
    if (error instanceof TypeError) throw error
    throw new TypeError(`R3G-D registry leaf ${name} is unavailable or unsafe`)
  } finally {
    await handle?.close().catch(() => {})
  }
}

async function assertPinnedLeafUnchanged(procRoot: string, leaf: PinnedLeaf, euid: number, allowEmpty: boolean): Promise<void> {
  const reread = await openPinnedLeaf(procRoot, leaf.name, euid, allowEmpty)
  if (!equalFingerprint(leaf.fingerprint, reread.fingerprint)) throw new TypeError(`R3G-D registry leaf ${leaf.name} changed across snapshot`)
}

async function listRegistryNames(procRoot: string): Promise<readonly string[]> {
  const names = await readdir(procRoot, { encoding: "utf8" })
  if (names.length > MAX_REGISTRY_ENTRIES) throw new TypeError("R3G-D registry enumeration exceeds the internal recovery bound")
  for (const name of names) {
    if (REGISTRY_SUFFIX.test(name) && !OPERATION_FILE.test(name)) throw new TypeError(`R3G-D registry contains malformed lifecycle entry ${name}`)
  }
  return Object.freeze([...names].sort())
}

async function currentLinuxBootId(): Promise<string> {
  const value = (await readFile("/proc/sys/kernel/random/boot_id", "utf8")).trim()
  return bootId(value)
}

function sameNames(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

export async function inspectGvisorTtlPhysicalRegistry(registryRootValue: string): Promise<readonly GvisorTtlPhysicalRegistrySnapshot[]> {
  if (process.platform !== "linux") throw new TypeError("R3G-D physical registry inspection is Linux-only")
  const geteuid = process.geteuid
  if (typeof geteuid !== "function") throw new TypeError("R3G-D physical registry inspection requires Linux effective uid")
  const euid = geteuid()
  const registryRoot = canonicalRegistryRoot(registryRootValue)
  let root: FileHandle | undefined
  try {
    root = await open(registryRoot, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW)
    const rootBefore = await root.stat({ bigint: true })
    if (!rootBefore.isDirectory() || rootBefore.uid !== BigInt(euid) || (rootBefore.mode & 0o022n) !== 0n) throw new TypeError("R3G-D registry root metadata is unsafe")
    const procRoot = `/proc/self/fd/${root.fd}`
    const beforeNames = await listRegistryNames(procRoot)
    const grouped = new Map<string, Set<RegistryKind>>()
    for (const name of beforeNames) {
      const match = OPERATION_FILE.exec(name)
      if (match === null) continue
      const armOperationIdentity = match[1]
      const kind = match[2] as RegistryKind
      let kinds = grouped.get(armOperationIdentity)
      if (kinds === undefined) { kinds = new Set<RegistryKind>(); grouped.set(armOperationIdentity, kinds) }
      kinds.add(kind)
    }
    const boot = await currentLinuxBootId()
    const snapshots: GvisorTtlPhysicalRegistrySnapshot[] = []
    const retainedLeaves: Array<{ leaf: PinnedLeaf; allowEmpty: boolean }> = []
    for (const armOperationIdentity of [...grouped.keys()].sort()) {
      const kinds = grouped.get(armOperationIdentity) as Set<RegistryKind>
      const lockName = `${armOperationIdentity}.lock`
      if (kinds.has("lock")) retainedLeaves.push({ leaf: await openPinnedLeaf(procRoot, lockName, euid, true), allowEmpty: true })
      const hasState = kinds.has("claim") || kinds.has("lease") || kinds.has("terminal")
      if (!hasState) continue
      if (!kinds.has("lock") || !kinds.has("claim") || !kinds.has("lease")) throw new TypeError(`R3G-D registry operation ${armOperationIdentity} has incomplete durable state`)
      const claimLeaf = await openPinnedLeaf(procRoot, `${armOperationIdentity}.claim`, euid, false)
      const leaseLeaf = await openPinnedLeaf(procRoot, `${armOperationIdentity}.lease`, euid, false)
      retainedLeaves.push({ leaf: claimLeaf, allowEmpty: false }, { leaf: leaseLeaf, allowEmpty: false })
      const claim = parseGvisorTtlPhysicalOwnerClaimRecord(claimLeaf.text as string)
      const lease = parseGvisorTtlPhysicalLeaseRecord(leaseLeaf.text as string, claim)
      if (claim.armOperationIdentity !== armOperationIdentity || lease.armOperationIdentity !== armOperationIdentity) throw new TypeError("R3G-D registry filename does not match embedded arm operation identity")
      let terminal: GvisorTtlPhysicalTerminalRecord | null = null
      if (kinds.has("terminal")) {
        const terminalLeaf = await openPinnedLeaf(procRoot, `${armOperationIdentity}.terminal`, euid, false)
        retainedLeaves.push({ leaf: terminalLeaf, allowEmpty: false })
        terminal = parseGvisorTtlPhysicalTerminalRecord(terminalLeaf.text as string, lease)
      }
      snapshots.push(Object.freeze({
        armOperationIdentity,
        clockContinuity: lease.linuxBootId === boot ? "SAME_BOOT" : "UNRECOVERABLE_CLOCK_DOMAIN",
        claim,
        lease,
        terminal,
      }))
    }
    const afterNames = await listRegistryNames(procRoot)
    if (!sameNames(beforeNames, afterNames)) throw new TypeError("R3G-D registry changed during recovery enumeration")
    for (const entry of retainedLeaves) await assertPinnedLeafUnchanged(procRoot, entry.leaf, euid, entry.allowEmpty)
    const rootAfter = await root.stat({ bigint: true })
    if (rootBefore.dev !== rootAfter.dev || rootBefore.ino !== rootAfter.ino) throw new TypeError("R3G-D retained registry root identity changed during snapshot")
    return Object.freeze(snapshots)
  } catch (error) {
    if (error instanceof TypeError) throw error
    throw new TypeError("R3G-D physical registry inspection failed closed")
  } finally {
    await root?.close().catch(() => {})
  }
}
