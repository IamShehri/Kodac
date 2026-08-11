import assert from "node:assert/strict"
import test from "node:test"

import { OpenAIResponsesProvider } from "../src/model/openai.ts"
import { ModelProviderError, type ModelProviderRequest, type ModelProviderStreamEvent } from "../src/model/provider.ts"

function sse(events: Array<Record<string, unknown>>): Response {
  const encoder = new TextEncoder()
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const event of events) controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      controller.close()
    },
  })
  return new Response(body, { status: 200, headers: { "content-type": "text/event-stream", "x-request-id": "req-stream" } })
}

function request(overrides: Partial<ModelProviderRequest> = {}): ModelProviderRequest {
  return {
    model: "gpt-test",
    messages: [{ role: "user", content: "hello" }],
    tools: [],
    ...overrides,
  }
}

test("OpenAI Responses provider normalizes native output-text streaming and final usage", async () => {
  const observed: ModelProviderStreamEvent[] = []
  let payload: Record<string, unknown> | undefined
  const provider = new OpenAIResponsesProvider({
    apiKey: "secret-test-key",
    stream: true,
    fetchImpl: (async (_input: string | URL | Request, init?: RequestInit) => {
      payload = JSON.parse(String(init?.body)) as Record<string, unknown>
      return sse([
        { type: "response.created", sequence_number: 0, response: { id: "resp_stream" } },
        { type: "response.output_text.delta", sequence_number: 1, item_id: "msg_1", output_index: 0, content_index: 0, delta: "hel" },
        { type: "response.output_text.delta", sequence_number: 2, item_id: "msg_1", output_index: 0, content_index: 0, delta: "lo" },
        {
          type: "response.completed",
          sequence_number: 3,
          response: {
            id: "resp_stream",
            status: "completed",
            output: [{ type: "message", role: "assistant", content: [{ type: "output_text", text: "hello", annotations: [] }] }],
            usage: { input_tokens: 3, output_tokens: 2, total_tokens: 5 },
          },
        },
      ])
    }) as typeof fetch,
  })

  const response = await provider.generate(request({ onStreamEvent(event) { observed.push(event) } }))
  assert.equal(payload?.stream, true)
  assert.equal(String(payload).includes("secret-test-key"), false)
  assert.equal(response.assistant, "hello")
  assert.equal(response.finishReason, "stop")
  assert.equal(response.metadata?.requestId, "req-stream")
  assert.equal(response.metadata?.usage?.totalTokens, 5)
  assert.deepEqual(observed.map((event) => event.type), ["started", "text_delta", "text_delta", "usage", "completed"])
})

test("OpenAI Responses provider reports function-call deltas but executes only the completed canonical call", async () => {
  const observed: ModelProviderStreamEvent[] = []
  let alias = ""
  const provider = new OpenAIResponsesProvider({
    apiKey: "secret",
    stream: true,
    fetchImpl: (async (_input: string | URL | Request, init?: RequestInit) => {
      const payload = JSON.parse(String(init?.body)) as { tools: Array<{ name: string }> }
      alias = payload.tools[0].name
      return sse([
        { type: "response.created", sequence_number: 0, response: { id: "resp_tools" } },
        { type: "response.function_call_arguments.delta", sequence_number: 1, item_id: "fc_1", output_index: 0, delta: "{\"path\":\"" },
        { type: "response.function_call_arguments.delta", sequence_number: 2, item_id: "fc_1", output_index: 0, delta: "README.md\"}" },
        { type: "response.function_call_arguments.done", sequence_number: 3, item_id: "fc_1", output_index: 0, name: alias, arguments: "{\"path\":\"README.md\"}" },
        {
          type: "response.completed",
          sequence_number: 4,
          response: {
            id: "resp_tools",
            status: "completed",
            output: [{ type: "function_call", id: "fc_1", call_id: "call_1", name: alias, arguments: "{\"path\":\"README.md\"}", status: "completed" }],
            usage: { input_tokens: 5, output_tokens: 3, total_tokens: 8 },
          },
        },
      ])
    }) as typeof fetch,
  })

  const response = await provider.generate(request({
    tools: [{ name: "repo.read", capability: "repo.read", description: "Read a file", inputSchema: { type: "object" } }],
    onStreamEvent(event) { observed.push(event) },
  }))
  assert.equal(response.finishReason, "tool_calls")
  assert.deepEqual(response.toolCalls, [{ id: "call_1", name: "repo.read", input: { path: "README.md" } }])
  assert.equal(observed.filter((event) => event.type === "tool_call_delta").length, 3)
})

