import { createHash } from "node:crypto"

import {
  KDO_C11_LIMITS,
  normalizeContextLogicalPath,
  validateContextContentItem,
  validateContextSourceChangeSet,
} from "./contracts.ts"
import type { ContextContentItem, ContextSourceChangeSet } from "./contracts.ts"

/**
 * KDO-C12 is a Kodac-native port of incremental-index orchestration semantics studied from:
 * augmentcode/context-connectors@f7d6472ae626c98fd768f64cdfd6160145eefa77
 * src/core/indexer.ts (blob 61b260621b418f8a03dbef66f1cff5ef8ed4d3ef)
 *
 * Only deterministic transition planning is ported. This module does not import or invoke
 * DirectContext, Augment SDKs, network clients, credentials, stores, filesystems, MCP, or K2.
 */

export const KDO_C12_INDEXER_STATE_MACHINE_VERSION = "kodac-context-indexer-state-machine-v1" as const

export const KDO_C12_AUGMENT_DONOR_PROVENANCE = Object.freeze({
  repository: "augmentcode/context-connectors",
  sourceCommit: "f7d6472ae626c98fd768f64cdfd6160145eefa77",
  sourcePath: "src/core/indexer.ts",
  sourceBlob: "61b260621b418f8a03dbef66f1cff5ef8ed4d3ef",
  intakeMode: "PORT",
} as const)

export const KDO_C12_LIMITS: Readonly<{
  maxStateEntries: number
  maxStateAggregateContentBytes: number
}> = Object.freeze({
  maxStateEntries: 16_384,
  maxStateAggregateContentBytes: 8 * 1024 * 1024 * 1024,
})

export type ContextIndexTransitionKind = "FULL_BUILD_REQUIRED" | "UNCHANGED" | "INCREMENTAL_UPDATE"
export type ContextIndexFullBuildReason =
  | "no_previous_state"
  | "change_set_full_required"
  | "source_profile_changed"
  | "revision_continuity_unproven"

export interface ContextIndexMembershipEntry {
  readonly path: string
  readonly sourceProfileIdentity: string
  readonly sourceRevisionIdentity: string | null
  readonly contentIdentity: string
  readonly itemIdentity: string
  readonly contentBytes: number
  readonly entryIdentity: string
}

export interface ContextIndexMembershipStateInput {
  readonly sourceProfileIdentity: string
  readonly sourceRevisionIdentity?: string
  readonly entries: readonly ContextIndexMembershipEntry[]
}

export interface ContextIndexMembershipState {
  readonly version: typeof KDO_C12_INDEXER_STATE_MACHINE_VERSION
  readonly sourceProfileIdentity: string
  readonly sourceRevisionIdentity: string | null
  readonly entries: readonly ContextIndexMembershipEntry[]
  readonly entryCount: number
  readonly aggregateContentBytes: number
  readonly stateIdentity: string
}

export interface ContextIndexUpsertOperation {
  readonly action: "ADD" | "REPLACE"
  readonly path: string
  readonly entry: ContextIndexMembershipEntry
  readonly operationIdentity: string
}

export interface ContextIndexTransitionPlan {
  readonly version: typeof KDO_C12_INDEXER_STATE_MACHINE_VERSION
  readonly kind: ContextIndexTransitionKind
  readonly sourceProfileIdentity: string
  readonly previousStateIdentity: string | null
  readonly changeSetIdentity: string
  readonly reason: ContextIndexFullBuildReason | null
  readonly removePaths: readonly string[]
  readonly upserts: readonly ContextIndexUpsertOperation[]
  readonly nextState: ContextIndexMembershipState | null
  readonly transitionIdentity: string
}

