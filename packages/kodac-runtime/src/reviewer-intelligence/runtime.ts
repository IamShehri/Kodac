import { createHash } from "node:crypto"

import {
  KRI_R2_ADJUDICATION_VERSION,
  KRI_R2_FINDING_VERSION,
  type AdjudicationAction,
  type AdjudicationDecision,
  type AdjudicationRecord,
  type AdjudicationResult,
  type AffectedRange,
  type FindingFreshness,
  type FindingRecord,
  type FindingSeverity,
  type FindingState,
  type ReviewClaim,
  type ReviewIdentity,
} from "./contracts.ts"

const SHA1_RE = /^[0-9a-f]{40}$/
const SHA256_RE = /^[0-9a-f]{64}$/
const SEVERITIES = new Set<FindingSeverity>(["blocker", "critical", "high", "medium", "low", "info"])
const ACTIONS = new Set<AdjudicationAction>(["CONFIRM", "REJECT", "MARK_DUPLICATE", "MARK_FIXED", "REVERIFY"])

const MAX_SHORT = 128
const MAX_TEXT = 4096
const MAX_PATH = 1024
const MAX_REFS = 32
const MAX_REF = 1024

type UnknownRecord = Record<string, unknown>

function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

function plainObject(value: unknown, label: string): UnknownRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error(`${label} must be an object`)
  const proto = Object.getPrototypeOf(value)
  if (proto !== Object.prototype && proto !== null) throw new Error(`${label} must be a plain object`)
  return value as UnknownRecord
}

function exactKeys(value: UnknownRecord, required: readonly string[], optional: readonly string[], label: string): void {
  const allowed = new Set([...required, ...optional])
  for (const key of Object.keys(value)) if (!allowed.has(key)) throw new Error(`${label} has unknown property: ${key}`)
  for (const key of required) if (!(key in value)) throw new Error(`${label} missing required property: ${key}`)
}

function boundedString(value: unknown, label: string, max = MAX_TEXT): string {
  if (typeof value !== "string" || value.length === 0 || value.length > max) throw new Error(`${label} must be a non-empty string <= ${max} chars`)
  return value
}

function sha1(value: unknown, label: string): string {
  const text = boundedString(value, label, 40)
  if (!SHA1_RE.test(text)) throw new Error(`${label} must be a lowercase 40-hex git commit identity`)
  return text
}

function sha256(value: unknown, label: string): string {
  const text = boundedString(value, label, 64)
  if (!SHA256_RE.test(text)) throw new Error(`${label} must be a lowercase 64-hex sha256 identity`)
  return text
}

function repositoryPath(value: unknown): string {
  const path = boundedString(value, "path", MAX_PATH)
  if (path.startsWith("/") || path.includes("\\") || path.includes("\0")) throw new Error("path must be repository-relative POSIX text")
  const segments = path.split("/")
  if (segments.some((segment) => segment.length === 0 || segment === "." || segment === "..")) throw new Error("path must not contain empty, dot, or parent segments")
  return path
}

function rangeValue(value: unknown): AffectedRange {
  const record = plainObject(value, "range")
  exactKeys(record, ["startLine", "endLine"], [], "range")
  const startLine = record.startLine
  const endLine = record.endLine
  if (!Number.isSafeInteger(startLine) || !Number.isSafeInteger(endLine)) throw new Error("range lines must be safe integers")
  if ((startLine as number) < 1 || (endLine as number) < (startLine as number) || (endLine as number) > 10_000_000) {
    throw new Error("range must satisfy 1 <= startLine <= endLine <= 10000000")
  }
  return { startLine: startLine as number, endLine: endLine as number }
}

function evidenceRefs(value: unknown, label = "evidenceRefs"): string[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_REFS) throw new Error(`${label} must contain 1..${MAX_REFS} references`)
  const refs = value.map((item, index) => boundedString(item, `${label}[${index}]`, MAX_REF))
  if (new Set(refs).size !== refs.length) throw new Error(`${label} must not contain duplicate references`)
  return [...refs].sort(compareStrings)
}

