import { createHash } from "node:crypto"

import {
  reduceGuardedToolCallWithPlan,
  reduceGuardedToolExposure,
} from "../agent/guarded-tool-plan.ts"
import type { RuntimeOrchestrator } from "../runtime/orchestrator.ts"
import {
  createModelVisibleRequestSnapshot,
  materializeModelVisibleRequest,
  validateModelVisibleMessage,
} from "../session/model-visible-request.ts"
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

export const KDO_H5_R3B_GUARD_EVIDENCE_VERSION = "kodac-tool-guard-evidence-v1" as const
export const KDO_H5_R3B_EXECUTION_OBSERVATION_VERSION = "kodac-tool-guard-execution-observation-v1" as const

export interface AgentTurnInput {
  provider: string
  model: string
  messages: ModelMessage[]
  guardPlanJson?: string
  signal?: AbortSignal
}

export interface AgentTurnHooks {
  beforeToolCall?(call: Readonly<ModelToolCall>): Promise<void> | void
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

export class GuardedToolCallBlockedError extends Error {
  readonly code: "unknown_tool" | "guard_blocked"
  readonly pipelineResultIdentity?: string

  constructor(code: "unknown_tool" | "guard_blocked", pipelineResultIdentity?: string) {
    super("Guarded tool call blocked")
    this.name = "GuardedToolCallBlockedError"
    this.code = code
    if (pipelineResultIdentity !== undefined) this.pipelineResultIdentity = pipelineResultIdentity
  }
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

function normalizeProviderToolCall(call: ModelToolCall): Readonly<ModelToolCall> {
  const message = validateModelVisibleMessage({
    role: "assistant",
    content: "",
    toolCalls: [call],
  })
  const normalized = message.toolCalls?.[0]
  if (normalized === undefined) throw new Error("Provider tool call normalization failed")
  return normalized
}

function materializeJson(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value)) as unknown
}

function registeredToolPairsJson(tools: readonly { name: string; capability: string }[]): string {
  return JSON.stringify(tools.map((tool) => ({ name: tool.name, capability: tool.capability })))
}

function guardedCallJson(input: { toolName: string; capability: string; input: unknown }): string {
  return JSON.stringify({ toolName: input.toolName, capability: input.capability, input: input.input })
}

