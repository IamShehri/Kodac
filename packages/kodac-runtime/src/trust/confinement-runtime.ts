import { createHash } from "node:crypto"
import { posix } from "node:path"
import { types as utilTypes } from "node:util"

import {
  validateConfinementEnforcementEvidence,
  validateConfinementRequest,
  type ConfinementEnforcementEvidence,
  type ConfinementRequest,
} from "./confinement.ts"
import {
  KDO_H4_R2B_LINUX_LANDLOCK_CLAIM_SET,
  KDO_H4_R2B_LINUX_LANDLOCK_FULL_CLAIM_ABI,
  createLinuxLandlockBackendDescriptor,
} from "./confinement-linux-landlock.ts"

export const KDO_H4_R2C_EXECUTION_ATTEMPT_VERSION = "kodac-h4-r2c-execution-attempt-v1" as const
export const KDO_H4_R2C_WORKSPACE_ROOT_VERSION = "kodac-h4-r2c-workspace-root-v1" as const
export const KDO_H4_R2C_LAUNCHER_OBSERVATION_VERSION = "kodac-h4-r2c-launcher-observation-v1" as const
export const KDO_H4_R2C_EVIDENCE_RECORD_VERSION = "kodac-h4-r2c-confinement-record-v1" as const
export const KDO_H4_R2C_EVIDENCE_COMMIT_VERSION = "kodac-h4-r2c-confinement-commit-v1" as const
export const KDO_H4_R2C_RUNTIME_VERSION = "kodac-h4-r2c-linux-landlock-runtime-v1" as const
export const KDO_H4_R2C_RECEIPT_BINDING_VERSION = "kodac-h4-r2c-confinement-receipt-v1" as const
export const KDO_H4_R2C_CONTROL_FLAG = "--controlled" as const
export const KDO_H4_R2C_LAUNCHER_FD = 3 as const
export const KDO_H4_R2C_READY_FD = 4 as const
export const KDO_H4_R2C_PERMIT_FD = 5 as const
export const KDO_H4_R2C_READY_MAX_BYTES = 128 as const
export const KDO_H4_R2C_PERMIT_MAX_BYTES = 4 as const
export const KDO_H4_R2C_MAX_LAUNCHER_BYTES = 4 * 1024 * 1024

const MAX_NONCE_BYTES = 128
const MAX_PATH_BYTES = 4096

type ObservedReadyEnforcement = "full" | "partial"

export interface ConfinementExecutionAttempt {
  version: typeof KDO_H4_R2C_EXECUTION_ATTEMPT_VERSION
  executionAttemptIdentity: string
  executionIntentIdentity: string
  nonce: string
}

export interface LauncherArtifactObservation {
  version: typeof KDO_H4_R2C_LAUNCHER_OBSERVATION_VERSION
  observationIdentity: string
  launcherPath: string
  sha256: string
  sizeBytes: number
}

export interface LinuxLandlockReadyRecord {
  abi: number
  claimSet: typeof KDO_H4_R2B_LINUX_LANDLOCK_CLAIM_SET
  enforcement: ObservedReadyEnforcement
}

export interface DurableConfinementEvidenceRecord {
  version: typeof KDO_H4_R2C_EVIDENCE_RECORD_VERSION
  recordIdentity: string
  executionAttempt: ConfinementExecutionAttempt
  request: ConfinementRequest
  enforcementEvidence: ConfinementEnforcementEvidence
  launcherArtifact: LauncherArtifactObservation
  claimSet: typeof KDO_H4_R2B_LINUX_LANDLOCK_CLAIM_SET
}

export interface DurableConfinementEvidenceCommit {
  version: typeof KDO_H4_R2C_EVIDENCE_COMMIT_VERSION
  recordIdentity: string
  acknowledgmentIdentity: string
  durability: "durable"
}

export interface ConfinementEvidenceSink {
  commit(record: DurableConfinementEvidenceRecord): Promise<unknown> | unknown
}

export interface LinuxLandlockRuntimeConfig {
  version: typeof KDO_H4_R2C_RUNTIME_VERSION
  launcherPath: string
  expectedLauncherSha256: string
  evidence: ConfinementEvidenceSink
  requiredEnforcement: "full"
}

