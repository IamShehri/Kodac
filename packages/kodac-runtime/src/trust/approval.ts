import { createHash, randomUUID } from "node:crypto"
import type { ExecutionIntent } from "./policy.ts"

export const KDO_H4_R1_APPROVAL_VERSION = "kodac-h4-r1-one-shot-approval-v1" as const
export const KDO_H4_R1_EVIDENCE_COMMIT_VERSION = "kodac-h4-r1-approval-evidence-commit-v1" as const

export type ApprovalOutcome = "allowed-once" | "rejected" | "cancelled" | "unavailable"
export type ApprovalEvidencePhase = "asked" | "decided"

export interface ApprovalRequest {
  version: typeof KDO_H4_R1_APPROVAL_VERSION
  requestIdentity: string
  requestInstanceId: string
  intent: {
    capability: string
    paths: string[]
    inputDigest: string
  }
}

export interface ApprovalDecision {
  version: typeof KDO_H4_R1_APPROVAL_VERSION
  requestIdentity: string
  requestInstanceId: string
  outcome: ApprovalOutcome
}

export interface ApprovalEvidence {
  version: typeof KDO_H4_R1_APPROVAL_VERSION
  evidenceIdentity: string
  phase: ApprovalEvidencePhase
  requestIdentity: string
  requestInstanceId: string
  intent: ApprovalRequest["intent"]
  outcome?: ApprovalOutcome
}

export interface ApprovalEvidenceCommit {
  version: typeof KDO_H4_R1_EVIDENCE_COMMIT_VERSION
  evidenceIdentity: string
  durability: "durable"
}

export interface ApprovalService {
  decide(request: ApprovalRequest, options?: { signal?: AbortSignal }): Promise<unknown> | unknown
}

export interface ApprovalEvidenceSink {
  /**
   * Persist the exact evidence record durably and return an acknowledgment only
   * after the durable commit is complete. Callback invocation or in-memory
   * observation alone is not a valid acknowledgment.
   */
  commit(evidence: ApprovalEvidence): Promise<unknown> | unknown
}

export interface ApprovalRuntime {
  service: ApprovalService
  evidence: ApprovalEvidenceSink
}

const OUTCOMES = new Set<ApprovalOutcome>(["allowed-once", "rejected", "cancelled", "unavailable"])

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new TypeError(`${label} must contain exactly: ${wanted.join(", ")}`)
  }
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`)
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain object`)
  return value as Record<string, unknown>
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(`${label} must be a non-empty string`)
  return value
}

function canonicalIntent(intent: ExecutionIntent): ApprovalRequest["intent"] {
  if (typeof intent.capability !== "string" || intent.capability.length === 0) throw new TypeError("approval intent capability must be non-empty")
  if (!Array.isArray(intent.paths) || intent.paths.some((path) => typeof path !== "string")) {
    throw new TypeError("approval intent paths must be an array of strings")
  }
  if (!/^[0-9a-f]{64}$/.test(intent.inputDigest)) throw new TypeError("approval intent inputDigest must be a lowercase SHA-256 digest")
  const paths = [...intent.paths]
  return Object.freeze({ capability: intent.capability, paths: Object.freeze(paths) as unknown as string[], inputDigest: intent.inputDigest })
}

function intentPreimage(intent: ApprovalRequest["intent"]): string {
  return JSON.stringify({ capability: intent.capability, paths: intent.paths, inputDigest: intent.inputDigest })
}

export function createApprovalRequest(intent: ExecutionIntent): ApprovalRequest {
  const canonical = canonicalIntent(intent)
  const requestIdentity = sha256(`${KDO_H4_R1_APPROVAL_VERSION}\n${intentPreimage(canonical)}`)
  return Object.freeze({
    version: KDO_H4_R1_APPROVAL_VERSION,
    requestIdentity,
    requestInstanceId: randomUUID(),
    intent: canonical,
  })
}

export function validateApprovalDecision(value: unknown, request: ApprovalRequest): ApprovalDecision {
  const record = asRecord(value, "approval decision")
  exactKeys(record, ["version", "requestIdentity", "requestInstanceId", "outcome"], "approval decision")
  if (record.version !== KDO_H4_R1_APPROVAL_VERSION) throw new TypeError("approval decision version mismatch")
  const requestIdentity = requireString(record.requestIdentity, "approval decision requestIdentity")
  const requestInstanceId = requireString(record.requestInstanceId, "approval decision requestInstanceId")
  if (requestIdentity !== request.requestIdentity) throw new TypeError("approval decision requestIdentity mismatch")
  if (requestInstanceId !== request.requestInstanceId) throw new TypeError("approval decision requestInstanceId mismatch")
  if (typeof record.outcome !== "string" || !OUTCOMES.has(record.outcome as ApprovalOutcome)) {
    throw new TypeError("approval decision outcome is invalid")
  }
  return Object.freeze({
    version: KDO_H4_R1_APPROVAL_VERSION,
    requestIdentity,
    requestInstanceId,
    outcome: record.outcome as ApprovalOutcome,
  })
}

export function validateApprovalEvidenceCommit(value: unknown, evidence: ApprovalEvidence): ApprovalEvidenceCommit {
  const record = asRecord(value, "approval evidence commit")
  exactKeys(record, ["version", "evidenceIdentity", "durability"], "approval evidence commit")
  if (record.version !== KDO_H4_R1_EVIDENCE_COMMIT_VERSION) {
    throw new TypeError("approval evidence commit version mismatch")
  }
  const evidenceIdentity = requireString(record.evidenceIdentity, "approval evidence commit evidenceIdentity")
  if (evidenceIdentity !== evidence.evidenceIdentity) {
    throw new TypeError("approval evidence commit evidenceIdentity mismatch")
  }
  if (record.durability !== "durable") {
    throw new TypeError("approval evidence commit must attest durable persistence")
  }
  return Object.freeze({
    version: KDO_H4_R1_EVIDENCE_COMMIT_VERSION,
    evidenceIdentity,
    durability: "durable",
  })
}

export function createApprovalEvidence(
  request: ApprovalRequest,
  phase: "asked",
): ApprovalEvidence
export function createApprovalEvidence(
  request: ApprovalRequest,
  phase: "decided",
  outcome: ApprovalOutcome,
): ApprovalEvidence
export function createApprovalEvidence(
  request: ApprovalRequest,
  phase: ApprovalEvidencePhase,
  outcome?: ApprovalOutcome,
): ApprovalEvidence {
  if (phase === "asked" && outcome !== undefined) throw new TypeError("asked approval evidence cannot contain an outcome")
  if (phase === "decided" && (outcome === undefined || !OUTCOMES.has(outcome))) {
    throw new TypeError("decided approval evidence requires a valid outcome")
  }
  const identityPreimage = JSON.stringify({
    version: KDO_H4_R1_APPROVAL_VERSION,
    phase,
    requestIdentity: request.requestIdentity,
    requestInstanceId: request.requestInstanceId,
    intent: request.intent,
    ...(outcome === undefined ? {} : { outcome }),
  })
  return Object.freeze({
    version: KDO_H4_R1_APPROVAL_VERSION,
    evidenceIdentity: sha256(identityPreimage),
    phase,
    requestIdentity: request.requestIdentity,
    requestInstanceId: request.requestInstanceId,
    intent: request.intent,
    ...(outcome === undefined ? {} : { outcome }),
  })
}
