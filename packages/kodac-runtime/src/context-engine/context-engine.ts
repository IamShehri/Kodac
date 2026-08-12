import { createHash } from "node:crypto"

import {
  K3_R2_SNAPSHOT_CONTRACT_VERSION,
  isFullGitObjectId,
  type RepositoryEvidence,
  type RepositorySnapshot,
} from "../repository/contracts.ts"
import {
  K3_R4_AST_GREP_ADAPTER_ID,
  K3_R4_AST_GREP_QUERY_CONTRACT_VERSION,
  type AstGrepStructuralQueryResult,
} from "../repository-intelligence/contracts.ts"
import {
  K3_R5_CONTEXT_BUNDLE_VERSION,
  K3_R5_CONTEXT_REQUEST_VERSION,
  K3_R5_SELECTION_STRATEGY_ID,
  type ContextBundle,
  type ContextBundleItem,
  type ContextBundleRequest,
  type ContextCompletenessReason,
  type ContextEngineInput,
  type ContextRelevanceReason,
} from "./contracts.ts"

const DEFAULT_MAX_ITEMS = 32
const HARD_MAX_ITEMS = 256
const DEFAULT_MAX_UTF8_BYTES = 32 * 1024
const HARD_MAX_UTF8_BYTES = 256 * 1024
const HARD_MAX_OBJECTIVE_BYTES = 4 * 1024
const HARD_MAX_TASK_ID_BYTES = 128
const HARD_MAX_TARGET_PATHS = 64
const HARD_MAX_TARGET_PATH_BYTES = 512
const HARD_MAX_SYMBOL_HINTS = 64
const HARD_MAX_SYMBOL_HINT_BYTES = 128
const HARD_MAX_EVIDENCE_INPUTS = 4_096
const HARD_MAX_STRUCTURAL_RESULTS = 64
const HARD_MAX_STRUCTURAL_MATCHES = 4_096
const HARD_MAX_ITEM_TEXT_BYTES = 64 * 1024
const HARD_MAX_PROVENANCE_REFS = 256
const HARD_MAX_PROVENANCE_REF_BYTES = 1_024
const HARD_MAX_CANDIDATE_FILES = 4_096

interface NormalizedRequest {
  version: typeof K3_R5_CONTEXT_REQUEST_VERSION
  kind: "build_context_bundle"
  taskId: string
  objective: string
  targetPaths: string[]
  symbolHints: string[]
  maxItems: number
  maxUtf8Bytes: number
}

interface CandidateItem extends ContextBundleItem {
  claimKind?: RepositoryEvidence["claim"]["kind"]
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map((item) => canonicalize(item)).join(",")}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record)
    .sort(compareStrings)
    .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`)
    .join(",")}}`
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort(compareStrings)
}

function boundedInteger(name: string, value: number | undefined, fallback: number, maximum: number): number {
  const resolved = value ?? fallback
  if (!Number.isInteger(resolved) || resolved <= 0 || resolved > maximum) {
    throw new Error(`${name} must be a positive integer <= ${maximum}`)
  }
  return resolved
}

function nonNegativeInteger(name: string, value: unknown, maximum: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > maximum) {
    throw new Error(`${name} must be an integer between 0 and ${maximum}`)
  }
  return value
}

function utf8Bytes(value: string): number {
  return Buffer.byteLength(value, "utf8")
}

function assertBoundedString(name: string, value: unknown, maximumBytes: number, allowEmpty = false): string {
  if (typeof value !== "string" || value.includes("\0") || (!allowEmpty && value.length === 0)) {
    throw new Error(`${name} must be a ${allowEmpty ? "valid" : "non-empty"} NUL-free string`)
  }
  if (utf8Bytes(value) > maximumBytes) throw new Error(`${name} exceeds ${maximumBytes} UTF-8 bytes`)
  return value
}

function validateCanonicalPath(path: unknown, label: string): string {
  const value = assertBoundedString(label, path, HARD_MAX_TARGET_PATH_BYTES)
  if (value.includes("\\") || value.startsWith("/") || /^[A-Za-z]:\//.test(value)) {
    throw new Error(`${label} must be a canonical workspace-relative slash path`)
  }
  const segments = value.split("/")
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) {
    throw new Error(`${label} contains an invalid path segment`)
  }
  return value
}