export interface ConfinementReceiptBinding {
  version: typeof KDO_H4_R2C_RECEIPT_BINDING_VERSION
  requestIdentity: string
  executionAttemptIdentity: string
  backendIdentity: string
  enforcementEvidenceIdentity: string
  durableRecordIdentity: string
  durableCommitAcknowledgmentIdentity: string
  launcherArtifactSha256: string
  claimSet: typeof KDO_H4_R2B_LINUX_LANDLOCK_CLAIM_SET
  enforcement: ObservedReadyEnforcement
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

function byteLength(value: string): number {
  return Buffer.byteLength(value, "utf8")
}

function asPlainRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value) || utilTypes.isProxy(value)) {
    throw new TypeError(`${label} must be a non-proxy plain object`)
  }
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain object`)
  if (Object.getOwnPropertySymbols(value).length !== 0) throw new TypeError(`${label} must not contain symbol fields`)
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (descriptor.get !== undefined || descriptor.set !== undefined) throw new TypeError(`${label}.${key} must be a data property`)
    if (!descriptor.enumerable) throw new TypeError(`${label}.${key} must be enumerable`)
  }
  return value as Record<string, unknown>
}

function exactKeys(record: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(record).sort()
  const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new TypeError(`${label} must contain exactly: ${wanted.join(", ")}`)
  }
}

function boundedString(value: unknown, label: string, maxBytes: number): string {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(`${label} must be a non-empty string`)
  if (value.includes("\0")) throw new TypeError(`${label} must not contain NUL`)
  if (byteLength(value) > maxBytes) throw new TypeError(`${label} exceeds ${maxBytes} UTF-8 bytes`)
  return value
}

function requireIdentity(value: unknown, label: string): string {
  const identity = boundedString(value, label, 64)
  if (!/^[0-9a-f]{64}$/.test(identity)) throw new TypeError(`${label} must be a lowercase SHA-256 identity`)
  return identity
}

function absoluteCanonicalPath(value: unknown, label: string): string {
  const path = boundedString(value, label, MAX_PATH_BYTES)
  if (!posix.isAbsolute(path)) throw new TypeError(`${label} must be an absolute POSIX path`)
  if (path.length > 1 && path.endsWith("/")) throw new TypeError(`${label} must not contain a trailing slash`)
  if (posix.normalize(path) !== path) throw new TypeError(`${label} must be canonical`)
  return path
}

function positiveBoundedInteger(value: unknown, label: string, maximum: number): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0 || value > maximum) {
    throw new TypeError(`${label} must be an integer from 1 through ${maximum}`)
  }
  return value
}

function requireObservedEnforcement(value: unknown): ObservedReadyEnforcement {
  if (value !== "full" && value !== "partial") throw new TypeError("observed enforcement must be full or partial")
  return value
}

export function createConfinementExecutionAttempt(input: {
  executionIntentIdentity: string
  nonce: string
}): ConfinementExecutionAttempt {
  const record = asPlainRecord(input, "confinement execution-attempt input")
  exactKeys(record, ["executionIntentIdentity", "nonce"], "confinement execution-attempt input")
  const executionIntentIdentity = requireIdentity(record.executionIntentIdentity, "executionIntentIdentity")
  const nonce = boundedString(record.nonce, "execution-attempt nonce", MAX_NONCE_BYTES)
  const base = Object.freeze({
    version: KDO_H4_R2C_EXECUTION_ATTEMPT_VERSION,
    executionIntentIdentity,
    nonce,
  })
  return Object.freeze({
    ...base,
    executionAttemptIdentity: sha256(JSON.stringify(base)),
  })
}

export function validateConfinementExecutionAttempt(value: unknown): ConfinementExecutionAttempt {
  const record = asPlainRecord(value, "confinement execution attempt")
  exactKeys(record, ["version", "executionAttemptIdentity", "executionIntentIdentity", "nonce"], "confinement execution attempt")
  if (record.version !== KDO_H4_R2C_EXECUTION_ATTEMPT_VERSION) throw new TypeError("execution-attempt version mismatch")
  const rebuilt = createConfinementExecutionAttempt({
    executionIntentIdentity: requireIdentity(record.executionIntentIdentity, "executionIntentIdentity"),
    nonce: boundedString(record.nonce, "execution-attempt nonce", MAX_NONCE_BYTES),
  })
  if (requireIdentity(record.executionAttemptIdentity, "executionAttemptIdentity") !== rebuilt.executionAttemptIdentity) {
    throw new TypeError("execution-attempt identity mismatch")
  }
  return rebuilt
}

export function createLocalWorkspaceRootIdentity(root: string): string {
  const canonical = absoluteCanonicalPath(root, "workspace root")
  return sha256(`${KDO_H4_R2C_WORKSPACE_ROOT_VERSION}\n${canonical}`)
}

export function createLauncherArtifactObservation(input: {
  launcherPath: string
  sha256: string
  sizeBytes: number
}): LauncherArtifactObservation {
  const record = asPlainRecord(input, "launcher artifact observation input")
  exactKeys(record, ["launcherPath", "sha256", "sizeBytes"], "launcher artifact observation input")
  const launcherPath = absoluteCanonicalPath(record.launcherPath, "launcherPath")
  const digest = requireIdentity(record.sha256, "launcher artifact sha256")
  const sizeBytes = positiveBoundedInteger(record.sizeBytes, "launcher artifact sizeBytes", KDO_H4_R2C_MAX_LAUNCHER_BYTES)
  const base = Object.freeze({
    version: KDO_H4_R2C_LAUNCHER_OBSERVATION_VERSION,
    launcherPath,
    sha256: digest,
    sizeBytes,
  })
  return Object.freeze({ ...base, observationIdentity: sha256(JSON.stringify(base)) })
}

export function validateLauncherArtifactObservation(value: unknown): LauncherArtifactObservation {
  const record = asPlainRecord(value, "launcher artifact observation")
  exactKeys(record, ["version", "observationIdentity", "launcherPath", "sha256", "sizeBytes"], "launcher artifact observation")
  if (record.version !== KDO_H4_R2C_LAUNCHER_OBSERVATION_VERSION) throw new TypeError("launcher observation version mismatch")
  const rebuilt = createLauncherArtifactObservation({
    launcherPath: absoluteCanonicalPath(record.launcherPath, "launcherPath"),
    sha256: requireIdentity(record.sha256, "launcher artifact sha256"),
    sizeBytes: positiveBoundedInteger(record.sizeBytes, "launcher artifact sizeBytes", KDO_H4_R2C_MAX_LAUNCHER_BYTES),
  })
  if (requireIdentity(record.observationIdentity, "launcher observation identity") !== rebuilt.observationIdentity) {
    throw new TypeError("launcher observation identity mismatch")
  }
  return rebuilt
}

export function parseLinuxLandlockReadyRecord(value: string | Uint8Array): LinuxLandlockReadyRecord {
  const bytes = typeof value === "string" ? Buffer.from(value, "utf8") : Buffer.from(value)
  if (bytes.byteLength === 0 || bytes.byteLength > KDO_H4_R2C_READY_MAX_BYTES) {
    throw new TypeError(`Landlock readiness record must contain 1..${KDO_H4_R2C_READY_MAX_BYTES} bytes`)
  }
  for (const byte of bytes) {
    if (byte > 0x7f) throw new TypeError("Landlock readiness record must be ASCII")
  }
  const text = bytes.toString("ascii")
  const match = /^kodac-landlock-ready-v1 abi=([1-9][0-9]*) claim-set=kodac-linux-landlock-fs-v1 enforcement=(full|partial)\n$/.exec(text)
  if (!match) throw new TypeError("Landlock readiness record is malformed")
  const abi = Number(match[1])
  if (!Number.isSafeInteger(abi) || abi <= 0) throw new TypeError("Landlock readiness ABI is invalid")
  const enforcement = requireObservedEnforcement(match[2])
  if (enforcement === "full" && abi < KDO_H4_R2B_LINUX_LANDLOCK_FULL_CLAIM_ABI) {
    throw new TypeError("Landlock readiness cannot claim full below the local claim ABI")
  }
  if (enforcement === "partial" && abi >= KDO_H4_R2B_LINUX_LANDLOCK_FULL_CLAIM_ABI) {
    throw new TypeError("Landlock readiness cannot claim partial at or above the local claim ABI")
  }
  return Object.freeze({ abi, claimSet: KDO_H4_R2B_LINUX_LANDLOCK_CLAIM_SET, enforcement })
}

export function linuxLandlockReadyReason(ready: LinuxLandlockReadyRecord): string {
  const record = asPlainRecord(ready, "Landlock readiness record")
  exactKeys(record, ["abi", "claimSet", "enforcement"], "Landlock readiness record")
  if (record.claimSet !== KDO_H4_R2B_LINUX_LANDLOCK_CLAIM_SET) throw new TypeError("Landlock readiness claim set mismatch")
  const abi = positiveBoundedInteger(record.abi, "Landlock readiness ABI", Number.MAX_SAFE_INTEGER)
  const enforcement = requireObservedEnforcement(record.enforcement)
  return `Landlock READY abi=${abi} claim-set=${KDO_H4_R2B_LINUX_LANDLOCK_CLAIM_SET} enforcement=${enforcement}`
}

function evidenceSink(value: unknown): ConfinementEvidenceSink {
  const record = asPlainRecord(value, "confinement evidence sink")
  exactKeys(record, ["commit"], "confinement evidence sink")
  const descriptor = Object.getOwnPropertyDescriptor(record, "commit")
  if (descriptor === undefined || !("value" in descriptor) || typeof descriptor.value !== "function") {
    throw new TypeError("confinement evidence sink commit must be a callable data property")
  }
  const commit = descriptor.value as ConfinementEvidenceSink["commit"]
  return Object.freeze({ commit })
}

export function createLinuxLandlockRuntimeConfig(input: {
  launcherPath: string
  expectedLauncherSha256: string
  evidence: ConfinementEvidenceSink
  requiredEnforcement: "full"
}): LinuxLandlockRuntimeConfig {
  const record = asPlainRecord(input, "Linux Landlock runtime input")
  exactKeys(record, ["launcherPath", "expectedLauncherSha256", "evidence", "requiredEnforcement"], "Linux Landlock runtime input")
  if (record.requiredEnforcement !== "full") throw new TypeError("R2C required enforcement must be full")
  return Object.freeze({
    version: KDO_H4_R2C_RUNTIME_VERSION,
    launcherPath: absoluteCanonicalPath(record.launcherPath, "launcherPath"),
    expectedLauncherSha256: requireIdentity(record.expectedLauncherSha256, "expectedLauncherSha256"),
    evidence: evidenceSink(record.evidence),
    requiredEnforcement: "full",
  })
}

export function validateLinuxLandlockRuntimeConfig(value: unknown): LinuxLandlockRuntimeConfig {
  const record = asPlainRecord(value, "Linux Landlock runtime config")
  exactKeys(record, ["version", "launcherPath", "expectedLauncherSha256", "evidence", "requiredEnforcement"], "Linux Landlock runtime config")
  if (record.version !== KDO_H4_R2C_RUNTIME_VERSION) throw new TypeError("Linux Landlock runtime version mismatch")
  return createLinuxLandlockRuntimeConfig({
    launcherPath: absoluteCanonicalPath(record.launcherPath, "launcherPath"),
    expectedLauncherSha256: requireIdentity(record.expectedLauncherSha256, "expectedLauncherSha256"),
    evidence: evidenceSink(record.evidence),
    requiredEnforcement: record.requiredEnforcement === "full" ? "full" : (() => { throw new TypeError("R2C required enforcement must be full") })(),
  })
}

function recordBase(input: {
  executionAttempt: ConfinementExecutionAttempt
  request: ConfinementRequest
  enforcementEvidence: ConfinementEnforcementEvidence
  launcherArtifact: LauncherArtifactObservation
}) {
  const executionAttempt = validateConfinementExecutionAttempt(input.executionAttempt)
  const request = validateConfinementRequest(input.request)
  const enforcementEvidence = validateConfinementEnforcementEvidence(input.enforcementEvidence)
  const launcherArtifact = validateLauncherArtifactObservation(input.launcherArtifact)
  if (request.mode !== "read-only" || request.scope.writePaths.length !== 0) {
    throw new TypeError("R2C durable evidence requires a read-only request with no write paths")
  }
  if (request.executionIntentIdentity !== executionAttempt.executionIntentIdentity) {
    throw new TypeError("R2C request execution intent does not match execution attempt")
  }
  if (enforcementEvidence.requestIdentity !== request.requestIdentity) {
    throw new TypeError("R2C enforcement evidence request identity mismatch")
  }
  if (enforcementEvidence.executionAttemptIdentity !== executionAttempt.executionAttemptIdentity) {
    throw new TypeError("R2C enforcement evidence attempt identity mismatch")
  }
  if (enforcementEvidence.enforcement !== "full" && enforcementEvidence.enforcement !== "partial") {
    throw new TypeError("R2C durable observed evidence must be full or partial")
  }
  const expectedBackend = createLinuxLandlockBackendDescriptor()
  if (enforcementEvidence.backend.backendIdentity !== expectedBackend.backendIdentity) {
    throw new TypeError("R2C enforcement evidence backend identity mismatch")
  }
  return Object.freeze({
    version: KDO_H4_R2C_EVIDENCE_RECORD_VERSION,
    executionAttempt,
    request,
    enforcementEvidence,
    launcherArtifact,
    claimSet: KDO_H4_R2B_LINUX_LANDLOCK_CLAIM_SET,
  })
}

export function createDurableConfinementEvidenceRecord(input: {
  executionAttempt: ConfinementExecutionAttempt
  request: ConfinementRequest
  enforcementEvidence: ConfinementEnforcementEvidence
  launcherArtifact: LauncherArtifactObservation
}): DurableConfinementEvidenceRecord {
  const record = asPlainRecord(input, "durable confinement evidence input")
  exactKeys(record, ["executionAttempt", "request", "enforcementEvidence", "launcherArtifact"], "durable confinement evidence input")
  const base = recordBase({
    executionAttempt: record.executionAttempt as ConfinementExecutionAttempt,
    request: record.request as ConfinementRequest,
    enforcementEvidence: record.enforcementEvidence as ConfinementEnforcementEvidence,
    launcherArtifact: record.launcherArtifact as LauncherArtifactObservation,
  })
  return Object.freeze({ ...base, recordIdentity: sha256(JSON.stringify(base)) })
}

export function validateDurableConfinementEvidenceRecord(value: unknown): DurableConfinementEvidenceRecord {
  const record = asPlainRecord(value, "durable confinement evidence record")
  exactKeys(record, ["version", "recordIdentity", "executionAttempt", "request", "enforcementEvidence", "launcherArtifact", "claimSet"], "durable confinement evidence record")
  if (record.version !== KDO_H4_R2C_EVIDENCE_RECORD_VERSION) throw new TypeError("durable confinement evidence version mismatch")
  if (record.claimSet !== KDO_H4_R2B_LINUX_LANDLOCK_CLAIM_SET) throw new TypeError("durable confinement evidence claim set mismatch")
  const rebuilt = createDurableConfinementEvidenceRecord({
    executionAttempt: record.executionAttempt as ConfinementExecutionAttempt,
    request: record.request as ConfinementRequest,
    enforcementEvidence: record.enforcementEvidence as ConfinementEnforcementEvidence,
    launcherArtifact: record.launcherArtifact as LauncherArtifactObservation,
  })
  if (requireIdentity(record.recordIdentity, "durable confinement record identity") !== rebuilt.recordIdentity) {
    throw new TypeError("durable confinement record identity mismatch")
  }
  return rebuilt
}

export function createDurableConfinementEvidenceCommit(record: DurableConfinementEvidenceRecord): DurableConfinementEvidenceCommit {
  const validated = validateDurableConfinementEvidenceRecord(record)
  const base = Object.freeze({
    version: KDO_H4_R2C_EVIDENCE_COMMIT_VERSION,
    recordIdentity: validated.recordIdentity,
    durability: "durable" as const,
  })
  return Object.freeze({ ...base, acknowledgmentIdentity: sha256(JSON.stringify(base)) })
}

export function validateDurableConfinementEvidenceCommit(
  value: unknown,
  record: DurableConfinementEvidenceRecord,
): DurableConfinementEvidenceCommit {
  const source = asPlainRecord(value, "durable confinement evidence commit")
  exactKeys(source, ["version", "recordIdentity", "acknowledgmentIdentity", "durability"], "durable confinement evidence commit")
  if (source.version !== KDO_H4_R2C_EVIDENCE_COMMIT_VERSION) throw new TypeError("durable confinement commit version mismatch")
  if (source.durability !== "durable") throw new TypeError("durable confinement commit must attest durable persistence")
  const expected = createDurableConfinementEvidenceCommit(record)
  if (requireIdentity(source.recordIdentity, "durable confinement commit record identity") !== expected.recordIdentity) {
    throw new TypeError("durable confinement commit record identity mismatch")
  }
  if (requireIdentity(source.acknowledgmentIdentity, "durable confinement commit acknowledgment identity") !== expected.acknowledgmentIdentity) {
    throw new TypeError("durable confinement commit acknowledgment identity mismatch")
  }
  return expected
}

export function createConfinementReceiptBinding(input: {
  record: DurableConfinementEvidenceRecord
  commit: DurableConfinementEvidenceCommit
}): ConfinementReceiptBinding {
  const source = asPlainRecord(input, "confinement receipt binding input")
  exactKeys(source, ["record", "commit"], "confinement receipt binding input")
  const record = validateDurableConfinementEvidenceRecord(source.record)
  const commit = validateDurableConfinementEvidenceCommit(source.commit, record)
  return Object.freeze({
    version: KDO_H4_R2C_RECEIPT_BINDING_VERSION,
    requestIdentity: record.request.requestIdentity,
    executionAttemptIdentity: record.executionAttempt.executionAttemptIdentity,
    backendIdentity: record.enforcementEvidence.backend.backendIdentity,
    enforcementEvidenceIdentity: record.enforcementEvidence.evidenceIdentity,
    durableRecordIdentity: record.recordIdentity,
    durableCommitAcknowledgmentIdentity: commit.acknowledgmentIdentity,
    launcherArtifactSha256: record.launcherArtifact.sha256,
    claimSet: KDO_H4_R2B_LINUX_LANDLOCK_CLAIM_SET,
    enforcement: record.enforcementEvidence.enforcement as ObservedReadyEnforcement,
  })
}

export function validateConfinementReceiptBinding(value: unknown): ConfinementReceiptBinding {
  const record = asPlainRecord(value, "confinement receipt binding")
  exactKeys(
    record,
    [
      "version",
      "requestIdentity",
      "executionAttemptIdentity",
      "backendIdentity",
      "enforcementEvidenceIdentity",
      "durableRecordIdentity",
      "durableCommitAcknowledgmentIdentity",
      "launcherArtifactSha256",
      "claimSet",
      "enforcement",
    ],
    "confinement receipt binding",
  )
  if (record.version !== KDO_H4_R2C_RECEIPT_BINDING_VERSION) throw new TypeError("confinement receipt binding version mismatch")
  if (record.claimSet !== KDO_H4_R2B_LINUX_LANDLOCK_CLAIM_SET) throw new TypeError("confinement receipt binding claim set mismatch")
  return Object.freeze({
    version: KDO_H4_R2C_RECEIPT_BINDING_VERSION,
    requestIdentity: requireIdentity(record.requestIdentity, "confinement binding request identity"),
    executionAttemptIdentity: requireIdentity(record.executionAttemptIdentity, "confinement binding attempt identity"),
    backendIdentity: requireIdentity(record.backendIdentity, "confinement binding backend identity"),
    enforcementEvidenceIdentity: requireIdentity(record.enforcementEvidenceIdentity, "confinement binding enforcement identity"),
    durableRecordIdentity: requireIdentity(record.durableRecordIdentity, "confinement binding record identity"),
    durableCommitAcknowledgmentIdentity: requireIdentity(record.durableCommitAcknowledgmentIdentity, "confinement binding commit identity"),
    launcherArtifactSha256: requireIdentity(record.launcherArtifactSha256, "confinement binding launcher sha256"),
    claimSet: KDO_H4_R2B_LINUX_LANDLOCK_CLAIM_SET,
    enforcement: requireObservedEnforcement(record.enforcement),
  })
}
