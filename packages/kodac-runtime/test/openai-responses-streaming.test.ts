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

const MOCK_API_KEY = "sk-test-stream-diagnostics-key"
const SECRET_SENTINEL = "SHOULD_NOT_LEAK_SECRET_SENTINEL"

async function captureStreamFailure(event: Record<string, unknown>): Promise<ModelProviderError> {
  let calls = 0
  const provider = new OpenAIResponsesProvider({
    apiKey: MOCK_API_KEY,
    stream: true,
    maxAttempts: 3,
    fetchImpl: (async () => {
      calls += 1
      return sse([
        { type: "response.created", sequence_number: 0, response: { id: "resp_failure" } },
        event,
      ])
    }) as typeof fetch,
  })

  let thrown: unknown
  try {
    await provider.generate(request())
  } catch (error) {
    thrown = error
  }

  assert.ok(thrown instanceof ModelProviderError)
  assert.equal(thrown.code, "stream_failed")
  assert.equal(thrown.retryable, false)
  assert.equal(calls, 1)
  assert.equal(thrown.message.includes(MOCK_API_KEY), false)
  assert.equal(thrown.message.includes(SECRET_SENTINEL), false)
  return thrown
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
  assert.deepEqual(
    observed.filter((event) => event.type === "tool_call_delta"),
    [
      { type: "tool_call_delta", index: 0, id: "fc_1", argumentsDelta: "{\"path\":\"" },
      { type: "tool_call_delta", index: 0, id: "fc_1", argumentsDelta: "README.md\"}" },
      { type: "tool_call_delta", index: 0, id: "fc_1", name: alias },
    ],
  )
})

test("OpenAI Responses provider tolerates a nameless function-call done event", async () => {
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
        { type: "response.function_call_arguments.done", sequence_number: 3, item_id: "fc_1", output_index: 0, arguments: "{\"path\":\"README.md\"}" },
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
  const doneEvent = observed.filter((event) => event.type === "tool_call_delta").at(-1)
  assert.deepEqual(doneEvent, { type: "tool_call_delta", index: 0, id: "fc_1" })
  assert.equal(Object.hasOwn(doneEvent ?? {}, "name"), false)
})

test("OpenAI ignores invalid streamed function names and trusts only the completed call", async () => {
  const variants: Array<{ name: unknown; arguments: string }> = [
    { name: "", arguments: "not-json" },
    { name: 42, arguments: "{\"path\":\"UNTRUSTED.md\"}" },
  ]

  for (const variant of variants) {
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
          {
            type: "response.function_call_arguments.done",
            sequence_number: 1,
            item_id: "fc_stream_only",
            output_index: 0,
            name: variant.name,
            arguments: variant.arguments,
          },
          {
            type: "response.completed",
            sequence_number: 2,
            response: {
              id: "resp_tools",
              status: "completed",
              output: [{ type: "function_call", id: "fc_final", call_id: "call_final", name: alias, arguments: "{\"path\":\"README.md\"}", status: "completed" }],
            },
          },
        ])
      }) as typeof fetch,
    })

    const response = await provider.generate(request({
      tools: [{ name: "repo.read", capability: "repo.read", description: "Read a file", inputSchema: { type: "object" } }],
      onStreamEvent(event) { observed.push(event) },
    }))
    assert.deepEqual(response.toolCalls, [{ id: "call_final", name: "repo.read", input: { path: "README.md" } }])
    const doneEvent = observed.find((event) => event.type === "tool_call_delta")
    assert.deepEqual(doneEvent, { type: "tool_call_delta", index: 0, id: "fc_stream_only" })
    assert.equal(Object.hasOwn(doneEvent ?? {}, "name"), false)
  }
})

test("OpenAI function-call done events keep required fields fail-closed", async () => {
  const validDone: Record<string, unknown> = {
    type: "response.function_call_arguments.done",
    sequence_number: 1,
    output_index: 0,
    item_id: "fc_1",
    arguments: "{}",
  }
  const cases: Array<{ label: string; overrides: Record<string, unknown> }> = [
    { label: "missing output_index", overrides: { output_index: undefined } },
    { label: "string output_index", overrides: { output_index: "0" } },
    { label: "negative output_index", overrides: { output_index: -1 } },
    { label: "fractional output_index", overrides: { output_index: 0.5 } },
    { label: "missing item_id", overrides: { item_id: undefined } },
    { label: "non-string item_id", overrides: { item_id: 1 } },
    { label: "empty item_id", overrides: { item_id: "" } },
    { label: "missing arguments", overrides: { arguments: undefined } },
    { label: "non-string arguments", overrides: { arguments: {} } },
  ]

  for (const fixture of cases) {
    const provider = new OpenAIResponsesProvider({
      apiKey: "secret",
      stream: true,
      fetchImpl: (async () => sse([
        { type: "response.created", sequence_number: 0, response: { id: "resp_tools" } },
        { ...validDone, ...fixture.overrides },
      ])) as typeof fetch,
    })
    await assert.rejects(
      () => provider.generate(request()),
      (error: unknown) =>
        error instanceof ModelProviderError &&
        error.code === "invalid_stream_event" &&
        error.message === "OpenAI function-call completion event was malformed or out of order.",
      fixture.label,
    )
  }
})

