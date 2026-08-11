import { createHash } from "node:crypto"
import { posix } from "node:path"
import { NodeWorkspaceFileSystem } from "../edit/filesystem.ts"
import type { VerificationCommandSpec } from "./types.ts"

export type VerificationRisk = "low" | "medium" | "high"

export interface VerificationPlan {
  protocol: "kodac.verification-plan"
  version: 1
  generatedAt: string
  workspace: string
  risk: VerificationRisk
  budget: {
    maxCommands: number
    maxTotalTimeoutMs: number
  }
  signals: string[]
  changedPaths: string[]
  commands: VerificationCommandSpec[]
  warnings: string[]
  planDigest: string
}

export interface VerificationPlannerInput {
  workspace: string
  changedPaths?: string[]
  manualCommands?: VerificationCommandSpec[]
}

type PackageManager = "npm" | "pnpm" | "yarn" | "bun"

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

function portableDir(path: string): string {
  const dir = posix.dirname(path)
  return dir === "" ? "." : dir
}

function childPath(dir: string, name: string): string {
  return dir === "." ? name : `${dir}/${name}`
}

function commandId(prefix: string, dir: string, suffix: string): string {
  const label = dir === "." ? "root" : dir.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 24) || "project"
  return `${prefix}-${label}-${suffix}-${sha256(dir).slice(0, 6)}`.slice(0, 64)
}

function classifyRisk(paths: string[]): VerificationRisk {
  if (paths.length === 0) return "medium"
  const normalized = paths.map((path) => path.toLowerCase())
  const highRisk = normalized.some((path) =>
    path.startsWith(".github/workflows/") ||
    path.includes("security") ||
    path.includes("auth") ||
    /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|pyproject\.toml|cargo\.toml|go\.mod)$/.test(path),
  )
  if (highRisk) return "high"
  const docsOnly = normalized.every((path) =>
    path.startsWith("docs/") || /\.(md|mdx|rst|txt|adoc)$/.test(path),
  )
  return docsOnly ? "low" : "medium"
}

function budgetFor(risk: VerificationRisk): VerificationPlan["budget"] {
  if (risk === "high") return { maxCommands: 8, maxTotalTimeoutMs: 360_000 }
  if (risk === "low") return { maxCommands: 4, maxTotalTimeoutMs: 120_000 }
  return { maxCommands: 6, maxTotalTimeoutMs: 240_000 }
}

async function detectPackageManager(fs: NodeWorkspaceFileSystem, dir: string, packageManagerField: unknown): Promise<PackageManager> {
  if (typeof packageManagerField === "string") {
    if (packageManagerField.startsWith("pnpm@")) return "pnpm"
    if (packageManagerField.startsWith("yarn@")) return "yarn"
    if (packageManagerField.startsWith("bun@")) return "bun"
    if (packageManagerField.startsWith("npm@")) return "npm"
  }
  if (await fs.exists(childPath(dir, "pnpm-lock.yaml"))) return "pnpm"
  if (await fs.exists(childPath(dir, "yarn.lock"))) return "yarn"
  if (await fs.exists(childPath(dir, "bun.lock")) || await fs.exists(childPath(dir, "bun.lockb"))) return "bun"
  return "npm"
}

