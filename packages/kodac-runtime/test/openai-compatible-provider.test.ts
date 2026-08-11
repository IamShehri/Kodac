import assert from "node:assert/strict"
import test from "node:test"

import { BoundedAgentLoop } from "../src/agent/loop.ts"
import { OpenAICompatibleProvider, type ProviderFetch } from "../src/model/openai-compatible.ts"
import { ModelProviderError, type ModelProviderRequest } from "../src/model/provider.ts"
import type { AgentTurnRunner, AgentTurnResult } from "../src/model/turn.ts"
import type { RuntimeSession } from "../src/session/session.ts"

function request(overrides: Partial<ModelProviderRequest> = {}): ModelProviderRequest {
  return {
    model: "fixture-model",
    messages: [{ role: "user", content: "inspect the repository" }],
    tools: [{
      name: "repo.read",
      capability: "repo.read",
      description: "Read one workspace file.",
      inputSchema: {
        type: "object",
        properties: { path: { type: "string" } },
        required: ["path"],
        additionalProperties: false,
      },
    }],
    ...overrides,
  }
}

test("OpenAI-compatible provider maps canonical tools and usage without SDK coupling", async () => {
  const seen: Array<{ url: string; init?: RequestInit }> = []
  const fetchImpl: ProviderFetch = async (input, init) => {
    seen.push({ url: String(input), init })
    return new Response(JSON.stringify({
      id: "chatcmpl-kodac",
      choices: [{ finish_reason: "stop", message: { role: "assistant", content: "done" } }],
      usage: {
        prompt_tokens: 11,
        prompt_tokens_details: { cached_tokens: 3 },
        completion_tokens: 5,
        total_tokens: 16,
      },
    }), { status: 200, headers: { "content-type": "application/json", "x-request-id": "req-kodac" } })
  }
  const provider = new OpenAICompatibleProvider({ apiKey: "secret-test-key", fetchImpl, maxAttempts: 1 })
  const result = await provider.generate(request())

  assert.equal(seen.length, 1)
  assert.equal(seen[0].url, "https://api.openai.com/v1/chat/completions")
  const body = JSON.parse(String(seen[0].init?.body)) as {
    model: string
    stream: boolean
    tool_choice: string
    tools: Array<{ type: string; function: { name: string; strict: boolean; parameters: Record<string, unknown> } }>
  }
  assert.equal(body.model, "fixture-model")
  assert.equal(body.stream, false)
  assert.equal(body.tool_choice, "auto")
  assert.equal(body.tools[0].type, "function")
  assert.equal(body.tools[0].function.name, "repo.read")
  assert.equal(body.tools[0].function.strict, true)
  assert.equal(String(seen[0].init?.body).includes("secret-test-key"), false)
  assert.equal(result.assistant, "done")
  assert.equal(result.finishReason, "stop")
  assert.deepEqual(result.metadata?.usage, { inputTokens: 11, cachedInputTokens: 3, outputTokens: 5, totalTokens: 16 })
  assert.equal(result.metadata?.requestId, "req-kodac")
  assert.equal(result.metadata?.attempts, 1)
})

test("OpenAI-compatible provider preserves function-call history and normalizes tool calls", async () => {
  let body: Record<string, unknown> | undefined
  const fetchImpl: ProviderFetch = async (_input, init) => {
    body = JSON.parse(String(init?.body)) as Record<string, unknown>
    return new Response(JSON.stringify({
      id: "chatcmpl-tool",
      choices: [{
        finish_reason: "tool_calls",
        message: {
          role: "assistant",
          content: null,
          tool_calls: [{
            id: "call-2",
            type: "function",
            function: { name: "repo.read", arguments: "{\"path\":\"README.md\"}" },
          }],
        },
      }],
    }), { status: 200, headers: { "content-type": "application/json" } })
  }
  const provider = new OpenAICompatibleProvider({ apiKey: "test", fetchImpl, maxAttempts: 1 })
  const result = await provider.generate(request({
    messages: [
      { role: "user", content: "read file" },
      { role: "assistant", content: "", toolCalls: [{ id: "call-1", name: "repo.read", input: { path: "note.txt" } }] },
      { role: "tool", content: "{\"content\":\"alpha\"}", name: "repo.read", toolCallId: "call-1" },
    ],
  }))

  const messages = body?.messages as Array<Record<string, unknown>>
  assert.equal(messages[1].role, "assistant")
  const priorCalls = messages[1].tool_calls as Array<{ id: string; function: { name: string; arguments: string } }>
  assert.equal(priorCalls[0].id, "call-1")
  assert.equal(priorCalls[0].function.name, "repo.read")
  assert.deepEqual(JSON.parse(priorCalls[0].function.arguments), { path: "note.txt" })
  assert.equal(messages[2].role, "tool")
  assert.equal(messages[2].tool_call_id, "call-1")
  assert.deepEqual(result.toolCalls, [{ id: "call-2", name: "repo.read", input: { path: "README.md" } }])
  assert.equal(result.finishReason, "tool_calls")
})

