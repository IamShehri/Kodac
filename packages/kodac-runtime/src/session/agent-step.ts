import { createHash } from "node:crypto"
import { types as utilTypes } from "node:util"

import {
  KODAC_EVENT_PROTOCOL,
  KODAC_EVENT_VERSION,
  type KodacEvent,
} from "../protocol/event.ts"
import {
  projectModelVisibleHistory,
  validateModelHistoryMessageRecord,
  validateRepeatCallAdvisoryHistoryRecord,
  validateToolResultPruningHistoryRecord,
} from "./model-visible-history.ts"
import { validateModelVisibleRequestSnapshot } from "./model-visible-request.ts"

export const KDO_H5_R4A_STEP_VERSION = "kodac-agent-step-v1" as const
export const KDO_H5_R4A_STEP_TERMINAL_KINDS = Object.freeze([
  "completed",
  "failed",
  "stopped",
] as const)

export type AgentStepTerminalKind = (typeof KDO_H5_R4A_STEP_TERMINAL_KINDS)[number]

export const KDO_H5_R4A_LIMITS = Object.freeze({
  maxStepEvents: 1024,
  maxHistoryRecords: 512,
  maxRepeatAdvisories: 64,
  maxPruningRecords: 64,
  maxGuardEvaluations: 256,
  maxIdentityReferences: 2048,
  maxCanonicalStepBytes: 256 * 1024,
} as const)

export interface AgentStepEvidence {
  readonly version: typeof KDO_H5_R4A_STEP_VERSION
  readonly sessionId: string
  readonly turn: number
  readonly startSequence: number
  readonly terminalSequence: number
  readonly terminalKind: AgentStepTerminalKind
  readonly requestIdentity: string | null
  readonly historyRecordIdentities: readonly string[]
  readonly repeatAdvisoryRecordIdentities: readonly string[]
  readonly pruningRecordIdentities: readonly string[]
  readonly guardPipelineResultIdentities: readonly string[]
  readonly guardFinalCallIdentities: readonly string[]
  readonly eventCount: number
  readonly stepIdentity: string
}

interface EventEnvelope {
  readonly sessionId: string
  readonly sequence: number
  readonly type: string
  readonly payload: unknown
}

interface StepEvidenceInput {
  readonly sessionId: string
  readonly turn: number
  readonly startSequence: number
  readonly terminalSequence: number
  readonly terminalKind: AgentStepTerminalKind
  readonly requestIdentity: string | null
  readonly historyRecordIdentities: readonly string[]
  readonly repeatAdvisoryRecordIdentities: readonly string[]
  readonly pruningRecordIdentities: readonly string[]
  readonly guardPipelineResultIdentities: readonly string[]
  readonly guardFinalCallIdentities: readonly string[]
  readonly eventCount: number
}

const SHA256 = /^[0-9a-f]{64}$/
const TERMINAL_KIND = new Set<string>(KDO_H5_R4A_STEP_TERMINAL_KINDS)
const EVENT_KEYS = [
  "protocol",
  "version",
  "eventId",
  "sessionId",
  "sequence",
  "emittedAt",
  "type",
  "payload",
] as const
const STEP_KEYS = [
  "version",
  "sessionId",
  "turn",
  "startSequence",
  "terminalSequence",
  "terminalKind",
  "requestIdentity",
  "historyRecordIdentities",
  "repeatAdvisoryRecordIdentities",
  "pruningRecordIdentities",
  "guardPipelineResultIdentities",
  "guardFinalCallIdentities",
  "eventCount",
  "stepIdentity",
] as const
const GUARD_EVALUATED_KEYS = [
  "version",
  "planIdentity",
  "callId",
  "tool",
  "capability",
  "pipelineResultIdentity",
  "baseToolSetIdentity",
  "effectiveToolSetIdentity",
  "originalCallIdentity",
  "finalCallIdentity",
  "blocked",
  "blockCode",
  "inputChanged",
  "requiresK2Reevaluation",
] as const
const GUARD_OBSERVED_KEYS = [
  "version",
  "planIdentity",
  "callId",
  "tool",
  "capability",
  "pipelineResultIdentity",
  "finalCallIdentity",
  "status",
] as const
const R3B_GUARD_EVIDENCE_VERSION = "kodac-tool-guard-evidence-v1"
const R3B_EXECUTION_OBSERVATION_VERSION = "kodac-tool-guard-execution-observation-v1"

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

function asPlainRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`)
  }
  if (utilTypes.isProxy(value)) throw new TypeError(`${label} must not be a Proxy`)
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(`${label} must be a plain object`)
  }
  return value as Record<string, unknown>
}

function ownDataEntries(record: Record<string, unknown>, label: string): Array<readonly [string, unknown]> {
  if (Object.getOwnPropertySymbols(record).length > 0) {
    throw new TypeError(`${label} contains symbol-keyed fields`)
  }
  const descriptors = Object.getOwnPropertyDescriptors(record)
  const entries: Array<readonly [string, unknown]> = []
  for (const key of Object.keys(descriptors)) {
    const descriptor = descriptors[key]
    if (!descriptor?.enumerable) throw new TypeError(`${label} contains non-enumerable field: ${key}`)
    if (!("value" in descriptor)) throw new TypeError(`${label} contains accessor field: ${key}`)
    if (descriptor.value === undefined) throw new TypeError(`${label} contains undefined field: ${key}`)
    entries.push([key, descriptor.value] as const)
  }
  return entries
}

function exactKeys(record: Record<string, unknown>, keys: readonly string[], label: string): void {
  const allowed = new Set(keys)
  for (const [key] of ownDataEntries(record, label)) {
    if (!allowed.has(key)) throw new TypeError(`${label} contains unknown field: ${key}`)
  }
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(record, key)) {
      throw new TypeError(`${label} is missing field: ${key}`)
    }
  }
}

function ownArrayDataValues(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be a plain array`)
  if (utilTypes.isProxy(value)) throw new TypeError(`${label} must not be a Proxy`)
  if (Object.getPrototypeOf(value) !== Array.prototype) throw new TypeError(`${label} must be a plain array`)
  if (Object.getOwnPropertySymbols(value).length > 0) {
    throw new TypeError(`${label} contains symbol-keyed fields`)
  }
  const descriptors = Object.getOwnPropertyDescriptors(value)
  const allowed = new Set<string>(["length"])
  const output: unknown[] = []
  for (let index = 0; index < value.length; index += 1) {
    const key = String(index)
    allowed.add(key)
    const descriptor = descriptors[key]
    if (!descriptor) throw new TypeError(`${label} contains a sparse array`)
    if (!descriptor.enumerable) throw new TypeError(`${label} contains non-enumerable field: ${key}`)
    if (!("value" in descriptor)) throw new TypeError(`${label} contains accessor field: ${key}`)
    if (descriptor.value === undefined) throw new TypeError(`${label} contains undefined item: ${key}`)
    output.push(descriptor.value)
  }
  const lengthDescriptor = descriptors.length
  if (!lengthDescriptor || lengthDescriptor.enumerable || !("value" in lengthDescriptor)) {
    throw new TypeError(`${label}.length must be the canonical non-enumerable data property`)
  }
  for (const key of Object.keys(descriptors)) {
    if (!allowed.has(key)) throw new TypeError(`${label} contains unknown array field: ${key}`)
  }
  return output
}

function dataField(record: Record<string, unknown>, key: string, label: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(record, key)
  if (!descriptor) throw new TypeError(`${label} is missing field: ${key}`)
  if (!descriptor.enumerable) throw new TypeError(`${label} contains non-enumerable field: ${key}`)
  if (!("value" in descriptor)) throw new TypeError(`${label} contains accessor field: ${key}`)
  if (descriptor.value === undefined) throw new TypeError(`${label} contains undefined field: ${key}`)
  return descriptor.value
}

function requirePositiveSafeInteger(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) <= 0) {
    throw new TypeError(`${label} must be a positive safe integer`)
  }
  return value as number
}

function requireSha256(value: unknown, label: string): string {
  if (typeof value !== "string" || !SHA256.test(value)) {
    throw new TypeError(`${label} must be a lowercase SHA-256 identity`)
  }
  return value
}

function requireNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(`${label} must be non-empty`)
  return value
}

function readEventEnvelope(value: unknown, index: number): EventEnvelope {
  const label = `events[${index}]`
  const record = asPlainRecord(value, label)
  exactKeys(record, EVENT_KEYS, label)
  if (dataField(record, "protocol", label) !== KODAC_EVENT_PROTOCOL) {
    throw new TypeError(`${label}.protocol is unsupported`)
  }
  if (dataField(record, "version", label) !== KODAC_EVENT_VERSION) {
    throw new TypeError(`${label}.version is unsupported`)
  }
  requireNonEmptyString(dataField(record, "eventId", label), `${label}.eventId`)
  requireNonEmptyString(dataField(record, "emittedAt", label), `${label}.emittedAt`)
  return Object.freeze({
    sessionId: requireNonEmptyString(dataField(record, "sessionId", label), `${label}.sessionId`),
    sequence: requirePositiveSafeInteger(dataField(record, "sequence", label), `${label}.sequence`),
    type: requireNonEmptyString(dataField(record, "type", label), `${label}.type`),
    payload: dataField(record, "payload", label),
  })
}