function reviewIdentity(value: unknown): ReviewIdentity {
  const record = plainObject(value, "review")
  exactKeys(
    record,
    ["reviewRunId", "reviewerId", "reviewerVersion", "policyIdentity", "canonicalBase", "reviewedHead", "currentHead"],
    [],
    "review",
  )
  return {
    reviewRunId: boundedString(record.reviewRunId, "review.reviewRunId", MAX_SHORT),
    reviewerId: boundedString(record.reviewerId, "review.reviewerId", MAX_SHORT),
    reviewerVersion: boundedString(record.reviewerVersion, "review.reviewerVersion", MAX_SHORT),
    policyIdentity: boundedString(record.policyIdentity, "review.policyIdentity", MAX_SHORT),
    canonicalBase: sha1(record.canonicalBase, "review.canonicalBase"),
    reviewedHead: sha1(record.reviewedHead, "review.reviewedHead"),
    currentHead: sha1(record.currentHead, "review.currentHead"),
  }
}

function claimValue(value: unknown): ReviewClaim {
  const record = plainObject(value, "claim")
  exactKeys(
    record,
    ["claimKey", "review", "path", "summary", "contractClaim", "category", "severity", "confidenceBps", "evidenceRefs"],
    ["range"],
    "claim",
  )
  const severity = boundedString(record.severity, "severity", 16)
  if (!SEVERITIES.has(severity as FindingSeverity)) throw new Error(`unsupported severity: ${severity}`)
  if (!Number.isSafeInteger(record.confidenceBps) || (record.confidenceBps as number) < 0 || (record.confidenceBps as number) > 10_000) {
    throw new Error("confidenceBps must be an integer between 0 and 10000")
  }
  return {
    claimKey: boundedString(record.claimKey, "claimKey", MAX_SHORT),
    review: reviewIdentity(record.review),
    path: repositoryPath(record.path),
    ...(record.range === undefined ? {} : { range: rangeValue(record.range) }),
    summary: boundedString(record.summary, "summary"),
    contractClaim: boundedString(record.contractClaim, "contractClaim"),
    category: boundedString(record.category, "category", MAX_SHORT),
    severity: severity as FindingSeverity,
    confidenceBps: record.confidenceBps as number,
    evidenceRefs: evidenceRefs(record.evidenceRefs),
  }
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (typeof value === "object" && value !== null) {
    const record = value as UnknownRecord
    const ordered: UnknownRecord = {}
    for (const key of Object.keys(record).sort(compareStrings)) ordered[key] = canonicalize(record[key])
    return ordered
  }
  return value
}

function identity(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonicalize(value)), "utf8").digest("hex")
}

function findingPreimage(record: Omit<FindingRecord, "findingIdentity" | "stateIdentity" | "freshness" | "state">): unknown {
  return {
    ...record,
    review: {
      reviewRunId: record.review.reviewRunId,
      reviewerId: record.review.reviewerId,
      reviewerVersion: record.review.reviewerVersion,
      policyIdentity: record.review.policyIdentity,
      canonicalBase: record.review.canonicalBase,
      reviewedHead: record.review.reviewedHead,
    },
  }
}

function findingStateIdentity(
  findingIdentity: string,
  currentHead: string,
  freshness: FindingFreshness,
  state: FindingState,
): string {
  return identity({ findingIdentity, currentHead, freshness, state })
}

function adjudicationPreimage(record: Omit<AdjudicationRecord, "adjudicationIdentity">): unknown {
  return record
}

