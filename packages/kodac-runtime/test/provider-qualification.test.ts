import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"

import {
  type ModelProvider,
  type ModelProviderRequest,
  type ModelProviderResponse,
  type ModelProviderUsage,
} from "../src/model/provider.ts"
import { runProviderQualification } from "../src/provider-qualification.ts"

function runGit(cwd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd, windowsHide: true }, (error) => error ? reject(error) : resolve())
  })
}

function metadata(call: number): ModelProviderResponse["metadata"] {
  const usage: ModelProviderUsage = { inputTokens: 10 + call, outputTokens: 2, totalTokens: 12 + call }
  return { requestId: `req_${call}`, responseId: `resp_${call}`, usage, attempts: 1, latencyMs: 5 }
}

class QualificationFixtureProvider implements ModelProvider {
  readonly name = "openai"
  private calls = 0
  private toolIds = 0
  readonly requestMutation: boolean

  constructor(requestMutation = false) {
    this.requestMutation = requestMutation
  }

  private async stream(request: ModelProviderRequest, response: ModelProviderResponse): Promise<void> {
    await request.onStreamEvent?.({ type: "started" })
    if (response.assistant) await request.onStreamEvent?.({ type: "text_delta", text: response.assistant })
    if (response.toolCalls.length) {
      const tool = response.toolCalls[0]
      await request.onStreamEvent?.({ type: "tool_call_delta", index: 0, id: tool.id, name: tool.name, argumentsDelta: JSON.stringify(tool.input) })
    }
    if (response.metadata?.usage) await request.onStreamEvent?.({ type: "usage", usage: response.metadata.usage })
    await request.onStreamEvent?.({ type: "completed", finishReason: response.finishReason, responseId: response.metadata?.responseId })
  }

  async generate(request: ModelProviderRequest): Promise<ModelProviderResponse> {
    this.calls += 1
    const currentMetadata = metadata(this.calls)
    const last = request.messages[request.messages.length - 1]

    if (request.tools.length === 0) {
      const response: ModelProviderResponse = { assistant: "KODAC_PROVIDER_OK", toolCalls: [], finishReason: "stop", metadata: currentMetadata }
      await this.stream(request, response)
      return response
    }

    if (last?.role === "tool") {
      const sentinel = last.name === "repo.list" ? "KODAC_LIST_OK" : last.name === "repo.read" ? "KODAC_READ_OK" : "KODAC_SEARCH_OK"
      const response: ModelProviderResponse = { assistant: sentinel, toolCalls: [], finishReason: "stop", metadata: currentMetadata }
      await this.stream(request, response)
      return response
    }

    this.toolIds += 1
    const user = [...request.messages].reverse().find((message) => message.role === "user")?.content ?? ""
    let name = user.includes("repository-listing") ? "repo.list" : user.includes("repository-read") ? "repo.read" : "repo.search"
    let input: unknown = name === "repo.list"
      ? { path: ".", recursive: false, maxEntries: 20, maxDepth: 1 }
      : name === "repo.read"
        ? { path: "README.md", maxBytes: 65536 }
        : { query: "Kodac", path: ".", caseSensitive: false, maxResults: 5 }
    if (this.requestMutation && name === "repo.list") {
      name = "repo.apply_patch"
      input = { patchText: "*** Begin Patch\n*** End Patch" }
    }
    const response: ModelProviderResponse = {
      assistant: "",
      toolCalls: [{ id: `call_${this.toolIds}`, name, input }],
      finishReason: "tool_calls",
      metadata: currentMetadata,
    }
    await this.stream(request, response)
    return response
  }
}

async function fixture(): Promise<{ root: string; workspace: string; evidence: string }> {
  const root = await mkdtemp(join(tmpdir(), "kodac-provider-qualification-"))
  const workspace = join(root, "workspace")
  const evidence = join(root, "evidence")
  await mkdir(workspace, { recursive: true })
  await writeFile(join(workspace, "README.md"), "# Kodac\nQualification fixture for Kodac provider tools.\n", "utf8")
  await runGit(workspace, ["init"])
  return { root, workspace, evidence }
}

test("provider qualification proves live-style streaming and read-only tool continuation without workspace writes", async () => {
  const { workspace, evidence } = await fixture()
  const output: string[] = []
  const errors: string[] = []
  const code = await runProviderQualification(
    ["--provider", "openai", "--model", "gpt-test", "--workspace", workspace, "--evidence-dir", evidence, "--json"],
    {},
    { stdout: (line) => output.push(line), stderr: (line) => errors.push(line) },
    workspace,
    { modelProvider: new QualificationFixtureProvider() },
  )
  assert.equal(code, 0)
  assert.deepEqual(errors, [])
  const result = JSON.parse(output.at(-1) ?? "{}") as { status: string; report: string }
  assert.equal(result.status, "PASS")
  const report = JSON.parse(await readFile(result.report, "utf8")) as { status: string; checks: Array<{ id: string; status: string; evidence: Record<string, unknown> }> }
  assert.equal(report.status, "PASS")
  assert.equal(report.checks.length, 9)
  assert.ok(report.checks.every((check) => check.status === "PASS"))
  assert.equal(report.checks.find((check) => check.id === "workspace.no_write")?.status, "PASS")
})

test("provider qualification blocks hallucinated mutation tools before execution and fails the no-write gate", async () => {
  const { workspace, evidence } = await fixture()
  const before = await readFile(join(workspace, "README.md"), "utf8")
  const output: string[] = []
  const code = await runProviderQualification(
    ["--provider", "openai", "--model", "gpt-test", "--workspace", workspace, "--evidence-dir", evidence, "--json"],
    {},
    { stdout: (line) => output.push(line), stderr: () => {} },
    workspace,
    { modelProvider: new QualificationFixtureProvider(true) },
  )
  assert.equal(code, 3)
  assert.equal(await readFile(join(workspace, "README.md"), "utf8"), before)
  const result = JSON.parse(output.at(-1) ?? "{}") as { status: string; report: string }
  assert.equal(result.status, "FAIL")
  const report = JSON.parse(await readFile(result.report, "utf8")) as { checks: Array<{ id: string; status: string; evidence: Record<string, unknown> }> }
  const noWrite = report.checks.find((check) => check.id === "workspace.no_write")
  assert.equal(noWrite?.status, "FAIL")
  assert.deepEqual(noWrite?.evidence.blockedToolRequests, ["repo.apply_patch"])
})
