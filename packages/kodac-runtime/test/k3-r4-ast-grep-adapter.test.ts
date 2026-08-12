import assert from "node:assert/strict"
import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

import { NodeWorkspaceFileSystem } from "../src/edit/filesystem.ts"
import { ExecutionGateway } from "../src/execution/gateway.ts"
import {
  K3_R2_SNAPSHOT_CONTRACT_VERSION,
  type RepositorySnapshot,
} from "../src/repository/contracts.ts"
import {
  captureRepositorySnapshot,
  createGatewayGitSnapshotSource,
} from "../src/repository/snapshot.ts"
import {
  AstGrepCliRepositoryAdapter,
  assertK3R4AstGrepPlatform,
  parseAstGrepCompactOutput,
  selectK3R4TypeScriptCandidates,
  validateK3R4Scope,
  validateK3R4Symbol,
} from "../src/repository-intelligence/ast-grep-cli.ts"
import { K3_R4_AST_GREP_QUERY_CONTRACT_VERSION } from "../src/repository-intelligence/contracts.ts"
import { repositoryIntelligenceReadPolicy } from "../src/trust/policy.ts"

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url))
const fixtureScope = "packages/kodac-runtime/test/fixtures/k3-r1"

function fixtureSnapshot(input: {
  freshness?: "current" | "stale"
  completeness?: "complete" | "partial" | "truncated"
  inventory?: Array<{ path: string; type: "file" | "directory" | "symlink" }>
} = {}): RepositorySnapshot {
  return {
    version: K3_R2_SNAPSHOT_CONTRACT_VERSION,
    repositoryIdentity: { scheme: "workspace-root-sha256-v1", scope: "workspace-local", value: "a".repeat(64) },
    contentIdentity: { scheme: "sha256-canonical-repository-content-v1", value: "b".repeat(64) },
    snapshotIdentity: { scheme: "sha256-k3-r2-snapshot-v1", value: "c".repeat(64) },
    gitHead: "d".repeat(40),
    freshness: input.freshness ?? "current",
    completeness: {
      state: input.completeness ?? "complete",
      reasons: input.completeness && input.completeness !== "complete" ? ["fixture"] : [],
      omittedAtLeast: input.completeness && input.completeness !== "complete" ? 1 : 0,
    },
    workingTree: [],
    inventory: input.inventory ?? [],
    sources: [],
    evidence: [],
  }
}

test("K3-R4 exposes only plain TypeScript identifiers, not ast-grep pattern syntax", () => {
  assert.equal(validateK3R4Symbol("Widget_$1"), "Widget_$1")
  assert.throws(() => validateK3R4Symbol("class Widget { $$$BODY }"), /pattern syntax is not exposed/)
  assert.throws(() => validateK3R4Symbol("a.b"), /pattern syntax is not exposed/)
  assert.throws(() => validateK3R4Symbol(""), /non-empty/)
})

test("K3-R4 scope is canonical and workspace-relative", () => {
  assert.equal(validateK3R4Scope(undefined), ".")
  assert.equal(validateK3R4Scope("src/features"), "src/features")
  assert.throws(() => validateK3R4Scope("../escape"), /must not contain/)
  assert.throws(() => validateK3R4Scope("src\\escape"), /workspace-relative/)
  assert.throws(() => validateK3R4Scope("/absolute"), /workspace-relative/)
})

test("candidate selection is deterministic, TypeScript-only, and explicitly truncated", () => {
  const inventory = Array.from({ length: 520 }, (_, index) => ({
    path: `src/${String(index).padStart(4, "0")}.ts`,
    type: "file" as const,
  }))
  inventory.push({ path: "src/not-typescript.js", type: "file" })
  const selected = selectK3R4TypeScriptCandidates(fixtureSnapshot({ inventory }), "src")
  assert.equal(selected.paths.length, 512)
  assert.equal(selected.omitted, 8)
  assert.deepEqual(selected.reasons, ["candidate-file-limit"])
  assert.match(selected.identity, /^[0-9a-f]{64}$/)
  assert.equal(selected.paths[0], "src/0000.ts")
  assert.equal(selected.paths.at(-1), "src/0511.ts")
})

