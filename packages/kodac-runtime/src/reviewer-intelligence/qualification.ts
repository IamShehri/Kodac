import { createHash } from "node:crypto"

import {
  KRI_R4_CAPABILITY_SCOPE,
  KRI_R4_DEFAULT_POLICY_VERSION,
  KRI_R4_QUALIFICATION_VERSION,
  type GoldBenchmarkCase,
  type GoldBenchmarkSet,
  type GoldDisposition,
  type QualificationDecision,
  type QualificationMetrics,
  type QualificationObservation,
  type QualificationObservationOutcome,
  type QualificationPolicy,
  type ReviewerQualificationCandidate,
  type ReviewerQualificationInput,
  type ReviewerQualificationReport,
} from "./qualification-contracts.ts"

const SHA256 = /^[0-9a-f]{64}$/
const MAX_CASES = 10_000
const MAX_ID_BYTES = 256
const MAX_POLICY_VERSION_BYTES = 128
const MAX_REASON_BYTES = 128
const MAX_LATENCY_MS = 86_400_000
const MAX_COUNTER = Number.MAX_SAFE_INTEGER

const ROOT_KEYS = [
  "version", "capabilityScope", "candidate", "candidateIdentity", "sourceCorpusIdentity",
  "benchmarkSetIdentity", "benchmarkCases", "qualificationPolicy", "qualificationPolicyIdentity",
  "observations", "metrics", "decision", "reasons", "reportIdentity",
] as const
const CANDIDATE_KEYS = ["adapterId", "adapterVersion", "reviewerId", "reviewerVersion", "modelId", "reviewPolicyIdentity"] as const
const CASE_KEYS = ["caseIdentity", "goldDisposition"] as const
const OBSERVATION_KEYS = ["caseIdentity", "outcome", "latencyMs", "inputTokens", "outputTokens", "reportedCostMicrounits"] as const
const POLICY_KEYS = [
  "version", "minTotalCases", "minAcceptedCases", "minRejectedCases", "minExactDispositionAccuracyBps",
  "minAcceptedPrecisionBps", "minAcceptedRecallBps", "minRejectedRecallBps", "minDecisionCoverageBps",
  "maxExecutionFailureBps",
] as const
const METRICS_KEYS = [
  "counts", "exactDispositionAccuracyBps", "acceptedPrecisionBps", "acceptedRecallBps", "rejectedRecallBps",
  "decisionCoverageBps", "executionFailureBps", "latency", "suppliedUsage",
] as const
const COUNT_KEYS = [
  "totalCases", "goldAccepted", "goldRejected", "correctlyAccepted", "correctlyRejected", "falseAccepted",
  "falseRejected", "abstained", "providerFailed", "timedOut", "invalidOutput",
] as const
const LATENCY_KEYS = ["observedCount", "p50Ms", "p95Ms"] as const
const USAGE_KEYS = [
  "observationsWithInputTokens", "totalInputTokens", "observationsWithOutputTokens", "totalOutputTokens",
  "observationsWithReportedCost", "totalReportedCostMicrounits",
] as const

const OUTCOMES = new Set<QualificationObservationOutcome>([
  "VALID_ACCEPTED", "INVALID_REJECTED", "ABSTAIN", "PROVIDER_FAILED", "TIMED_OUT", "INVALID_OUTPUT",
])
const GOLD_DISPOSITIONS = new Set<GoldDisposition>(["VALID_ACCEPTED", "INVALID_REJECTED"])
const DECISIONS = new Set<QualificationDecision>(["QUALIFIED", "NOT_QUALIFIED", "INSUFFICIENT_EVIDENCE"])

export const DEFAULT_REVIEWER_QUALIFICATION_POLICY: QualificationPolicy = Object.freeze({
  version: KRI_R4_DEFAULT_POLICY_VERSION,
  minTotalCases: 20,
  minAcceptedCases: 5,
  minRejectedCases: 5,
  minExactDispositionAccuracyBps: 9000,
  minAcceptedPrecisionBps: 9000,
  minAcceptedRecallBps: 8000,
  minRejectedRecallBps: 9000,
  minDecisionCoverageBps: 9500,
  maxExecutionFailureBps: 500,
})

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map((item) => canonicalize(item)).join(",")}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort(compareStrings).map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`).join(",")}}`
}

