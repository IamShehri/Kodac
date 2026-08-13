import { createHash } from "node:crypto"

/**
 * KDO-C11 is a Kodac-native port of context-connector contract ideas studied from:
 * augmentcode/context-connectors@f7d6472ae626c98fd768f64cdfd6160145eefa77
 *
 * Studied donor contracts:
 * - src/sources/types.ts (blob d21d61c178607eb28438652eb93911c90aa05aa1)
 * - src/core/types.ts    (blob c65f4757f0e7492e87fdbb08cbd584e03ed8efde)
 * - src/stores/types.ts  (blob bcd9cf7c70d2d2ae9e9540889c33fbe13e128838)
 *
 * Only pure descriptor/data semantics are ported. No Augment SDK, DirectContext,
 * transport, credentials, persistence, MCP/HTTP server, process, network, or
 * filesystem-write authority is imported by this module.
 */

export const KDO_C11_CONTEXT_CONNECTOR_VERSION = "kodac-context-connector-contracts-v1" as const
export const KDO_C11_AUGMENT_DONOR_PROVENANCE = Object.freeze({
  repository: "augmentcode/context-connectors",
  sourceCommit: "f7d6472ae626c98fd768f64cdfd6160145eefa77",
  sourceContracts: Object.freeze([
    Object.freeze({ path: "src/sources/types.ts", blob: "d21d61c178607eb28438652eb93911c90aa05aa1" }),
    Object.freeze({ path: "src/core/types.ts", blob: "c65f4757f0e7492e87fdbb08cbd584e03ed8efde" }),
    Object.freeze({ path: "src/stores/types.ts", blob: "bcd9cf7c70d2d2ae9e9540889c33fbe13e128838" }),
  ]),
  intakeMode: "PORT",
} as const)

export const CONTEXT_SOURCE_CAPABILITIES = Object.freeze([
  "full_snapshot", "incremental_changes", "list_entries", "read_item", "revision_resolution",
] as const)
export const CONTEXT_STORE_CAPABILITIES = Object.freeze([
  "load_full_state", "load_search_state", "list_keys", "save_state", "delete_state",
] as const)
export const CONTEXT_CLIENT_CAPABILITIES = Object.freeze([
  "search", "list", "read", "mcp_exposure", "cli_exposure",
] as const)

export type ContextSourceCapability = (typeof CONTEXT_SOURCE_CAPABILITIES)[number]
export type ContextStoreCapability = (typeof CONTEXT_STORE_CAPABILITIES)[number]
export type ContextClientCapability = (typeof CONTEXT_CLIENT_CAPABILITIES)[number]
export type ContextConnectorSourceKind = "versioned_repository" | "website" | "filesystem" | "custom"
export type ContextStoreMode = "read_only" | "read_write"
export type ContextChangeKind = "FULL_REQUIRED" | "UNCHANGED" | "INCREMENTAL"
export type FullRequiredReason =
  | "incremental_unavailable"
  | "history_rewritten"
  | "filter_changed"
  | "threshold_exceeded"
  | "source_unsupported"
  | "unknown"

export interface ContextSourceProfileInput {
  readonly sourceKind: ContextConnectorSourceKind
  readonly sourceId: string
  readonly capabilities: readonly ContextSourceCapability[]
  readonly sourceConfigIdentity: string
  readonly provenanceIdentity: string
  readonly sourceRevisionIdentity?: string
}
export interface ContextSourceProfile extends ContextSourceProfileInput {
  readonly version: typeof KDO_C11_CONTEXT_CONNECTOR_VERSION
  readonly sourceProfileIdentity: string
}

export interface ContextContentItemInput {
  readonly path: string
  readonly content: string
  readonly sourceProfileIdentity: string
  readonly sourceRevisionIdentity?: string
}
export interface ContextContentItem extends ContextContentItemInput {
  readonly contentBytes: number
  readonly contentIdentity: string
  readonly itemIdentity: string
}