function findingValue(value: unknown): FindingRecord {
  const record = plainObject(value, "finding")
  exactKeys(
    record,
    ["version", "findingIdentity", "stateIdentity", "claimKey", "review", "path", "summary", "contractClaim", "category", "severity", "confidenceBps", "evidenceRefs", "freshness", "state"],
    ["range"],
    "finding",
  )
  if (record.version !== KRI_R2_FINDING_VERSION) throw new Error("unsupported finding version")
  const claim = claimValue({
    claimKey: record.claimKey,
    review: record.review,
    path: record.path,
    ...(record.range === undefined ? {} : { range: record.range }),
    summary: record.summary,
    contractClaim: record.contractClaim,
    category: record.category,
    severity: record.severity,
    confidenceBps: record.confidenceBps,
    evidenceRefs: record.evidenceRefs,
  })
  const freshness: FindingFreshness = claim.review.currentHead === claim.review.reviewedHead ? "CURRENT" : "STALE"
  if (record.freshness !== freshness) throw new Error("finding freshness does not match exact-head identity")
  const states = new Set<FindingState>(["NEW", "CONFIRMED", "REJECTED", "DUPLICATE", "STALE", "FIXED", "REVERIFIED"])
  if (!states.has(record.state as FindingState)) throw new Error("unsupported finding state")
  if (freshness === "STALE" && !["STALE", "REJECTED", "DUPLICATE"].includes(record.state as string)) {
    throw new Error("stale finding must use STALE, REJECTED, or DUPLICATE state")
  }
  if (freshness === "CURRENT" && record.state === "STALE") throw new Error("current finding cannot use STALE state")
  const withoutIdentity = {
    version: KRI_R2_FINDING_VERSION,
    claimKey: claim.claimKey,
    review: claim.review,
    path: claim.path,
    ...(claim.range === undefined ? {} : { range: claim.range }),
    summary: claim.summary,
    contractClaim: claim.contractClaim,
    category: claim.category,
    severity: claim.severity,
    confidenceBps: claim.confidenceBps,
    evidenceRefs: claim.evidenceRefs,
  } as const
  const expected = identity(findingPreimage(withoutIdentity))
  if (sha256(record.findingIdentity, "findingIdentity") !== expected) throw new Error("finding identity mismatch")
  const state = record.state as FindingState
  const expectedStateIdentity = findingStateIdentity(expected, claim.review.currentHead, freshness, state)
  if (sha256(record.stateIdentity, "stateIdentity") !== expectedStateIdentity) throw new Error("finding state identity mismatch")
  return {
    ...withoutIdentity,
    findingIdentity: expected,
    stateIdentity: expectedStateIdentity,
    freshness,
    state,
  }
}

function decisionValue(value: unknown): AdjudicationDecision {
  const record = plainObject(value, "decision")
  exactKeys(record, ["action", "adjudicatorId", "evidenceRefs"], ["duplicateOf", "correctionRef", "reverificationRef"], "decision")
  const action = boundedString(record.action, "decision.action", 32)
  if (!ACTIONS.has(action as AdjudicationAction)) throw new Error(`unsupported adjudication action: ${action}`)
  const decision: AdjudicationDecision = {
    action: action as AdjudicationAction,
    adjudicatorId: boundedString(record.adjudicatorId, "decision.adjudicatorId", MAX_SHORT),
    evidenceRefs: evidenceRefs(record.evidenceRefs, "decision.evidenceRefs"),
  }
  if (record.duplicateOf !== undefined) decision.duplicateOf = sha256(record.duplicateOf, "decision.duplicateOf")
  if (record.correctionRef !== undefined) decision.correctionRef = boundedString(record.correctionRef, "decision.correctionRef", MAX_REF)
  if (record.reverificationRef !== undefined) decision.reverificationRef = boundedString(record.reverificationRef, "decision.reverificationRef", MAX_REF)

  const only = (allowed: readonly string[]): void => {
    for (const key of ["duplicateOf", "correctionRef", "reverificationRef"] as const) {
      if (!allowed.includes(key) && decision[key] !== undefined) throw new Error(`${action} does not allow ${key}`)
    }
  }

  switch (decision.action) {
    case "CONFIRM":
    case "REJECT":
      only([])
      break
    case "MARK_DUPLICATE":
      only(["duplicateOf"])
      if (!decision.duplicateOf) throw new Error("MARK_DUPLICATE requires duplicateOf")
      break
    case "MARK_FIXED":
      only(["correctionRef"])
      if (!decision.correctionRef) throw new Error("MARK_FIXED requires correctionRef")
      break
    case "REVERIFY":
      only(["reverificationRef"])
      if (!decision.reverificationRef) throw new Error("REVERIFY requires reverificationRef")
      break
  }
  return decision
}

