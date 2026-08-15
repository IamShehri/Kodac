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

interface PreparedToolCall {
  readonly effectiveCall: Readonly<ModelToolCall>
  readonly capability: string
  readonly guard?: Readonly<{
    planIdentity: string
    pipelineResultIdentity: string
    baseToolSetIdentity: string
    effectiveToolSetIdentity: string
    originalCallIdentity: string
    finalCallIdentity: string
    blocked: boolean
    blockCode: string | null
    inputChanged: boolean
    requiresK2Reevaluation: boolean
  }>
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

function throwIfAborted(signal?: AbortSignal): void {
  if (!signal?.aborted) return
  throw signal.reason instanceof Error ? signal.reason : new Error("Operation aborted")
}

function normalizeProviderResponse(response: ModelProviderResponse): ModelProviderResponse {
  if (typeof response.assistant !== "string") throw new Error("Provider response assistant must be a string")
  if (!Array.isArray(response.toolCalls)) throw new Error("Provider response toolCalls must be an array")
  if (response.finishReason === "stop" && response.toolCalls.length > 0) {
    throw new Error("Provider response cannot contain tool calls with finishReason=stop")
  }
  if (response.finishReason === "tool_calls" && response.toolCalls.length === 0) {
    throw new Error("Provider response finishReason=tool_calls requires at least one tool call")
  }

  const normalizedMessage = validateModelVisibleMessage({
    role: "assistant",
    content: "",
    toolCalls: response.toolCalls,
  })
  const toolCalls = normalizedMessage.toolCalls ?? []
  return {
    assistant: response.assistant,
    finishReason: response.finishReason,
    toolCalls: toolCalls.map((call) => ({ id: call.id, name: call.name, input: call.input })),
    ...(response.metadata === undefined ? {} : { metadata: response.metadata }),
  }
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
    if (input.guardPlanJson !== undefined) {
      try {
        const exposure = reduceGuardedToolExposure(input.guardPlanJson, registeredPairsJson)
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
      const generated = await provider.generate({
        model: request.model,
        messages: request.messages,
        tools: request.tools,
        signal: input.signal,
        onStreamEvent,
      })
      throwIfAborted(input.signal)
      response = normalizeProviderResponse(generated)
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

    const preparedCalls: PreparedToolCall[] = []
    for (const call of response.toolCalls) {
      throwIfAborted(input.signal)
      const registered = registeredTools.find((tool) => tool.name === call.name)
      if (registered === undefined) throw new GuardedToolCallBlockedError("unknown_tool")

      let effectiveInput = call.input
      let guard: PreparedToolCall["guard"]
      if (input.guardPlanJson !== undefined) {
        const guarded = reduceGuardedToolCallWithPlan(
          input.guardPlanJson,
          registeredPairsJson,
          guardedCallJson({ toolName: call.name, capability: registered.capability, input: call.input }),
        )
        guard = Object.freeze({
          planIdentity: guarded.planIdentity,
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
        effectiveInput = guarded.pipeline.effectiveCall.input
      }
      preparedCalls.push(Object.freeze({
        effectiveCall: immutableEffectiveCall({ id: call.id, name: call.name, value: effectiveInput }),
        capability: registered.capability,
        ...(guard === undefined ? {} : { guard }),
      }))
    }

    if (input.guardPlanJson !== undefined) {
      for (const prepared of preparedCalls) {
        const guard = prepared.guard
        if (guard === undefined) throw new Error("guarded tool preflight evidence is missing")
        await this.session.emit("model.tool_call.requested", {
          provider: provider.name,
          model: request.model,
          callId: prepared.effectiveCall.id,
          tool: prepared.effectiveCall.name,
        })
        await this.session.emit("tool.guard.evaluated", {
          version: KDO_H5_R3B_GUARD_EVIDENCE_VERSION,
          planIdentity: guard.planIdentity,
          callId: prepared.effectiveCall.id,
          tool: prepared.effectiveCall.name,
          capability: prepared.capability,
          pipelineResultIdentity: guard.pipelineResultIdentity,
          baseToolSetIdentity: guard.baseToolSetIdentity,
          effectiveToolSetIdentity: guard.effectiveToolSetIdentity,
          originalCallIdentity: guard.originalCallIdentity,
          finalCallIdentity: guard.finalCallIdentity,
          blocked: guard.blocked,
          blockCode: guard.blockCode,
          inputChanged: guard.inputChanged,
          requiresK2Reevaluation: guard.requiresK2Reevaluation,
        })
      }
      const blocked = preparedCalls.find((prepared) => prepared.guard?.blocked === true)
      if (blocked?.guard !== undefined) {
        throw new GuardedToolCallBlockedError("guard_blocked", blocked.guard.pipelineResultIdentity)
      }
    }

    const toolResults: AgentToolResult[] = []
    const effectiveToolCalls: ModelToolCall[] = []
    for (const prepared of preparedCalls) {
      throwIfAborted(input.signal)
      const effectiveCall = prepared.effectiveCall
      if (input.guardPlanJson === undefined) {
        await this.session.emit("model.tool_call.requested", {
          provider: provider.name,
          model: request.model,
          callId: effectiveCall.id,
          tool: effectiveCall.name,
        })
      }
      await hooks.beforeToolCall?.(effectiveCall)
      const executionInput = materializeJson(effectiveCall.input)
      const output = await this.orchestrator.invoke<unknown, unknown>(effectiveCall.name, executionInput, { signal: input.signal })

      if (prepared.guard !== undefined) {
        await this.session.emit("tool.guard.execution_observed", {
          version: KDO_H5_R3B_EXECUTION_OBSERVATION_VERSION,
          planIdentity: prepared.guard.planIdentity,
          callId: effectiveCall.id,
          tool: effectiveCall.name,
          capability: prepared.capability,
          pipelineResultIdentity: prepared.guard.pipelineResultIdentity,
          finalCallIdentity: prepared.guard.finalCallIdentity,
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
