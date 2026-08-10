import assert from "node:assert/strict"
import { mkdtemp, readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { runCli } from "../src/cli.ts"

function capture(): { out: string[]; err: string[]; io: { stdout(line: string): void; stderr(line: string): void } } {
  const out: string[] = []
  const err: string[] = []
  return {
    out,
    err,
    io: {
      stdout(line) { out.push(line) },
      stderr(line) { err.push(line) },
    },
  }
}

test("kodac solve runs the bounded fixture loop but does not claim PROVEN READY", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "kodac-solve-workspace-"))
  const evidence = await mkdtemp(join(tmpdir(), "kodac-solve-evidence-"))
  const captured = capture()
  const code = await runCli(["solve", "inspect this", "--workspace", workspace, "--evidence-dir", evidence], captured.io, workspace)

  assert.equal(code, 0)
  assert.ok(captured.out.some((line) => line.includes("[fixture:fixture/deterministic-v1] inspect this")))
  assert.ok(captured.out.includes("NOT PROVEN READY — verification and Done Gate have not run"))
  assert.equal(captured.out.includes("PROVEN READY"), false)

  const evidenceLine = captured.out.find((line) => line.startsWith("Evidence: "))
  assert.ok(evidenceLine)
  const events = (await readFile(evidenceLine.slice("Evidence: ".length), "utf8")).trim().split("\n").map((line) => JSON.parse(line) as { type: string })
  assert.ok(events.some((event) => event.type === "agent.loop.started"))
  assert.ok(events.some((event) => event.type === "agent.loop.completed"))
  assert.equal(events.at(-1)?.type, "session.completed")
})
