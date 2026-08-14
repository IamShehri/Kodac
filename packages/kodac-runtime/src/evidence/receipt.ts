import { randomUUID } from "node:crypto"
import type { PolicyResult } from "../trust/policy.ts"
import type { AffectedPaths } from "../edit/patch.ts"

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

export interface ExecutionReceipt {
  receiptId: string
  capability: string
  inputDigest: string
  paths: string[]
  policy: PolicyResult
  approval?: ApprovalReceiptBinding
  startedAt: string
  completedAt: string
  result: ReceiptResult
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

export function createReceipt(input: Omit<ExecutionReceipt, "receiptId">): ExecutionReceipt {
  return Object.freeze({
    receiptId: randomUUID(),
    capability: input.capability,
    inputDigest: input.inputDigest,
    paths: immutableStrings(input.paths),
    policy: immutablePolicy(input.policy),
    ...(input.approval === undefined ? {} : { approval: immutableApproval(input.approval) }),
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    result: immutableResult(input.result),
  })
}