const SHA256 = /^[0-9a-f]{64}$/
const ENTRY_KEYS = [
  "path", "sourceProfileIdentity", "sourceRevisionIdentity", "contentIdentity", "itemIdentity", "contentBytes", "entryIdentity",
] as const
const STATE_INPUT_KEYS = ["sourceProfileIdentity", "sourceRevisionIdentity", "entries"] as const
const STATE_KEYS = ["version", "sourceProfileIdentity", "sourceRevisionIdentity", "entries", "entryCount", "aggregateContentBytes", "stateIdentity"] as const
const UPSERT_KEYS = ["action", "path", "entry", "operationIdentity"] as const
const PLAN_KEYS = [
  "version", "kind", "sourceProfileIdentity", "previousStateIdentity", "changeSetIdentity", "reason",
  "removePaths", "upserts", "nextState", "transitionIdentity",
] as const
const TRANSITION_KINDS = new Set<ContextIndexTransitionKind>(["FULL_BUILD_REQUIRED", "UNCHANGED", "INCREMENTAL_UPDATE"])
const FULL_REASONS = new Set<ContextIndexFullBuildReason>([
  "no_previous_state", "change_set_full_required", "source_profile_changed", "revision_continuity_unproven",
])

function compareStrings(left: string, right: string): number { return left < right ? -1 : left > right ? 1 : 0 }
function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort(compareStrings).map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`).join(",")}}`
}
function sha256(value: unknown): string { return createHash("sha256").update(canonicalize(value), "utf8").digest("hex") }
function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`)
  return value as Record<string, unknown>
}
function exactKeys(record: Record<string, unknown>, allowed: readonly string[], label: string): void {
  const allowedSet = new Set(allowed)
  for (const key of Object.keys(record)) if (!allowedSet.has(key)) throw new TypeError(`${label} contains unknown field: ${key}`)
}
function identity(value: unknown, label: string): string {
  if (typeof value !== "string" || !SHA256.test(value)) throw new TypeError(`${label} must be a lowercase SHA-256 identity`)
  return value
}
function nullableIdentity(value: unknown, label: string): string | null {
  return value === null ? null : identity(value, label)
}
function optionalIdentity(value: unknown, label: string): string | undefined {
  return value === undefined ? undefined : identity(value, label)
}
function safeContentBytes(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || typeof value !== "number" || value < 0 || value > KDO_C11_LIMITS.maxContentBytes) {
    throw new RangeError(`${label} must be a bounded non-negative safe integer`)
  }
  return value
}

function entryPreimage(entry: Omit<ContextIndexMembershipEntry, "entryIdentity">): Record<string, unknown> {
  return {
    path: entry.path,
    sourceProfileIdentity: entry.sourceProfileIdentity,
    sourceRevisionIdentity: entry.sourceRevisionIdentity,
    contentIdentity: entry.contentIdentity,
    itemIdentity: entry.itemIdentity,
    contentBytes: entry.contentBytes,
  }
}

function buildMembershipEntry(fields: Omit<ContextIndexMembershipEntry, "entryIdentity">): ContextIndexMembershipEntry {
  const base = Object.freeze({
    path: normalizeContextLogicalPath(fields.path),
    sourceProfileIdentity: identity(fields.sourceProfileIdentity, "membershipEntry.sourceProfileIdentity"),
    sourceRevisionIdentity: nullableIdentity(fields.sourceRevisionIdentity, "membershipEntry.sourceRevisionIdentity"),
    contentIdentity: identity(fields.contentIdentity, "membershipEntry.contentIdentity"),
    itemIdentity: identity(fields.itemIdentity, "membershipEntry.itemIdentity"),
    contentBytes: safeContentBytes(fields.contentBytes, "membershipEntry.contentBytes"),
  })
  return Object.freeze({ ...base, entryIdentity: sha256(entryPreimage(base)) })
}

export function createContextIndexMembershipEntry(itemValue: ContextContentItem): ContextIndexMembershipEntry {
  const item = validateContextContentItem(itemValue)
  return buildMembershipEntry({
    path: item.path,
    sourceProfileIdentity: item.sourceProfileIdentity,
    sourceRevisionIdentity: item.sourceRevisionIdentity ?? null,
    contentIdentity: item.contentIdentity,
    itemIdentity: item.itemIdentity,
    contentBytes: item.contentBytes,
  })
}

export function validateContextIndexMembershipEntry(value: unknown): ContextIndexMembershipEntry {
  const record = asRecord(value, "membershipEntry")
  exactKeys(record, ENTRY_KEYS, "membershipEntry")
  const claimed = identity(record.entryIdentity, "membershipEntry.entryIdentity")
  const rebuilt = buildMembershipEntry({
    path: record.path as string,
    sourceProfileIdentity: record.sourceProfileIdentity as string,
    sourceRevisionIdentity: nullableIdentity(record.sourceRevisionIdentity, "membershipEntry.sourceRevisionIdentity"),
    contentIdentity: record.contentIdentity as string,
    itemIdentity: record.itemIdentity as string,
    contentBytes: record.contentBytes as number,
  })
  if (claimed !== rebuilt.entryIdentity) throw new TypeError("membershipEntry.entryIdentity mismatch")
  return rebuilt
}

function statePreimage(state: Omit<ContextIndexMembershipState, "stateIdentity">): Record<string, unknown> {
  return {
    version: state.version,
    sourceProfileIdentity: state.sourceProfileIdentity,
    sourceRevisionIdentity: state.sourceRevisionIdentity,
    entries: state.entries,
    entryCount: state.entryCount,
    aggregateContentBytes: state.aggregateContentBytes,
  }
}

export function createContextIndexMembershipState(input: ContextIndexMembershipStateInput): ContextIndexMembershipState {
  const record = asRecord(input, "membershipState")
  exactKeys(record, STATE_INPUT_KEYS, "membershipState")
  const sourceProfileIdentity = identity(record.sourceProfileIdentity, "membershipState.sourceProfileIdentity")
  const sourceRevisionIdentity = optionalIdentity(record.sourceRevisionIdentity, "membershipState.sourceRevisionIdentity") ?? null
  if (!Array.isArray(record.entries)) throw new TypeError("membershipState.entries must be an array")
  if (record.entries.length > KDO_C12_LIMITS.maxStateEntries) throw new RangeError("membershipState exceeds entry-count bound")
  const entries = record.entries.map(validateContextIndexMembershipEntry).sort((a, b) => compareStrings(a.path, b.path))
  const seen = new Set<string>()
  for (const entry of entries) {
    if (entry.sourceProfileIdentity !== sourceProfileIdentity) throw new TypeError("membershipState entry sourceProfileIdentity mismatch")
    if (seen.has(entry.path)) throw new TypeError(`membershipState contains duplicate path: ${entry.path}`)
    seen.add(entry.path)
  }
  const aggregateContentBytes = entries.reduce((sum, entry) => sum + entry.contentBytes, 0)
  if (!Number.isSafeInteger(aggregateContentBytes) || aggregateContentBytes > KDO_C12_LIMITS.maxStateAggregateContentBytes) {
    throw new RangeError("membershipState exceeds aggregate-content byte bound")
  }
  const base: Omit<ContextIndexMembershipState, "stateIdentity"> = Object.freeze({
    version: KDO_C12_INDEXER_STATE_MACHINE_VERSION,
    sourceProfileIdentity,
    sourceRevisionIdentity,
    entries: Object.freeze(entries),
    entryCount: entries.length,
    aggregateContentBytes,
  })
  return Object.freeze({ ...base, stateIdentity: sha256(statePreimage(base)) })
}

export function createContextIndexMembershipStateFromItems(
  sourceProfileIdentityValue: string,
  sourceRevisionIdentityValue: string | undefined,
  itemsValue: readonly ContextContentItem[],
): ContextIndexMembershipState {
  const sourceProfileIdentity = identity(sourceProfileIdentityValue, "membershipState.sourceProfileIdentity")
  const sourceRevisionIdentity = optionalIdentity(sourceRevisionIdentityValue, "membershipState.sourceRevisionIdentity")
  const entries = itemsValue.map((itemValue) => {
    const item = validateContextContentItem(itemValue)
    if (item.sourceProfileIdentity !== sourceProfileIdentity) throw new TypeError("membershipState item sourceProfileIdentity mismatch")
    if (sourceRevisionIdentity !== undefined && item.sourceRevisionIdentity !== sourceRevisionIdentity) {
      throw new TypeError("membershipState item sourceRevisionIdentity mismatch")
    }
    return createContextIndexMembershipEntry(item)
  })
  return createContextIndexMembershipState({
    sourceProfileIdentity,
    ...(sourceRevisionIdentity === undefined ? {} : { sourceRevisionIdentity }),
    entries,
  })
}

export function validateContextIndexMembershipState(value: unknown): ContextIndexMembershipState {
  const record = asRecord(value, "membershipState")
  exactKeys(record, STATE_KEYS, "membershipState")
  if (record.version !== KDO_C12_INDEXER_STATE_MACHINE_VERSION) throw new TypeError("unsupported membershipState version")
  const claimed = identity(record.stateIdentity, "membershipState.stateIdentity")
  const rebuilt = createContextIndexMembershipState({
    sourceProfileIdentity: record.sourceProfileIdentity as string,
    ...(record.sourceRevisionIdentity === null ? {} : { sourceRevisionIdentity: identity(record.sourceRevisionIdentity, "membershipState.sourceRevisionIdentity") }),
    entries: record.entries as readonly ContextIndexMembershipEntry[],
  })
  if (record.entryCount !== rebuilt.entryCount) throw new TypeError("membershipState.entryCount mismatch")
  if (record.aggregateContentBytes !== rebuilt.aggregateContentBytes) throw new TypeError("membershipState.aggregateContentBytes mismatch")
  if (claimed !== rebuilt.stateIdentity) throw new TypeError("membershipState.stateIdentity mismatch")
  if (canonicalize(record) !== canonicalize(rebuilt)) throw new TypeError("membershipState derived fields mismatch")
  return rebuilt
}

function operationPreimage(operation: Omit<ContextIndexUpsertOperation, "operationIdentity">): Record<string, unknown> {
  return { action: operation.action, path: operation.path, entry: operation.entry }
}
function createUpsertOperation(action: "ADD" | "REPLACE", entryValue: ContextIndexMembershipEntry): ContextIndexUpsertOperation {
  const entry = validateContextIndexMembershipEntry(entryValue)
  const base = Object.freeze({ action, path: entry.path, entry })
  return Object.freeze({ ...base, operationIdentity: sha256(operationPreimage(base)) })
}
function validateUpsertOperation(value: unknown): ContextIndexUpsertOperation {
  const record = asRecord(value, "upsertOperation")
  exactKeys(record, UPSERT_KEYS, "upsertOperation")
  if (record.action !== "ADD" && record.action !== "REPLACE") throw new TypeError("upsertOperation.action is unsupported")
  const entry = validateContextIndexMembershipEntry(record.entry)
  const path = normalizeContextLogicalPath(record.path)
  if (path !== entry.path) throw new TypeError("upsertOperation.path mismatch")
  const rebuilt = createUpsertOperation(record.action, entry)
  if (identity(record.operationIdentity, "upsertOperation.operationIdentity") !== rebuilt.operationIdentity) {
    throw new TypeError("upsertOperation.operationIdentity mismatch")
  }
  return rebuilt
}

function transitionPreimage(plan: Omit<ContextIndexTransitionPlan, "transitionIdentity">): Record<string, unknown> {
  return {
    version: plan.version,
    kind: plan.kind,
    sourceProfileIdentity: plan.sourceProfileIdentity,
    previousStateIdentity: plan.previousStateIdentity,
    changeSetIdentity: plan.changeSetIdentity,
    reason: plan.reason,
    removePaths: plan.removePaths,
    upserts: plan.upserts,
    nextState: plan.nextState,
  }
}

function buildPlan(fields: Omit<ContextIndexTransitionPlan, "version" | "transitionIdentity">): ContextIndexTransitionPlan {
  const base: Omit<ContextIndexTransitionPlan, "transitionIdentity"> = Object.freeze({
    version: KDO_C12_INDEXER_STATE_MACHINE_VERSION,
    ...fields,
  })
  return Object.freeze({ ...base, transitionIdentity: sha256(transitionPreimage(base)) })
}

function fullBuildPlan(
  previousState: ContextIndexMembershipState | null,
  changeSet: ContextSourceChangeSet,
  reason: ContextIndexFullBuildReason,
): ContextIndexTransitionPlan {
  return buildPlan({
    kind: "FULL_BUILD_REQUIRED",
    sourceProfileIdentity: changeSet.sourceProfileIdentity,
    previousStateIdentity: previousState?.stateIdentity ?? null,
    changeSetIdentity: changeSet.changeSetIdentity,
    reason,
    removePaths: Object.freeze([]),
    upserts: Object.freeze([]),
    nextState: null,
  })
}

function hasRevisionContinuity(previousState: ContextIndexMembershipState, changeSet: ContextSourceChangeSet): boolean {
  const previousStateRevision = previousState.sourceRevisionIdentity
  const claimedPreviousRevision = changeSet.previousRevisionIdentity ?? null
  if (previousStateRevision === null && claimedPreviousRevision === null) return true
  return previousStateRevision !== null && previousStateRevision === claimedPreviousRevision
}

function assertChangedItemRevision(item: ContextContentItem, changeSet: ContextSourceChangeSet): void {
  const currentRevision = changeSet.currentRevisionIdentity
  if (currentRevision === undefined) {
    if (item.sourceRevisionIdentity !== undefined) throw new TypeError("change item sourceRevisionIdentity is not bound by changeSet.currentRevisionIdentity")
    return
  }
  if (item.sourceRevisionIdentity !== currentRevision) throw new TypeError("change item sourceRevisionIdentity mismatch")
}

export function planContextIndexTransition(
  previousStateValue: ContextIndexMembershipState | null,
  changeSetValue: ContextSourceChangeSet,
): ContextIndexTransitionPlan {
  const changeSet = validateContextSourceChangeSet(changeSetValue)
  const previousState = previousStateValue === null ? null : validateContextIndexMembershipState(previousStateValue)

  if (previousState === null) return fullBuildPlan(null, changeSet, "no_previous_state")
  if (previousState.sourceProfileIdentity !== changeSet.sourceProfileIdentity) return fullBuildPlan(previousState, changeSet, "source_profile_changed")
  if (changeSet.kind === "FULL_REQUIRED") return fullBuildPlan(previousState, changeSet, "change_set_full_required")
  if (!hasRevisionContinuity(previousState, changeSet)) return fullBuildPlan(previousState, changeSet, "revision_continuity_unproven")

  const nextRevision = changeSet.currentRevisionIdentity ?? previousState.sourceRevisionIdentity ?? undefined

  if (changeSet.kind === "UNCHANGED") {
    const nextState = createContextIndexMembershipState({
      sourceProfileIdentity: previousState.sourceProfileIdentity,
      ...(nextRevision === undefined ? {} : { sourceRevisionIdentity: nextRevision }),
      entries: previousState.entries,
    })
    return buildPlan({
      kind: "UNCHANGED",
      sourceProfileIdentity: changeSet.sourceProfileIdentity,
      previousStateIdentity: previousState.stateIdentity,
      changeSetIdentity: changeSet.changeSetIdentity,
      reason: null,
      removePaths: Object.freeze([]),
      upserts: Object.freeze([]),
      nextState,
    })
  }

  const membership = new Map(previousState.entries.map((entry) => [entry.path, entry] as const))
  const removePaths = [...changeSet.removed].sort(compareStrings)
  for (const path of removePaths) {
    if (!membership.has(path)) throw new TypeError(`incremental remove path is absent from previous state: ${path}`)
    membership.delete(path)
  }

  const upserts: ContextIndexUpsertOperation[] = []
  for (const itemValue of changeSet.modified) {
    const item = validateContextContentItem(itemValue)
    assertChangedItemRevision(item, changeSet)
    if (!membership.has(item.path)) throw new TypeError(`incremental modified path is absent from previous state: ${item.path}`)
    const entry = createContextIndexMembershipEntry(item)
    membership.set(item.path, entry)
    upserts.push(createUpsertOperation("REPLACE", entry))
  }
  for (const itemValue of changeSet.added) {
    const item = validateContextContentItem(itemValue)
    assertChangedItemRevision(item, changeSet)
    if (membership.has(item.path)) throw new TypeError(`incremental added path already exists in previous state: ${item.path}`)
    const entry = createContextIndexMembershipEntry(item)
    membership.set(item.path, entry)
    upserts.push(createUpsertOperation("ADD", entry))
  }
  upserts.sort((a, b) => compareStrings(a.path, b.path) || compareStrings(a.action, b.action))

  const nextState = createContextIndexMembershipState({
    sourceProfileIdentity: previousState.sourceProfileIdentity,
    ...(nextRevision === undefined ? {} : { sourceRevisionIdentity: nextRevision }),
    entries: [...membership.values()],
  })

  return buildPlan({
    kind: "INCREMENTAL_UPDATE",
    sourceProfileIdentity: changeSet.sourceProfileIdentity,
    previousStateIdentity: previousState.stateIdentity,
    changeSetIdentity: changeSet.changeSetIdentity,
    reason: null,
    removePaths: Object.freeze(removePaths),
    upserts: Object.freeze(upserts),
    nextState,
  })
}

export function validateContextIndexTransitionPlan(value: unknown): ContextIndexTransitionPlan {
  const record = asRecord(value, "transitionPlan")
  exactKeys(record, PLAN_KEYS, "transitionPlan")
  if (record.version !== KDO_C12_INDEXER_STATE_MACHINE_VERSION) throw new TypeError("unsupported transitionPlan version")
  if (!TRANSITION_KINDS.has(record.kind as ContextIndexTransitionKind)) throw new TypeError("transitionPlan.kind is unsupported")
  const kind = record.kind as ContextIndexTransitionKind
  const sourceProfileIdentity = identity(record.sourceProfileIdentity, "transitionPlan.sourceProfileIdentity")
  const previousStateIdentity = nullableIdentity(record.previousStateIdentity, "transitionPlan.previousStateIdentity")
  const changeSetIdentity = identity(record.changeSetIdentity, "transitionPlan.changeSetIdentity")
  const reason = record.reason === null ? null : record.reason as ContextIndexFullBuildReason
  if (reason !== null && !FULL_REASONS.has(reason)) throw new TypeError("transitionPlan.reason is unsupported")
  if (!Array.isArray(record.removePaths)) throw new TypeError("transitionPlan.removePaths must be an array")
  const removePaths = record.removePaths.map(normalizeContextLogicalPath).sort(compareStrings)
  if (new Set(removePaths).size !== removePaths.length) throw new TypeError("transitionPlan.removePaths contains duplicates")
  if (!Array.isArray(record.upserts)) throw new TypeError("transitionPlan.upserts must be an array")
  const upserts = record.upserts.map(validateUpsertOperation).sort((a, b) => compareStrings(a.path, b.path) || compareStrings(a.action, b.action))
  if (new Set(upserts.map((operation) => operation.path)).size !== upserts.length) throw new TypeError("transitionPlan.upserts contains duplicate paths")
  const nextState = record.nextState === null ? null : validateContextIndexMembershipState(record.nextState)

  if (kind === "FULL_BUILD_REQUIRED") {
    if (reason === null || removePaths.length !== 0 || upserts.length !== 0 || nextState !== null) throw new TypeError("FULL_BUILD_REQUIRED transitionPlan shape is invalid")
  } else if (kind === "UNCHANGED") {
    if (reason !== null || removePaths.length !== 0 || upserts.length !== 0 || nextState === null) throw new TypeError("UNCHANGED transitionPlan shape is invalid")
  } else {
    if (reason !== null || nextState === null || removePaths.length + upserts.length === 0) throw new TypeError("INCREMENTAL_UPDATE transitionPlan shape is invalid")
  }

  const rebuilt = buildPlan({
    kind,
    sourceProfileIdentity,
    previousStateIdentity,
    changeSetIdentity,
    reason,
    removePaths: Object.freeze(removePaths),
    upserts: Object.freeze(upserts),
    nextState,
  })
  if (identity(record.transitionIdentity, "transitionPlan.transitionIdentity") !== rebuilt.transitionIdentity) {
    throw new TypeError("transitionPlan.transitionIdentity mismatch")
  }
  if (canonicalize(record) !== canonicalize(rebuilt)) throw new TypeError("transitionPlan derived fields mismatch")
  return rebuilt
}

export function verifyContextIndexTransitionPlan(
  previousState: ContextIndexMembershipState | null,
  changeSet: ContextSourceChangeSet,
  planValue: unknown,
): ContextIndexTransitionPlan {
  const plan = validateContextIndexTransitionPlan(planValue)
  const expected = planContextIndexTransition(previousState, changeSet)
  if (canonicalize(plan) !== canonicalize(expected)) throw new TypeError("transitionPlan does not match canonical transition")
  return plan
}
