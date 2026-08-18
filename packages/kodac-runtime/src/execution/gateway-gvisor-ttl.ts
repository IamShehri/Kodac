import { createHash } from "node:crypto"

const SHA256 = /^[0-9a-f]{64}$/
const UINT = /^(?:0|[1-9][0-9]*)$/
const BOOT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const CONTAINER_ID = /^[0-9a-f]{64}$/
const WATCHDOG_HASH_PREFIX = "KODAC-H4-R3G-D-WATCHDOG"
const WATCHDOG_HASH_VERSION = "V1"
const WATCHDOG_ARM_LINE_VERSION = "kodac-gvisor-ttl-arm-v1"
const MAX_UINT64 = 18_446_744_073_709_551_615n

export interface GvisorTtlPhysicalArmExpectation {
  readonly armOperationIdentity: string
  readonly canonicalArmPayloadDigest: string
  readonly executionAttemptIdentity: string
  readonly requirementIdentity: string
  readonly workloadIdentity: string
  readonly containerBindingIdentity: string
  readonly containerId: string
  readonly runtimeInstanceIdentity: string
  readonly ttlMs: number
  readonly watchdogImplementationIdentity: string
  readonly socketDevice: string
  readonly socketInode: string
  readonly peerPid: number
  readonly peerUid: string
  readonly peerGid: string
  readonly processStartTicks: string
  readonly executableDevice: string
  readonly executableInode: string
  readonly executableSize: string
  readonly runscArtifactIdentity: string
  readonly verifiedRunscSha256: string
  readonly expectedLinuxBootId: string
}

export interface GvisorTtlPhysicalArmAcknowledgement {
  readonly version: typeof WATCHDOG_ARM_LINE_VERSION
  readonly leaseIdentity: string
  readonly armOperationIdentity: string
  readonly runtimeInstanceIdentity: string
  readonly controlPeerBindingIdentity: string
  readonly runscArtifactIdentity: string
  readonly verifiedRunscSha256: string
  readonly watchdogRegistryRecordIdentity: string
  readonly clockDomainIdentity: string
  readonly linuxBootId: string
  readonly leaseStartBoottimeNs: string
  readonly deadlineBoottimeNs: string
  readonly ownerInstanceIdentity: string
  readonly terminalFenceToken: string
  readonly claimRecordIdentity: string
  readonly physicalArmAcknowledgementIdentity: string
}

function sha256(value: unknown, label: string): string {
  if (typeof value !== "string" || !SHA256.test(value)) throw new TypeError(`${label} must be a lowercase SHA-256 identity`)
  return value
}

function uint(value: unknown, label: string, allowZero = true): string {
  if (typeof value !== "string" || !UINT.test(value)) throw new TypeError(`${label} must be canonical unsigned decimal`)
  const parsed = BigInt(value)
  if ((!allowZero && parsed === 0n) || parsed > MAX_UINT64) throw new TypeError(`${label} is outside uint64 range`)
  return value
}

function pid(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0 || value > 2_147_483_647) throw new TypeError("peerPid must be a positive Linux pid")
  return value
}

function containerId(value: unknown): string {
  if (typeof value !== "string" || !CONTAINER_ID.test(value)) throw new TypeError("containerId must be exactly 64 lowercase hexadecimal characters")
  return value
}

function canonicalTtl(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0 || value > 86_400_000) throw new TypeError("ttlMs must be an integer in 1..86400000")
  return value
}

function bootId(value: unknown): string {
  if (typeof value !== "string" || !BOOT_ID.test(value)) throw new TypeError("linuxBootId must be a canonical lowercase Linux boot id")
  return value
}

function component(value: string): Buffer {
  if (value.length === 0 || value.includes("\0")) throw new TypeError("watchdog protocol hash components must be non-empty and NUL-free")
  return Buffer.from(value, "utf8")
}

export function createGvisorTtlWatchdogProtocolIdentity(domain: string, parts: readonly string[]): string {
  if (!/^[A-Z0-9_]+$/.test(domain)) throw new TypeError("watchdog protocol hash domain must be canonical uppercase ASCII")
  const digest = createHash("sha256")
  for (const value of [WATCHDOG_HASH_PREFIX, domain, WATCHDOG_HASH_VERSION, ...parts]) {
    digest.update(component(value))
    digest.update(Buffer.of(0))
  }
  return digest.digest("hex")
}

