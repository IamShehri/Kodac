export const KRI_R4_QUALIFICATION_VERSION = "kri-r4-reviewer-qualification-v1" as const
export const KRI_R4_CAPABILITY_SCOPE = "historical-claim-disposition-v1" as const
export const KRI_R4_DEFAULT_POLICY_VERSION = "kri-r4-default-policy-v1" as const

export type GoldDisposition = "VALID_ACCEPTED" | "INVALID_REJECTED"
export type QualificationObservationOutcome =
  | GoldDisposition
  | "ABSTAIN"
  | "PROVIDER_FAILED"
  | "TIMED_OUT"
  | "INVALID_OUTPUT"

export type QualificationDecision = "QUALIFIED" | "NOT_QUALIFIED" | "INSUFFICIENT_EVIDENCE"

export interface ReviewerQualificationCandidate {
  readonly adapterId: string
  readonly adapterVersion: string
  readonly reviewerId: string
  readonly reviewerVersion: string
  readonly modelId?: string
  readonly reviewPolicyIdentity: string
}

export interface GoldBenchmarkCase {
  readonly caseIdentity: string
  readonly goldDisposition: GoldDisposition
}

export interface GoldBenchmarkSet {
  readonly sourceCorpusIdentity: string
  readonly cases: readonly GoldBenchmarkCase[]
}

export interface QualificationObservation {
  readonly caseIdentity: string
  readonly outcome: QualificationObservationOutcome
  readonly latencyMs?: number
  readonly inputTokens?: number
  readonly outputTokens?: number
  readonly reportedCostMicrounits?: number
}

export interface QualificationPolicy {
  readonly version: string
  readonly minTotalCases: number
  readonly minAcceptedCases: number
  readonly minRejectedCases: number
  readonly minExactDispositionAccuracyBps: number
  readonly minAcceptedPrecisionBps: number
  readonly minAcceptedRecallBps: number
  readonly minRejectedRecallBps: number
  readonly minDecisionCoverageBps: number
  readonly maxExecutionFailureBps: number
}

export interface QualificationCounts {
  readonly totalCases: number
  readonly goldAccepted: number
  readonly goldRejected: number
  readonly correctlyAccepted: number
  readonly correctlyRejected: number
  readonly falseAccepted: number
  readonly falseRejected: number
  readonly abstained: number
  readonly providerFailed: number
  readonly timedOut: number
  readonly invalidOutput: number
}

export interface QualificationMetrics {
  readonly counts: QualificationCounts
  readonly exactDispositionAccuracyBps: number
  readonly acceptedPrecisionBps: number | null
  readonly acceptedRecallBps: number | null
  readonly rejectedRecallBps: number | null
  readonly decisionCoverageBps: number
  readonly executionFailureBps: number
  readonly latency: {
    readonly observedCount: number
    readonly p50Ms: number | null
    readonly p95Ms: number | null
  }
  readonly suppliedUsage: {
    readonly observationsWithInputTokens: number
    readonly totalInputTokens: number
    readonly observationsWithOutputTokens: number
    readonly totalOutputTokens: number
    readonly observationsWithReportedCost: number
    readonly totalReportedCostMicrounits: number
  }
}

export interface ReviewerQualificationReport {
  readonly version: typeof KRI_R4_QUALIFICATION_VERSION
  readonly capabilityScope: typeof KRI_R4_CAPABILITY_SCOPE
  readonly candidate: ReviewerQualificationCandidate
  readonly candidateIdentity: string
  readonly sourceCorpusIdentity: string
  readonly benchmarkSetIdentity: string
  readonly qualificationPolicy: QualificationPolicy
  readonly qualificationPolicyIdentity: string
  readonly observations: readonly QualificationObservation[]
  readonly metrics: QualificationMetrics
  readonly decision: QualificationDecision
  readonly reasons: readonly string[]
  readonly reportIdentity: string
}

export interface ReviewerQualificationInput {
  readonly candidate: ReviewerQualificationCandidate
  readonly benchmark: GoldBenchmarkSet
  readonly observations: readonly QualificationObservation[]
  readonly policy?: QualificationPolicy
}
