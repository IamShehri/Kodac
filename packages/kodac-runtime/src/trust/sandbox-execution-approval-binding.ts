import { createHash } from "node:crypto"
import { types as utilTypes } from "node:util"

import {
  KDO_H4_R1_APPROVAL_VERSION,
  type ApprovalRequest,
} from "./approval.ts"
import {
  KDO_H4_R3B_DOWNGRADE_POLICY,
  KDO_H4_R3B_EXECUTION_REQUIREMENT_VERSION,
  validateSandboxExecutionRequirement,
  type SandboxExecutionRequirement,
  type SandboxSemanticRuntimeClass,
} from "./sandbox-backend-evidence.ts"
import { KDO_H4_R3A_WORKLOAD_VERSION } from "./sandbox-workload.ts"
import type { ExecutionIntent } from "./policy.ts"

export const KDO_H4_R4A_VERSION = "kodac-h4-r4a-exact-sandbox-approval-binding-v1" as const
export const KDO_H4_R4A_CAPABILITY = "runtime.execute.sandbox" as const
export const KDO_H4_R4A_LIMITS = Object.freeze({
  maxRequestInstanceIdBytes: 128,
} as const)

export interface SandboxExecutionApprovalBinding {
  readonly version: typeof KDO_H4_R4A_VERSION
  readonly requirement: SandboxExecutionRequirement
  readonly approvalRequest: ApprovalRequest
  readonly requirementIdentity: string
  readonly workloadIdentity: string
  readonly sourceIdentity: string
  readonly sourceDigest: string
  readonly entrypointIdentity: string
  readonly resourcePolicyIdentity: string
  readonly networkPolicyIdentity: string
  readonly confinementRequestIdentity: string
  readonly executionIntentIdentity: string
  readonly workspaceIdentity: string
  readonly requiredSemanticRuntimeClass: SandboxSemanticRuntimeClass
  readonly downgradePolicy: typeof KDO_H4_R3B_DOWNGRADE_POLICY
  readonly credentialBindingIdentity: null
  readonly approvalCapability: typeof KDO_H4_R4A_CAPABILITY
  readonly approvalInputDigest: string
  readonly approvalRequestIdentity: string
  readonly approvalRequestInstanceId: string
  readonly bindingIdentity: string
}

type PlainRecord = Record<string, unknown>
const SHA256_IDENTITY = /^[0-9a-f]{64}$/

function byteLength(value: string): number {
  return Buffer.byteLength(value, "utf8")
}

function sha256Utf8(value: string): string {
  return createHash("sha256").update(Buffer.from(value, "utf8")).digest("hex")
}

