import { createHash } from "node:crypto"
import type { ModelMessage, ModelToolCall } from "../model/provider.ts"
import type { AgentTurnRunner, AgentTurnResult } from "../model/turn.ts"
import {
  createToolResultPruningPolicy,
  pruneModelVisibleToolResults,
} from "./tool-result-pruning.ts"
import {
  KDO_H5_R2A_CALL_VERSION,
  KDO_H5_R2A_POLICY_VERSION,
  advanceRepeatCallSignal,
} from "./repeat-call-signal.ts"
import {
  KDO_H2_R2_LIMITS,
  createModelHistoryMessageRecord,
  createRepeatCallAdvisoryHistoryRecord,
  createToolResultPruningHistoryRecord,
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
  guardPlanJson?: string
  toolResultPruningMaxBytes?: number
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

const R2B_REPEAT_POLICY_JSON = `{"thresholds":[2],"version":${JSON.stringify(KDO_H5_R2A_POLICY_VERSION)}}`

const SESSION_LOOP_TAILS = new WeakMap<RuntimeSession, Promise<void>>()

type HistoryAppendSource = "assistant_response" | "tool_result" | "recovery_system"

interface PendingHistoryMessage {
  source: HistoryAppendSource
  message: ModelMessage
}

interface PendingRepeatAdvisory {
  signalJson: string
  callFingerprint: string
  toolCallId: string
}

interface RepeatBatchObservation {
  nextStateJson: string | null
  advisory: PendingRepeatAdvisory | null
}

class AgentLoopStop extends Error {
  readonly reason: Exclude<AgentLoopStopReason, "completed">

  constructor(reason: Exclude<AgentLoopStopReason, "completed">) {
    super(`Agent loop stopped: ${reason}`)
    this.reason = reason
  }
}

async function runExclusiveForSession<T>(session: RuntimeSession, operation: () => Promise<T>): Promise<T> {
  const previous = SESSION_LOOP_TAILS.get(session) ?? Promise.resolve()
  let release!: () => void
  const slot = new Promise<void>((resolve) => { release = resolve })
  const queued = previous.catch(() => undefined).then(() => slot)
  SESSION_LOOP_TAILS.set(session, queued)
  await previous.catch(() => undefined)
  try {
    return await operation()
  } finally {
    release()
    if (SESSION_LOOP_TAILS.get(session) === queued) SESSION_LOOP_TAILS.delete(session)
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

function toolFingerprintFromSerialized(call: ModelToolCall, serializedInput: string): string {
  return sha256(`${call.name}\n${serializedInput}`)
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

function assertHistoryBatchAppendable(
  messages: readonly ModelMessage[],
  additions: readonly ModelMessage[],
): void {
  if (messages.length + additions.length > KDO_H2_R2_LIMITS.maxProjectedMessages) {
    throw new RangeError(`projected model history exceeds ${KDO_H2_R2_LIMITS.maxProjectedMessages} messages`)
  }
  const existingContentBytes = messages.reduce(
    (total, current) => total + Buffer.byteLength(current.content, "utf8"),
    0,
  )
  const addedContentBytes = additions.reduce(
    (total, current) => total + Buffer.byteLength(current.content, "utf8"),
    0,
  )
  if (existingContentBytes + addedContentBytes > KDO_H2_R2_LIMITS.maxTotalMessageContentBytes) {
    throw new RangeError(
      `projected model history content exceeds ${KDO_H2_R2_LIMITS.maxTotalMessageContentBytes} UTF-8 bytes`,
    )
  }
}

function r2aCurrentCallJson(call: ModelToolCall, serializedInput: string): string {
  return `{"version":${JSON.stringify(KDO_H5_R2A_CALL_VERSION)},"toolName":${JSON.stringify(call.name)},"toolInput":${serializedInput}}`
}

function observeRepeatBatch(input: {
  previousStateJson: string | null
  result: AgentTurnResult
  serializedInputs: ReadonlyMap<string, string>
  enabled: boolean
}): RepeatBatchObservation {
  if (!input.enabled) return { nextStateJson: null, advisory: null }
  if (input.result.toolCalls.length === 0) return { nextStateJson: null, advisory: null }
  if (input.result.toolCalls.length !== input.result.toolResults.length) {
    return { nextStateJson: null, advisory: null }
  }

  let stateJson = input.previousStateJson
  let pending: PendingRepeatAdvisory | null = null

  for (let index = 0; index < input.result.toolCalls.length; index += 1) {
    const call = input.result.toolCalls[index]
    const toolResult = input.result.toolResults[index]
    if (call === undefined || toolResult === undefined || call.id !== toolResult.id || call.name !== toolResult.name) {
      return { nextStateJson: null, advisory: null }
    }
    const serializedInput = input.serializedInputs.get(call.id)
    if (serializedInput === undefined) return { nextStateJson: null, advisory: null }

    try {
      const transition = advanceRepeatCallSignal(
        stateJson,
        r2aCurrentCallJson(call, serializedInput),
        R2B_REPEAT_POLICY_JSON,
      )
      if (pending !== null && pending.callFingerprint !== transition.nextState.callFingerprint) pending = null
      stateJson = transition.nextStateJson
      if (transition.advisorySignal !== null && transition.advisorySignalJson !== null) {
        pending = {
          signalJson: transition.advisorySignalJson,
          callFingerprint: transition.nextState.callFingerprint,
          toolCallId: call.id,
        }
      }
    } catch {
      stateJson = null
      pending = null
    }
  }

  return { nextStateJson: stateJson, advisory: pending }
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
    return runExclusiveForSession(this.session, () => this.runExclusive(input))
  }

  private async runExclusive(input: AgentLoopInput): Promise<AgentLoopResult> {
    const limits = resolveLimits(input.limits)
    let pruningPolicy: ReturnType<typeof createToolResultPruningPolicy> | undefined
    if (input.toolResultPruningMaxBytes !== undefined) {
      if (typeof input.toolResultPruningMaxBytes !== "number") {
        throw new TypeError("toolResultPruningMaxBytes must be a primitive number")
      }
      pruningPolicy = createToolResultPruningPolicy({ maxToolResultBytes: input.toolResultPruningMaxBytes })
    }
    const repeatObservationEnabled = limits.maxIdenticalToolCalls >= 2
    const startedAt = this.clock()
    const runStartSequence = this.session.eventsSnapshot().at(-1)?.sequence ?? 0
    let turnsUsed = 0
    let toolCallsUsed = 0
    let failuresUsed = 0
    let assistant = ""
    let repeatStateJson: string | null = null
    const bootstrapMessages = input.messages.map(cloneBootstrapMessage)
    const toolCounts = new Map<string, number>()
    const turnCounts = new Map<string, number>()

    const runEvents = () => this.session.eventsSnapshot(runStartSequence)

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

    const messagesForNextTurn = async (): Promise<ModelMessage[]> => {
      let projection = projectModelVisibleHistory(runEvents())
      if (projection.anchorRequestIdentity === undefined) return bootstrapMessages.map(cloneBootstrapMessage)
      if (pruningPolicy === undefined) return projection.messages
      const pruning = pruneModelVisibleToolResults(projection.messages, pruningPolicy)
      if (pruning.changes.length === 0) return projection.messages
      const record = createToolResultPruningHistoryRecord({
        afterRequestIdentity: projection.anchorRequestIdentity,
        messages: projection.messages,
        policy: pruningPolicy,
      })
      await this.session.emit("model.history.tool_result_pruning.applied", record)
      projection = projectModelVisibleHistory(runEvents())
      return projection.messages
    }

    const appendHistoryBatch = async (
      pending: readonly PendingHistoryMessage[],
      advisory: PendingRepeatAdvisory | null = null,
    ): Promise<void> => {
      if (pending.length === 0 && advisory === null) return
      const projection = projectModelVisibleHistory(runEvents())
      if (projection.anchorRequestIdentity === undefined) {
        throw new Error("H2-R2 history append requires an H2-R1 request snapshot anchor")
      }
      const records = pending.map(({ source, message }) => createModelHistoryMessageRecord({
        afterRequestIdentity: projection.anchorRequestIdentity as string,
        source,
        message,
      }))
      const advisoryRecord = advisory === null
        ? null
        : (() => {
          const assistantRecord = records.find((record) => record.source === "assistant_response")
          const toolResultRecord = records.find(
            (record) => record.source === "tool_result" && record.message.toolCallId === advisory.toolCallId,
          )
          if (assistantRecord === undefined || toolResultRecord === undefined) {
            throw new Error("R2B advisory requires canonical assistant and triggering tool-result history records")
          }
          return createRepeatCallAdvisoryHistoryRecord({
            afterRequestIdentity: projection.anchorRequestIdentity as string,
            assistantHistoryRecordIdentity: assistantRecord.recordIdentity,
            toolResultHistoryRecordIdentity: toolResultRecord.recordIdentity,
            signalJson: advisory.signalJson,
          })
        })()
      const additions: ModelMessage[] = records.map((record) => record.message as ModelMessage)
      if (advisoryRecord !== null) additions.push(advisoryRecord.message as ModelMessage)
      assertHistoryBatchAppendable(projection.messages, additions)
      for (const record of records) {
        await this.session.emit("model.history.message.appended", record)
      }
      if (advisoryRecord !== null) {
        await this.session.emit("model.history.repeat_call_advisory.appended", advisoryRecord)
      }
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
      const serializedInputs = new Map<string, string>()
      const timeoutSignal = AbortSignal.timeout(Math.max(1, Math.ceil(remaining)))
      const turnSignal = input.signal ? AbortSignal.any([input.signal, timeoutSignal]) : timeoutSignal
      const turnMessages = await messagesForNextTurn()

      let result: AgentTurnResult
      try {
        result = await raceWithSignal(
          this.runner.run(
            {
              provider: input.provider,
              model: input.model,
              messages: turnMessages,
              ...(input.guardPlanJson === undefined ? {} : { guardPlanJson: input.guardPlanJson }),
              signal: turnSignal,
            },
            {
              beforeToolCall: async (call) => {
                if (input.signal?.aborted) throw new AgentLoopStop("aborted")
                if (budget().elapsedMs >= limits.maxElapsedMs) throw new AgentLoopStop("max_elapsed")
                if (toolCallsUsed >= limits.maxToolCalls) throw new AgentLoopStop("max_tool_calls")
                const serializedInput = stableSerialize(call.input)
                const fingerprint = toolFingerprintFromSerialized(call, serializedInput)
                const prior = toolCounts.get(fingerprint) ?? 0
                if (prior >= limits.maxIdenticalToolCalls) throw new AgentLoopStop("duplicate_tool_call")
                toolCounts.set(fingerprint, prior + 1)
                serializedInputs.set(call.id, serializedInput)
                callFingerprints.push(fingerprint)
                toolCallsUsed += 1
              },
            },
          ),
          turnSignal,
        )
      } catch (error) {
        repeatStateJson = null
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

        const projection = projectModelVisibleHistory(runEvents())
        if (projection.anchorRequestIdentity === undefined) {
          bootstrapMessages.push(cloneBootstrapMessage(RECOVERY_MESSAGE))
        } else {
          await appendHistoryBatch([{
            source: "recovery_system",
            message: cloneBootstrapMessage(RECOVERY_MESSAGE),
          }])
        }
        continue
      }

      assistant = result.assistant
      const projection = projectModelVisibleHistory(runEvents())
      if (projection.anchorRequestIdentity === undefined) {
        throw new Error("Successful model turn did not establish an H2-R1 request snapshot anchor")
      }

      const historyBatch: PendingHistoryMessage[] = []
      if (result.assistant || result.toolCalls.length > 0) {
        historyBatch.push({
          source: "assistant_response",
          message: {
            role: "assistant",
            content: result.assistant,
            toolCalls: result.toolCalls.map((call) => ({ ...call })),
          },
        })
      }
      for (const toolResult of result.toolResults) {
        historyBatch.push({
          source: "tool_result",
          message: {
            role: "tool",
            name: toolResult.name,
            toolCallId: toolResult.id,
            content: toolMessageContent(toolResult.output, limits.maxToolResultChars),
          },
        })
      }

      const repeatObservation = observeRepeatBatch({
        previousStateJson: repeatStateJson,
        result,
        serializedInputs,
        enabled: repeatObservationEnabled,
      })
      await appendHistoryBatch(historyBatch, repeatObservation.advisory)
      repeatStateJson = repeatObservation.nextStateJson

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