test("OpenAI Responses provider never retries after partial native stream output", async () => {
  let calls = 0
  const sleeps: number[] = []
  const encoder = new TextEncoder()
  const provider = new OpenAIResponsesProvider({
    apiKey: "secret",
    stream: true,
    maxAttempts: 3,
    sleep: async (ms) => { sleeps.push(ms) },
    fetchImpl: (async () => {
      calls += 1
      let read = 0
      const body = new ReadableStream<Uint8Array>({
        pull(controller) {
          read += 1
          if (read === 1) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "response.created", sequence_number: 0, response: { id: "resp_partial" } })}\n\n`))
            return
          }
          if (read === 2) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "response.output_text.delta", sequence_number: 1, item_id: "msg", output_index: 0, content_index: 0, delta: "partial" })}\n\n`))
            return
          }
          controller.error(new Error("connection lost"))
        },
      })
      return new Response(body, { status: 200, headers: { "content-type": "text/event-stream" } })
    }) as typeof fetch,
  })

  await assert.rejects(
    () => provider.generate(request()),
    (error: unknown) => error instanceof ModelProviderError && error.code === "stream_interrupted" && !error.retryable,
  )
  assert.equal(calls, 1)
  assert.deepEqual(sleeps, [])
})

test("OpenAI Responses provider fails closed on text mismatch, sequence regression, and cancellation", async () => {
  const mismatch = new OpenAIResponsesProvider({ apiKey: "secret", stream: true, fetchImpl: (async () => sse([
    { type: "response.created", sequence_number: 0, response: { id: "r" } },
    { type: "response.output_text.delta", sequence_number: 1, item_id: "m", output_index: 0, content_index: 0, delta: "partial" },
    { type: "response.completed", sequence_number: 2, response: { id: "r", status: "completed", output: [{ type: "message", role: "assistant", content: [{ type: "output_text", text: "different" }] }] } },
  ])) as typeof fetch })
  await assert.rejects(() => mismatch.generate(request()), (error: unknown) => error instanceof ModelProviderError && error.code === "stream_text_mismatch")

  const sequence = new OpenAIResponsesProvider({ apiKey: "secret", stream: true, fetchImpl: (async () => sse([
    { type: "response.created", sequence_number: 1, response: { id: "r" } },
    { type: "response.output_text.delta", sequence_number: 1, item_id: "m", output_index: 0, content_index: 0, delta: "x" },
  ])) as typeof fetch })
  await assert.rejects(() => sequence.generate(request()), (error: unknown) => error instanceof ModelProviderError && error.code === "invalid_stream_sequence")

  const controller = new AbortController()
  const cancel = new OpenAIResponsesProvider({ apiKey: "secret", stream: true, fetchImpl: (async () => sse([
    { type: "response.created", sequence_number: 0, response: { id: "r" } },
    { type: "response.output_text.delta", sequence_number: 1, item_id: "m", output_index: 0, content_index: 0, delta: "x" },
  ])) as typeof fetch })
  await assert.rejects(
    () => cancel.generate(request({ signal: controller.signal, onStreamEvent(event) { if (event.type === "text_delta") controller.abort(new Error("cancelled-by-test")) } })),
    (error: unknown) => error instanceof ModelProviderError && error.code === "request_aborted",
  )
})
