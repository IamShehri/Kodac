import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { readFile, mkdtemp } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { createLiveSolveFixture, LIVE_SOLVE_FIXTURE_TASK } from "../src/live-solve-fixture.ts"

function childEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env }
  delete env.NODE_TEST_CONTEXT
  return env
}

function run(executable: string, args: string[], cwd: string): { status: number; stdout: string; stderr: string } {
  const result = spawnSync(executable, args, { cwd, encoding: "utf8", windowsHide: true, shell: false, env: childEnv() })
  if (result.error) throw result.error
  return { status: result.status ?? 1, stdout: result.stdout ?? "", stderr: result.stderr ?? "" }
}

test("live-solve fixture is clean, deterministic, intentionally red, and scoped to one file", async () => {
  const root = await mkdtemp(join(tmpdir(), "kodac-real-live-fixture-"))
  const target = join(root, "repo")
  const result = await createLiveSolveFixture(target)

  assert.equal(result.workspace, target)
  assert.equal(result.manifest.protocol, "kodac.live-solve-fixture")
  assert.equal(result.manifest.version, 1)
  assert.equal(result.manifest.task, LIVE_SOLVE_FIXTURE_TASK)
  assert.deepEqual(result.manifest.allowedWritePaths, ["src/greeting.js"])
  assert.ok(result.manifest.protectedPaths.includes("test/greeting.test.js"))
  assert.match(result.manifest.fixtureDigest, /^[0-9a-f]{64}$/)

  const status = run("git", ["status", "--porcelain=v1", "--untracked-files=all"], target)
  assert.equal(status.status, 0)
  assert.equal(status.stdout, "")

  const baseline = run(process.execPath, ["--test", "test/greeting.test.js"], target)
  assert.notEqual(baseline.status, 0)
  assert.match(baseline.stderr + baseline.stdout, /Hello, Kodac!|greeting uses the required punctuation/)

  const source = await readFile(join(target, "src", "greeting.js"), "utf8")
  assert.match(source, /Hello \$\{name\}/)
  const manifest = JSON.parse(await readFile(result.manifestPath, "utf8")) as Record<string, unknown>
  assert.equal(manifest.protocol, "kodac.live-solve-fixture")
})

test("live-solve fixture creation refuses to overwrite an existing target", async () => {
  const root = await mkdtemp(join(tmpdir(), "kodac-real-live-fixture-existing-"))
  await assert.rejects(createLiveSolveFixture(root), /already exists/)
})
