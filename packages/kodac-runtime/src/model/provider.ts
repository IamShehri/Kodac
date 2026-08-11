export type ModelRole = "system" | "user" | "assistant" | "tool"
export type JsonSchema = Record<string, unknown>

export interface ModelToolCall {
  id: string
  name: string
  input: unknown
}

export interface ModelMessage {
  role: ModelRole
  content: string
  name?: string
  toolCallId?: string
  toolCalls?: ModelToolCall[]
}

export interface ModelToolDescriptor {
  name: string
  capability: string
  description: string
  inputSchema: JsonSchema
}

export interface ModelProviderUsage {
  inputTokens?: number
  cachedInputTokens?: number
  outputTokens?: number
  totalTokens?: number
}

export type ModelProviderStreamEvent =
  | { type: "started" }
  | { type: "text_delta"; text: string }
  | { type: "tool_call_delta"; index: number; id?: string; name?: string; argumentsDelta?: string }
  | { type: "usage"; usage: ModelProviderUsage }
  | { type: "completed"; finishReason: "stop" | "tool_calls"; responseId?: string }

export interface ModelProviderRequest {
  model: string
  messages: ModelMessage[]
  tools: ModelToolDescriptor[]
  signal?: AbortSignal
  onStreamEvent?(event: ModelProviderStreamEvent): Promise<void> | void
}

export interface ModelProviderMetadata {
  responseId?: string
  requestId?: string
  latencyMs?: number
  attempts?: number
  usage?: ModelProviderUsage
}

export interface ModelProviderResponse {
  assistant: string
  toolCalls: ModelToolCall[]
  finishReason: "stop" | "tool_calls"
  metadata?: ModelProviderMetadata
}

export class ModelProviderError extends Error {
  readonly code: string
  readonly retryable: boolean
  readonly status?: number

  constructor(
    code: string,
    message: string,
    options: { retryable?: boolean; status?: number; cause?: unknown } = {},
  ) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause })
    this.name = "ModelProviderError"
    this.code = code
    this.retryable = options.retryable ?? false
    this.status = options.status
  }
}

export interface ModelProvider {
  readonly name: string
  generate(request: ModelProviderRequest): Promise<ModelProviderResponse>
}

export class ProviderRegistry {
  private readonly providers = new Map<string, ModelProvider>()

  register(provider: ModelProvider): void {
    if (!provider.name) throw new Error("Provider name must not be empty")
    if (this.providers.has(provider.name)) {
      throw new Error(`Provider already registered: ${provider.name}`)
    }
    this.providers.set(provider.name, provider)
  }

  has(name: string): boolean {
    return this.providers.has(name)
  }

  get(name: string): ModelProvider {
    const provider = this.providers.get(name)
    if (!provider) throw new Error(`Unknown provider: ${name}`)
    return provider
  }

  list(): string[] {
    return [...this.providers.keys()].sort()
  }
}
