import assert from "node:assert/strict"
import test from "node:test"

import { OpenAIResponsesProvider } from "../src/model/openai.ts"
import {
  ModelProviderError,
  type ModelProviderRequest,
  type ModelToolDescriptor,
} from "../src/model/provider.ts"

const READ_TOOL: ModelToolDescriptor = {
  name: "repo.read",
  capability: "repo.read",
  description: "Read a workspace file.",
  inputSchema: {
    type: "object",
    properties: { path: { type: "string" } },
    required: ["path"],
    additionalProperties: false,
  },
}

function request(overrides: Partial<ModelProviderRequest> = {}): ModelProviderRequest {
  return {
    model: "gpt-test",
    messages: [{ role: "user", content: "read note.txt" }],
    tools: [READ_TOOL],
    ...overrides,
  }
}

test("OpenAI Responses provider maps safe tool aliases, usage, request ids, and reasoning-aware tool history", async () => {
  const seen: Array<{ url: string; init: RequestInit; payload: Record<string, unknown> }> = []
  let call = 0
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const payload = JSON.parse(String(init?.body)) as Record<string, unknown>
    seen.push({ url: String(input), init: init ?? {}, payload })
    call += 1

    if (call === 1) {
      const tools = payload.tools as Array<Record<string, unknown>>
      const providerName = tools[0].name as string
      assert.match(providerName, /^[a-zA-Z0-9_-]{1,64}$/)
      assert.notEqual(providerName, "repo.read")
      return new Response(JSON.stringify({
        id: "resp_1",
        status: "completed",
        output: [
          { type: "reasoning", id: "rs_1", summary: [] },
          {
            type: "function_call",
            call_id: "call_1",
            name: providerName,
            arguments: "{\"path\":\"note.txt\"}",
          },
        ],
        usage: {
          input_tokens: 10,
          input_tokens_details: { cached_tokens: 2 },
          output_tokens: 4,
          total_tokens: 14,
        },
      }), {
        status: 200,
        headers: { "content-type": "application/json", "x-request-id": "req_1" },
      })
    }

    const inputItems = payload.input as Array<Record<string, unknown>>
    assert.ok(inputItems.some((item) => item.type === "reasoning" && item.id === "rs_1"))
    assert.ok(inputItems.some((item) =>
      item.type === "function_call" &&
      item.call_id === "call_1" &&
      typeof item.name === "string" &&
      item.arguments === "{\"path\":\"note.txt\"}"
    ))
    assert.ok(inputItems.some((item) =>
      item.type === "function_call_output" &&
      item.call_id === "call_1" &&
      item.output === "{\"path\":\"note.txt\",\"content\":\"hello\"}"
    ))
    return new Response(JSON.stringify({
      id: "resp_2",
      status: "completed",
      output: [{
        type: "message",
        role: "assistant",
        content: [{ type: "output_text", text: "done", annotations: [] }],
      }],
      usage: { input_tokens: 20, output_tokens: 3, total_tokens: 23 },
    }), {
      status: 200,
      headers: { "content-type": "application/json", "x-request-id": "req_2" },
    })
  }) as typeof fetch

  let now = 100
  const provider = new OpenAIResponsesProvider({
    apiKey: "test-secret",
    fetchImpl,
    clock: () => (now += 5),
  })

  const first = await provider.generate(request())
  assert.equal(first.finishReason, "tool_calls")
  assert.deepEqual(first.toolCalls, [{ id: "call_1", name: "repo.read", input: { path: "note.txt" } }])
  assert.equal(first.metadata?.requestId, "req_1")
  assert.equal(first.metadata?.responseId, "resp_1")
  assert.equal(first.metadata?.usage?.inputTokens, 10)
  assert.equal(first.metadata?.usage?.cachedInputTokens, 2)
  assert.equal(first.metadata?.usage?.outputTokens, 4)
  assert.equal(first.metadata?.usage?.totalTokens, 14)
  assert.equal(first.metadata?.attempts, 1)
  assert.equal(first.metadata?.latencyMs, 5)

  const second = await provider.generate(request({
    messages: [
      { role: "user", content: "read note.txt" },
      {
        role: "assistant",
        content: "",
        toolCalls: [{ id: "call_1", name: "repo.read", input: { path: "note.txt" } }],
      },
      {
        role: "tool",
        name: "repo.read",
        toolCallId: "call_1",
        content: "{\"path\":\"note.txt\",\"content\":\"hello\"}",
      },
    ],
  }))
  assert.equal(second.finishReason, "stop")
  assert.equal(second.assistant, "done")
  assert.equal(second.metadata?.requestId, "req_2")
  assert.equal(seen.length, 2)
  assert.equal(seen[0].url, "https://api.openai.com/v1/responses")
  assert.equal(new Headers(seen[0].init.headers).get("authorization"), "Bearer test-secret")
  assert.equal(JSON.stringify(seen[0].payload).includes("test-secret"), false)
  assert.equal(seen[0].payload.store, false)
})

