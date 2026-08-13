import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import test from "node:test"

import {
  DEFAULT_REVIEWER_QUALIFICATION_POLICY,
  ReviewerQualificationEngine,
  goldBenchmarkSetIdentity,
  qualificationPolicyIdentity,
  qualifyReviewer,
  reviewerQualificationCandidateIdentity,
  validateQualificationReport,
} from "../src/reviewer-intelligence/qualification.ts"
import type {
  GoldBenchmarkCase,
  GoldBenchmarkSet,
  QualificationObservation,
  QualificationPolicy,
  ReviewerQualificationCandidate,
} from "../src/reviewer-intelligence/qualification-contracts.ts"

const sha256 = (value: string) => createHash("sha256").update(value, "utf8").digest("hex")
const identity = (label: string) => sha256(label)
const candidate: ReviewerQualificationCandidate = Object.freeze({
  adapterId: "fixture-adapter",
  adapterVersion: "1.0.0",
  reviewerId: "fixture-reviewer",
  reviewerVersion: "1.0.0",
  modelId: "fixture-model",
  reviewPolicyIdentity: identity("review-policy"),
})

function benchmark(size = 20): GoldBenchmarkSet {
  const cases: GoldBenchmarkCase[] = Array.from({ length: size }, (_, index) => ({
    caseIdentity: identity(`case-${index}`),
    goldDisposition: index % 2 === 0 ? "VALID_ACCEPTED" : "INVALID_REJECTED",
  }))
  return { sourceCorpusIdentity: identity(`corpus-${size}`), cases }
}

function perfectObservations(set: GoldBenchmarkSet): QualificationObservation[] {
  return set.cases.map((item, index) => ({
    caseIdentity: item.caseIdentity,
    outcome: item.goldDisposition,
    latencyMs: index + 1,
    inputTokens: 10,
    outputTokens: 5,
    reportedCostMicrounits: 2,
  }))
}

function clone<T>(value: T): T { return structuredClone(value) }

function gitBlobSha1(raw: Buffer): string {
  const canonical = Buffer.from(raw.toString("utf8").replace(/\r\n/g, "\n"), "utf8")
  const header = Buffer.from(`blob ${canonical.byteLength}\0`, "utf8")
  return createHash("sha1").update(header).update(canonical).digest("hex")
}

function currentGoldBenchmark(): GoldBenchmarkSet {
  const fixtureUrl = new URL("./fixtures/kri-r1/corpus.json", import.meta.url)
  const corpus = JSON.parse(readFileSync(fixtureUrl, "utf8")) as {
    corpusIdentity: string
    cases: Array<{ caseIdentity: string; goldDisposition: "VALID_ACCEPTED" | "INVALID_REJECTED" }>
  }
  return {
    sourceCorpusIdentity: corpus.corpusIdentity,
    cases: corpus.cases.map(({ caseIdentity, goldDisposition }) => ({ caseIdentity, goldDisposition })),
  }
}

