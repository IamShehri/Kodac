import assert from "node:assert/strict"
import { mkdtemp, readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { runCli } from "../src/cli.ts"

function capture(): { out: string[]; err: string[]; io: { stdout(line: string): void; stderr(line: string): void } } {
  const out: string[] = []
  const err: string[] = []
  return { out, err, io: { stdout(line) { out.push(line) }, stderr(line) { err.push(line) } } }
}

test("kodac solve refuses Done Gate proof when verification evidence is absent", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "kodac-solve-workspace-"))
  const evidence = await mkdtemp(join(tmpdir(), "kodac-solve-evidence-"))
  const captured = capture()
  const code = await runCli(["solve", "inspect this", "--workspace", workspace, "--evidence-dir", evidence], captured.io, workspace)
  assert.equal(code, 3)
  assert.ok(captured.out.some((line) => line.includes("[fixture:fixture/deterministic-v1] inspect this")))
  assert.ok(captured.out.includes("NOT READY"))
  assert.equal(captured.out.includes("PROVEN READY"), false)
  const proofLine = captured.out.find((line) => line.startsWith("Proof: "))
  assert.ok(proofLine)
  const proof = JSON.parse(await readFile(proofLine.slice("Proof: ".length), "utf8")) as { doneGate: { status: string } }
  assert.equal(proof.doneGate.status, "NOT_READY")
})
