import { createHash, randomUUID } from "node:crypto"
import { types as utilTypes } from "node:util"
import type { PolicyResult } from "../trust/policy.ts"
import type { AffectedPaths } from "../edit/patch.ts"
import {
  validateConfinementReceiptBinding,
  type ConfinementReceiptBinding,
} from "../trust/confinement-runtime.ts"

export type ReceiptResult =
  | { status: "success"; affected: AffectedPaths; postStateDigest: string }
  | { status: "success"; outputDigest: string; outputBytes: number; exitCode: number }
  | { status: "blocked"; reason: string }
  | { status: "failure"; error: string }

export interface ApprovalReceiptBinding {
  version: "kodac-h4-r1-one-shot-approval-v1"
  requestIdentity: string
  requestInstanceId: string
  decisionEvidenceIdentity: string
  outcome: "allowed-once"
}

export interface ReceiptConfinementBinding extends ConfinementReceiptBinding {
  bindingIdentity: string
}

export interface ExecutionReceipt {
  receiptId: string
  capability: string
  inputDigest: string
  paths: string[]
  policy: PolicyResult
  approval?: ApprovalReceiptBinding
  confinement?: ReceiptConfinementBinding
  startedAt: string
  completedAt: string
  result: ReceiptResult
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

function immutableStrings(values: string[]): string[] {
  return Object.freeze([...values]) as unknown as string[]
}

function immutablePolicy(policy: PolicyResult): PolicyResult {
  return Object.freeze({ decision: policy.decision, reason: policy.reason })
}

function immutableApproval(approval: ApprovalReceiptBinding): ApprovalReceiptBinding {
  return Object.freeze({
    version: approval.version,
    requestIdentity: approval.requestIdentity,
    requestInstanceId: approval.requestInstanceId,
    decisionEvidenceIdentity: approval.decisionEvidenceIdentity,
    outcome: approval.outcome,
  })
}

function confinementBase(confinement: ConfinementReceiptBinding): ConfinementReceiptBinding {
  return validateConfinementReceiptBinding(confinement)
}

function immutableConfinement(confinement: ConfinementReceiptBinding): ReceiptConfinementBinding {
  const base = confinementBase(confinement)
  return Object.freeze({
    ...base,
    bindingIdentity: sha256(JSON.stringify(base)),
  })
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

export function validateReceiptConfinementBinding(value: unknown): ReceiptConfinementBinding {
  const record = asPlainRecord(value, "receipt confinement binding")
  exactKeys(
    record,
    [
      "version",
      "bindingIdentity",
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
    "receipt confinement binding",
  )
  const base = confinementBase({
    version: record.version as ConfinementReceiptBinding["version"],
    requestIdentity: record.requestIdentity as string,
    executionAttemptIdentity: record.executionAttemptIdentity as string,
    backendIdentity: record.backendIdentity as string,
    enforcementEvidenceIdentity: record.enforcementEvidenceIdentity as string,
    durableRecordIdentity: record.durableRecordIdentity as string,
    durableCommitAcknowledgmentIdentity: record.durableCommitAcknowledgmentIdentity as string,
    launcherArtifactSha256: record.launcherArtifactSha256 as string,
    claimSet: record.claimSet as ConfinementReceiptBinding["claimSet"],
    enforcement: record.enforcement as ConfinementReceiptBinding["enforcement"],
  })
  if (typeof record.bindingIdentity !== "string" || !/^[0-9a-f]{64}$/.test(record.bindingIdentity)) {
    throw new TypeError("receipt confinement binding identity must be a lowercase SHA-256 identity")
  }
  const expectedIdentity = sha256(JSON.stringify(base))
  if (record.bindingIdentity !== expectedIdentity) throw new TypeError("receipt confinement binding identity mismatch")
  return Object.freeze({ ...base, bindingIdentity: expectedIdentity })
}

function immutableAffected(affected: AffectedPaths): AffectedPaths {
  return Object.freeze({
    added: immutableStrings(affected.added),
    modified: immutableStrings(affected.modified),
    deleted: immutableStrings(affected.deleted),
  })
}

function immutableResult(result: ReceiptResult): ReceiptResult {
  if (result.status === "success" && "affected" in result) {
    return Object.freeze({
      status: "success",
      affected: immutableAffected(result.affected),
      postStateDigest: result.postStateDigest,
    })
  }
  if (result.status === "success") {
    return Object.freeze({
      status: "success",
      outputDigest: result.outputDigest,
      outputBytes: result.outputBytes,
      exitCode: result.exitCode,
    })
  }
  if (result.status === "blocked") {
    return Object.freeze({ status: "blocked", reason: result.reason })
  }
  return Object.freeze({ status: "failure", error: result.error })
}

export function createReceipt(input: Omit<ExecutionReceipt, "receiptId" | "confinement"> & {
  confinement?: ConfinementReceiptBinding
}): ExecutionReceipt {
  return Object.freeze({
    receiptId: randomUUID(),
    capability: input.capability,
    inputDigest: input.inputDigest,
    paths: immutableStrings(input.paths),
    policy: immutablePolicy(input.policy),
    ...(input.approval === undefined ? {} : { approval: immutableApproval(input.approval) }),
    ...(input.confinement === undefined ? {} : { confinement: immutableConfinement(input.confinement) }),
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    result: immutableResult(input.result),
  })
}