function sha256Domain(domain: string, orderedPreimage: readonly unknown[]): string {
  return createHash("sha256")
    .update(Buffer.from(`KODAC-H4-R4A\0${domain}\0V1\0`, "ascii"))
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

function requestInstanceId(value: unknown): string {
  if (typeof value !== "string" || value.length === 0 || value.includes("\0")) {
    throw new TypeError("approval requestInstanceId must be a non-empty NUL-free string")
  }
  if (byteLength(value) > KDO_H4_R4A_LIMITS.maxRequestInstanceIdBytes) {
    throw new RangeError(`approval requestInstanceId exceeds ${KDO_H4_R4A_LIMITS.maxRequestInstanceIdBytes} UTF-8 bytes`)
  }
  return value
}

function canonicalEmptyPaths(value: unknown): readonly string[] {
  if (!Array.isArray(value) || utilTypes.isProxy(value) || Object.getPrototypeOf(value) !== Array.prototype) {
    throw new TypeError("R4A approval intent paths must be a non-proxy plain array")
  }
  if (Object.getOwnPropertySymbols(value).length !== 0) throw new TypeError("R4A approval intent paths must not contain symbol fields")
  const descriptors = Object.getOwnPropertyDescriptors(value)
  const lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length")
  if (lengthDescriptor === undefined || !("value" in lengthDescriptor) || lengthDescriptor.value !== 0) {
    throw new TypeError("R4A approval intent paths must be exactly empty")
  }
  if (Object.keys(descriptors).some((key) => key !== "length")) {
    throw new TypeError("R4A approval intent paths must contain only the length field")
  }
  return Object.freeze([])
}

function approvalIntentPreimage(requirement: SandboxExecutionRequirement): readonly unknown[] {
  const workload = requirement.workload
  return Object.freeze([
    KDO_H4_R4A_VERSION,
    KDO_H4_R3B_EXECUTION_REQUIREMENT_VERSION,
    requirement.requirementIdentity,
    KDO_H4_R3A_WORKLOAD_VERSION,
    workload.workloadIdentity,
    workload.source.sourceIdentity,
    workload.source.digest,
    workload.entrypoint.entrypointIdentity,
    workload.resourcePolicy.resourcePolicyIdentity,
    workload.networkPolicy.networkPolicyIdentity,
    workload.confinementRequestIdentity,
    workload.executionIntentIdentity,
    workload.workspaceIdentity,
    requirement.requiredSemanticRuntimeClass,
    requirement.downgradePolicy,
    workload.credentialBindingIdentity,
  ])
}

function approvalInputDigest(requirement: SandboxExecutionRequirement): string {
  return sha256Domain("SANDBOX_APPROVAL_INTENT", approvalIntentPreimage(requirement))
}

export function createSandboxExecutionApprovalIntent(requirementValue: unknown): ExecutionIntent {
  const requirement = validateSandboxExecutionRequirement(requirementValue)
  return Object.freeze({
    capability: KDO_H4_R4A_CAPABILITY,
    paths: Object.freeze([]) as unknown as string[],
    inputDigest: approvalInputDigest(requirement),
  })
}

function h4R1RequestIdentity(intent: ApprovalRequest["intent"]): string {
  const intentPreimage = JSON.stringify({
    capability: intent.capability,
    paths: intent.paths,
    inputDigest: intent.inputDigest,
  })
  return sha256Utf8(`${KDO_H4_R1_APPROVAL_VERSION}\n${intentPreimage}`)
}

function canonicalApprovalRequest(value: unknown, expectedIntent: ExecutionIntent): ApprovalRequest {
  const record = asPlainRecord(value, "R4A approval request")
  exactKeys(record, ["version", "requestIdentity", "requestInstanceId", "intent"], "R4A approval request")
  if (record.version !== KDO_H4_R1_APPROVAL_VERSION) throw new TypeError("R4A approval request version mismatch")

  const intentRecord = asPlainRecord(record.intent, "R4A approval request intent")
  exactKeys(intentRecord, ["capability", "paths", "inputDigest"], "R4A approval request intent")
  if (intentRecord.capability !== KDO_H4_R4A_CAPABILITY || intentRecord.capability !== expectedIntent.capability) {
    throw new TypeError("R4A approval request capability mismatch")
  }
  const paths = canonicalEmptyPaths(intentRecord.paths)
  const inputDigest = requireIdentity(intentRecord.inputDigest, "R4A approval request inputDigest")
  if (inputDigest !== expectedIntent.inputDigest) throw new TypeError("R4A approval request inputDigest mismatch")

  const intent = Object.freeze({
    capability: KDO_H4_R4A_CAPABILITY,
    paths: paths as unknown as string[],
    inputDigest,
  })
  const requestIdentity = requireIdentity(record.requestIdentity, "R4A approval request requestIdentity")
  if (requestIdentity !== h4R1RequestIdentity(intent)) throw new TypeError("R4A approval request requestIdentity mismatch")
  const instanceId = requestInstanceId(record.requestInstanceId)

  return Object.freeze({
    version: KDO_H4_R1_APPROVAL_VERSION,
    requestIdentity,
    requestInstanceId: instanceId,
    intent,
  })
}

function bindingPreimage(input: Omit<SandboxExecutionApprovalBinding, "bindingIdentity" | "requirement" | "approvalRequest">): readonly unknown[] {
  return Object.freeze([
    input.version,
    KDO_H4_R1_APPROVAL_VERSION,
    KDO_H4_R3B_EXECUTION_REQUIREMENT_VERSION,
    KDO_H4_R3A_WORKLOAD_VERSION,
    input.requirementIdentity,
    input.workloadIdentity,
    input.sourceIdentity,
    input.sourceDigest,
    input.entrypointIdentity,
    input.resourcePolicyIdentity,
    input.networkPolicyIdentity,
    input.confinementRequestIdentity,
    input.executionIntentIdentity,
    input.workspaceIdentity,
    input.requiredSemanticRuntimeClass,
    input.downgradePolicy,
    input.credentialBindingIdentity,
    input.approvalCapability,
    input.approvalInputDigest,
    input.approvalRequestIdentity,
    input.approvalRequestInstanceId,
  ])
}

export function createSandboxExecutionApprovalBinding(
  requirementValue: unknown,
  approvalRequestValue: unknown,
): SandboxExecutionApprovalBinding {
  const requirement = validateSandboxExecutionRequirement(requirementValue)
  const expectedIntent = createSandboxExecutionApprovalIntent(requirement)
  const approvalRequest = canonicalApprovalRequest(approvalRequestValue, expectedIntent)
  const workload = requirement.workload

  const base = Object.freeze({
    version: KDO_H4_R4A_VERSION,
    requirement,
    approvalRequest,
    requirementIdentity: requirement.requirementIdentity,
    workloadIdentity: workload.workloadIdentity,
    sourceIdentity: workload.source.sourceIdentity,
    sourceDigest: workload.source.digest,
    entrypointIdentity: workload.entrypoint.entrypointIdentity,
    resourcePolicyIdentity: workload.resourcePolicy.resourcePolicyIdentity,
    networkPolicyIdentity: workload.networkPolicy.networkPolicyIdentity,
    confinementRequestIdentity: workload.confinementRequestIdentity,
    executionIntentIdentity: workload.executionIntentIdentity,
    workspaceIdentity: workload.workspaceIdentity,
    requiredSemanticRuntimeClass: requirement.requiredSemanticRuntimeClass,
    downgradePolicy: requirement.downgradePolicy,
    credentialBindingIdentity: workload.credentialBindingIdentity,
    approvalCapability: KDO_H4_R4A_CAPABILITY,
    approvalInputDigest: expectedIntent.inputDigest,
    approvalRequestIdentity: approvalRequest.requestIdentity,
    approvalRequestInstanceId: approvalRequest.requestInstanceId,
  })

  return Object.freeze({
    ...base,
    bindingIdentity: sha256Domain("SANDBOX_APPROVAL_BINDING", bindingPreimage(base)),
  })
}

const BINDING_KEYS = Object.freeze([
  "version",
  "requirement",
  "approvalRequest",
  "requirementIdentity",
  "workloadIdentity",
  "sourceIdentity",
  "sourceDigest",
  "entrypointIdentity",
  "resourcePolicyIdentity",
  "networkPolicyIdentity",
  "confinementRequestIdentity",
  "executionIntentIdentity",
  "workspaceIdentity",
  "requiredSemanticRuntimeClass",
  "downgradePolicy",
  "credentialBindingIdentity",
  "approvalCapability",
  "approvalInputDigest",
  "approvalRequestIdentity",
  "approvalRequestInstanceId",
  "bindingIdentity",
] as const)

type BindingScalarKey = Exclude<(typeof BINDING_KEYS)[number], "requirement" | "approvalRequest">

export function validateSandboxExecutionApprovalBinding(value: unknown): SandboxExecutionApprovalBinding {
  const record = asPlainRecord(value, "R4A sandbox execution approval binding")
  exactKeys(record, BINDING_KEYS, "R4A sandbox execution approval binding")
  if (record.version !== KDO_H4_R4A_VERSION) throw new TypeError("R4A binding version mismatch")

  const rebuilt = createSandboxExecutionApprovalBinding(record.requirement, record.approvalRequest)
  for (const key of BINDING_KEYS) {
    if (key === "requirement" || key === "approvalRequest") continue
    if (record[key] !== rebuilt[key as BindingScalarKey]) {
      throw new TypeError(`R4A binding ${key} mismatch`)
    }
  }
  return rebuilt
}
