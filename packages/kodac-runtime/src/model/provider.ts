export type ModelRole = "system" | "user" | "assistant" | "tool"

export interface ModelMessage {
  role: ModelRole
  content: string
  name?: string
}

export interface ModelToolDescriptor {
  name: string
  capability: string
}

export interface ModelToolCall {
  id: string
  name: string
  input: unknown
}

export interface ModelProviderRequest {
  model: string
  messages: ModelMessage[]
  tools: ModelToolDescriptor[]
}

export interface ModelProviderResponse {
  assistant: string
  toolCalls: ModelToolCall[]
  finishReason: "stop" | "tool_calls"
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

  get(name: string): ModelProvider {
    const provider = this.providers.get(name)
    if (!provider) throw new Error(`Unknown provider: ${name}`)
    return provider
  }

  list(): string[] {
    return [...this.providers.keys()].sort()
  }
}
