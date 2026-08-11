import {
  ModelProviderError,
  type ModelMessage,
  type ModelProvider,
  type ModelProviderRequest,
  type ModelProviderResponse,
  type ModelProviderStreamEvent,
  type ModelProviderUsage,
  type ModelToolCall,
} from "./provider.ts"

export type ProviderFetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>

type Sleep = (milliseconds: number, signal?: AbortSignal) => Promise<void>

export interface OpenAICompatibleProviderOptions {
  apiKey?: string
  baseUrl?: string
  maxAttempts?: number
  stream?: boolean
  fetchImpl?: ProviderFetch
  sleep?: Sleep
}

const DEFAULT_BASE_URL = "https://api.openai.com/v1"
const MAX_RESPONSE_BYTES = 8 * 1024 * 1024
const RETRYABLE_STATUS = new Set([408, 409, 429])

function providerError(code: string, message: string, options: { retryable?: boolean; status?: number; cause?: unknown } = {}): ModelProviderError {
  return new ModelProviderError(code, message, options)
}

function validatedBaseUrl(raw: string): URL {
  let url: URL
  try {
    url = new URL(raw)
  } catch (error) {
    throw providerError("invalid_base_url", "OpenAI-compatible base URL is invalid.", { cause: error })
  }
  if (url.username || url.password || url.search || url.hash) {
    throw providerError("invalid_base_url", "OpenAI-compatible base URL must not contain credentials, query parameters, or fragments.")
  }
  const localHost = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1"
  if (url.protocol !== "https:" && !(url.protocol === "http:" && localHost)) {
    throw providerError("invalid_base_url", "OpenAI-compatible base URL must use HTTPS, except loopback development endpoints may use HTTP.")
  }
  return url
}

function endpoint(baseUrl: URL): URL {
  const normalized = baseUrl.toString().replace(/\/$/, "")
  return new URL(`${normalized}/chat/completions`)
}

function abortError(signal?: AbortSignal): Error {
  return signal?.reason instanceof Error ? signal.reason : new Error("Operation aborted")
}

async function defaultSleep(milliseconds: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) throw abortError(signal)
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, milliseconds)
    const onAbort = () => {
      clearTimeout(timer)
      reject(abortError(signal))
    }
    signal?.addEventListener("abort", onAbort, { once: true })
    if (signal) {
      const cleanup = () => signal.removeEventListener("abort", onAbort)
      setTimeout(cleanup, milliseconds + 1)
    }
  })
}

function nonNegativeInteger(value: unknown): number | undefined {
  return Number.isInteger(value) && (value as number) >= 0 ? value as number : undefined
}

function mapUsage(value: unknown): ModelProviderUsage | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined
  const usage = value as Record<string, unknown>
  const promptDetails = usage.prompt_tokens_details && typeof usage.prompt_tokens_details === "object" && !Array.isArray(usage.prompt_tokens_details)
    ? usage.prompt_tokens_details as Record<string, unknown>
    : undefined
  const mapped: ModelProviderUsage = {
    inputTokens: nonNegativeInteger(usage.prompt_tokens),
    cachedInputTokens: nonNegativeInteger(promptDetails?.cached_tokens),
    outputTokens: nonNegativeInteger(usage.completion_tokens),
    totalTokens: nonNegativeInteger(usage.total_tokens),
  }
  return Object.values(mapped).some((item) => item !== undefined) ? mapped : undefined
}

function stringifyToolArguments(input: unknown): string {
  const serialized = JSON.stringify(input)
  if (serialized === undefined) throw providerError("invalid_tool_input", "Kodac tool input must be JSON-serializable before provider dispatch.")
  return serialized
}

function mapMessage(message: ModelMessage): Record<string, unknown> {
  if (message.role === "tool") {
    if (!message.toolCallId) throw providerError("invalid_history", "Tool history requires toolCallId.")
    return { role: "tool", tool_call_id: message.toolCallId, content: message.content }
  }
  if (message.role === "assistant") {
    const toolCalls = message.toolCalls?.map((call) => ({
      id: call.id,
      type: "function",
      function: { name: call.name, arguments: stringifyToolArguments(call.input) },
    }))
    return {
      role: "assistant",
      content: message.content || null,
      ...(toolCalls?.length ? { tool_calls: toolCalls } : {}),
    }
  }
  return { role: message.role, content: message.content }
}