export interface FullRequiredChangeInput {
  readonly kind: "FULL_REQUIRED"
  readonly sourceProfileIdentity: string
  readonly previousRevisionIdentity?: string
  readonly currentRevisionIdentity?: string
  readonly reason: FullRequiredReason
}
export interface UnchangedChangeInput {
  readonly kind: "UNCHANGED"
  readonly sourceProfileIdentity: string
  readonly previousRevisionIdentity?: string
  readonly currentRevisionIdentity?: string
}
export interface IncrementalChangeInput {
  readonly kind: "INCREMENTAL"
  readonly sourceProfileIdentity: string
  readonly previousRevisionIdentity?: string
  readonly currentRevisionIdentity?: string
  readonly added: readonly ContextContentItem[]
  readonly modified: readonly ContextContentItem[]
  readonly removed: readonly string[]
}
export type ContextSourceChangeSetInput = FullRequiredChangeInput | UnchangedChangeInput | IncrementalChangeInput
export interface ContextSourceChangeSet {
  readonly version: typeof KDO_C11_CONTEXT_CONNECTOR_VERSION
  readonly kind: ContextChangeKind
  readonly sourceProfileIdentity: string
  readonly previousRevisionIdentity?: string
  readonly currentRevisionIdentity?: string
  readonly reason?: FullRequiredReason
  readonly added: readonly ContextContentItem[]
  readonly modified: readonly ContextContentItem[]
  readonly removed: readonly string[]
  readonly itemCount: number
  readonly aggregateContentBytes: number
  readonly changeSetIdentity: string
}

export interface ContextStoreProfileInput {
  readonly storeId: string
  readonly mode: ContextStoreMode
  readonly capabilities: readonly ContextStoreCapability[]
  readonly storeConfigIdentity: string
  readonly provenanceIdentity: string
}
export interface ContextStoreProfile extends ContextStoreProfileInput {
  readonly version: typeof KDO_C11_CONTEXT_CONNECTOR_VERSION
  readonly storeProfileIdentity: string
}

export interface ContextClientProfileInput {
  readonly clientId: string
  readonly capabilities: readonly ContextClientCapability[]
  readonly clientConfigIdentity: string
  readonly provenanceIdentity: string
}
export interface ContextClientProfile extends ContextClientProfileInput {
  readonly version: typeof KDO_C11_CONTEXT_CONNECTOR_VERSION
  readonly clientProfileIdentity: string
}

export const KDO_C11_LIMITS: Readonly<{
  maxIdentifierBytes: number
  maxLogicalPathBytes: number
  maxContentBytes: number
  maxChangeEntries: number
  maxChangeContentBytes: number
}> = Object.freeze({
  maxIdentifierBytes: 256,
  maxLogicalPathBytes: 4096,
  maxContentBytes: 1_048_576,
  maxChangeEntries: 2048,
  maxChangeContentBytes: 16 * 1_048_576,
})

