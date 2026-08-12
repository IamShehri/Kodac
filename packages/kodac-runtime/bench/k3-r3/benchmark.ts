import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  realpathSync,
  writeFileSync,
} from "node:fs"
import { arch, platform, release } from "node:os"
import { dirname, isAbsolute, relative, resolve } from "node:path"
import { performance } from "node:perf_hooks"

interface ExpectedFile {
  kind: string
  path: string
  sha256: string
}

interface GoldDefinition {
  gold_class: string
  line: number
  path: string
  symbol: string
}

interface GoldReference {
  gold_class: string
  kind: "import" | "call"
  line: number
  path: string
  symbol: string
}

interface GoldAmbiguousSymbol {
  candidates: string[]
  expected_without_semantic_disambiguation: string
  symbol: string
}

interface VirtualSecurityCase {
  case_id: string
  expected: string
  input_path?: string
  symlink_target?: string
}

interface FixtureManifest {
  digest_policy: {
    binary: "raw-bytes"
    text: "utf8-lf-normalized"
  }
  expected_files: ExpectedFile[]
  fixture_id: string
  gold: {
    ambiguous_symbols: GoldAmbiguousSymbol[]
    definitions: GoldDefinition[]
    references: GoldReference[]
  }
  schema_version: string
  virtual_security_cases: VirtualSecurityCase[]
}

interface AstGrepRawMatch {
  text: string
  range: {
    start: { line: number; column: number }
    end: { line: number; column: number }
  }
  file: string
  language?: string
}

interface NormalizedMatch {
  path: string
  line: number
  column: number
  text: string
  evidenceClass: "parser-derived"
  source: {
    candidate: "ast-grep"
    version: string
    artifactSha256: string
    executableSha256: string
    adapterConfig: "k3-r3-ast-grep-structural-v1"
  }
}

interface QueryObservation {
  id: string
  pattern: string
  matches: NormalizedMatch[]
  durationMs: number
}

interface TreeSnapshot {
  digest: string
  entryCount: number
  records: Record<string, string>
}

interface VerifiedExecutable {
  realPath: string
  sha256: string
}

interface SourceOccurrence {
  path: string
  line: number
  column: number
}

const TEXT_EXPECTED_KINDS = new Set([
  "architecture-document",
  "untrusted-document",
  "generated",
  "malformed-source",
  "source",
  "test-source",
  "vendor",
])

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function sha256(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex")
}

