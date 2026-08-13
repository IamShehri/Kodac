import { createHash } from "node:crypto"

import {
  K3_R5_CONTEXT_BUNDLE_VERSION,
  K3_R5_SELECTION_STRATEGY_ID,
  type ContextBundle,
  type ContextBundleItem,
} from "../context-engine/contracts.ts"
import type { FindingRecord, ReviewClaim } from "./contracts.ts"
import {
  KRI_R3_PROVIDER_REQUEST_VERSION,
  KRI_R3_REVIEW_RUN_VERSION,
  type ReviewRunRecord,
  type ReviewerExecutionResult,
  type ReviewerExecutionRuntimeOptions,
  type ReviewerProvider,
  type ReviewerProviderClaim,
  type ReviewerProviderOutput,
  type ReviewerProviderRequest,
  type ReviewerRunFailureCode,
  type ReviewerRunStatus,
} from "./provider-contracts.ts"

const SHA1 = /^[0-9a-f]{40}$/
const SHA256 = /^[0-9a-f]{64}$/
const SEVERITIES = new Set(["blocker", "critical", "high", "medium", "low", "info"])
const SOURCE_KINDS = new Set(["repository-evidence", "ast-grep-structural-match"])
const EVIDENCE_CLASSES = new Set(["precise-static", "parser-derived", "git-derived", "heuristic-inference"])
const RELEVANCE_REASONS = new Set(["exact-target-path", "related-target-path", "exact-symbol-hint", "objective-overlap", "working-tree-change", "architecture-candidate", "stable-fallback"])
const COMPLETENESS_REASONS = new Set(["item-budget", "byte-budget", "source-input-limit", "unsupported-evidence"])
const RUN_STATUSES = new Set<ReviewerRunStatus>(["COMPLETED", "STALE", "PROVIDER_FAILED", "TIMED_OUT", "INVALID_PROVIDER_OUTPUT"])

const HARD_MAX_CLAIMS = 64
const HARD_MAX_CONTEXT_ITEMS = 256
const HARD_MAX_CONTEXT_BYTES = 256 * 1024
const HARD_MAX_TIMEOUT_MS = 60_000
const MAX_TEXT_BYTES = 4096
const MAX_CONTEXT_ITEM_BYTES = 64 * 1024
const MAX_PATH_BYTES = 1024
const MAX_REFS = 32
const MAX_REF_BYTES = 1024
const MAX_LINE = 10_000_000
const MAX_POLICY_BYTES = 128

type Obj = Record<string, unknown>
type NormalizedRequest = {
  taskId: string
  policyIdentity: string
  canonicalBase: string
  reviewedHead: string
  instructions: string
  contextBundle: ContextBundle
}
type NormalizedClaim = ReviewerProviderClaim & { evidenceItemIds: string[] }

