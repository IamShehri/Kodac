import { createHash } from "node:crypto"
import type { ModelMessage, ModelToolCall } from "../model/provider.ts"
import type { AgentTurnRunner, AgentTurnResult } from "../model/turn.ts"
import {
  createModelHistoryMessageRecord,
  modelVisibleMessagesEqual,
  projectModelVisibleHistory,
} from "../session/model-visible-history.ts"
import type { RuntimeSession } from "../session/session.ts"

export interface AgentLoopLimits {
  maxTurns: number
  maxToolCalls: number
  maxElapsedMs: number
  maxFailures: number
  maxIdenticalToolCalls: number
  maxRepeatedTurnSignatures: number
  maxToolResultChars: number
}

export interface AgentLoopBudget {
  turnsUsed: number
  toolCallsUsed: number
  failuresUsed: number
  elapsedMs: number
}

export type AgentLoopStopReason =
  | "completed"
  | "max_turns"
  | "max_tool_calls"
  | "max_elapsed"
  | "max_failures"
  | "duplicate_tool_call"
  | "cycle_detected"
  | "aborted"

export interface AgentLoopInput {
  provider: string
  model: string
  messages: ModelMessage[]
  limits?: Partial<AgentLoopLimits>
  signal?: AbortSignal
}

export interface AgentLoopResult {
  status: "completed" | "stopped"
  reason: AgentLoopStopReason
  assistant: string
  budget: AgentLoopBudget
}

export const DEFAULT_AGENT_LOOP_LIMITS: AgentLoopLimits = {
  maxTurns: 8,
  maxToolCalls: 16,
  maxElapsedMs: 120_000,
  maxFailures: 2,
  maxIdenticalToolCalls: 2,
  maxRepeatedTurnSignatures: 2,
  maxToolResultChars: 12_000,
}

const RECOVERY_MESSAGE: ModelMessage = Object.freeze({
  role: "system",
  content: "The previous model/tool turn failed. Reconsider the task and continue without repeating the same failed action.",
})

class AgentLoopStop extends Error {
  readonly reason: Exclude<AgentLoopStopReason, "completed">

  constructor(reason: Exclude<AgentLoopStopReason, "completed">) {
    super(`Agent loop stopped: ${reason}`)
    this.reason = reason
  }
}