function validateSymbolHint(symbol: unknown, label: string): string {
  const value = assertBoundedString(label, symbol, HARD_MAX_SYMBOL_HINT_BYTES)
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`${label} must be a bounded ASCII identifier without ast-grep metavariable syntax`)
  }
  return value
}

function normalizeRequest(request: ContextBundleRequest): NormalizedRequest {
  if (request.version !== K3_R5_CONTEXT_REQUEST_VERSION || request.kind !== "build_context_bundle") {
    throw new Error("Unsupported K3-R5 context request contract")
  }
  const taskId = assertBoundedString("taskId", request.taskId, HARD_MAX_TASK_ID_BYTES)
  if (!/^[A-Za-z0-9._:-]+$/.test(taskId)) throw new Error("taskId must use the bounded stable-id alphabet")
  const objective = assertBoundedString("objective", request.objective, HARD_MAX_OBJECTIVE_BYTES)

  const rawPaths = request.targetPaths ?? []
  if (!Array.isArray(rawPaths) || rawPaths.length > HARD_MAX_TARGET_PATHS) {
    throw new Error(`targetPaths must contain at most ${HARD_MAX_TARGET_PATHS} paths`)
  }
  const targetPaths = uniqueSorted(rawPaths.map((path, index) => validateCanonicalPath(path, `targetPaths[${index}]`)))

  const rawSymbols = request.symbolHints ?? []
  if (!Array.isArray(rawSymbols) || rawSymbols.length > HARD_MAX_SYMBOL_HINTS) {
    throw new Error(`symbolHints must contain at most ${HARD_MAX_SYMBOL_HINTS} identifiers`)
  }
  const symbolHints = uniqueSorted(rawSymbols.map((symbol, index) => validateSymbolHint(symbol, `symbolHints[${index}]`)))

  return {
    version: K3_R5_CONTEXT_REQUEST_VERSION,
    kind: "build_context_bundle",
    taskId,
    objective,
    targetPaths,
    symbolHints,
    maxItems: boundedInteger("maxItems", request.maxItems, DEFAULT_MAX_ITEMS, HARD_MAX_ITEMS),
    maxUtf8Bytes: boundedInteger("maxUtf8Bytes", request.maxUtf8Bytes, DEFAULT_MAX_UTF8_BYTES, HARD_MAX_UTF8_BYTES),
  }
}

function assertDigest(label: string, value: unknown): asserts value is string {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/i.test(value)) throw new Error(`${label} must be a SHA-256 identity`)
}

function validateProvenanceRefs(values: unknown, label: string): string[] {
  if (!Array.isArray(values) || values.length > HARD_MAX_PROVENANCE_REFS) {
    throw new Error(`${label} must be a bounded provenance array`)
  }
  return uniqueSorted(values.map((value, index) => assertBoundedString(`${label}[${index}]`, value, HARD_MAX_PROVENANCE_REF_BYTES)))
}

