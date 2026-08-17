import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import test from "node:test"

import {
  KDO_H5_R4A_LIMITS,
  KDO_H5_R4A_STEP_TERMINAL_KINDS,
  KDO_H5_R4A_STEP_VERSION,
  projectAgentStep,
  validateAgentStepEvidence,
} from "../src/session/agent-step.ts"
import {
  KDO_H5_R2B_ADVISORY_MESSAGE_CONTENT,
  createModelHistoryMessageRecord,
  createRepeatCallAdvisoryHistoryRecord,
  createToolResultPruningHistoryRecord,
} from "../src/session/model-visible-history.ts"
import { createModelVisibleRequestSnapshot } from "../src/session/model-visible-request.ts"
import {
  KDO_H5_R2A_CALL_VERSION,
  KDO_H5_R2A_POLICY_VERSION,
  advanceRepeatCallSignal,
  serializeRepeatCallAdvisorySignal,
} from "../src/agent/repeat-call-signal.ts"
import { createToolResultPruningPolicy } from "../src/agent/tool-result-pruning.ts"
import {
  KODAC_EVENT_PROTOCOL,
  KODAC_EVENT_VERSION,
  type KodacEvent,
} from "../src/protocol/event.ts"
import type { ModelMessage } from "../src/model/provider.ts"

const source = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8")

function gitBlobSha1(text: string): string {
  const canonical = text.replace(/\r\n/g, "\n")
  const body = Buffer.from(canonical, "utf8")
  return createHash("sha1").update(`blob ${body.byteLength}\0`).update(body).digest("hex")
}

function event(
  sequence: number,
  type: string,
  payload: unknown,
  sessionId = "session-r4a",
): KodacEvent {
  return {
    protocol: KODAC_EVENT_PROTOCOL,
    version: KODAC_EVENT_VERSION,
    eventId: `event-${sequence}`,
    sessionId,
    sequence,
    emittedAt: "2026-08-15T00:00:00.000Z",
    type,
    payload,
  } as unknown as KodacEvent
}

function start(sequence = 1, turn = 1, sessionId = "session-r4a"): KodacEvent {
  return event(sequence, "agent.turn.started", { turn, budget: { elapsedMs: 0 } }, sessionId)
}

function terminal(
  sequence: number,
  type: "agent.turn.completed" | "agent.turn.failed" | "agent.turn.stopped",
  turn = 1,
  sessionId = "session-r4a",
): KodacEvent {
  return event(sequence, type, { turn, budget: { elapsedMs: 1 } }, sessionId)
}

function request(content = "hello") {
  return createModelVisibleRequestSnapshot({
    provider: "fixture",
    model: "fixture/model",
    messages: [{ role: "user", content }],
    tools: [],
  })
}

const PLAN = "a".repeat(64)
const PIPELINE = "b".repeat(64)
const BASE_TOOLS = "c".repeat(64)
const EFFECTIVE_TOOLS = "d".repeat(64)
const ORIGINAL_CALL = "e".repeat(64)
const FINAL_CALL = "f".repeat(64)

function guardEvaluatedPayload() {
  return {
    version: "kodac-tool-guard-evidence-v1",
    planIdentity: PLAN,
    callId: "call-1",
    tool: "fixture",
    capability: "fixture",
    pipelineResultIdentity: PIPELINE,
    baseToolSetIdentity: BASE_TOOLS,
    effectiveToolSetIdentity: EFFECTIVE_TOOLS,
    originalCallIdentity: ORIGINAL_CALL,
    finalCallIdentity: FINAL_CALL,
    blocked: false,
    blockCode: null,
    inputChanged: false,
    requiresK2Reevaluation: false,
  }
}

function guardObservedPayload() {
  return {
    version: "kodac-tool-guard-execution-observation-v1",
    planIdentity: PLAN,
    callId: "call-1",
    tool: "fixture",
    capability: "fixture",
    pipelineResultIdentity: PIPELINE,
    finalCallIdentity: FINAL_CALL,
    status: "completed",
  }
}

