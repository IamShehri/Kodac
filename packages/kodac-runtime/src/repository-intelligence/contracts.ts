import type { RepositorySnapshot } from "../repository/contracts.ts"

export const K3_R4_AST_GREP_ADAPTER_ID = "kodac.ast-grep-cli.structural.v1" as const
export const K3_R4_AST_GREP_QUERY_CONTRACT_VERSION = "k3-r4-ast-grep-query-v1" as const

export type AstGrepStructuralQueryKind = "find_symbol_candidates"

export interface AstGrepStructuralQueryRequest {
  version: typeof K3_R4_AST_GREP_QUERY_CONTRACT_VERSION
  kind: AstGrepStructuralQueryKind
  symbol: string
  scope?: string
  snapshot: RepositorySnapshot
  maxResults?: number
  timeoutMs?: number
  maxOutputBytes?: number
  signal?: AbortSignal
}

export interface AstGrepStructuralMatch {
  path: string
  line: number
  column: number
  text: string
  evidenceClass: "parser-derived"
}

export interface AstGrepQueryCompleteness {
  state: "complete" | "truncated"
  reasons: Array<"candidate-file-limit" | "candidate-argument-byte-limit" | "max-results">
  omittedAtLeast: number
}

export interface AstGrepAdapterSourceIdentity {
  adapterId: typeof K3_R4_AST_GREP_ADAPTER_ID
  candidate: "ast-grep"
  upstreamRepository: "ast-grep/ast-grep"
  upstreamTag: "0.45.1"
  upstreamCommit: "dc3d655b9edf3b2bc266d9bc46eb60f18e66b818"
  measuredVersion: "ast-grep 0.45.1"
  platformQualification: "linux-x64-k3-r3"
  executableSha256: "6a66162e0a2447af4b7524ee04195239eb1911d07f4868f918909e7d4f453eea"
  kodacConfigSha256: "ca3d163bab055381827226140568f3bef7eaac187cebd76878e0b63e9e442356"
  semanticStrength: "structural-only-not-compiler-resolved"
  provenanceRefs: string[]
}

export interface AstGrepStructuralQueryResult {
  version: typeof K3_R4_AST_GREP_QUERY_CONTRACT_VERSION
  query: {
    kind: AstGrepStructuralQueryKind
    symbol: string
    scope: string
  }
  repositoryIdentity: string
  snapshotIdentity: string
  contentIdentity: string
  freshness: "current"
  candidateFiles: {
    included: number
    omitted: number
    identity: string
  }
  completeness: AstGrepQueryCompleteness
  matches: AstGrepStructuralMatch[]
  source: AstGrepAdapterSourceIdentity
  deterministic: true
  resultIdentity: string
}