function assertSnapshot(snapshot: RepositorySnapshot): void {
  if (snapshot.version !== K3_R2_SNAPSHOT_CONTRACT_VERSION) throw new Error(`Unsupported repository snapshot version: ${String(snapshot.version)}`)
  if (snapshot.repositoryIdentity?.scheme !== "workspace-root-sha256-v1" || snapshot.repositoryIdentity.scope !== "workspace-local") {
    throw new Error("K3-R5 requires the canonical K3-R2 repository identity scheme")
  }
  if (snapshot.contentIdentity?.scheme !== "sha256-canonical-repository-content-v1") {
    throw new Error("K3-R5 requires the canonical K3-R2 content identity scheme")
  }
  if (snapshot.snapshotIdentity?.scheme !== "sha256-k3-r2-snapshot-v1") {
    throw new Error("K3-R5 requires the canonical K3-R2 snapshot identity scheme")
  }
  if (snapshot.freshness !== "current") throw new Error("K3-R5 refuses a stale repository snapshot")
  if (snapshot.completeness?.state !== "complete") {
    throw new Error(`K3-R5 requires a complete repository snapshot; got ${String(snapshot.completeness?.state)}`)
  }
  if (!Array.isArray(snapshot.completeness.reasons) || snapshot.completeness.reasons.length !== 0 || snapshot.completeness.omittedAtLeast !== 0) {
    throw new Error("K3-R5 rejects malformed complete snapshot metadata")
  }
  if (!isFullGitObjectId(snapshot.gitHead)) throw new Error("K3-R5 requires a full Git HEAD object id")
  assertDigest("repositoryIdentity", snapshot.repositoryIdentity.value)
  assertDigest("contentIdentity", snapshot.contentIdentity.value)
  assertDigest("snapshotIdentity", snapshot.snapshotIdentity.value)
  if (!Array.isArray(snapshot.evidence) || snapshot.evidence.length > HARD_MAX_EVIDENCE_INPUTS) {
    throw new Error(`K3-R5 snapshot evidence exceeds ${HARD_MAX_EVIDENCE_INPUTS} items`)
  }
  if (!Array.isArray(snapshot.sources)) throw new Error("K3-R5 snapshot sources must be an array")
  const sourceIds = new Set<string>()
  for (const [index, source] of snapshot.sources.entries()) {
    const id = assertBoundedString(`snapshot.sources[${index}].id`, source?.id, 256)
    if (sourceIds.has(id)) throw new Error(`snapshot source identity replay mismatch: ${id}`)
    if (source?.kind !== "builtin") throw new Error(`snapshot.sources[${index}] has an unsupported source kind`)
    validateProvenanceRefs(source.provenanceRefs, `snapshot.sources[${index}].provenanceRefs`)
    sourceIds.add(id)
  }
  const evidenceIds = new Set<string>()
  for (const [index, evidence] of snapshot.evidence.entries()) {
    assertDigest(`snapshot.evidence[${index}].evidenceId`, evidence?.evidenceId)
    if (evidenceIds.has(evidence.evidenceId)) throw new Error(`snapshot evidence identity replay mismatch: ${evidence.evidenceId}`)
    evidenceIds.add(evidence.evidenceId)
    if (evidence.contentIdentity !== snapshot.contentIdentity.value) {
      throw new Error(`snapshot.evidence[${index}] belongs to a different content identity`)
    }
    validateCanonicalPath(evidence.subjectPath, `snapshot.evidence[${index}].subjectPath`)
    const sourceId = assertBoundedString(`snapshot.evidence[${index}].source.id`, evidence.source?.id, 256)
    if (evidence.source?.kind !== "builtin" || !sourceIds.has(sourceId)) {
      throw new Error(`snapshot.evidence[${index}] has an unbound source identity`)
    }
    validateProvenanceRefs(evidence.source.provenanceRefs, `snapshot.evidence[${index}].source.provenanceRefs`)
    if (!["precise-static", "parser-derived", "git-derived", "heuristic-inference", "model-hypothesis"].includes(evidence.evidenceClass)) {
      throw new Error(`snapshot.evidence[${index}] has an unsupported evidence class`)
    }
    if (!evidence.claim || !["working-tree-change", "architecture-candidate"].includes(evidence.claim.kind)) {
      throw new Error(`snapshot.evidence[${index}] has an unsupported claim kind`)
    }
    assertBoundedString(`snapshot.evidence[${index}].claim.value`, evidence.claim.value, HARD_MAX_ITEM_TEXT_BYTES)
    if (evidence.claim.sourcePath !== undefined) {
      validateCanonicalPath(evidence.claim.sourcePath, `snapshot.evidence[${index}].claim.sourcePath`)
    }
  }
}