function immutableEffectiveCall(input: { id: string; name: string; value: unknown }): Readonly<ModelToolCall> {
  return Object.freeze({ id: input.id, name: input.name, input: input.value })
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
    const registeredTools = this.tools.list()
    const registeredPairsJson = registeredToolPairsJson(registeredTools)

    let tools = registeredTools
    let guardPlanIdentity: string | undefined
    if (input.guardPlanJson !== undefined) {
      try {
        const exposure = reduceGuardedToolExposure(input.guardPlanJson, registeredPairsJson)
        guardPlanIdentity = exposure.planIdentity
        const effectivePairs = new Map(exposure.effectiveTools.map((tool) => [tool.name, tool.capability] as const))
        tools = registeredTools.filter((tool) => effectivePairs.get(tool.name) === tool.capability)
      } catch (error) {
        await this.session.emit("model.failed", {
          provider: provider.name,
          stage: "tool_guard_plan",
          error: "guard plan rejected",
        })
        throw error
      }
    }

    let snapshot: ReturnType<typeof createModelVisibleRequestSnapshot>
    try {
      snapshot = createModelVisibleRequestSnapshot({ provider: provider.name, model: input.model, messages: input.messages, tools })
    } catch (error) {
      await this.session.emit("model.failed", {
        provider: provider.name,
        stage: "request_snapshot",
        error: "model-visible request snapshot rejected",
      })
      throw error
    }
    await this.session.emit("model.request.snapshot", snapshot)
    const request = materializeModelVisibleRequest(snapshot)

    await this.session.emit("model.requested", {
      provider: provider.name,
      model: request.model,
      messageCount: request.messages.length,
      tools: request.tools.map((tool) => ({ name: tool.name, capability: tool.capability })),
    })

    const onStreamEvent = async (event: ModelProviderStreamEvent): Promise<void> => {
      if (event.type === "started") {
        await this.session.emit("model.stream.started", { provider: provider.name, model: request.model })
      } else if (event.type === "text_delta") {
        await this.session.emit("model.stream.text_delta", {
          provider: provider.name,
          model: request.model,
          contentDigest: sha256(event.text),
          contentLength: event.text.length,
        })
      } else if (event.type === "tool_call_delta") {
        await this.session.emit("model.stream.tool_call_delta", {
          provider: provider.name,
          model: request.model,
          index: event.index,
          id: event.id,
          name: event.name,
          argumentsDigest: event.argumentsDelta === undefined ? undefined : sha256(event.argumentsDelta),
          argumentsLength: event.argumentsDelta?.length,
        })
      } else if (event.type === "usage") {
        await this.session.emit("model.stream.usage", { provider: provider.name, model: request.model, usage: event.usage })
      } else {
        await this.session.emit("model.stream.completed", {
          provider: provider.name,
          model: request.model,
          finishReason: event.finishReason,
          responseId: event.responseId,
        })
      }
      await hooks.onStreamEvent?.(event)
    }

    let response: ModelProviderResponse
    try {
      response = await provider.generate({
        model: request.model,
        messages: request.messages,
        tools: request.tools,
        signal: input.signal,
        onStreamEvent,
      })
      throwIfAborted(input.signal)
      validateResponse(response)
    } catch (error) {
      await this.session.emit("model.failed", {
        provider: provider.name,
        model: request.model,
        error: error instanceof Error ? error.message : String(error),
        ...(error instanceof ModelProviderError
          ? { providerCode: error.code, retryable: error.retryable, status: error.status }
          : {}),
      })
      throw error
    }

    await this.session.emit("model.responded", {
      provider: provider.name,
      model: request.model,
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
        model: request.model,
        contentDigest: sha256(response.assistant),
        contentLength: response.assistant.length,
      })
    }

    const toolResults: AgentToolResult[] = []
    const effectiveToolCalls: ModelToolCall[] = []
    for (const providerCall of response.toolCalls) {
      throwIfAborted(input.signal)
      const call = normalizeProviderToolCall(providerCall)
      await this.session.emit("model.tool_call.requested", {
        provider: provider.name,
        model: request.model,
        callId: call.id,
        tool: call.name,
      })

      const registered = registeredTools.find((tool) => tool.name === call.name)
      if (registered === undefined) throw new GuardedToolCallBlockedError("unknown_tool")

      let effectiveInput = call.input
      let guardResultIdentity: string | undefined
      let finalCallIdentity: string | undefined
      if (input.guardPlanJson !== undefined) {
        const guarded = reduceGuardedToolCallWithPlan(
          input.guardPlanJson,
          registeredPairsJson,
          guardedCallJson({ toolName: call.name, capability: registered.capability, input: call.input }),
        )
        guardResultIdentity = guarded.pipeline.resultIdentity
        finalCallIdentity = guarded.pipeline.finalCallIdentity
        await this.session.emit("tool.guard.evaluated", {
          version: KDO_H5_R3B_GUARD_EVIDENCE_VERSION,
          planIdentity: guarded.planIdentity,
          callId: call.id,
          tool: call.name,
          capability: registered.capability,
          pipelineResultIdentity: guarded.pipeline.resultIdentity,
          baseToolSetIdentity: guarded.pipeline.baseToolSetIdentity,
          effectiveToolSetIdentity: guarded.pipeline.effectiveToolSetIdentity,
          originalCallIdentity: guarded.pipeline.originalCallIdentity,
          finalCallIdentity: guarded.pipeline.finalCallIdentity,
          blocked: guarded.pipeline.blocked,
          blockCode: guarded.pipeline.blockCode,
          inputChanged: guarded.pipeline.inputChanged,
          requiresK2Reevaluation: guarded.pipeline.requiresK2Reevaluation,
        })
        if (guarded.pipeline.blocked) {
          throw new GuardedToolCallBlockedError("guard_blocked", guarded.pipeline.resultIdentity)
        }
        effectiveInput = guarded.pipeline.effectiveCall.input
      }

      const effectiveCall = immutableEffectiveCall({ id: call.id, name: call.name, value: effectiveInput })
      await hooks.beforeToolCall?.(effectiveCall)
      const executionInput = materializeJson(effectiveCall.input)
      const output = await this.orchestrator.invoke<unknown, unknown>(effectiveCall.name, executionInput, { signal: input.signal })

      if (input.guardPlanJson !== undefined && guardPlanIdentity !== undefined && guardResultIdentity !== undefined && finalCallIdentity !== undefined) {
        await this.session.emit("tool.guard.execution_observed", {
          version: KDO_H5_R3B_EXECUTION_OBSERVATION_VERSION,
          planIdentity: guardPlanIdentity,
          callId: effectiveCall.id,
          tool: effectiveCall.name,
          capability: registered.capability,
          pipelineResultIdentity: guardResultIdentity,
          finalCallIdentity,
          status: "completed",
        })
      }

      effectiveToolCalls.push({ id: effectiveCall.id, name: effectiveCall.name, input: materializeJson(effectiveCall.input) })
      toolResults.push({ id: effectiveCall.id, name: effectiveCall.name, output })
    }

    return {
      assistant: response.assistant,
      finishReason: response.finishReason,
      toolCalls: effectiveToolCalls,
      toolResults,
      metadata: response.metadata,
    }
  }
}
