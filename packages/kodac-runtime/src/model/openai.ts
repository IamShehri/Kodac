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

type FetchLike = typeof fetch
type Sleep = (ms: number, signal?: AbortSignal) => Promise<void>

export interface OpenAIResponsesProviderOptions {
  apiKey?: string
  endpoint?: string
  fetchImpl?: FetchLike
  maxAttempts?: number
  clock?: () => number
  sleep?: Sleep
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
): { assistant: string; toolCalls: ModelToolCall[]; contextItems: unknown[] } {
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

export class OpenAIResponsesProvider implements ModelProvider {
  readonly name = "openai"
  private readonly apiKey?: string
  private readonly endpoint: string
  private readonly fetchImpl: FetchLike
  private readonly maxAttempts: number
  private readonly clock: () => number
  private readonly sleep: Sleep
  private readonly callHistory = new Map<string, ToolHistoryEntry>()

  constructor(options: OpenAIResponsesProviderOptions = {}) {
    this.apiKey = options.apiKey
    this.endpoint = options.endpoint ?? DEFAULT_ENDPOINT
    this.fetchImpl = options.fetchImpl ?? fetch
    this.maxAttempts = options.maxAttempts ?? 3
    this.clock = options.clock ?? (() => Date.now())
    this.sleep = options.sleep ?? defaultSleep
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
            authorization: `Bearer ${this.credential()}`,
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
      if (typeof body.status === "string" && body.status !== "completed") {
        throw new ModelProviderError(
          "incomplete_response",
          `OpenAI response status was ${body.status}.`,
          { retryable: false },
        )
      }

      const parsed = parseAssistantAndCalls(body, bindings)
      for (const call of parsed.toolCalls) {
        this.callHistory.set(call.id, {
          name: call.name,
          input: call.input,
          contextItems: parsed.contextItems,
        })
      }
      const latencyMs = Math.max(0, this.clock() - startedAt)
      return {
        assistant: parsed.assistant,
        toolCalls: parsed.toolCalls,
        finishReason: parsed.toolCalls.length > 0 ? "tool_calls" : "stop",
        metadata: {
          responseId: typeof body.id === "string" ? body.id : undefined,
          requestId,
          latencyMs,
          attempts: attempt,
          usage: responseUsage(body),
        },
      }
    }

    throw lastError ?? new ModelProviderError("request_failed", "OpenAI API request failed.")
  }
}