function readTurn(payload: unknown, label: string): number {
  const record = asPlainRecord(payload, label)
  ownDataEntries(record, label)
  return requirePositiveSafeInteger(dataField(record, "turn", label), `${label}.turn`)
}

function terminalKindForType(type: string): AgentStepTerminalKind | null {
  if (type === "agent.turn.completed") return "completed"
  if (type === "agent.turn.failed") return "failed"
  if (type === "agent.turn.stopped") return "stopped"
  return null
}

function canonicalStepPreimage(input: StepEvidenceInput): string {
  return `{"eventCount":${input.eventCount},"guardFinalCallIdentities":${JSON.stringify(input.guardFinalCallIdentities)},"guardPipelineResultIdentities":${JSON.stringify(input.guardPipelineResultIdentities)},"historyRecordIdentities":${JSON.stringify(input.historyRecordIdentities)},"pruningRecordIdentities":${JSON.stringify(input.pruningRecordIdentities)},"repeatAdvisoryRecordIdentities":${JSON.stringify(input.repeatAdvisoryRecordIdentities)},"requestIdentity":${JSON.stringify(input.requestIdentity)},"sessionId":${JSON.stringify(input.sessionId)},"startSequence":${input.startSequence},"terminalKind":${JSON.stringify(input.terminalKind)},"terminalSequence":${input.terminalSequence},"turn":${input.turn},"version":${JSON.stringify(KDO_H5_R4A_STEP_VERSION)}}`
}

function freezeIdentities(values: readonly string[]): readonly string[] {
  return Object.freeze([...values])
}

function assertReferenceBounds(input: StepEvidenceInput): void {
  if (input.eventCount > KDO_H5_R4A_LIMITS.maxStepEvents) {
    throw new RangeError(`agent step exceeds ${KDO_H5_R4A_LIMITS.maxStepEvents} events`)
  }
  if (input.historyRecordIdentities.length > KDO_H5_R4A_LIMITS.maxHistoryRecords) {
    throw new RangeError(`agent step exceeds ${KDO_H5_R4A_LIMITS.maxHistoryRecords} history records`)
  }
  if (input.repeatAdvisoryRecordIdentities.length > KDO_H5_R4A_LIMITS.maxRepeatAdvisories) {
    throw new RangeError(`agent step exceeds ${KDO_H5_R4A_LIMITS.maxRepeatAdvisories} repeat advisories`)
  }
  if (input.pruningRecordIdentities.length > KDO_H5_R4A_LIMITS.maxPruningRecords) {
    throw new RangeError(`agent step exceeds ${KDO_H5_R4A_LIMITS.maxPruningRecords} pruning records`)
  }
  const guardEvents = Math.max(
    input.guardPipelineResultIdentities.length,
    input.guardFinalCallIdentities.length,
  )
  if (guardEvents > KDO_H5_R4A_LIMITS.maxGuardEvaluations) {
    throw new RangeError(`agent step exceeds ${KDO_H5_R4A_LIMITS.maxGuardEvaluations} guard evidence entries`)
  }
  const totalReferences =
    input.historyRecordIdentities.length +
    input.repeatAdvisoryRecordIdentities.length +
    input.pruningRecordIdentities.length +
    input.guardPipelineResultIdentities.length +
    input.guardFinalCallIdentities.length +
    (input.requestIdentity === null ? 0 : 1)
  if (totalReferences > KDO_H5_R4A_LIMITS.maxIdentityReferences) {
    throw new RangeError(`agent step exceeds ${KDO_H5_R4A_LIMITS.maxIdentityReferences} identity references`)
  }
}