function positiveInteger(name: string, value: number): void {
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer`)
}

function resolveLimits(overrides: Partial<AgentLoopLimits> = {}): AgentLoopLimits {
  const limits = { ...DEFAULT_AGENT_LOOP_LIMITS, ...overrides }
  positiveInteger("maxTurns", limits.maxTurns)
  positiveInteger("maxToolCalls", limits.maxToolCalls)
  positiveInteger("maxElapsedMs", limits.maxElapsedMs)
  positiveInteger("maxFailures", limits.maxFailures)
  positiveInteger("maxIdenticalToolCalls", limits.maxIdenticalToolCalls)
  positiveInteger("maxRepeatedTurnSignatures", limits.maxRepeatedTurnSignatures)
  positiveInteger("maxToolResultChars", limits.maxToolResultChars)
  return limits
}

function canonicalize(value: unknown, seen = new Set<object>()): unknown {
  if (value === null || typeof value !== "object") return value
  if (seen.has(value)) throw new Error("Provider tool input must be JSON-serializable")
  seen.add(value)
  try {
    if (Array.isArray(value)) return value.map((item) => canonicalize(item, seen))
    const record = value as Record<string, unknown>
    return Object.fromEntries(Object.keys(record).sort().map((key) => [key, canonicalize(record[key], seen)]))
  } finally {
    seen.delete(value)
  }
}

function stableSerialize(value: unknown): string {
  const serialized = JSON.stringify(canonicalize(value))
  if (serialized === undefined) throw new Error("Value must be JSON-serializable")
  return serialized
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

function toolFingerprint(call: ModelToolCall): string {
  return sha256(`${call.name}\n${stableSerialize(call.input)}`)
}

function toolMessageContent(output: unknown, limit: number): string {
  let content: string
  try {
    content = stableSerialize(output)
  } catch {
    content = JSON.stringify({ error: "tool output was not JSON-serializable" })
  }
  if (content.length <= limit) return content
  return `${content.slice(0, limit)}\n[truncated by Kodac agent loop]`
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function abortReason(signal?: AbortSignal): Error {
  return signal?.reason instanceof Error ? signal.reason : new Error("Operation aborted")
}

async function raceWithSignal<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) throw abortReason(signal)
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(abortReason(signal))
    signal.addEventListener("abort", onAbort, { once: true })
    promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort)
        resolve(value)
      },
      (error) => {
        signal.removeEventListener("abort", onAbort)
        reject(error)
      },
    )
  })
}

function cloneBootstrapMessage(message: ModelMessage): ModelMessage {
  return {
    ...message,
    ...(message.toolCalls === undefined
      ? {}
      : { toolCalls: message.toolCalls.map((call) => ({ ...call })) }),
  }
}

export class BoundedAgentLoop {
  private readonly runner: AgentTurnRunner
  private readonly session: RuntimeSession
  private readonly clock: () => number

  constructor(runner: AgentTurnRunner, session: RuntimeSession, clock: () => number = () => Date.now()) {
    this.runner = runner
    this.session = session
    this.clock = clock
  }

  async run(input: AgentLoopInput): Promise<AgentLoopResult> {
    const limits = resolveLimits(input.limits)
    const startedAt = this.clock()
    let turnsUsed = 0
    let toolCallsUsed = 0
    let failuresUsed = 0
    let assistant = ""
    const bootstrapMessages = input.messages.map(cloneBootstrapMessage)
    const toolCounts = new Map<string, number>()
    const turnCounts = new Map<string, number>()

    const startingProjection = projectModelVisibleHistory(this.session.eventsSnapshot())
    if (
      startingProjection.anchorRequestIdentity !== undefined &&
      !modelVisibleMessagesEqual(bootstrapMessages, startingProjection.messages)
    ) {
      throw new Error("Anchored model-visible history is event-derived; caller messages do not match the canonical projection")
    }

    const budget = (): AgentLoopBudget => ({
      turnsUsed,
      toolCallsUsed,
      failuresUsed,
      elapsedMs: Math.max(0, this.clock() - startedAt),
    })

    const stop = async (reason: Exclude<AgentLoopStopReason, "completed">): Promise<AgentLoopResult> => {
      const snapshot = budget()
      await this.session.emit("agent.loop.stopped", { reason, budget: snapshot })
      return { status: "stopped", reason, assistant, budget: snapshot }
    }

    const guard = (): number => {
      if (input.signal?.aborted) throw new AgentLoopStop("aborted")
      const remaining = limits.maxElapsedMs - budget().elapsedMs
      if (remaining <= 0) throw new AgentLoopStop("max_elapsed")
      return remaining
    }

    const messagesForNextTurn = (): ModelMessage[] => {
      const projection = projectModelVisibleHistory(this.session.eventsSnapshot())
      return projection.anchorRequestIdentity === undefined
        ? bootstrapMessages.map(cloneBootstrapMessage)
        : projection.messages
    }

    await this.session.emit("agent.loop.started", {
      provider: input.provider,
      model: input.model,
      limits,
      initialMessageCount: bootstrapMessages.length,
    })

    for (let turn = 1; turn <= limits.maxTurns; turn++) {
      let remaining: number
      try {
        remaining = guard()
      } catch (error) {
        if (error instanceof AgentLoopStop) return stop(error.reason)
        throw error
      }

      turnsUsed += 1
      await this.session.emit("agent.turn.started", { turn, budget: budget() })
      const callFingerprints: string[] = []
      const timeoutSignal = AbortSignal.timeout(Math.max(1, Math.ceil(remaining)))
      const turnSignal = input.signal ? AbortSignal.any([input.signal, timeoutSignal]) : timeoutSignal
      const turnMessages = messagesForNextTurn()

      let result: AgentTurnResult
      try {
        result = await raceWithSignal(
          this.runner.run(
            {
              provider: input.provider,
              model: input.model,
              messages: turnMessages,
              signal: turnSignal,
            },
            {
              beforeToolCall: async (call) => {
                if (input.signal?.aborted) throw new AgentLoopStop("aborted")
                if (budget().elapsedMs >= limits.maxElapsedMs) throw new AgentLoopStop("max_elapsed")
                if (toolCallsUsed >= limits.maxToolCalls) throw new AgentLoopStop("max_tool_calls")
                const fingerprint = toolFingerprint(call)
                const prior = toolCounts.get(fingerprint) ?? 0
                if (prior >= limits.maxIdenticalToolCalls) throw new AgentLoopStop("duplicate_tool_call")
                toolCounts.set(fingerprint, prior + 1)
                callFingerprints.push(fingerprint)
                toolCallsUsed += 1
              },
            },
          ),
          turnSignal,
        )
      } catch (error) {
        if (error instanceof AgentLoopStop) return stop(error.reason)
        if (turnSignal.aborted) {
          return stop(input.signal?.aborted ? "aborted" : "max_elapsed")
        }

        failuresUsed += 1
        await this.session.emit("agent.turn.failed", {
          turn,
          error: errorMessage(error),
          budget: budget(),
        })
        if (failuresUsed >= limits.maxFailures) return stop("max_failures")

        const projection = projectModelVisibleHistory(this.session.eventsSnapshot())
        if (projection.anchorRequestIdentity === undefined) {
          bootstrapMessages.push(cloneBootstrapMessage(RECOVERY_MESSAGE))
        } else {
          await this.session.emit("model.history.message.appended", createModelHistoryMessageRecord({
            afterRequestIdentity: projection.anchorRequestIdentity,
            source: "recovery_system",
            message: cloneBootstrapMessage(RECOVERY_MESSAGE),
          }))
        }
        continue
      }

      assistant = result.assistant
      const projection = projectModelVisibleHistory(this.session.eventsSnapshot())
      if (projection.anchorRequestIdentity === undefined) {
        throw new Error("Successful model turn did not establish an H2-R1 request snapshot anchor")
      }
      const afterRequestIdentity = projection.anchorRequestIdentity

      if (result.assistant || result.toolCalls.length > 0) {
        await this.session.emit("model.history.message.appended", createModelHistoryMessageRecord({
          afterRequestIdentity,
          source: "assistant_response",
          message: {
            role: "assistant",
            content: result.assistant,
            toolCalls: result.toolCalls.map((call) => ({ ...call })),
          },
        }))
      }
      for (const toolResult of result.toolResults) {
        await this.session.emit("model.history.message.appended", createModelHistoryMessageRecord({
          afterRequestIdentity,
          source: "tool_result",
          message: {
            role: "tool",
            name: toolResult.name,
            toolCallId: toolResult.id,
            content: toolMessageContent(toolResult.output, limits.maxToolResultChars),
          },
        }))
      }

      const signature = sha256(`${result.finishReason}\n${result.assistant}\n${callFingerprints.join("\n")}`)
      const repeated = (turnCounts.get(signature) ?? 0) + 1
      turnCounts.set(signature, repeated)

      await this.session.emit("agent.turn.completed", {
        turn,
        finishReason: result.finishReason,
        toolResults: result.toolResults.length,
        budget: budget(),
      })

      if (result.finishReason === "stop") {
        const snapshot = budget()
        await this.session.emit("agent.loop.completed", { reason: "completed", budget: snapshot })
        return { status: "completed", reason: "completed", assistant, budget: snapshot }
      }
      if (repeated > limits.maxRepeatedTurnSignatures) return stop("cycle_detected")
    }

    return stop("max_turns")
  }
}
