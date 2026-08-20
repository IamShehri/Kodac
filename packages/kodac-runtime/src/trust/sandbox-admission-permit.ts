import { createHash } from "node:crypto"
import { types as utilTypes } from "node:util"

import {
  KDO_H4_R1_APPROVAL_VERSION,
  KDO_H4_R1_EVIDENCE_COMMIT_VERSION,
  createApprovalEvidence,
  validateApprovalEvidenceCommit,
  type ApprovalEvidence,
  type ApprovalEvidenceCommit,
} from "./approval.ts"
import {
  KDO_H4_R4A_CAPABILITY,
  KDO_H4_R4A_VERSION,
  validateSandboxExecutionApprovalBinding,
  type SandboxExecutionApprovalBinding,
} from "./sandbox-execution-approval-binding.ts"
import type { SandboxSemanticRuntimeClass } from "./sandbox-backend-evidence.ts"

export const KDO_H4_R4B_A_VERSION = "kodac-h4-r4b-a-sandbox-admission-permit-v1" as const
export const KDO_H4_R4B_A_PERMIT_COMMIT_VERSION = "kodac-h4-r4b-a-sandbox-admission-permit-commit-v1" as const
export const KDO_H4_R4B_A_CONSUMPTION_RESERVATION_VERSION = "kodac-h4-r4b-a-consumption-reservation-v1" as const
export const KDO_H4_R4B_A_ADMISSION_ATTEMPT_LIMIT = 1 as const

export interface SandboxAdmissionPermit {
  readonly version: typeof KDO_H4_R4B_A_VERSION
  readonly binding: SandboxExecutionApprovalBinding
  readonly askedEvidence: ApprovalEvidence
  readonly askedEvidenceCommit: ApprovalEvidenceCommit
  readonly decidedEvidence: ApprovalEvidence
  readonly decidedEvidenceCommit: ApprovalEvidenceCommit
  readonly bindingIdentity: string
  readonly requirementIdentity: string
  readonly workloadIdentity: string
  readonly sourceIdentity: string
  readonly sourceDigest: string
  readonly entrypointIdentity: string
  readonly resourcePolicyIdentity: string
  readonly networkPolicyIdentity: string
  readonly confinementRequestIdentity: string
  readonly workspaceIdentity: string
  readonly executionIntentIdentity: string
  readonly requiredSemanticRuntimeClass: SandboxSemanticRuntimeClass
  readonly downgradePolicy: SandboxExecutionApprovalBinding["downgradePolicy"]
  readonly credentialBindingIdentity: null
  readonly approvalCapability: typeof KDO_H4_R4A_CAPABILITY
  readonly approvalInputDigest: string
  readonly approvalRequestIdentity: string
  readonly approvalRequestInstanceId: string
  readonly askedEvidenceIdentity: string
  readonly askedEvidenceCommitIdentity: string
  readonly decidedEvidenceIdentity: string
  readonly decidedEvidenceCommitIdentity: string
  readonly outcome: "allowed-once"
  readonly admissionAttemptLimit: typeof KDO_H4_R4B_A_ADMISSION_ATTEMPT_LIMIT
  readonly permitIdentity: string
}

export interface SandboxAdmissionPermitCommit {
  readonly version: typeof KDO_H4_R4B_A_PERMIT_COMMIT_VERSION
  readonly permitIdentity: string
  readonly durability: "durable"
  readonly commitIdentity: string
}

export interface SandboxAdmissionConsumptionReservation {
  readonly version: typeof KDO_H4_R4B_A_CONSUMPTION_RESERVATION_VERSION
  readonly permitIdentity: string
  readonly executionAttemptIdentity: string
  readonly reservationIdentity: string
}

type PlainRecord = Record<string, unknown>
const SHA256_IDENTITY = /^[0-9a-f]{64}$/

function sha256Domain(domain: string, orderedPreimage: readonly unknown[]): string {
  return createHash("sha256")
    .update(Buffer.from(`KODAC-H4-R4B-A\0${domain}\0V1\0`, "ascii"))
    .update(Buffer.from(JSON.stringify(orderedPreimage), "utf8"))
    .digest("hex")
}

function asPlainRecord(value: unknown, label: string): PlainRecord {
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
    if (!descriptor.enumerable) throw new TypeError(`${label}.${key} must be enumerable`)
    if (descriptor.value === undefined) throw new TypeError(`${label}.${key} must be defined`)
  }
  return value as PlainRecord
}

function exactKeys(record: PlainRecord, expected: readonly string[], label: string): void {
  const actual = Object.keys(record).sort()
  const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new TypeError(`${label} must contain exactly: ${wanted.join(", ")}`)
  }
}

