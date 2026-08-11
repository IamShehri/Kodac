import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"

import { runCli } from "../src/cli.ts"
import type { ModelProvider, ModelProviderRequest, ModelProviderResponse } from "../src/model/provider.ts"

class ScriptedProvider implements ModelProvider {
  readonly name = "fixture"
  private readonly responses: ModelProviderResponse[]
  constructor(responses: ModelProviderResponse[]) { this.responses = responses }
  async generate(_request: ModelProviderRequest): Promise<ModelProviderResponse> {
    const response = this.responses.shift()
    if (!response) throw new Error("No scripted response remains")
    return response
  }
}

function capture(): { out: string[]; err: string[]; io: { stdout(line: string): void; stderr(line: string): void } } {
  const out: string[] = []
  const err: string[] = []
  return { out, err, io: { stdout(line) { out.push(line) }, stderr(line) { err.push(line) } } }
}

test("kodac solve prints PROVEN READY only after Done Gate passes with durable evidence", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "kodac-s6-ready-workspace-"))
  const evidence = await mkdtemp(join(tmpdir(), "kodac-s6-ready-evidence-"))
  try {
    execFileSync("git", ["init", "-q"], { cwd: workspace })
    execFileSync("git", ["config", "user.email", "kodac-test@example.com"], { cwd: workspace })
    execFileSync("git", ["config", "user.name", "Kodac Test"], { cwd: workspace })
    await writeFile(join(workspace, "note.txt"), "alpha\n", "utf8")
    await writeFile(join(workspace, "verify.test.js"), "import assert from 'node:assert/strict'; import { readFile } from 'node:fs/promises'; import test from 'node:test'; test('note', async () => assert.equal(await readFile('note.txt','utf8'), 'ALPHA\\n'));\n", "utf8")
    execFileSync("git", ["add", "note.txt", "verify.test.js"], { cwd: workspace })
    execFileSync("git", ["commit", "-qm", "fixture"], { cwd: workspace })

    const patchText = "*** Begin Patch\n*** Update File: note.txt\n@@\n-alpha\n+ALPHA\n*** End Patch"
    const provider = new ScriptedProvider([
      { assistant: "", finishReason: "tool_calls", toolCalls: [{ id: "patch-1", name: "repo.apply_patch", input: { patchText } }] },
      { assistant: "done", finishReason: "stop", toolCalls: [] },
    ])
    const command = JSON.stringify({ id: "tests", category: "tests", executable: "node", args: ["--test", "verify.test.js"] })
    const captured = capture()
    const code = await runCli(
      ["solve", "update note", "--workspace", workspace, "--evidence-dir", evidence, "--approve-writes", "--approve-verification", "--verify-command", command],
      captured.io,
      workspace,
      { modelProvider: provider },
    )
    assert.equal(code, 0, captured.err.join("\n"))
    assert.ok(captured.out.includes("PROVEN READY"))
    assert.equal(captured.out.includes("NOT READY"), false)
    const proofLine = captured.out.find((line) => line.startsWith("Proof: "))
    assert.ok(proofLine)
    const proof = JSON.parse(await readFile(proofLine.slice("Proof: ".length), "utf8")) as {
      protocol: string
      doneGate: { status: string; evidence: unknown[] }
      verification: { checks: Array<{ id: string; status: string }> }
    }
    assert.equal(proof.protocol, "kodac.proof")
    assert.equal(proof.doneGate.status, "PROVEN_READY")
    assert.ok(proof.doneGate.evidence.length > 0)
    assert.ok(proof.verification.checks.some((check) => check.id === "verification.commands" && check.status === "pass"))
  } finally {
    await rm(workspace, { recursive: true, force: true })
    await rm(evidence, { recursive: true, force: true })
  }
})