const SHA256 = /^[0-9a-f]{64}$/
const SOURCE_KINDS = new Set<ContextConnectorSourceKind>(["versioned_repository", "website", "filesystem", "custom"])
const STORE_MODES = new Set<ContextStoreMode>(["read_only", "read_write"])
const FULL_REASONS = new Set<FullRequiredReason>([
  "incremental_unavailable", "history_rewritten", "filter_changed", "threshold_exceeded", "source_unsupported", "unknown",
])
const SOURCE_CAPS = new Set<ContextSourceCapability>(CONTEXT_SOURCE_CAPABILITIES)
const STORE_CAPS = new Set<ContextStoreCapability>(CONTEXT_STORE_CAPABILITIES)
const CLIENT_CAPS = new Set<ContextClientCapability>(CONTEXT_CLIENT_CAPABILITIES)
const SOURCE_INPUT_KEYS = ["sourceKind", "sourceId", "capabilities", "sourceConfigIdentity", "provenanceIdentity", "sourceRevisionIdentity"] as const
const SOURCE_PROFILE_KEYS = [...SOURCE_INPUT_KEYS, "version", "sourceProfileIdentity"] as const
const CONTENT_INPUT_KEYS = ["path", "content", "sourceProfileIdentity", "sourceRevisionIdentity"] as const
const CONTENT_KEYS = [...CONTENT_INPUT_KEYS, "contentBytes", "contentIdentity", "itemIdentity"] as const
const STORE_INPUT_KEYS = ["storeId", "mode", "capabilities", "storeConfigIdentity", "provenanceIdentity"] as const
const STORE_PROFILE_KEYS = [...STORE_INPUT_KEYS, "version", "storeProfileIdentity"] as const
const CLIENT_INPUT_KEYS = ["clientId", "capabilities", "clientConfigIdentity", "provenanceIdentity"] as const
const CLIENT_PROFILE_KEYS = [...CLIENT_INPUT_KEYS, "version", "clientProfileIdentity"] as const
const FULL_INPUT_KEYS = ["kind", "sourceProfileIdentity", "previousRevisionIdentity", "currentRevisionIdentity", "reason"] as const
const UNCHANGED_INPUT_KEYS = ["kind", "sourceProfileIdentity", "previousRevisionIdentity", "currentRevisionIdentity"] as const
const INCREMENTAL_INPUT_KEYS = ["kind", "sourceProfileIdentity", "previousRevisionIdentity", "currentRevisionIdentity", "added", "modified", "removed"] as const
const CHANGE_OUTPUT_KEYS = [
  "version", "kind", "sourceProfileIdentity", "previousRevisionIdentity", "currentRevisionIdentity", "reason",
  "added", "modified", "removed", "itemCount", "aggregateContentBytes", "changeSetIdentity",
] as const

function compareStrings(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0 }
function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort(compareStrings).map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`).join(",")}}`
}
function sha256(value: unknown): string { return createHash("sha256").update(canonicalize(value), "utf8").digest("hex") }
function sha256Text(value: string): string { return createHash("sha256").update(value, "utf8").digest("hex") }
function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`)
  return value as Record<string, unknown>
}
function exactKeys(record: Record<string, unknown>, allowed: readonly string[], label: string): void {
  const allowedSet = new Set(allowed)
  for (const key of Object.keys(record)) if (!allowedSet.has(key)) throw new TypeError(`${label} contains unknown field: ${key}`)
}
function boundedString(value: unknown, label: string, maxBytes: number = KDO_C11_LIMITS.maxIdentifierBytes): string {
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
function optionalIdentity(value: unknown, label: string): string | undefined { return value === undefined ? undefined : identity(value, label) }
function canonicalCapabilities<T extends string>(value: unknown, label: string, allowed: ReadonlySet<T>): readonly T[] {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`)
  const seen = new Set<T>(); const result: T[] = []
  for (const [index, raw] of value.entries()) {
    if (typeof raw !== "string" || !allowed.has(raw as T)) throw new TypeError(`${label}[${index}] is unsupported`)
    const cap = raw as T
    if (seen.has(cap)) throw new TypeError(`${label} contains duplicate capability: ${cap}`)
    seen.add(cap); result.push(cap)
  }
  return Object.freeze(result.sort(compareStrings))
}

