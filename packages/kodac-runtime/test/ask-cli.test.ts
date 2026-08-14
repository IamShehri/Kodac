import assert from "node:assert/strict"
import { mkdtemp, readFile, readdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { runCli } from "../src/cli.ts"

test("kodac ask persists the exact model-visible request snapshot and keeps response evidence coarse", async () => {
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

  const eventsText = await readFile(payload.evidence.events, "utf8")
  const events = eventsText.trim().split("\n").map((line) => JSON.parse(line)) as Array<{
    type: string
    payload: Record<string, unknown>
  }>
  const snapshot = events.find((event) => event.type === "model.request.snapshot")
  assert.ok(snapshot)
  assert.equal(snapshot.payload.provider, "fixture")
  assert.equal(snapshot.payload.model, "fixture/deterministic-v1")
  assert.deepEqual(snapshot.payload.messages, [{ role: "user", content: "hello kodac" }])
  assert.deepEqual(snapshot.payload.tools, [])
  assert.ok(events.some((event) => event.type === "model.requested"))
  assert.ok(events.some((event) => event.type === "model.responded"))
  assert.ok(events.some((event) => event.type === "assistant.message"))

  const coarseEvents = events.filter((event) => event.type !== "model.request.snapshot")
  assert.equal(JSON.stringify(coarseEvents).includes("hello kodac"), false)
  assert.equal(JSON.stringify(coarseEvents).includes("[fixture:fixture/deterministic-v1] hello kodac"), false)
})

test("kodac ask records session.failed without persisting an undispatched private prompt", async () => {
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
  assert.equal(events.includes("model.request.snapshot"), false)
  assert.equal(events.includes("private prompt"), false)
})