function cmp(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0 }
function bytes(value: string): number { return Buffer.byteLength(value, "utf8") }
function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`
  const record = value as Obj
  return `{${Object.keys(record).sort(cmp).map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`
}
function digest(value: unknown): string { return createHash("sha256").update(typeof value === "string" ? value : canonical(value), "utf8").digest("hex") }
function object(value: unknown, label: string): Obj {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error(`${label} must be an object`)
  const proto = Object.getPrototypeOf(value)
  if (proto !== Object.prototype && proto !== null) throw new Error(`${label} must be a plain object`)
  return value as Obj
}
function keys(record: Obj, required: readonly string[], optional: readonly string[], label: string): void {
  const allowed = new Set([...required, ...optional])
  for (const key of Object.keys(record)) if (!allowed.has(key)) throw new Error(`${label} has unknown property: ${key}`)
  for (const key of required) if (!(key in record)) throw new Error(`${label} missing required property: ${key}`)
}
function text(value: unknown, label: string, maxBytes: number): string {
  if (typeof value !== "string" || value.length === 0 || value.includes("\0") || bytes(value) > maxBytes) throw new Error(`${label} must be bounded NUL-free text`)
  return value
}
function sha1(value: unknown, label: string): string { const v = text(value, label, 40); if (!SHA1.test(v)) throw new Error(`${label} must be lowercase 40-hex`); return v }
function sha256(value: unknown, label: string): string { const v = text(value, label, 64); if (!SHA256.test(v)) throw new Error(`${label} must be lowercase 64-hex`); return v }
function integer(value: unknown, label: string, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < min || value > max) throw new Error(`${label} must be an integer in range`)
  return value
}
function path(value: unknown, label: string): string {
  const v = text(value, label, MAX_PATH_BYTES)
  if (v.startsWith("/") || v.includes("\\") || /^[A-Za-z]:\//.test(v) || v.split("/").some((s) => !s || s === "." || s === "..")) throw new Error(`${label} must be a repository-relative POSIX path`)
  return v
}
function sortedStrings(value: unknown, label: string, maxItems: number, maxBytes: number, allowEmpty = false): string[] {
  if (!Array.isArray(value) || value.length > maxItems || (!allowEmpty && value.length === 0)) throw new Error(`${label} has invalid item count`)
  const values = value.map((item, i) => text(item, `${label}[${i}]`, maxBytes))
  if (new Set(values).size !== values.length) throw new Error(`${label} contains duplicates`)
  return [...values].sort(cmp)
}
function requireSorted(actual: unknown, normalized: string[], label: string): void {
  if (!Array.isArray(actual) || actual.length !== normalized.length || actual.some((value, i) => value !== normalized[i])) throw new Error(`${label} must be canonically sorted`)
}
function freeze<T>(value: T): T {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value as Obj)) freeze(child)
  }
  return value
}

function itemOrder(a: ContextBundleItem, b: ContextBundleItem): number {
  return b.relevance.score - a.relevance.score || cmp(a.subjectPath, b.subjectPath) || cmp(a.sourceKind, b.sourceKind) || cmp(a.sourceIdentity, b.sourceIdentity) || cmp(a.itemId, b.itemId)
}

function contextItem(input: unknown, index: number): ContextBundleItem {
  const label = `contextBundle.items[${index}]`
  const r = object(input, label)
  keys(r, ["itemId", "sourceKind", "sourceIdentity", "sourceAdapter", "subjectPath", "evidenceClass", "text", "contextUtf8Bytes", "provenanceRefs", "trust", "relevance"], [], label)
  const sourceKind = text(r.sourceKind, `${label}.sourceKind`, 64)
  const evidenceClass = text(r.evidenceClass, `${label}.evidenceClass`, 64)
  if (!SOURCE_KINDS.has(sourceKind) || !EVIDENCE_CLASSES.has(evidenceClass)) throw new Error(`${label} has unsupported source metadata`)
  const body = text(r.text, `${label}.text`, MAX_CONTEXT_ITEM_BYTES)
  const declaredBytes = integer(r.contextUtf8Bytes, `${label}.contextUtf8Bytes`, 1, MAX_CONTEXT_ITEM_BYTES)
  if (declaredBytes !== bytes(body)) throw new Error(`${label}.contextUtf8Bytes mismatch`)
  const refs = sortedStrings(r.provenanceRefs, `${label}.provenanceRefs`, 256, MAX_REF_BYTES, true)
  requireSorted(r.provenanceRefs, refs, `${label}.provenanceRefs`)
  if (r.trust !== "untrusted-repository-data") throw new Error(`${label}.trust mismatch`)
  const rel = object(r.relevance, `${label}.relevance`)
  keys(rel, ["score", "reasons"], [], `${label}.relevance`)
  const reasons = sortedStrings(rel.reasons, `${label}.relevance.reasons`, 16, 64)
  if (reasons.some((reason) => !RELEVANCE_REASONS.has(reason))) throw new Error(`${label} has unsupported relevance reason`)
  requireSorted(rel.reasons, reasons, `${label}.relevance.reasons`)
  return {
    itemId: sha256(r.itemId, `${label}.itemId`),
    sourceKind: sourceKind as ContextBundleItem["sourceKind"],
    sourceIdentity: sha256(r.sourceIdentity, `${label}.sourceIdentity`),
    sourceAdapter: text(r.sourceAdapter, `${label}.sourceAdapter`, 256),
    subjectPath: path(r.subjectPath, `${label}.subjectPath`),
    evidenceClass: evidenceClass as ContextBundleItem["evidenceClass"],
    text: body,
    contextUtf8Bytes: declaredBytes,
    provenanceRefs: refs,
    trust: "untrusted-repository-data",
    relevance: { score: integer(rel.score, `${label}.relevance.score`, 0, 1_000_000_000), reasons: reasons as ContextBundleItem["relevance"]["reasons"] },
  }
}

function contextBundle(input: unknown, maxItems: number, maxBytes: number): ContextBundle {
  const r = object(input, "contextBundle")
  keys(r, ["version", "bundleIdentity", "requestIdentity", "repositoryIdentity", "snapshotIdentity", "contentIdentity", "freshness", "taskId", "selectionStrategy", "budget", "completeness", "items", "provenanceRefs"], [], "contextBundle")
  if (r.version !== K3_R5_CONTEXT_BUNDLE_VERSION || r.freshness !== "current" || r.selectionStrategy !== K3_R5_SELECTION_STRATEGY_ID) throw new Error("contextBundle contract mismatch")
  const budgetRaw = object(r.budget, "contextBundle.budget")
  keys(budgetRaw, ["maxItems", "maxUtf8Bytes", "usedItems", "usedUtf8Bytes"], [], "contextBundle.budget")
  const budget = {
    maxItems: integer(budgetRaw.maxItems, "budget.maxItems", 1, HARD_MAX_CONTEXT_ITEMS),
    maxUtf8Bytes: integer(budgetRaw.maxUtf8Bytes, "budget.maxUtf8Bytes", 1, HARD_MAX_CONTEXT_BYTES),
    usedItems: integer(budgetRaw.usedItems, "budget.usedItems", 0, HARD_MAX_CONTEXT_ITEMS),
    usedUtf8Bytes: integer(budgetRaw.usedUtf8Bytes, "budget.usedUtf8Bytes", 0, HARD_MAX_CONTEXT_BYTES),
  }
  if (budget.usedItems > budget.maxItems || budget.usedUtf8Bytes > budget.maxUtf8Bytes || budget.maxItems > maxItems || budget.maxUtf8Bytes > maxBytes || budget.usedItems > maxItems || budget.usedUtf8Bytes > maxBytes) throw new Error("contextBundle exceeds execution bounds")
  const compRaw = object(r.completeness, "contextBundle.completeness")
  keys(compRaw, ["state", "reasons", "omittedAtLeast"], [], "contextBundle.completeness")
  const reasons = sortedStrings(compRaw.reasons, "contextBundle.completeness.reasons", 8, 64, true)
  requireSorted(compRaw.reasons, reasons, "contextBundle.completeness.reasons")
  const omittedAtLeast = integer(compRaw.omittedAtLeast, "completeness.omittedAtLeast", 0, Number.MAX_SAFE_INTEGER)
  if ((compRaw.state !== "complete" && compRaw.state !== "truncated") || reasons.some((reason) => !COMPLETENESS_REASONS.has(reason)) || ((compRaw.state === "complete") !== (reasons.length === 0)) || (compRaw.state === "complete" && omittedAtLeast !== 0) || (compRaw.state === "truncated" && omittedAtLeast === 0)) throw new Error("contextBundle completeness mismatch")
  const completeness = { state: compRaw.state as ContextBundle["completeness"]["state"], reasons: reasons as ContextBundle["completeness"]["reasons"], omittedAtLeast }
  if (!Array.isArray(r.items) || r.items.length > maxItems) throw new Error("contextBundle item count exceeds execution bounds")
  const items = r.items.map(contextItem)
  if (new Set(items.map((item) => item.itemId)).size !== items.length || items.length !== budget.usedItems || items.reduce((n, item) => n + item.contextUtf8Bytes, 0) !== budget.usedUtf8Bytes) throw new Error("contextBundle item accounting mismatch")
  const ordered = [...items].sort(itemOrder)
  if (items.some((item, i) => item.itemId !== ordered[i]?.itemId)) throw new Error("contextBundle item order mismatch")
  const provenanceRefs = sortedStrings(r.provenanceRefs, "contextBundle.provenanceRefs", 256, MAX_REF_BYTES, true)
  requireSorted(r.provenanceRefs, provenanceRefs, "contextBundle.provenanceRefs")
  const expectedRefs = [...new Set(items.flatMap((item) => item.provenanceRefs))].sort(cmp)
  if (canonical(provenanceRefs) !== canonical(expectedRefs)) throw new Error("contextBundle provenance aggregation mismatch")
  const bundle = {
    version: K3_R5_CONTEXT_BUNDLE_VERSION,
    bundleIdentity: sha256(r.bundleIdentity, "contextBundle.bundleIdentity"),
    requestIdentity: sha256(r.requestIdentity, "contextBundle.requestIdentity"),
    repositoryIdentity: sha256(r.repositoryIdentity, "contextBundle.repositoryIdentity"),
    snapshotIdentity: sha256(r.snapshotIdentity, "contextBundle.snapshotIdentity"),
    contentIdentity: sha256(r.contentIdentity, "contextBundle.contentIdentity"),
    freshness: "current" as const,
    taskId: text(r.taskId, "contextBundle.taskId", 128),
    selectionStrategy: K3_R5_SELECTION_STRATEGY_ID,
    budget,
    completeness,
    items,
    provenanceRefs,
  }
  const identityInput = { ...bundle, bundleIdentity: undefined, provenanceRefs: undefined }
  delete (identityInput as Obj).bundleIdentity
  delete (identityInput as Obj).provenanceRefs
  if (bundle.bundleIdentity !== digest(identityInput)) throw new Error("contextBundle identity mismatch")
  return bundle
}

function request(input: unknown, maxItems: number, maxBytes: number): NormalizedRequest {
  const r = object(input, "review request")
  keys(r, ["taskId", "policyIdentity", "canonicalBase", "reviewedHead", "instructions", "contextBundle"], [], "review request")
  const bundle = contextBundle(r.contextBundle, maxItems, maxBytes)
  const taskId = text(r.taskId, "taskId", 128)
  if (taskId !== bundle.taskId) throw new Error("taskId must match contextBundle.taskId")
  return { taskId, policyIdentity: text(r.policyIdentity, "policyIdentity", MAX_POLICY_BYTES), canonicalBase: sha1(r.canonicalBase, "canonicalBase"), reviewedHead: sha1(r.reviewedHead, "reviewedHead"), instructions: text(r.instructions, "instructions", 8 * 1024), contextBundle: bundle }
}

function providerClaim(input: unknown, index: number, items: Map<string, ContextBundleItem>): NormalizedClaim {
  const label = `provider claims[${index}]`
  const r = object(input, label)
  keys(r, ["claimKey", "path", "summary", "contractClaim", "category", "severity", "confidenceBps", "evidenceItemIds"], ["range"], label)
  const affectedPath = path(r.path, `${label}.path`)
  let range: ReviewerProviderClaim["range"]
  if (r.range !== undefined) {
    const rr = object(r.range, `${label}.range`); keys(rr, ["startLine", "endLine"], [], `${label}.range`)
    const startLine = integer(rr.startLine, `${label}.range.startLine`, 1, MAX_LINE); const endLine = integer(rr.endLine, `${label}.range.endLine`, 1, MAX_LINE)
    if (endLine < startLine) throw new Error(`${label}.range ordering mismatch`); range = { startLine, endLine }
  }
  const severity = text(r.severity, `${label}.severity`, 16); if (!SEVERITIES.has(severity)) throw new Error(`${label}.severity unsupported`)
  const evidenceItemIds = sortedStrings(r.evidenceItemIds, `${label}.evidenceItemIds`, MAX_REFS, 64)
  for (const id of evidenceItemIds) { sha256(id, `${label}.evidenceItemIds`); if (!items.has(id)) throw new Error(`${label} references unknown context item`) }
  if (!evidenceItemIds.some((id) => items.get(id)?.subjectPath === affectedPath)) throw new Error(`${label} lacks path-supporting context evidence`)
  return { claimKey: text(r.claimKey, `${label}.claimKey`, 128), path: affectedPath, ...(range ? { range } : {}), summary: text(r.summary, `${label}.summary`, MAX_TEXT_BYTES), contractClaim: text(r.contractClaim, `${label}.contractClaim`, MAX_TEXT_BYTES), category: text(r.category, `${label}.category`, 128), severity: severity as ReviewerProviderClaim["severity"], confidenceBps: integer(r.confidenceBps, `${label}.confidenceBps`, 0, 10_000), evidenceItemIds }
}

function providerOutput(input: unknown, maxClaims: number, bundle: ContextBundle): ReviewerProviderOutput {
  const r = object(input, "provider output"); keys(r, ["claims"], [], "provider output")
  if (!Array.isArray(r.claims) || r.claims.length > maxClaims) throw new Error("provider claim count exceeds bound")
  const items = new Map(bundle.items.map((item) => [item.itemId, item]))
  const claims = r.claims.map((claim, i) => providerClaim(claim, i, items))
  if (new Set(claims.map((claim) => claim.claimKey)).size !== claims.length) throw new Error("provider claim keys must be unique")
  claims.sort((a, b) => cmp(a.claimKey, b.claimKey) || cmp(a.path, b.path) || cmp(a.summary, b.summary))
  return { claims }
}

function providerRequest(req: NormalizedRequest, maxClaims: number): ReviewerProviderRequest {
  return freeze({ version: KRI_R3_PROVIDER_REQUEST_VERSION, taskId: req.taskId, policyIdentity: req.policyIdentity, canonicalBase: req.canonicalBase, reviewedHead: req.reviewedHead, instructions: req.instructions, contextBundleIdentity: req.contextBundle.bundleIdentity, contextItems: req.contextBundle.items.map((item) => ({ itemId: item.itemId, subjectPath: item.subjectPath, evidenceClass: item.evidenceClass, text: item.text, trust: item.trust })), maxClaims })
}
function instructionId(value: string): string { return digest({ instructions: value }) }
function runId(req: NormalizedRequest, providerId: string, providerVersion: string, status: ReviewerRunStatus, failureCode: ReviewerRunFailureCode, claims: readonly NormalizedClaim[]): string {
  return digest({ version: KRI_R3_REVIEW_RUN_VERSION, providerId, providerVersion, policyIdentity: req.policyIdentity, canonicalBase: req.canonicalBase, reviewedHead: req.reviewedHead, contextBundleIdentity: req.contextBundle.bundleIdentity, taskId: req.taskId, instructionsIdentity: instructionId(req.instructions), status, failureCode, claims })
}
function runRecord(req: NormalizedRequest, providerId: string, providerVersion: string, evaluatedHead: string, status: ReviewerRunStatus, failureCode: ReviewerRunFailureCode, claims: readonly NormalizedClaim[], findings: readonly FindingRecord[]): ReviewRunRecord {
  const base: Omit<ReviewRunRecord, "reviewRunIdentity"> = { version: KRI_R3_REVIEW_RUN_VERSION, reviewRunId: runId(req, providerId, providerVersion, status, failureCode, claims), status, providerId, providerVersion, policyIdentity: req.policyIdentity, canonicalBase: req.canonicalBase, reviewedHead: req.reviewedHead, evaluatedHead, contextBundleIdentity: req.contextBundle.bundleIdentity, taskId: req.taskId, instructionsIdentity: instructionId(req.instructions), acceptedClaimCount: findings.length, findingIdentities: findings.map((finding) => finding.findingIdentity).sort(cmp), failureCode }
  return freeze({ ...base, reviewRunIdentity: digest(base) })
}

function validateRun(input: unknown): ReviewRunRecord {
  const r = object(input, "review run")
  keys(r, ["version", "reviewRunId", "reviewRunIdentity", "status", "providerId", "providerVersion", "policyIdentity", "canonicalBase", "reviewedHead", "evaluatedHead", "contextBundleIdentity", "taskId", "instructionsIdentity", "acceptedClaimCount", "findingIdentities", "failureCode"], [], "review run")
  if (r.version !== KRI_R3_REVIEW_RUN_VERSION) throw new Error("review run version mismatch")
  const status = text(r.status, "review run.status", 32) as ReviewerRunStatus; if (!RUN_STATUSES.has(status)) throw new Error("review run status unsupported")
  const failureCode = r.failureCode as ReviewerRunFailureCode
  const expectedFailure: ReviewerRunFailureCode = status === "PROVIDER_FAILED" ? "provider-error" : status === "TIMED_OUT" ? "timeout" : status === "INVALID_PROVIDER_OUTPUT" ? "invalid-output" : null
  if (failureCode !== expectedFailure) throw new Error("review run failure code mismatch")
  const findingIdentities = sortedStrings(r.findingIdentities, "review run.findingIdentities", HARD_MAX_CLAIMS, 64, true); requireSorted(r.findingIdentities, findingIdentities, "review run.findingIdentities"); findingIdentities.forEach((id) => sha256(id, "finding identity"))
  const acceptedClaimCount = integer(r.acceptedClaimCount, "acceptedClaimCount", 0, HARD_MAX_CLAIMS); if (acceptedClaimCount !== findingIdentities.length || (failureCode && acceptedClaimCount !== 0)) throw new Error("review run finding accounting mismatch")
  const reviewedHead = sha1(r.reviewedHead, "reviewedHead")
  const evaluatedHead = sha1(r.evaluatedHead, "evaluatedHead")
  if ((status === "COMPLETED" && evaluatedHead !== reviewedHead) || (status === "STALE" && evaluatedHead === reviewedHead)) throw new Error("review run status/head freshness mismatch")
  const base: Omit<ReviewRunRecord, "reviewRunIdentity"> = { version: KRI_R3_REVIEW_RUN_VERSION, reviewRunId: sha256(r.reviewRunId, "reviewRunId"), status, providerId: text(r.providerId, "providerId", 128), providerVersion: text(r.providerVersion, "providerVersion", 128), policyIdentity: text(r.policyIdentity, "policyIdentity", MAX_POLICY_BYTES), canonicalBase: sha1(r.canonicalBase, "canonicalBase"), reviewedHead, evaluatedHead, contextBundleIdentity: sha256(r.contextBundleIdentity, "contextBundleIdentity"), taskId: text(r.taskId, "taskId", 128), instructionsIdentity: sha256(r.instructionsIdentity, "instructionsIdentity"), acceptedClaimCount, findingIdentities, failureCode }
  const expected = digest(base); if (sha256(r.reviewRunIdentity, "reviewRunIdentity") !== expected) throw new Error("review run identity mismatch")
  return freeze({ ...base, reviewRunIdentity: expected })
}

class TimeoutError extends Error {}

export class ReviewerExecutionRuntime {
  readonly #provider: ReviewerProvider
  readonly #findingRuntime: ReviewerExecutionRuntimeOptions["findingRuntime"]
  readonly #readCurrentHead: ReviewerExecutionRuntimeOptions["readCurrentHead"]
  readonly #providerId: string
  readonly #providerVersion: string
  readonly #maxClaims: number
  readonly #maxContextItems: number
  readonly #maxContextBytes: number
  readonly #timeoutMs: number

  constructor(options: ReviewerExecutionRuntimeOptions) {
    const r = object(options, "reviewer executor options"); keys(r, ["provider", "findingRuntime", "readCurrentHead"], ["maxClaims", "maxContextItems", "maxContextUtf8Bytes", "timeoutMs"], "reviewer executor options")
    const provider = r.provider as ReviewerProvider
    if (typeof provider !== "object" || provider === null || typeof provider.review !== "function" || typeof r.readCurrentHead !== "function" || typeof r.findingRuntime !== "object" || r.findingRuntime === null) throw new Error("invalid reviewer executor dependency")
    this.#provider = provider; this.#findingRuntime = r.findingRuntime as ReviewerExecutionRuntimeOptions["findingRuntime"]; this.#readCurrentHead = r.readCurrentHead as ReviewerExecutionRuntimeOptions["readCurrentHead"]
    this.#providerId = text(provider.providerId, "providerId", 128); this.#providerVersion = text(provider.providerVersion, "providerVersion", 128)
    this.#maxClaims = r.maxClaims === undefined ? 32 : integer(r.maxClaims, "maxClaims", 1, HARD_MAX_CLAIMS)
    this.#maxContextItems = r.maxContextItems === undefined ? 64 : integer(r.maxContextItems, "maxContextItems", 1, HARD_MAX_CONTEXT_ITEMS)
    this.#maxContextBytes = r.maxContextUtf8Bytes === undefined ? 64 * 1024 : integer(r.maxContextUtf8Bytes, "maxContextUtf8Bytes", 1, HARD_MAX_CONTEXT_BYTES)
    this.#timeoutMs = r.timeoutMs === undefined ? 30_000 : integer(r.timeoutMs, "timeoutMs", 1, HARD_MAX_TIMEOUT_MS)
  }

  validateReviewRunRecord(input: unknown): ReviewRunRecord { return validateRun(input) }

  async execute(input: unknown): Promise<ReviewerExecutionResult> {
    const req = request(input, this.#maxContextItems, this.#maxContextBytes)
    const preHead = sha1(await this.#readCurrentHead(), "pre-review head")
    if (preHead !== req.reviewedHead) throw new Error("reviewed head is no longer current before provider execution")
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    let raw: unknown
    try {
      const timeout = new Promise<never>((_resolve, reject) => { timer = setTimeout(() => { controller.abort(); reject(new TimeoutError()) }, this.#timeoutMs) })
      raw = await Promise.race([Promise.resolve().then(() => this.#provider.review(providerRequest(req, this.#maxClaims), controller.signal)), timeout])
    } catch (error) {
      if (timer) clearTimeout(timer)
      const evaluatedHead = sha1(await this.#readCurrentHead(), "post-review head")
      const status: ReviewerRunStatus = error instanceof TimeoutError ? "TIMED_OUT" : "PROVIDER_FAILED"
      const failureCode: ReviewerRunFailureCode = error instanceof TimeoutError ? "timeout" : "provider-error"
      return freeze({ run: runRecord(req, this.#providerId, this.#providerVersion, evaluatedHead, status, failureCode, [], []), claims: [], findings: [] })
    } finally { if (timer) clearTimeout(timer) }

    const evaluatedHead = sha1(await this.#readCurrentHead(), "post-review head")
    let output: ReviewerProviderOutput
    try { output = providerOutput(raw, this.#maxClaims, req.contextBundle) } catch {
      return freeze({ run: runRecord(req, this.#providerId, this.#providerVersion, evaluatedHead, "INVALID_PROVIDER_OUTPUT", "invalid-output", [], []), claims: [], findings: [] })
    }
    const status: ReviewerRunStatus = evaluatedHead === req.reviewedHead ? "COMPLETED" : "STALE"
    const id = runId(req, this.#providerId, this.#providerVersion, status, null, output.claims)
    const claims: ReviewClaim[] = output.claims.map((claim) => ({ claimKey: claim.claimKey, review: { reviewRunId: id, reviewerId: this.#providerId, reviewerVersion: this.#providerVersion, policyIdentity: req.policyIdentity, canonicalBase: req.canonicalBase, reviewedHead: req.reviewedHead }, path: claim.path, ...(claim.range ? { range: claim.range } : {}), summary: claim.summary, contractClaim: claim.contractClaim, category: claim.category, severity: claim.severity, confidenceBps: claim.confidenceBps, evidenceRefs: claim.evidenceItemIds.map((itemId) => `k3-context-item:${itemId}`).sort(cmp) }))
    const findings = claims.map((claim) => this.#findingRuntime.createFinding(claim, evaluatedHead))
    return freeze({ run: runRecord(req, this.#providerId, this.#providerVersion, evaluatedHead, status, null, output.claims, findings), claims, findings })
  }
}