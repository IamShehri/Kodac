import { createHash } from "node:crypto"
import {
  ModelProviderError,
  type ModelMessage,
  type ModelProvider,
  type ModelProviderRequest,
  type ModelProviderResponse,
  type ModelProviderUsage,
  type ModelToolCall,
  type ModelToolDescriptor,
} from "./provider.ts"

const DEFAULT_ENDPOINT = "https://api.openai.com/v1/responses"
const RETRYABLE_STATUSES = new Set([408, 409, 429, 500, 502, 503, 504])
const MAX_STREAM_BYTES = 8 * 1024 * 1024
const MAX_STREAM_EVENTS = 20_000
const MAX_FAILURE_DIAGNOSTIC_LENGTH = 128
const MAX_FAILURE_MESSAGE_LENGTH = 512

type FetchLike = typeof fetch
type Sleep = (ms: number, signal?: AbortSignal) => Promise<void>

export interface OpenAIResponsesProviderOptions {
  apiKey?: string
  endpoint?: string
  fetchImpl?: FetchLike
  maxAttempts?: number
  clock?: () => number
  sleep?: Sleep
  stream?: boolean
}

interface OpenAIToolBinding {
  canonical: string
  provider: string
  descriptor: ModelToolDescriptor
}

interface ToolHistoryEntry {
  name: string
  input: unknown
  contextItems: unknown[]
}