function nextState(previous: FindingState, action: AdjudicationAction): FindingState {
  if (previous === "STALE") throw new Error("stale finding must be reviewed again on the current head")
  if (previous === "NEW") {
    if (action === "CONFIRM") return "CONFIRMED"
    if (action === "REJECT") return "REJECTED"
    if (action === "MARK_DUPLICATE") return "DUPLICATE"
  }
  if (previous === "CONFIRMED" && action === "MARK_FIXED") return "FIXED"
  if (previous === "FIXED" && action === "REVERIFY") return "REVERIFIED"
  throw new Error(`invalid finding transition: ${previous} -> ${action}`)
}

function adjudicationValue(value: unknown): AdjudicationRecord {
  const record = plainObject(value, "adjudication")
  exactKeys(
    record,
    ["version", "adjudicationIdentity", "findingIdentity", "previousStateIdentity", "resultingStateIdentity", "action", "previousState", "resultingState", "adjudicatorId", "evidenceRefs"],
    ["duplicateOf", "correctionRef", "reverificationRef"],
    "adjudication",
  )
  if (record.version !== KRI_R2_ADJUDICATION_VERSION) throw new Error("unsupported adjudication version")
  const action = boundedString(record.action, "adjudication.action", 32) as AdjudicationAction
  if (!ACTIONS.has(action)) throw new Error("unsupported adjudication action")
  const previousState = boundedString(record.previousState, "adjudication.previousState", 16) as FindingState
  const resultingState = nextState(previousState, action)
  if (record.resultingState !== resultingState) throw new Error("adjudication resulting state mismatch")
  const normalized: Omit<AdjudicationRecord, "adjudicationIdentity"> = {
    version: KRI_R2_ADJUDICATION_VERSION,
    findingIdentity: sha256(record.findingIdentity, "adjudication.findingIdentity"),
    previousStateIdentity: sha256(record.previousStateIdentity, "adjudication.previousStateIdentity"),
    resultingStateIdentity: sha256(record.resultingStateIdentity, "adjudication.resultingStateIdentity"),
    action,
    previousState,
    resultingState,
    adjudicatorId: boundedString(record.adjudicatorId, "adjudication.adjudicatorId", MAX_SHORT),
    evidenceRefs: evidenceRefs(record.evidenceRefs, "adjudication.evidenceRefs"),
    ...(record.duplicateOf === undefined ? {} : { duplicateOf: sha256(record.duplicateOf, "adjudication.duplicateOf") }),
    ...(record.correctionRef === undefined ? {} : { correctionRef: boundedString(record.correctionRef, "adjudication.correctionRef", MAX_REF) }),
    ...(record.reverificationRef === undefined ? {} : { reverificationRef: boundedString(record.reverificationRef, "adjudication.reverificationRef", MAX_REF) }),
  }
  decisionValue({
    action: normalized.action,
    adjudicatorId: normalized.adjudicatorId,
    evidenceRefs: normalized.evidenceRefs,
    ...(normalized.duplicateOf === undefined ? {} : { duplicateOf: normalized.duplicateOf }),
    ...(normalized.correctionRef === undefined ? {} : { correctionRef: normalized.correctionRef }),
    ...(normalized.reverificationRef === undefined ? {} : { reverificationRef: normalized.reverificationRef }),
  })
  const expected = identity(adjudicationPreimage(normalized))
  if (sha256(record.adjudicationIdentity, "adjudicationIdentity") !== expected) throw new Error("adjudication identity mismatch")
  return { ...normalized, adjudicationIdentity: expected }
}