function parseToolCalls(value: unknown): ModelToolCall[] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) throw providerError("invalid_response", "Provider tool_calls must be an array.")
  return value.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw providerError("invalid_response", `Provider tool call ${index} is invalid.`)
    const record = item as Record<string, unknown>
    const fn = record.function
    if (record.type !== "function" || typeof record.id !== "string" || !record.id || !fn || typeof fn !== "object" || Array.isArray(fn)) {
      throw providerError("invalid_response", `Provider tool call ${index} is not a valid function call.`)
    }
    const functionRecord = fn as Record<string, unknown>
    if (typeof functionRecord.name !== "string" || !functionRecord.name || typeof functionRecord.arguments !== "string") {
      throw providerError("invalid_response", `Provider tool call ${index} has invalid function fields.`)
    }
    let input: unknown
    try {
      input = JSON.parse(functionRecord.arguments)
    } catch (error) {
      throw providerError("invalid_tool_arguments", `Provider tool call ${index} returned invalid JSON arguments.`, { cause: error })
    }
    return { id: record.id, name: functionRecord.name, input }
  })
}

function parseResponse(value: unknown, attempts: number, latencyMs: number, requestId?: string): ModelProviderResponse {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw providerError("invalid_response", "Provider response must be a JSON object.")
  const root = value as Record<string, unknown>
  if (!Array.isArray(root.choices) || root.choices.length !== 1) throw providerError("invalid_response", "Provider response must contain exactly one choice.")
  const choice = root.choices[0]
  if (!choice || typeof choice !== "object" || Array.isArray(choice)) throw providerError("invalid_response", "Provider choice is invalid.")
  const choiceRecord = choice as Record<string, unknown>
  const message = choiceRecord.message
  if (!message || typeof message !== "object" || Array.isArray(message)) throw providerError("invalid_response", "Provider choice message is invalid.")
  const messageRecord = message as Record<string, unknown>
  const content = messageRecord.content === null || messageRecord.content === undefined ? "" : messageRecord.content
  if (typeof content !== "string") throw providerError("invalid_response", "Provider assistant content must be a string or null.")
  const toolCalls = parseToolCalls(messageRecord.tool_calls)
  const finishReason = choiceRecord.finish_reason
  if (finishReason === "tool_calls") {
    if (toolCalls.length === 0) throw providerError("invalid_response", "Provider finish_reason=tool_calls requires at least one tool call.")
  } else if (finishReason !== "stop") {
    throw providerError("incomplete_response", `Provider response did not complete normally (finish_reason=${String(finishReason)}).`)
  } else if (toolCalls.length > 0) {
    throw providerError("invalid_response", "Provider returned tool calls with finish_reason=stop.")
  }
  return {
    assistant: content,
    toolCalls,
    finishReason: finishReason as "stop" | "tool_calls",
    metadata: {
      responseId: typeof root.id === "string" ? root.id : undefined,
      requestId,
      latencyMs,
      attempts,
      usage: mapUsage(root.usage),
    },
  }
}

function retryableStatus(status: number): boolean {
  return RETRYABLE_STATUS.has(status) || status >= 500
}

async function boundedJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (Buffer.byteLength(text, "utf8") > MAX_RESPONSE_BYTES) throw providerError("response_too_large", "Provider response exceeded the Kodac response-size limit.")
  try {
    return JSON.parse(text)
  } catch (error) {
    throw providerError("invalid_response", "Provider response was not valid JSON.", { cause: error })
  }
}

async function emitStream(request: ModelProviderRequest, event: ModelProviderStreamEvent): Promise<void> {
  await request.onStreamEvent?.(event)
}

function nextSseEvent(buffer: string): { block: string; rest: string } | undefined {
  const match = /\r?\n\r?\n/.exec(buffer)
  if (!match || match.index === undefined) return undefined
  return { block: buffer.slice(0, match.index), rest: buffer.slice(match.index + match[0].length) }
}

