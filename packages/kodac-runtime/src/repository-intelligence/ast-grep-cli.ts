import { createHash } from "node:crypto"
import { readFile, realpath, stat } from "node:fs/promises"
import { isAbsolute, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"

import type { WorkspaceFileSystem } from "../edit/filesystem.ts"
import type { ExecutionGateway, ExecutionObserver } from "../execution/gateway.ts"
import {
  K3_R2_SNAPSHOT_CONTRACT_VERSION,
  type RepositorySnapshot,
} from "../repository/contracts.ts"
import {
  captureRepositorySnapshot,
  createGatewayGitSnapshotSource,
} from "../repository/snapshot.ts"
import {
  K3_R4_AST_GREP_ADAPTER_ID,
  K3_R4_AST_GREP_QUERY_CONTRACT_VERSION,
  type AstGrepStructuralMatch,
  type AstGrepStructuralQueryRequest,
  type AstGrepStructuralQueryResult,
} from "./contracts.ts"

export const K3_R4_AST_GREP_VERSION = "0.45.1" as const
export const K3_R4_AST_GREP_MEASURED_VERSION = "ast-grep 0.45.1" as const
export const K3_R4_AST_GREP_UPSTREAM_COMMIT = "dc3d655b9edf3b2bc266d9bc46eb60f18e66b818" as const
export const K3_R4_AST_GREP_LINUX_X64_SHA256 = "6a66162e0a2447af4b7524ee04195239eb1911d07f4868f918909e7d4f453eea" as const
export const K3_R4_AST_GREP_CONFIG_SHA256 = "ca3d163bab055381827226140568f3bef7eaac187cebd76878e0b63e9e442356" as const

const DEFAULT_MAX_RESULTS = 200
const HARD_MAX_RESULTS = 1_000
const DEFAULT_TIMEOUT_MS = 5_000
const HARD_MAX_TIMEOUT_MS = 30_000
const DEFAULT_MAX_OUTPUT_BYTES = 1024 * 1024
const HARD_MAX_OUTPUT_BYTES = 4 * 1024 * 1024
const HARD_MAX_CANDIDATE_FILES = 512
const HARD_MAX_ARGUMENT_BYTES = 64 * 1024
const HARD_MAX_RAW_MATCHES = 10_000
const HARD_MAX_MATCH_TEXT_BYTES = 64 * 1024
const AST_GREP_CONFIG_PATH = fileURLToPath(new URL("./ast-grep-empty-config.yml", import.meta.url))

interface RawAstGrepMatch {
  file: string
  text: string
  range: {
    start: { line: number; column: number }
    end: { line: number; column: number }
  }
}

interface ExecutableIdentity {
  realPath: string
  sha256: string
  dev: number
  ino: number
  size: number
  mtimeMs: number
}

interface CandidateSelection {
  paths: string[]
  omitted: number
  reasons: Array<"candidate-file-limit" | "candidate-argument-byte-limit">
  identity: string
}

function sha256(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex")
}

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map((item) => canonicalize(item)).join(",")}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record)
    .sort(compareCodeUnits)
    .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`)
    .join(",")}}`
}

function boundedInteger(name: string, value: number | undefined, fallback: number, maximum: number): number {
  const resolved = value ?? fallback
  if (!Number.isInteger(resolved) || resolved <= 0 || resolved > maximum) {
    throw new Error(`${name} must be a positive integer <= ${maximum}`)
  }
  return resolved
}

function portableRelative(root: string, candidate: string): string {
  return relative(root, candidate).split(sep).join("/")
}

function pathIsContained(root: string, candidate: string): boolean {
  const rel = relative(root, candidate)
  return rel === "" || (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel))
}

export function assertK3R4AstGrepPlatform(platform = process.platform, architecture = process.arch): void {
  if (platform !== "linux" || architecture !== "x64") {
    throw new Error(`K3-R4 ast-grep execution is qualified only for linux/x64; got ${platform}/${architecture}`)
  }
}

export function validateK3R4Symbol(symbol: string): string {
  if (typeof symbol !== "string" || symbol.length === 0 || symbol.length > 128 || symbol.includes("\0")) {
    throw new Error("K3-R4 symbol must be a non-empty <=128 character TypeScript identifier")
  }
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(symbol)) {
    throw new Error("K3-R4 symbol must be a plain TypeScript identifier; ast-grep pattern syntax is not exposed")
  }
  return symbol
}