export function createGvisorTtlPhysicalControlPeerIdentity(expectation: GvisorTtlPhysicalArmExpectation): string {
  const expected = validateExpectation(expectation)
  return createGvisorTtlWatchdogProtocolIdentity("CONTROL_PEER", [
    expected.runtimeInstanceIdentity,
    expected.containerId,
    expected.socketDevice,
    expected.socketInode,
    String(expected.peerPid),
    expected.peerUid,
    expected.peerGid,
    expected.processStartTicks,
    expected.executableDevice,
    expected.executableInode,
    expected.executableSize,
    expected.verifiedRunscSha256,
  ])
}

export function createGvisorTtlPhysicalClockDomainIdentity(linuxBootId: string): string {
  return createGvisorTtlWatchdogProtocolIdentity("CLOCK_DOMAIN", [bootId(linuxBootId), "CLOCK_BOOTTIME"])
}

export function createGvisorTtlPhysicalLeaseIdentity(expectation: GvisorTtlPhysicalArmExpectation, acknowledgement: Pick<GvisorTtlPhysicalArmAcknowledgement, "linuxBootId" | "leaseStartBoottimeNs" | "deadlineBoottimeNs">): string {
  const expected = validateExpectation(expectation)
  return createGvisorTtlWatchdogProtocolIdentity("LEASE", [
    expected.armOperationIdentity,
    expected.canonicalArmPayloadDigest,
    expected.runtimeInstanceIdentity,
    bootId(acknowledgement.linuxBootId),
    uint(acknowledgement.leaseStartBoottimeNs, "leaseStartBoottimeNs"),
    uint(acknowledgement.deadlineBoottimeNs, "deadlineBoottimeNs"),
    expected.watchdogImplementationIdentity,
  ])
}

export function createGvisorTtlPhysicalClaimRecordIdentity(expectation: GvisorTtlPhysicalArmExpectation, acknowledgement: Pick<GvisorTtlPhysicalArmAcknowledgement, "ownerInstanceIdentity" | "terminalFenceToken" | "linuxBootId">): string {
  const expected = validateExpectation(expectation)
  return createGvisorTtlWatchdogProtocolIdentity("OWNER_CLAIM", [
    expected.armOperationIdentity,
    sha256(acknowledgement.ownerInstanceIdentity, "ownerInstanceIdentity"),
    uint(acknowledgement.terminalFenceToken, "terminalFenceToken", false),
    bootId(acknowledgement.linuxBootId),
  ])
}

export function createGvisorTtlPhysicalRegistryRecordIdentity(expectation: GvisorTtlPhysicalArmExpectation, acknowledgement: Pick<GvisorTtlPhysicalArmAcknowledgement, "leaseIdentity" | "linuxBootId" | "clockDomainIdentity" | "leaseStartBoottimeNs" | "deadlineBoottimeNs" | "ownerInstanceIdentity" | "terminalFenceToken" | "claimRecordIdentity">): string {
  const expected = validateExpectation(expectation)
  return createGvisorTtlWatchdogProtocolIdentity("LEASE_REGISTRY", [
    "kodac-h4-r3g-d-watchdog-lease-v1",
    expected.armOperationIdentity,
    expected.canonicalArmPayloadDigest,
    sha256(acknowledgement.leaseIdentity, "leaseIdentity"),
    expected.executionAttemptIdentity,
    expected.requirementIdentity,
    expected.workloadIdentity,
    expected.containerBindingIdentity,
    expected.containerId,
    expected.runtimeInstanceIdentity,
    String(expected.ttlMs),
    bootId(acknowledgement.linuxBootId),
    sha256(acknowledgement.clockDomainIdentity, "clockDomainIdentity"),
    uint(acknowledgement.leaseStartBoottimeNs, "leaseStartBoottimeNs"),
    uint(acknowledgement.deadlineBoottimeNs, "deadlineBoottimeNs"),
    expected.watchdogImplementationIdentity,
    sha256(acknowledgement.ownerInstanceIdentity, "ownerInstanceIdentity"),
    uint(acknowledgement.terminalFenceToken, "terminalFenceToken", false),
    sha256(acknowledgement.claimRecordIdentity, "claimRecordIdentity"),
  ])
}