test("candidate selection makes argument-byte truncation observable", () => {
  const inventory = Array.from({ length: 500 }, (_, index) => ({
    path: `src/${"x".repeat(150)}-${String(index).padStart(4, "0")}.ts`,
    type: "file" as const,
  }))
  const selected = selectK3R4TypeScriptCandidates(fixtureSnapshot({ inventory }), "src")
  assert.ok(selected.paths.length < 500)
  assert.ok(selected.omitted > 0)
  assert.ok(selected.reasons.includes("candidate-argument-byte-limit"))
})

test("ast-grep compact output parser fails closed on malformed, rewrite, and reversed-range output", () => {
  assert.throws(() => parseAstGrepCompactOutput("not-json"), /malformed JSON/)
  assert.throws(
    () => parseAstGrepCompactOutput(JSON.stringify([{ file: "a.ts", text: "a", replacement: "b", range: { start: { line: 0, column: 0 }, end: { line: 0, column: 1 } } }])),
    /rewrite output/,
  )
  assert.throws(
    () => parseAstGrepCompactOutput(JSON.stringify([{ file: "a.ts", text: "a", range: { start: { line: 2, column: 3 }, end: { line: 1, column: 1 } } }])),
    /reversed range/,
  )
  assert.deepEqual(
    parseAstGrepCompactOutput(JSON.stringify([{ file: "a.ts", text: "a", range: { start: { line: 0, column: 2 }, end: { line: 0, column: 3 } } }])),
    [{ file: "a.ts", text: "a", range: { start: { line: 0, column: 2 }, end: { line: 0, column: 3 } } }],
  )
})

test("repository-intelligence policy allows only the exact K3-R4 read capabilities", async () => {
  const policy = repositoryIntelligenceReadPolicy()
  assert.equal((await policy.evaluate({ capability: "k3.ast-grep.identity", paths: [], inputDigest: "x" })).decision, "allow")
  assert.equal((await policy.evaluate({ capability: "k3.ast-grep.structural-query", paths: ["a.ts"], inputDigest: "x" })).decision, "allow")
  assert.equal((await policy.evaluate({ capability: "k3.ast-grep.rewrite", paths: ["a.ts"], inputDigest: "x" })).decision, "deny")
  assert.equal((await policy.evaluate({ capability: "k3.ast-grep.download", paths: [], inputDigest: "x" })).decision, "deny")
})

test("platform qualification fails closed outside Linux x64", () => {
  assert.doesNotThrow(() => assertK3R4AstGrepPlatform("linux", "x64"))
  assert.throws(() => assertK3R4AstGrepPlatform("linux", "arm64"), /qualified only/)
  assert.throws(() => assertK3R4AstGrepPlatform("darwin", "x64"), /qualified only/)
  assert.throws(() => assertK3R4AstGrepPlatform("win32", "x64"), /qualified only/)
})

