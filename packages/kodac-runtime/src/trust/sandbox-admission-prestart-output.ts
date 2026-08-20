import { createHash } from "node:crypto"
import { types as utilTypes } from "node:util"

export const KDO_H4_R4B_B2A_PREPARED_VERSION = "kodac-h4-r4b-b2a-prestart-prepared-v1" as const
export const KDO_H4_R4B_B2A_PREPARED_COMMIT_VERSION = "kodac-h4-r4b-b2a-prestart-prepared-commit-v1" as const
export const KDO_H4_R4B_B2A_STATE_FENCE_VERSION = "kodac-h4-r4b-b2a-prestart-state-fence-v1" as const
export const KDO_H4_R4B_B2A_OWNERSHIP_CLAIM_VERSION = "kodac-h4-r4b-b2a-prestart-ownership-claim-v1" as const
export const KDO_H4_R4B_B2A_OWNERSHIP_CLAIM_COMMIT_VERSION = "kodac-h4-r4b-b2a-prestart-ownership-claim-commit-v1" as const
export const KDO_H4_R4B_B2A_FAILURE_VERSION = "kodac-h4-r4b-b2a-prestart-failure-v1" as const
export const KDO_H4_R4B_B2A_FAILURE_COMMIT_VERSION = "kodac-h4-r4b-b2a-prestart-failure-commit-v1" as const
export const KDO_H4_R4B_B2A_DURABILITY = "durable" as const

export const KDO_H4_R4B_B2A_STATE_VALUES = Object.freeze([
  "PREPARED",
  "OWNER_CLAIMED",
  "FAILED_TERMINAL",
] as const)
export type SandboxPrestartState = (typeof KDO_H4_R4B_B2A_STATE_VALUES)[number]

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

export interface SandboxPrestartPrepared {
  readonly version: typeof KDO_H4_R4B_B2A_PREPARED_VERSION
  readonly executionAttemptIdentity: string
  readonly requirementIdentity: string
  readonly workloadIdentity: string
  readonly providerIdentity: string
  readonly socketEndpointIdentity: string
  readonly createdAdmissionIdentity: string
  readonly containerId: string
  readonly prestartOutputOperationIdentity: string
  readonly preparedIdentity: string
}

export interface SandboxPrestartPreparedCommit {
  readonly version: typeof KDO_H4_R4B_B2A_PREPARED_COMMIT_VERSION
  readonly preparedIdentity: string
  readonly prestartOutputOperationIdentity: string
  readonly executionAttemptIdentity: string
  readonly disposition: "created"
  readonly durability: typeof KDO_H4_R4B_B2A_DURABILITY
  readonly commitIdentity: string
}