test("R4A versions limits and fixed completed/stopped identity vectors are exact", () => {
  assert.equal(KDO_H5_R4A_STEP_VERSION, "kodac-agent-step-v1")
  assert.deepEqual(KDO_H5_R4A_STEP_TERMINAL_KINDS, ["completed", "failed", "stopped"])
  assert.deepEqual(KDO_H5_R4A_LIMITS, {
    maxStepEvents: 1024,
    maxHistoryRecords: 512,
    maxRepeatAdvisories: 64,
    maxPruningRecords: 64,
    maxGuardEvaluations: 256,
    maxIdentityReferences: 2048,
    maxCanonicalStepBytes: 256 * 1024,
  })

  const snapshot = request()
  assert.equal(snapshot.requestIdentity, "987eb2c447114cbff94705d35f9e83e6637d97a2d6a8332f69fd8cd195499628")
  const completed = projectAgentStep([
    start(1, 1),
    event(2, "model.request.snapshot", snapshot),
    event(3, "model.responded", { finishReason: "stop" }),
    terminal(4, "agent.turn.completed", 1),
  ])
  assert.equal(completed.stepIdentity, "078063deeb7f2d84915b1f43a172a99ccaa09093ae3c6dc1ae083876314e8d5e")
  assert.equal(completed.terminalKind, "completed")
  assert.equal(completed.requestIdentity, snapshot.requestIdentity)

  const stopped = projectAgentStep([
    start(1, 2),
    terminal(2, "agent.turn.stopped", 2),
  ])
  assert.equal(stopped.stepIdentity, "fe82ed8af65bed1d057aad786b2a62dde09afb383ca1239993cf32642b014194")
  assert.equal(stopped.terminalKind, "stopped")
  assert.equal(stopped.requestIdentity, null)
})

test("completed multi-tool step binds ordered H2 history and R3B structural identities", () => {
  const initial: ModelMessage[] = [{ role: "user", content: "do it" }]
  const snapshot = createModelVisibleRequestSnapshot({
    provider: "fixture",
    model: "fixture/model",
    messages: initial,
    tools: [],
  })
  const assistant: ModelMessage = {
    role: "assistant",
    content: "",
    toolCalls: [{ id: "call-1", name: "fixture", input: { value: 1 } }],
  }
  const toolOne: ModelMessage = {
    role: "tool",
    name: "fixture",
    toolCallId: "call-1",
    content: "one",
  }
  const toolTwo: ModelMessage = {
    role: "tool",
    name: "fixture",
    toolCallId: "call-2",
    content: "two",
  }
  const assistantRecord = createModelHistoryMessageRecord({
    afterRequestIdentity: snapshot.requestIdentity,
    source: "assistant_response",
    message: {
      role: "assistant",
      content: "",
      toolCalls: [
        { id: "call-1", name: "fixture", input: { value: 1 } },
        { id: "call-2", name: "fixture", input: { value: 2 } },
      ],
    },
  })
  const toolOneRecord = createModelHistoryMessageRecord({
    afterRequestIdentity: snapshot.requestIdentity,
    source: "tool_result",
    message: toolOne,
  })
  const toolTwoRecord = createModelHistoryMessageRecord({
    afterRequestIdentity: snapshot.requestIdentity,
    source: "tool_result",
    message: toolTwo,
  })

  const step = projectAgentStep([
    start(),
    event(2, "model.request.snapshot", snapshot),
    event(3, "tool.guard.evaluated", guardEvaluatedPayload()),
    event(4, "model.history.message.appended", assistantRecord),
    event(5, "model.history.message.appended", toolOneRecord),
    event(6, "model.history.message.appended", toolTwoRecord),
    event(7, "tool.guard.execution_observed", guardObservedPayload()),
    terminal(8, "agent.turn.completed"),
  ])

  assert.deepEqual(step.historyRecordIdentities, [
    assistantRecord.recordIdentity,
    toolOneRecord.recordIdentity,
    toolTwoRecord.recordIdentity,
  ])
  assert.deepEqual(step.guardPipelineResultIdentities, [PIPELINE, PIPELINE])
  assert.deepEqual(step.guardFinalCallIdentities, [FINAL_CALL, FINAL_CALL])
  assert.equal(step.eventCount, 8)
  assert.match(step.stepIdentity, /^[0-9a-f]{64}$/)
  assert.notEqual(assistant.content, toolOne.content)
})