function requireIdentity(value: unknown, label: string): string {
  if (typeof value !== "string" || !SHA256_IDENTITY.test(value)) {
    throw new TypeError(`${label} must be a lowercase SHA-256 identity`)
  }
  return value
}

function canonicalEmptyPaths(value: unknown, label: string): readonly string[] {
  if (!Array.isArray(value) || utilTypes.isProxy(value) || Object.getPrototypeOf(value) !== Array.prototype) {
    throw new TypeError(`${label} must be a non-proxy plain array`)
  }
  if (Object.getOwnPropertySymbols(value).length !== 0) throw new TypeError(`${label} must not contain symbol fields`)
  const descriptors = Object.getOwnPropertyDescriptors(value)
  const lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length")
  if (lengthDescriptor === undefined || !("value" in lengthDescriptor) || lengthDescriptor.value !== 0) {
    throw new TypeError(`${label} must be exactly empty`)
  }
  if (Object.keys(descriptors).some((key) => key !== "length")) throw new TypeError(`${label} must contain only the length field`)
  return Object.freeze([])
}

function canonicalEvidence(
  value: unknown,
  binding: SandboxExecutionApprovalBinding,
  phase: "asked" | "decided",
  outcome?: "allowed-once",
): ApprovalEvidence {
  const label = `R4B-A ${phase} approval evidence`
  const record = asPlainRecord(value, label)
  exactKeys(
    record,
    phase === "asked"
      ? ["version", "evidenceIdentity", "phase", "requestIdentity", "requestInstanceId", "intent"]
      : ["version", "evidenceIdentity", "phase", "requestIdentity", "requestInstanceId", "intent", "outcome"],
    label,
  )
  if (record.version !== KDO_H4_R1_APPROVAL_VERSION) throw new TypeError(`${label} version mismatch`)
  if (record.phase !== phase) throw new TypeError(`${label} phase mismatch`)
  if (record.requestIdentity !== binding.approvalRequestIdentity) throw new TypeError(`${label} requestIdentity mismatch`)
  if (record.requestInstanceId !== binding.approvalRequestInstanceId) throw new TypeError(`${label} requestInstanceId mismatch`)
  if (phase === "decided" && record.outcome !== outcome) throw new TypeError(`${label} outcome must be allowed-once`)

  const intent = asPlainRecord(record.intent, `${label} intent`)
  exactKeys(intent, ["capability", "paths", "inputDigest"], `${label} intent`)
  if (intent.capability !== binding.approvalCapability) throw new TypeError(`${label} capability mismatch`)
  canonicalEmptyPaths(intent.paths, `${label} paths`)
  if (intent.inputDigest !== binding.approvalInputDigest) throw new TypeError(`${label} inputDigest mismatch`)

  const expected = phase === "asked"
    ? createApprovalEvidence(binding.approvalRequest, "asked")
    : createApprovalEvidence(binding.approvalRequest, "decided", "allowed-once")
  if (record.evidenceIdentity !== expected.evidenceIdentity) throw new TypeError(`${label} evidenceIdentity mismatch`)
  return expected
}

function canonicalEvidenceCommit(value: unknown, evidence: ApprovalEvidence, label: string): ApprovalEvidenceCommit {
  const record = asPlainRecord(value, label)
  exactKeys(record, ["version", "evidenceIdentity", "durability"], label)
  const normalized = Object.freeze({
    version: record.version,
    evidenceIdentity: requireIdentity(record.evidenceIdentity, `${label} evidenceIdentity`),
    durability: record.durability,
  })
  return validateApprovalEvidenceCommit(normalized, evidence)
}

function approvalEvidenceCommitIdentity(commit: ApprovalEvidenceCommit): string {
  return sha256Domain("APPROVAL_EVIDENCE_COMMIT", [
    KDO_H4_R1_EVIDENCE_COMMIT_VERSION,
    commit.evidenceIdentity,
    commit.durability,
  ])
}

function permitPreimage(input: Omit<SandboxAdmissionPermit, "permitIdentity" | "binding" | "askedEvidence" | "askedEvidenceCommit" | "decidedEvidence" | "decidedEvidenceCommit">): readonly unknown[] {
  return Object.freeze([
    input.version,
    KDO_H4_R4A_VERSION,
    KDO_H4_R1_APPROVAL_VERSION,
    KDO_H4_R1_EVIDENCE_COMMIT_VERSION,
    input.bindingIdentity,
    input.requirementIdentity,
    input.workloadIdentity,
    input.sourceIdentity,
    input.sourceDigest,
    input.entrypointIdentity,
    input.resourcePolicyIdentity,
    input.networkPolicyIdentity,
    input.confinementRequestIdentity,
    input.workspaceIdentity,
    input.executionIntentIdentity,
    input.requiredSemanticRuntimeClass,
    input.downgradePolicy,
    input.credentialBindingIdentity,
    input.approvalCapability,
    input.approvalInputDigest,
    input.approvalRequestIdentity,
    input.approvalRequestInstanceId,
    input.askedEvidenceIdentity,
    input.askedEvidenceCommitIdentity,
    input.decidedEvidenceIdentity,
    input.decidedEvidenceCommitIdentity,
    input.outcome,
    input.admissionAttemptLimit,
  ])
}

