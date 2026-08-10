import { createHash } from "node:crypto"
import type { WorkspaceFileSystem } from "../edit/filesystem.ts"
import type { ExecutionIntent, PolicyEngine } from "../trust/policy.ts"
import type { RuntimeTool, ToolContext } from "./registry.ts"

const MAX_READ_BYTES = 256 * 1024
const MAX_LIST_ENTRIES = 1000
const MAX_SEARCH_RESULTS = 200

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

function boundedInteger(name: string, value: number | undefined, fallback: number, maximum: number): number {
  if (value === undefined) return fallback
  if (!Number.isInteger(value) || value <= 0 || value > maximum) {
    throw new Error(`${name} must be a positive integer <= ${maximum}`)
  }
  return value
}

async function authorizeReadOnly(
  capability: string,
  paths: string[],
  input: unknown,
  policy: PolicyEngine,
  context: ToolContext,
): Promise<void> {
  const intent: ExecutionIntent = {
    capability,
    paths,
    inputDigest: sha256(JSON.stringify(input)),
  }
  await context.session.emit("intent.created", { intent })
  const result = await policy.evaluate(intent)
  await context.session.emit("policy.evaluated", { intent, policy: result })
  if (result.decision !== "allow") {
    throw new Error(result.decision === "ask" ? `Approval required: ${result.reason}` : `Execution denied: ${result.reason}`)
  }
}

export interface RepoReadInput {
  path: string
  maxBytes?: number
}

export interface RepoReadOutput {
  path: string
  content: string
  bytes: number
}

export function createRepoReadTool(fs: WorkspaceFileSystem, policy: PolicyEngine): RuntimeTool<RepoReadInput, RepoReadOutput> {
  return {
    name: "repo.read",
    capability: "repo.read",
    async execute(input, context) {
      const maxBytes = boundedInteger("maxBytes", input.maxBytes, 64 * 1024, MAX_READ_BYTES)
      await authorizeReadOnly("repo.read", [input.path], { path: input.path, maxBytes }, policy, context)
      const content = await fs.readTextBounded(input.path, maxBytes)
      return { path: input.path, content, bytes: Buffer.byteLength(content, "utf8") }
    },
  }
}

export interface RepoListInput {
  path?: string
  recursive?: boolean
  maxEntries?: number
  maxDepth?: number
}

export function createRepoListTool(fs: WorkspaceFileSystem, policy: PolicyEngine): RuntimeTool<RepoListInput, { entries: Awaited<ReturnType<WorkspaceFileSystem["list"]>> }> {
  return {
    name: "repo.list",
    capability: "repo.list",
    async execute(input, context) {
      const path = input.path ?? "."
      const maxEntries = boundedInteger("maxEntries", input.maxEntries, 200, MAX_LIST_ENTRIES)
      const maxDepth = boundedInteger("maxDepth", input.maxDepth, 4, 12)
      await authorizeReadOnly("repo.list", [path], { path, recursive: input.recursive ?? true, maxEntries, maxDepth }, policy, context)
      const entries = await fs.list(path, { recursive: input.recursive ?? true, maxEntries, maxDepth })
      return { entries }
    },
  }
}

export interface RepoSearchInput {
  query: string
  path?: string
  caseSensitive?: boolean
  maxResults?: number
}

export function createRepoSearchTool(fs: WorkspaceFileSystem, policy: PolicyEngine): RuntimeTool<RepoSearchInput, { matches: Awaited<ReturnType<WorkspaceFileSystem["searchText"]>> }> {
  return {
    name: "repo.search",
    capability: "repo.search",
    async execute(input, context) {
      if (!input.query) throw new Error("repo.search query must not be empty")
      const path = input.path ?? "."
      const maxResults = boundedInteger("maxResults", input.maxResults, 50, MAX_SEARCH_RESULTS)
      await authorizeReadOnly("repo.search", [path], { queryDigest: sha256(input.query), path, caseSensitive: input.caseSensitive ?? false, maxResults }, policy, context)
      const matches = await fs.searchText(input.query, path, {
        caseSensitive: input.caseSensitive ?? false,
        maxResults,
        maxEntries: MAX_LIST_ENTRIES,
        maxDepth: 12,
        maxFileBytes: MAX_READ_BYTES,
      })
      return { matches }
    },
  }
}
