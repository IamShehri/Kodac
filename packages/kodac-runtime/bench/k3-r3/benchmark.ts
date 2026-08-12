import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { readFileSync, writeFileSync } from "node:fs"
import { isAbsolute, relative, resolve } from "node:path"
import { arch, platform, release } from "node:os"
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
    start: {
      line: number
      column: number
    }
    end: {
      line: number
      column: number
    }
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
    adapterConfig: "k3-r3-ast-grep-structural-v1"
  }
}

interface QueryObservation {
  id: string
  pattern: string
  matches: NormalizedMatch[]
  durationMs: number
}

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

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value)
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalize(item)).join(",")}]`
  }

  const record = value as Record<string, unknown>
  const keys = Object.keys(record).sort()
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`).join(",")}}`
}

function normalizeText(bytes: Buffer): Buffer {
  return Buffer.from(bytes.toString("utf8").replace(/\r\n?/g, "\n"), "utf8")
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
  const relativePath = relative(fixtureRoot, absolutePath)
  if (
    relativePath === ".." ||
    relativePath.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) ||
    isAbsolute(relativePath)
  ) {
    throw new Error(`Rejected fixture path escape: ${input}`)
  }

  return segments.join("/")
}

function normalizeCandidatePath(input: string, fixtureRoot: string): string {
  const absoluteInput = isAbsolute(input) ? input : resolve(fixtureRoot, input)
  const relativeInput = relative(fixtureRoot, absoluteInput).replaceAll("\\", "/")
  return normalizeRelativePath(relativeInput, fixtureRoot)
}

function compareStringSets(actual: string[], expected: string[]): boolean {
  const left = [...new Set(actual)].sort()
  const right = [...new Set(expected)].sort()
  return canonicalize(left) === canonicalize(right)
}

function precisionRecall(
  observed: Array<{ path: string; line: number }>,
  expected: Array<{ path: string; line: number }>,
): { precision: number; recall: number; truePositive: number; observed: number; expected: number } {
  const observedSet = new Set(observed.map((item) => `${item.path}:${item.line}`))
  const expectedSet = new Set(expected.map((item) => `${item.path}:${item.line}`))
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
    const bytes = readFileSync(resolve(fixtureRoot, path))
    const canonicalBytes = expected.kind === "binary" ? bytes : normalizeText(bytes)
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
    throw new Error(
      `ast-grep query ${id} failed with status ${result.status}: ${result.stderr || result.stdout}`,
    )
  }

  const parsed = JSON.parse(result.stdout) as AstGrepRawMatch[]
  if (!Array.isArray(parsed)) {
    throw new Error(`ast-grep query ${id} did not return a JSON array`)
  }

  const compareCodeUnits = (left: string, right: string): number =>
    left < right ? -1 : left > right ? 1 : 0

  const matches = parsed
    .map((match): NormalizedMatch => {
      const path = normalizeCandidatePath(match.file, fixtureRoot)
      return {
        path,
        line: match.range.start.line + 1,
        column: match.range.start.column + 1,
        text: match.text,
        evidenceClass: "parser-derived",
        source: {
          candidate: "ast-grep",
          version,
          artifactSha256,
          adapterConfig: "k3-r3-ast-grep-structural-v1",
        },
      }
    })
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
  const fixtureRoot = resolve(requiredEnv("K3_R3_FIXTURE_ROOT"))
  const workspaceRoot = resolve(requiredEnv("K3_R3_WORKSPACE_ROOT"))
  const resultPath = requiredEnv("K3_R3_RESULT_PATH")
  const baselineSha = requiredEnv("K3_R3_BASELINE_SHA")
  const headSha = requiredEnv("K3_R3_HEAD_SHA")
  const protocolId = requiredEnv("K3_R3_PROTOCOL_ID")
  const manifestBlob = requiredEnv("K3_R3_FIXTURE_MANIFEST_BLOB")
  const runId = requiredEnv("K3_R3_RUN_ID")

  const astGrepBin = requiredEnv("AST_GREP_BIN")
  const astGrepVersion = requiredEnv("AST_GREP_VERSION")
  const astGrepSha = requiredEnv("AST_GREP_SHA256")
  const treeSitterBin = requiredEnv("TREE_SITTER_BIN")
  const treeSitterVersion = requiredEnv("TREE_SITTER_VERSION")
  const treeSitterSha = requiredEnv("TREE_SITTER_SHA256")
  const treeSitterTypeScriptCommit = requiredEnv("TREE_SITTER_TYPESCRIPT_COMMIT")
  const scipBin = requiredEnv("SCIP_BIN")
  const scipVersion = requiredEnv("SCIP_VERSION")
  const scipSha = requiredEnv("SCIP_SHA256")
  const lspSpecVersion = requiredEnv("LSP_SPEC_VERSION")

  const fixtureRelative = relative(workspaceRoot, fixtureRoot)
  if (fixtureRelative === ".." || fixtureRelative.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)) {
    throw new Error("Fixture root must remain inside the checked-out workspace")
  }

  const manifestPath = resolve(fixtureRoot, "manifest.json")
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as FixtureManifest
  if (manifest.fixture_id !== "k3-r1-core-repository-v1") {
    throw new Error(`Unexpected fixture id: ${manifest.fixture_id}`)
  }
  if (manifest.schema_version !== "k3-r1-gold-evidence-v1") {
    throw new Error(`Unexpected fixture schema: ${manifest.schema_version}`)
  }

  const fixtureBefore = verifyFixture(manifest, fixtureRoot)

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
  let symlinkTargetRejected = false
  try {
    normalizeRelativePath(symlinkCase.symlink_target, fixtureRoot)
  } catch {
    symlinkTargetRejected = true
  }
  if (!symlinkTargetRejected) {
    throw new Error("Canonical symlink target escape was not rejected")
  }

  const queryConfigs = [
    { id: "symbol-add", pattern: "add" },
    { id: "symbol-meaning", pattern: "meaning" },
    { id: "symbol-widget", pattern: "Widget" },
  ] as const

  const runSuite = (): QueryObservation[] =>
    queryConfigs.map((query) =>
      runAstGrepQuery(
        astGrepBin,
        fixtureRoot,
        astGrepVersion,
        astGrepSha,
        query.id,
        query.pattern,
      ),
    )

  const firstSuite = runSuite()
  const secondSuite = runSuite()
  const deterministic =
    canonicalize(stableAstSuite(firstSuite)) === canonicalize(stableAstSuite(secondSuite))
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
      .map((item) => ({ path: item.path, line: item.line })),
    ...manifest.gold.references
      .filter((item) => item.symbol === "add")
      .map((item) => ({ path: item.path, line: item.line })),
  ]
  const observedAddOccurrences = query("symbol-add").matches.map((item) => ({
    path: item.path,
    line: item.line,
  }))

  const expectedMeaningOccurrences = manifest.gold.definitions
    .filter((item) => item.symbol === "meaning")
    .map((item) => ({ path: item.path, line: item.line }))
  const observedMeaningOccurrences = query("symbol-meaning").matches.map((item) => ({
    path: item.path,
    line: item.line,
  }))

  const addOccurrenceMetrics = precisionRecall(observedAddOccurrences, expectedAddOccurrences)
  const meaningOccurrenceMetrics = precisionRecall(
    observedMeaningOccurrences,
    expectedMeaningOccurrences,
  )

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
      item.source.artifactSha256 === astGrepSha &&
      item.source.adapterConfig === "k3-r3-ast-grep-structural-v1",
  )
  if (!provenanceComplete) {
    throw new Error("Benchmark evidence provenance is incomplete")
  }

  const fixtureAfter = verifyFixture(manifest, fixtureRoot)
  const fixtureUnchanged = fixtureBefore.digest === fixtureAfter.digest
  if (!fixtureUnchanged) {
    throw new Error("Fixture identity changed during benchmark execution")
  }

  const astPass =
    addOccurrenceMetrics.precision === 1 &&
    addOccurrenceMetrics.recall === 1 &&
    meaningOccurrenceMetrics.precision === 1 &&
    meaningOccurrenceMetrics.recall === 1 &&
    ambiguityPreserved &&
    deterministic &&
    provenanceComplete &&
    fixtureUnchanged

  const stableEvidence = {
    schemaVersion: "k3-r3-benchmark-evidence-v1",
    protocolId,
    canonicalBaseline: baselineSha,
    benchmarkHead: headSha,
    fixture: {
      id: manifest.fixture_id,
      schemaVersion: manifest.schema_version,
      manifestGitBlob: manifestBlob,
      contentIdentity: fixtureBefore.digest,
      verifiedFileCount: fixtureBefore.verifiedFileCount,
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
      artifactSha256: astGrepSha,
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
      qualifiedRole: astPass
        ? "structural symbol occurrence and ambiguous-candidate discovery"
        : null,
    },
    treeSitter: {
      candidate: "Tree-sitter",
      version: treeSitterVersion,
      artifactSha256: treeSitterSha,
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
      artifactSha256: scipSha,
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
      snapshotFreshnessGuard: fixtureUnchanged,
      evidenceSourceProvenanceCompleteness: provenanceComplete,
      unauthorizedWorkspaceMutationsObservedByHarness: 0,
      pathEscapesObserved: 0,
      canonicalTraversalCaseRejected: traversalRejected,
      canonicalSymlinkTargetEscapeRejected: symlinkTargetRejected,
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
    candidateIdentityOutput: {
      astGrep: candidateIdentity(astGrepBin, fixtureRoot),
      treeSitter: candidateIdentity(treeSitterBin, fixtureRoot),
      scip: candidateIdentity(scipBin, fixtureRoot),
      lsp: `protocol-spec-${lspSpecVersion}-no-server-executed`,
    },
    queryDurationsMs: Object.fromEntries(
      firstSuite.map((item) => [item.id, item.durationMs]),
    ),
    repeatedQueryDurationsMs: Object.fromEntries(
      secondSuite.map((item) => [item.id, item.durationMs]),
    ),
    astGrepSubprocessCount: firstSuite.length + secondSuite.length,
    resourceLimitations: [
      "peak memory not measured in this slice",
      "cross-platform candidate execution not measured in this slice",
      "Tree-sitter TypeScript parser execution blocked pending execution-security review",
      "SCIP TypeScript semantic generation not executed because no indexer is authorized",
      "LSP server execution not performed",
      "external-tool symlink-following behavior not directly exercised by the current fixture",
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