function sha256(value: unknown): string {
  return createHash("sha256").update(canonicalize(value), "utf8").digest("hex")
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`)
  return value as Record<string, unknown>
}

function exactKeys(record: Record<string, unknown>, allowed: readonly string[], label: string): void {
  const allowedSet = new Set(allowed)
  for (const key of Object.keys(record)) if (!allowedSet.has(key)) throw new TypeError(`${label} contains unknown field: ${key}`)
}

function boundedString(value: unknown, label: string, maxBytes = MAX_ID_BYTES): string {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(`${label} must be a non-empty string`)
  if (value.includes("\0")) throw new TypeError(`${label} must be NUL-free`)
  if (Buffer.byteLength(value, "utf8") > maxBytes) throw new RangeError(`${label} exceeds ${maxBytes} UTF-8 bytes`)
  return value
}

function identity(value: unknown, label: string): string {
  const text = boundedString(value, label, 64)
  if (!SHA256.test(text)) throw new TypeError(`${label} must be a lowercase SHA-256 identity`)
  return text
}

function safeInteger(value: unknown, label: string, max = MAX_COUNTER): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) > max) {
    throw new RangeError(`${label} must be a non-negative safe integer <= ${max}`)
  }
  return value as number
}

function bps(value: unknown, label: string): number {
  return safeInteger(value, label, 10_000)
}

function addSafe(total: number, value: number, label: string): number {
  const next = total + value
  if (!Number.isSafeInteger(next)) throw new RangeError(`${label} exceeds safe integer range`)
  return next
}

function rateBps(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null
  return Math.floor((numerator * 10_000) / denominator)
}

function requiredRateBps(numerator: number, denominator: number): number {
  const rate = rateBps(numerator, denominator)
  if (rate === null) throw new Error("internal zero denominator")
  return rate
}

function percentile(values: readonly number[], percentileBps: number): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const rank = Math.max(1, Math.ceil((percentileBps * sorted.length) / 10_000))
  return sorted[rank - 1] ?? null
}

function validateCandidate(value: unknown): ReviewerQualificationCandidate {
  const record = asRecord(value, "candidate")
  exactKeys(record, CANDIDATE_KEYS, "candidate")
  const candidate: ReviewerQualificationCandidate = {
    adapterId: boundedString(record.adapterId, "candidate.adapterId"),
    adapterVersion: boundedString(record.adapterVersion, "candidate.adapterVersion"),
    reviewerId: boundedString(record.reviewerId, "candidate.reviewerId"),
    reviewerVersion: boundedString(record.reviewerVersion, "candidate.reviewerVersion"),
    ...(record.modelId === undefined ? {} : { modelId: boundedString(record.modelId, "candidate.modelId") }),
    reviewPolicyIdentity: identity(record.reviewPolicyIdentity, "candidate.reviewPolicyIdentity"),
  }
  return Object.freeze(candidate)
}

function validateCase(value: unknown, label: string): GoldBenchmarkCase {
  const record = asRecord(value, label)
  exactKeys(record, CASE_KEYS, label)
  const caseIdentity = identity(record.caseIdentity, `${label}.caseIdentity`)
  if (!GOLD_DISPOSITIONS.has(record.goldDisposition as GoldDisposition)) throw new TypeError(`${label}.goldDisposition is unsupported`)
  return Object.freeze({ caseIdentity, goldDisposition: record.goldDisposition as GoldDisposition })
}

function validateBenchmark(value: unknown): { sourceCorpusIdentity: string; cases: readonly GoldBenchmarkCase[] } {
  const record = asRecord(value, "benchmark")
  exactKeys(record, ["sourceCorpusIdentity", "cases"], "benchmark")
  const sourceCorpusIdentity = identity(record.sourceCorpusIdentity, "benchmark.sourceCorpusIdentity")
  if (!Array.isArray(record.cases) || record.cases.length === 0 || record.cases.length > MAX_CASES) {
    throw new RangeError(`benchmark.cases must contain 1..${MAX_CASES} cases`)
  }
  const cases = record.cases.map((item, index) => validateCase(item, `benchmark.cases[${index}]`))
    .sort((left, right) => compareStrings(left.caseIdentity, right.caseIdentity))
  const seen = new Set<string>()
  for (const item of cases) {
    if (seen.has(item.caseIdentity)) throw new TypeError(`duplicate benchmark case identity: ${item.caseIdentity}`)
    seen.add(item.caseIdentity)
  }
  return { sourceCorpusIdentity, cases: Object.freeze(cases) }
}

function validateObservation(value: unknown, label: string): QualificationObservation {
  const record = asRecord(value, label)
  exactKeys(record, OBSERVATION_KEYS, label)
  const caseIdentity = identity(record.caseIdentity, `${label}.caseIdentity`)
  if (!OUTCOMES.has(record.outcome as QualificationObservationOutcome)) throw new TypeError(`${label}.outcome is unsupported`)
  const observation: QualificationObservation = {
    caseIdentity,
    outcome: record.outcome as QualificationObservationOutcome,
    ...(record.latencyMs === undefined ? {} : { latencyMs: safeInteger(record.latencyMs, `${label}.latencyMs`, MAX_LATENCY_MS) }),
    ...(record.inputTokens === undefined ? {} : { inputTokens: safeInteger(record.inputTokens, `${label}.inputTokens`) }),
    ...(record.outputTokens === undefined ? {} : { outputTokens: safeInteger(record.outputTokens, `${label}.outputTokens`) }),
    ...(record.reportedCostMicrounits === undefined ? {} : { reportedCostMicrounits: safeInteger(record.reportedCostMicrounits, `${label}.reportedCostMicrounits`) }),
  }
  return Object.freeze(observation)
}

function validateObservations(value: unknown, cases: readonly GoldBenchmarkCase[]): readonly QualificationObservation[] {
  if (!Array.isArray(value) || value.length !== cases.length) throw new RangeError("observations must contain exactly one entry per benchmark case")
  const caseIds = new Set(cases.map((item) => item.caseIdentity))
  const seen = new Set<string>()
  const observations = value.map((item, index) => validateObservation(item, `observations[${index}]`))
  for (const observation of observations) {
    if (!caseIds.has(observation.caseIdentity)) throw new TypeError(`observation references foreign case identity: ${observation.caseIdentity}`)
    if (seen.has(observation.caseIdentity)) throw new TypeError(`duplicate observation for case identity: ${observation.caseIdentity}`)
    seen.add(observation.caseIdentity)
  }
  for (const caseIdentity of caseIds) if (!seen.has(caseIdentity)) throw new TypeError(`missing observation for case identity: ${caseIdentity}`)
  return Object.freeze(observations.sort((left, right) => compareStrings(left.caseIdentity, right.caseIdentity)))
}

function validatePolicy(value: unknown): QualificationPolicy {
  const record = asRecord(value, "qualificationPolicy")
  exactKeys(record, POLICY_KEYS, "qualificationPolicy")
  const policy: QualificationPolicy = {
    version: boundedString(record.version, "qualificationPolicy.version", MAX_POLICY_VERSION_BYTES),
    minTotalCases: safeInteger(record.minTotalCases, "qualificationPolicy.minTotalCases", MAX_CASES),
    minAcceptedCases: safeInteger(record.minAcceptedCases, "qualificationPolicy.minAcceptedCases", MAX_CASES),
    minRejectedCases: safeInteger(record.minRejectedCases, "qualificationPolicy.minRejectedCases", MAX_CASES),
    minExactDispositionAccuracyBps: bps(record.minExactDispositionAccuracyBps, "qualificationPolicy.minExactDispositionAccuracyBps"),
    minAcceptedPrecisionBps: bps(record.minAcceptedPrecisionBps, "qualificationPolicy.minAcceptedPrecisionBps"),
    minAcceptedRecallBps: bps(record.minAcceptedRecallBps, "qualificationPolicy.minAcceptedRecallBps"),
    minRejectedRecallBps: bps(record.minRejectedRecallBps, "qualificationPolicy.minRejectedRecallBps"),
    minDecisionCoverageBps: bps(record.minDecisionCoverageBps, "qualificationPolicy.minDecisionCoverageBps"),
    maxExecutionFailureBps: bps(record.maxExecutionFailureBps, "qualificationPolicy.maxExecutionFailureBps"),
  }
  if (policy.minTotalCases < DEFAULT_REVIEWER_QUALIFICATION_POLICY.minTotalCases
    || policy.minAcceptedCases < DEFAULT_REVIEWER_QUALIFICATION_POLICY.minAcceptedCases
    || policy.minRejectedCases < DEFAULT_REVIEWER_QUALIFICATION_POLICY.minRejectedCases
    || policy.minExactDispositionAccuracyBps < DEFAULT_REVIEWER_QUALIFICATION_POLICY.minExactDispositionAccuracyBps
    || policy.minAcceptedPrecisionBps < DEFAULT_REVIEWER_QUALIFICATION_POLICY.minAcceptedPrecisionBps
    || policy.minAcceptedRecallBps < DEFAULT_REVIEWER_QUALIFICATION_POLICY.minAcceptedRecallBps
    || policy.minRejectedRecallBps < DEFAULT_REVIEWER_QUALIFICATION_POLICY.minRejectedRecallBps
    || policy.minDecisionCoverageBps < DEFAULT_REVIEWER_QUALIFICATION_POLICY.minDecisionCoverageBps
    || policy.maxExecutionFailureBps > DEFAULT_REVIEWER_QUALIFICATION_POLICY.maxExecutionFailureBps) {
    throw new RangeError("qualificationPolicy must not be weaker than the canonical KRI-R4 default policy")
  }
  return Object.freeze(policy)
}

function computeMetrics(cases: readonly GoldBenchmarkCase[], observations: readonly QualificationObservation[]): QualificationMetrics {
  const goldById = new Map(cases.map((item) => [item.caseIdentity, item.goldDisposition] as const))
  let goldAccepted = 0; let goldRejected = 0; let correctlyAccepted = 0; let correctlyRejected = 0
  let falseAccepted = 0; let falseRejected = 0; let abstained = 0; let providerFailed = 0; let timedOut = 0; let invalidOutput = 0
  const latencies: number[] = []
  let withInput = 0; let totalInput = 0; let withOutput = 0; let totalOutput = 0; let withCost = 0; let totalCost = 0

  for (const gold of cases) gold.goldDisposition === "VALID_ACCEPTED" ? goldAccepted++ : goldRejected++
  for (const observation of observations) {
    const gold = goldById.get(observation.caseIdentity)
    if (gold === undefined) throw new Error("internal foreign observation")
    switch (observation.outcome) {
      case "VALID_ACCEPTED": gold === "VALID_ACCEPTED" ? correctlyAccepted++ : falseAccepted++; break
      case "INVALID_REJECTED": gold === "INVALID_REJECTED" ? correctlyRejected++ : falseRejected++; break
      case "ABSTAIN": abstained++; break
      case "PROVIDER_FAILED": providerFailed++; break
      case "TIMED_OUT": timedOut++; break
      case "INVALID_OUTPUT": invalidOutput++; break
    }
    if (observation.latencyMs !== undefined) latencies.push(observation.latencyMs)
    if (observation.inputTokens !== undefined) { withInput++; totalInput = addSafe(totalInput, observation.inputTokens, "totalInputTokens") }
    if (observation.outputTokens !== undefined) { withOutput++; totalOutput = addSafe(totalOutput, observation.outputTokens, "totalOutputTokens") }
    if (observation.reportedCostMicrounits !== undefined) { withCost++; totalCost = addSafe(totalCost, observation.reportedCostMicrounits, "totalReportedCostMicrounits") }
  }
  const totalCases = cases.length
  const decided = correctlyAccepted + correctlyRejected + falseAccepted + falseRejected
  const executionFailures = providerFailed + timedOut + invalidOutput
  const metrics: QualificationMetrics = {
    counts: Object.freeze({ totalCases, goldAccepted, goldRejected, correctlyAccepted, correctlyRejected, falseAccepted, falseRejected, abstained, providerFailed, timedOut, invalidOutput }),
    exactDispositionAccuracyBps: requiredRateBps(correctlyAccepted + correctlyRejected, totalCases),
    acceptedPrecisionBps: rateBps(correctlyAccepted, correctlyAccepted + falseAccepted),
    acceptedRecallBps: rateBps(correctlyAccepted, goldAccepted),
    rejectedRecallBps: rateBps(correctlyRejected, goldRejected),
    decisionCoverageBps: requiredRateBps(decided, totalCases),
    executionFailureBps: requiredRateBps(executionFailures, totalCases),
    latency: Object.freeze({ observedCount: latencies.length, p50Ms: percentile(latencies, 5000), p95Ms: percentile(latencies, 9500) }),
    suppliedUsage: Object.freeze({ observationsWithInputTokens: withInput, totalInputTokens: totalInput, observationsWithOutputTokens: withOutput, totalOutputTokens: totalOutput, observationsWithReportedCost: withCost, totalReportedCostMicrounits: totalCost }),
  }
  return Object.freeze(metrics)
}

function decide(metrics: QualificationMetrics, policy: QualificationPolicy): { decision: QualificationDecision; reasons: readonly string[] } {
  const reasons: string[] = []
  if (metrics.counts.totalCases < policy.minTotalCases) reasons.push("TOTAL_GOLD_CASES_BELOW_MINIMUM")
  if (metrics.counts.goldAccepted < policy.minAcceptedCases) reasons.push("GOLD_ACCEPTED_CASES_BELOW_MINIMUM")
  if (metrics.counts.goldRejected < policy.minRejectedCases) reasons.push("GOLD_REJECTED_CASES_BELOW_MINIMUM")
  if (reasons.length > 0) return { decision: "INSUFFICIENT_EVIDENCE", reasons: Object.freeze(reasons) }

  if (metrics.exactDispositionAccuracyBps < policy.minExactDispositionAccuracyBps) reasons.push("EXACT_DISPOSITION_ACCURACY_BELOW_THRESHOLD")
  if (metrics.acceptedPrecisionBps === null) reasons.push("ACCEPTED_PRECISION_UNAVAILABLE")
  else if (metrics.acceptedPrecisionBps < policy.minAcceptedPrecisionBps) reasons.push("ACCEPTED_PRECISION_BELOW_THRESHOLD")
  if (metrics.acceptedRecallBps === null) reasons.push("ACCEPTED_RECALL_UNAVAILABLE")
  else if (metrics.acceptedRecallBps < policy.minAcceptedRecallBps) reasons.push("ACCEPTED_RECALL_BELOW_THRESHOLD")
  if (metrics.rejectedRecallBps === null) reasons.push("REJECTED_RECALL_UNAVAILABLE")
  else if (metrics.rejectedRecallBps < policy.minRejectedRecallBps) reasons.push("REJECTED_RECALL_BELOW_THRESHOLD")
  if (metrics.decisionCoverageBps < policy.minDecisionCoverageBps) reasons.push("DECISION_COVERAGE_BELOW_THRESHOLD")
  if (metrics.executionFailureBps > policy.maxExecutionFailureBps) reasons.push("EXECUTION_FAILURE_RATE_ABOVE_THRESHOLD")
  if (reasons.length > 0) return { decision: "NOT_QUALIFIED", reasons: Object.freeze(reasons) }
  return { decision: "QUALIFIED", reasons: Object.freeze(["ALL_POLICY_THRESHOLDS_MET"]) }
}

function buildReport(input: ReviewerQualificationInput): ReviewerQualificationReport {
  const inputRecord = asRecord(input, "qualificationInput")
  exactKeys(inputRecord, ["candidate", "benchmark", "observations", "policy"], "qualificationInput")
  const candidate = validateCandidate(inputRecord.candidate)
  const benchmark = validateBenchmark(inputRecord.benchmark)
  const observations = validateObservations(inputRecord.observations, benchmark.cases)
  const policy = validatePolicy(inputRecord.policy ?? DEFAULT_REVIEWER_QUALIFICATION_POLICY)
  const candidateIdentity = sha256(candidate)
  const benchmarkSetIdentity = sha256({ sourceCorpusIdentity: benchmark.sourceCorpusIdentity, cases: benchmark.cases })
  const qualificationPolicyIdentity = sha256(policy)
  const metrics = computeMetrics(benchmark.cases, observations)
  const { decision, reasons } = decide(metrics, policy)
  const preimage = {
    version: KRI_R4_QUALIFICATION_VERSION,
    capabilityScope: KRI_R4_CAPABILITY_SCOPE,
    candidate,
    candidateIdentity,
    sourceCorpusIdentity: benchmark.sourceCorpusIdentity,
    benchmarkSetIdentity,
    benchmarkCases: benchmark.cases,
    qualificationPolicy: policy,
    qualificationPolicyIdentity,
    observations,
    metrics,
    decision,
    reasons,
  }
  return Object.freeze({ ...preimage, reportIdentity: sha256(preimage) })
}

function assertEqualCanonical(actual: unknown, expected: unknown, label: string): void {
  if (canonicalize(actual) !== canonicalize(expected)) throw new TypeError(`${label} does not match recomputed canonical value`)
}

function validateMetricsShape(value: unknown): void {
  const metrics = asRecord(value, "report.metrics"); exactKeys(metrics, METRICS_KEYS, "report.metrics")
  const counts = asRecord(metrics.counts, "report.metrics.counts"); exactKeys(counts, COUNT_KEYS, "report.metrics.counts")
  for (const key of COUNT_KEYS) safeInteger(counts[key], `report.metrics.counts.${key}`, MAX_CASES)
  for (const key of ["exactDispositionAccuracyBps", "decisionCoverageBps", "executionFailureBps"] as const) bps(metrics[key], `report.metrics.${key}`)
  for (const key of ["acceptedPrecisionBps", "acceptedRecallBps", "rejectedRecallBps"] as const) if (metrics[key] !== null) bps(metrics[key], `report.metrics.${key}`)
  const latency = asRecord(metrics.latency, "report.metrics.latency"); exactKeys(latency, LATENCY_KEYS, "report.metrics.latency")
  safeInteger(latency.observedCount, "report.metrics.latency.observedCount", MAX_CASES)
  for (const key of ["p50Ms", "p95Ms"] as const) if (latency[key] !== null) safeInteger(latency[key], `report.metrics.latency.${key}`, MAX_LATENCY_MS)
  const usage = asRecord(metrics.suppliedUsage, "report.metrics.suppliedUsage"); exactKeys(usage, USAGE_KEYS, "report.metrics.suppliedUsage")
  for (const key of USAGE_KEYS) safeInteger(usage[key], `report.metrics.suppliedUsage.${key}`)
}

export function qualifyReviewer(input: ReviewerQualificationInput): ReviewerQualificationReport {
  return buildReport(input)
}

export function validateQualificationReport(value: unknown): ReviewerQualificationReport {
  const report = asRecord(value, "report")
  exactKeys(report, ROOT_KEYS, "report")
  if (report.version !== KRI_R4_QUALIFICATION_VERSION) throw new TypeError("unsupported KRI-R4 report version")
  if (report.capabilityScope !== KRI_R4_CAPABILITY_SCOPE) throw new TypeError("unsupported KRI-R4 capability scope")
  identity(report.candidateIdentity, "report.candidateIdentity")
  identity(report.sourceCorpusIdentity, "report.sourceCorpusIdentity")
  identity(report.benchmarkSetIdentity, "report.benchmarkSetIdentity")
  identity(report.qualificationPolicyIdentity, "report.qualificationPolicyIdentity")
  identity(report.reportIdentity, "report.reportIdentity")
  if (!DECISIONS.has(report.decision as QualificationDecision)) throw new TypeError("report.decision is unsupported")
  if (!Array.isArray(report.reasons) || report.reasons.length === 0 || report.reasons.length > 16) throw new TypeError("report.reasons must be a bounded non-empty array")
  for (const [index, reason] of report.reasons.entries()) boundedString(reason, `report.reasons[${index}]`, MAX_REASON_BYTES)
  validateMetricsShape(report.metrics)

  const expected = buildReport({
    candidate: report.candidate as unknown as ReviewerQualificationCandidate,
    benchmark: { sourceCorpusIdentity: report.sourceCorpusIdentity as string, cases: report.benchmarkCases as unknown as readonly GoldBenchmarkCase[] },
    observations: report.observations as unknown as readonly QualificationObservation[],
    policy: report.qualificationPolicy as unknown as QualificationPolicy,
  })
  assertEqualCanonical(report, expected, "report")
  return expected
}

export function qualificationPolicyIdentity(policy: QualificationPolicy = DEFAULT_REVIEWER_QUALIFICATION_POLICY): string {
  return sha256(validatePolicy(policy))
}

export function reviewerQualificationCandidateIdentity(candidate: ReviewerQualificationCandidate): string {
  return sha256(validateCandidate(candidate))
}

export function goldBenchmarkSetIdentity(benchmark: GoldBenchmarkSet): string {
  const validated = validateBenchmark(benchmark)
  return sha256({ sourceCorpusIdentity: validated.sourceCorpusIdentity, cases: validated.cases })
}

export class ReviewerQualificationEngine {
  qualify(input: ReviewerQualificationInput): ReviewerQualificationReport { return qualifyReviewer(input) }
  validateReport(value: unknown): ReviewerQualificationReport { return validateQualificationReport(value) }
}
