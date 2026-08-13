import type { ContextBundle } from "../context-engine/contracts.ts"
import type { FindingRecord, ReviewClaim } from "./contracts.ts"
import type { ReviewerIntelligenceRuntime } from "./runtime.ts"

export const KRI_R3_PROVIDER_REQUEST_VERSION = "kri-r3-provider-request-v1" as const
export const KRI_R3_REVIEW_RUN_VERSION = "kri-r3-review-run-v1" as const

export type ReviewerRunStatus =
  | "COMPLETED"
  | "STALE"
  | "PROVIDER_FAILED"
  | "TIMED_OUT"
  | "INVALID_PROVIDER_OUTPUT"

export type ReviewerRunFailureCode = "provider-error" | "timeout" | "invalid-output" | null

export interface ReviewerExecutionRequest {
  taskId: string
  policyIdentity: string
  canonicalBase: string
  reviewedHead: string
  instructions: string
  contextBundle: ContextBundle
}

export interface ReviewerProviderContextItem {
  itemId: string
  subjectPath: string
  evidenceClass: string
  text: string
  trust: "untrusted-repository-data"
}

export interface ReviewerProviderRequest {
  version: typeof KRI_R3_PROVIDER_REQUEST_VERSION
  taskId: string
  policyIdentity: string
  canonicalBase: string
  reviewedHead: string
  instructions: string
  contextBundleIdentity: string
  contextItems: ReviewerProviderContextItem[]
  maxClaims: number
}

export interface ReviewerProviderClaim {
  claimKey: string
  path: string
  range?: {
    startLine: number
    endLine: number
  }
  summary: string
  contractClaim: string
  category: string
  severity: "blocker" | "critical" | "high" | "medium" | "low" | "info"
  confidenceBps: number
  evidenceItemIds: string[]
}

export interface ReviewerProviderOutput {
  claims: ReviewerProviderClaim[]
}

export interface ReviewerProvider {
  readonly providerId: string
  readonly providerVersion: string
  review(request: ReviewerProviderRequest, signal: AbortSignal): Promise<unknown>
}

export interface ReviewRunRecord {
  version: typeof KRI_R3_REVIEW_RUN_VERSION
  reviewRunId: string
  reviewRunIdentity: string
  status: ReviewerRunStatus
  providerId: string
  providerVersion: string
  policyIdentity: string
  canonicalBase: string
  reviewedHead: string
  evaluatedHead: string
  contextBundleIdentity: string
  taskId: string
  instructionsIdentity: string
  acceptedClaimCount: number
  findingIdentities: string[]
  failureCode: ReviewerRunFailureCode
}

export interface ReviewerExecutionResult {
  run: ReviewRunRecord
  claims: ReviewClaim[]
  findings: FindingRecord[]
}

export interface ReviewerExecutionRuntimeOptions {
  provider: ReviewerProvider
  findingRuntime: ReviewerIntelligenceRuntime
  readCurrentHead: () => string | Promise<string>
  maxClaims?: number
  maxContextItems?: number
  maxContextUtf8Bytes?: number
  timeoutMs?: number
}