function assertStructuralResult(result: AstGrepStructuralQueryResult, snapshot: RepositorySnapshot, index: number): void {
  const label = `structuralResults[${index}]`
  if (result.version !== K3_R4_AST_GREP_QUERY_CONTRACT_VERSION) throw new Error(`${label} has an unsupported contract version`)
  if (result.query?.kind !== "find_symbol_candidates") throw new Error(`${label} has an unsupported query kind`)
  if (result.freshness !== "current") throw new Error(`${label} is stale`)
  if (result.repositoryIdentity !== snapshot.repositoryIdentity.value) throw new Error(`${label} repository identity mismatch`)
  if (result.snapshotIdentity !== snapshot.snapshotIdentity.value) throw new Error(`${label} snapshot identity mismatch`)
  if (result.contentIdentity !== snapshot.contentIdentity.value) throw new Error(`${label} content identity mismatch`)
  if (result.deterministic !== true) throw new Error(`${label} is not deterministic`)
  assertDigest(`${label}.resultIdentity`, result.resultIdentity)

  if (
    result.source?.adapterId !== K3_R4_AST_GREP_ADAPTER_ID
    || result.source.candidate !== "ast-grep"
    || result.source.upstreamRepository !== "ast-grep/ast-grep"
    || result.source.upstreamTag !== "0.45.1"
    || result.source.upstreamCommit !== "dc3d655b9edf3b2bc266d9bc46eb60f18e66b818"
    || result.source.measuredVersion !== "ast-grep 0.45.1"
    || result.source.platformQualification !== "linux-x64-k3-r3"
    || result.source.executableSha256 !== "6a66162e0a2447af4b7524ee04195239eb1911d07f4868f918909e7d4f453eea"
    || result.source.kodacConfigSha256 !== "ca3d163bab055381827226140568f3bef7eaac187cebd76878e0b63e9e442356"
    || result.source.semanticStrength !== "structural-only-not-compiler-resolved"
  ) {
    throw new Error(`${label} has an unsupported structural source identity`)
  }
  validateProvenanceRefs(result.source.provenanceRefs, `${label}.source.provenanceRefs`)
  if (result.query.scope !== ".") validateCanonicalPath(result.query.scope, `${label}.query.scope`)
  validateSymbolHint(result.query.symbol, `${label}.query.symbol`)

  if (!result.candidateFiles || typeof result.candidateFiles !== "object") throw new Error(`${label} has invalid candidateFiles metadata`)
  nonNegativeInteger(`${label}.candidateFiles.included`, result.candidateFiles.included, HARD_MAX_CANDIDATE_FILES)
  nonNegativeInteger(`${label}.candidateFiles.omitted`, result.candidateFiles.omitted, HARD_MAX_STRUCTURAL_MATCHES)
  assertDigest(`${label}.candidateFiles.identity`, result.candidateFiles.identity)

  if (!result.completeness || !["complete", "truncated"].includes(result.completeness.state)) {
    throw new Error(`${label} has invalid completeness metadata`)
  }
  const omitted = nonNegativeInteger(`${label}.completeness.omittedAtLeast`, result.completeness.omittedAtLeast, HARD_MAX_STRUCTURAL_MATCHES)
  if (!Array.isArray(result.completeness.reasons) || result.completeness.reasons.some((reason) => ![
    "candidate-file-limit",
    "candidate-argument-byte-limit",
    "max-results",
  ].includes(reason))) {
    throw new Error(`${label} has invalid completeness reasons`)
  }
  if (result.completeness.state === "complete") {
    if (omitted !== 0 || result.completeness.reasons.length !== 0 || result.candidateFiles.omitted !== 0) {
      throw new Error(`${label} has contradictory complete metadata`)
    }
  } else if (omitted === 0 || result.completeness.reasons.length === 0) {
    throw new Error(`${label} has contradictory truncated metadata`)
  }

  if (!Array.isArray(result.matches)) throw new Error(`${label}.matches must be an array`)
  for (const [matchIndex, match] of result.matches.entries()) {
    validateCanonicalPath(match.path, `${label}.matches[${matchIndex}].path`)
    if (match.evidenceClass !== "parser-derived") throw new Error(`${label}.matches[${matchIndex}] must remain parser-derived`)
    if (!Number.isInteger(match.line) || match.line <= 0 || !Number.isInteger(match.column) || match.column <= 0) {
      throw new Error(`${label}.matches[${matchIndex}] has invalid coordinates`)
    }
    assertBoundedString(`${label}.matches[${matchIndex}].text`, match.text, HARD_MAX_ITEM_TEXT_BYTES)
  }
}

function lexicalTokens(value: string): Set<string> {
  return new Set((value.match(/[A-Za-z0-9_]+/g) ?? []).map((token) => token.toLowerCase()))
}

function relatedPath(path: string, target: string): boolean {
  return path.startsWith(`${target}/`) || target.startsWith(`${path}/`)
}