export function createSandboxAdmissionPermit(value: unknown): SandboxAdmissionPermit {
  const input = asPlainRecord(value, "R4B-A admission permit input")
  exactKeys(input, ["binding", "askedEvidence", "askedEvidenceCommit", "decidedEvidence", "decidedEvidenceCommit"], "R4B-A admission permit input")

  const binding = validateSandboxExecutionApprovalBinding(input.binding)
  const askedEvidence = canonicalEvidence(input.askedEvidence, binding, "asked")
  const askedEvidenceCommit = canonicalEvidenceCommit(input.askedEvidenceCommit, askedEvidence, "R4B-A asked evidence commit")
  const decidedEvidence = canonicalEvidence(input.decidedEvidence, binding, "decided", "allowed-once")
  const decidedEvidenceCommit = canonicalEvidenceCommit(input.decidedEvidenceCommit, decidedEvidence, "R4B-A decided evidence commit")

  const base = Object.freeze({
    version: KDO_H4_R4B_A_VERSION,
    binding,
    askedEvidence,
    askedEvidenceCommit,
    decidedEvidence,
    decidedEvidenceCommit,
    bindingIdentity: binding.bindingIdentity,
    requirementIdentity: binding.requirementIdentity,
    workloadIdentity: binding.workloadIdentity,
    sourceIdentity: binding.sourceIdentity,
    sourceDigest: binding.sourceDigest,
    entrypointIdentity: binding.entrypointIdentity,
    resourcePolicyIdentity: binding.resourcePolicyIdentity,
    networkPolicyIdentity: binding.networkPolicyIdentity,
    confinementRequestIdentity: binding.confinementRequestIdentity,
    workspaceIdentity: binding.workspaceIdentity,
    executionIntentIdentity: binding.executionIntentIdentity,
    requiredSemanticRuntimeClass: binding.requiredSemanticRuntimeClass,
    downgradePolicy: binding.downgradePolicy,
    credentialBindingIdentity: binding.credentialBindingIdentity,
    approvalCapability: binding.approvalCapability,
    approvalInputDigest: binding.approvalInputDigest,
    approvalRequestIdentity: binding.approvalRequestIdentity,
    approvalRequestInstanceId: binding.approvalRequestInstanceId,
    askedEvidenceIdentity: askedEvidence.evidenceIdentity,
    askedEvidenceCommitIdentity: approvalEvidenceCommitIdentity(askedEvidenceCommit),
    decidedEvidenceIdentity: decidedEvidence.evidenceIdentity,
    decidedEvidenceCommitIdentity: approvalEvidenceCommitIdentity(decidedEvidenceCommit),
    outcome: "allowed-once" as const,
    admissionAttemptLimit: KDO_H4_R4B_A_ADMISSION_ATTEMPT_LIMIT,
  })

  return Object.freeze({
    ...base,
    permitIdentity: sha256Domain("SANDBOX_ADMISSION_PERMIT", permitPreimage(base)),
  })
}

const PERMIT_KEYS = Object.freeze([
  "version",
  "binding",
  "askedEvidence",
  "askedEvidenceCommit",
  "decidedEvidence",
  "decidedEvidenceCommit",
  "bindingIdentity",
  "requirementIdentity",
  "workloadIdentity",
  "sourceIdentity",
  "sourceDigest",
  "entrypointIdentity",
  "resourcePolicyIdentity",
  "networkPolicyIdentity",
  "confinementRequestIdentity",
  "workspaceIdentity",
  "executionIntentIdentity",
  "requiredSemanticRuntimeClass",
  "downgradePolicy",
  "credentialBindingIdentity",
  "approvalCapability",
  "approvalInputDigest",
  "approvalRequestIdentity",
  "approvalRequestInstanceId",
  "askedEvidenceIdentity",
  "askedEvidenceCommitIdentity",
  "decidedEvidenceIdentity",
  "decidedEvidenceCommitIdentity",
  "outcome",
  "admissionAttemptLimit",
  "permitIdentity",
] as const)

type PermitScalarKey = Exclude<(typeof PERMIT_KEYS)[number], "binding" | "askedEvidence" | "askedEvidenceCommit" | "decidedEvidence" | "decidedEvidenceCommit">