test("R1B pruning and R2B advisory coexist without duplicating raw history into step evidence", () => {
  const initial: ModelMessage[] = [{ role: "user", content: "repeat" }]
  const snapshot = createModelVisibleRequestSnapshot({
    provider: "fixture",
    model: "fixture/model",
    messages: initial,
    tools: [],
  })
  const assistant: ModelMessage = {
    role: "assistant",
    content: "",
    toolCalls: [{ id: "call-1", name: "fixture", input: { value: 1 } }],
  }
  const tool: ModelMessage = {
    role: "tool",
    name: "fixture",
    toolCallId: "call-1",
    content: `HEAD-${"x".repeat(1000)}-TAIL`,
  }
  const assistantRecord = createModelHistoryMessageRecord({
    afterRequestIdentity: snapshot.requestIdentity,
    source: "assistant_response",
    message: assistant,
  })
  const toolRecord = createModelHistoryMessageRecord({
    afterRequestIdentity: snapshot.requestIdentity,
    source: "tool_result",
    message: tool,
  })

  const repeatPolicy = JSON.stringify({ version: KDO_H5_R2A_POLICY_VERSION, thresholds: [2] })
  const repeatCall = JSON.stringify({
    version: KDO_H5_R2A_CALL_VERSION,
    toolName: "fixture",
    toolInput: { value: 1 },
  })
  const first = advanceRepeatCallSignal(null, repeatCall, repeatPolicy)
  const second = advanceRepeatCallSignal(first.nextStateJson, repeatCall, repeatPolicy)
  assert.ok(second.advisorySignal)
  const advisory = createRepeatCallAdvisoryHistoryRecord({
    afterRequestIdentity: snapshot.requestIdentity,
    assistantHistoryRecordIdentity: assistantRecord.recordIdentity,
    toolResultHistoryRecordIdentity: toolRecord.recordIdentity,
    signalJson: serializeRepeatCallAdvisorySignal(second.advisorySignal),
  })

  const pruning = createToolResultPruningHistoryRecord({
    afterRequestIdentity: snapshot.requestIdentity,
    messages: [
      ...initial,
      assistant,
      tool,
      { role: "system", content: KDO_H5_R2B_ADVISORY_MESSAGE_CONTENT },
    ],
    policy: createToolResultPruningPolicy({ maxToolResultBytes: 192 }),
  })

  const step = projectAgentStep([
    start(),
    event(2, "model.request.snapshot", snapshot),
    event(3, "model.history.message.appended", assistantRecord),
    event(4, "model.history.message.appended", toolRecord),
    event(5, "model.history.repeat_call_advisory.appended", advisory),
    event(6, "model.history.tool_result_pruning.applied", pruning),
    terminal(7, "agent.turn.completed"),
  ])

  assert.deepEqual(step.historyRecordIdentities, [assistantRecord.recordIdentity, toolRecord.recordIdentity])
  assert.deepEqual(step.repeatAdvisoryRecordIdentities, [advisory.recordIdentity])
  assert.deepEqual(step.pruningRecordIdentities, [pruning.recordIdentity])
  const serialized = JSON.stringify(step)
  assert.equal(serialized.includes("HEAD-"), false)
  assert.equal(serialized.includes(KDO_H5_R2B_ADVISORY_MESSAGE_CONTENT), false)
})

test("failed steps may terminate before or after a request snapshot", () => {
  const before = projectAgentStep([
    start(1, 1),
    event(2, "model.failed", { stage: "snapshot", error: "rejected" }),
    terminal(3, "agent.turn.failed", 1),
  ])
  assert.equal(before.terminalKind, "failed")
  assert.equal(before.requestIdentity, null)

  const snapshot = request("after")
  const after = projectAgentStep([
    start(1, 2),
    event(2, "model.request.snapshot", snapshot),
    event(3, "model.failed", { stage: "provider", error: "failed" }),
    terminal(4, "agent.turn.failed", 2),
  ])
  assert.equal(after.terminalKind, "failed")
  assert.equal(after.requestIdentity, snapshot.requestIdentity)
})

