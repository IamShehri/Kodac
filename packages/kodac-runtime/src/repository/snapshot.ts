import { createHash } from "node:crypto"
import type { WorkspaceFileSystem } from "../edit/filesystem.ts"
import type { ExecutionGateway, ExecutionObserver } from "../execution/gateway.ts"
import {
  K3_R2_SNAPSHOT_CONTRACT_VERSION,
  type GitWorkingTreeChange,
  type RepositoryEvidence,
  type RepositoryInventoryEntry,
  type RepositoryEvidenceSource,
  type RepositorySnapshot,
  type SnapshotCompleteness,
} from "./contracts.ts"

const DEFAULT_MAX_ENTRIES = 5_000
const HARD_MAX_ENTRIES = 20_000
const DEFAULT_MAX_DEPTH = 12
const HARD_MAX_DEPTH = 12
const DEFAULT_HASH_BATCH_SIZE = 64
const HARD_MAX_HASH_BATCH_SIZE = 128

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

function boundedInteger(name: string, value: number | undefined, fallback: number, maximum: number): number {
  if (value === undefined) return fallback
  if (!Number.isInteger(value) || value <= 0 || value > maximum) throw new Error(`${name} must be a positive integer <= ${maximum}`)
  return value
}

function portablePath(value: string): string {
  return value.replace(/\\/g, "/")
}

