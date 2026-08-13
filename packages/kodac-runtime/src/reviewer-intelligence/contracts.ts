export const KRI_R2_FINDING_VERSION = "kri-r2-finding-v1" as const
export const KRI_R2_ADJUDICATION_VERSION = "kri-r2-adjudication-v1" as const

export type FindingSeverity = "blocker" | "critical" | "high" | "medium" | "low" | "info"
export type FindingFreshness = "CURRENT" | "STALE"
export type FindingState = "NEW" | "CONFIRMED" | "REJECTED" | "DUPLICATE" | "STALE" | "FIXED" | "REVERIFIED"
export type AdjudicationAction = "CONFIRM" | "REJECT" | "MARK_DUPLICATE" | "MARK_FIXED" | "REVERIFY"

export interface ReviewIdentity {
  reviewRunId: string
  reviewerId: string
  reviewerVersion: string
  policyIdentity: string
  canonicalBase: string
  reviewedHead: string
  currentHead: string
}

export interface AffectedRange {
  startLine: number
  endLine: number
}

export interface ReviewClaim {
  claimKey: string
  review: ReviewIdentity
  path: string
  range?: AffectedRange
  summary: string
  contractClaim: string
  category: string
  severity: FindingSeverity
  confidenceBps: number
  evidenceRefs: string[]
}

export interface FindingRecord {
  version: typeof KRI_R2_FINDING_VERSION
  findingIdentity: string
  claimKey: string
  review: ReviewIdentity
  path: string
  range?: AffectedRange
  summary: string
  contractClaim: string
  category: string
  severity: FindingSeverity
  confidenceBps: number
  evidenceRefs: string[]
  freshness: FindingFreshness
  state: FindingState
}

export interface AdjudicationDecision {
  action: AdjudicationAction
  adjudicatorId: string
  evidenceRefs: string[]
  duplicateOf?: string
  correctionRef?: string
  reverificationRef?: string
}

export interface AdjudicationRecord {
  version: typeof KRI_R2_ADJUDICATION_VERSION
  adjudicationIdentity: string
  findingIdentity: string
  action: AdjudicationAction
  previousState: FindingState
  resultingState: FindingState
  adjudicatorId: string
  evidenceRefs: string[]
  duplicateOf?: string
  correctionRef?: string
  reverificationRef?: string
}

export interface AdjudicationResult {
  finding: FindingRecord
  adjudication: AdjudicationRecord
}