test("step grammar fails closed on open duplicate nested unknown mixed and noncontiguous lifecycles", () => {
  const snapshot = request()
  assert.throws(() => projectAgentStep([]), /at least one event/)
  assert.throws(() => projectAgentStep([
    event(1, "model.request.snapshot", snapshot),
    terminal(2, "agent.turn.completed"),
  ]), /must start/)
  assert.throws(() => projectAgentStep([
    start(),
    event(2, "model.request.snapshot", snapshot),
  ]), /exactly one supported terminal/)
  assert.throws(() => projectAgentStep([
    start(),
    terminal(2, "agent.turn.failed"),
    terminal(3, "agent.turn.completed"),
  ]), /terminal event must be last/)
  assert.throws(() => projectAgentStep([
    start(),
    start(2),
    terminal(3, "agent.turn.failed"),
  ]), /second agent\.turn\.started/)
  assert.throws(() => projectAgentStep([
    start(),
    event(2, "agent.turn.future_required", { turn: 1 }),
    terminal(3, "agent.turn.failed"),
  ]), /unsupported required agent turn lifecycle/)
  assert.throws(() => projectAgentStep([
    start(1, 1, "session-a"),
    terminal(2, "agent.turn.failed", 1, "session-b"),
  ]), /mix session ids/)
  assert.throws(() => projectAgentStep([
    start(1),
    terminal(3, "agent.turn.failed"),
  ]), /contiguous strictly increasing/)
  assert.throws(() => projectAgentStep([
    start(1),
    terminal(1, "agent.turn.failed"),
  ]), /contiguous strictly increasing/)
  assert.throws(() => projectAgentStep([
    start(2),
    terminal(1, "agent.turn.failed"),
  ]), /contiguous strictly increasing/)
  assert.throws(() => projectAgentStep([
    start(1, 2),
    terminal(2, "agent.turn.failed", 1),
  ]), /terminal turn/)
})

test("request and history bindings reject duplicates tampering stale order and completed-without-request", () => {
  const snapshot = request()
  assert.throws(() => projectAgentStep([
    start(),
    event(2, "model.request.snapshot", snapshot),
    event(3, "model.request.snapshot", snapshot),
    terminal(4, "agent.turn.completed"),
  ]), /more than one model\.request\.snapshot/)

  assert.throws(() => projectAgentStep([
    start(),
    terminal(2, "agent.turn.completed"),
  ]), /requires a model\.request\.snapshot/)

  const tamperedSnapshot = { ...snapshot, requestIdentity: "0".repeat(64) }
  assert.throws(() => projectAgentStep([
    start(),
    event(2, "model.request.snapshot", tamperedSnapshot),
    terminal(3, "agent.turn.completed"),
  ]), /derived fields mismatch/)

  const record = createModelHistoryMessageRecord({
    afterRequestIdentity: snapshot.requestIdentity,
    source: "assistant_response",
    message: { role: "assistant", content: "answer" },
  })
  const tamperedRecord = { ...record, recordIdentity: "0".repeat(64) }
  assert.throws(() => projectAgentStep([
    start(),
    event(2, "model.request.snapshot", snapshot),
    event(3, "model.history.message.appended", tamperedRecord),
    terminal(4, "agent.turn.completed"),
  ]), /derived fields mismatch/)

  const other = request("other")
  const stale = createModelHistoryMessageRecord({
    afterRequestIdentity: other.requestIdentity,
    source: "assistant_response",
    message: { role: "assistant", content: "stale" },
  })
  assert.throws(() => projectAgentStep([
    start(),
    event(2, "model.request.snapshot", snapshot),
    event(3, "model.history.message.appended", stale),
    terminal(4, "agent.turn.completed"),
  ]), /stale request identity/)
})

test("guard evidence is structural ordered and observations require a prior matching evaluation", () => {
  const snapshot = request()
  assert.throws(() => projectAgentStep([
    start(),
    event(2, "model.request.snapshot", snapshot),
    event(3, "tool.guard.execution_observed", guardObservedPayload()),
    terminal(4, "agent.turn.completed"),
  ]), /prior guard evaluation/)

  assert.throws(() => projectAgentStep([
    start(),
    event(2, "model.request.snapshot", snapshot),
    event(3, "tool.guard.evaluated", {
      ...guardEvaluatedPayload(),
      pipelineResultIdentity: "A".repeat(64),
    }),
    terminal(4, "agent.turn.completed"),
  ]), /lowercase SHA-256/)
})