function gitBlobSha1(data: Buffer): string {
  const header = Buffer.from(`blob ${data.length}\0`, "utf8")
  return createHash("sha1").update(header).update(data).digest("hex")
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalize(item)).join(",")}]`
  }
  const record = value as Record<string, unknown>
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`)
    .join(",")}}`
}

function normalizeText(bytes: Buffer): Buffer {
  return Buffer.from(bytes.toString("utf8").replace(/\r\n?/g, "\n"), "utf8")
}

function pathIsContained(root: string, candidate: string): boolean {
  const relativePath = relative(root, candidate)
  return (
    relativePath === "" ||
    (relativePath !== ".." &&
      !relativePath.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) &&
      !isAbsolute(relativePath))
  )
}

function realContainedPath(root: string, input: string, label: string): string {
  const realInput = realpathSync(input)
  if (!pathIsContained(root, realInput)) {
    throw new Error(`Rejected realpath escape for ${label}: ${input} -> ${realInput}`)
  }
  return realInput
}

function verifyExecutableDigest(
  executable: string,
  expectedSha256: string,
  label: string,
): VerifiedExecutable {
  const realPath = realpathSync(executable)
  const measuredSha256 = sha256(readFileSync(realPath))
  if (measuredSha256 !== expectedSha256) {
    throw new Error(
      `${label} executable digest mismatch: expected ${expectedSha256}, got ${measuredSha256}`,
    )
  }
  return { realPath, sha256: measuredSha256 }
}

function verifyDistinctCandidateExecutables(
  candidates: Array<{ label: string; executable: VerifiedExecutable }>,
): void {
  const realPaths = new Set(candidates.map((item) => item.executable.realPath))
  const digests = new Set(candidates.map((item) => item.executable.sha256))
  if (realPaths.size !== candidates.length || digests.size !== candidates.length) {
    throw new Error(
      `Candidate executable identities must be distinct: ${candidates
        .map((item) => `${item.label}=${item.executable.realPath}:${item.executable.sha256}`)
        .join(", ")}`,
    )
  }
}

function normalizeRelativePath(input: string, fixtureRoot: string): string {
  const slashPath = input.replaceAll("\\", "/")
  if (!slashPath || slashPath.startsWith("/") || /^[A-Za-z]:\//.test(slashPath)) {
    throw new Error(`Rejected non-relative fixture path: ${input}`)
  }

  const segments = slashPath.split("/")
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    throw new Error(`Rejected non-canonical fixture path: ${input}`)
  }

  const absolutePath = resolve(fixtureRoot, ...segments)
  if (!pathIsContained(fixtureRoot, absolutePath)) {
    throw new Error(`Rejected fixture path escape: ${input}`)
  }

  return segments.join("/")
}

function normalizeCandidatePath(input: string, fixtureRoot: string): string {
  const absoluteInput = isAbsolute(input) ? input : resolve(fixtureRoot, input)
  const realInput = realContainedPath(fixtureRoot, absoluteInput, `candidate result ${input}`)
  const relativeInput = relative(fixtureRoot, realInput).replaceAll("\\", "/")
  return normalizeRelativePath(relativeInput, fixtureRoot)
}

function snapshotTree(
  root: string,
  excludedTopLevelNames: ReadonlySet<string> = new Set(),
): TreeSnapshot {
  const records: Record<string, string> = {}

  const walk = (absoluteDirectory: string, relativeDirectory: string): void => {
    const names = readdirSync(absoluteDirectory).sort()
    for (const name of names) {
      if (!relativeDirectory && excludedTopLevelNames.has(name)) {
        continue
      }

      const absolutePath = resolve(absoluteDirectory, name)
      const relativePath = relativeDirectory ? `${relativeDirectory}/${name}` : name
      const stat = lstatSync(absolutePath)

      if (stat.isSymbolicLink()) {
        const rawTarget = readlinkSync(absolutePath)
        const targetRealPath = realContainedPath(root, absolutePath, `symlink ${relativePath}`)
        const targetRelativePath = relative(root, targetRealPath).replaceAll("\\", "/")
        const targetStat = lstatSync(targetRealPath)
        let targetEvidence = `other:${targetStat.mode}:${targetStat.size}`
        if (targetStat.isFile()) {
          targetEvidence = `file:${sha256(readFileSync(targetRealPath))}`
        } else if (targetStat.isDirectory()) {
          targetEvidence = "directory"
        }
        records[relativePath] = `symlink:${rawTarget}:${targetRelativePath}:${targetEvidence}`
        continue
      }

      if (stat.isDirectory()) {
        records[relativePath] = "directory"
        walk(absolutePath, relativePath)
        continue
      }

      if (stat.isFile()) {
        records[relativePath] = `file:${sha256(readFileSync(absolutePath))}`
        continue
      }

      records[relativePath] = `other:${stat.mode}:${stat.size}`
    }
  }

  walk(root, "")
  const canonicalRecords = Object.keys(records)
    .sort()
    .map((path) => `${path}\0${records[path]}\n`)
    .join("")

  return {
    digest: sha256(canonicalRecords),
    entryCount: Object.keys(records).length,
    records,
  }
}

function changedEntryCount(before: TreeSnapshot, after: TreeSnapshot): number {
  const paths = new Set([...Object.keys(before.records), ...Object.keys(after.records)])
  let changed = 0
  for (const path of paths) {
    if (before.records[path] !== after.records[path]) {
      changed += 1
    }
  }
  return changed
}

function compareStringSets(actual: string[], expected: string[]): boolean {
  const left = [...new Set(actual)].sort()
  const right = [...new Set(expected)].sort()
  return canonicalize(left) === canonicalize(right)
}

function precisionRecall(
  observed: SourceOccurrence[],
  expected: SourceOccurrence[],
): { precision: number; recall: number; truePositive: number; observed: number; expected: number } {
  const observedSet = new Set(observed.map((item) => `${item.path}:${item.line}:${item.column}`))
  const expectedSet = new Set(expected.map((item) => `${item.path}:${item.line}:${item.column}`))
  let truePositive = 0
  for (const item of observedSet) {
    if (expectedSet.has(item)) {
      truePositive += 1
    }
  }
  return {
    precision: observedSet.size === 0 ? (expectedSet.size === 0 ? 1 : 0) : truePositive / observedSet.size,
    recall: expectedSet.size === 0 ? 1 : truePositive / expectedSet.size,
    truePositive,
    observed: observedSet.size,
    expected: expectedSet.size,
  }
}

function identifierChar(character: string): boolean {
  return /^[A-Za-z0-9_$]$/.test(character)
}

function locateGoldOccurrence(
  fixtureRoot: string,
  item: { path: string; line: number; symbol: string },
): SourceOccurrence {
  const path = normalizeRelativePath(item.path, fixtureRoot)
  const logicalPath = resolve(fixtureRoot, path)
  const realPath = realContainedPath(fixtureRoot, logicalPath, `gold occurrence ${path}:${item.line}`)
  const lines = normalizeText(readFileSync(realPath)).toString("utf8").split("\n")
  const lineText = lines[item.line - 1]
  if (lineText === undefined) {
    throw new Error(`Gold occurrence line is out of range: ${path}:${item.line}`)
  }

  const columns: number[] = []
  let searchFrom = 0
  while (searchFrom <= lineText.length - item.symbol.length) {
    const index = lineText.indexOf(item.symbol, searchFrom)
    if (index < 0) {
      break
    }
    const before = index === 0 ? "" : lineText[index - 1] ?? ""
    const afterIndex = index + item.symbol.length
    const after = afterIndex >= lineText.length ? "" : lineText[afterIndex] ?? ""
    if ((!before || !identifierChar(before)) && (!after || !identifierChar(after))) {
      columns.push(index + 1)
    }
    searchFrom = index + Math.max(1, item.symbol.length)
  }

  if (columns.length !== 1) {
    throw new Error(
      `Gold occurrence must resolve to exactly one identifier on its declared line: ${path}:${item.line}:${item.symbol} (${columns.length} matches)`,
    )
  }

  return { path, line: item.line, column: columns[0] }
}

function runCommand(
  executable: string,
  args: string[],
  cwd: string,
  timeout = 10_000,
): { stdout: string; stderr: string; status: number } {
  const result = spawnSync(executable, args, {
    cwd,
    encoding: "utf8",
    timeout,
    windowsHide: true,
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      LANG: "C.UTF-8",
      LC_ALL: "C.UTF-8",
      NO_COLOR: "1",
    },
  })
  if (result.error) {
    throw result.error
  }
  return {
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    status: result.status ?? -1,
  }
}

function candidateIdentity(executable: string, cwd: string): string {
  for (const args of [["--version"], ["version"], ["--help"]]) {
    const result = runCommand(executable, args, cwd)
    if (result.status === 0) {
      const text = `${result.stdout}\n${result.stderr}`.trim()
      if (text) {
        return text.split(/\r?\n/, 1)[0] ?? "identity-output-empty"
      }
    }
  }
  return "identity-command-unavailable"
}

function verifyFixture(manifest: FixtureManifest, fixtureRoot: string): {
  digest: string
  verifiedFileCount: number
} {
  const digestParts: string[] = []
  for (const expected of manifest.expected_files) {
    const path = normalizeRelativePath(expected.path, fixtureRoot)
    const logicalPath = resolve(fixtureRoot, path)
    const realPath = realContainedPath(fixtureRoot, logicalPath, `manifest file ${path}`)
    const bytes = readFileSync(realPath)
    let canonicalBytes: Buffer
    if (expected.kind === "binary") {
      canonicalBytes = bytes
    } else if (TEXT_EXPECTED_KINDS.has(expected.kind)) {
      canonicalBytes = normalizeText(bytes)
    } else {
      throw new Error(`Unsupported fixture digest kind for ${path}: ${expected.kind}`)
    }
    const actual = sha256(canonicalBytes)
    if (actual !== expected.sha256) {
      throw new Error(`Fixture digest mismatch for ${path}: expected ${expected.sha256}, got ${actual}`)
    }
    digestParts.push(`${path}\0${actual}\n`)
  }
  digestParts.sort()
  return {
    digest: sha256(digestParts.join("")),
    verifiedFileCount: manifest.expected_files.length,
  }
}

function runAstGrepQuery(
  astGrepBin: string,
  fixtureRoot: string,
  version: string,
  artifactSha256: string,
  executableSha256: string,
  id: string,
  pattern: string,
): QueryObservation {
  const started = performance.now()
  const result = runCommand(
    astGrepBin,
    ["run", "-p", pattern, "-l", "ts", "--json=compact", "."],
    fixtureRoot,
  )
  const durationMs = Number((performance.now() - started).toFixed(3))
  if (result.status !== 0) {
    throw new Error(`ast-grep query ${id} failed with status ${result.status}: ${result.stderr || result.stdout}`)
  }

  const parsed = JSON.parse(result.stdout) as AstGrepRawMatch[]
  if (!Array.isArray(parsed)) {
    throw new Error(`ast-grep query ${id} did not return a JSON array`)
  }

  const compareCodeUnits = (left: string, right: string): number =>
    left < right ? -1 : left > right ? 1 : 0

  const matches = parsed
    .map((match): NormalizedMatch => ({
      path: normalizeCandidatePath(match.file, fixtureRoot),
      line: match.range.start.line + 1,
      column: match.range.start.column + 1,
      text: match.text,
      evidenceClass: "parser-derived",
      source: {
        candidate: "ast-grep",
        version,
        artifactSha256,
        executableSha256,
        adapterConfig: "k3-r3-ast-grep-structural-v1",
      },
    }))
    .sort((left, right) =>
      compareCodeUnits(left.path, right.path) ||
      left.line - right.line ||
      left.column - right.column ||
      compareCodeUnits(left.text, right.text),
    )

  return { id, pattern, matches, durationMs }
}

function stableAstSuite(suite: QueryObservation[]): unknown {
  return suite.map(({ id, pattern, matches }) => ({ id, pattern, matches }))
}

function main(): void {
  const workspaceRoot = realpathSync(resolve(requiredEnv("K3_R3_WORKSPACE_ROOT")))
  const fixtureRoot = realpathSync(resolve(requiredEnv("K3_R3_FIXTURE_ROOT")))
  const resultPath = resolve(requiredEnv("K3_R3_RESULT_PATH"))
  const baselineSha = requiredEnv("K3_R3_BASELINE_SHA")
  const headSha = requiredEnv("K3_R3_HEAD_SHA")
  const prBaseSha = requiredEnv("K3_R3_PR_BASE_SHA")
  const protocolId = requiredEnv("K3_R3_PROTOCOL_ID")
  const manifestBlob = requiredEnv("K3_R3_FIXTURE_MANIFEST_BLOB")
  const runId = requiredEnv("K3_R3_RUN_ID")

  const astGrepBin = requiredEnv("AST_GREP_BIN")
  const astGrepVersion = requiredEnv("AST_GREP_VERSION")
  const astGrepArchiveSha = requiredEnv("AST_GREP_SHA256")
  const astGrepExpectedBinSha = requiredEnv("AST_GREP_BIN_SHA256")
  const treeSitterBin = requiredEnv("TREE_SITTER_BIN")
  const treeSitterVersion = requiredEnv("TREE_SITTER_VERSION")
  const treeSitterArchiveSha = requiredEnv("TREE_SITTER_SHA256")
  const treeSitterExpectedBinSha = requiredEnv("TREE_SITTER_BIN_SHA256")
  const treeSitterTypeScriptCommit = requiredEnv("TREE_SITTER_TYPESCRIPT_COMMIT")
  const scipBin = requiredEnv("SCIP_BIN")
  const scipVersion = requiredEnv("SCIP_VERSION")
  const scipArchiveSha = requiredEnv("SCIP_SHA256")
  const scipExpectedBinSha = requiredEnv("SCIP_BIN_SHA256")
  const lspSpecVersion = requiredEnv("LSP_SPEC_VERSION")

  if (prBaseSha !== baselineSha) {
    throw new Error(`Canonical benchmark base moved: expected ${baselineSha}, got ${prBaseSha}`)
  }

  const checkedOutHeadResult = runCommand("git", ["rev-parse", "HEAD"], workspaceRoot)
  const checkedOutHead = checkedOutHeadResult.stdout.trim()
  if (checkedOutHeadResult.status !== 0 || checkedOutHead !== headSha) {
    throw new Error(`Benchmark checkout identity mismatch: expected ${headSha}, got ${checkedOutHead || "<none>"}`)
  }

  if (!pathIsContained(workspaceRoot, fixtureRoot)) {
    throw new Error("Fixture root must remain inside the real checked-out workspace")
  }

  const resultParent = realpathSync(dirname(resultPath))
  if (pathIsContained(workspaceRoot, resultParent)) {
    throw new Error(`Benchmark result path parent must remain outside the workspace: ${resultParent}`)
  }
  if (existsSync(resultPath)) {
    const resultRealPath = realpathSync(resultPath)
    if (pathIsContained(workspaceRoot, resultRealPath)) {
      throw new Error(`Benchmark result path must remain outside the workspace: ${resultRealPath}`)
    }
  }

  const astGrepExecutable = verifyExecutableDigest(astGrepBin, astGrepExpectedBinSha, "ast-grep")
  const treeSitterExecutable = verifyExecutableDigest(
    treeSitterBin,
    treeSitterExpectedBinSha,
    "Tree-sitter",
  )
  const scipExecutable = verifyExecutableDigest(scipBin, scipExpectedBinSha, "SCIP")
  verifyDistinctCandidateExecutables([
    { label: "ast-grep", executable: astGrepExecutable },
    { label: "Tree-sitter", executable: treeSitterExecutable },
    { label: "SCIP", executable: scipExecutable },
  ])

  const manifestLogicalPath = resolve(fixtureRoot, "manifest.json")
  const manifestPath = realContainedPath(fixtureRoot, manifestLogicalPath, "fixture manifest")
  const manifestBytes = readFileSync(manifestPath)
  const actualManifestBlob = gitBlobSha1(manifestBytes)
  if (actualManifestBlob !== manifestBlob) {
    throw new Error(`Fixture manifest Git blob mismatch: expected ${manifestBlob}, got ${actualManifestBlob}`)
  }

  const manifest = JSON.parse(manifestBytes.toString("utf8")) as FixtureManifest
  if (manifest.fixture_id !== "k3-r1-core-repository-v1") {
    throw new Error(`Unexpected fixture id: ${manifest.fixture_id}`)
  }
  if (manifest.schema_version !== "k3-r1-gold-evidence-v1") {
    throw new Error(`Unexpected fixture schema: ${manifest.schema_version}`)
  }
  if (
    manifest.digest_policy.binary !== "raw-bytes" ||
    manifest.digest_policy.text !== "utf8-lf-normalized"
  ) {
    throw new Error("Unexpected fixture digest policy")
  }

  const fixtureBefore = verifyFixture(manifest, fixtureRoot)
  const fixtureTreeBefore = snapshotTree(fixtureRoot)
  const workspaceBefore = snapshotTree(workspaceRoot, new Set([".git"]))

  const traversalCase = manifest.virtual_security_cases.find((item) => item.case_id === "path-traversal")
  if (!traversalCase?.input_path) {
    throw new Error("Missing canonical path-traversal security case")
  }
  let traversalRejected = false
  try {
    normalizeRelativePath(traversalCase.input_path, fixtureRoot)
  } catch {
    traversalRejected = true
  }
  if (!traversalRejected) {
    throw new Error("Canonical path-traversal case was not rejected")
  }

  const symlinkCase = manifest.virtual_security_cases.find((item) => item.case_id === "symlink-escape")
  if (!symlinkCase?.symlink_target) {
    throw new Error("Missing canonical symlink-escape security case")
  }
  let symlinkTargetPathStringRejected = false
  try {
    normalizeRelativePath(symlinkCase.symlink_target, fixtureRoot)
  } catch {
    symlinkTargetPathStringRejected = true
  }
  if (!symlinkTargetPathStringRejected) {
    throw new Error("Canonical virtual symlink target path string was not rejected")
  }

  const candidateIdentityOutput = {
    astGrep: candidateIdentity(astGrepExecutable.realPath, fixtureRoot),
    treeSitter: candidateIdentity(treeSitterExecutable.realPath, fixtureRoot),
    scip: candidateIdentity(scipExecutable.realPath, fixtureRoot),
    lsp: `protocol-spec-${lspSpecVersion}-no-server-executed`,
  }
  const expectedCandidateIdentityOutput = {
    astGrep: `ast-grep ${astGrepVersion}`,
    treeSitter: `tree-sitter ${treeSitterVersion}`,
    scip: `scip version v${scipVersion}`,
  }
  for (const candidate of ["astGrep", "treeSitter", "scip"] as const) {
    if (candidateIdentityOutput[candidate] !== expectedCandidateIdentityOutput[candidate]) {
      throw new Error(
        `${candidate} version identity mismatch: expected ${expectedCandidateIdentityOutput[candidate]}, got ${candidateIdentityOutput[candidate]}`,
      )
    }
  }

  const queryConfigs = [
    { id: "symbol-add", pattern: "add" },
    { id: "symbol-meaning", pattern: "meaning" },
    { id: "symbol-widget", pattern: "class Widget { readonly source = $VALUE }" },
  ] as const

  const runSuite = (): QueryObservation[] =>
    queryConfigs.map((query) =>
      runAstGrepQuery(
        astGrepExecutable.realPath,
        fixtureRoot,
        astGrepVersion,
        astGrepArchiveSha,
        astGrepExecutable.sha256,
        query.id,
        query.pattern,
      ),
    )

  const firstSuite = runSuite()
  const secondSuite = runSuite()
  const deterministic = canonicalize(stableAstSuite(firstSuite)) === canonicalize(stableAstSuite(secondSuite))
  if (!deterministic) {
    throw new Error("ast-grep deterministic query outputs diverged between identical runs")
  }

  const query = (id: string): QueryObservation => {
    const item = firstSuite.find((candidate) => candidate.id === id)
    if (!item) {
      throw new Error(`Missing query observation: ${id}`)
    }
    return item
  }

  const expectedAddOccurrences = [
    ...manifest.gold.definitions
      .filter((item) => item.symbol === "add")
      .map((item) => locateGoldOccurrence(fixtureRoot, item)),
    ...manifest.gold.references
      .filter((item) => item.symbol === "add")
      .map((item) => locateGoldOccurrence(fixtureRoot, item)),
  ]
  const observedAddOccurrences = query("symbol-add").matches.map((item) => ({
    path: item.path,
    line: item.line,
    column: item.column,
  }))

  const expectedMeaningOccurrences = manifest.gold.definitions
    .filter((item) => item.symbol === "meaning")
    .map((item) => locateGoldOccurrence(fixtureRoot, item))
  const observedMeaningOccurrences = query("symbol-meaning").matches.map((item) => ({
    path: item.path,
    line: item.line,
    column: item.column,
  }))

  const addOccurrenceMetrics = precisionRecall(observedAddOccurrences, expectedAddOccurrences)
  const meaningOccurrenceMetrics = precisionRecall(observedMeaningOccurrences, expectedMeaningOccurrences)

  const widgetGold = manifest.gold.ambiguous_symbols.find((item) => item.symbol === "Widget")
  if (!widgetGold) {
    throw new Error("Missing canonical Widget ambiguity gold case")
  }
  const widgetObserved = query("symbol-widget").matches.map((item) => item.path)
  const ambiguityPreserved = compareStringSets(widgetObserved, widgetGold.candidates)

  const allEvidence = firstSuite.flatMap((item) => item.matches)
  const provenanceComplete = allEvidence.every(
    (item) =>
      item.evidenceClass === "parser-derived" &&
      item.source.candidate === "ast-grep" &&
      item.source.version === astGrepVersion &&
      item.source.artifactSha256 === astGrepArchiveSha &&
      item.source.executableSha256 === astGrepExecutable.sha256 &&
      item.source.adapterConfig === "k3-r3-ast-grep-structural-v1",
  )
  if (!provenanceComplete) {
    throw new Error("Benchmark evidence provenance is incomplete")
  }

  const manifestAfterPath = realContainedPath(fixtureRoot, manifestLogicalPath, "post-run fixture manifest")
  const manifestAfterBytes = readFileSync(manifestAfterPath)
  const manifestBlobUnchanged = gitBlobSha1(manifestAfterBytes) === manifestBlob
  const manifestBytesUnchanged = manifestAfterBytes.equals(manifestBytes)
  const fixtureAfter = verifyFixture(manifest, fixtureRoot)
  const fixtureTreeAfter = snapshotTree(fixtureRoot)
  const workspaceAfter = snapshotTree(workspaceRoot, new Set([".git"]))

  const fixtureFilesUnchanged = fixtureBefore.digest === fixtureAfter.digest
  const fixtureTreeMutationCount = changedEntryCount(fixtureTreeBefore, fixtureTreeAfter)
  const workspaceMutationCount = changedEntryCount(workspaceBefore, workspaceAfter)
  const fixtureTreeUnchanged = fixtureTreeMutationCount === 0
  const workspaceUnchanged = workspaceMutationCount === 0
  const fixtureUnchanged =
    fixtureFilesUnchanged && fixtureTreeUnchanged && manifestBlobUnchanged && manifestBytesUnchanged

  if (!fixtureUnchanged) {
    throw new Error("Fixture full-tree or manifest identity changed during benchmark execution")
  }
  if (!workspaceUnchanged) {
    throw new Error(`Workspace tree changed during benchmark execution at ${workspaceMutationCount} entries`)
  }

  const astPass =
    addOccurrenceMetrics.precision === 1 &&
    addOccurrenceMetrics.recall === 1 &&
    meaningOccurrenceMetrics.precision === 1 &&
    meaningOccurrenceMetrics.recall === 1 &&
    ambiguityPreserved &&
    deterministic &&
    provenanceComplete &&
    fixtureUnchanged &&
    workspaceUnchanged

  const stableEvidence = {
    schemaVersion: "k3-r3-benchmark-evidence-v1",
    protocolId,
    canonicalBaseline: baselineSha,
    benchmarkHead: headSha,
    pullRequestIdentity: {
      baseSha: prBaseSha,
      headSha,
      checkedOutHead,
      canonicalBaseVerified: true,
      exactHeadCheckoutVerified: true,
    },
    fixture: {
      id: manifest.fixture_id,
      schemaVersion: manifest.schema_version,
      manifestGitBlob: manifestBlob,
      manifestGitBlobVerified: true,
      manifestGitBlobUnchanged: manifestBlobUnchanged,
      manifestBytesUnchanged,
      contentIdentity: fixtureBefore.digest,
      verifiedFileCount: fixtureBefore.verifiedFileCount,
      fullTreeIdentity: fixtureTreeBefore.digest,
      fullTreeEntryCount: fixtureTreeBefore.entryCount,
      fullTreeMutationCount: fixtureTreeMutationCount,
      fullTreeIdentityUnchanged: fixtureTreeUnchanged,
    },
    workspace: {
      treeIdentity: workspaceBefore.digest,
      treeEntryCount: workspaceBefore.entryCount,
      treeMutationCount: workspaceMutationCount,
      treeIdentityUnchanged: workspaceUnchanged,
      excludedTopLevelEntries: [".git"],
    },
    adapterConfig: {
      id: "k3-r3-external-adapter-benchmark-v1",
      astGrepQueries: queryConfigs,
      lspMode: "protocol-capability-assessment-only",
      scipMode: "cli-and-protocol-capability-assessment-only-no-indexer",
      treeSitterMode: "cli-capability-assessment-only-no-parser-build",
    },
    astGrep: {
      candidate: "ast-grep",
      version: astGrepVersion,
      artifactSha256: astGrepArchiveSha,
      executableSha256: astGrepExecutable.sha256,
      executableSha256Verified: true,
      license: "MIT",
      evidenceClass: "parser-derived",
      semanticStrength: "structural-only-not-compiler-resolved",
      structuralOccurrenceMetrics: {
        add: addOccurrenceMetrics,
        meaning: meaningOccurrenceMetrics,
      },
      ambiguityPreserved,
      semanticDefinitionReferenceDifferentiation: "NOT CLAIMED / NOT MEASURED",
      deterministic,
      provenanceComplete,
      fixtureUnchanged,
      normalizedResults: stableAstSuite(firstSuite),
      disposition: astPass ? "QUALIFIED FOR SPECIFIC ADAPTER ROLE" : "NOT QUALIFIED",
      qualifiedRole: astPass ? "structural symbol occurrence and ambiguous-candidate discovery" : null,
    },
    treeSitter: {
      candidate: "Tree-sitter",
      version: treeSitterVersion,
      artifactSha256: treeSitterArchiveSha,
      executableSha256: treeSitterExecutable.sha256,
      executableSha256Verified: true,
      typeScriptGrammarCommit: treeSitterTypeScriptCommit,
      license: "MIT",
      mode: "identity-and-capability-assessment-only",
      disposition: "SECURITY REVIEW REQUIRED",
      reason:
        "TypeScript parser execution would require a grammar build/load path that can invoke a compiler; current K3-R3 does not authorize that execution mode.",
    },
    scip: {
      candidate: "SCIP",
      version: scipVersion,
      artifactSha256: scipArchiveSha,
      executableSha256: scipExecutable.sha256,
      executableSha256Verified: true,
      license: "Apache-2.0",
      mode: "identity-and-protocol-capability-assessment-only",
      disposition: "INSUFFICIENT EVIDENCE",
      reason:
        "SCIP CLI consumes semantic indexes but does not itself produce the TypeScript semantic index needed for gold definition/reference accuracy; no concrete TypeScript indexer is authorized for execution.",
    },
    lsp: {
      candidate: "Language Server Protocol",
      specificationVersion: lspSpecVersion,
      mode: "protocol-capability-assessment-only",
      disposition: "SECURITY REVIEW REQUIRED",
      reason:
        "No concrete language server is authorized; server startup can load project configuration, package resolution, plugins, compilers, tools, or network behavior.",
    },
    k3R2Baseline: {
      role: "canonical exact snapshot / Git-derived baseline",
      status: "CANONICAL BASELINE",
      externalAdapterComparisonRole: "freshness, provenance, and workspace-state truth anchor",
    },
    invariants: {
      canonicalBaseIdentityGuard: true,
      exactHeadCheckoutGuard: true,
      candidateExecutableDigestGuard: true,
      candidateExecutableDistinctnessGuard: true,
      candidateVersionIdentityGuard: true,
      realpathWorkspaceContainmentGuard: true,
      perEntryRealpathContainmentGuard: true,
      symlinkTargetContainmentGuard: true,
      fixtureManifestGitBlobGuard: true,
      fixtureManifestPostRunBlobGuard: manifestBlobUnchanged,
      fixtureManifestPostRunBytesGuard: manifestBytesUnchanged,
      fixtureFullTreeInventoryGuard: fixtureTreeUnchanged,
      snapshotFreshnessGuard: fixtureUnchanged,
      evidenceSourceProvenanceCompleteness: provenanceComplete,
      unauthorizedWorkspaceMutationsObservedByHarness: workspaceMutationCount,
      workspaceFullTreeMutationGuard: workspaceUnchanged,
      canonicalTraversalCaseRejected: traversalRejected,
      canonicalSymlinkTargetPathStringRejected: symlinkTargetPathStringRejected,
      unlabeledModelHypothesesAsVerifiedFacts: 0,
      truncation: "not-triggered-on-k3-r1-core-repository-v1",
      partialResults: "none-for-ast-grep-claimed-structural-capabilities",
    },
    authority: {
      sourceIntakeAuthorized: false,
      newKodacDependenciesAuthorized: false,
      persistentStorageAuthorized: false,
      vectorEmbeddingInfrastructureAuthorized: false,
      k3R4Authorized: false,
      benchmarkQualificationIsCanonicalAdoption: false,
    },
  }

  const canonicalResultIdentity = sha256(canonicalize(stableEvidence))
  const observation = {
    runId,
    environment: {
      os: platform(),
      osRelease: release(),
      arch: arch(),
      node: process.version,
    },
    candidateIdentityOutput,
    queryDurationsMs: Object.fromEntries(firstSuite.map((item) => [item.id, item.durationMs])),
    repeatedQueryDurationsMs: Object.fromEntries(secondSuite.map((item) => [item.id, item.durationMs])),
    astGrepSubprocessCount: firstSuite.length + secondSuite.length,
    resourceLimitations: [
      "peak memory not measured in this slice",
      "cross-platform candidate execution not measured in this slice",
      "Tree-sitter TypeScript parser execution blocked pending execution-security review",
      "SCIP TypeScript semantic generation not executed because no indexer is authorized",
      "LSP server execution not performed",
    ],
  }

  const result = {
    ...stableEvidence,
    canonicalResultIdentity: {
      scheme: "sha256-canonical-k3-r3-benchmark-v1",
      value: canonicalResultIdentity,
    },
    observation,
    overallStatus: astPass ? "BENCHMARK_EVIDENCE_READY_FOR_REVIEW" : "BENCHMARK_FAILED",
  }

  writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`, "utf8")
  if (!astPass) {
    throw new Error("ast-grep did not satisfy the claimed structural adapter acceptance checks")
  }
}

main()
