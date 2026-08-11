import assert from "node:assert/strict"
import test from "node:test"
import { OpenAICompatibleProvider } from "../src/model/openai-compatible.ts"
import { ModelProviderError, ProviderRegistry, type ModelProviderStreamEvent } from "../src/model/provider.ts"
import { AgentTurnRunner } from "../src/model/turn.ts"
import { InMemoryEventSink } from "../src/protocol/event.ts"
import { RuntimeOrchestrator } from "../src/runtime/orchestrator.ts"
import { RuntimeSession } from "../src/session/session.ts"
import { ToolRegistry } from "../src/tools/registry.ts"

function streamResponse(payloads: string[], headers: Record<string, string> = {}): Response {
  const encoder = new TextEncoder()
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const payload of payloads) controller.enqueue(encoder.encode(`data: ${payload}\n\n`))
      controller.close()
    },
  })
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/event-stream", "x-request-id": "req-stream-1", ...headers },
  })
}

function chunk(input: Record<string, unknown>): string {
  return JSON.stringify(input)
}

test("OpenAI-compatible provider normalizes streamed text and final usage", async () => {
  const observed: ModelProviderStreamEvent[] = []
  let requestBody: Record<string, unknown> | undefined
  const provider = new OpenAICompatibleProvider({
    apiKey: "top-secret-key",
    fetchImpl: async (_input, init) => {
      assert.equal((init?.headers as Record<string, string>).authorization, "Bearer top-secret-key")
      requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>
      return streamResponse([
        chunk({ id: "chatcmpl-stream", choices: [{ index: 0, delta: { content: "hel" }, finish_reason: null }], usage: null }),
        chunk({ id: "chatcmpl-stream", choices: [{ index: 0, delta: { content: "lo" }, finish_reason: "stop" }], usage: null }),
        chunk({ id: "chatcmpl-stream", choices: [], usage: { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 } }),
        "[DONE]",
      ])
    },
  })
  const response = await provider.generate({
    model: "test-model",
    messages: [{ role: "user", content: "hello" }],
    tools: [],
    onStreamEvent(event) { observed.push(event) },
  })
  assert.equal(requestBody?.stream, true)
  assert.deepEqual(requestBody?.stream_options, { include_usage: true })
  assert.equal(response.assistant, "hello")
  assert.equal(response.finishReason, "stop")
  assert.deepEqual(response.metadata?.usage, { inputTokens: 3, cachedInputTokens: undefined, outputTokens: 2, totalTokens: 5 })
  assert.equal(response.metadata?.requestId, "req-stream-1")
  assert.deepEqual(observed.map((event) => event.type), ["started", "text_delta", "text_delta", "usage", "completed"])
})

test("OpenAI-compatible provider assembles fragmented streamed tool calls", async () => {
  const provider = new OpenAICompatibleProvider({
    apiKey: "secret",
    fetchImpl: async () => streamResponse([
      chunk({ id: "chatcmpl-tools", choices: [{ index: 0, delta: { tool_calls: [{ index: 0, id: "call_1", type: "function", function: { name: "repo.read", arguments: "{\"path\":\"" } }] }, finish_reason: null }] }),
      chunk({ id: "chatcmpl-tools", choices: [{ index: 0, delta: { tool_calls: [{ index: 0, function: { arguments: "README.md\"}" } }] }, finish_reason: "tool_calls" }] }),
      "[DONE]",
    ]),
  })
  const response = await provider.generate({
    model: "test-model",
    messages: [{ role: "user", content: "read readme" }],
    tools: [{ name: "repo.read", capability: "repo.read", description: "Read a file", inputSchema: { type: "object" } }],
  })
  assert.equal(response.finishReason, "tool_calls")
  assert.deepEqual(response.toolCalls, [{ id: "call_1", name: "repo.read", input: { path: "README.md" } }])
})

test("OpenAI-compatible provider fails closed on malformed or incomplete streams", async () => {
  const malformed = new OpenAICompatibleProvider({ apiKey: "secret", fetchImpl: async () => streamResponse(["{not-json", "[DONE]"]) })
  await assert.rejects(
    () => malformed.generate({ model: "m", messages: [{ role: "user", content: "x" }], tools: [] }),
    (error: unknown) => error instanceof ModelProviderError && error.code === "invalid_stream_event",
  )

  const incomplete = new OpenAICompatibleProvider({
    apiKey: "secret",
    fetchImpl: async () => streamResponse([chunk({ id: "x", choices: [{ index: 0, delta: { content: "partial" }, finish_reason: "stop" }] })]),
  })
  await assert.rejects(
    () => incomplete.generate({ model: "m", messages: [{ role: "user", content: "x" }], tools: [] }),
    (error: unknown) => error instanceof ModelProviderError && error.code === "incomplete_stream",
  )
})

test("OpenAI-compatible provider honors cancellation during a stream", async () => {
  const controller = new AbortController()
  const encoder = new TextEncoder()
  const provider = new OpenAICompatibleProvider({
    apiKey: "secret",
    fetchImpl: async () => new Response(new ReadableStream<Uint8Array>({
      start(stream) {
        stream.enqueue(encoder.encode(`data: ${chunk({ id: "x", choices: [{ index: 0, delta: { content: "first" }, finish_reason: null }] })}\n\n`))
      },
      cancel() {},
    }), { status: 200, headers: { "content-type": "text/event-stream" } }),
  })
  await assert.rejects(
    () => provider.generate({
      model: "m",
      messages: [{ role: "user", content: "x" }],
      tools: [],
      signal: controller.signal,
      onStreamEvent(event) {
        if (event.type === "text_delta") controller.abort(new Error("cancelled-by-test"))
      },
    }),
    /cancelled-by-test/,
  )
})

test("AgentTurnRunner records streaming evidence without raw assistant deltas", async () => {
  const secretText = "sensitive streamed assistant text"
  const provider = new OpenAICompatibleProvider({
    apiKey: "secret",
    fetchImpl: async () => streamResponse([
      chunk({ id: "chatcmpl-evidence", choices: [{ index: 0, delta: { content: secretText }, finish_reason: "stop" }] }),
      "[DONE]",
    ]),
  })
  const sink = new InMemoryEventSink()
  const session = new RuntimeSession(sink, "session-stream")
  const tools = new ToolRegistry()
  const providers = new ProviderRegistry()
  providers.register(provider)
  const runner = new AgentTurnRunner(providers, tools, new RuntimeOrchestrator(tools, session), session)
  await session.start({ test: true })
  const result = await runner.run({ provider: "openai-compatible", model: "m", messages: [{ role: "user", content: "x" }] })
  assert.equal(result.assistant, secretText)
  assert.ok(sink.events.some((event) => event.type === "model.stream.text_delta"))
  assert.equal(JSON.stringify(sink.events).includes(secretText), false)
})