test("OpenAI-compatible provider retries bounded transient failures and never exposes credentials in errors", async () => {
  let calls = 0
  const sleeps: number[] = []
  const fetchImpl: ProviderFetch = async () => {
    calls += 1
    if (calls === 1) return new Response("rate limited", { status: 429 })
    return new Response(JSON.stringify({
      id: "chatcmpl-retry",
      choices: [{ finish_reason: "stop", message: { role: "assistant", content: "recovered" } }],
    }), { status: 200, headers: { "content-type": "application/json" } })
  }
  const provider = new OpenAICompatibleProvider({
    apiKey: "never-print-this-key",
    fetchImpl,
    maxAttempts: 2,
    sleep: async (milliseconds) => { sleeps.push(milliseconds) },
  })
  const result = await provider.generate(request({ tools: [] }))
  assert.equal(calls, 2)
  assert.deepEqual(sleeps, [250])
  assert.equal(result.metadata?.attempts, 2)

  const failing = new OpenAICompatibleProvider({
    apiKey: "never-print-this-key",
    maxAttempts: 1,
    fetchImpl: async () => { throw new Error("transport contains never-print-this-key") },
  })
  await assert.rejects(
    () => failing.generate(request({ tools: [] })),
    (error: unknown) => {
      assert.ok(error instanceof ModelProviderError)
      assert.equal(error.code, "network_error")
      assert.equal(error.message.includes("never-print-this-key"), false)
      return true
    },
  )
})

test("OpenAI-compatible provider fails closed for missing default credentials and unsafe remote HTTP", () => {
  assert.throws(
    () => OpenAICompatibleProvider.fromEnv({}),
    (error: unknown) => error instanceof ModelProviderError && error.code === "credentials_missing",
  )
  assert.throws(
    () => new OpenAICompatibleProvider({ baseUrl: "http://example.com/v1", apiKey: "x" }),
    (error: unknown) => error instanceof ModelProviderError && error.code === "invalid_base_url",
  )
  assert.doesNotThrow(() => new OpenAICompatibleProvider({ baseUrl: "http://127.0.0.1:11434/v1", maxAttempts: 1 }))
})

test("bounded agent loop preserves assistant tool calls before tool results for provider continuity", async () => {
  const requests: ModelProviderRequest[] = []
  let turn = 0
  const runner = {
    async run(input: ModelProviderRequest): Promise<AgentTurnResult> {
      requests.push({ ...input, messages: input.messages.map((message) => ({ ...message })) })
      turn += 1
      if (turn === 1) {
        return {
          assistant: "",
          finishReason: "tool_calls",
          toolCalls: [{ id: "call-1", name: "repo.read", input: { path: "note.txt" } }],
          toolResults: [{ id: "call-1", name: "repo.read", output: { content: "alpha" } }],
        }
      }
      return { assistant: "done", finishReason: "stop", toolCalls: [], toolResults: [] }
    },
  } as unknown as AgentTurnRunner
  const session = { async emit() {} } as unknown as RuntimeSession
  const loop = new BoundedAgentLoop(runner, session)
  const result = await loop.run({
    provider: "fixture",
    model: "fixture",
    messages: [{ role: "user", content: "read note" }],
    limits: { maxTurns: 2 },
  })

  assert.equal(result.status, "completed")
  assert.equal(requests.length, 2)
  const second = requests[1].messages
  const assistant = second.find((message) => message.role === "assistant")
  const tool = second.find((message) => message.role === "tool")
  assert.deepEqual(assistant?.toolCalls, [{ id: "call-1", name: "repo.read", input: { path: "note.txt" } }])
  assert.equal(tool?.toolCallId, "call-1")
})
