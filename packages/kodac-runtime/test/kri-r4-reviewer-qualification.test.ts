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

function clone<T>(value: T): T {
  return structuredClone(value)
}

function gitBlobSha1(raw: Buffer): string {
  const canonical = Buffer.from(raw.toString("utf8").replace(/\r\n/g, "\n"), "utf8")
  const header = Buffer.from(`blob ${canonical.byteLength}\0`, "utf8")
  return createHash("sha1").update(header).update(canonical).digest("hex")
}

function currentGoldBenchmark(): GoldBenchmarkSet {
  const corpus = JSON.parse(
    readFileSync(new URL("./fixtures/kri-r1/corpus.json", import.meta.url), "utf8"),
  ) as {
    corpusIdentity: string
    cases: Array<{ caseIdentity: string; goldDisposition: "VALID_ACCEPTED" | "INVALID_REJECTED" }>
  }
  return {
    sourceCorpusIdentity: corpus.corpusIdentity,
    cases: corpus.cases.map(({ caseIdentity, goldDisposition }) => ({ caseIdentity, goldDisposition })),
  }
}

function asSchema(value: unknown, label: string): Record<string, unknown> {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), `${label} must be a schema object`)
  return value as Record<string, unknown>
}

function schemaEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function validateWithPublishedSchema(schemaValue: unknown, value: unknown, path = "$root"): void {
  const schema = asSchema(schemaValue, path)

  if ("const" in schema) assert.ok(schemaEqual(value, schema.const), `${path} violates const`)
  if (Array.isArray(schema.enum)) assert.ok(schema.enum.some((item) => schemaEqual(item, value)), `${path} violates enum`)

  if (Array.isArray(schema.anyOf)) {
    const accepted = schema.anyOf.some((branch) => {
      try {
        validateWithPublishedSchema(branch, value, path)
        return true
      } catch {
        return false
      }
    })
    assert.ok(accepted, `${path} violates anyOf`)
    return
  }

  const type = schema.type
  if (type === "null") {
    assert.equal(value, null, `${path} must be null`)
    return
  }
  if (type === "string") {
    assert.equal(typeof value, "string", `${path} must be string`)
    const text = value as string
    if (typeof schema.minLength === "number") assert.ok(text.length >= schema.minLength, `${path} shorter than minLength`)
    if (typeof schema.maxLength === "number") assert.ok(text.length <= schema.maxLength, `${path} longer than maxLength`)
    if (typeof schema.pattern === "string") assert.match(text, new RegExp(schema.pattern), `${path} violates pattern`)
    return
  }
  if (type === "integer") {
    assert.equal(Number.isInteger(value), true, `${path} must be integer`)
    const number = value as number
    if (typeof schema.minimum === "number") assert.ok(number >= schema.minimum, `${path} below minimum`)
    if (typeof schema.maximum === "number") assert.ok(number <= schema.maximum, `${path} above maximum`)
    return
  }
  if (type === "array") {
    assert.ok(Array.isArray(value), `${path} must be array`)
    const array = value as unknown[]
    if (typeof schema.minItems === "number") assert.ok(array.length >= schema.minItems, `${path} below minItems`)
    if (typeof schema.maxItems === "number") assert.ok(array.length <= schema.maxItems, `${path} above maxItems`)
    if (schema.items !== undefined) array.forEach((item, index) => validateWithPublishedSchema(schema.items, item, `${path}[${index}]`))
    return
  }
  if (type === "object") {
    assert.ok(value && typeof value === "object" && !Array.isArray(value), `${path} must be object`)
    const record = value as Record<string, unknown>
    const properties = schema.properties === undefined ? {} : asSchema(schema.properties, `${path}.properties`)
    if (Array.isArray(schema.required)) {
      for (const required of schema.required) {
        assert.equal(typeof required, "string", `${path}.required entries must be strings`)
        assert.ok(Object.hasOwn(record, required), `${path} missing required field ${required}`)
      }
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(record)) assert.ok(Object.hasOwn(properties, key), `${path} contains unknown field ${key}`)
    }
    for (const [key, childSchema] of Object.entries(properties)) {
      if (Object.hasOwn(record, key)) validateWithPublishedSchema(childSchema, record[key], `${path}.${key}`)
    }
  }
}

