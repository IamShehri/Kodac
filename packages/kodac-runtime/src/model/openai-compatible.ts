import { ModelProviderError, type ModelMessage, type ModelProvider, type ModelProviderRequest, type ModelProviderResponse, type ModelProviderUsage, type ModelToolCall } from "./provider.ts"

export type ProviderFetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>

type Sleep = (milliseconds: number, signal?: AbortSignal) => Promise<void>

export interface OpenAICompatibleProviderOptions {
  apiKey?: string
  baseUrl?: string
  maxAttempts?: number
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

export class OpenAICompatibleProvider implements ModelProvider {
  readonly name = "openai-compatible"
  private readonly apiKey?: string
  private readonly baseUrl: URL
  private readonly maxAttempts: number
  private readonly fetchImpl: ProviderFetch
  private readonly sleep: Sleep

  constructor(options: OpenAICompatibleProviderOptions = {}) {
    this.apiKey = options.apiKey?.trim() || undefined
    this.baseUrl = validatedBaseUrl(options.baseUrl ?? DEFAULT_BASE_URL)
    this.maxAttempts = options.maxAttempts ?? 3
    if (!Number.isInteger(this.maxAttempts) || this.maxAttempts < 1 || this.maxAttempts > 5) {
      throw providerError("invalid_retry_policy", "OpenAI-compatible maxAttempts must be an integer from 1 to 5.")
    }
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis)
    this.sleep = options.sleep ?? defaultSleep
    if (this.baseUrl.origin === "https://api.openai.com" && !this.apiKey) {
      throw providerError("credentials_missing", "OPENAI_API_KEY (or KODAC_OPENAI_COMPATIBLE_API_KEY) is required for the default OpenAI endpoint.")
    }
  }

  static fromEnv(env: NodeJS.ProcessEnv = process.env, options: Omit<OpenAICompatibleProviderOptions, "apiKey" | "baseUrl"> = {}): OpenAICompatibleProvider {
    return new OpenAICompatibleProvider({
      ...options,
      apiKey: env.KODAC_OPENAI_COMPATIBLE_API_KEY ?? env.OPENAI_API_KEY,
      baseUrl: env.KODAC_OPENAI_COMPATIBLE_BASE_URL ?? env.OPENAI_BASE_URL ?? DEFAULT_BASE_URL,
    })
  }

  async generate(request: ModelProviderRequest): Promise<ModelProviderResponse> {
    if (!request.model.trim()) throw providerError("invalid_model", "Provider model id must not be empty.")
    const url = endpoint(this.baseUrl)
    const body = JSON.stringify({
      model: request.model,
      messages: request.messages.map(mapMessage),
      tools: request.tools.map((tool) => ({
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
          strict: true,
        },
      })),
      tool_choice: request.tools.length ? "auto" : undefined,
      stream: false,
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
        } else {
          lastError = error
        }
      }
      await this.sleep(Math.min(2_000, 250 * 2 ** (attempt - 1)), request.signal)
    }

    throw lastError instanceof Error ? lastError : providerError("provider_failure", "Provider request failed.")
  }
}