export function validateK3R4Scope(scope: string | undefined): string {
  if (scope === undefined || scope === ".") return "."
  if (!scope || scope.includes("\0") || scope.includes("\\") || scope.startsWith("/") || /^[A-Za-z]:\//.test(scope)) {
    throw new Error(`K3-R4 scope must be a canonical workspace-relative path: ${scope}`)
  }
  const segments = scope.split("/")
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) {
    throw new Error(`K3-R4 scope must not contain empty, dot, or parent segments: ${scope}`)
  }
  return segments.join("/")
}

function assertBoundSnapshot(snapshot: RepositorySnapshot): void {
  if (snapshot.version !== K3_R2_SNAPSHOT_CONTRACT_VERSION) throw new Error(`Unsupported repository snapshot version: ${snapshot.version}`)
  if (snapshot.freshness !== "current") throw new Error("K3-R4 refuses a stale repository snapshot")
  if (snapshot.completeness.state !== "complete") {
    throw new Error(`K3-R4 first slice requires a complete repository snapshot; got ${snapshot.completeness.state}`)
  }
}

function assertSameSnapshot(expected: RepositorySnapshot, actual: RepositorySnapshot, label: string): void {
  assertBoundSnapshot(actual)
  if (
    actual.repositoryIdentity.value !== expected.repositoryIdentity.value ||
    actual.contentIdentity.value !== expected.contentIdentity.value ||
    actual.snapshotIdentity.value !== expected.snapshotIdentity.value ||
    actual.gitHead !== expected.gitHead
  ) {
    throw new Error(`K3-R4 repository snapshot changed ${label}`)
  }
}

function inScope(path: string, scope: string): boolean {
  return scope === "." || path === scope || path.startsWith(`${scope}/`)
}

export function selectK3R4TypeScriptCandidates(snapshot: RepositorySnapshot, scope: string): CandidateSelection {
  const eligible = snapshot.inventory
    .filter((entry) => entry.type === "file" && entry.path.endsWith(".ts") && inScope(entry.path, scope))
    .map((entry) => entry.path)
    .sort(compareCodeUnits)

  const paths: string[] = []
  const reasons = new Set<CandidateSelection["reasons"][number]>()
  let argumentBytes = 0
  let omitted = 0
  for (const path of eligible) {
    const nextBytes = Buffer.byteLength(path, "utf8") + 1
    if (paths.length >= HARD_MAX_CANDIDATE_FILES) {
      omitted++
      reasons.add("candidate-file-limit")
      continue
    }
    if (argumentBytes + nextBytes > HARD_MAX_ARGUMENT_BYTES) {
      omitted++
      reasons.add("candidate-argument-byte-limit")
      continue
    }
    paths.push(path)
    argumentBytes += nextBytes
  }

  return {
    paths,
    omitted,
    reasons: [...reasons].sort(compareCodeUnits),
    identity: sha256(paths.join("\0")),
  }
}

function nonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
}

export function parseAstGrepCompactOutput(raw: string): RawAstGrepMatch[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    throw new Error("ast-grep returned malformed JSON", { cause: error })
  }
  if (!Array.isArray(parsed)) throw new Error("ast-grep compact output must be a JSON array")
  if (parsed.length > HARD_MAX_RAW_MATCHES) throw new Error(`ast-grep returned more than ${HARD_MAX_RAW_MATCHES} matches`)

  return parsed.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error(`ast-grep match ${index} must be an object`)
    const record = item as Record<string, unknown>
    if (typeof record.file !== "string" || !record.file || record.file.includes("\0")) throw new Error(`ast-grep match ${index} has an invalid file`)
    if (typeof record.text !== "string" || Buffer.byteLength(record.text, "utf8") > HARD_MAX_MATCH_TEXT_BYTES) throw new Error(`ast-grep match ${index} has invalid or oversized text`)
    if (record.replacement !== undefined && record.replacement !== null) throw new Error(`ast-grep match ${index} unexpectedly contains rewrite output`)
    if (record.replacementOffsets !== undefined && record.replacementOffsets !== null) throw new Error(`ast-grep match ${index} unexpectedly contains rewrite offsets`)
    if (!record.range || typeof record.range !== "object" || Array.isArray(record.range)) throw new Error(`ast-grep match ${index} has an invalid range`)
    const range = record.range as Record<string, unknown>
    const start = range.start as Record<string, unknown> | undefined
    const end = range.end as Record<string, unknown> | undefined
    if (!start || !end || !nonNegativeInteger(start.line) || !nonNegativeInteger(start.column) || !nonNegativeInteger(end.line) || !nonNegativeInteger(end.column)) {
      throw new Error(`ast-grep match ${index} has invalid range positions`)
    }
    if (end.line < start.line || (end.line === start.line && end.column < start.column)) {
      throw new Error(`ast-grep match ${index} has a reversed range`)
    }
    return {
      file: record.file,
      text: record.text,
      range: {
        start: { line: start.line, column: start.column },
        end: { line: end.line, column: end.column },
      },
    }
  })
}