function tokenizeDirectNodeScript(body: string): string[] | undefined {
  if (/[;&|><`$\n\r]/.test(body)) return undefined
  const tokens: string[] = []
  let current = ""
  let quote: "'" | "\"" | undefined
  for (let index = 0; index < body.length; index++) {
    const char = body[index]
    if (quote) {
      if (char === quote) quote = undefined
      else current += char
      continue
    }
    if (char === "'" || char === "\"") {
      quote = char
      continue
    }
    if (/\s/.test(char)) {
      if (current) {
        tokens.push(current)
        current = ""
      }
      continue
    }
    current += char
  }
  if (quote) return undefined
  if (current) tokens.push(current)
  if (tokens[0] !== "node" || tokens.length < 2) return undefined
  return tokens.slice(1)
}

function directNodeScriptSpec(
  dir: string,
  script: string,
  body: string,
  category: VerificationCommandSpec["category"],
): VerificationCommandSpec | undefined {
  const nodeArgs = tokenizeDirectNodeScript(body)
  if (!nodeArgs) return undefined
  const args = dir === "." ? nodeArgs : nodeArgs.map((arg, index) => {
    if (index !== 0 || arg.startsWith("-") || posix.isAbsolute(arg)) return arg
    return childPath(dir, arg)
  })
  return {
    id: commandId("js", dir, script.replace(/[^a-z0-9]+/gi, "-")),
    category,
    executable: "node",
    args,
    timeoutMs: category === "tests" ? 120_000 : 60_000,
    maxOutputBytes: 1024 * 1024,
  }
}

function findScript(scripts: Record<string, unknown>, candidates: string[]): string | undefined {
  for (const candidate of candidates) if (typeof scripts[candidate] === "string") return candidate
  return undefined
}

async function packageCommands(
  fs: NodeWorkspaceFileSystem,
  manifest: string,
  signals: string[],
  warnings: string[],
): Promise<VerificationCommandSpec[]> {
  const dir = portableDir(manifest)
  const raw = await fs.readTextBounded(manifest, 128 * 1024)
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    warnings.push(`Ignored invalid package.json: ${manifest}`)
    return []
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return []
  const record = parsed as Record<string, unknown>
  const scriptsValue = record.scripts
  const scripts = scriptsValue && typeof scriptsValue === "object" && !Array.isArray(scriptsValue)
    ? scriptsValue as Record<string, unknown>
    : {}
  const manager = await detectPackageManager(fs, dir, record.packageManager)
  signals.push(`${manifest}:javascript:${manager}`)
  const commands: VerificationCommandSpec[] = []
  const candidates: Array<{ script: string | undefined; category: VerificationCommandSpec["category"] }> = [
    { script: findScript(scripts, ["typecheck", "type-check", "check:types", "types"]), category: "types" },
    { script: findScript(scripts, ["lint", "check:lint"]), category: "lint" },
    { script: findScript(scripts, ["test", "test:unit", "test:ci"]), category: "tests" },
  ]
  for (const candidate of candidates) {
    if (!candidate.script) continue
    const body = scripts[candidate.script]
    if (typeof body !== "string") continue
    if (candidate.category === "tests" && /no test specified/i.test(body)) {
      warnings.push(`Ignored placeholder test script in ${manifest}`)
      continue
    }
    const spec = directNodeScriptSpec(dir, candidate.script, body, candidate.category)
    if (spec) commands.push(spec)
    else warnings.push(`Detected ${candidate.script} in ${manifest}, but K2-S7 refused auto-execution because it is not a direct no-shell Node recipe.`)
  }
  return commands
}

async function pythonCommands(
  fs: NodeWorkspaceFileSystem,
  manifest: string,
  signals: string[],
): Promise<VerificationCommandSpec[]> {
  const dir = portableDir(manifest)
  const raw = await fs.readTextBounded(manifest, 256 * 1024)
  signals.push(`${manifest}:python`)
  const target = dir === "." ? "." : dir
  const commands: VerificationCommandSpec[] = []
  if (/\bpytest\b/i.test(raw)) {
    commands.push({
      id: commandId("python", dir, "tests"),
      category: "tests",
      executable: "python",
      args: dir === "." ? ["-m", "pytest", "-q"] : ["-m", "pytest", "-q", target],
      timeoutMs: 120_000,
      maxOutputBytes: 1024 * 1024,
    })
  }
  if (/\bmypy\b/i.test(raw)) {
    commands.push({
      id: commandId("python", dir, "types"),
      category: "types",
      executable: "python",
      args: ["-m", "mypy", target],
      timeoutMs: 90_000,
      maxOutputBytes: 1024 * 1024,
    })
  }
  if (/\bruff\b/i.test(raw)) {
    commands.push({
      id: commandId("python", dir, "lint"),
      category: "lint",
      executable: "python",
      args: ["-m", "ruff", "check", target],
      timeoutMs: 60_000,
      maxOutputBytes: 1024 * 1024,
    })
  }
  return commands
}

function cargoCommands(manifest: string, signals: string[]): VerificationCommandSpec[] {
  const dir = portableDir(manifest)
  signals.push(`${manifest}:rust`)
  return [
    {
      id: commandId("cargo", dir, "check"),
      category: "types",
      executable: "cargo",
      args: ["check", "--manifest-path", manifest],
      timeoutMs: 120_000,
      maxOutputBytes: 1024 * 1024,
    },
    {
      id: commandId("cargo", dir, "test"),
      category: "tests",
      executable: "cargo",
      args: ["test", "--manifest-path", manifest],
      timeoutMs: 120_000,
      maxOutputBytes: 1024 * 1024,
    },
  ]
}

function goCommands(manifest: string, signals: string[], warnings: string[]): VerificationCommandSpec[] {
  const dir = portableDir(manifest)
  signals.push(`${manifest}:go`)
  if (dir !== ".") {
    warnings.push(`Detected nested Go module but deferred auto-execution for K2-S7: ${manifest}`)
    return []
  }
  return [
    {
      id: commandId("go", dir, "vet"),
      category: "lint",
      executable: "go",
      args: ["vet", "./..."],
      timeoutMs: 90_000,
      maxOutputBytes: 1024 * 1024,
    },
    {
      id: commandId("go", dir, "test"),
      category: "tests",
      executable: "go",
      args: ["test", "./..."],
      timeoutMs: 120_000,
      maxOutputBytes: 1024 * 1024,
    },
  ]
}

function uniqueCommands(commands: VerificationCommandSpec[]): VerificationCommandSpec[] {
  const ids = new Set<string>()
  const unique: VerificationCommandSpec[] = []
  for (const command of commands) {
    if (ids.has(command.id)) continue
    ids.add(command.id)
    unique.push(command)
  }
  return unique
}

function selectCommands(
  automatic: VerificationCommandSpec[],
  manual: VerificationCommandSpec[],
  maxCommands: number,
): VerificationCommandSpec[] {
  if (manual.length > maxCommands) throw new Error(`Manual verification commands exceed planner budget (${maxCommands})`)
  const manualIds = new Set(manual.map((command) => command.id))
  if (manualIds.size !== manual.length) throw new Error("Duplicate manual verification command id")
  const auto = uniqueCommands(automatic).filter((command) => !manualIds.has(command.id))
  const priority: Record<VerificationCommandSpec["category"], number> = {
    tests: 0,
    types: 1,
    lint: 2,
    syntax: 3,
    custom: 4,
  }
  auto.sort((left, right) => priority[left.category] - priority[right.category] || left.id.localeCompare(right.id))
  return [...manual, ...auto.slice(0, maxCommands - manual.length)]
}

export async function planVerification(input: VerificationPlannerInput): Promise<VerificationPlan> {
  const fs = new NodeWorkspaceFileSystem(input.workspace)
  const entries = await fs.list(".", { recursive: true, maxEntries: 700, maxDepth: 5 })
  const files = entries.filter((entry) => entry.type === "file").map((entry) => entry.path)
  const signals: string[] = []
  const warnings: string[] = []
  const automatic: VerificationCommandSpec[] = []

  for (const path of files.filter((path) => posix.basename(path) === "package.json")) {
    automatic.push(...await packageCommands(fs, path, signals, warnings))
  }
  for (const path of files.filter((path) => posix.basename(path) === "pyproject.toml")) {
    automatic.push(...await pythonCommands(fs, path, signals))
  }
  for (const path of files.filter((path) => posix.basename(path) === "Cargo.toml")) {
    automatic.push(...cargoCommands(path, signals))
  }
  for (const path of files.filter((path) => posix.basename(path) === "go.mod")) {
    automatic.push(...goCommands(path, signals, warnings))
  }
  for (const path of files.filter((path) => path.startsWith(".github/workflows/") && /\.ya?ml$/i.test(path))) {
    signals.push(`${path}:ci-workflow`)
  }

  const changedPaths = [...new Set(input.changedPaths ?? [])].sort()
  const risk = classifyRisk(changedPaths)
  const budget = budgetFor(risk)
  const commands = selectCommands(automatic, input.manualCommands ?? [], budget.maxCommands)
  if (signals.length === 0) warnings.push("No supported verification manifest or CI workflow was detected.")
  if (!commands.some((command) => command.category === "tests")) {
    warnings.push("No tests-category verification command could be planned; Done Gate will remain NOT_READY.")
  }
  const totalTimeout = commands.reduce((sum, command) => sum + (command.timeoutMs ?? 30_000), 0)
  if (totalTimeout > budget.maxTotalTimeoutMs) {
    warnings.push(`Planned command timeouts (${totalTimeout}ms) exceed the ${risk}-risk aggregate budget (${budget.maxTotalTimeoutMs}ms).`)
  }
  const stable = {
    risk,
    budget,
    signals: [...new Set(signals)].sort(),
    changedPaths,
    commands,
    warnings,
  }
  return {
    protocol: "kodac.verification-plan",
    version: 1,
    generatedAt: new Date().toISOString(),
    workspace: fs.root,
    ...stable,
    planDigest: sha256(JSON.stringify(stable)),
  }
}
