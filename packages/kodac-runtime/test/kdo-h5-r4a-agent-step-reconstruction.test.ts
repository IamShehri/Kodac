import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import test from "node:test"

import {
  KDO_H5_R4A_LIMITS,
  KDO_H5_R4A_PROJECTION_VERSION,
  KDO_H5_R4A_STEP_VERSION,
  projectAgentStep,
  validateAgentStepEvidence,
} from "../src/session/agent-step.ts"
import {
  KDO_H5_R3B_EXECUTION_OBSERVATION_VERSION,
  KDO_H5_R3B_GUARD_EVIDENCE_VERSION,
} from "../src/model/turn.ts"
import {
  KDO_H5_R1B_HISTORY_RECORD_VERSION,
  KDO_H5_R2B_ADVISORY_RECORD_VERSION,
  KDO_H5_R2B_REPEAT_ADVISORY_KIND,
  createModelHistoryMessageRecord,
} from "../src/session/model-visible-history.ts"
import { createModelRequestSnapshot } from "../src/session/model-visible-request.ts"
import type { KodacEvent } from "../src/protocol/event.ts"

const source = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8")

function gitBlobSha1(text: string): string {
  const canonical = text.replace(/\r\n/g, "\n")
  const body = Buffer.from(canonical, "utf8")
  return createHash("sha1").update(`blob ${body.byteLength}\0`).update(body).digest("hex")
}

function event(
  seq: number,
  type: string,
  payload: unknown = {},
  sessionId = "session-step-test",
): KodacEvent {
  return { seq, at: `2026-08-15T00:00:${String(seq).padStart(2, "0")}.000Z`, sessionId, type, payload }
}

function start(seq = 1, turn = 1, sessionId = "session-step-test"): KodacEvent {
  return event(seq, "agent.turn.started", { turn }, sessionId)
}

function terminal(
  seq: number,
  type: "agent.turn.completed" | "agent.turn.failed" | "agent.turn.stopped",
  turn = 1,
  sessionId = "session-step-test",
): KodacEvent {
  return event(seq, type, { turn }, sessionId)
}

function request(messageContent = "hello") {
  return createModelRequestSnapshot({
    provider: "fixture",
    model: "fixture/model",
    messages: [{ role: "user", content: messageContent }],
    tools: [{ name: "repo.read", capability: "workspace.read" }],
  })
}

function guardEvaluatedPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    version: KDO_H5_R3B_GUARD_EVIDENCE_VERSION,
    callId: "call-1",
    toolName: "repo.read",
    capability: "workspace.read",
    originalCallIdentity: "1".repeat(64),
    finalCallIdentity: "2".repeat(64),
    pipelineResultIdentity: "3".repeat(64),
    blocked: false,
    blockCode: null,
    inputChanged: true,
    requiresK2Reevaluation: true,
    ...overrides,
  }
}

function guardObservedPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    version: KDO_H5_R3B_EXECUTION_OBSERVATION_VERSION,
    callId: "call-1",
    toolName: "repo.read",
    capability: "workspace.read",
    finalCallIdentity: "2".repeat(64),
    outputIdentity: "4".repeat(64),
    ...overrides,
  }
}

test("R4A versions limits and terminal vocabulary are exact", () => {
  assert.equal(KDO_H5_R4A_PROJECTION_VERSION, "kodac-agent-step-projection-v1")
  assert.equal(KDO_H5_R4A_STEP_VERSION, "kodac-agent-step-evidence-v1")
  assert.deepEqual(KDO_H5_R4A_LIMITS, {
    maxStepEvents: 1024,
    maxCanonicalStepBytes: 512 * 1024,
    maxHistoryRecords: 512,
    maxRepeatAdvisoryRecords: 128,
    maxPruningRecords: 128,
    maxGuardRecords: 512,
  })

  for (const type of ["agent.turn.completed", "agent.turn.failed", "agent.turn.stopped"] as const) {
    const step = projectAgentStep([start(), terminal(2, type)])
    assert.equal(step.terminalEventType, type)
    assert.equal(step.terminalSequence, 2)
    assert.equal(step.eventCount, 2)
  }
})