function publishedQualificationSchema(): Record<string, unknown> {
  return JSON.parse(
    readFileSync(new URL("../../../schema/kri-reviewer-qualification.schema.json", import.meta.url), "utf8"),
  ) as Record<string, unknown>
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

test("duplicate, missing, and foreign observations fail closed", () => {
  const set = benchmark()
  const duplicate = perfectObservations(set)
  duplicate[1] = { ...duplicate[1], caseIdentity: duplicate[0].caseIdentity }
  assert.throws(() => qualifyReviewer({ candidate, benchmark: set, observations: duplicate }), /duplicate observation|missing observation/)
  assert.throws(() => qualifyReviewer({ candidate, benchmark: set, observations: perfectObservations(set).slice(1) }), /exactly one entry/)
  const foreign = perfectObservations(set)
  foreign[0] = { ...foreign[0], caseIdentity: identity("foreign") }
  assert.throws(() => qualifyReviewer({ candidate, benchmark: set, observations: foreign }), /foreign case identity/)
})

test("observation and benchmark ordering do not affect structural identity", () => {
  const set = benchmark()
  const first = qualifyReviewer({ candidate, benchmark: set, observations: perfectObservations(set) })
  const reversed: GoldBenchmarkSet = { sourceCorpusIdentity: set.sourceCorpusIdentity, cases: [...set.cases].reverse() }
  const second = qualifyReviewer({ candidate, benchmark: reversed, observations: perfectObservations(set).reverse() })
  assert.equal(first.reportIdentity, second.reportIdentity)
  assert.equal(first.benchmarkSetIdentity, second.benchmarkSetIdentity)
})

test("candidate and source-corpus identities are structurally bound", () => {
  const set = benchmark()
  const first = qualifyReviewer({ candidate, benchmark: set, observations: perfectObservations(set) })
  const changedCandidate = { ...candidate, reviewerVersion: "1.0.1" }
  const second = qualifyReviewer({ candidate: changedCandidate, benchmark: set, observations: perfectObservations(set) })
  assert.notEqual(first.candidateIdentity, second.candidateIdentity)
  assert.notEqual(first.reportIdentity, second.reportIdentity)
  assert.notEqual(
    goldBenchmarkSetIdentity(set),
    goldBenchmarkSetIdentity({ ...set, sourceCorpusIdentity: identity("different-corpus") }),
  )
})

test("policy identity is deterministic and stronger threshold mutation changes it", () => {
  const first = qualificationPolicyIdentity()
  const stronger: QualificationPolicy = {
    ...DEFAULT_REVIEWER_QUALIFICATION_POLICY,
    version: "strict-v1",
    minAcceptedRecallBps: 9000,
  }
  assert.equal(first, qualificationPolicyIdentity(DEFAULT_REVIEWER_QUALIFICATION_POLICY))
  assert.notEqual(first, qualificationPolicyIdentity(stronger))
})

test("exact-disposition and false-class counts remain distinct", () => {
  const set = benchmark()
  const observations = perfectObservations(set)
  observations[0] = { caseIdentity: set.cases[0].caseIdentity, outcome: "INVALID_REJECTED" }
  observations[1] = { caseIdentity: set.cases[1].caseIdentity, outcome: "VALID_ACCEPTED" }
  const report = qualifyReviewer({ candidate, benchmark: set, observations })
  assert.equal(report.metrics.counts.falseRejected, 1)
  assert.equal(report.metrics.counts.falseAccepted, 1)
  assert.equal(report.metrics.counts.correctlyAccepted, 9)
  assert.equal(report.metrics.counts.correctlyRejected, 9)
  assert.equal(report.metrics.exactDispositionAccuracyBps, 9000)
})

test("abstention lowers decision coverage instead of becoming correct", () => {
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
  const cases = Array.from({ length: 20 }, (_, index) => ({
    caseIdentity: identity(`rejected-${index}`),
    goldDisposition: "INVALID_REJECTED" as const,
  }))
  const set = { sourceCorpusIdentity: identity("all-rejected"), cases }
  const observations = cases.map((item) => ({ caseIdentity: item.caseIdentity, outcome: "INVALID_REJECTED" as const }))
  const report = qualifyReviewer({ candidate, benchmark: set, observations })
  assert.equal(report.metrics.acceptedPrecisionBps, null)
  assert.equal(report.metrics.acceptedRecallBps, null)
})

test("sufficient balanced perfect evidence qualifies", () => {
  const set = benchmark()
  const report = qualifyReviewer({ candidate, benchmark: set, observations: perfectObservations(set) })
  assert.equal(report.decision, "QUALIFIED")
  assert.deepEqual(report.reasons, ["ALL_POLICY_THRESHOLDS_MET"])
})

test("sufficient evidence below a threshold is not qualified with a machine reason", () => {
  const set = benchmark()
  const observations = perfectObservations(set)
  for (const index of [0, 2, 4]) observations[index] = { caseIdentity: set.cases[index].caseIdentity, outcome: "INVALID_REJECTED" }
  const report = qualifyReviewer({ candidate, benchmark: set, observations })
  assert.equal(report.decision, "NOT_QUALIFIED")
  assert.ok(report.reasons.includes("ACCEPTED_RECALL_BELOW_THRESHOLD"))
})

test("basis-point threshold boundary behavior is exact", () => {
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

test("latency percentile and supplied usage accounting are deterministic", () => {
  const set = benchmark()
  const report = qualifyReviewer({ candidate, benchmark: set, observations: perfectObservations(set) })
  assert.deepEqual(report.metrics.latency, { observedCount: 20, p50Ms: 10, p95Ms: 19 })
  assert.deepEqual(report.metrics.suppliedUsage, {
    observationsWithInputTokens: 20,
    totalInputTokens: 200,
    observationsWithOutputTokens: 20,
    totalOutputTokens: 100,
    observationsWithReportedCost: 20,
    totalReportedCostMicrounits: 40,
  })
})

test("report validator detects semantic mutation even when structure is plausible", () => {
  const set = benchmark()
  const mutated = clone(qualifyReviewer({ candidate, benchmark: set, observations: perfectObservations(set) })) as unknown as Record<string, unknown>
  ;(mutated.metrics as Record<string, unknown>).exactDispositionAccuracyBps = 9999
  assert.throws(() => validateQualificationReport(mutated), /does not match recomputed canonical value/)
})

test("unsupported scope, unknown authority fields, and weaker policies fail closed", () => {
  const set = benchmark()
  const report = clone(qualifyReviewer({ candidate, benchmark: set, observations: perfectObservations(set) })) as unknown as Record<string, unknown>
  report.capabilityScope = "whole-review-generation-v1"
  assert.throws(() => validateQualificationReport(report), /unsupported KRI-R4 capability scope/)
  assert.throws(
    () => qualifyReviewer({ candidate, benchmark: set, observations: perfectObservations(set), PROVEN_READY: true } as never),
    /unknown field: PROVEN_READY/,
  )
  const injected = clone(qualifyReviewer({ candidate, benchmark: set, observations: perfectObservations(set) })) as unknown as Record<string, unknown>
  injected.mergeApproved = true
  assert.throws(() => validateQualificationReport(injected), /unknown field: mergeApproved/)
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

test("candidate identity helper and engine class remain deterministic", () => {
  assert.equal(reviewerQualificationCandidateIdentity(candidate), reviewerQualificationCandidateIdentity({ ...candidate }))
  const set = benchmark()
  const engine = new ReviewerQualificationEngine()
  const report = engine.qualify({ candidate, benchmark: set, observations: perfectObservations(set) })
  assert.equal(engine.validateReport(report).reportIdentity, report.reportIdentity)
})

test("produced reports validate against the published KRI-R4 JSON Schema", () => {
  const set = benchmark()
  const report = qualifyReviewer({ candidate, benchmark: set, observations: perfectObservations(set) })
  const schema = publishedQualificationSchema()
  assert.doesNotThrow(() => validateWithPublishedSchema(schema, report))

  const injected = { ...clone(report), mergeApproved: true }
  assert.throws(() => validateWithPublishedSchema(schema, injected), /unknown field mergeApproved/)
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