test("hostile event structures fail closed without executing Proxy or accessor hooks", () => {
  const base = [start(), terminal(2, "agent.turn.failed")]

  let arrayTraps = 0
  const proxiedArray = new Proxy(base, {
    get() { arrayTraps += 1; return undefined },
    getPrototypeOf() { arrayTraps += 1; return Array.prototype },
  })
  assert.throws(() => projectAgentStep(proxiedArray), /Proxy/)
  assert.equal(arrayTraps, 0)

  let eventTraps = 0
  const proxiedEvent = new Proxy(base[0] as object, {
    get() { eventTraps += 1; return undefined },
    ownKeys() { eventTraps += 1; return [] },
    getPrototypeOf() { eventTraps += 1; return Object.prototype },
  })
  assert.throws(() => projectAgentStep([
    proxiedEvent as unknown as KodacEvent,
    terminal(2, "agent.turn.failed"),
  ]), /Proxy/)
  assert.equal(eventTraps, 0)

  let getterCalls = 0
  const accessorPayload: Record<string, unknown> = {}
  Object.defineProperty(accessorPayload, "turn", {
    enumerable: true,
    get() { getterCalls += 1; return 1 },
  })
  assert.throws(() => projectAgentStep([
    event(1, "agent.turn.started", accessorPayload),
    terminal(2, "agent.turn.failed"),
  ]), /accessor field/)
  assert.equal(getterCalls, 0)

  const sparse = new Array<KodacEvent>(2)
  sparse[0] = start()
  assert.throws(() => projectAgentStep(sparse), /sparse array/)

  const symbolEvent = { ...(base[0] as unknown as Record<string, unknown>) } as Record<PropertyKey, unknown>
  symbolEvent[Symbol("hostile")] = true
  assert.throws(() => projectAgentStep([
    symbolEvent as unknown as KodacEvent,
    terminal(2, "agent.turn.failed"),
  ]), /symbol-keyed/)
})

test("step and serialized evidence bounds fail closed without truncation", () => {
  const tooMany = Array.from(
    { length: KDO_H5_R4A_LIMITS.maxStepEvents + 1 },
    (_, index) => event(index + 1, index === 0 ? "agent.turn.started" : "agent.turn.noise", { turn: 1 }),
  )
  assert.throws(() => projectAgentStep(tooMany), /exceeds 1024 events/)

  const hugeSession = "s".repeat(KDO_H5_R4A_LIMITS.maxCanonicalStepBytes + 1)
  assert.throws(() => projectAgentStep([
    start(1, 1, hugeSession),
    terminal(2, "agent.turn.failed", 1, hugeSession),
  ]), /canonical bytes/)

  const valid = projectAgentStep([start(), terminal(2, "agent.turn.failed")])
  const tooManyHistory = Array.from(
    { length: KDO_H5_R4A_LIMITS.maxHistoryRecords + 1 },
    () => "a".repeat(64),
  )
  assert.throws(() => validateAgentStepEvidence({
    ...valid,
    historyRecordIdentities: tooManyHistory,
    stepIdentity: "0".repeat(64),
  }), /historyRecordIdentities exceeds 512/)
})

test("AgentStepEvidence is deeply immutable independently validated and identity-bearing", () => {
  const snapshot = request()
  const step = projectAgentStep([
    start(),
    event(2, "model.request.snapshot", snapshot),
    terminal(3, "agent.turn.completed"),
  ])
  assert.equal(Object.isFrozen(step), true)
  assert.equal(Object.isFrozen(step.historyRecordIdentities), true)
  assert.equal(Object.isFrozen(step.repeatAdvisoryRecordIdentities), true)
  assert.equal(Object.isFrozen(step.pruningRecordIdentities), true)
  assert.equal(Object.isFrozen(step.guardPipelineResultIdentities), true)
  assert.equal(Object.isFrozen(step.guardFinalCallIdentities), true)
  assert.deepEqual(validateAgentStepEvidence(JSON.parse(JSON.stringify(step))), step)

  assert.throws(
    () => validateAgentStepEvidence({ ...step, stepIdentity: "0".repeat(64) }),
    /identity mismatch/,
  )
  assert.throws(
    () => validateAgentStepEvidence({ ...step, unknown: true }),
    /unknown field/,
  )

  const differentSession = projectAgentStep([
    start(1, 1, "session-other"),
    event(2, "model.request.snapshot", snapshot, "session-other"),
    terminal(3, "agent.turn.completed", 1, "session-other"),
  ])
  assert.notEqual(step.stepIdentity, differentSession.stepIdentity)
})