test("OpenAI function-call stream events cannot produce a partial executable call", async () => {
  const observed: ModelProviderStreamEvent[] = []
  const provider = new OpenAIResponsesProvider({
    apiKey: "secret",
    stream: true,
    fetchImpl: (async () => sse([
      { type: "response.created", sequence_number: 0, response: { id: "resp_tools" } },
      { type: "response.function_call_arguments.delta", sequence_number: 1, item_id: "fc_1", output_index: 0, delta: "{\"path\":\"README.md\"}" },
      { type: "response.function_call_arguments.done", sequence_number: 2, item_id: "fc_1", output_index: 0, name: "", arguments: "{\"path\":\"README.md\"}" },
    ])) as typeof fetch,
  })

  let executableToolCalls: unknown
  await assert.rejects(
    async () => {
      const response = await provider.generate(request({ onStreamEvent(event) { observed.push(event) } }))
      executableToolCalls = response.toolCalls
    },
    (error: unknown) =>
      error instanceof ModelProviderError &&
      error.code === "incomplete_stream" &&
      error.message === "OpenAI stream ended before response.completed.",
  )
  assert.equal(executableToolCalls, undefined)
  assert.deepEqual(observed, [
    { type: "started" },
    { type: "tool_call_delta", index: 0, id: "fc_1", argumentsDelta: "{\"path\":\"README.md\"}" },
    { type: "tool_call_delta", index: 0, id: "fc_1" },
  ])
})

test("OpenAI response.failed preserves bounded approved diagnostics", async () => {
  const error = await captureStreamFailure({
    type: "response.failed",
    sequence_number: 1,
    response: {
      status: "failed",
      error: {
        code: "server_error",
        message: "The model failed to generate a response.",
      },
      unapproved_debug: { token: SECRET_SENTINEL },
    },
  })

  assert.equal(error.message.includes("response.failed"), true)
  assert.equal(error.message.includes("server_error"), true)
  assert.equal(error.message.includes("The model failed to generate a response."), true)
})

test("OpenAI response.incomplete preserves its bounded reason", async () => {
  const error = await captureStreamFailure({
    type: "response.incomplete",
    sequence_number: 1,
    response: {
      status: "incomplete",
      incomplete_details: { reason: "max_output_tokens" },
    },
  })

  assert.equal(error.message, "OpenAI response.incomplete [max_output_tokens]")
})

test("OpenAI top-level error preserves approved diagnostics and normalizes whitespace", async () => {
  const error = await captureStreamFailure({
    type: "error",
    sequence_number: 1,
    code: " \t rate_limit_exceeded \r\n ",
    message: " \n Rate\tlimit  reached. \r ",
    param: " \t input[0] \n ",
    unapproved_debug: SECRET_SENTINEL,
  })

  assert.equal(error.message, "OpenAI error [rate_limit_exceeded] (param: input[0]): Rate limit reached.")
  assert.equal(/[\t\r\n]|\s{2,}/u.test(error.message), false)
})

test("OpenAI nested error preserves observed approved diagnostics only", async () => {
  const event: Record<string, unknown> = {
    type: "error",
    sequence_number: 1,
    error: {
      code: "credit_balance_exhausted",
      type: "insufficient_quota",
      message: "You have no credits remaining.",
      param: null,
      unapproved_debug: SECRET_SENTINEL,
    },
  }
  const rawEvent = JSON.stringify(event)
  const error = await captureStreamFailure(event)

  assert.equal(error.message.includes("credit_balance_exhausted"), true)
  assert.equal(error.message.includes("insufficient_quota"), true)
  assert.equal(error.message.includes("You have no credits remaining."), true)
  assert.equal(error.message.includes(rawEvent), false)
  assert.equal(error.message.includes("\"unapproved_debug\""), false)
  assert.equal(error.message.includes("{\"code\""), false)
})

