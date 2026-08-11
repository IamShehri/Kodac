import { createHash } from "node:crypto"
import type { RuntimeOrchestrator } from "../runtime/orchestrator.ts"
import type { RuntimeSession } from "../session/session.ts"
import type { ToolRegistry } from "../tools/registry.ts"
import { OpenAICompatibleProvider } from "./openai-compatible.ts"
import { OpenAIResponsesProvider } from "./openai.ts"
import {
  ModelProviderError,
  type ModelMessage,
  type ModelProvider,
  type ModelProviderMetadata,
  type ModelProviderResponse,
  type ModelProviderStreamEvent,
  type ModelToolCall,
  type ProviderRegistry,
} from "./provider.ts"

export interface AgentTurnInput {
  provider: string
  model: string
  messages: ModelMessage[]
  signal?: AbortSignal
}

export interface AgentTurnHooks {
  beforeToolCall?(call: ModelToolCall): Promise<void> | void
  onStreamEvent?(event: ModelProviderStreamEvent): Promise<void> | void
}

export interface AgentToolResult {
  id: string
  name: string
  output: unknown
}

export interface AgentTurnResult {
  assistant: string
  finishReason: ModelProviderResponse["finishReason"]
  toolCalls: ModelToolCall[]
  toolResults: AgentToolResult[]
  metadata?: ModelProviderMetadata
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

function throwIfAborted(signal?: AbortSignal): void {
  if (!signal?.aborted) return
  throw signal.reason instanceof Error ? signal.reason : new Error("Operation aborted")
}

function validateResponse(response: ModelProviderResponse): void {
  if (typeof response.assistant !== "string") throw new Error("Provider response assistant must be a string")
  if (!Array.isArray(response.toolCalls)) throw new Error("Provider response toolCalls must be an array")
  if (response.finishReason === "stop" && response.toolCalls.length > 0) {
    throw new Error("Provider response cannot contain tool calls with finishReason=stop")
  }
  if (response.finishReason === "tool_calls" && response.toolCalls.length === 0) {
    throw new Error("Provider response finishReason=tool_calls requires at least one tool call")
  }

  const ids = new Set<string>()
  for (const call of response.toolCalls) {
    if (!call.id || !call.name) throw new Error("Provider tool call id and name must not be empty")
    if (ids.has(call.id)) throw new Error(`Duplicate provider tool call id: ${call.id}`)
    ids.add(call.id)
  }
}

export class AgentTurnRunner {
  private readonly providers: ProviderRegistry
  private readonly tools: ToolRegistry
  private readonly orchestrator: RuntimeOrchestrator
  private readonly session: RuntimeSession

  constructor(
    providers: ProviderRegistry,
    tools: ToolRegistry,
    orchestrator: RuntimeOrchestrator,
    session: RuntimeSession,
  ) {
    this.providers = providers
    this.tools = tools
    this.orchestrator = orchestrator
    this.session = session
  }

  private resolveProvider(name: string): ModelProvider {
    if (this.providers.has(name)) return this.providers.get(name)
    if (name === "openai") {
      const provider = new OpenAIResponsesProvider({ stream: true })
      this.providers.register(provider)
      return provider
    }
    if (name === "openai-compatible") {
      const provider = OpenAICompatibleProvider.fromEnv()
      this.providers.register(provider)
      return provider
    }
    return this.providers.get(name)
  }

  async run(input: AgentTurnInput, hooks: AgentTurnHooks = {}): Promise<AgentTurnResult> {
    throwIfAborted(input.signal)
    const provider = this.resolveProvider(input.provider)
    const tools = this.tools.list()

    await this.session.emit("model.requested", {
      provider: provider.name,
      model: input.model,
      messageCount: input.messages.length,
      tools: tools.map((tool) => ({ name: tool.name, capability: tool.capability })),
    })

    const onStreamEvent = async (event: ModelProviderStreamEvent): Promise<void> => {
      if (event.type === "started") {
        await this.session.emit("model.stream.started", { provider: provider.name, model: input.model })
      } else if (event.type === "text_delta") {
        await this.session.emit("model.stream.text_delta", {
          provider: provider.name,
          model: input.model,
          contentDigest: sha256(event.text),
          contentLength: event.text.length,
        })
      } else if (event.type === "tool_call_delta") {
        await this.session.emit("model.stream.tool_call_delta", {
          provider: provider.name,
          model: input.model,
          index: event.index,
          id: event.id,
          name: event.name,
          argumentsDigest: event.argumentsDelta === undefined ? undefined : sha256(event.argumentsDelta),
          argumentsLength: event.argumentsDelta?.length,
        })
      } else if (event.type === "usage") {
        await this.session.emit("model.stream.usage", { provider: provider.name, model: input.model, usage: event.usage })
      } else {
        await this.session.emit("model.stream.completed", {
          provider: provider.name,
          model: input.model,
          finishReason: event.finishReason,
          responseId: event.responseId,
        })
      }
      await hooks.onStreamEvent?.(event)
    }

    let response: ModelProviderResponse
    try {
      response = await provider.generate({
        model: input.model,
        messages: input.messages,
        tools,
        signal: input.signal,
        onStreamEvent,
      })
      throwIfAborted(input.signal)
      validateResponse(response)
    } catch (error) {
      await this.session.emit("model.failed", {
        provider: provider.name,
        model: input.model,
        error: error instanceof Error ? error.message : String(error),
        ...(error instanceof ModelProviderError
          ? { providerCode: error.code, retryable: error.retryable, status: error.status }
          : {}),
      })
      throw error
    }

    await this.session.emit("model.responded", {
      provider: provider.name,
      model: input.model,
      finishReason: response.finishReason,
      assistantLength: response.assistant.length,
      toolCallCount: response.toolCalls.length,
      responseId: response.metadata?.responseId,
      requestId: response.metadata?.requestId,
      latencyMs: response.metadata?.latencyMs,
      attempts: response.metadata?.attempts,
      usage: response.metadata?.usage,
    })

    if (response.assistant) {
      await this.session.emit("assistant.message", {
        provider: provider.name,
        model: input.model,
        contentDigest: sha256(response.assistant),
        contentLength: response.assistant.length,
      })
    }

    const toolResults: AgentToolResult[] = []
    for (const call of response.toolCalls) {
      throwIfAborted(input.signal)
      await this.session.emit("model.tool_call.requested", {
        provider: provider.name,
        model: input.model,
        callId: call.id,
        tool: call.name,
      })
      await hooks.beforeToolCall?.(call)
      const output = await this.orchestrator.invoke<unknown, unknown>(call.name, call.input, { signal: input.signal })
      toolResults.push({ id: call.id, name: call.name, output })
    }

    return {
      assistant: response.assistant,
      finishReason: response.finishReason,
      toolCalls: response.toolCalls.map((call) => ({ ...call })),
      toolResults,
      metadata: response.metadata,
    }
  }
}