test("R4A production remains pure and byte-identical while R4B active lifecycle stays non-authoritative", () => {
  const production = source("../src/session/agent-step.ts")
  assert.equal(gitBlobSha1(production), "a999f1f134167f61266910566612149da91e9a5c")
  const imports = [...production.matchAll(/from\s+["']([^"']+)["']/g)]
    .map((match) => match[1])
    .sort()
  assert.deepEqual(imports, [
    "../protocol/event.ts",
    "./model-visible-history.ts",
    "./model-visible-request.ts",
    "node:crypto",
    "node:util",
  ])
  for (const forbidden of [
    "node:fs",
    "node:fs/promises",
    "node:child_process",
    "node:http",
    "node:https",
    "node:net",
    "node:tls",
    "process.env",
    "fetch(",
    "RuntimeSession",
    "EventSink",
    "JsonlEventSink",
    "RuntimeOrchestrator",
    "ExecutionGateway",
    "PolicyEngine",
    "Approval",
    "Confinement",
    "DoneGate",
    "ToolRegistry",
    "ProviderRegistry",
    "session.emit",
    "spawn(",
    "exec(",
    "execFile(",
  ]) {
    assert.equal(production.includes(forbidden), false, `R4A production must not contain ${forbidden}`)
  }

  const eventSource = source("../src/protocol/event.ts")
  assert.match(eventSource, /"agent\.turn\.stopped"/)
  const lifecycleTypes = [...eventSource.matchAll(/"(agent\.turn\.[a-z_]+)"/g)].map((match) => match[1])
  assert.deepEqual([...new Set(lifecycleTypes)].sort(), [
    "agent.turn.completed",
    "agent.turn.failed",
    "agent.turn.started",
    "agent.turn.stopped",
  ])

  const loopSource = source("../src/agent/loop.ts")
  assert.match(loopSource, /agent\.turn\.stopped/)
  assert.match(loopSource, /terminalAttempted/)
  assert.doesNotMatch(loopSource, /projectAgentStep|validateAgentStepEvidence/)

  const turnSource = source("../src/model/turn.ts")
  assert.match(turnSource, /onStreamEvent/)
  assert.doesNotMatch(turnSource, /projectAgentStep|validateAgentStepEvidence/)

  const protectedBlobs: Record<string, string> = {
    "../src/session/session.ts": "d5f2334b18e89f7bac2bac7422ed8a33669b8afd",
    "../src/session/model-visible-history.ts": "c534368c8a67cca1509146dee22d489f04f4c9c4",
    "../src/session/model-visible-request.ts": "0f4c7ef7ef0f4e4e1baa90944c39639c1dfa07a6",
    "../src/agent/tool-result-pruning.ts": "66cfee69032c4c24331e8cb9098a86a1d7b9135e",
    "../src/agent/repeat-call-signal.ts": "1fd23cbc4dffd6be5ee77446d84bdea2ca27471f",
    "../src/agent/guarded-tool-pipeline.ts": "876656bf65a67df56c4cd5f078629cde06112af1",
    "../src/agent/guarded-tool-plan.ts": "1ab6217e88c54cd8868e2bcf8d13fbb39e93d994",
    "../src/trust/policy.ts": "b4134e430204123bebe053ffc9105f05fca611c9",
    "../src/execution/gateway.ts": "1732dae059fc878c04e6b1bb6a117385efe9ed6a",
    "../src/verification/done-gate.ts": "067e147569fa52cc2b04c5df26fbe20a01e958e9",
    "../scripts/run-tests.mjs": "9a0bcde0e565168c78eb7fe4d3cf08236d24baa7",
  }
  for (const [path, expected] of Object.entries(protectedBlobs)) {
    assert.equal(gitBlobSha1(source(path)), expected, `${path} must remain byte-identical`)
  }

  const index = source("../src/index.ts")
  assert.equal(index.includes("agent-step"), false)
  const authorization = source(
    "../../../docs/planning/KODAC_KDO_H5_R4A_AGENT_STEP_RECONSTRUCTION_AUTHORIZATION_2026-08-15.md",
  )
  assert.equal(gitBlobSha1(authorization), "91d096f4014d1263a7ccf23aae8b64ea717d4643")
})