test("OpenAI nested error diagnostics normalize, bound, and ignore invalid values", async () => {
  const normalized = await captureStreamFailure({
    type: "error",
    sequence_number: 1,
    error: {
      code: " \t nested \n code \r ",
      type: " \n nested\t type ",
      message: " \n Nested\tmessage  text. \r ",
      param: " \t input[0] \n field ",
    },
  })
  assert.equal(
    normalized.message,
    "OpenAI error [nested code] (type: nested type) (param: input[0] field): Nested message text.",
  )
  assert.equal(/[\t\r\n]|\s{2,}/u.test(normalized.message), false)

  const bounded = await captureStreamFailure({
    type: "error",
    sequence_number: 1,
    error: {
      code: "c".repeat(129),
      type: "t".repeat(129),
      message: "m".repeat(513),
      param: "p".repeat(129),
    },
  })
  assert.equal(
    bounded.message,
    "OpenAI error [" + "c".repeat(128) + "] (type: " + "t".repeat(128) + ") (param: " +
      "p".repeat(128) + "): " + "m".repeat(512),
  )

  const ignored = await captureStreamFailure({
    type: "error",
    sequence_number: 1,
    error: {
      code: 503,
      type: " \n\t ",
      message: { unapproved_debug: SECRET_SENTINEL },
      param: null,
    },
  })
  assert.equal(ignored.message, "OpenAI error reported a stream failure.")
})

test("OpenAI top-level error diagnostics take precedence over nested diagnostics", async () => {
  const error = await captureStreamFailure({
    type: "error",
    sequence_number: 1,
    code: "top_level_code",
    message: "Top-level message.",
    param: "top_level_param",
    error: {
      code: "nested_code",
      type: "nested_type",
      message: "Nested message.",
      param: "nested_param",
    },
  })

  assert.equal(error.message, "OpenAI error [top_level_code] (param: top_level_param): Top-level message.")
  assert.equal(error.message.includes("nested_code"), false)
  assert.equal(error.message.includes("nested_type"), false)
  assert.equal(error.message.includes("Nested message."), false)
  assert.equal(error.message.includes("nested_param"), false)

  const messageOnly = await captureStreamFailure({
    type: "error",
    sequence_number: 1,
    code: 429,
    message: "Top-level message only.",
    param: " \n\t ",
    error: {
      code: "nested_code",
      type: "nested_type",
      message: "Nested message.",
      param: "nested_param",
    },
  })

  assert.equal(messageOnly.message, "OpenAI error: Top-level message only.")
  assert.equal(messageOnly.message.includes("nested_code"), false)
  assert.equal(messageOnly.message.includes("nested_type"), false)
  assert.equal(messageOnly.message.includes("Nested message."), false)
  assert.equal(messageOnly.message.includes("nested_param"), false)
})

test("OpenAI invalid top-level error diagnostics fall back to nested diagnostics", async () => {
  const error = await captureStreamFailure({
    type: "error",
    sequence_number: 1,
    code: 429,
    message: " \n\t ",
    param: { unapproved_debug: SECRET_SENTINEL },
    error: {
      code: " nested_code ",
      type: " nested_type ",
      message: " Nested message. ",
      param: " nested_param ",
    },
  })

  assert.equal(
    error.message,
    "OpenAI error [nested_code] (type: nested_type) (param: nested_param): Nested message.",
  )
})

test("OpenAI bounds every approved stream-failure diagnostic", async () => {
  const failed = await captureStreamFailure({
    type: "response.failed",
    sequence_number: 1,
    response: {
      error: {
        code: "c".repeat(129),
        message: "m".repeat(513),
      },
    },
  })
  assert.equal(
    failed.message,
    "OpenAI response.failed [" + "c".repeat(128) + "]: " + "m".repeat(512),
  )

  const incomplete = await captureStreamFailure({
    type: "response.incomplete",
    sequence_number: 1,
    response: {
      incomplete_details: { reason: "r".repeat(129) },
    },
  })
  assert.equal(incomplete.message, "OpenAI response.incomplete [" + "r".repeat(128) + "]")

  const topLevel = await captureStreamFailure({
    type: "error",
    sequence_number: 1,
    code: "e".repeat(129),
    message: "n".repeat(513),
    param: "p".repeat(129),
  })
  assert.equal(
    topLevel.message,
    "OpenAI error [" + "e".repeat(128) + "] (param: " + "p".repeat(128) + "): " + "n".repeat(512),
  )
})

test("OpenAI ignores empty and non-string stream-failure diagnostics", async () => {
  const fixtures: Array<{ type: string; event: Record<string, unknown> }> = [
    {
      type: "response.failed",
      event: {
        type: "response.failed",
        sequence_number: 1,
        response: {
          error: {
            code: 503,
            message: " \n\t ",
            unapproved_debug: SECRET_SENTINEL,
          },
        },
      },
    },
    {
      type: "response.incomplete",
      event: {
        type: "response.incomplete",
        sequence_number: 1,
        response: {
          incomplete_details: { reason: { unapproved_debug: SECRET_SENTINEL } },
        },
      },
    },
    {
      type: "error",
      event: {
        type: "error",
        sequence_number: 1,
        code: false,
        message: [SECRET_SENTINEL],
        param: " \r\n ",
      },
    },
  ]

  for (const fixture of fixtures) {
    const error = await captureStreamFailure(fixture.event)
    assert.equal(error.message, "OpenAI " + fixture.type + " reported a stream failure.")
  }
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