test("KRI-R4 default policy matches the canonical conservative floor", () => {
  assert.deepEqual(DEFAULT_REVIEWER_QUALIFICATION_POLICY, {
    version: "kri-r4-default-policy-v1",
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
})

test("perfect canonical four-case KRI-R1 v1 evidence remains insufficient", () => {
  const set = currentGoldBenchmark()
  const report = qualifyReviewer({ candidate, benchmark: set, observations: perfectObservations(set) })
  assert.equal(report.metrics.counts.totalCases, 4)
  assert.equal(report.metrics.exactDispositionAccuracyBps, 10_000)
  assert.equal(report.decision, "INSUFFICIENT_EVIDENCE")
  assert.ok(report.reasons.includes("TOTAL_GOLD_CASES_BELOW_MINIMUM"))
})

test("every admitted gold case is required exactly once", () => {
  const set = benchmark()
  assert.doesNotThrow(() => qualifyReviewer({ candidate, benchmark: set, observations: perfectObservations(set) }))
})

test("duplicate observations fail closed", () => {
  const set = benchmark()
  const observations = perfectObservations(set)
  observations[1] = { ...observations[1], caseIdentity: observations[0].caseIdentity }
  assert.throws(() => qualifyReviewer({ candidate, benchmark: set, observations }), /duplicate observation|missing observation/)
})

test("missing observations fail closed", () => {
  const set = benchmark()
  assert.throws(() => qualifyReviewer({ candidate, benchmark: set, observations: perfectObservations(set).slice(1) }), /exactly one entry/)
})

test("foreign case identities fail closed", () => {
  const set = benchmark()
  const observations = perfectObservations(set)
  observations[0] = { ...observations[0], caseIdentity: identity("foreign") }
  assert.throws(() => qualifyReviewer({ candidate, benchmark: set, observations }), /foreign case identity/)
})

test("observation and benchmark case ordering do not affect report identity", () => {
  const set = benchmark()
  const first = qualifyReviewer({ candidate, benchmark: set, observations: perfectObservations(set) })
  const reversed: GoldBenchmarkSet = { sourceCorpusIdentity: set.sourceCorpusIdentity, cases: [...set.cases].reverse() }
  const second = qualifyReviewer({ candidate, benchmark: reversed, observations: perfectObservations(set).reverse() })
  assert.equal(first.reportIdentity, second.reportIdentity)
  assert.equal(first.benchmarkSetIdentity, second.benchmarkSetIdentity)
})

test("candidate identity is structural and candidate mutation changes the report", () => {
  const set = benchmark()
  const first = qualifyReviewer({ candidate, benchmark: set, observations: perfectObservations(set) })
  const changed = { ...candidate, reviewerVersion: "1.0.1" }
  const second = qualifyReviewer({ candidate: changed, benchmark: set, observations: perfectObservations(set) })
  assert.notEqual(first.candidateIdentity, second.candidateIdentity)
  assert.notEqual(first.reportIdentity, second.reportIdentity)
})

test("source corpus identity is bound separately from benchmark case projection", () => {
  const set = benchmark()
  const changed = { ...set, sourceCorpusIdentity: identity("different-corpus") }
  assert.notEqual(goldBenchmarkSetIdentity(set), goldBenchmarkSetIdentity(changed))
})

test("policy identity is deterministic and threshold mutation changes it", () => {
  const first = qualificationPolicyIdentity()
  const stronger: QualificationPolicy = { ...DEFAULT_REVIEWER_QUALIFICATION_POLICY, version: "strict-v1", minAcceptedRecallBps: 9000 }
  assert.equal(first, qualificationPolicyIdentity(DEFAULT_REVIEWER_QUALIFICATION_POLICY))
  assert.notEqual(first, qualificationPolicyIdentity(stronger))
})

test("false accepted and false rejected counts remain distinct", () => {
  const set = benchmark()
  const observations = perfectObservations(set)
  observations[0] = { caseIdentity: set.cases[0].caseIdentity, outcome: "INVALID_REJECTED" }
  observations[1] = { caseIdentity: set.cases[1].caseIdentity, outcome: "VALID_ACCEPTED" }
  const report = qualifyReviewer({ candidate, benchmark: set, observations })
  assert.equal(report.metrics.counts.falseRejected, 1)
  assert.equal(report.metrics.counts.falseAccepted, 1)
  assert.equal(report.metrics.counts.correctlyAccepted, 9)
  assert.equal(report.metrics.counts.correctlyRejected, 9)
})

test("abstention lowers decision coverage and is not counted correct", () => {
  const set = benchmark()
  const observations = perfectObservations(set)
  observations[0] = { caseIdentity: set.cases[0].caseIdentity, outcome: "ABSTAIN" }
  const report = qualifyReviewer({ candidate, benchmark: set, observations })
  assert.equal(report.metrics.counts.abstained, 1)
  assert.equal(report.metrics.decisionCoverageBps, 9500)
  assert.equal(report.metrics.exactDispositionAccuracyBps, 9500)
})

test("provider failure timeout and invalid output are measured separately", () => {
  const set = benchmark()
  const observations = perfectObservations(set)
  observations[0] = { caseIdentity: set.cases[0].caseIdentity, outcome: "PROVIDER_FAILED" }
  observations[1] = { caseIdentity: set.cases[1].caseIdentity, outcome: "TIMED_OUT" }
  observations[2] = { caseIdentity: set.cases[2].caseIdentity, outcome: "INVALID_OUTPUT" }
  const report = qualifyReviewer({ candidate, benchmark: set, observations })
  assert.equal(report.metrics.counts.providerFailed, 1)
  assert.equal(report.metrics.counts.timedOut, 1)
  assert.equal(report.metrics.counts.invalidOutput, 1)
  assert.equal(report.metrics.executionFailureBps, 1500)
})

test("zero-denominator class metrics are explicitly unavailable", () => {
  const cases = Array.from({ length: 20 }, (_, index) => ({ caseIdentity: identity(`rejected-${index}`), goldDisposition: "INVALID_REJECTED" as const }))
  const set = { sourceCorpusIdentity: identity("all-rejected"), cases }
  const observations = cases.map((item) => ({ caseIdentity: item.caseIdentity, outcome: "INVALID_REJECTED" as const }))
  const report = qualifyReviewer({ candidate, benchmark: set, observations })
  assert.equal(report.metrics.acceptedPrecisionBps, null)
  assert.equal(report.metrics.acceptedRecallBps, null)
})

test("a sufficiently large balanced perfect corpus qualifies", () => {
  const set = benchmark()
  const report = qualifyReviewer({ candidate, benchmark: set, observations: perfectObservations(set) })
  assert.equal(report.decision, "QUALIFIED")
  assert.deepEqual(report.reasons, ["ALL_POLICY_THRESHOLDS_MET"])
})

test("sufficient evidence below a threshold is not qualified with machine reason", () => {
  const set = benchmark()
  const observations = perfectObservations(set)
  observations[0] = { caseIdentity: set.cases[0].caseIdentity, outcome: "INVALID_REJECTED" }
  observations[2] = { caseIdentity: set.cases[2].caseIdentity, outcome: "INVALID_REJECTED" }
  observations[4] = { caseIdentity: set.cases[4].caseIdentity, outcome: "INVALID_REJECTED" }
  const report = qualifyReviewer({ candidate, benchmark: set, observations })
  assert.equal(report.decision, "NOT_QUALIFIED")
  assert.ok(report.reasons.includes("ACCEPTED_RECALL_BELOW_THRESHOLD"))
})

test("basis-point threshold boundary is exact", () => {
  const set = benchmark()
  const strict: QualificationPolicy = {
    ...DEFAULT_REVIEWER_QUALIFICATION_POLICY,
    version: "perfect-only-v1",
    minExactDispositionAccuracyBps: 10_000,
    minAcceptedPrecisionBps: 10_000,
    minAcceptedRecallBps: 10_000,
    minRejectedRecallBps: 10_000,
    minDecisionCoverageBps: 10_000,
    maxExecutionFailureBps: 0,
  }
  assert.equal(qualifyReviewer({ candidate, benchmark: set, observations: perfectObservations(set), policy: strict }).decision, "QUALIFIED")
  const oneWrong = perfectObservations(set)
  oneWrong[0] = { caseIdentity: set.cases[0].caseIdentity, outcome: "INVALID_REJECTED" }
  assert.equal(qualifyReviewer({ candidate, benchmark: set, observations: oneWrong, policy: strict }).decision, "NOT_QUALIFIED")
})

test("latency percentiles use deterministic nearest-rank semantics", () => {
  const set = benchmark()
  const report = qualifyReviewer({ candidate, benchmark: set, observations: perfectObservations(set) })
  assert.deepEqual(report.metrics.latency, { observedCount: 20, p50Ms: 10, p95Ms: 19 })
})

test("supplied token and cost counters are accumulated but remain labeled supplied", () => {
  const set = benchmark()
  const report = qualifyReviewer({ candidate, benchmark: set, observations: perfectObservations(set) })
  assert.deepEqual(report.metrics.suppliedUsage, {
    observationsWithInputTokens: 20,
    totalInputTokens: 200,
    observationsWithOutputTokens: 20,
    totalOutputTokens: 100,
    observationsWithReportedCost: 20,
    totalReportedCostMicrounits: 40,
  })
})

test("report identity detects semantic mutation", () => {
  const set = benchmark()
  const report = qualifyReviewer({ candidate, benchmark: set, observations: perfectObservations(set) })
  const mutated = clone(report) as unknown as Record<string, unknown>
  const metrics = mutated.metrics as Record<string, unknown>
  metrics.exactDispositionAccuracyBps = 9999
  assert.throws(() => validateQualificationReport(mutated), /does not match recomputed canonical value/)
})

test("unsupported capability scope fails closed", () => {
  const set = benchmark()
  const report = clone(qualifyReviewer({ candidate, benchmark: set, observations: perfectObservations(set) })) as unknown as Record<string, unknown>
  report.capabilityScope = "whole-review-generation-v1"
  assert.throws(() => validateQualificationReport(report), /unsupported KRI-R4 capability scope/)
})

test("unknown authority fields fail closed", () => {
  const set = benchmark()
  const input = { candidate, benchmark: set, observations: perfectObservations(set), PROVEN_READY: true }
  assert.throws(() => qualifyReviewer(input as never), /unknown field: PROVEN_READY/)
  const report = clone(qualifyReviewer({ candidate, benchmark: set, observations: perfectObservations(set) })) as unknown as Record<string, unknown>
  report.mergeApproved = true
  assert.throws(() => validateQualificationReport(report), /unknown field: mergeApproved/)
})

test("a weaker-than-authorized policy fails closed", () => {
  const set = benchmark()
  const weak = { ...DEFAULT_REVIEWER_QUALIFICATION_POLICY, version: "weak", minTotalCases: 4 }
  assert.throws(() => qualifyReviewer({ candidate, benchmark: set, observations: perfectObservations(set), policy: weak }), /must not be weaker/)
})

test("NaN infinite negative and non-integer measurements fail closed", () => {
  const set = benchmark()
  for (const bad of [NaN, Infinity, -1, 1.5]) {
    const observations = perfectObservations(set)
    observations[0] = { ...observations[0], latencyMs: bad }
    assert.throws(() => qualifyReviewer({ candidate, benchmark: set, observations }), /non-negative safe integer/)
  }
})

test("candidate identity helper is deterministic", () => {
  assert.equal(reviewerQualificationCandidateIdentity(candidate), reviewerQualificationCandidateIdentity({ ...candidate }))
})

test("ReviewerQualificationEngine delegates to the same deterministic contract", () => {
  const set = benchmark()
  const engine = new ReviewerQualificationEngine()
  const report = engine.qualify({ candidate, benchmark: set, observations: perfectObservations(set) })
  assert.equal(engine.validateReport(report).reportIdentity, report.reportIdentity)
})

test("KRI-R4 production source has a pure import surface", () => {
  const source = readFileSync(new URL("../src/reviewer-intelligence/qualification.ts", import.meta.url), "utf8")
  const imports = [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]).sort()
  assert.deepEqual(imports, ["./qualification-contracts.ts", "node:crypto"])
  assert.doesNotMatch(source, /\b(fetch|XMLHttpRequest|WebSocket|child_process|ExecutionGateway|writeFile|appendFile|createWriteStream)\b/)
})

test("canonical KRI-R1 corpus bytes and published identity remain unchanged", () => {
  const fixtureUrl = new URL("./fixtures/kri-r1/corpus.json", import.meta.url)
  const raw = readFileSync(fixtureUrl)
  const corpus = JSON.parse(raw.toString("utf8")) as { corpusIdentity: string }
  assert.equal(gitBlobSha1(raw), "a308729f00f6c96894d66555127c3dd3ab592d32")
  assert.equal(corpus.corpusIdentity, "e3f87d5e008918043da4f10617aa479d0d5e4b9fcde42143bc691763f503c4d4")
})

test("canonical KRI-R2 and KRI-R3 source bytes remain unchanged", () => {
  const expected = new Map([
    ["../src/reviewer-intelligence/contracts.ts", "5ebe91c3d98f626651230989564d367d0600863c"],
    ["../src/reviewer-intelligence/runtime.ts", "4c5d01293d37b14ad4b017ec1e7dd17055393113"],
    ["../src/reviewer-intelligence/provider-contracts.ts", "97e95f3cd19aebf63c86dba254bc8e55f919c031"],
    ["../src/reviewer-intelligence/executor.ts", "1ff5d7273512af2f6ccb5c1d70ccb54369bac5e4"],
  ])
  for (const [path, blob] of expected) assert.equal(gitBlobSha1(readFileSync(new URL(path, import.meta.url))), blob, path)
})