function scoreItem(item: CandidateItem, request: NormalizedRequest): CandidateItem {
  let score = 0
  const reasons = new Set<ContextRelevanceReason>()
  for (const target of request.targetPaths) {
    if (item.subjectPath === target) {
      score += 1_000
      reasons.add("exact-target-path")
    } else if (relatedPath(item.subjectPath, target)) {
      score += 400
      reasons.add("related-target-path")
    }
  }

  const itemTokens = lexicalTokens(`${item.subjectPath}\n${item.text}`)
  for (const symbol of request.symbolHints) {
    if (itemTokens.has(symbol.toLowerCase())) {
      score += 500
      reasons.add("exact-symbol-hint")
    }
  }

  let overlap = 0
  for (const token of lexicalTokens(request.objective)) if (itemTokens.has(token)) overlap++
  if (overlap > 0) {
    score += Math.min(overlap, 32) * 20
    reasons.add("objective-overlap")
  }

  if (item.claimKind === "working-tree-change") {
    score += 50
    reasons.add("working-tree-change")
  } else if (item.claimKind === "architecture-candidate") {
    score += 10
    reasons.add("architecture-candidate")
  }

  if (reasons.size === 0) reasons.add("stable-fallback")
  return { ...item, relevance: { score, reasons: [...reasons].sort(compareStrings) } }
}

function repositoryEvidenceItem(evidence: RepositoryEvidence): CandidateItem {
  const suffix = evidence.claim.sourcePath ? `;sourcePath=${evidence.claim.sourcePath}` : ""
  const text = `${evidence.claim.kind}:${evidence.claim.value}${suffix}`
  const contextUtf8Bytes = utf8Bytes(text)
  if (contextUtf8Bytes === 0 || contextUtf8Bytes > HARD_MAX_ITEM_TEXT_BYTES) throw new Error("Repository evidence normalized text exceeds the K3-R5 item bound")
  return {
    itemId: sha256(canonicalize({ kind: "repository-evidence", evidenceId: evidence.evidenceId, text })),
    sourceKind: "repository-evidence",
    sourceIdentity: evidence.evidenceId,
    sourceAdapter: evidence.source.id,
    subjectPath: evidence.subjectPath,
    evidenceClass: evidence.evidenceClass,
    text,
    contextUtf8Bytes,
    provenanceRefs: uniqueSorted(evidence.source.provenanceRefs),
    trust: "untrusted-repository-data",
    relevance: { score: 0, reasons: ["stable-fallback"] },
    claimKind: evidence.claim.kind,
  }
}

function structuralItems(result: AstGrepStructuralQueryResult): CandidateItem[] {
  return result.matches.map((match) => {
    const text = `line=${match.line};column=${match.column};match=${match.text}`
    const contextUtf8Bytes = utf8Bytes(text)
    if (contextUtf8Bytes === 0 || contextUtf8Bytes > HARD_MAX_ITEM_TEXT_BYTES) throw new Error("Structural match normalized text exceeds the K3-R5 item bound")
    return {
      itemId: sha256(canonicalize({
        kind: "ast-grep-structural-match",
        resultIdentity: result.resultIdentity,
        path: match.path,
        line: match.line,
        column: match.column,
        text: match.text,
      })),
      sourceKind: "ast-grep-structural-match",
      sourceIdentity: result.resultIdentity,
      sourceAdapter: result.source.adapterId,
      subjectPath: match.path,
      evidenceClass: "parser-derived",
      text,
      contextUtf8Bytes,
      provenanceRefs: uniqueSorted(result.source.provenanceRefs),
      trust: "untrusted-repository-data",
      relevance: { score: 0, reasons: ["stable-fallback"] },
    }
  })
}

function candidateOrder(left: CandidateItem, right: CandidateItem): number {
  return (
    right.relevance.score - left.relevance.score
    || compareStrings(left.subjectPath, right.subjectPath)
    || compareStrings(left.sourceKind, right.sourceKind)
    || compareStrings(left.sourceIdentity, right.sourceIdentity)
    || compareStrings(left.itemId, right.itemId)
  )
}

function itemIdentityProjection(item: ContextBundleItem): unknown {
  return {
    itemId: item.itemId,
    sourceKind: item.sourceKind,
    sourceIdentity: item.sourceIdentity,
    sourceAdapter: item.sourceAdapter,
    subjectPath: item.subjectPath,
    evidenceClass: item.evidenceClass,
    text: item.text,
    contextUtf8Bytes: item.contextUtf8Bytes,
    trust: item.trust,
    relevance: item.relevance,
  }
}