async function normalizeMatches(
  raw: RawAstGrepMatch[],
  workspaceRoot: string,
  selectedPaths: ReadonlySet<string>,
): Promise<AstGrepStructuralMatch[]> {
  const realRoot = await realpath(workspaceRoot)
  const matches: AstGrepStructuralMatch[] = []
  for (const match of raw) {
    const candidate = isAbsolute(match.file) ? match.file : resolve(realRoot, match.file)
    const realCandidate = await realpath(candidate)
    if (!pathIsContained(realRoot, realCandidate)) throw new Error(`ast-grep result escapes workspace: ${match.file}`)
    const path = portableRelative(realRoot, realCandidate)
    if (!path || path === "." || !selectedPaths.has(path)) {
      throw new Error(`ast-grep returned a path outside the bound candidate set: ${match.file}`)
    }
    const info = await stat(realCandidate)
    if (!info.isFile()) throw new Error(`ast-grep result is not a regular file: ${path}`)
    matches.push({
      path,
      line: match.range.start.line + 1,
      column: match.range.start.column + 1,
      text: match.text,
      evidenceClass: "parser-derived",
    })
  }
  return matches.sort((left, right) =>
    compareCodeUnits(left.path, right.path) ||
    left.line - right.line ||
    left.column - right.column ||
    compareCodeUnits(left.text, right.text),
  )
}

async function measureExecutable(executablePath: string): Promise<ExecutableIdentity> {
  if (!isAbsolute(executablePath)) throw new Error("K3-R4 ast-grep executable path must be absolute")
  const realPath = await realpath(executablePath)
  const info = await stat(realPath)
  if (!info.isFile()) throw new Error(`K3-R4 ast-grep executable is not a regular file: ${realPath}`)
  if ((info.mode & 0o111) === 0) throw new Error(`K3-R4 ast-grep executable is not executable: ${realPath}`)
  const digest = sha256(await readFile(realPath))
  if (digest !== K3_R4_AST_GREP_LINUX_X64_SHA256) {
    throw new Error(`K3-R4 ast-grep executable digest mismatch: expected ${K3_R4_AST_GREP_LINUX_X64_SHA256}, got ${digest}`)
  }
  return {
    realPath,
    sha256: digest,
    dev: info.dev,
    ino: info.ino,
    size: info.size,
    mtimeMs: info.mtimeMs,
  }
}

function assertSameExecutable(expected: ExecutableIdentity, actual: ExecutableIdentity, label: string): void {
  if (
    expected.realPath !== actual.realPath ||
    expected.sha256 !== actual.sha256 ||
    expected.dev !== actual.dev ||
    expected.ino !== actual.ino ||
    expected.size !== actual.size ||
    expected.mtimeMs !== actual.mtimeMs
  ) {
    throw new Error(`K3-R4 ast-grep executable identity changed ${label}`)
  }
}

async function verifyKodacConfig(): Promise<string> {
  const configPath = await realpath(AST_GREP_CONFIG_PATH)
  const digest = sha256(await readFile(configPath))
  if (digest !== K3_R4_AST_GREP_CONFIG_SHA256) {
    throw new Error(`K3-R4 Kodac-owned ast-grep config digest mismatch: expected ${K3_R4_AST_GREP_CONFIG_SHA256}, got ${digest}`)
  }
  return configPath
}

function fixedProcessEnv(): NodeJS.ProcessEnv {
  return {
    LANG: "C.UTF-8",
    LC_ALL: "C.UTF-8",
    NO_COLOR: "1",
    TERM: "dumb",
  }
}

function snapshotProvenance(snapshot: RepositorySnapshot): string[] {
  return snapshot.sources.flatMap((source) => source.provenanceRefs)
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort(compareCodeUnits)
}