test("OpenAI Responses provider retries bounded transient HTTP failures and reports attempts", async () => {
  let calls = 0
  const delays: number[] = []
  const fetchImpl = (async (): Promise<Response> => {
    calls += 1
    if (calls === 1) {
      return new Response(JSON.stringify({ error: { message: "rate limited" } }), { status: 429 })
    }
    return new Response(JSON.stringify({
      id: "resp_retry",
      status: "completed",
      output_text: "ok",
      output: [],
      usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
    }), { status: 200, headers: { "x-request-id": "req_retry" } })
  }) as typeof fetch

  const provider = new OpenAIResponsesProvider({
    apiKey: "test-secret",
    fetchImpl,
    maxAttempts: 3,
    sleep: async (ms) => { delays.push(ms) },
  })
  const response = await provider.generate(request({ tools: [] }))
  assert.equal(response.assistant, "ok")
  assert.equal(response.metadata?.attempts, 2)
  assert.equal(calls, 2)
  assert.deepEqual(delays, [250])
})

test("OpenAI Responses provider fails closed on missing credentials, fixture model ids, and invalid tool JSON", async () => {
  const prior = process.env.OPENAI_API_KEY
  delete process.env.OPENAI_API_KEY
  try {
    const noCredential = new OpenAIResponsesProvider({ apiKey: "" })
    await assert.rejects(
      noCredential.generate(request({ tools: [] })),
      (error: unknown) => error instanceof ModelProviderError && error.code === "credential_missing" && !error.retryable,
    )
  } finally {
    if (prior === undefined) delete process.env.OPENAI_API_KEY
    else process.env.OPENAI_API_KEY = prior
  }

  const wrongModel = new OpenAIResponsesProvider({ apiKey: "test-secret" })
  await assert.rejects(
    wrongModel.generate(request({ model: "fixture/deterministic-v1", tools: [] })),
    (error: unknown) => error instanceof ModelProviderError && error.code === "model_required",
  )

  const fetchImpl = (async (_input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const payload = JSON.parse(String(init?.body)) as Record<string, unknown>
    const tool = (payload.tools as Array<Record<string, unknown>>)[0]
    return new Response(JSON.stringify({
      status: "completed",
      output: [{
        type: "function_call",
        call_id: "bad_call",
        name: tool.name,
        arguments: "{not-json",
      }],
    }), { status: 200 })
  }) as typeof fetch
  const invalidArguments = new OpenAIResponsesProvider({ apiKey: "test-secret", fetchImpl })
  await assert.rejects(
    invalidArguments.generate(request()),
    (error: unknown) => error instanceof ModelProviderError && error.code === "invalid_tool_arguments",
  )
})

test("OpenAI Responses provider does not retry non-retryable HTTP failures or expose response bodies", async () => {
  let calls = 0
  const fetchImpl = (async (): Promise<Response> => {
    calls += 1
    return new Response(JSON.stringify({ error: { message: "secret echo must not appear" } }), { status: 401 })
  }) as typeof fetch
  const provider = new OpenAIResponsesProvider({ apiKey: "test-secret", fetchImpl })
  await assert.rejects(
    provider.generate(request({ tools: [] })),
    (error: unknown) => {
      assert.ok(error instanceof ModelProviderError)
      assert.equal(error.code, "http_error")
      assert.equal(error.status, 401)
      assert.equal(error.retryable, false)
      assert.equal(error.message.includes("secret echo must not appear"), false)
      return true
    },
  )
  assert.equal(calls, 1)
})
