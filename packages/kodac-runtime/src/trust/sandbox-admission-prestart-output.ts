import { createHash, randomBytes } from "node:crypto"
import { types as utilTypes } from "node:util"

import {
  validateSandboxAdmissionPermit,
  type SandboxAdmissionPermit,
} from "./sandbox-admission-permit.ts"
import {
  validateSandboxDormantCreatedAdmission,
  validateSandboxDormantCreatedAdmissionCommit,
  type SandboxDormantCreatedAdmission,
  type SandboxDormantCreatedAdmissionCommit,
} from "./sandbox-admission-dormant-create.ts"

export const KDO_H4_R4B_B2A_VERSION = "kodac-h4-r4b-b2a-prestart-output-v1" as const
export const KDO_H4_R4B_B2A_PREPARED_VERSION = "kodac-h4-r4b-b2a-prepared-v1" as const
export const KDO_H4_R4B_B2A_PREPARED_COMMIT_VERSION = "kodac-h4-r4b-b2a-prepared-commit-v1" as const
export const KDO_H4_R4B_B2A_STATE_FENCE_VERSION = "kodac-h4-r4b-b2a-state-fence-v1" as const
export const KDO_H4_R4B_B2A_OWNER_CAPABILITY_VERSION = "kodac-h4-r4b-b2a-owner-capability-v1" as const
export const KDO_H4_R4B_B2A_OWNERSHIP_CLAIM_VERSION = "kodac-h4-r4b-b2a-ownership-claim-v1" as const
export const KDO_H4_R4B_B2A_OWNERSHIP_CLAIM_COMMIT_VERSION = "kodac-h4-r4b-b2a-ownership-claim-commit-v1" as const
export const KDO_H4_R4B_B2A_FAILURE_VERSION = "kodac-h4-r4b-b2a-failure-v1" as const
export const KDO_H4_R4B_B2A_FAILURE_COMMIT_VERSION = "kodac-h4-r4b-b2a-failure-commit-v1" as const
export const KDO_H4_R4B_B2A_DURABILITY = "durable" as const

export const KDO_H4_R4B_B2A_FAILURE_PHASES = Object.freeze([
  "prepare",
  "owner-claim",
  "attaching",
  "upgrade-validation",
  "reader-activation",
  "post-attach-revalidation",
  "ready-invalidation",
] as const)
export type SandboxPrestartFailurePhase = (typeof KDO_H4_R4B_B2A_FAILURE_PHASES)[number]

export const KDO_H4_R4B_B2A_FAILURE_CODES = Object.freeze([
  "aborted",
  "socket-namespace-untrusted",
  "socket-client-unauthorized",
  "socket-identity-changed",
  "attach-failed",
  "attach-timeout",
  "attach-protocol-invalid",
  "reader-failed",
  "reader-activation-timeout",
  "payload-before-start",
  "dormant-revalidation-failed",
  "dormant-revalidation-timeout",
  "prestart-total-timeout",
  "owner-lost-graceful",
] as const)
export type SandboxPrestartFailureCode = (typeof KDO_H4_R4B_B2A_FAILURE_CODES)[number]

export type SandboxPrestartState = "PREPARED" | "OWNER_CLAIMED" | "FAILED_TERMINAL"

export interface SandboxPrestartPrepared {
  readonly version: typeof KDO_H4_R4B_B2A_PREPARED_VERSION
  readonly preparedIdentity: string
  readonly executionAttemptIdentity: string
  readonly createdAdmissionIdentity: string
  readonly containerId: string
  readonly requirementIdentity: string
  readonly workloadIdentity: string
  readonly providerIdentity: string
  readonly socketEndpointIdentity: string
  readonly prestartOutputOperationIdentity: string
}

export interface SandboxPrestartPreparedCommit {
  readonly version: typeof KDO_H4_R4B_B2A_PREPARED_COMMIT_VERSION
  readonly preparedIdentity: string
  readonly executionAttemptIdentity: string
  readonly prestartOutputOperationIdentity: string
  readonly disposition: "created"
  readonly durability: typeof KDO_H4_R4B_B2A_DURABILITY
  readonly commitIdentity: string
}