export function createGvisorTtlPhysicalArmAcknowledgementIdentity(expectation: GvisorTtlPhysicalArmExpectation, acknowledgement: Omit<GvisorTtlPhysicalArmAcknowledgement, "physicalArmAcknowledgementIdentity">): string {
  const expected = validateExpectation(expectation)
  return createGvisorTtlWatchdogProtocolIdentity("PHYSICAL_ARM_ACK", [
    sha256(acknowledgement.leaseIdentity, "leaseIdentity"),
    expected.armOperationIdentity,
    expected.runtimeInstanceIdentity,
    sha256(acknowledgement.controlPeerBindingIdentity, "controlPeerBindingIdentity"),
    expected.runscArtifactIdentity,
    expected.verifiedRunscSha256,
    sha256(acknowledgement.watchdogRegistryRecordIdentity, "watchdogRegistryRecordIdentity"),
    sha256(acknowledgement.clockDomainIdentity, "clockDomainIdentity"),
    bootId(acknowledgement.linuxBootId),
    sha256(acknowledgement.ownerInstanceIdentity, "ownerInstanceIdentity"),
    sha256(acknowledgement.claimRecordIdentity, "claimRecordIdentity"),
  ])
}

function validateExpectation(value: GvisorTtlPhysicalArmExpectation): GvisorTtlPhysicalArmExpectation {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError("physical arm expectation must be an object")
  return Object.freeze({
    armOperationIdentity: sha256(value.armOperationIdentity, "armOperationIdentity"),
    canonicalArmPayloadDigest: sha256(value.canonicalArmPayloadDigest, "canonicalArmPayloadDigest"),
    executionAttemptIdentity: sha256(value.executionAttemptIdentity, "executionAttemptIdentity"),
    requirementIdentity: sha256(value.requirementIdentity, "requirementIdentity"),
    workloadIdentity: sha256(value.workloadIdentity, "workloadIdentity"),
    containerBindingIdentity: sha256(value.containerBindingIdentity, "containerBindingIdentity"),
    containerId: containerId(value.containerId),
    runtimeInstanceIdentity: sha256(value.runtimeInstanceIdentity, "runtimeInstanceIdentity"),
    ttlMs: canonicalTtl(value.ttlMs),
    watchdogImplementationIdentity: sha256(value.watchdogImplementationIdentity, "watchdogImplementationIdentity"),
    socketDevice: uint(value.socketDevice, "socketDevice", false),
    socketInode: uint(value.socketInode, "socketInode", false),
    peerPid: pid(value.peerPid),
    peerUid: uint(value.peerUid, "peerUid"),
    peerGid: uint(value.peerGid, "peerGid"),
    processStartTicks: uint(value.processStartTicks, "processStartTicks", false),
    executableDevice: uint(value.executableDevice, "executableDevice", false),
    executableInode: uint(value.executableInode, "executableInode", false),
    executableSize: uint(value.executableSize, "executableSize", false),
    runscArtifactIdentity: sha256(value.runscArtifactIdentity, "runscArtifactIdentity"),
    verifiedRunscSha256: sha256(value.verifiedRunscSha256, "verifiedRunscSha256"),
    expectedLinuxBootId: bootId(value.expectedLinuxBootId),
  })
}

function parseArmLine(line: string): GvisorTtlPhysicalArmAcknowledgement {
  if (typeof line !== "string" || line.length === 0 || Buffer.byteLength(line, "utf8") > 32 * 1024 || line.includes("\0") || line.includes("\n") || line.includes("\r")) throw new TypeError("physical arm acknowledgement must be one bounded line")
  const tokens = line.split(" ")
  const expectedKeys = [
    "lease",
    "arm-operation",
    "runtime-instance",
    "control-peer",
    "runsc-artifact",
    "verified-runsc-sha256",
    "registry-record",
    "clock-domain",
    "boot-id",
    "lease-start-boottime-ns",
    "deadline-boottime-ns",
    "owner-instance",
    "terminal-fence-token",
    "claim-record",
    "physical-ack",
  ] as const
  if (tokens.length !== expectedKeys.length + 1 || tokens[0] !== WATCHDOG_ARM_LINE_VERSION) throw new TypeError("physical arm acknowledgement grammar mismatch")
  const values = new Map<string, string>()
  for (let index = 0; index < expectedKeys.length; index += 1) {
    const token = tokens[index + 1]
    const split = token.indexOf("=")
    if (split <= 0 || token.indexOf("=", split + 1) !== -1) throw new TypeError("physical arm acknowledgement field grammar mismatch")
    const key = token.slice(0, split)
    const value = token.slice(split + 1)
    if (key !== expectedKeys[index] || value.length === 0) throw new TypeError("physical arm acknowledgement field order/name mismatch")
    values.set(key, value)
  }
  return Object.freeze({
    version: WATCHDOG_ARM_LINE_VERSION,
    leaseIdentity: sha256(values.get("lease"), "leaseIdentity"),
    armOperationIdentity: sha256(values.get("arm-operation"), "armOperationIdentity"),
    runtimeInstanceIdentity: sha256(values.get("runtime-instance"), "runtimeInstanceIdentity"),
    controlPeerBindingIdentity: sha256(values.get("control-peer"), "controlPeerBindingIdentity"),
    runscArtifactIdentity: sha256(values.get("runsc-artifact"), "runscArtifactIdentity"),
    verifiedRunscSha256: sha256(values.get("verified-runsc-sha256"), "verifiedRunscSha256"),
    watchdogRegistryRecordIdentity: sha256(values.get("registry-record"), "watchdogRegistryRecordIdentity"),
    clockDomainIdentity: sha256(values.get("clock-domain"), "clockDomainIdentity"),
    linuxBootId: bootId(values.get("boot-id")),
    leaseStartBoottimeNs: uint(values.get("lease-start-boottime-ns"), "leaseStartBoottimeNs"),
    deadlineBoottimeNs: uint(values.get("deadline-boottime-ns"), "deadlineBoottimeNs"),
    ownerInstanceIdentity: sha256(values.get("owner-instance"), "ownerInstanceIdentity"),
    terminalFenceToken: uint(values.get("terminal-fence-token"), "terminalFenceToken", false),
    claimRecordIdentity: sha256(values.get("claim-record"), "claimRecordIdentity"),
    physicalArmAcknowledgementIdentity: sha256(values.get("physical-ack"), "physicalArmAcknowledgementIdentity"),
  })
}

