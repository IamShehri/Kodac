import assert from "node:assert/strict"
import { mkdtemp, readFile, readdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { runCli } from "../src/cli.ts"
import { InMemoryEventSink } from "../src/protocol/event.ts"
import { RuntimeSession } from "../src/session/session.ts"
import { ToolRegistry } from "../src/tools/registry.ts"

function lines(text: string): unknown[] {
  return text.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line))
}

test("RuntimeSession emits versioned monotonic canonical events", async () => {
  const sink = new InMemoryEventSink()
  const session = new RuntimeSession(sink, "session-test")
  await session.start({ workspace: "/repo", command: "apply-patch" })
  await session.emit("tool.started", { tool: "repo.apply_patch" })
  assert.deepEqual(
    sink.events.map((event) => [event.protocol, event.version, event.sessionId, event.sequence, event.type]),
    [["kodac.event", 1, "session-test", 1, "session.started"], ["kodac.event", 1, "session-test", 2, "tool.started"]],
  )
})

test("ToolRegistry rejects duplicate canonical tool names", () => {
  const registry = new ToolRegistry()
  const tool = { name: "test.echo", capability: "test.echo", async execute(input: unknown) { return input } }
  registry.register(tool)
  assert.throws(() => registry.register(tool), /Tool already registered/)
})

test("CLI applies a patch through the canonical runtime spine without claiming proof", async () => {
  const root = await mkdtemp(join(tmpdir(), "kodac-cli-"))
  const workspace = join(root, "workspace")
  const evidence = join(root, "evidence")
  const patchFile = join(root, "task.patch")
  const { mkdir, writeFile } = await import("node:fs/promises")
  await mkdir(workspace, { recursive: true })
  await writeFile(patchFile, ["*** Begin Patch", "*** Add File: hello.txt", "+hello from kodac", "*** End Patch", ""].join("\n"), "utf8")
  const stdout: string[] = []
  const stderr: string[] = []
  const code = await runCli(
    ["apply-patch", patchFile, "--workspace", workspace, "--evidence-dir", evidence],
    { stdout: (line) => stdout.push(line), stderr: (line) => stderr.push(line) },
    root,
  )
  assert.equal(code, 0, stderr.join("\n"))
  assert.ok(stdout.includes("PATCH APPLIED — VERIFICATION NOT RUN"))
  assert.equal(stdout.includes("PROVEN READY"), false)
  assert.equal(await readFile(join(workspace, "hello.txt"), "utf8"), "hello from kodac")
  const sessions = await readdir(evidence)
  assert.equal(sessions.length, 1)
  const eventRows = lines(await readFile(join(evidence, sessions[0], "events.jsonl"), "utf8")) as Array<{ type: string; sequence: number }>
  const receiptRows = lines(await readFile(join(evidence, sessions[0], "receipts.jsonl"), "utf8")) as Array<{ result: { status: string; postStateDigest?: string } }>
  assert.deepEqual(eventRows.map((event) => event.type), ["session.started", "tool.started", "intent.created", "policy.evaluated", "receipt.recorded", "tool.completed", "session.completed"])
  assert.deepEqual(eventRows.map((event) => event.sequence), [1, 2, 3, 4, 5, 6, 7])
  assert.equal(receiptRows.length, 1)
  assert.equal(receiptRows[0].result.status, "success")
  assert.match(receiptRows[0].result.postStateDigest ?? "", /^[0-9a-f]{64}$/)
})
