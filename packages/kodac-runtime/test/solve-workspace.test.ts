import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"

import { runCli } from "../src/cli.ts"
import type { ModelProvider, ModelProviderRequest, ModelProviderResponse } from "../src/model/provider.ts"

class ScriptedWorkspaceProvider implements ModelProvider {
  readonly name = "fixture"
  readonly requests: ModelProviderRequest[] = []
  private readonly responses: ModelProviderResponse[]
  constructor(responses: ModelProviderResponse[]) { this.responses = responses }
  async generate(request: ModelProviderRequest): Promise<ModelProviderResponse> {
    this.requests.push({ ...request, messages: request.messages.map((message) => ({ ...message })), tools: [...request.tools] })
    const response = this.responses.shift()
    if (!response) throw new Error("No scripted workspace response remains")
    return response
  }
}

function capture(): { out: string[]; err: string[]; io: { stdout(line: string): void; stderr(line: string): void } } {
  const out: string[] = []
  const err: string[] = []
  return { out, err, io: { stdout(line) { out.push(line) }, stderr(line) { err.push(line) } } }
}

test("kodac solve mutates with approval but remains NOT READY without verification commands", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "kodac-solve-s5-workspace-"))
  const evidence = await mkdtemp(join(tmpdir(), "kodac-solve-s5-evidence-"))
  try {
    execFileSync("git", ["init", "-q"], { cwd: workspace })
    execFileSync("git", ["config", "user.email", "kodac-test@example.com"], { cwd: workspace })
    execFileSync("git", ["config", "user.name", "Kodac Test"], { cwd: workspace })
    await writeFile(join(workspace, "note.txt"), "alpha\nbeta\n", "utf8")
    execFileSync("git", ["add", "note.txt"], { cwd: workspace })
    execFileSync("git", ["commit", "-qm", "fixture"], { cwd: workspace })
    const patchText = "*** Begin Patch\n*** Update File: note.txt\n@@\n-alpha\n+ALPHA\n beta\n*** End Patch"
    const provider = new ScriptedWorkspaceProvider([
      { assistant: "", finishReason: "tool_calls", toolCalls: [{ id: "list-1", name: "repo.list", input: {} }] },
      { assistant: "", finishReason: "tool_calls", toolCalls: [{ id: "read-1", name: "repo.read", input: { path: "note.txt" } }] },
      { assistant: "", finishReason: "tool_calls", toolCalls: [{ id: "search-1", name: "repo.search", input: { query: "beta" } }] },
      { assistant: "", finishReason: "tool_calls", toolCalls: [{ id: "patch-1", name: "repo.apply_patch", input: { patchText } }] },
      { assistant: "", finishReason: "tool_calls", toolCalls: [{ id: "diff-1", name: "git.diff", input: {} }] },
      { assistant: "workspace updated", finishReason: "stop", toolCalls: [] },
    ])
    const captured = capture()
    const code = await runCli(["solve", "update the workspace", "--workspace", workspace, "--evidence-dir", evidence, "--approve-writes"], captured.io, workspace, { modelProvider: provider })
    assert.equal(code, 3)
    assert.equal(await readFile(join(workspace, "note.txt"), "utf8"), "ALPHA\nbeta\n")
    assert.ok(captured.out.includes("NOT READY"))
    assert.equal(captured.out.includes("PROVEN READY"), false)
    const toolNames = provider.requests[0].tools.map((tool) => tool.name).sort()
    assert.deepEqual(toolNames, ["git.diff", "repo.apply_patch", "repo.list", "repo.read", "repo.search"])
    const finalRequest = provider.requests.at(-1)
    assert.ok(finalRequest)
    const gitDiffResult = finalRequest.messages.find((message) => message.role === "tool" && message.name === "git.diff")
    assert.ok(gitDiffResult?.content.includes("+ALPHA"))
  } finally {
    await rm(workspace, { recursive: true, force: true })
    await rm(evidence, { recursive: true, force: true })
  }
})