export interface SandboxPrestartStateFence {
  readonly version: typeof KDO_H4_R4B_B2A_STATE_FENCE_VERSION
  readonly preparedIdentity: string
  readonly executionAttemptIdentity: string
  readonly createdAdmissionIdentity: string
  readonly prestartOutputOperationIdentity: string
  readonly state: SandboxPrestartState
  readonly ownershipClaimIdentity: string | null
  readonly ownerInstanceIdentity: string | null
  readonly failureIdentity: string | null
  readonly fenceIdentity: string
}

export interface SandboxPrestartOwnerCapability {
  readonly version: typeof KDO_H4_R4B_B2A_OWNER_CAPABILITY_VERSION
}

export interface SandboxPrestartOwnershipClaim {
  readonly version: typeof KDO_H4_R4B_B2A_OWNERSHIP_CLAIM_VERSION
  readonly preparedIdentity: string
  readonly prestartOutputOperationIdentity: string
  readonly executionAttemptIdentity: string
  readonly createdAdmissionIdentity: string
  readonly ownerInstanceIdentity: string
  readonly ownershipClaimIdentity: string
}

export interface SandboxPrestartOwnershipClaimCommit {
  readonly version: typeof KDO_H4_R4B_B2A_OWNERSHIP_CLAIM_COMMIT_VERSION
  readonly ownershipClaimIdentity: string
  readonly preparedIdentity: string
  readonly prestartOutputOperationIdentity: string
  readonly executionAttemptIdentity: string
  readonly ownerInstanceIdentity: string
  readonly disposition: "created"
  readonly durability: typeof KDO_H4_R4B_B2A_DURABILITY
  readonly commitIdentity: string
}

export interface SandboxPrestartFailure {
  readonly version: typeof KDO_H4_R4B_B2A_FAILURE_VERSION
  readonly preparedIdentity: string
  readonly prestartOutputOperationIdentity: string
  readonly executionAttemptIdentity: string
  readonly createdAdmissionIdentity: string
  readonly ownerInstanceIdentity: string | null
  readonly failurePhase: SandboxPrestartFailurePhase
  readonly failureCode: SandboxPrestartFailureCode
  readonly failureIdentity: string
}

export interface SandboxPrestartFailureCommit {
  readonly version: typeof KDO_H4_R4B_B2A_FAILURE_COMMIT_VERSION
  readonly failureIdentity: string
  readonly preparedIdentity: string
  readonly prestartOutputOperationIdentity: string
  readonly executionAttemptIdentity: string
  readonly disposition: "created" | "existing"
  readonly durability: typeof KDO_H4_R4B_B2A_DURABILITY
  readonly commitIdentity: string
}

const SHA256 = /^[0-9a-f]{64}$/
const ownerSecrets = new WeakMap<object, Buffer>()

function domainHash(domain: string, value: unknown): string {
  return createHash("sha256")
    .update(Buffer.from(`KODAC-H4-R4B-B2A\0${domain}\0V1\0`, "ascii"))
    .update(Buffer.from(JSON.stringify(value), "utf8"))
    .digest("hex")
}

function asPlainRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value) || utilTypes.isProxy(value)) {
    throw new TypeError(`${label} must be a non-proxy plain object`)
  }
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain object`)
  if (Object.getOwnPropertySymbols(value).length !== 0) throw new TypeError(`${label} must not contain symbol fields`)
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (descriptor.get !== undefined || descriptor.set !== undefined || !("value" in descriptor)) throw new TypeError(`${label}.${key} must be a data property`)
    if (!descriptor.enumerable || descriptor.value === undefined) throw new TypeError(`${label}.${key} must be an enumerable defined property`)
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

function identity(value: unknown, label: string): string {
  if (typeof value !== "string" || !SHA256.test(value)) throw new TypeError(`${label} must be a lowercase SHA-256 identity`)
  return value
}

function nullableIdentity(value: unknown, label: string): string | null {
  if (value === null) return null
  return identity(value, label)
}

function failurePhase(value: unknown): SandboxPrestartFailurePhase {
  if (typeof value !== "string" || !(KDO_H4_R4B_B2A_FAILURE_PHASES as readonly string[]).includes(value)) throw new TypeError("B2A failurePhase is invalid")
  return value as SandboxPrestartFailurePhase
}

function failureCode(value: unknown): SandboxPrestartFailureCode {
  if (typeof value !== "string" || !(KDO_H4_R4B_B2A_FAILURE_CODES as readonly string[]).includes(value)) throw new TypeError("B2A durable failureCode is invalid")
  return value as SandboxPrestartFailureCode
}

function validateLineage(
  createdValue: unknown,
  createdCommitValue: unknown,
  permitValue: unknown,
): { readonly created: SandboxDormantCreatedAdmission; readonly createdCommit: SandboxDormantCreatedAdmissionCommit; readonly permit: SandboxAdmissionPermit } {
  const permit = validateSandboxAdmissionPermit(permitValue)
  const created = validateSandboxDormantCreatedAdmission(createdValue, permit)
  const createdCommit = validateSandboxDormantCreatedAdmissionCommit(createdCommitValue, created, permit)
  return Object.freeze({ created, createdCommit, permit })
}

export function createSandboxPrestartPrepared(input: {
  readonly createdAdmission: unknown
  readonly createdAdmissionCommit: unknown
  readonly permit: unknown
  readonly providerIdentity: string
  readonly socketEndpointIdentity: string
}): SandboxPrestartPrepared {
  const lineage = validateLineage(input.createdAdmission, input.createdAdmissionCommit, input.permit)
  const providerIdentity = identity(input.providerIdentity, "B2A providerIdentity")
  const socketEndpointIdentity = identity(input.socketEndpointIdentity, "B2A socketEndpointIdentity")
  if (socketEndpointIdentity !== lineage.created.observation.socketEndpointIdentity) throw new TypeError("B2A socket endpoint does not match exact B1 created admission")
  const base = Object.freeze({
    version: KDO_H4_R4B_B2A_PREPARED_VERSION,
    preparedIdentity: lineage.created.preparedIdentity,
    executionAttemptIdentity: lineage.created.executionAttemptIdentity,
    createdAdmissionIdentity: lineage.created.createdAdmissionIdentity,
    containerId: lineage.created.containerId,
    requirementIdentity: lineage.created.requirementIdentity,
    workloadIdentity: lineage.created.workloadIdentity,
    providerIdentity,
    socketEndpointIdentity,
  })
  const prestartOutputOperationIdentity = domainHash("PRESTART_OUTPUT_OPERATION", [
    base.version,
    base.preparedIdentity,
    base.executionAttemptIdentity,
    base.createdAdmissionIdentity,
    base.containerId,
    base.requirementIdentity,
    base.workloadIdentity,
    base.providerIdentity,
    base.socketEndpointIdentity,
  ])
  return Object.freeze({ ...base, prestartOutputOperationIdentity })
}

export function validateSandboxPrestartPrepared(
  value: unknown,
  createdValue: unknown,
  createdCommitValue: unknown,
  permitValue: unknown,
): SandboxPrestartPrepared {
  const record = asPlainRecord(value, "B2A prepared record")
  exactKeys(record, [
    "version", "preparedIdentity", "executionAttemptIdentity", "createdAdmissionIdentity", "containerId",
    "requirementIdentity", "workloadIdentity", "providerIdentity", "socketEndpointIdentity", "prestartOutputOperationIdentity",
  ], "B2A prepared record")
  if (record.version !== KDO_H4_R4B_B2A_PREPARED_VERSION) throw new TypeError("B2A prepared version mismatch")
  const rebuilt = createSandboxPrestartPrepared({
    createdAdmission: createdValue,
    createdAdmissionCommit: createdCommitValue,
    permit: permitValue,
    providerIdentity: identity(record.providerIdentity, "B2A providerIdentity"),
    socketEndpointIdentity: identity(record.socketEndpointIdentity, "B2A socketEndpointIdentity"),
  })
  for (const key of [
    "preparedIdentity", "executionAttemptIdentity", "createdAdmissionIdentity", "containerId", "requirementIdentity",
    "workloadIdentity", "providerIdentity", "socketEndpointIdentity", "prestartOutputOperationIdentity",
  ] as const) if (record[key] !== rebuilt[key]) throw new TypeError(`B2A prepared ${key} mismatch`)
  return rebuilt
}

export function createSandboxPrestartPreparedCommit(preparedValue: SandboxPrestartPrepared): SandboxPrestartPreparedCommit {
  const base = Object.freeze({
    version: KDO_H4_R4B_B2A_PREPARED_COMMIT_VERSION,
    preparedIdentity: identity(preparedValue.preparedIdentity, "B2A preparedIdentity"),
    executionAttemptIdentity: identity(preparedValue.executionAttemptIdentity, "B2A executionAttemptIdentity"),
    prestartOutputOperationIdentity: identity(preparedValue.prestartOutputOperationIdentity, "B2A prestartOutputOperationIdentity"),
    disposition: "created" as const,
    durability: KDO_H4_R4B_B2A_DURABILITY,
  })
  return Object.freeze({ ...base, commitIdentity: domainHash("PREPARED_COMMIT", base) })
}

export function validateSandboxPrestartPreparedCommit(value: unknown, prepared: SandboxPrestartPrepared): SandboxPrestartPreparedCommit {
  const record = asPlainRecord(value, "B2A prepared commit")
  exactKeys(record, ["version", "preparedIdentity", "executionAttemptIdentity", "prestartOutputOperationIdentity", "disposition", "durability", "commitIdentity"], "B2A prepared commit")
  if (record.version !== KDO_H4_R4B_B2A_PREPARED_COMMIT_VERSION || record.disposition !== "created" || record.durability !== KDO_H4_R4B_B2A_DURABILITY) throw new TypeError("B2A prepared commit contract mismatch")
  const rebuilt = createSandboxPrestartPreparedCommit(prepared)
  for (const key of ["preparedIdentity", "executionAttemptIdentity", "prestartOutputOperationIdentity", "commitIdentity"] as const) if (record[key] !== rebuilt[key]) throw new TypeError(`B2A prepared commit ${key} mismatch`)
  return rebuilt
}

function createFenceBase(prepared: SandboxPrestartPrepared) {
  return Object.freeze({
    version: KDO_H4_R4B_B2A_STATE_FENCE_VERSION,
    preparedIdentity: prepared.preparedIdentity,
    executionAttemptIdentity: prepared.executionAttemptIdentity,
    createdAdmissionIdentity: prepared.createdAdmissionIdentity,
    prestartOutputOperationIdentity: prepared.prestartOutputOperationIdentity,
  })
}

export function createSandboxPrestartPreparedFence(prepared: SandboxPrestartPrepared): SandboxPrestartStateFence {
  const base = Object.freeze({
    ...createFenceBase(prepared), state: "PREPARED" as const,
    ownershipClaimIdentity: null, ownerInstanceIdentity: null, failureIdentity: null,
  })
  return Object.freeze({ ...base, fenceIdentity: domainHash("STATE_FENCE", base) })
}

export function createSandboxPrestartOwnerCapability(): SandboxPrestartOwnerCapability {
  const capability = Object.freeze({ version: KDO_H4_R4B_B2A_OWNER_CAPABILITY_VERSION })
  ownerSecrets.set(capability, randomBytes(32))
  return capability
}

export function sandboxPrestartOwnerInstanceIdentity(value: unknown): string {
  if (value === null || typeof value !== "object" || utilTypes.isProxy(value)) throw new TypeError("B2A owner capability is not trusted")
  const secret = ownerSecrets.get(value)
  if (secret === undefined) throw new TypeError("B2A owner capability is not trusted")
  return createHash("sha256")
    .update(Buffer.from("KODAC-H4-R4B-B2A\0OWNER_INSTANCE\0V1\0", "ascii"))
    .update(secret)
    .digest("hex")
}

export function createSandboxPrestartOwnershipClaim(prepared: SandboxPrestartPrepared, ownerCapability: SandboxPrestartOwnerCapability): SandboxPrestartOwnershipClaim {
  const ownerInstanceIdentity = sandboxPrestartOwnerInstanceIdentity(ownerCapability)
  const base = Object.freeze({
    version: KDO_H4_R4B_B2A_OWNERSHIP_CLAIM_VERSION,
    preparedIdentity: prepared.preparedIdentity,
    prestartOutputOperationIdentity: prepared.prestartOutputOperationIdentity,
    executionAttemptIdentity: prepared.executionAttemptIdentity,
    createdAdmissionIdentity: prepared.createdAdmissionIdentity,
    ownerInstanceIdentity,
  })
  return Object.freeze({ ...base, ownershipClaimIdentity: domainHash("OWNERSHIP_CLAIM", base) })
}

export function validateSandboxPrestartOwnershipClaim(value: unknown, prepared: SandboxPrestartPrepared): SandboxPrestartOwnershipClaim {
  const record = asPlainRecord(value, "B2A ownership claim")
  exactKeys(record, ["version", "preparedIdentity", "prestartOutputOperationIdentity", "executionAttemptIdentity", "createdAdmissionIdentity", "ownerInstanceIdentity", "ownershipClaimIdentity"], "B2A ownership claim")
  if (record.version !== KDO_H4_R4B_B2A_OWNERSHIP_CLAIM_VERSION) throw new TypeError("B2A ownership claim version mismatch")
  for (const [key, wanted] of [
    ["preparedIdentity", prepared.preparedIdentity],
    ["prestartOutputOperationIdentity", prepared.prestartOutputOperationIdentity],
    ["executionAttemptIdentity", prepared.executionAttemptIdentity],
    ["createdAdmissionIdentity", prepared.createdAdmissionIdentity],
  ] as const) if (record[key] !== wanted) throw new TypeError(`B2A ownership claim ${key} mismatch`)
  const ownerInstanceIdentity = identity(record.ownerInstanceIdentity, "B2A ownerInstanceIdentity")
  const base = Object.freeze({
    version: KDO_H4_R4B_B2A_OWNERSHIP_CLAIM_VERSION,
    preparedIdentity: prepared.preparedIdentity,
    prestartOutputOperationIdentity: prepared.prestartOutputOperationIdentity,
    executionAttemptIdentity: prepared.executionAttemptIdentity,
    createdAdmissionIdentity: prepared.createdAdmissionIdentity,
    ownerInstanceIdentity,
  })
  const ownershipClaimIdentity = domainHash("OWNERSHIP_CLAIM", base)
  if (record.ownershipClaimIdentity !== ownershipClaimIdentity) throw new TypeError("B2A ownership claim identity mismatch")
  return Object.freeze({ ...base, ownershipClaimIdentity })
}

export function createSandboxPrestartOwnershipClaimCommit(claim: SandboxPrestartOwnershipClaim): SandboxPrestartOwnershipClaimCommit {
  const base = Object.freeze({
    version: KDO_H4_R4B_B2A_OWNERSHIP_CLAIM_COMMIT_VERSION,
    ownershipClaimIdentity: claim.ownershipClaimIdentity,
    preparedIdentity: claim.preparedIdentity,
    prestartOutputOperationIdentity: claim.prestartOutputOperationIdentity,
    executionAttemptIdentity: claim.executionAttemptIdentity,
    ownerInstanceIdentity: claim.ownerInstanceIdentity,
    disposition: "created" as const,
    durability: KDO_H4_R4B_B2A_DURABILITY,
  })
  return Object.freeze({ ...base, commitIdentity: domainHash("OWNERSHIP_CLAIM_COMMIT", base) })
}

export function validateSandboxPrestartOwnershipClaimCommit(value: unknown, claim: SandboxPrestartOwnershipClaim): SandboxPrestartOwnershipClaimCommit {
  const record = asPlainRecord(value, "B2A ownership claim commit")
  exactKeys(record, ["version", "ownershipClaimIdentity", "preparedIdentity", "prestartOutputOperationIdentity", "executionAttemptIdentity", "ownerInstanceIdentity", "disposition", "durability", "commitIdentity"], "B2A ownership claim commit")
  if (record.version !== KDO_H4_R4B_B2A_OWNERSHIP_CLAIM_COMMIT_VERSION || record.disposition !== "created" || record.durability !== KDO_H4_R4B_B2A_DURABILITY) throw new TypeError("B2A ownership claim commit contract mismatch")
  const rebuilt = createSandboxPrestartOwnershipClaimCommit(claim)
  for (const key of ["ownershipClaimIdentity", "preparedIdentity", "prestartOutputOperationIdentity", "executionAttemptIdentity", "ownerInstanceIdentity", "commitIdentity"] as const) if (record[key] !== rebuilt[key]) throw new TypeError(`B2A ownership claim commit ${key} mismatch`)
  return rebuilt
}

export function createSandboxPrestartOwnerClaimedFence(prepared: SandboxPrestartPrepared, claim: SandboxPrestartOwnershipClaim): SandboxPrestartStateFence {
  const validatedClaim = validateSandboxPrestartOwnershipClaim(claim, prepared)
  const base = Object.freeze({
    ...createFenceBase(prepared), state: "OWNER_CLAIMED" as const,
    ownershipClaimIdentity: validatedClaim.ownershipClaimIdentity,
    ownerInstanceIdentity: validatedClaim.ownerInstanceIdentity,
    failureIdentity: null,
  })
  return Object.freeze({ ...base, fenceIdentity: domainHash("STATE_FENCE", base) })
}

export function createSandboxPrestartFailure(
  prepared: SandboxPrestartPrepared,
  phaseValue: SandboxPrestartFailurePhase,
  codeValue: SandboxPrestartFailureCode,
  ownerCapability: SandboxPrestartOwnerCapability | null,
): SandboxPrestartFailure {
  const phase = failurePhase(phaseValue)
  const code = failureCode(codeValue)
  const ownerInstanceIdentity = ownerCapability === null ? null : sandboxPrestartOwnerInstanceIdentity(ownerCapability)
  if (code === "owner-lost-graceful" && ownerInstanceIdentity === null) throw new TypeError("B2A owner-lost-graceful requires the exact live owner capability")
  const base = Object.freeze({
    version: KDO_H4_R4B_B2A_FAILURE_VERSION,
    preparedIdentity: prepared.preparedIdentity,
    prestartOutputOperationIdentity: prepared.prestartOutputOperationIdentity,
    executionAttemptIdentity: prepared.executionAttemptIdentity,
    createdAdmissionIdentity: prepared.createdAdmissionIdentity,
    ownerInstanceIdentity,
    failurePhase: phase,
    failureCode: code,
  })
  return Object.freeze({ ...base, failureIdentity: domainHash("FAILURE", base) })
}

export function validateSandboxPrestartFailure(value: unknown, prepared: SandboxPrestartPrepared): SandboxPrestartFailure {
  const record = asPlainRecord(value, "B2A failure")
  exactKeys(record, ["version", "preparedIdentity", "prestartOutputOperationIdentity", "executionAttemptIdentity", "createdAdmissionIdentity", "ownerInstanceIdentity", "failurePhase", "failureCode", "failureIdentity"], "B2A failure")
  if (record.version !== KDO_H4_R4B_B2A_FAILURE_VERSION) throw new TypeError("B2A failure version mismatch")
  for (const [key, wanted] of [
    ["preparedIdentity", prepared.preparedIdentity],
    ["prestartOutputOperationIdentity", prepared.prestartOutputOperationIdentity],
    ["executionAttemptIdentity", prepared.executionAttemptIdentity],
    ["createdAdmissionIdentity", prepared.createdAdmissionIdentity],
  ] as const) if (record[key] !== wanted) throw new TypeError(`B2A failure ${key} mismatch`)
  const ownerInstanceIdentity = nullableIdentity(record.ownerInstanceIdentity, "B2A failure ownerInstanceIdentity")
  const phase = failurePhase(record.failurePhase)
  const code = failureCode(record.failureCode)
  if (code === "owner-lost-graceful" && ownerInstanceIdentity === null) throw new TypeError("B2A owner-lost-graceful requires owner identity")
  const base = Object.freeze({
    version: KDO_H4_R4B_B2A_FAILURE_VERSION,
    preparedIdentity: prepared.preparedIdentity,
    prestartOutputOperationIdentity: prepared.prestartOutputOperationIdentity,
    executionAttemptIdentity: prepared.executionAttemptIdentity,
    createdAdmissionIdentity: prepared.createdAdmissionIdentity,
    ownerInstanceIdentity,
    failurePhase: phase,
    failureCode: code,
  })
  const failureIdentity = domainHash("FAILURE", base)
  if (record.failureIdentity !== failureIdentity) throw new TypeError("B2A failure identity mismatch")
  return Object.freeze({ ...base, failureIdentity })
}

export function createSandboxPrestartFailureCommit(failure: SandboxPrestartFailure, disposition: "created" | "existing"): SandboxPrestartFailureCommit {
  const base = Object.freeze({
    version: KDO_H4_R4B_B2A_FAILURE_COMMIT_VERSION,
    failureIdentity: failure.failureIdentity,
    preparedIdentity: failure.preparedIdentity,
    prestartOutputOperationIdentity: failure.prestartOutputOperationIdentity,
    executionAttemptIdentity: failure.executionAttemptIdentity,
    disposition,
    durability: KDO_H4_R4B_B2A_DURABILITY,
  })
  return Object.freeze({ ...base, commitIdentity: domainHash("FAILURE_COMMIT", base) })
}

export function validateSandboxPrestartFailureCommit(value: unknown, failure: SandboxPrestartFailure): SandboxPrestartFailureCommit {
  const record = asPlainRecord(value, "B2A failure commit")
  exactKeys(record, ["version", "failureIdentity", "preparedIdentity", "prestartOutputOperationIdentity", "executionAttemptIdentity", "disposition", "durability", "commitIdentity"], "B2A failure commit")
  if (record.version !== KDO_H4_R4B_B2A_FAILURE_COMMIT_VERSION || (record.disposition !== "created" && record.disposition !== "existing") || record.durability !== KDO_H4_R4B_B2A_DURABILITY) throw new TypeError("B2A failure commit contract mismatch")
  const rebuilt = createSandboxPrestartFailureCommit(failure, record.disposition)
  for (const key of ["failureIdentity", "preparedIdentity", "prestartOutputOperationIdentity", "executionAttemptIdentity", "disposition", "commitIdentity"] as const) if (record[key] !== rebuilt[key]) throw new TypeError(`B2A failure commit ${key} mismatch`)
  return rebuilt
}

export function createSandboxPrestartFailedFence(
  prepared: SandboxPrestartPrepared,
  failure: SandboxPrestartFailure,
  claim: SandboxPrestartOwnershipClaim | null,
): SandboxPrestartStateFence {
  const validatedFailure = validateSandboxPrestartFailure(failure, prepared)
  let ownershipClaimIdentity: string | null = null
  let ownerInstanceIdentity: string | null = null
  if (claim !== null) {
    const validatedClaim = validateSandboxPrestartOwnershipClaim(claim, prepared)
    if (validatedFailure.ownerInstanceIdentity !== validatedClaim.ownerInstanceIdentity) throw new TypeError("B2A owner failure must bind the exact claimed owner")
    ownershipClaimIdentity = validatedClaim.ownershipClaimIdentity
    ownerInstanceIdentity = validatedClaim.ownerInstanceIdentity
  } else if (validatedFailure.ownerInstanceIdentity !== null) {
    throw new TypeError("B2A pre-owner failure cannot carry an owner identity")
  }
  const base = Object.freeze({
    ...createFenceBase(prepared), state: "FAILED_TERMINAL" as const,
    ownershipClaimIdentity, ownerInstanceIdentity, failureIdentity: validatedFailure.failureIdentity,
  })
  return Object.freeze({ ...base, fenceIdentity: domainHash("STATE_FENCE", base) })
}

export function validateSandboxPrestartStateFence(value: unknown, prepared: SandboxPrestartPrepared): SandboxPrestartStateFence {
  const record = asPlainRecord(value, "B2A state fence")
  exactKeys(record, ["version", "preparedIdentity", "executionAttemptIdentity", "createdAdmissionIdentity", "prestartOutputOperationIdentity", "state", "ownershipClaimIdentity", "ownerInstanceIdentity", "failureIdentity", "fenceIdentity"], "B2A state fence")
  if (record.version !== KDO_H4_R4B_B2A_STATE_FENCE_VERSION) throw new TypeError("B2A state fence version mismatch")
  for (const [key, wanted] of [
    ["preparedIdentity", prepared.preparedIdentity],
    ["executionAttemptIdentity", prepared.executionAttemptIdentity],
    ["createdAdmissionIdentity", prepared.createdAdmissionIdentity],
    ["prestartOutputOperationIdentity", prepared.prestartOutputOperationIdentity],
  ] as const) if (record[key] !== wanted) throw new TypeError(`B2A state fence ${key} mismatch`)
  if (record.state !== "PREPARED" && record.state !== "OWNER_CLAIMED" && record.state !== "FAILED_TERMINAL") throw new TypeError("B2A state fence state is invalid")
  const ownershipClaimIdentity = nullableIdentity(record.ownershipClaimIdentity, "B2A state fence ownershipClaimIdentity")
  const ownerInstanceIdentity = nullableIdentity(record.ownerInstanceIdentity, "B2A state fence ownerInstanceIdentity")
  const failureIdentity = nullableIdentity(record.failureIdentity, "B2A state fence failureIdentity")
  if (record.state === "PREPARED" && (ownershipClaimIdentity !== null || ownerInstanceIdentity !== null || failureIdentity !== null)) throw new TypeError("B2A PREPARED fence cannot carry owner/failure metadata")
  if (record.state === "OWNER_CLAIMED" && (ownershipClaimIdentity === null || ownerInstanceIdentity === null || failureIdentity !== null)) throw new TypeError("B2A OWNER_CLAIMED fence metadata mismatch")
  if (record.state === "FAILED_TERMINAL" && failureIdentity === null) throw new TypeError("B2A FAILED_TERMINAL fence requires failureIdentity")
  if ((ownershipClaimIdentity === null) !== (ownerInstanceIdentity === null)) throw new TypeError("B2A state fence claim and owner identities must be jointly present or absent")
  const base = Object.freeze({
    version: KDO_H4_R4B_B2A_STATE_FENCE_VERSION,
    preparedIdentity: prepared.preparedIdentity,
    executionAttemptIdentity: prepared.executionAttemptIdentity,
    createdAdmissionIdentity: prepared.createdAdmissionIdentity,
    prestartOutputOperationIdentity: prepared.prestartOutputOperationIdentity,
    state: record.state,
    ownershipClaimIdentity,
    ownerInstanceIdentity,
    failureIdentity,
  })
  const fenceIdentity = domainHash("STATE_FENCE", base)
  if (record.fenceIdentity !== fenceIdentity) throw new TypeError("B2A state fence identity mismatch")
  return Object.freeze({ ...base, fenceIdentity }) as SandboxPrestartStateFence
}