export function buildContextBundle(input: ContextEngineInput): ContextBundle {
  const request = normalizeRequest(input.request)
  assertSnapshot(input.snapshot)

  const structuralResults = input.structuralResults ?? []
  if (!Array.isArray(structuralResults) || structuralResults.length > HARD_MAX_STRUCTURAL_RESULTS) {
    throw new Error(`structuralResults must contain at most ${HARD_MAX_STRUCTURAL_RESULTS} results`)
  }
  let structuralMatchCount = 0
  const structuralResultIds = new Set<string>()
  for (const [index, result] of structuralResults.entries()) {
    assertStructuralResult(result, input.snapshot, index)
    if (structuralResultIds.has(result.resultIdentity)) {
      throw new Error(`structural result identity replay mismatch: ${result.resultIdentity}`)
    }
    structuralResultIds.add(result.resultIdentity)
    structuralMatchCount += result.matches.length
    if (structuralMatchCount > HARD_MAX_STRUCTURAL_MATCHES) {
      throw new Error(`K3-R5 structural matches exceed ${HARD_MAX_STRUCTURAL_MATCHES} items`)
    }
  }

  const completenessReasons = new Set<ContextCompletenessReason>()
  let knownOmitted = 0
  let sourceOmittedAtLeast = 0
  const candidates: CandidateItem[] = []

  for (const evidence of input.snapshot.evidence) {
    if (evidence.evidenceClass === "model-hypothesis") {
      completenessReasons.add("unsupported-evidence")
      knownOmitted++
      continue
    }
    candidates.push(scoreItem(repositoryEvidenceItem(evidence), request))
  }

  for (const result of structuralResults) {
    if (result.completeness.state === "truncated") {
      completenessReasons.add("source-input-limit")
      sourceOmittedAtLeast = Math.max(sourceOmittedAtLeast, result.completeness.omittedAtLeast)
    }
    for (const item of structuralItems(result)) candidates.push(scoreItem(item, request))
  }

  const deduplicated = new Map<string, CandidateItem>()
  for (const item of candidates) {
    const existing = deduplicated.get(item.itemId)
    if (!existing || candidateOrder(item, existing) < 0) deduplicated.set(item.itemId, item)
  }
  const ordered = [...deduplicated.values()].sort(candidateOrder)

  const items: ContextBundleItem[] = []
  let usedUtf8Bytes = 0
  for (const candidate of ordered) {
    if (items.length >= request.maxItems) {
      completenessReasons.add("item-budget")
      knownOmitted++
      continue
    }
    if (usedUtf8Bytes + candidate.contextUtf8Bytes > request.maxUtf8Bytes) {
      completenessReasons.add("byte-budget")
      knownOmitted++
      continue
    }
    const { claimKind: _claimKind, ...item } = candidate
    items.push(item)
    usedUtf8Bytes += item.contextUtf8Bytes
  }

  const reasons = [...completenessReasons].sort(compareStrings)
  const completeness = {
    state: reasons.length > 0 ? "truncated" as const : "complete" as const,
    reasons,
    omittedAtLeast: knownOmitted + sourceOmittedAtLeast,
  }
  const budget = {
    maxItems: request.maxItems,
    maxUtf8Bytes: request.maxUtf8Bytes,
    usedItems: items.length,
    usedUtf8Bytes,
  }
  const requestIdentity = sha256(canonicalize(request))
  const provenanceRefs = uniqueSorted([
    ...input.snapshot.sources.flatMap((source) => validateProvenanceRefs(source.provenanceRefs, `snapshot source ${source.id} provenance`)),
    ...items.flatMap((item) => item.provenanceRefs),
  ])

  const identityInput = {
    version: K3_R5_CONTEXT_BUNDLE_VERSION,
    requestIdentity,
    repositoryIdentity: input.snapshot.repositoryIdentity.value,
    snapshotIdentity: input.snapshot.snapshotIdentity.value,
    contentIdentity: input.snapshot.contentIdentity.value,
    freshness: "current",
    taskId: request.taskId,
    selectionStrategy: K3_R5_SELECTION_STRATEGY_ID,
    budget,
    completeness,
    items: items.map(itemIdentityProjection),
  }

  return {
    version: K3_R5_CONTEXT_BUNDLE_VERSION,
    bundleIdentity: sha256(canonicalize(identityInput)),
    requestIdentity,
    repositoryIdentity: input.snapshot.repositoryIdentity.value,
    snapshotIdentity: input.snapshot.snapshotIdentity.value,
    contentIdentity: input.snapshot.contentIdentity.value,
    freshness: "current",
    taskId: request.taskId,
    selectionStrategy: K3_R5_SELECTION_STRATEGY_ID,
    budget,
    completeness,
    items,
    provenanceRefs,
  }
}