function versionLine(stdout: string, stderr: string): string {
  const line = `${stdout}\n${stderr}`.trim().split(/\r?\n/, 1)[0] ?? ""
  if (line !== K3_R4_AST_GREP_MEASURED_VERSION) {
    throw new Error(`K3-R4 ast-grep version mismatch: expected ${K3_R4_AST_GREP_MEASURED_VERSION}, got ${line || "<empty>"}`)
  }
  return line
}

export class AstGrepCliRepositoryAdapter {
  private readonly fs: WorkspaceFileSystem
  private readonly gateway: ExecutionGateway
  private readonly executablePath: string
  private readonly observer?: ExecutionObserver

  constructor(input: {
    fs: WorkspaceFileSystem
    gateway: ExecutionGateway
    executablePath: string
    observer?: ExecutionObserver
  }) {
    this.fs = input.fs
    this.gateway = input.gateway
    this.executablePath = input.executablePath
    this.observer = input.observer
  }

  async findSymbolCandidates(request: AstGrepStructuralQueryRequest): Promise<AstGrepStructuralQueryResult> {
    if (request.version !== K3_R4_AST_GREP_QUERY_CONTRACT_VERSION || request.kind !== "find_symbol_candidates") {
      throw new Error("Unsupported K3-R4 ast-grep query contract")
    }
    if (request.signal?.aborted) throw request.signal.reason ?? new Error("K3-R4 ast-grep query aborted")
    assertK3R4AstGrepPlatform()
    const symbol = validateK3R4Symbol(request.symbol)
    const scope = validateK3R4Scope(request.scope)
    const maxResults = boundedInteger("maxResults", request.maxResults, DEFAULT_MAX_RESULTS, HARD_MAX_RESULTS)
    const timeoutMs = boundedInteger("timeoutMs", request.timeoutMs, DEFAULT_TIMEOUT_MS, HARD_MAX_TIMEOUT_MS)
    const maxOutputBytes = boundedInteger("maxOutputBytes", request.maxOutputBytes, DEFAULT_MAX_OUTPUT_BYTES, HARD_MAX_OUTPUT_BYTES)
    assertBoundSnapshot(request.snapshot)

    const executable = await measureExecutable(this.executablePath)
    const configPath = await verifyKodacConfig()
    const preSnapshot = await captureRepositorySnapshot(this.fs, createGatewayGitSnapshotSource(this.gateway, this.observer))
    assertSameSnapshot(request.snapshot, preSnapshot, "before executable identity validation")

    const identityReceipt = await this.gateway.runCommand(
      "k3.ast-grep.identity",
      executable.realPath,
      ["--config", configPath, "--version"],
      this.observer,
      {
        signal: request.signal,
        timeoutMs,
        maxOutputBytes: 16 * 1024,
        env: fixedProcessEnv(),
        allowedExitCodes: [0],
      },
    )
    versionLine(identityReceipt.stdout, identityReceipt.stderr)
    assertSameExecutable(executable, await measureExecutable(executable.realPath), "during version validation")
    await verifyKodacConfig()

    const querySnapshot = await captureRepositorySnapshot(this.fs, createGatewayGitSnapshotSource(this.gateway, this.observer))
    assertSameSnapshot(request.snapshot, querySnapshot, "before structural query execution")
    const selection = selectK3R4TypeScriptCandidates(querySnapshot, scope)
    const selectedSet = new Set(selection.paths)

    const queryArgs = [
      "--config", configPath,
      "run",
      "-p", symbol,
      "-l", "ts",
      "--json=compact",
      "--threads", "1",
      "--no-ignore", "hidden",
      "--no-ignore", "dot",
      "--no-ignore", "exclude",
      "--no-ignore", "global",
      "--no-ignore", "parent",
      "--no-ignore", "vcs",
      "--",
      ...selection.paths,
    ]

    const queryReceipts: string[] = []
    let normalized: AstGrepStructuralMatch[] = []
    if (selection.paths.length > 0) {
      const first = await this.gateway.runCommand(
        "k3.ast-grep.structural-query",
        executable.realPath,
        queryArgs,
        this.observer,
        {
          signal: request.signal,
          timeoutMs,
          maxOutputBytes,
          env: fixedProcessEnv(),
          paths: selection.paths,
          allowedExitCodes: [0, 1],
        },
      )
      queryReceipts.push(first.receipt.receiptId)
      normalized = await normalizeMatches(parseAstGrepCompactOutput(first.stdout), this.fs.root, selectedSet)
      assertSameExecutable(executable, await measureExecutable(executable.realPath), "after first structural query")
      await verifyKodacConfig()

      const second = await this.gateway.runCommand(
        "k3.ast-grep.structural-query",
        executable.realPath,
        queryArgs,
        this.observer,
        {
          signal: request.signal,
          timeoutMs,
          maxOutputBytes,
          env: fixedProcessEnv(),
          paths: selection.paths,
          allowedExitCodes: [0, 1],
        },
      )
      queryReceipts.push(second.receipt.receiptId)
      const repeated = await normalizeMatches(parseAstGrepCompactOutput(second.stdout), this.fs.root, selectedSet)
      if (canonicalize(normalized) !== canonicalize(repeated)) {
        throw new Error("K3-R4 ast-grep structural query was not deterministic across repeated execution")
      }
      assertSameExecutable(executable, await measureExecutable(executable.realPath), "after repeated structural query")
      await verifyKodacConfig()
    }

    const postSnapshot = await captureRepositorySnapshot(this.fs, createGatewayGitSnapshotSource(this.gateway, this.observer))
    assertSameSnapshot(request.snapshot, postSnapshot, "after structural query execution")

    const reasons = [...selection.reasons]
    let omittedAtLeast = selection.omitted
    let matches = normalized
    if (matches.length > maxResults) {
      omittedAtLeast += matches.length - maxResults
      matches = matches.slice(0, maxResults)
      reasons.push("max-results")
    }
    const sortedReasons = uniqueSorted(reasons) as AstGrepStructuralQueryResult["completeness"]["reasons"]
    const completeness = {
      state: sortedReasons.length > 0 ? "truncated" as const : "complete" as const,
      reasons: sortedReasons,
      omittedAtLeast,
    }

    const provenanceRefs = uniqueSorted([
      ...snapshotProvenance(preSnapshot),
      identityReceipt.receipt.receiptId,
      ...snapshotProvenance(querySnapshot),
      ...queryReceipts,
      ...snapshotProvenance(postSnapshot),
    ])
    if (provenanceRefs.length === 0) throw new Error("K3-R4 ast-grep result is missing execution provenance")

    const source = {
      adapterId: K3_R4_AST_GREP_ADAPTER_ID,
      candidate: "ast-grep" as const,
      upstreamRepository: "ast-grep/ast-grep" as const,
      upstreamTag: K3_R4_AST_GREP_VERSION,
      upstreamCommit: K3_R4_AST_GREP_UPSTREAM_COMMIT,
      measuredVersion: K3_R4_AST_GREP_MEASURED_VERSION,
      platformQualification: "linux-x64-k3-r3" as const,
      executableSha256: K3_R4_AST_GREP_LINUX_X64_SHA256,
      kodacConfigSha256: K3_R4_AST_GREP_CONFIG_SHA256,
      semanticStrength: "structural-only-not-compiler-resolved" as const,
      provenanceRefs,
    }

    const identityInput = {
      version: K3_R4_AST_GREP_QUERY_CONTRACT_VERSION,
      query: { kind: request.kind, symbol, scope },
      repositoryIdentity: postSnapshot.repositoryIdentity.value,
      snapshotIdentity: postSnapshot.snapshotIdentity.value,
      contentIdentity: postSnapshot.contentIdentity.value,
      candidateFiles: {
        included: selection.paths.length,
        omitted: selection.omitted,
        identity: selection.identity,
      },
      completeness,
      matches,
      source: {
        adapterId: source.adapterId,
        candidate: source.candidate,
        upstreamRepository: source.upstreamRepository,
        upstreamTag: source.upstreamTag,
        upstreamCommit: source.upstreamCommit,
        measuredVersion: source.measuredVersion,
        platformQualification: source.platformQualification,
        executableSha256: source.executableSha256,
        kodacConfigSha256: source.kodacConfigSha256,
        semanticStrength: source.semanticStrength,
      },
    }

    return {
      version: K3_R4_AST_GREP_QUERY_CONTRACT_VERSION,
      query: { kind: request.kind, symbol, scope },
      repositoryIdentity: postSnapshot.repositoryIdentity.value,
      snapshotIdentity: postSnapshot.snapshotIdentity.value,
      contentIdentity: postSnapshot.contentIdentity.value,
      freshness: "current",
      candidateFiles: identityInput.candidateFiles,
      completeness,
      matches,
      source,
      deterministic: true,
      resultIdentity: sha256(canonicalize(identityInput)),
    }
  }
}