function normalizedWorkspaceIdentityPath(value: string): string {
  let normalized = portablePath(value).replace(/\/+$/, "")
  if (/^[A-Z]:\//.test(normalized)) normalized = `${normalized[0].toLowerCase()}${normalized.slice(1)}`
  return normalized || "/"
}

function canonicalChange(change: GitWorkingTreeChange): object {
  return {
    path: change.path,
    state: change.state,
    indexStatus: change.indexStatus,
    worktreeStatus: change.worktreeStatus,
    sourcePath: change.sourcePath ?? null,
  }
}

function canonicalCompleteness(completeness: SnapshotCompleteness): object {
  return { state: completeness.state, reasons: [...completeness.reasons].sort(), omittedAtLeast: completeness.omittedAtLeast }
}

function changeState(indexStatus: string, worktreeStatus: string): GitWorkingTreeChange["state"] {
  if (indexStatus === "?" && worktreeStatus === "?") return "untracked"
  if (indexStatus === "R" || worktreeStatus === "R") return "renamed"
  if (indexStatus === "A") return "added"
  if (indexStatus === "D" || worktreeStatus === "D") return "deleted"
  return "modified"
}

export function parseGitStatusPorcelainV1Z(raw: string): GitWorkingTreeChange[] {
  if (!raw) return []
  const records = raw.split("\0")
  const changes: GitWorkingTreeChange[] = []
  for (let index = 0; index < records.length; index++) {
    const record = records[index]
    if (!record) continue
    if (record.length < 4 || record[2] !== " ") throw new Error("Malformed git status --porcelain=v1 -z record")
    const indexStatus = record[0]
    const worktreeStatus = record[1]
    const path = portablePath(record.slice(3))
    if (!path) throw new Error("Git status record has an empty path")
    const state = changeState(indexStatus, worktreeStatus)
    if (state === "renamed") {
      const source = records[++index]
      if (!source) throw new Error("Rename status record is missing its source path")
      changes.push({ path, sourcePath: portablePath(source), state, indexStatus, worktreeStatus })
    } else {
      changes.push({ path, state, indexStatus, worktreeStatus })
    }
  }
  return changes.sort((a, b) => a.path.localeCompare(b.path) || (a.sourcePath ?? "").localeCompare(b.sourcePath ?? ""))
}

export interface GitSnapshotObservation<T> {
  value: T
  provenanceRef?: string
}

export interface GitSnapshotSource {
  head(): Promise<GitSnapshotObservation<string>>
  status(): Promise<GitSnapshotObservation<string>>
  hashObjects(paths: string[]): Promise<GitSnapshotObservation<{ path: string; gitObjectId: string }[]>>
}

export function createGatewayGitSnapshotSource(gateway: ExecutionGateway, observer?: ExecutionObserver): GitSnapshotSource {
  return {
    async head() {
      const result = await gateway.gitHead(observer)
      return { value: result.head, provenanceRef: result.receipt.receiptId }
    },
    async status() {
      const result = await gateway.gitStatus(observer)
      return { value: result.status, provenanceRef: result.receipt.receiptId }
    },
    async hashObjects(paths) {
      const result = await gateway.gitHashObjects(paths, observer)
      return { value: result.objects, provenanceRef: result.receipt.receiptId }
    },
  }
}

export interface RepositorySnapshotOptions {
  maxEntries?: number
  maxDepth?: number
  hashBatchSize?: number
}

function architectureCandidate(path: string): boolean {
  const normalized = path.toLowerCase()
  const base = normalized.split("/").at(-1) ?? normalized
  return /^adr-.*\.md$/.test(base) || normalized.startsWith("specs/") || normalized.startsWith("spec/") || normalized.includes("/architecture/") || normalized.startsWith("docs/architecture/")
}

function completenessFor(entries: RepositoryInventoryEntry[], overLimit: boolean, maxDepth: number): SnapshotCompleteness {
  const reasons: string[] = []
  let omittedAtLeast = 0
  if (overLimit) {
    reasons.push("max-entries")
    omittedAtLeast = 1
  }
  if (entries.some((entry) => entry.type === "directory" && entry.path.split("/").length >= maxDepth + 1)) {
    reasons.push("max-depth")
    omittedAtLeast = Math.max(omittedAtLeast, 1)
  }
  if (entries.some((entry) => entry.type === "symlink")) reasons.push("symlink-content-not-hashed")
  return {
    state: reasons.includes("max-entries") || reasons.includes("max-depth") ? "truncated" : reasons.length ? "partial" : "complete",
    reasons: [...new Set(reasons)].sort(),
    omittedAtLeast,
  }
}

export async function captureRepositorySnapshot(
  fs: WorkspaceFileSystem,
  git: GitSnapshotSource,
  options: RepositorySnapshotOptions = {},
): Promise<RepositorySnapshot> {
  const maxEntries = boundedInteger("maxEntries", options.maxEntries, DEFAULT_MAX_ENTRIES, HARD_MAX_ENTRIES)
  const maxDepth = boundedInteger("maxDepth", options.maxDepth, DEFAULT_MAX_DEPTH, HARD_MAX_DEPTH)
  const hashBatchSize = boundedInteger("hashBatchSize", options.hashBatchSize, DEFAULT_HASH_BATCH_SIZE, HARD_MAX_HASH_BATCH_SIZE)

  const preHead = await git.head()
  const preStatus = await git.status()
  if (!/^[0-9a-f]{40,64}$/i.test(preHead.value)) throw new Error("K3-R2 requires a full Git HEAD object id")

  const listed = await fs.list(".", { recursive: true, maxEntries: maxEntries + 1, maxDepth })
  const overLimit = listed.length > maxEntries
  const retained = listed.slice(0, maxEntries).map((entry) => ({ ...entry, path: portablePath(entry.path) }))
  retained.sort((a, b) => a.path.localeCompare(b.path) || a.type.localeCompare(b.type))

  const files = retained.filter((entry) => entry.type === "file")
  const objectIds = new Map<string, { gitObjectId: string; provenanceRef?: string }>()
  for (let start = 0; start < files.length; start += hashBatchSize) {
    const paths = files.slice(start, start + hashBatchSize).map((entry) => entry.path)
    const observed = await git.hashObjects(paths)
    if (observed.value.length !== paths.length) throw new Error("git.hash-object result count does not match requested path count")
    for (let index = 0; index < paths.length; index++) {
      const item = observed.value[index]
      if (portablePath(item.path) !== paths[index]) throw new Error("git.hash-object result order does not match requested path order")
      if (!/^[0-9a-f]+$/i.test(item.gitObjectId)) throw new Error("git.hash-object returned an invalid object id")
      objectIds.set(paths[index], { gitObjectId: item.gitObjectId.toLowerCase(), provenanceRef: observed.provenanceRef })
    }
  }

  const inventory: RepositoryInventoryEntry[] = retained.map((entry) => {
    const object = objectIds.get(entry.path)
    return object ? { ...entry, gitObjectId: object.gitObjectId, contentSourceRef: object.provenanceRef } : entry
  })
  const completeness = completenessFor(inventory, overLimit, maxDepth)
  const workingTree = parseGitStatusPorcelainV1Z(preStatus.value)

  const contentCanonical = JSON.stringify({
    version: K3_R2_SNAPSHOT_CONTRACT_VERSION,
    gitHead: preHead.value.toLowerCase(),
    workingTree: workingTree.map(canonicalChange),
    inventory: inventory.map((entry) => ({ path: entry.path, type: entry.type, gitObjectId: entry.gitObjectId ?? null })),
    completeness: canonicalCompleteness(completeness),
  })
  const contentIdentity = { scheme: "sha256-canonical-repository-content-v1" as const, value: sha256(contentCanonical) }

  const postHead = await git.head()
  const postStatus = await git.status()
  const freshness = preHead.value === postHead.value && preStatus.value === postStatus.value ? "current" as const : "stale" as const
  const repositoryIdentity = {
    scheme: "workspace-root-sha256-v1" as const,
    scope: "workspace-local" as const,
    value: sha256(normalizedWorkspaceIdentityPath(fs.root)),
  }
  const snapshotIdentity = {
    scheme: "sha256-k3-r2-snapshot-v1" as const,
    value: sha256(JSON.stringify({
      version: K3_R2_SNAPSHOT_CONTRACT_VERSION,
      repositoryIdentity,
      contentIdentity,
      freshness,
      completeness: canonicalCompleteness(completeness),
    })),
  }

  const evidence: RepositoryEvidence[] = []
  for (const change of workingTree) {
    const canonical = JSON.stringify(canonicalChange(change))
    evidence.push({
      evidenceId: sha256(`${contentIdentity.value}\0git-derived\0${canonical}`),
      contentIdentity: contentIdentity.value,
      evidenceClass: "git-derived",
      source: { id: "builtin.git.status-porcelain-v1-z.v1", kind: "builtin", provenanceRefs: preStatus.provenanceRef ? [preStatus.provenanceRef] : [] },
      subjectPath: change.path,
      claim: { kind: "working-tree-change", value: change.state, sourcePath: change.sourcePath },
    })
  }
  for (const entry of inventory.filter((entry) => architectureCandidate(entry.path))) {
    evidence.push({
      evidenceId: sha256(`${contentIdentity.value}\0heuristic-inference\0architecture-candidate\0${entry.path}`),
      contentIdentity: contentIdentity.value,
      evidenceClass: "heuristic-inference",
      source: { id: "builtin.inventory-path-heuristic.v1", kind: "builtin", provenanceRefs: [] },
      subjectPath: entry.path,
      claim: { kind: "architecture-candidate", value: "candidate" },
    })
  }
  evidence.sort((a, b) => a.evidenceId.localeCompare(b.evidenceId))

  const sourceRefs = (values: Array<string | undefined>): string[] => [...new Set(values.filter((value): value is string => Boolean(value)))].sort()
  const sources: RepositoryEvidenceSource[] = [
    { id: "builtin.git.head.v1", kind: "builtin", provenanceRefs: sourceRefs([preHead.provenanceRef, postHead.provenanceRef]) },
    { id: "builtin.git.status-porcelain-v1-z.v1", kind: "builtin", provenanceRefs: sourceRefs([preStatus.provenanceRef, postStatus.provenanceRef]) },
    { id: "builtin.git.hash-object-no-filters.v1", kind: "builtin", provenanceRefs: sourceRefs([...objectIds.values()].map((value) => value.provenanceRef)) },
    { id: "builtin.inventory-path-heuristic.v1", kind: "builtin", provenanceRefs: [] },
  ]

  return {
    version: K3_R2_SNAPSHOT_CONTRACT_VERSION,
    repositoryIdentity,
    contentIdentity,
    snapshotIdentity,
    gitHead: preHead.value.toLowerCase(),
    freshness,
    completeness,
    workingTree,
    inventory,
    sources,
    evidence,
  }
}