function createStepEvidence(input: StepEvidenceInput): AgentStepEvidence {
  assertReferenceBounds(input)
  const historyRecordIdentities = freezeIdentities(input.historyRecordIdentities)
  const repeatAdvisoryRecordIdentities = freezeIdentities(input.repeatAdvisoryRecordIdentities)
  const pruningRecordIdentities = freezeIdentities(input.pruningRecordIdentities)
  const guardPipelineResultIdentities = freezeIdentities(input.guardPipelineResultIdentities)
  const guardFinalCallIdentities = freezeIdentities(input.guardFinalCallIdentities)
  const normalized: StepEvidenceInput = {
    sessionId: input.sessionId,
    turn: input.turn,
    startSequence: input.startSequence,
    terminalSequence: input.terminalSequence,
    terminalKind: input.terminalKind,
    requestIdentity: input.requestIdentity,
    historyRecordIdentities,
    repeatAdvisoryRecordIdentities,
    pruningRecordIdentities,
    guardPipelineResultIdentities,
    guardFinalCallIdentities,
    eventCount: input.eventCount,
  }
  const preimage = canonicalStepPreimage(normalized)
  if (Buffer.byteLength(preimage, "utf8") > KDO_H5_R4A_LIMITS.maxCanonicalStepBytes) {
    throw new RangeError(`agent step exceeds ${KDO_H5_R4A_LIMITS.maxCanonicalStepBytes} canonical bytes`)
  }
  const evidence: AgentStepEvidence = Object.freeze({
    version: KDO_H5_R4A_STEP_VERSION,
    ...normalized,
    stepIdentity: sha256(preimage),
  })
  if (Buffer.byteLength(JSON.stringify(evidence), "utf8") > KDO_H5_R4A_LIMITS.maxCanonicalStepBytes) {
    throw new RangeError(`agent step evidence exceeds ${KDO_H5_R4A_LIMITS.maxCanonicalStepBytes} canonical bytes`)
  }
  return evidence
}

function readIdentityArray(value: unknown, label: string, limit: number): readonly string[] {
  const items = ownArrayDataValues(value, label)
  if (items.length > limit) throw new RangeError(`${label} exceeds ${limit} entries`)
  return Object.freeze(items.map((item, index) => requireSha256(item, `${label}[${index}]`)))
}

function readGuardEvaluated(payload: unknown): { pipelineResultIdentity: string; finalCallIdentity: string } {
  const label = "tool.guard.evaluated"
  const record = asPlainRecord(payload, label)
  exactKeys(record, GUARD_EVALUATED_KEYS, label)
  if (record.version !== R3B_GUARD_EVIDENCE_VERSION) throw new TypeError(`${label}.version is unsupported`)
  requireSha256(record.planIdentity, `${label}.planIdentity`)
  const pipelineResultIdentity = requireSha256(record.pipelineResultIdentity, `${label}.pipelineResultIdentity`)
  requireSha256(record.baseToolSetIdentity, `${label}.baseToolSetIdentity`)
  requireSha256(record.effectiveToolSetIdentity, `${label}.effectiveToolSetIdentity`)
  requireSha256(record.originalCallIdentity, `${label}.originalCallIdentity`)
  const finalCallIdentity = requireSha256(record.finalCallIdentity, `${label}.finalCallIdentity`)
  requireNonEmptyString(record.callId, `${label}.callId`)
  requireNonEmptyString(record.tool, `${label}.tool`)
  requireNonEmptyString(record.capability, `${label}.capability`)
  if (typeof record.blocked !== "boolean") throw new TypeError(`${label}.blocked must be boolean`)
  if (record.blockCode !== null && typeof record.blockCode !== "string") {
    throw new TypeError(`${label}.blockCode must be string or null`)
  }
  if (typeof record.inputChanged !== "boolean") throw new TypeError(`${label}.inputChanged must be boolean`)
  if (typeof record.requiresK2Reevaluation !== "boolean") {
    throw new TypeError(`${label}.requiresK2Reevaluation must be boolean`)
  }
  return { pipelineResultIdentity, finalCallIdentity }
}

function readGuardObserved(payload: unknown): { pipelineResultIdentity: string; finalCallIdentity: string } {
  const label = "tool.guard.execution_observed"
  const record = asPlainRecord(payload, label)
  exactKeys(record, GUARD_OBSERVED_KEYS, label)
  if (record.version !== R3B_EXECUTION_OBSERVATION_VERSION) throw new TypeError(`${label}.version is unsupported`)
  requireSha256(record.planIdentity, `${label}.planIdentity`)
  const pipelineResultIdentity = requireSha256(record.pipelineResultIdentity, `${label}.pipelineResultIdentity`)
  const finalCallIdentity = requireSha256(record.finalCallIdentity, `${label}.finalCallIdentity`)
  requireNonEmptyString(record.callId, `${label}.callId`)
  requireNonEmptyString(record.tool, `${label}.tool`)
  requireNonEmptyString(record.capability, `${label}.capability`)
  if (record.status !== "completed") throw new TypeError(`${label}.status is unsupported`)
  return { pipelineResultIdentity, finalCallIdentity }
}