interface ParsedResponse {
  assistant: string
  toolCalls: ModelToolCall[]
  contextItems: unknown[]
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

function providerToolName(name: string): string {
  const normalized = name.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/^_+|_+$/g, "") || "tool"
  const suffix = sha256(name).slice(0, 8)
  return `${normalized.slice(0, 55)}_${suffix}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function numeric(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined
}

function integer(value: unknown): number | undefined {
  return Number.isInteger(value) && (value as number) >= 0 ? value as number : undefined
}

function defaultSleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(signal.reason instanceof Error ? signal.reason : new Error("Operation aborted"))
  }
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer)
      signal?.removeEventListener("abort", onAbort)
      reject(signal?.reason instanceof Error ? signal.reason : new Error("Operation aborted"))
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort)
      resolve()
    }, ms)
    signal?.addEventListener("abort", onAbort, { once: true })
  })
}

function toolBindings(tools: ModelToolDescriptor[]): OpenAIToolBinding[] {
  const seen = new Set<string>()
  return tools.map((descriptor) => {
    const provider = providerToolName(descriptor.name)
    if (seen.has(provider)) {
      throw new ModelProviderError("tool_name_collision", "OpenAI tool name mapping collided.")
    }
    seen.add(provider)
    return { canonical: descriptor.name, provider, descriptor }
  })
}

function serializeToolInput(value: unknown): string {
  try {
    return JSON.stringify(value ?? {})
  } catch (error) {
    throw new ModelProviderError(
      "tool_input_not_serializable",
      "OpenAI tool input must be JSON-serializable.",
      { cause: error },
    )
  }
}

function mapMessages(
  messages: ModelMessage[],
  bindings: OpenAIToolBinding[],
  callHistory: Map<string, ToolHistoryEntry>,
): unknown[] {
  const aliasByCanonical = new Map(bindings.map((binding) => [binding.canonical, binding.provider]))
  const items: unknown[] = []
  const emittedCalls = new Set<string>()
  const emittedContext = new Set<string>()

  const emitContextItems = (contextItems: unknown[]): void => {
    for (const item of contextItems) {
      const key = sha256(JSON.stringify(item))
      if (emittedContext.has(key)) continue
      items.push(item)
      emittedContext.add(key)
    }
  }

  const emitCall = (call: ModelToolCall): void => {
    if (emittedCalls.has(call.id)) return
    const alias = aliasByCanonical.get(call.name)
    if (!alias) {
      throw new ModelProviderError(
        "unknown_tool_history",
        `OpenAI history references unavailable Kodac tool: ${call.name}`,
      )
    }
    items.push({
      type: "function_call",
      call_id: call.id,
      name: alias,
      arguments: serializeToolInput(call.input),
    })
    emittedCalls.add(call.id)
  }

  for (const message of messages) {
    if (message.role === "tool") {
      if (!message.toolCallId) {
        throw new ModelProviderError("tool_result_missing_call_id", "Tool result is missing toolCallId.")
      }
      const prior = callHistory.get(message.toolCallId)
      if (prior) {
        emitContextItems(prior.contextItems)
        emitCall({ id: message.toolCallId, name: prior.name, input: prior.input })
      }
      items.push({
        type: "function_call_output",
        call_id: message.toolCallId,
        output: message.content,
      })
      continue
    }

    if (message.content) items.push({ role: message.role, content: message.content })
    for (const call of message.toolCalls ?? []) {
      const prior = callHistory.get(call.id)
      if (prior) emitContextItems(prior.contextItems)
      emitCall(call)
    }
  }
  return items
}

function responseUsage(body: Record<string, unknown>): ModelProviderUsage | undefined {
  if (!isRecord(body.usage)) return undefined
  const inputTokens = numeric(body.usage.input_tokens)
  const outputTokens = numeric(body.usage.output_tokens)
  const totalTokens = numeric(body.usage.total_tokens)
  const inputDetails = isRecord(body.usage.input_tokens_details) ? body.usage.input_tokens_details : undefined
  const cachedInputTokens = numeric(inputDetails?.cached_tokens)
  if (
    inputTokens === undefined && cachedInputTokens === undefined &&
    outputTokens === undefined && totalTokens === undefined
  ) return undefined
  return { inputTokens, cachedInputTokens, outputTokens, totalTokens }
}

function parseAssistantAndCalls(
  body: Record<string, unknown>,
  bindings: OpenAIToolBinding[],
): ParsedResponse {
  const canonicalByAlias = new Map(bindings.map((binding) => [binding.provider, binding.canonical]))
  const text: string[] = []
  const toolCalls: ModelToolCall[] = []
  const contextItems: unknown[] = []
  const output = Array.isArray(body.output) ? body.output : []

  for (const item of output) {
    if (!isRecord(item)) continue
    if (item.type === "reasoning") {
      contextItems.push(item)
      continue
    }
    if (item.type === "message" && Array.isArray(item.content)) {
      for (const part of item.content) {
        if (isRecord(part) && part.type === "output_text" && typeof part.text === "string") {
          text.push(part.text)
        }
      }
      continue
    }
    if (item.type !== "function_call") continue

    const callId = typeof item.call_id === "string" ? item.call_id : undefined
    const alias = typeof item.name === "string" ? item.name : undefined
    const argumentsText = typeof item.arguments === "string" ? item.arguments : undefined
    if (!callId || !alias || argumentsText === undefined) {
      throw new ModelProviderError("malformed_tool_call", "OpenAI returned a malformed function call.")
    }
    const canonical = canonicalByAlias.get(alias)
    if (!canonical) {
      throw new ModelProviderError("unknown_tool_call", "OpenAI returned a function call for an unknown Kodac tool.")
    }

    let input: unknown
    try {
      input = JSON.parse(argumentsText)
    } catch (error) {
      throw new ModelProviderError(
        "invalid_tool_arguments",
        "OpenAI returned invalid JSON tool arguments.",
        { cause: error },
      )
    }
    if (!isRecord(input)) {
      throw new ModelProviderError("invalid_tool_arguments", "OpenAI tool arguments must be a JSON object.")
    }
    toolCalls.push({ id: callId, name: canonical, input })
  }

  if (text.length === 0 && typeof body.output_text === "string") text.push(body.output_text)
  return { assistant: text.join(""), toolCalls, contextItems }
}

function aborted(signal?: AbortSignal): ModelProviderError | undefined {
  if (!signal?.aborted) return undefined
  return new ModelProviderError(
    "request_aborted",
    "OpenAI request was aborted.",
    { retryable: false, cause: signal.reason },
  )
}

function completedResponse(
  body: Record<string, unknown>,
  bindings: OpenAIToolBinding[],
  attempts: number,
  latencyMs: number,
  requestId?: string,
): { response: ModelProviderResponse; parsed: ParsedResponse } {
  if (typeof body.status === "string" && body.status !== "completed") {
    throw new ModelProviderError(
      "incomplete_response",
      `OpenAI response status was ${body.status}.`,
      { retryable: false },
    )
  }
  const parsed = parseAssistantAndCalls(body, bindings)
  return {
    parsed,
    response: {
      assistant: parsed.assistant,
      toolCalls: parsed.toolCalls,
      finishReason: parsed.toolCalls.length > 0 ? "tool_calls" : "stop",
      metadata: {
        responseId: typeof body.id === "string" ? body.id : undefined,
        requestId,
        latencyMs,
        attempts,
        usage: responseUsage(body),
      },
    },
  }
}

function sseFrames(buffer: string): { frames: string[]; remainder: string } {
  const normalized = buffer.replace(/\r\n/g, "\n")
  const parts = normalized.split("\n\n")
  return { frames: parts.slice(0, -1), remainder: parts.at(-1) ?? "" }
}

function sseData(frame: string): string | undefined {
  const data = frame.split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).replace(/^ /, ""))
  return data.length > 0 ? data.join("\n") : undefined
}

function boundedFailureDiagnostic(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined
  const normalized = value.replace(/\s+/gu, " ").trim()
  if (!normalized) return undefined
  return normalized.slice(0, maxLength).trim()
}

function formatStreamFailure(
  eventType: "response.failed" | "response.incomplete" | "error",
  codeOrReason?: string,
  message?: string,
  param?: string,
  errorType?: string,
): string {
  let diagnostic = "OpenAI " + eventType
  if (codeOrReason) diagnostic += " [" + codeOrReason + "]"
  if (errorType) diagnostic += " (type: " + errorType + ")"
  if (param) diagnostic += " (param: " + param + ")"
  if (message) diagnostic += ": " + message
  return codeOrReason || errorType || message || param
    ? diagnostic
    : diagnostic + " reported a stream failure."
}

function streamFailureMessage(event: Record<string, unknown>): string {
  if (event.type === "response.failed") {
    const response = isRecord(event.response) ? event.response : undefined
    const error = isRecord(response?.error) ? response.error : undefined
    return formatStreamFailure(
      "response.failed",
      boundedFailureDiagnostic(error?.code, MAX_FAILURE_DIAGNOSTIC_LENGTH),
      boundedFailureDiagnostic(error?.message, MAX_FAILURE_MESSAGE_LENGTH),
    )
  }

  if (event.type === "response.incomplete") {
    const response = isRecord(event.response) ? event.response : undefined
    const details = isRecord(response?.incomplete_details) ? response.incomplete_details : undefined
    return formatStreamFailure(
      "response.incomplete",
      boundedFailureDiagnostic(details?.reason, MAX_FAILURE_DIAGNOSTIC_LENGTH),
    )
  }

  if (event.type === "error") {
    const code = boundedFailureDiagnostic(event.code, MAX_FAILURE_DIAGNOSTIC_LENGTH)
    const message = boundedFailureDiagnostic(event.message, MAX_FAILURE_MESSAGE_LENGTH)
    const param = boundedFailureDiagnostic(event.param, MAX_FAILURE_DIAGNOSTIC_LENGTH)

    if (code || message || param) {
      return formatStreamFailure("error", code, message, param)
    }

    const error = isRecord(event.error) ? event.error : undefined
    return formatStreamFailure(
      "error",
      boundedFailureDiagnostic(error?.code, MAX_FAILURE_DIAGNOSTIC_LENGTH),
      boundedFailureDiagnostic(error?.message, MAX_FAILURE_MESSAGE_LENGTH),
      boundedFailureDiagnostic(error?.param, MAX_FAILURE_DIAGNOSTIC_LENGTH),
      boundedFailureDiagnostic(error?.type, MAX_FAILURE_DIAGNOSTIC_LENGTH),
    )
  }

  return "OpenAI stream reported a failure."
}

export class OpenAIResponsesProvider implements ModelProvider {
  readonly name = "openai"
  private readonly apiKey?: string
  private readonly endpoint: string
  private readonly fetchImpl: FetchLike
  private readonly maxAttempts: number
  private readonly clock: () => number
  private readonly sleep: Sleep
  private readonly stream: boolean
  private readonly callHistory = new Map<string, ToolHistoryEntry>()

  constructor(options: OpenAIResponsesProviderOptions = {}) {
    this.apiKey = options.apiKey
    this.endpoint = options.endpoint ?? DEFAULT_ENDPOINT
    this.fetchImpl = options.fetchImpl ?? fetch
    this.maxAttempts = options.maxAttempts ?? 3
    this.clock = options.clock ?? (() => Date.now())
    this.sleep = options.sleep ?? defaultSleep
    this.stream = options.stream ?? false
    if (!Number.isInteger(this.maxAttempts) || this.maxAttempts <= 0 || this.maxAttempts > 5) {
      throw new Error("OpenAI maxAttempts must be an integer between 1 and 5")
    }
  }

  private credential(): string {
    const value = this.apiKey ?? process.env.OPENAI_API_KEY
    if (!value?.trim()) {
      throw new ModelProviderError("credential_missing", "OPENAI_API_KEY is not configured.", { retryable: false })
    }
    return value.trim()
  }

  private rememberCalls(parsed: ParsedResponse): void {
    for (const call of parsed.toolCalls) {
      this.callHistory.set(call.id, {
        name: call.name,
        input: call.input,
        contextItems: parsed.contextItems,
      })
    }
  }

  private async parseStream(
    httpResponse: Response,
    request: ModelProviderRequest,
    bindings: OpenAIToolBinding[],
    attempt: number,
    startedAt: number,
    requestId?: string,
  ): Promise<ModelProviderResponse> {
    if (!httpResponse.body) {
      throw new ModelProviderError("stream_missing_body", "OpenAI streaming response did not include a body.", { retryable: true })
    }
    const contentType = httpResponse.headers.get("content-type") ?? ""
    if (!contentType.toLowerCase().includes("text/event-stream")) {
      throw new ModelProviderError("invalid_stream_content_type", "OpenAI streaming response was not text/event-stream.")
    }

    const reader = httpResponse.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    let bytes = 0
    let eventCount = 0
    let lastSequence = -1
    let sawStarted = false
    let sawCompleted = false
    let streamedText = ""
    let finalResponse: ModelProviderResponse | undefined

    const emit = async (event: Parameters<NonNullable<ModelProviderRequest["onStreamEvent"]>>[0]): Promise<void> => {
      await request.onStreamEvent?.(event)
      const signalError = aborted(request.signal)
      if (signalError) throw signalError
    }

    const processData = async (data: string): Promise<void> => {
      if (!data.trim()) return
      if (data.trim() === "[DONE]") {
        if (!sawCompleted) throw new ModelProviderError("incomplete_stream", "OpenAI stream ended before response.completed.")
        return
      }
      eventCount += 1
      if (eventCount > MAX_STREAM_EVENTS) {
        throw new ModelProviderError("stream_event_limit", "OpenAI stream exceeded the Kodac event-count limit.")
      }
      let value: unknown
      try {
        value = JSON.parse(data)
      } catch (error) {
        throw new ModelProviderError("invalid_stream_event", "OpenAI stream emitted invalid JSON.", { cause: error })
      }
      if (!isRecord(value) || typeof value.type !== "string") {
        throw new ModelProviderError("invalid_stream_event", "OpenAI stream event was not a typed object.")
      }
      const sequence = integer(value.sequence_number)
      if (sequence !== undefined) {
        if (sequence <= lastSequence) {
          throw new ModelProviderError("invalid_stream_sequence", "OpenAI stream sequence numbers were not strictly increasing.")
        }
        lastSequence = sequence
      }

      if (value.type === "response.created") {
        if (sawStarted) throw new ModelProviderError("invalid_stream_order", "OpenAI stream emitted response.created more than once.")
        sawStarted = true
        await emit({ type: "started" })
        return
      }
      if (value.type === "response.output_text.delta") {
        if (!sawStarted || sawCompleted || typeof value.delta !== "string") {
          throw new ModelProviderError("invalid_stream_event", "OpenAI output-text delta was malformed or out of order.")
        }
        streamedText += value.delta
        await emit({ type: "text_delta", text: value.delta })
        return
      }
      if (value.type === "response.function_call_arguments.delta") {
        const index = integer(value.output_index)
        if (!sawStarted || sawCompleted || index === undefined || typeof value.item_id !== "string" || typeof value.delta !== "string") {
          throw new ModelProviderError("invalid_stream_event", "OpenAI function-call delta was malformed or out of order.")
        }
        await emit({ type: "tool_call_delta", index, id: value.item_id, argumentsDelta: value.delta })
        return
      }
      if (value.type === "response.function_call_arguments.done") {
        const index = integer(value.output_index)
        if (!sawStarted || sawCompleted || index === undefined || typeof value.item_id !== "string" || typeof value.name !== "string" || typeof value.arguments !== "string") {
          throw new ModelProviderError("invalid_stream_event", "OpenAI function-call completion event was malformed or out of order.")
        }
        await emit({ type: "tool_call_delta", index, id: value.item_id, name: value.name })
        return
      }
      if (value.type === "response.failed" || value.type === "response.incomplete" || value.type === "error") {
        throw new ModelProviderError(
          "stream_failed",
          streamFailureMessage(value),
          { retryable: false },
        )
      }
      if (value.type !== "response.completed") return
      if (!sawStarted || sawCompleted || !isRecord(value.response)) {
        throw new ModelProviderError("invalid_stream_event", "OpenAI response.completed event was malformed or out of order.")
      }
      sawCompleted = true
      const completed = completedResponse(
        value.response,
        bindings,
        attempt,
        Math.max(0, this.clock() - startedAt),
        requestId,
      )
      if (streamedText && completed.response.assistant !== streamedText) {
        throw new ModelProviderError("stream_text_mismatch", "OpenAI streamed text did not match the completed response.")
      }
      this.rememberCalls(completed.parsed)
      finalResponse = completed.response
      if (finalResponse.metadata?.usage) await emit({ type: "usage", usage: finalResponse.metadata.usage })
      await emit({
        type: "completed",
        finishReason: finalResponse.finishReason,
        responseId: finalResponse.metadata?.responseId,
      })
    }

    try {
      while (true) {
        const signalError = aborted(request.signal)
        if (signalError) throw signalError
        const result = await reader.read()
        if (result.done) break
        bytes += result.value.byteLength
        if (bytes > MAX_STREAM_BYTES) {
          throw new ModelProviderError("stream_too_large", "OpenAI stream exceeded the Kodac response-size limit.")
        }
        buffer += decoder.decode(result.value, { stream: true })
        const split = sseFrames(buffer)
        buffer = split.remainder
        for (const frame of split.frames) {
          const data = sseData(frame)
          if (data !== undefined) await processData(data)
        }
      }
      buffer += decoder.decode()
      if (buffer.trim()) {
        const data = sseData(buffer.replace(/\r\n/g, "\n"))
        if (data !== undefined) await processData(data)
      }
    } catch (error) {
      const signalError = aborted(request.signal)
      if (signalError) throw signalError
      if (error instanceof ModelProviderError) throw error
      throw new ModelProviderError(
        sawStarted ? "stream_interrupted" : "stream_network_error",
        sawStarted ? "OpenAI stream was interrupted after output began." : "OpenAI stream failed before output began.",
        { retryable: !sawStarted, cause: error },
      )
    } finally {
      reader.releaseLock()
    }

    if (!sawStarted || !sawCompleted || !finalResponse) {
      throw new ModelProviderError("incomplete_stream", "OpenAI stream ended before response.completed.")
    }
    return finalResponse
  }

  async generate(request: ModelProviderRequest): Promise<ModelProviderResponse> {
    const preflightAbort = aborted(request.signal)
    if (preflightAbort) throw preflightAbort
    if (!request.model.trim() || request.model.startsWith("fixture/")) {
      throw new ModelProviderError(
        "model_required",
        "OpenAI provider requires an explicit OpenAI model id.",
        { retryable: false },
      )
    }

    const bindings = toolBindings(request.tools)
    const payload: Record<string, unknown> = {
      model: request.model,
      store: false,
      input: mapMessages(request.messages, bindings, this.callHistory),
    }
    if (this.stream) payload.stream = true
    if (bindings.length > 0) {
      payload.tools = bindings.map((binding) => ({
        type: "function",
        name: binding.provider,
        description: binding.descriptor.description,
        parameters: binding.descriptor.inputSchema,
        strict: false,
      }))
      payload.tool_choice = "auto"
    }

    const apiKey = this.credential()
    const startedAt = this.clock()
    let lastError: ModelProviderError | undefined

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      const signalError = aborted(request.signal)
      if (signalError) throw signalError

      let response: Response
      try {
        response = await this.fetchImpl(this.endpoint, {
          method: "POST",
          headers: {
            authorization: `Bearer ${apiKey}`,
            "content-type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: request.signal,
        })
      } catch (error) {
        const afterFetchAbort = aborted(request.signal)
        if (afterFetchAbort) throw afterFetchAbort
        lastError = new ModelProviderError(
          "network_error",
          "OpenAI API request failed.",
          { retryable: true, cause: error },
        )
        if (attempt >= this.maxAttempts) throw lastError
        await this.sleep(Math.min(2_000, 250 * 2 ** (attempt - 1)), request.signal)
        continue
      }

      const requestId = response.headers.get("x-request-id") ?? undefined
      if (!response.ok) {
        const retryable = RETRYABLE_STATUSES.has(response.status)
        lastError = new ModelProviderError(
          "http_error",
          `OpenAI API request failed with status ${response.status}.`,
          { retryable, status: response.status },
        )
        if (!retryable || attempt >= this.maxAttempts) throw lastError
        await this.sleep(Math.min(2_000, 250 * 2 ** (attempt - 1)), request.signal)
        continue
      }

      if (this.stream) {
        try {
          return await this.parseStream(response, request, bindings, attempt, startedAt, requestId)
        } catch (error) {
          if (!(error instanceof ModelProviderError) || !error.retryable || attempt >= this.maxAttempts) throw error
          lastError = error
          await this.sleep(Math.min(2_000, 250 * 2 ** (attempt - 1)), request.signal)
          continue
        }
      }

      let body: unknown
      try {
        body = await response.json()
      } catch (error) {
        throw new ModelProviderError(
          "invalid_json",
          "OpenAI API returned invalid JSON.",
          { retryable: false, cause: error },
        )
      }
      if (!isRecord(body)) {
        throw new ModelProviderError("invalid_response", "OpenAI API returned an invalid response object.")
      }
      const completed = completedResponse(
        body,
        bindings,
        attempt,
        Math.max(0, this.clock() - startedAt),
        requestId,
      )
      this.rememberCalls(completed.parsed)
      return completed.response
    }

    throw lastError ?? new ModelProviderError("request_failed", "OpenAI API request failed.")
  }
}