test("adapter rejects a stale snapshot before external candidate execution", { skip: process.platform !== "linux" || process.arch !== "x64" }, async () => {
  const dir = await mkdtemp(join(tmpdir(), "kodac-k3-r4-stale-"))
  try {
    const executable = join(dir, "ast-grep")
    await writeFile(executable, "not the authorized binary", "utf8")
    await chmod(executable, 0o755)
    const fs = new NodeWorkspaceFileSystem(dir)
    const gateway = new ExecutionGateway(fs, repositoryIntelligenceReadPolicy())
    const adapter = new AstGrepCliRepositoryAdapter({ fs, gateway, executablePath: executable })
    await assert.rejects(
      () => adapter.findSymbolCandidates({
        version: K3_R4_AST_GREP_QUERY_CONTRACT_VERSION,
        kind: "find_symbol_candidates",
        symbol: "add",
        snapshot: fixtureSnapshot({ freshness: "stale" }),
      }),
      /refuses a stale repository snapshot/,
    )
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test("adapter rejects an executable with the wrong digest before invoking it", { skip: process.platform !== "linux" || process.arch !== "x64" }, async () => {
  const dir = await mkdtemp(join(tmpdir(), "kodac-k3-r4-digest-"))
  try {
    const executable = join(dir, "ast-grep")
    await writeFile(executable, "not the authorized binary", "utf8")
    await chmod(executable, 0o755)
    const fs = new NodeWorkspaceFileSystem(dir)
    const gateway = new ExecutionGateway(fs, repositoryIntelligenceReadPolicy())
    const adapter = new AstGrepCliRepositoryAdapter({ fs, gateway, executablePath: executable })
    await assert.rejects(
      () => adapter.findSymbolCandidates({
        version: K3_R4_AST_GREP_QUERY_CONTRACT_VERSION,
        kind: "find_symbol_candidates",
        symbol: "add",
        snapshot: fixtureSnapshot(),
      }),
      /executable digest mismatch/,
    )
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test("pre-aborted queries fail before external execution", async () => {
  const controller = new AbortController()
  controller.abort(new Error("fixture abort"))
  const fs = new NodeWorkspaceFileSystem(repoRoot)
  const gateway = new ExecutionGateway(fs, repositoryIntelligenceReadPolicy())
  const adapter = new AstGrepCliRepositoryAdapter({ fs, gateway, executablePath: "/does/not/matter" })
  await assert.rejects(
    () => adapter.findSymbolCandidates({
      version: K3_R4_AST_GREP_QUERY_CONTRACT_VERSION,
      kind: "find_symbol_candidates",
      symbol: "add",
      snapshot: fixtureSnapshot(),
      signal: controller.signal,
    }),
    /fixture abort/,
  )
})

const integrationBinary = process.env.K3_R4_AST_GREP_BIN
const integrationEnabled = process.platform === "linux" && process.arch === "x64" && Boolean(integrationBinary)

test("exact Linux ast-grep identity produces deterministic K3-R1 structural candidates without mutating snapshot identity", { skip: !integrationEnabled }, async () => {
  const fs = new NodeWorkspaceFileSystem(repoRoot)
  const gateway = new ExecutionGateway(fs, repositoryIntelligenceReadPolicy())
  const snapshot = await captureRepositorySnapshot(fs, createGatewayGitSnapshotSource(gateway))
  assert.equal(snapshot.freshness, "current")
  assert.equal(snapshot.completeness.state, "complete")

  const adapter = new AstGrepCliRepositoryAdapter({
    fs,
    gateway,
    executablePath: integrationBinary!,
  })
  const request = {
    version: K3_R4_AST_GREP_QUERY_CONTRACT_VERSION,
    kind: "find_symbol_candidates" as const,
    symbol: "add",
    scope: fixtureScope,
    snapshot,
    maxResults: 50,
  }
  const first = await adapter.findSymbolCandidates(request)
  const second = await adapter.findSymbolCandidates(request)

  assert.equal(first.resultIdentity, second.resultIdentity)
  assert.equal(first.snapshotIdentity, snapshot.snapshotIdentity.value)
  assert.equal(first.contentIdentity, snapshot.contentIdentity.value)
  assert.equal(first.freshness, "current")
  assert.equal(first.completeness.state, "complete")
  assert.equal(first.source.semanticStrength, "structural-only-not-compiler-resolved")
  assert.equal(first.source.platformQualification, "linux-x64-k3-r3")
  assert.ok(first.source.provenanceRefs.length > 0)
  assert.deepEqual(
    first.matches.map(({ path, line, column }) => ({ path, line, column })),
    [
      { path: `${fixtureScope}/src/consumer.ts`, line: 1, column: 10 },
      { path: `${fixtureScope}/src/consumer.ts`, line: 4, column: 10 },
      { path: `${fixtureScope}/src/math.ts`, line: 1, column: 17 },
      { path: `${fixtureScope}/tests/math.test.ts`, line: 3, column: 10 },
      { path: `${fixtureScope}/tests/math.test.ts`, line: 6, column: 16 },
    ],
  )

  const empty = await adapter.findSymbolCandidates({ ...request, symbol: "DefinitelyNoSuchKodacSymbol" })
  assert.deepEqual(empty.matches, [])
  assert.equal(empty.completeness.state, "complete")
  assert.match(empty.resultIdentity, /^[0-9a-f]{64}$/)
})