export function validateAgentStepEvidence(value: unknown): AgentStepEvidence {
  const record = asPlainRecord(value, "agentStepEvidence")
  exactKeys(record, STEP_KEYS, "agentStepEvidence")
  if (record.version !== KDO_H5_R4A_STEP_VERSION) throw new TypeError("unsupported agent step evidence")
  if (typeof record.terminalKind !== "string" || !TERMINAL_KIND.has(record.terminalKind)) {
    throw new TypeError("agentStepEvidence.terminalKind is unsupported")
  }
  const requestIdentity =
    record.requestIdentity === null
      ? null
      : requireSha256(record.requestIdentity, "agentStepEvidence.requestIdentity")
  const rebuilt = createStepEvidence({
    sessionId: requireNonEmptyString(record.sessionId, "agentStepEvidence.sessionId"),
    turn: requirePositiveSafeInteger(record.turn, "agentStepEvidence.turn"),
    startSequence: requirePositiveSafeInteger(record.startSequence, "agentStepEvidence.startSequence"),
    terminalSequence: requirePositiveSafeInteger(record.terminalSequence, "agentStepEvidence.terminalSequence"),
    terminalKind: record.terminalKind as AgentStepTerminalKind,
    requestIdentity,
    historyRecordIdentities: readIdentityArray(
      record.historyRecordIdentities,
      "agentStepEvidence.historyRecordIdentities",
      KDO_H5_R4A_LIMITS.maxHistoryRecords,
    ),
    repeatAdvisoryRecordIdentities: readIdentityArray(
      record.repeatAdvisoryRecordIdentities,
      "agentStepEvidence.repeatAdvisoryRecordIdentities",
      KDO_H5_R4A_LIMITS.maxRepeatAdvisories,
    ),
    pruningRecordIdentities: readIdentityArray(
      record.pruningRecordIdentities,
      "agentStepEvidence.pruningRecordIdentities",
      KDO_H5_R4A_LIMITS.maxPruningRecords,
    ),
    guardPipelineResultIdentities: readIdentityArray(
      record.guardPipelineResultIdentities,
      "agentStepEvidence.guardPipelineResultIdentities",
      KDO_H5_R4A_LIMITS.maxGuardEvaluations,
    ),
    guardFinalCallIdentities: readIdentityArray(
      record.guardFinalCallIdentities,
      "agentStepEvidence.guardFinalCallIdentities",
      KDO_H5_R4A_LIMITS.maxGuardEvaluations,
    ),
    eventCount: requirePositiveSafeInteger(record.eventCount, "agentStepEvidence.eventCount"),
  })
  const stepIdentity = requireSha256(record.stepIdentity, "agentStepEvidence.stepIdentity")
  if (stepIdentity !== rebuilt.stepIdentity) throw new TypeError("agent step evidence identity mismatch")
  if (rebuilt.terminalSequence < rebuilt.startSequence) {
    throw new TypeError("agent step evidence terminal sequence cannot precede start sequence")
  }
  return rebuilt
}