test("R4A reconstructs a full step with request history repeat pruning and guard evidence", () => {
  const snapshot = request()
  const historyRecord = createModelHistoryMessageRecord({
    afterRequestIdentity: snapshot.requestIdentity,
    source: "assistant_response",
    message: { role: "assistant", content: "answer" },
  })
  const repeatRecord = {
    version: KDO_H5_R2B_ADVISORY_RECORD_VERSION,
    advisoryKind: KDO_H5_R2B_REPEAT_ADVISORY_KIND,
    beforeRequestIdentity: snapshot.requestIdentity,
    afterRequestIdentity: "5".repeat(64),
    recordIdentity: "6".repeat(64),
  }
  const pruningRecord = {
    version: KDO_H5_R1B_HISTORY_RECORD_VERSION,
    beforeRequestIdentity: snapshot.requestIdentity,
    afterRequestIdentity: "7".repeat(64),
    recordIdentity: "8".repeat(64),
  }
  const step = projectAgentStep([
    start(),
    event(2, "model.request.snapshot", snapshot),
    event(3, "model.history.message.appended", historyRecord),
    event(4, "model.history.repeat_call_advisory.appended", repeatRecord),
    event(5, "model.history.tool_result_pruning.applied", pruningRecord),
    event(6, "tool.guard.evaluated", guardEvaluatedPayload()),
    event(7, "tool.guard.execution_observed", guardObservedPayload()),
    terminal(8, "agent.turn.completed"),
  ])
  assert.equal(step.requestIdentity, snapshot.requestIdentity)
  assert.deepEqual(step.historyRecordIdentities, [historyRecord.recordIdentity])
  assert.deepEqual(step.repeatAdvisoryRecordIdentities, [repeatRecord.recordIdentity])
  assert.deepEqual(step.pruningRecordIdentities, [pruningRecord.recordIdentity])
  assert.deepEqual(step.guardPipelineResultIdentities, ["3".repeat(64)])
  assert.deepEqual(step.guardFinalCallIdentities, ["2".repeat(64)])
  assert.match(step.stepIdentity, /^[0-9a-f]{64}$/)
})

test("R4A sequence and terminal invariants fail closed", () => {
  assert.throws(() => projectAgentStep([]), /1\.\.1024 events/)
  assert.throws(() => projectAgentStep([terminal(1, "agent.turn.failed")]), /must start with agent\.turn\.started/)
  assert.throws(() => projectAgentStep([
    start(),
    event(3, "agent.turn.noise", { turn: 1 }),
    terminal(4, "agent.turn.failed"),
  ]), /contiguous strictly increasing/)
  assert.throws(() => projectAgentStep([
    start(),
    terminal(2, "agent.turn.failed"),
    event(3, "agent.turn.noise", { turn: 1 }),
  ]), /terminal event must be final/)
  assert.throws(() => projectAgentStep([
    start(),
    terminal(2, "agent.turn.completed"),
    terminal(3, "agent.turn.failed"),
  ]), /terminal event must be final|exactly one terminal/)
  assert.throws(() => projectAgentStep([
    event(1, "agent.turn.started", { turn: 0 }),
    terminal(2, "agent.turn.failed", 0),
  ]), /turn must be a positive integer/)
  assert.throws(() => projectAgentStep([
    start(),
    event(2, "agent.turn.noise", { turn: 2 }),
    terminal(3, "agent.turn.failed"),
  ]), /event turn does not match/)
  assert.throws(() => projectAgentStep([
    start(1, 1, "session-a"),
    terminal(2, "agent.turn.failed", 1, "session-b"),
  ]), /single non-empty sessionId/)
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
    "../src/execution/gateway.ts": "4005a0dd20dc88795c719b6778f272d33e570c58",
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