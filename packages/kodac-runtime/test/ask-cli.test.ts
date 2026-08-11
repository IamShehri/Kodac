import assert from "node:assert/strict"
import { mkdtemp, readFile, readdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { runCli } from "../src/cli.ts"

test("kodac ask runs through the fixture provider and persists model events", async () => {
  const root = await mkdtemp(join(tmpdir(), "kodac-ask-"))
  const evidence = join(root, "evidence")
  const stdout: string[] = []
  const stderr: string[] = []
  const code = await runCli(
    ["ask", "hello kodac", "--workspace", root, "--evidence-dir", evidence, "--json"],
    { stdout: (line) => stdout.push(line), stderr: (line) => stderr.push(line) },
    root,
  )

  assert.equal(code, 0)
  assert.deepEqual(stderr, [])
  const payload = JSON.parse(stdout[0]) as {
    status: string
    assistant: string
    evidence: { events: string }
  }
  assert.equal(payload.status, "COMPLETE")
  assert.equal(payload.assistant, "[fixture:fixture/deterministic-v1] hello kodac")
  const events = await readFile(payload.evidence.events, "utf8")
  assert.match(events, /model.requested/)
  assert.match(events, /model.responded/)
  assert.match(events, /assistant.message/)
  assert.equal(events.includes("hello kodac"), false)
})

test("kodac ask records session.failed when provider selection fails", async () => {
  const root = await mkdtemp(join(tmpdir(), "kodac-ask-fail-"))
  const evidence = join(root, "evidence")
  const stdout: string[] = []
  const stderr: string[] = []
  const code = await runCli(
    ["ask", "private prompt", "--provider", "missing", "--workspace", root, "--evidence-dir", evidence],
    { stdout: (line) => stdout.push(line), stderr: (line) => stderr.push(line) },
    root,
  )

  assert.equal(code, 1)
  assert.deepEqual(stdout, [])
  assert.match(stderr[0], /Unknown provider: missing/)
  const sessionDirs = await readdir(evidence)
  assert.equal(sessionDirs.length, 1)
  const events = await readFile(join(evidence, sessionDirs[0], "events.jsonl"), "utf8")
  assert.match(events, /session.started/)
  assert.match(events, /session.failed/)
  assert.equal(events.includes("private prompt"), false)
})