export function projectAgentStep(value: readonly KodacEvent[] | unknown): AgentStepEvidence {
  const eventValues = ownArrayDataValues(value, "events")
  if (eventValues.length === 0) throw new TypeError("agent step requires at least one event")
  if (eventValues.length > KDO_H5_R4A_LIMITS.maxStepEvents) {
    throw new RangeError(`agent step exceeds ${KDO_H5_R4A_LIMITS.maxStepEvents} events`)
  }

  const events = eventValues.map((event, index) => readEventEnvelope(event, index))
  const first = events[0]
  const last = events.at(-1)
  if (first === undefined || last === undefined) throw new TypeError("agent step event window is unavailable")
  if (first.type !== "agent.turn.started") throw new TypeError("agent step must start with agent.turn.started")

  const startTurn = readTurn(first.payload, "agent.turn.started payload")
  let previousSequence = first.sequence
  let terminalCount = 0

  for (let index = 0; index < events.length; index += 1) {
    const event = events[index]
    if (event === undefined) throw new TypeError(`events[${index}] is unavailable`)
    if (event.sessionId !== first.sessionId) throw new TypeError("agent step cannot mix session ids")
    if (index > 0) {
      if (event.sequence !== previousSequence + 1) {
        throw new TypeError("agent step requires contiguous strictly increasing event sequence")
      }
      previousSequence = event.sequence
    }

    if (event.type.startsWith("agent.turn.")) {
      if (event.type === "agent.turn.started") {
        if (index !== 0) throw new TypeError("agent step cannot contain a second agent.turn.started")
        continue
      }
      const kind = terminalKindForType(event.type)
      if (kind === null) throw new TypeError(`unsupported required agent turn lifecycle event type: ${event.type}`)
      terminalCount += 1
      if (index !== events.length - 1) throw new TypeError("agent step terminal event must be last")
      const terminalTurn = readTurn(event.payload, `${event.type} payload`)
      if (terminalTurn !== startTurn) throw new TypeError("agent step terminal turn does not match started turn")
    }
  }

  const terminalKind = terminalKindForType(last.type)
  if (terminalKind === null || terminalCount !== 1) {
    throw new TypeError("agent step requires exactly one supported terminal event")
  }

  let requestIdentity: string | null = null
  let requestSnapshots = 0
  const historyRecordIdentities: string[] = []
  const repeatAdvisoryRecordIdentities: string[] = []
  const pruningRecordIdentities: string[] = []
  const guardPipelineResultIdentities: string[] = []
  const guardFinalCallIdentities: string[] = []
  const evaluatedGuardPairs = new Set<string>()
  let guardEvidenceCount = 0

  for (const event of events) {
    if (event.type === "model.request.snapshot") {
      requestSnapshots += 1
      if (requestSnapshots > 1) throw new TypeError("agent step cannot contain more than one model.request.snapshot")
      requestIdentity = validateModelVisibleRequestSnapshot(event.payload).requestIdentity
      continue
    }

    if (event.type === "model.history.message.appended") {
      const record = validateModelHistoryMessageRecord(event.payload)
      historyRecordIdentities.push(record.recordIdentity)
      continue
    }

    if (event.type === "model.history.repeat_call_advisory.appended") {
      const record = validateRepeatCallAdvisoryHistoryRecord(event.payload)
      repeatAdvisoryRecordIdentities.push(record.recordIdentity)
      continue
    }

    if (event.type === "model.history.tool_result_pruning.applied") {
      const record = validateToolResultPruningHistoryRecord(event.payload)
      pruningRecordIdentities.push(record.recordIdentity)
      continue
    }

    if (event.type === "tool.guard.evaluated") {
      guardEvidenceCount += 1
      if (guardEvidenceCount > KDO_H5_R4A_LIMITS.maxGuardEvaluations) {
        throw new RangeError(`agent step exceeds ${KDO_H5_R4A_LIMITS.maxGuardEvaluations} guard evidence entries`)
      }
      const guard = readGuardEvaluated(event.payload)
      guardPipelineResultIdentities.push(guard.pipelineResultIdentity)
      guardFinalCallIdentities.push(guard.finalCallIdentity)
      evaluatedGuardPairs.add(`${guard.pipelineResultIdentity}:${guard.finalCallIdentity}`)
      continue
    }

    if (event.type === "tool.guard.execution_observed") {
      guardEvidenceCount += 1
      if (guardEvidenceCount > KDO_H5_R4A_LIMITS.maxGuardEvaluations) {
        throw new RangeError(`agent step exceeds ${KDO_H5_R4A_LIMITS.maxGuardEvaluations} guard evidence entries`)
      }
      const guard = readGuardObserved(event.payload)
      if (!evaluatedGuardPairs.has(`${guard.pipelineResultIdentity}:${guard.finalCallIdentity}`)) {
        throw new TypeError("guard execution observation does not match a prior guard evaluation in the step")
      }
      guardPipelineResultIdentities.push(guard.pipelineResultIdentity)
      guardFinalCallIdentities.push(guard.finalCallIdentity)
    }
  }

  if (terminalKind === "completed" && requestIdentity === null) {
    throw new TypeError("completed agent step requires a model.request.snapshot")
  }

  // Reuse the canonical H2/R1B/R2B projector to prove all recognized model-visible
  // records are valid, ordered, source-bound, and replayable against this event window.
  projectModelVisibleHistory(eventValues as unknown as readonly KodacEvent[])

  return createStepEvidence({
    sessionId: first.sessionId,
    turn: startTurn,
    startSequence: first.sequence,
    terminalSequence: last.sequence,
    terminalKind,
    requestIdentity,
    historyRecordIdentities,
    repeatAdvisoryRecordIdentities,
    pruningRecordIdentities,
    guardPipelineResultIdentities,
    guardFinalCallIdentities,
    eventCount: events.length,
  })
}