export interface SandboxPrestartStateFence {
  readonly version: typeof KDO_H4_R4B_B2A_STATE_FENCE_VERSION
  readonly preparedIdentity: string
  readonly prestartOutputOperationIdentity: string
  readonly executionAttemptIdentity: string
  readonly createdAdmissionIdentity: string
  readonly state: SandboxPrestartState
  readonly ownerInstanceIdentity: string | null
  readonly ownershipClaimIdentity: string | null
  readonly failureIdentity: string | null
  readonly stateIdentity: string
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

export interface SandboxPrestartPreparedTransactionResult {
  readonly disposition: "created" | "existing"
  readonly prepared: SandboxPrestartPrepared
  readonly preparedCommit: SandboxPrestartPreparedCommit
  readonly stateFence: SandboxPrestartStateFence
}

export interface SandboxPrestartOwnershipClaimTransactionResult {
  readonly disposition: "created" | "existing"
  readonly claim: SandboxPrestartOwnershipClaim
  readonly claimCommit: SandboxPrestartOwnershipClaimCommit
  readonly stateFence: SandboxPrestartStateFence
}

export interface SandboxPrestartFailureTransactionResult {
  readonly disposition: "created" | "existing"
  readonly failure: SandboxPrestartFailure
  readonly failureCommit: SandboxPrestartFailureCommit
  readonly stateFence: SandboxPrestartStateFence
}

const SHA256 = /^[0-9a-f]{64}$/

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
    if (descriptor.get !== undefined || descriptor.set !== undefined || !("value" in descriptor)) {
      throw new TypeError(`${label}.${key} must be a data property`)
    }
    if (!descriptor.enumerable || descriptor.value === undefined) {
      throw new TypeError(`${label}.${key} must be an enumerable defined property`)
    }
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

function containerId(value: unknown): string {
  return identity(value, "containerId")
}

function preparedPreimage(input: Omit<SandboxPrestartPrepared, "version" | "prestartOutputOperationIdentity" | "preparedIdentity">): readonly string[] {
  return [
    input.executionAttemptIdentity,
    input.requirementIdentity,
    input.workloadIdentity,
    input.providerIdentity,
    input.socketEndpointIdentity,
    input.createdAdmissionIdentity,
    input.containerId,
  ]
}

export function deriveSandboxPrestartOutputOperationIdentity(
  input: Omit<SandboxPrestartPrepared, "version" | "prestartOutputOperationIdentity" | "preparedIdentity">,
): string {
  return domainHash("PRESTART_OUTPUT_OPERATION", [KDO_H4_R4B_B2A_PREPARED_VERSION, ...preparedPreimage(input)])
}

export function deriveSandboxPrestartPreparedIdentity(
  input: Omit<SandboxPrestartPrepared, "preparedIdentity">,
): string {
  return domainHash("PREPARED", [
    input.version,
    ...preparedPreimage(input),
    input.prestartOutputOperationIdentity,
  ])
}

export function deriveSandboxPrestartPreparedCommitIdentity(
  input: Omit<SandboxPrestartPreparedCommit, "commitIdentity">,
): string {
  return domainHash("PREPARED_COMMIT", input)
}

export function deriveSandboxPrestartStateIdentity(
  input: Omit<SandboxPrestartStateFence, "stateIdentity">,
): string {
  return domainHash("STATE_FENCE", input)
}

export function deriveSandboxPrestartOwnershipClaimIdentity(
  input: Omit<SandboxPrestartOwnershipClaim, "ownershipClaimIdentity">,
): string {
  return domainHash("OWNERSHIP_CLAIM", input)
}

export function deriveSandboxPrestartOwnershipClaimCommitIdentity(
  input: Omit<SandboxPrestartOwnershipClaimCommit, "commitIdentity">,
): string {
  return domainHash("OWNERSHIP_CLAIM_COMMIT", input)
}

export function deriveSandboxPrestartFailureIdentity(
  input: Omit<SandboxPrestartFailure, "failureIdentity">,
): string {
  return domainHash("FAILURE", input)
}

export function deriveSandboxPrestartFailureCommitIdentity(
  input: Omit<SandboxPrestartFailureCommit, "commitIdentity">,
): string {
  return domainHash("FAILURE_COMMIT", input)
}

export function validateSandboxPrestartPrepared(value: unknown): SandboxPrestartPrepared {
  const record = asPlainRecord(value, "B2A prepared")
  exactKeys(record, [
    "version", "executionAttemptIdentity", "requirementIdentity", "workloadIdentity", "providerIdentity", "socketEndpointIdentity",
    "createdAdmissionIdentity", "containerId", "prestartOutputOperationIdentity", "preparedIdentity",
  ], "B2A prepared")
  if (record.version !== KDO_H4_R4B_B2A_PREPARED_VERSION) throw new TypeError("B2A prepared version mismatch")
  const base = Object.freeze({
    version: KDO_H4_R4B_B2A_PREPARED_VERSION,
    executionAttemptIdentity: identity(record.executionAttemptIdentity, "B2A prepared executionAttemptIdentity"),
    requirementIdentity: identity(record.requirementIdentity, "B2A prepared requirementIdentity"),
    workloadIdentity: identity(record.workloadIdentity, "B2A prepared workloadIdentity"),
    providerIdentity: identity(record.providerIdentity, "B2A prepared providerIdentity"),
    socketEndpointIdentity: identity(record.socketEndpointIdentity, "B2A prepared socketEndpointIdentity"),
    createdAdmissionIdentity: identity(record.createdAdmissionIdentity, "B2A prepared createdAdmissionIdentity"),
    containerId: containerId(record.containerId),
  })
  const prestartOutputOperationIdentity = deriveSandboxPrestartOutputOperationIdentity(base)
  if (record.prestartOutputOperationIdentity !== prestartOutputOperationIdentity) throw new TypeError("B2A prepared operation identity mismatch")
  const withOperation = Object.freeze({ ...base, prestartOutputOperationIdentity })
  const preparedIdentity = deriveSandboxPrestartPreparedIdentity(withOperation)
  if (record.preparedIdentity !== preparedIdentity) throw new TypeError("B2A prepared identity mismatch")
  return Object.freeze({ ...withOperation, preparedIdentity })
}

export function validateSandboxPrestartPreparedCommit(
  value: unknown,
  preparedValue: unknown,
): SandboxPrestartPreparedCommit {
  const prepared = validateSandboxPrestartPrepared(preparedValue)
  const record = asPlainRecord(value, "B2A prepared commit")
  exactKeys(record, [
    "version", "preparedIdentity", "prestartOutputOperationIdentity", "executionAttemptIdentity", "disposition", "durability", "commitIdentity",
  ], "B2A prepared commit")
  if (record.version !== KDO_H4_R4B_B2A_PREPARED_COMMIT_VERSION) throw new TypeError("B2A prepared commit version mismatch")
  if (record.disposition !== "created" || record.durability !== KDO_H4_R4B_B2A_DURABILITY) throw new TypeError("B2A prepared commit must be durable created")
  const base = Object.freeze({
    version: KDO_H4_R4B_B2A_PREPARED_COMMIT_VERSION,
    preparedIdentity: prepared.preparedIdentity,
    prestartOutputOperationIdentity: prepared.prestartOutputOperationIdentity,
    executionAttemptIdentity: prepared.executionAttemptIdentity,
    disposition: "created" as const,
    durability: KDO_H4_R4B_B2A_DURABILITY,
  })
  for (const key of ["preparedIdentity", "prestartOutputOperationIdentity", "executionAttemptIdentity"] as const) {
    if (record[key] !== base[key]) throw new TypeError(`B2A prepared commit ${key} mismatch`)
  }
  const commitIdentity = deriveSandboxPrestartPreparedCommitIdentity(base)
  if (record.commitIdentity !== commitIdentity) throw new TypeError("B2A prepared commit identity mismatch")
  return Object.freeze({ ...base, commitIdentity })
}

function stateValue(value: unknown): SandboxPrestartState {
  if (value !== "PREPARED" && value !== "OWNER_CLAIMED" && value !== "FAILED_TERMINAL") throw new TypeError("B2A state fence state is invalid")
  return value
}

export function validateSandboxPrestartStateFence(
  value: unknown,
  preparedValue: unknown,
): SandboxPrestartStateFence {
  const prepared = validateSandboxPrestartPrepared(preparedValue)
  const record = asPlainRecord(value, "B2A state fence")
  exactKeys(record, [
    "version", "preparedIdentity", "prestartOutputOperationIdentity", "executionAttemptIdentity", "createdAdmissionIdentity", "state",
    "ownerInstanceIdentity", "ownershipClaimIdentity", "failureIdentity", "stateIdentity",
  ], "B2A state fence")
  if (record.version !== KDO_H4_R4B_B2A_STATE_FENCE_VERSION) throw new TypeError("B2A state fence version mismatch")
  const state = stateValue(record.state)
  const ownerInstanceIdentity = nullableIdentity(record.ownerInstanceIdentity, "B2A state fence ownerInstanceIdentity")
  const ownershipClaimIdentity = nullableIdentity(record.ownershipClaimIdentity, "B2A state fence ownershipClaimIdentity")
  const failureIdentity = nullableIdentity(record.failureIdentity, "B2A state fence failureIdentity")
  if (state === "PREPARED" && (ownerInstanceIdentity !== null || ownershipClaimIdentity !== null || failureIdentity !== null)) {
    throw new TypeError("B2A PREPARED state must not contain owner/claim/failure identities")
  }
  if (state === "OWNER_CLAIMED" && (ownerInstanceIdentity === null || ownershipClaimIdentity === null || failureIdentity !== null)) {
    throw new TypeError("B2A OWNER_CLAIMED state requires owner+claim and no failure")
  }
  if (state === "FAILED_TERMINAL") {
    if (failureIdentity === null) throw new TypeError("B2A FAILED_TERMINAL state requires failure identity")
    if ((ownerInstanceIdentity === null) !== (ownershipClaimIdentity === null)) throw new TypeError("B2A FAILED_TERMINAL owner and claim identities must be both null or both present")
  }
  const base = Object.freeze({
    version: KDO_H4_R4B_B2A_STATE_FENCE_VERSION,
    preparedIdentity: prepared.preparedIdentity,
    prestartOutputOperationIdentity: prepared.prestartOutputOperationIdentity,
    executionAttemptIdentity: prepared.executionAttemptIdentity,
    createdAdmissionIdentity: prepared.createdAdmissionIdentity,
    state,
    ownerInstanceIdentity,
    ownershipClaimIdentity,
    failureIdentity,
  })
  for (const key of ["preparedIdentity", "prestartOutputOperationIdentity", "executionAttemptIdentity", "createdAdmissionIdentity"] as const) {
    if (record[key] !== base[key]) throw new TypeError(`B2A state fence ${key} mismatch`)
  }
  const stateIdentity = deriveSandboxPrestartStateIdentity(base)
  if (record.stateIdentity !== stateIdentity) throw new TypeError("B2A state fence identity mismatch")
  return Object.freeze({ ...base, stateIdentity })
}

export function validateSandboxPrestartOwnershipClaim(
  value: unknown,
  preparedValue: unknown,
): SandboxPrestartOwnershipClaim {
  const prepared = validateSandboxPrestartPrepared(preparedValue)
  const record = asPlainRecord(value, "B2A ownership claim")
  exactKeys(record, [
    "version", "preparedIdentity", "prestartOutputOperationIdentity", "executionAttemptIdentity", "createdAdmissionIdentity", "ownerInstanceIdentity",
    "ownershipClaimIdentity",
  ], "B2A ownership claim")
  if (record.version !== KDO_H4_R4B_B2A_OWNERSHIP_CLAIM_VERSION) throw new TypeError("B2A ownership claim version mismatch")
  const base = Object.freeze({
    version: KDO_H4_R4B_B2A_OWNERSHIP_CLAIM_VERSION,
    preparedIdentity: prepared.preparedIdentity,
    prestartOutputOperationIdentity: prepared.prestartOutputOperationIdentity,
    executionAttemptIdentity: prepared.executionAttemptIdentity,
    createdAdmissionIdentity: prepared.createdAdmissionIdentity,
    ownerInstanceIdentity: identity(record.ownerInstanceIdentity, "B2A ownership claim ownerInstanceIdentity"),
  })
  for (const key of ["preparedIdentity", "prestartOutputOperationIdentity", "executionAttemptIdentity", "createdAdmissionIdentity"] as const) {
    if (record[key] !== base[key]) throw new TypeError(`B2A ownership claim ${key} mismatch`)
  }
  const ownershipClaimIdentity = deriveSandboxPrestartOwnershipClaimIdentity(base)
  if (record.ownershipClaimIdentity !== ownershipClaimIdentity) throw new TypeError("B2A ownership claim identity mismatch")
  return Object.freeze({ ...base, ownershipClaimIdentity })
}

export function validateSandboxPrestartOwnershipClaimCommit(
  value: unknown,
  preparedValue: unknown,
  claimValue: unknown,
): SandboxPrestartOwnershipClaimCommit {
  const prepared = validateSandboxPrestartPrepared(preparedValue)
  const claim = validateSandboxPrestartOwnershipClaim(claimValue, prepared)
  const record = asPlainRecord(value, "B2A ownership claim commit")
  exactKeys(record, [
    "version", "ownershipClaimIdentity", "preparedIdentity", "prestartOutputOperationIdentity", "executionAttemptIdentity", "ownerInstanceIdentity",
    "disposition", "durability", "commitIdentity",
  ], "B2A ownership claim commit")
  if (record.version !== KDO_H4_R4B_B2A_OWNERSHIP_CLAIM_COMMIT_VERSION) throw new TypeError("B2A ownership claim commit version mismatch")
  if (record.disposition !== "created" || record.durability !== KDO_H4_R4B_B2A_DURABILITY) throw new TypeError("B2A ownership claim commit must be durable created")
  const base = Object.freeze({
    version: KDO_H4_R4B_B2A_OWNERSHIP_CLAIM_COMMIT_VERSION,
    ownershipClaimIdentity: claim.ownershipClaimIdentity,
    preparedIdentity: prepared.preparedIdentity,
    prestartOutputOperationIdentity: prepared.prestartOutputOperationIdentity,
    executionAttemptIdentity: prepared.executionAttemptIdentity,
    ownerInstanceIdentity: claim.ownerInstanceIdentity,
    disposition: "created" as const,
    durability: KDO_H4_R4B_B2A_DURABILITY,
  })
  for (const key of ["ownershipClaimIdentity", "preparedIdentity", "prestartOutputOperationIdentity", "executionAttemptIdentity", "ownerInstanceIdentity"] as const) {
    if (record[key] !== base[key]) throw new TypeError(`B2A ownership claim commit ${key} mismatch`)
  }
  const commitIdentity = deriveSandboxPrestartOwnershipClaimCommitIdentity(base)
  if (record.commitIdentity !== commitIdentity) throw new TypeError("B2A ownership claim commit identity mismatch")
  return Object.freeze({ ...base, commitIdentity })
}

function failurePhase(value: unknown): SandboxPrestartFailurePhase {
  if (!KDO_H4_R4B_B2A_FAILURE_PHASES.includes(value as SandboxPrestartFailurePhase)) throw new TypeError("B2A failure phase is invalid")
  return value as SandboxPrestartFailurePhase
}

function failureCode(value: unknown): SandboxPrestartFailureCode {
  if (!KDO_H4_R4B_B2A_FAILURE_CODES.includes(value as SandboxPrestartFailureCode)) throw new TypeError("B2A durable failure code is invalid")
  return value as SandboxPrestartFailureCode
}

export function validateSandboxPrestartFailure(
  value: unknown,
  preparedValue: unknown,
): SandboxPrestartFailure {
  const prepared = validateSandboxPrestartPrepared(preparedValue)
  const record = asPlainRecord(value, "B2A failure")
  exactKeys(record, [
    "version", "preparedIdentity", "prestartOutputOperationIdentity", "executionAttemptIdentity", "createdAdmissionIdentity", "ownerInstanceIdentity",
    "failurePhase", "failureCode", "failureIdentity",
  ], "B2A failure")
  if (record.version !== KDO_H4_R4B_B2A_FAILURE_VERSION) throw new TypeError("B2A failure version mismatch")
  const base = Object.freeze({
    version: KDO_H4_R4B_B2A_FAILURE_VERSION,
    preparedIdentity: prepared.preparedIdentity,
    prestartOutputOperationIdentity: prepared.prestartOutputOperationIdentity,
    executionAttemptIdentity: prepared.executionAttemptIdentity,
    createdAdmissionIdentity: prepared.createdAdmissionIdentity,
    ownerInstanceIdentity: nullableIdentity(record.ownerInstanceIdentity, "B2A failure ownerInstanceIdentity"),
    failurePhase: failurePhase(record.failurePhase),
    failureCode: failureCode(record.failureCode),
  })
  for (const key of ["preparedIdentity", "prestartOutputOperationIdentity", "executionAttemptIdentity", "createdAdmissionIdentity"] as const) {
    if (record[key] !== base[key]) throw new TypeError(`B2A failure ${key} mismatch`)
  }
  const failureIdentity = deriveSandboxPrestartFailureIdentity(base)
  if (record.failureIdentity !== failureIdentity) throw new TypeError("B2A failure identity mismatch")
  return Object.freeze({ ...base, failureIdentity })
}

export function validateSandboxPrestartFailureCommit(
  value: unknown,
  preparedValue: unknown,
  failureValue: unknown,
): SandboxPrestartFailureCommit {
  const prepared = validateSandboxPrestartPrepared(preparedValue)
  const failure = validateSandboxPrestartFailure(failureValue, prepared)
  const record = asPlainRecord(value, "B2A failure commit")
  exactKeys(record, [
    "version", "failureIdentity", "preparedIdentity", "prestartOutputOperationIdentity", "executionAttemptIdentity", "disposition", "durability", "commitIdentity",
  ], "B2A failure commit")
  if (record.version !== KDO_H4_R4B_B2A_FAILURE_COMMIT_VERSION) throw new TypeError("B2A failure commit version mismatch")
  if (record.disposition !== "created" && record.disposition !== "existing") throw new TypeError("B2A failure commit disposition must be created or existing")
  if (record.durability !== KDO_H4_R4B_B2A_DURABILITY) throw new TypeError("B2A failure commit must be durable")
  const base = Object.freeze({
    version: KDO_H4_R4B_B2A_FAILURE_COMMIT_VERSION,
    failureIdentity: failure.failureIdentity,
    preparedIdentity: prepared.preparedIdentity,
    prestartOutputOperationIdentity: prepared.prestartOutputOperationIdentity,
    executionAttemptIdentity: prepared.executionAttemptIdentity,
    disposition: record.disposition,
    durability: KDO_H4_R4B_B2A_DURABILITY,
  }) as Omit<SandboxPrestartFailureCommit, "commitIdentity">
  for (const key of ["failureIdentity", "preparedIdentity", "prestartOutputOperationIdentity", "executionAttemptIdentity"] as const) {
    if (record[key] !== base[key]) throw new TypeError(`B2A failure commit ${key} mismatch`)
  }
  const commitIdentity = deriveSandboxPrestartFailureCommitIdentity(base)
  if (record.commitIdentity !== commitIdentity) throw new TypeError("B2A failure commit identity mismatch")
  return Object.freeze({ ...base, commitIdentity })
}

export function validateSandboxPrestartPreparedTransactionResult(
  value: unknown,
  expectedPreparedValue: unknown,
): SandboxPrestartPreparedTransactionResult {
  const expectedPrepared = validateSandboxPrestartPrepared(expectedPreparedValue)
  const record = asPlainRecord(value, "B2A prepared transaction result")
  exactKeys(record, ["disposition", "prepared", "preparedCommit", "stateFence"], "B2A prepared transaction result")
  if (record.disposition !== "created" && record.disposition !== "existing") throw new TypeError("B2A prepared transaction result disposition is invalid")
  const prepared = validateSandboxPrestartPrepared(record.prepared)
  if (prepared.preparedIdentity !== expectedPrepared.preparedIdentity) throw new TypeError("B2A prepared transaction returned a different prepared identity")
  const preparedCommit = validateSandboxPrestartPreparedCommit(record.preparedCommit, prepared)
  const stateFence = validateSandboxPrestartStateFence(record.stateFence, prepared)
  return Object.freeze({ disposition: record.disposition, prepared, preparedCommit, stateFence })
}

export function validateSandboxPrestartOwnershipClaimTransactionResult(
  value: unknown,
  preparedValue: unknown,
  expectedClaimValue: unknown,
): SandboxPrestartOwnershipClaimTransactionResult {
  const prepared = validateSandboxPrestartPrepared(preparedValue)
  const expectedClaim = validateSandboxPrestartOwnershipClaim(expectedClaimValue, prepared)
  const record = asPlainRecord(value, "B2A ownership claim transaction result")
  exactKeys(record, ["disposition", "claim", "claimCommit", "stateFence"], "B2A ownership claim transaction result")
  if (record.disposition !== "created" && record.disposition !== "existing") throw new TypeError("B2A ownership claim transaction result disposition is invalid")
  const claim = validateSandboxPrestartOwnershipClaim(record.claim, prepared)
  if (claim.ownershipClaimIdentity !== expectedClaim.ownershipClaimIdentity) throw new TypeError("B2A ownership claim transaction returned a different claim")
  const claimCommit = validateSandboxPrestartOwnershipClaimCommit(record.claimCommit, prepared, claim)
  const stateFence = validateSandboxPrestartStateFence(record.stateFence, prepared)
  return Object.freeze({ disposition: record.disposition, claim, claimCommit, stateFence })
}

export function validateSandboxPrestartFailureTransactionResult(
  value: unknown,
  preparedValue: unknown,
  expectedFailureValue: unknown,
): SandboxPrestartFailureTransactionResult {
  const prepared = validateSandboxPrestartPrepared(preparedValue)
  const expectedFailure = validateSandboxPrestartFailure(expectedFailureValue, prepared)
  const record = asPlainRecord(value, "B2A failure transaction result")
  exactKeys(record, ["disposition", "failure", "failureCommit", "stateFence"], "B2A failure transaction result")
  if (record.disposition !== "created" && record.disposition !== "existing") throw new TypeError("B2A failure transaction result disposition is invalid")
  const failure = validateSandboxPrestartFailure(record.failure, prepared)
  if (failure.failureIdentity !== expectedFailure.failureIdentity) throw new TypeError("B2A failure transaction returned a different failure")
  const failureCommit = validateSandboxPrestartFailureCommit(record.failureCommit, prepared, failure)
  const stateFence = validateSandboxPrestartStateFence(record.stateFence, prepared)
  return Object.freeze({ disposition: record.disposition, failure, failureCommit, stateFence })
}
