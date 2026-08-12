import type { RepositoryEvidenceClass, RepositorySnapshot } from "../repository/contracts.ts"
import type { AstGrepStructuralQueryResult } from "../repository-intelligence/contracts.ts"

export const K3_R5_CONTEXT_REQUEST_VERSION = "k3-r5-context-request-v1" as const
export const K3_R5_CONTEXT_BUNDLE_VERSION = "k3-r5-context-bundle-v1" as const
export const K3_R5_SELECTION_STRATEGY_ID = "kodac.context.lexical-evidence-v1" as const

export type ContextRequestKind = "build_context_bundle"
export type ContextTrust = "untrusted-repository-data"
export type ContextSourceKind = "repository-evidence" | "ast-grep-structural-match"
export type ContextCompletenessReason = "item-budget" | "byte-budget" | "source-input-limit" | "unsupported-evidence"
export type ContextRelevanceReason =
  | "exact-target-path"
  | "related-target-path"
  | "exact-symbol-hint"
  | "objective-overlap"
  | "working-tree-change"
  | "architecture-candidate"
  | "stable-fallback"

export interface ContextBundleRequest {
  version: typeof K3_R5_CONTEXT_REQUEST_VERSION
  kind: ContextRequestKind
  taskId: string
  objective: string
  targetPaths?: string[]
  symbolHints?: string[]
  maxItems?: number
  maxUtf8Bytes?: number
}

export interface ContextEngineInput {
  request: ContextBundleRequest
  snapshot: RepositorySnapshot
  structuralResults?: AstGrepStructuralQueryResult[]
}

export interface ContextItemRelevance {
  score: number
  reasons: ContextRelevanceReason[]
}

export interface ContextBundleItem {
  itemId: string
  sourceKind: ContextSourceKind
  sourceIdentity: string
  sourceAdapter: string
  subjectPath: string
  evidenceClass: RepositoryEvidenceClass
  text: string
  contextUtf8Bytes: number
  provenanceRefs: string[]
  trust: ContextTrust
  relevance: ContextItemRelevance
}

export interface ContextBundleBudget {
  maxItems: number
  maxUtf8Bytes: number
  usedItems: number
  usedUtf8Bytes: number
}

export interface ContextBundleCompleteness {
  state: "complete" | "truncated"
  reasons: ContextCompletenessReason[]
  omittedAtLeast: number
}

export interface ContextBundle {
  version: typeof K3_R5_CONTEXT_BUNDLE_VERSION
  bundleIdentity: string
  requestIdentity: string
  repositoryIdentity: string
  snapshotIdentity: string
  contentIdentity: string
  freshness: "current"
  taskId: string
  selectionStrategy: typeof K3_R5_SELECTION_STRATEGY_ID
  budget: ContextBundleBudget
  completeness: ContextBundleCompleteness
  items: ContextBundleItem[]
  provenanceRefs: string[]
}