function sseData(block: string): string | undefined {
  const data = block.split(/\r?\n/).filter((line) => line.startsWith("data:")).map((line) => line.slice(5).replace(/^ /, ""))
  return data.length ? data.join("\n") : undefined
}

interface StreamingToolAccumulator { id: string; name: string; arguments: string }

async function parseStreamingResponse(
  response: Response,
  request: ModelProviderRequest,
  attempts: number,
  startedAt: number,
  requestId?: string,
): Promise<ModelProviderResponse> {
  const contentType = response.headers.get("content-type")
  if (contentType && !contentType.toLowerCase().includes("text/event-stream")) {
    throw providerError("invalid_stream", "Provider streaming response must use text/event-stream.")
  }
  if (!response.body) throw providerError("invalid_stream", "Provider streaming response did not include a response body.")

  await emitStream(request, { type: "started" })
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let totalBytes = 0
  let assistant = ""
  let responseId: string | undefined
  let usage: ModelProviderUsage | undefined
  let finishReason: "stop" | "tool_calls" | undefined
  let sawDone = false
  const tools = new Map<number, StreamingToolAccumulator>()

  const consumePayload = async (payload: string): Promise<void> => {
    if (payload === "[DONE]") { sawDone = true; return }
    let parsed: unknown
    try { parsed = JSON.parse(payload) } catch (error) {
      throw providerError("invalid_stream_event", "Provider stream contained invalid JSON.", { cause: error })
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw providerError("invalid_stream_event", "Provider stream event must be a JSON object.")
    const root = parsed as Record<string, unknown>
    if (typeof root.id === "string" && root.id) responseId = root.id
    const mappedUsage = mapUsage(root.usage)
    if (mappedUsage) { usage = mappedUsage; await emitStream(request, { type: "usage", usage: mappedUsage }) }
    if (!Array.isArray(root.choices)) throw providerError("invalid_stream_event", "Provider stream event choices must be an array.")
    if (root.choices.length === 0) return
    if (root.choices.length !== 1) throw providerError("invalid_stream_event", "Provider stream event must contain at most one choice.")
    const choice = root.choices[0]
    if (!choice || typeof choice !== "object" || Array.isArray(choice)) throw providerError("invalid_stream_event", "Provider stream choice is invalid.")
    const choiceRecord = choice as Record<string, unknown>
    if (choiceRecord.index !== undefined && choiceRecord.index !== 0) throw providerError("invalid_stream_event", "Kodac streaming currently requires choice index 0.")
    const delta = choiceRecord.delta
    if (!delta || typeof delta !== "object" || Array.isArray(delta)) throw providerError("invalid_stream_event", "Provider stream choice delta is invalid.")
    const deltaRecord = delta as Record<string, unknown>
    if (deltaRecord.content !== undefined && deltaRecord.content !== null) {
      if (typeof deltaRecord.content !== "string") throw providerError("invalid_stream_event", "Provider text delta must be a string or null.")
      if (deltaRecord.content) { assistant += deltaRecord.content; await emitStream(request, { type: "text_delta", text: deltaRecord.content }) }
    }
    if (deltaRecord.tool_calls !== undefined) {
      if (!Array.isArray(deltaRecord.tool_calls)) throw providerError("invalid_stream_event", "Provider tool-call delta must be an array.")
      for (const raw of deltaRecord.tool_calls) {
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw providerError("invalid_stream_event", "Provider tool-call delta is invalid.")
        const record = raw as Record<string, unknown>
        if (!Number.isInteger(record.index) || (record.index as number) < 0) throw providerError("invalid_stream_event", "Provider tool-call delta requires a non-negative index.")
        const index = record.index as number
        const current = tools.get(index) ?? { id: "", name: "", arguments: "" }
        let id: string | undefined
        let name: string | undefined
        let argumentsDelta: string | undefined
        if (record.id !== undefined) {
          if (typeof record.id !== "string" || !record.id) throw providerError("invalid_stream_event", "Provider tool-call id delta is invalid.")
          if (current.id && current.id !== record.id) throw providerError("invalid_stream_event", "Provider changed a tool-call id mid-stream.")
          current.id = record.id; id = record.id
        }
        if (record.function !== undefined) {
          if (!record.function || typeof record.function !== "object" || Array.isArray(record.function)) throw providerError("invalid_stream_event", "Provider tool-call function delta is invalid.")
          const fn = record.function as Record<string, unknown>
          if (fn.name !== undefined) {
            if (typeof fn.name !== "string") throw providerError("invalid_stream_event", "Provider tool-call name delta is invalid.")
            if (fn.name) { if (!current.name) current.name = fn.name; else if (current.name !== fn.name) current.name += fn.name; name = fn.name }
          }
          if (fn.arguments !== undefined) {
            if (typeof fn.arguments !== "string") throw providerError("invalid_stream_event", "Provider tool-call arguments delta is invalid.")
            current.arguments += fn.arguments; argumentsDelta = fn.arguments
          }
        }
        tools.set(index, current)
        await emitStream(request, { type: "tool_call_delta", index, id, name, argumentsDelta })
      }
    }
    const rawFinish = choiceRecord.finish_reason
    if (rawFinish !== undefined && rawFinish !== null) {
      if (rawFinish !== "stop" && rawFinish !== "tool_calls") throw providerError("incomplete_response", `Provider stream did not complete normally (finish_reason=${String(rawFinish)}).`)
      if (finishReason && finishReason !== rawFinish) throw providerError("invalid_stream_event", "Provider changed finish_reason mid-stream.")
      finishReason = rawFinish
    }
  }

  try {
    while (true) {
      if (request.signal?.aborted) { await reader.cancel().catch(() => undefined); throw abortError(request.signal) }
      let chunk: ReadableStreamReadResult<Uint8Array>
      try { chunk = await reader.read() } catch (error) {
        throw providerError("stream_interrupted", "Provider stream was interrupted after it started; Kodac will not retry a partial stream.", { cause: error })
      }
      if (chunk.done) break
      totalBytes += chunk.value.byteLength
      if (totalBytes > MAX_RESPONSE_BYTES) throw providerError("response_too_large", "Provider stream exceeded the Kodac response-size limit.")
      buffer += decoder.decode(chunk.value, { stream: true })
      while (true) {
        const event = nextSseEvent(buffer)
        if (!event) break
        buffer = event.rest
        const payload = sseData(event.block)
        if (payload !== undefined) await consumePayload(payload)
        if (sawDone) break
      }
      if (sawDone) break
    }
    buffer += decoder.decode()
    if (!sawDone && buffer.trim()) {
      const payload = sseData(buffer)
      if (payload !== undefined) await consumePayload(payload)
    }
  } finally { reader.releaseLock() }

  if (!sawDone) throw providerError("incomplete_stream", "Provider stream ended before the [DONE] sentinel.")
  if (!finishReason) throw providerError("incomplete_stream", "Provider stream ended without a normal finish_reason.")
  const toolCalls: ModelToolCall[] = [...tools.entries()].sort(([left], [right]) => left - right).map(([index, tool]) => {
    if (!tool.id || !tool.name) throw providerError("incomplete_stream", `Provider tool call ${index} ended without id/name.`)
    let input: unknown
    try { input = JSON.parse(tool.arguments) } catch (error) {
      throw providerError("invalid_tool_arguments", `Provider tool call ${index} returned invalid streamed JSON arguments.`, { cause: error })
    }
    return { id: tool.id, name: tool.name, input }
  })
  if (finishReason === "tool_calls" && toolCalls.length === 0) throw providerError("invalid_stream", "Provider finish_reason=tool_calls requires streamed tool calls.")
  if (finishReason === "stop" && toolCalls.length > 0) throw providerError("invalid_stream", "Provider streamed tool calls with finish_reason=stop.")
  await emitStream(request, { type: "completed", finishReason, responseId })
  return { assistant, toolCalls, finishReason, metadata: { responseId, requestId, latencyMs: Math.max(0, Date.now() - startedAt), attempts, usage } }
}

export class OpenAICompatibleProvider implements ModelProvider {
  readonly name = "openai-compatible"
  private readonly apiKey?: string
  private readonly baseUrl: URL
  private readonly maxAttempts: number
  private readonly stream: boolean
  private readonly fetchImpl: ProviderFetch
  private readonly sleep: Sleep

  constructor(options: OpenAICompatibleProviderOptions = {}) {
    this.apiKey = options.apiKey?.trim() || undefined
    this.baseUrl = validatedBaseUrl(options.baseUrl ?? DEFAULT_BASE_URL)
    this.maxAttempts = options.maxAttempts ?? 3
    this.stream = options.stream ?? false
    if (!Number.isInteger(this.maxAttempts) || this.maxAttempts < 1 || this.maxAttempts > 5) throw providerError("invalid_retry_policy", "OpenAI-compatible maxAttempts must be an integer from 1 to 5.")
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis)
    this.sleep = options.sleep ?? defaultSleep
    if (this.baseUrl.origin === "https://api.openai.com" && !this.apiKey) throw providerError("credentials_missing", "OPENAI_API_KEY (or KODAC_OPENAI_COMPATIBLE_API_KEY) is required for the default OpenAI endpoint.")
  }

  static fromEnv(env: NodeJS.ProcessEnv = process.env, options: Omit<OpenAICompatibleProviderOptions, "apiKey" | "baseUrl"> = {}): OpenAICompatibleProvider {
    return new OpenAICompatibleProvider({ ...options, apiKey: env.KODAC_OPENAI_COMPATIBLE_API_KEY ?? env.OPENAI_API_KEY, baseUrl: env.KODAC_OPENAI_COMPATIBLE_BASE_URL ?? env.OPENAI_BASE_URL ?? DEFAULT_BASE_URL })
  }

  async generate(request: ModelProviderRequest): Promise<ModelProviderResponse> {
    if (!request.model.trim()) throw providerError("invalid_model", "Provider model id must not be empty.")
    const url = endpoint(this.baseUrl)
    const body = JSON.stringify({
      model: request.model,
      messages: request.messages.map(mapMessage),
      tools: request.tools.map((tool) => ({ type: "function", function: { name: tool.name, description: tool.description, parameters: tool.inputSchema, strict: true } })),
      tool_choice: request.tools.length ? "auto" : undefined,
      stream: this.stream,
      ...(this.stream ? { stream_options: { include_usage: true } } : {}),
    })
    const startedAt = Date.now()
    let lastError: unknown
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      if (request.signal?.aborted) throw abortError(request.signal)
      try {
        const headers: Record<string, string> = { "content-type": "application/json" }
        if (this.apiKey) headers.authorization = `Bearer ${this.apiKey}`
        const response = await this.fetchImpl(url, { method: "POST", headers, body, signal: request.signal })
        const requestId = response.headers.get("x-request-id") ?? undefined
        if (!response.ok) {
          const retryable = retryableStatus(response.status)
          const error = providerError("http_error", `Provider request failed with HTTP ${response.status}.`, { retryable, status: response.status })
          if (!retryable || attempt === this.maxAttempts) throw error
          lastError = error
        } else if (this.stream) {
          return await parseStreamingResponse(response, request, attempt, startedAt, requestId)
        } else {
          const json = await boundedJson(response)
          return parseResponse(json, attempt, Math.max(0, Date.now() - startedAt), requestId)
        }
      } catch (error) {
        if (request.signal?.aborted) throw abortError(request.signal)
        if (error instanceof ModelProviderError && !error.retryable) throw error
        if (error instanceof ModelProviderError && attempt === this.maxAttempts) throw error
        if (!(error instanceof ModelProviderError)) {
          const wrapped = providerError("network_error", "Provider network request failed.", { retryable: true, cause: error })
          if (attempt === this.maxAttempts) throw wrapped
          lastError = wrapped
        } else lastError = error
      }
      await this.sleep(Math.min(2_000, 250 * 2 ** (attempt - 1)), request.signal)
    }
    throw lastError instanceof Error ? lastError : providerError("provider_failure", "Provider request failed.")
  }
}