export function validateGvisorTtlPhysicalArmAcknowledgement(line: string, expectationValue: GvisorTtlPhysicalArmExpectation): GvisorTtlPhysicalArmAcknowledgement {
  const expectation = validateExpectation(expectationValue)
  const acknowledgement = parseArmLine(line)
  if (acknowledgement.armOperationIdentity !== expectation.armOperationIdentity || acknowledgement.runtimeInstanceIdentity !== expectation.runtimeInstanceIdentity || acknowledgement.runscArtifactIdentity !== expectation.runscArtifactIdentity || acknowledgement.verifiedRunscSha256 !== expectation.verifiedRunscSha256) throw new TypeError("physical arm acknowledgement subject/artifact identity mismatch")
  if (acknowledgement.linuxBootId !== expectation.expectedLinuxBootId) throw new TypeError("physical arm acknowledgement Linux boot identity mismatch")
  const expectedDeadline = BigInt(acknowledgement.leaseStartBoottimeNs) + BigInt(expectation.ttlMs) * 1_000_000n
  if (expectedDeadline > MAX_UINT64 || acknowledgement.deadlineBoottimeNs !== expectedDeadline.toString()) throw new TypeError("physical arm acknowledgement immutable deadline mismatch")
  const expectedClockDomain = createGvisorTtlPhysicalClockDomainIdentity(acknowledgement.linuxBootId)
  if (acknowledgement.clockDomainIdentity !== expectedClockDomain) throw new TypeError("physical arm acknowledgement clock-domain identity mismatch")
  const expectedLease = createGvisorTtlPhysicalLeaseIdentity(expectation, acknowledgement)
  if (acknowledgement.leaseIdentity !== expectedLease) throw new TypeError("physical arm acknowledgement lease identity mismatch")
  const expectedClaim = createGvisorTtlPhysicalClaimRecordIdentity(expectation, acknowledgement)
  if (acknowledgement.claimRecordIdentity !== expectedClaim) throw new TypeError("physical arm acknowledgement owner-claim identity mismatch")
  const expectedControlPeer = createGvisorTtlPhysicalControlPeerIdentity(expectation)
  if (acknowledgement.controlPeerBindingIdentity !== expectedControlPeer) throw new TypeError("physical arm acknowledgement control-peer identity mismatch")
  const expectedRegistry = createGvisorTtlPhysicalRegistryRecordIdentity(expectation, acknowledgement)
  if (acknowledgement.watchdogRegistryRecordIdentity !== expectedRegistry) throw new TypeError("physical arm acknowledgement durable registry identity mismatch")
  const { physicalArmAcknowledgementIdentity: _ignored, ...withoutIdentity } = acknowledgement
  const expectedPhysicalAck = createGvisorTtlPhysicalArmAcknowledgementIdentity(expectation, withoutIdentity)
  if (acknowledgement.physicalArmAcknowledgementIdentity !== expectedPhysicalAck) throw new TypeError("physical arm acknowledgement identity mismatch")
  return acknowledgement
}