export function normalizeContextLogicalPath(value: unknown): string {
  const path = boundedString(value, "logicalPath", KDO_C11_LIMITS.maxLogicalPathBytes)
  if (path.includes("\\")) throw new TypeError("logicalPath must use forward-slash separators")
  if (path.startsWith("/") || path.startsWith("//") || /^[A-Za-z]:\//.test(path)) throw new TypeError("logicalPath must be relative")
  const parts = path.split("/")
  if (parts.some((part) => part.length === 0 || part === "." || part === "..")) throw new TypeError("logicalPath contains an unsafe or ambiguous segment")
  return parts.join("/")
}

function sourcePreimage(profile: Omit<ContextSourceProfile, "sourceProfileIdentity">): Record<string, unknown> {
  return {
    version: profile.version, sourceKind: profile.sourceKind, sourceId: profile.sourceId, capabilities: profile.capabilities,
    sourceConfigIdentity: profile.sourceConfigIdentity, provenanceIdentity: profile.provenanceIdentity,
    ...(profile.sourceRevisionIdentity === undefined ? {} : { sourceRevisionIdentity: profile.sourceRevisionIdentity }),
  }
}
export function createContextSourceProfile(input: ContextSourceProfileInput): ContextSourceProfile {
  const record = asRecord(input, "contextSourceProfile"); exactKeys(record, SOURCE_INPUT_KEYS, "contextSourceProfile")
  if (!SOURCE_KINDS.has(record.sourceKind as ContextConnectorSourceKind)) throw new TypeError("contextSourceProfile.sourceKind is unsupported")
  const base: Omit<ContextSourceProfile, "sourceProfileIdentity"> = Object.freeze({
    version: KDO_C11_CONTEXT_CONNECTOR_VERSION,
    sourceKind: record.sourceKind as ContextConnectorSourceKind,
    sourceId: boundedString(record.sourceId, "contextSourceProfile.sourceId"),
    capabilities: canonicalCapabilities(record.capabilities, "contextSourceProfile.capabilities", SOURCE_CAPS),
    sourceConfigIdentity: identity(record.sourceConfigIdentity, "contextSourceProfile.sourceConfigIdentity"),
    provenanceIdentity: identity(record.provenanceIdentity, "contextSourceProfile.provenanceIdentity"),
    ...(record.sourceRevisionIdentity === undefined ? {} : { sourceRevisionIdentity: identity(record.sourceRevisionIdentity, "contextSourceProfile.sourceRevisionIdentity") }),
  })
  return Object.freeze({ ...base, sourceProfileIdentity: sha256(sourcePreimage(base)) })
}
export function validateContextSourceProfile(value: unknown): ContextSourceProfile {
  const record = asRecord(value, "contextSourceProfile"); exactKeys(record, SOURCE_PROFILE_KEYS, "contextSourceProfile")
  if (record.version !== KDO_C11_CONTEXT_CONNECTOR_VERSION) throw new TypeError("unsupported context source profile version")
  const claimed = identity(record.sourceProfileIdentity, "contextSourceProfile.sourceProfileIdentity")
  const rebuilt = createContextSourceProfile({
    sourceKind: record.sourceKind as ContextConnectorSourceKind,
    sourceId: record.sourceId as string,
    capabilities: record.capabilities as readonly ContextSourceCapability[],
    sourceConfigIdentity: record.sourceConfigIdentity as string,
    provenanceIdentity: record.provenanceIdentity as string,
    ...(record.sourceRevisionIdentity === undefined ? {} : { sourceRevisionIdentity: record.sourceRevisionIdentity as string }),
  })
  if (claimed !== rebuilt.sourceProfileIdentity) throw new TypeError("contextSourceProfile.sourceProfileIdentity mismatch")
  return rebuilt
}

function contentPreimage(item: Omit<ContextContentItem, "itemIdentity">): Record<string, unknown> {
  return {
    path: item.path, contentIdentity: item.contentIdentity, contentBytes: item.contentBytes, sourceProfileIdentity: item.sourceProfileIdentity,
    ...(item.sourceRevisionIdentity === undefined ? {} : { sourceRevisionIdentity: item.sourceRevisionIdentity }),
  }
}
export function createContextContentItem(input: ContextContentItemInput): ContextContentItem {
  const record = asRecord(input, "contextContentItem"); exactKeys(record, CONTENT_INPUT_KEYS, "contextContentItem")
  const path = normalizeContextLogicalPath(record.path)
  if (typeof record.content !== "string") throw new TypeError("contextContentItem.content must be a string")
  if (record.content.includes("\0")) throw new TypeError("contextContentItem.content must be NUL-free")
  const contentBytes = Buffer.byteLength(record.content, "utf8")
  if (contentBytes > KDO_C11_LIMITS.maxContentBytes) throw new RangeError("contextContentItem.content exceeds byte bound")
  const base: Omit<ContextContentItem, "itemIdentity"> = Object.freeze({
    path, content: record.content, contentBytes, contentIdentity: sha256Text(record.content),
    sourceProfileIdentity: identity(record.sourceProfileIdentity, "contextContentItem.sourceProfileIdentity"),
    ...(record.sourceRevisionIdentity === undefined ? {} : { sourceRevisionIdentity: identity(record.sourceRevisionIdentity, "contextContentItem.sourceRevisionIdentity") }),
  })
  return Object.freeze({ ...base, itemIdentity: sha256(contentPreimage(base)) })
}
export function validateContextContentItem(value: unknown): ContextContentItem {
  const record = asRecord(value, "contextContentItem"); exactKeys(record, CONTENT_KEYS, "contextContentItem")
  const rebuilt = createContextContentItem({
    path: record.path as string, content: record.content as string, sourceProfileIdentity: record.sourceProfileIdentity as string,
    ...(record.sourceRevisionIdentity === undefined ? {} : { sourceRevisionIdentity: record.sourceRevisionIdentity as string }),
  })
  if (record.contentBytes !== rebuilt.contentBytes) throw new TypeError("contextContentItem.contentBytes mismatch")
  if (identity(record.contentIdentity, "contextContentItem.contentIdentity") !== rebuilt.contentIdentity) throw new TypeError("contextContentItem.contentIdentity mismatch")
  if (identity(record.itemIdentity, "contextContentItem.itemIdentity") !== rebuilt.itemIdentity) throw new TypeError("contextContentItem.itemIdentity mismatch")
  return rebuilt
}

function revisionFields(record: Record<string, unknown>): { previousRevisionIdentity?: string; currentRevisionIdentity?: string } {
  const previous = optionalIdentity(record.previousRevisionIdentity, "changeSet.previousRevisionIdentity")
  const current = optionalIdentity(record.currentRevisionIdentity, "changeSet.currentRevisionIdentity")
  return { ...(previous === undefined ? {} : { previousRevisionIdentity: previous }), ...(current === undefined ? {} : { currentRevisionIdentity: current }) }
}
function canonicalItems(value: unknown, label: string, sourceProfileIdentity: string): readonly ContextContentItem[] {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`)
  const seen = new Set<string>()
  const items = value.map(validateContextContentItem)
  for (const item of items) {
    if (item.sourceProfileIdentity !== sourceProfileIdentity) throw new TypeError(`${label} item sourceProfileIdentity mismatch`)
    if (seen.has(item.path)) throw new TypeError(`${label} contains duplicate path: ${item.path}`)
    seen.add(item.path)
  }
  return Object.freeze(items.sort((a, b) => compareStrings(a.path, b.path)))
}
function canonicalRemoved(value: unknown): readonly string[] {
  if (!Array.isArray(value)) throw new TypeError("changeSet.removed must be an array")
  const seen = new Set<string>(); const paths = value.map(normalizeContextLogicalPath)
  for (const path of paths) { if (seen.has(path)) throw new TypeError(`changeSet.removed contains duplicate path: ${path}`); seen.add(path) }
  return Object.freeze(paths.sort(compareStrings))
}
export function createContextSourceChangeSet(input: ContextSourceChangeSetInput): ContextSourceChangeSet {
  const record = asRecord(input, "changeSet")
  const sourceProfileIdentity = identity(record.sourceProfileIdentity, "changeSet.sourceProfileIdentity")
  const revisions = revisionFields(record)
  const common = { version: KDO_C11_CONTEXT_CONNECTOR_VERSION, sourceProfileIdentity, ...revisions }
  if (record.kind === "FULL_REQUIRED") {
    exactKeys(record, FULL_INPUT_KEYS, "changeSet")
    if (!FULL_REASONS.has(record.reason as FullRequiredReason)) throw new TypeError("changeSet.reason is unsupported")
    const base = { ...common, kind: "FULL_REQUIRED" as const, reason: record.reason as FullRequiredReason, added: [], modified: [], removed: [], itemCount: 0, aggregateContentBytes: 0 }
    return Object.freeze({ ...base, changeSetIdentity: sha256(base) })
  }
  if (record.kind === "UNCHANGED") {
    exactKeys(record, UNCHANGED_INPUT_KEYS, "changeSet")
    const base = { ...common, kind: "UNCHANGED" as const, added: [], modified: [], removed: [], itemCount: 0, aggregateContentBytes: 0 }
    return Object.freeze({ ...base, changeSetIdentity: sha256(base) })
  }
  if (record.kind !== "INCREMENTAL") throw new TypeError("changeSet.kind is unsupported")
  exactKeys(record, INCREMENTAL_INPUT_KEYS, "changeSet")
  const added = canonicalItems(record.added, "changeSet.added", sourceProfileIdentity)
  const modified = canonicalItems(record.modified, "changeSet.modified", sourceProfileIdentity)
  const removed = canonicalRemoved(record.removed)
  const seen = new Set<string>()
  for (const path of [...added.map((x) => x.path), ...modified.map((x) => x.path), ...removed]) {
    if (seen.has(path)) throw new TypeError(`changeSet path appears in multiple classes: ${path}`)
    seen.add(path)
  }
  const itemCount = added.length + modified.length + removed.length
  if (itemCount === 0) throw new TypeError("INCREMENTAL changeSet must contain at least one change")
  if (itemCount > KDO_C11_LIMITS.maxChangeEntries) throw new RangeError("changeSet exceeds item-count bound")
  const aggregateContentBytes = [...added, ...modified].reduce((sum, x) => sum + x.contentBytes, 0)
  if (!Number.isSafeInteger(aggregateContentBytes) || aggregateContentBytes > KDO_C11_LIMITS.maxChangeContentBytes) throw new RangeError("changeSet exceeds aggregate-content byte bound")
  const base = { ...common, kind: "INCREMENTAL" as const, added, modified, removed, itemCount, aggregateContentBytes }
  return Object.freeze({ ...base, changeSetIdentity: sha256(base) })
}
export function validateContextSourceChangeSet(value: unknown): ContextSourceChangeSet {
  const record = asRecord(value, "changeSet"); exactKeys(record, CHANGE_OUTPUT_KEYS, "changeSet")
  if (record.version !== KDO_C11_CONTEXT_CONNECTOR_VERSION) throw new TypeError("unsupported context change-set version")
  const claimedIdentity = identity(record.changeSetIdentity, "changeSet.changeSetIdentity")
  let rebuilt: ContextSourceChangeSet
  if (record.kind === "FULL_REQUIRED") {
    rebuilt = createContextSourceChangeSet({
      kind: "FULL_REQUIRED", sourceProfileIdentity: record.sourceProfileIdentity as string,
      ...(record.previousRevisionIdentity === undefined ? {} : { previousRevisionIdentity: record.previousRevisionIdentity as string }),
      ...(record.currentRevisionIdentity === undefined ? {} : { currentRevisionIdentity: record.currentRevisionIdentity as string }),
      reason: record.reason as FullRequiredReason,
    })
  } else if (record.kind === "UNCHANGED") {
    rebuilt = createContextSourceChangeSet({
      kind: "UNCHANGED", sourceProfileIdentity: record.sourceProfileIdentity as string,
      ...(record.previousRevisionIdentity === undefined ? {} : { previousRevisionIdentity: record.previousRevisionIdentity as string }),
      ...(record.currentRevisionIdentity === undefined ? {} : { currentRevisionIdentity: record.currentRevisionIdentity as string }),
    })
  } else if (record.kind === "INCREMENTAL") {
    rebuilt = createContextSourceChangeSet({
      kind: "INCREMENTAL", sourceProfileIdentity: record.sourceProfileIdentity as string,
      ...(record.previousRevisionIdentity === undefined ? {} : { previousRevisionIdentity: record.previousRevisionIdentity as string }),
      ...(record.currentRevisionIdentity === undefined ? {} : { currentRevisionIdentity: record.currentRevisionIdentity as string }),
      added: record.added as readonly ContextContentItem[], modified: record.modified as readonly ContextContentItem[], removed: record.removed as readonly string[],
    })
  } else throw new TypeError("changeSet.kind is unsupported")
  if (claimedIdentity !== rebuilt.changeSetIdentity) throw new TypeError("changeSet.changeSetIdentity mismatch")
  if (canonicalize(record) !== canonicalize(rebuilt)) throw new TypeError("changeSet derived fields mismatch")
  return rebuilt
}

export function createContextStoreProfile(input: ContextStoreProfileInput): ContextStoreProfile {
  const record = asRecord(input, "contextStoreProfile"); exactKeys(record, STORE_INPUT_KEYS, "contextStoreProfile")
  if (!STORE_MODES.has(record.mode as ContextStoreMode)) throw new TypeError("contextStoreProfile.mode is unsupported")
  const capabilities = canonicalCapabilities(record.capabilities, "contextStoreProfile.capabilities", STORE_CAPS)
  if (record.mode === "read_only" && (capabilities.includes("save_state") || capabilities.includes("delete_state"))) throw new TypeError("read_only context store cannot advertise write capabilities")
  const base: Omit<ContextStoreProfile, "storeProfileIdentity"> = Object.freeze({
    version: KDO_C11_CONTEXT_CONNECTOR_VERSION,
    storeId: boundedString(record.storeId, "contextStoreProfile.storeId"), mode: record.mode as ContextStoreMode, capabilities,
    storeConfigIdentity: identity(record.storeConfigIdentity, "contextStoreProfile.storeConfigIdentity"),
    provenanceIdentity: identity(record.provenanceIdentity, "contextStoreProfile.provenanceIdentity"),
  })
  return Object.freeze({ ...base, storeProfileIdentity: sha256(base) })
}
export function validateContextStoreProfile(value: unknown): ContextStoreProfile {
  const record = asRecord(value, "contextStoreProfile"); exactKeys(record, STORE_PROFILE_KEYS, "contextStoreProfile")
  if (record.version !== KDO_C11_CONTEXT_CONNECTOR_VERSION) throw new TypeError("unsupported context store profile version")
  const claimed = identity(record.storeProfileIdentity, "contextStoreProfile.storeProfileIdentity")
  const rebuilt = createContextStoreProfile({ storeId: record.storeId as string, mode: record.mode as ContextStoreMode, capabilities: record.capabilities as readonly ContextStoreCapability[], storeConfigIdentity: record.storeConfigIdentity as string, provenanceIdentity: record.provenanceIdentity as string })
  if (claimed !== rebuilt.storeProfileIdentity) throw new TypeError("contextStoreProfile.storeProfileIdentity mismatch")
  return rebuilt
}

export function createContextClientProfile(input: ContextClientProfileInput): ContextClientProfile {
  const record = asRecord(input, "contextClientProfile"); exactKeys(record, CLIENT_INPUT_KEYS, "contextClientProfile")
  const base: Omit<ContextClientProfile, "clientProfileIdentity"> = Object.freeze({
    version: KDO_C11_CONTEXT_CONNECTOR_VERSION,
    clientId: boundedString(record.clientId, "contextClientProfile.clientId"),
    capabilities: canonicalCapabilities(record.capabilities, "contextClientProfile.capabilities", CLIENT_CAPS),
    clientConfigIdentity: identity(record.clientConfigIdentity, "contextClientProfile.clientConfigIdentity"),
    provenanceIdentity: identity(record.provenanceIdentity, "contextClientProfile.provenanceIdentity"),
  })
  return Object.freeze({ ...base, clientProfileIdentity: sha256(base) })
}
export function validateContextClientProfile(value: unknown): ContextClientProfile {
  const record = asRecord(value, "contextClientProfile"); exactKeys(record, CLIENT_PROFILE_KEYS, "contextClientProfile")
  if (record.version !== KDO_C11_CONTEXT_CONNECTOR_VERSION) throw new TypeError("unsupported context client profile version")
  const claimed = identity(record.clientProfileIdentity, "contextClientProfile.clientProfileIdentity")
  const rebuilt = createContextClientProfile({ clientId: record.clientId as string, capabilities: record.capabilities as readonly ContextClientCapability[], clientConfigIdentity: record.clientConfigIdentity as string, provenanceIdentity: record.provenanceIdentity as string })
  if (claimed !== rebuilt.clientProfileIdentity) throw new TypeError("contextClientProfile.clientProfileIdentity mismatch")
  return rebuilt
}