function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value as UnknownRecord)) deepFreeze(child)
  }
  return value
}

export class ReviewerIntelligenceRuntime {
  createFinding(input: unknown): FindingRecord {
    const claim = claimValue(input)
    const base = {
      version: KRI_R2_FINDING_VERSION,
      claimKey: claim.claimKey,
      review: claim.review,
      path: claim.path,
      ...(claim.range === undefined ? {} : { range: claim.range }),
      summary: claim.summary,
      contractClaim: claim.contractClaim,
      category: claim.category,
      severity: claim.severity,
      confidenceBps: claim.confidenceBps,
      evidenceRefs: claim.evidenceRefs,
    } as const
    const freshness: FindingFreshness = claim.review.currentHead === claim.review.reviewedHead ? "CURRENT" : "STALE"
    const state: FindingState = freshness === "CURRENT" ? "NEW" : "STALE"
    const findingIdentity = identity(findingPreimage(base))
    return deepFreeze({
      ...base,
      findingIdentity,
      stateIdentity: findingStateIdentity(findingIdentity, claim.review.currentHead, freshness, state),
      freshness,
      state,
    })
  }

  validateFinding(input: unknown): FindingRecord {
    return deepFreeze(findingValue(input))
  }

  markStaleIfHeadMoved(input: unknown, currentHeadInput: unknown): FindingRecord {
    const finding = findingValue(input)
    const currentHead = sha1(currentHeadInput, "currentHead")
    if (currentHead === finding.review.reviewedHead) return deepFreeze(finding)
    const staleState: FindingState =
      finding.state === "REJECTED" || finding.state === "DUPLICATE" ? finding.state : "STALE"
    const updated: FindingRecord = {
      ...finding,
      review: { ...finding.review, currentHead },
      stateIdentity: findingStateIdentity(finding.findingIdentity, currentHead, "STALE", staleState),
      freshness: "STALE",
      state: staleState,
    }
    return deepFreeze(updated)
  }

  applyAdjudication(findingInput: unknown, decisionInput: unknown): AdjudicationResult {
    const finding = findingValue(findingInput)
    const decision = decisionValue(decisionInput)
    const resultingState = nextState(finding.state, decision.action)
    if (decision.duplicateOf === finding.findingIdentity) throw new Error("finding cannot be a duplicate of itself")
    const resultingStateIdentity = findingStateIdentity(
      finding.findingIdentity,
      finding.review.currentHead,
      finding.freshness,
      resultingState,
    )
    const recordWithoutIdentity: Omit<AdjudicationRecord, "adjudicationIdentity"> = {
      version: KRI_R2_ADJUDICATION_VERSION,
      findingIdentity: finding.findingIdentity,
      previousStateIdentity: finding.stateIdentity,
      resultingStateIdentity,
      action: decision.action,
      previousState: finding.state,
      resultingState,
      adjudicatorId: decision.adjudicatorId,
      evidenceRefs: decision.evidenceRefs,
      ...(decision.duplicateOf === undefined ? {} : { duplicateOf: decision.duplicateOf }),
      ...(decision.correctionRef === undefined ? {} : { correctionRef: decision.correctionRef }),
      ...(decision.reverificationRef === undefined ? {} : { reverificationRef: decision.reverificationRef }),
    }
    const adjudication: AdjudicationRecord = {
      ...recordWithoutIdentity,
      adjudicationIdentity: identity(adjudicationPreimage(recordWithoutIdentity)),
    }
    const updatedFinding: FindingRecord = { ...finding, stateIdentity: resultingStateIdentity, state: resultingState }
    return deepFreeze({ finding: updatedFinding, adjudication })
  }

  validateAdjudication(input: unknown): AdjudicationRecord {
    return deepFreeze(adjudicationValue(input))
  }
}
