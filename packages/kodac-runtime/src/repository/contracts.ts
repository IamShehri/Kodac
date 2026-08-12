export const K3_R2_SNAPSHOT_CONTRACT_VERSION = "k3-r2-snapshot-v1" as const

export function isFullGitObjectId(value: string): boolean {
  return /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i.test(value)
}

export interface RepositoryIdentity {
  scheme: "workspace-root-sha256-v1"
  scope: "workspace-local"
  value: string
}

export interface RepositoryContentIdentity {
  scheme: "sha256-canonical-repository-content-v1"
  value: string
}

export interface RepositorySnapshotIdentity {
  scheme: "sha256-k3-r2-snapshot-v1"
  value: string
}

export type SnapshotFreshness = "current" | "stale"
export type SnapshotCompletenessState = "complete" | "partial" | "truncated"

export interface SnapshotCompleteness {
  state: SnapshotCompletenessState
  reasons: string[]
  omittedAtLeast: number
}

export interface RepositoryInventoryEntry {
  path: string
  type: "file" | "directory" | "symlink"
  gitObjectId?: string
  contentSourceRef?: string
}

export type GitWorkingTreeState = "modified" | "added" | "deleted" | "untracked" | "renamed"

export interface GitWorkingTreeChange {
  path: string
  state: GitWorkingTreeState
  indexStatus: string
  worktreeStatus: string
  sourcePath?: string
}

export type RepositoryEvidenceClass =
  | "precise-static"
  | "parser-derived"
  | "git-derived"
  | "heuristic-inference"
  | "model-hypothesis"

export interface RepositoryEvidenceSource {
  id: string
  kind: "builtin"
  provenanceRefs: string[]
}

export interface RepositoryEvidence {
  evidenceId: string
  contentIdentity: string
  evidenceClass: RepositoryEvidenceClass
  source: RepositoryEvidenceSource
  subjectPath: string
  claim: {
    kind: "working-tree-change" | "architecture-candidate"
    value: string
    sourcePath?: string
  }
}

export interface RepositorySnapshot {
  version: typeof K3_R2_SNAPSHOT_CONTRACT_VERSION
  repositoryIdentity: RepositoryIdentity
  contentIdentity: RepositoryContentIdentity
  snapshotIdentity: RepositorySnapshotIdentity
  gitHead: string
  freshness: SnapshotFreshness
  completeness: SnapshotCompleteness
  workingTree: GitWorkingTreeChange[]
  inventory: RepositoryInventoryEntry[]
  sources: RepositoryEvidenceSource[]
  evidence: RepositoryEvidence[]
}