export function validateSandboxAdmissionPermit(value: unknown): SandboxAdmissionPermit {
  const record = asPlainRecord(value, "R4B-A sandbox admission permit")
  exactKeys(record, PERMIT_KEYS, "R4B-A sandbox admission permit")
  if (record.version !== KDO_H4_R4B_A_VERSION) throw new TypeError("R4B-A permit version mismatch")

  const rebuilt = createSandboxAdmissionPermit({
    binding: record.binding,
    askedEvidence: record.askedEvidence,
    askedEvidenceCommit: record.askedEvidenceCommit,
    decidedEvidence: record.decidedEvidence,
    decidedEvidenceCommit: record.decidedEvidenceCommit,
  })
  for (const key of PERMIT_KEYS) {
    if (key === "binding" || key === "askedEvidence" || key === "askedEvidenceCommit" || key === "decidedEvidence" || key === "decidedEvidenceCommit") continue
    if (record[key] !== rebuilt[key as PermitScalarKey]) throw new TypeError(`R4B-A permit ${key} mismatch`)
  }
  return rebuilt
}

function permitCommitIdentity(permitIdentity: string): string {
  return sha256Domain("SANDBOX_ADMISSION_PERMIT_COMMIT", [
    KDO_H4_R4B_A_PERMIT_COMMIT_VERSION,
    permitIdentity,
    "durable",
  ])
}

export function createSandboxAdmissionPermitCommit(permitValue: unknown): SandboxAdmissionPermitCommit {
  const permit = validateSandboxAdmissionPermit(permitValue)
  return Object.freeze({
    version: KDO_H4_R4B_A_PERMIT_COMMIT_VERSION,
    permitIdentity: permit.permitIdentity,
    durability: "durable" as const,
    commitIdentity: permitCommitIdentity(permit.permitIdentity),
  })
}

export function validateSandboxAdmissionPermitCommit(value: unknown, permitValue: unknown): SandboxAdmissionPermitCommit {
  const permit = validateSandboxAdmissionPermit(permitValue)
  const record = asPlainRecord(value, "R4B-A admission permit commit")
  exactKeys(record, ["version", "permitIdentity", "durability", "commitIdentity"], "R4B-A admission permit commit")
  if (record.version !== KDO_H4_R4B_A_PERMIT_COMMIT_VERSION) throw new TypeError("R4B-A permit commit version mismatch")
  if (record.permitIdentity !== permit.permitIdentity) throw new TypeError("R4B-A permit commit permitIdentity mismatch")
  if (record.durability !== "durable") throw new TypeError("R4B-A permit commit must attest durable persistence")
  const commitIdentity = requireIdentity(record.commitIdentity, "R4B-A permit commit commitIdentity")
  const expected = createSandboxAdmissionPermitCommit(permit)
  if (commitIdentity !== expected.commitIdentity) throw new TypeError("R4B-A permit commit commitIdentity mismatch")
  return expected
}

export function createSandboxAdmissionConsumptionReservation(
  permitValue: unknown,
  executionAttemptIdentityValue: unknown,
): SandboxAdmissionConsumptionReservation {
  const permit = validateSandboxAdmissionPermit(permitValue)
  const executionAttemptIdentity = requireIdentity(executionAttemptIdentityValue, "R4B-A consumption executionAttemptIdentity")
  return Object.freeze({
    version: KDO_H4_R4B_A_CONSUMPTION_RESERVATION_VERSION,
    permitIdentity: permit.permitIdentity,
    executionAttemptIdentity,
    reservationIdentity: sha256Domain("SANDBOX_ADMISSION_CONSUMPTION_RESERVATION", [
      KDO_H4_R4B_A_CONSUMPTION_RESERVATION_VERSION,
      permit.permitIdentity,
      executionAttemptIdentity,
    ]),
  })
}

export function validateSandboxAdmissionConsumptionReservation(
  value: unknown,
  permitValue: unknown,
): SandboxAdmissionConsumptionReservation {
  const record = asPlainRecord(value, "R4B-A admission consumption reservation")
  exactKeys(record, ["version", "permitIdentity", "executionAttemptIdentity", "reservationIdentity"], "R4B-A admission consumption reservation")
  if (record.version !== KDO_H4_R4B_A_CONSUMPTION_RESERVATION_VERSION) throw new TypeError("R4B-A consumption reservation version mismatch")
  const rebuilt = createSandboxAdmissionConsumptionReservation(permitValue, record.executionAttemptIdentity)
  for (const key of ["permitIdentity", "executionAttemptIdentity", "reservationIdentity"] as const) {
    if (record[key] !== rebuilt[key]) throw new TypeError(`R4B-A consumption reservation ${key} mismatch`)
  }
  return rebuilt
}
