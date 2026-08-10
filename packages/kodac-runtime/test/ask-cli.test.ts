import assert from "node:assert/strict"
import { mkdtemp, readFile } from "node:fs/promises"
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
