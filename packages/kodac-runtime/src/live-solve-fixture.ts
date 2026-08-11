import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { mkdir, stat, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

export const LIVE_SOLVE_FIXTURE_TASK =
  "Fix src/greeting.js so the existing test passes. You may modify only src/greeting.js. Do not create, delete, move, or modify any other file. Keep the change minimal."

export interface LiveSolveFixtureManifest {
  protocol: "kodac.live-solve-fixture"
  version: 1
  task: string
  allowedWritePaths: string[]
  protectedPaths: string[]
  baseline: {
    gitStatus: "clean"
    testCommand: string[]
    expectedTestResult: "FAIL"
  }
  target: {
    expectedTestResult: "PASS"
    expectedGreeting: string
  }
  fixtureDigest: string
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

function childEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env }
  delete env.NODE_TEST_CONTEXT
  return env
}

function run(executable: string, args: string[], cwd: string, allowFailure = false): { status: number; stdout: string; stderr: string } {
  const result = spawnSync(executable, args, {
    cwd,
    encoding: "utf8",
    windowsHide: true,
    shell: false,
    env: childEnv(),
  })
  if (result.error) throw result.error
  const status = result.status ?? 1
  const stdout = result.stdout ?? ""
  const stderr = result.stderr ?? ""
  if (!allowFailure && status !== 0) {
    throw new Error(`${executable} ${args.join(" ")} failed (${status}): ${(stderr || stdout).trim()}`)
  }
  return { status, stdout, stderr }
}

async function assertTargetAbsent(target: string): Promise<void> {
  try {
    await stat(target)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return
    throw error
  }
  throw new Error(`Live-solve fixture target already exists; refusing to overwrite: ${target}`)
}

export async function createLiveSolveFixture(targetPath: string): Promise<{ workspace: string; manifestPath: string; manifest: LiveSolveFixtureManifest }> {
  const workspace = resolve(targetPath)
  await assertTargetAbsent(workspace)
  await mkdir(`${workspace}/src`, { recursive: true })
  await mkdir(`${workspace}/test`, { recursive: true })

  const packageJson = `${JSON.stringify({
    name: "kodac-controlled-live-solve-fixture",
    version: "1.0.0",
    private: true,
    type: "module",
    scripts: { test: "node --test test/greeting.test.js" },
  }, null, 2)}\n`
  const source = "export function greeting(name) {\n  return `Hello ${name}`\n}\n"
  const testSource = [
    "import assert from \"node:assert/strict\"",
    "import test from \"node:test\"",
    "import { greeting } from \"../src/greeting.js\"",
    "",
    "test(\"greeting uses the required punctuation\", () => {",
    "  assert.equal(greeting(\"Kodac\"), \"Hello, Kodac!\")",
    "})",
    "",
  ].join("\n")
  const readme = [
    "# Kodac Controlled Live Solve Fixture",
    "",
    "This repository is intentionally tiny and starts with one failing test.",
    "",
    "Authorized task:",
    "",
    LIVE_SOLVE_FIXTURE_TASK,
    "",
    "The controlled live solve must be authorized with exact write scope `src/greeting.js`.",
    "",
  ].join("\n")

  const fixtureDigest = sha256([packageJson, source, testSource, readme, LIVE_SOLVE_FIXTURE_TASK].join("\u0000"))
  const manifest: LiveSolveFixtureManifest = {
    protocol: "kodac.live-solve-fixture",
    version: 1,
    task: LIVE_SOLVE_FIXTURE_TASK,
    allowedWritePaths: ["src/greeting.js"],
    protectedPaths: [".kodac-live-fixture.json", "README.md", "package.json", "test/greeting.test.js"],
    baseline: {
      gitStatus: "clean",
      testCommand: ["node", "--test", "test/greeting.test.js"],
      expectedTestResult: "FAIL",
    },
    target: {
      expectedTestResult: "PASS",
      expectedGreeting: "Hello, Kodac!",
    },
    fixtureDigest,
  }
  const manifestPath = `${workspace}/.kodac-live-fixture.json`

  await Promise.all([
    writeFile(`${workspace}/package.json`, packageJson, "utf8"),
    writeFile(`${workspace}/src/greeting.js`, source, "utf8"),
    writeFile(`${workspace}/test/greeting.test.js`, testSource, "utf8"),
    writeFile(`${workspace}/README.md`, readme, "utf8"),
    writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8"),
  ])

  const baseline = run(process.execPath, ["--test", "test/greeting.test.js"], workspace, true)
  if (baseline.status === 0) throw new Error("Live-solve fixture baseline test unexpectedly passes; fixture must begin red.")

  run("git", ["init", "--initial-branch=main"], workspace)
  run("git", ["config", "user.name", "Kodac Fixture"], workspace)
  run("git", ["config", "user.email", "fixture@kodac.invalid"], workspace)
  run("git", ["config", "commit.gpgsign", "false"], workspace)
  run("git", ["config", "core.autocrlf", "false"], workspace)
  run("git", ["add", "--all"], workspace)
  run("git", ["commit", "-m", "chore: establish Kodac controlled live-solve fixture"], workspace)
  const status = run("git", ["status", "--porcelain=v1", "--untracked-files=all"], workspace)
  if (status.stdout !== "") throw new Error("Live-solve fixture Git baseline is not clean after initialization.")

  return { workspace, manifestPath, manifest }
}

export async function runLiveSolveFixtureCli(argv: string[]): Promise<number> {
  try {
    const target = argv[0]
    if (!target) throw new Error("Usage: kodac live-fixture <new-directory> [--json]")
    const json = argv.slice(1).includes("--json")
    const unknown = argv.slice(1).filter((token) => token !== "--json")
    if (unknown.length > 0) throw new Error(`Unknown live-fixture option: ${unknown[0]}`)
    const result = await createLiveSolveFixture(target)
    if (json) {
      process.stdout.write(`${JSON.stringify({ status: "FIXTURE_READY", ...result })}\n`)
    } else {
      process.stdout.write(`Fixture ready: ${result.workspace}\n`)
      process.stdout.write(`Task: ${result.manifest.task}\n`)
      process.stdout.write(`Allowed write path: ${result.manifest.allowedWritePaths.join(", ")}\n`)
      process.stdout.write(`Manifest: ${result.manifestPath}\n`)
      process.stdout.write("Baseline test: EXPECTED FAIL\n")
    }
    return 0
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    return 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exitCode = await runLiveSolveFixtureCli(process.argv.slice(2))
}
