import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import test from "node:test"

import type { ModelMessage } from "../src/model/provider.ts"
import {
  InMemoryEventSink,
  createEvent,
  type EventSink,
  type KodacEvent,
  type KodacEventType,
} from "../src/protocol/event.ts"
import {
  KDO_H2_R2_DEEPSEEK_HARNESS_DONOR_PROVENANCE,
  KDO_H2_R2_HISTORY_SOURCES,
  KDO_H2_R2_HISTORY_VERSION,
  KDO_H2_R2_LIMITS,
  KDO_H2_R2_PREDECESSOR_PROVENANCE,
  createModelHistoryMessageRecord,
  modelVisibleMessagesEqual,
  projectModelVisibleHistory,
  validateModelHistoryMessageRecord,
} from "../src/session/model-visible-history.ts"
import {
  KDO_H2_R1_LIMITS,
  createModelVisibleRequestSnapshot,
} from "../src/session/model-visible-request.ts"
import { RuntimeSession } from "../src/session/session.ts"

function request(messages: ModelMessage[]) {
  return createModelVisibleRequestSnapshot({
    provider: "fixture",
    model: "fixture/model",
    messages,
    tools: [],
  })
}

function event(
  sequence: number,
  type: KodacEventType,
  payload: unknown,
  sessionId = "session-h2-r2",
): KodacEvent {
  return createEvent({
    sessionId,
    sequence,
    type,
    payload,
    emittedAt: "2026-08-14T00:00:00.000Z",
  })
}

function gitTextBlobSha1(raw: Buffer): string {
  const canonical = Buffer.from(raw.toString("utf8").replace(/\r\n/g, "\n"), "utf8")
  return createHash("sha1")
    .update(Buffer.from(`blob ${canonical.byteLength}\0`, "utf8"))
    .update(canonical)
    .digest("hex")
}

test("H2-R2 provenance and predecessor identities are pinned exactly", () => {
  assert.equal(KDO_H2_R2_HISTORY_VERSION, "kodac-model-visible-history-v1")
  assert.deepEqual(KDO_H2_R2_HISTORY_SOURCES, ["assistant_response", "tool_result", "recovery_system"])
  assert.deepEqual(KDO_H2_R2_DEEPSEEK_HARNESS_DONOR_PROVENANCE, {
    repository: "deepseek-ai/deepseek-harness",
    sourceCommit: "47f943859bef60e4160492346772ded9b24f765a",
    license: "MIT",
    intakeMode: "PORT",
    sources: [{ path: "docs/subsystems/session.md", blob: "aea9d00b38e384e7a973ce168c3a75a62e70a8bb" }],
  })
  assert.deepEqual(KDO_H2_R2_PREDECESSOR_PROVENANCE, {
    h2R1Authorization: "docs/planning/KODAC_KDO_H2_R1_MODEL_VISIBLE_REQUEST_RECONSTRUCTION_AUTHORIZATION_2026-08-14.md",
    h2R1Merge: "01daf34d36fc30b20b39293e0a3f1fc03cf32048",
    h3Audit: "docs/planning/KODAC_KDO_H3_DEEPSEEK_HARNESS_RUNTIME_DIFFERENTIAL_AUDIT_2026-08-14.md",
  })
})

test("history record identity is deterministic and structural", () => {
  const anchor = request([{ role: "user", content: "hello" }]).requestIdentity
  const input = {
    afterRequestIdentity: anchor,
    source: "assistant_response" as const,
    message: { role: "assistant" as const, content: "world" },
  }
  const first = createModelHistoryMessageRecord(input)
  const second = createModelHistoryMessageRecord({ ...input })
  assert.equal(first.recordIdentity, second.recordIdentity)
  assert.equal(first.messageIdentity, second.messageIdentity)
  assert.notEqual(
    first.recordIdentity,
    createModelHistoryMessageRecord({ ...input, source: "recovery_system" }).recordIdentity,
  )
  assert.notEqual(
    first.recordIdentity,
    createModelHistoryMessageRecord({ ...input, message: { role: "assistant", content: "changed" } }).recordIdentity,
  )
})

test("history records reuse strict H2-R1 message validation and reject tampering", () => {
  const anchor = request([{ role: "user", content: "hello" }]).requestIdentity
  assert.throws(
    () => createModelHistoryMessageRecord({
      afterRequestIdentity: anchor,
      source: "assistant_response",
      message: { role: "assistant", content: "x", extra: true } as never,
    }),
    /unknown field: extra/,
  )
  assert.throws(
    () => createModelHistoryMessageRecord({
      afterRequestIdentity: anchor,
      source: "assistant_response",
      message: { role: "assistant", content: "x", toolCalls: [{ id: "x", name: "t", input: BigInt(1) }] },
    }),
    /JSON-compatible|bigint/,
  )

  let getterCalls = 0
  const accessorMessage = { role: "assistant" } as Record<string, unknown>
  Object.defineProperty(accessorMessage, "content", {
    enumerable: true,
    get() {
      getterCalls += 1
      return "do not invoke"
    },
  })
  assert.throws(
    () => createModelHistoryMessageRecord({
      afterRequestIdentity: anchor,
      source: "assistant_response",
      message: accessorMessage as unknown as ModelMessage,
    }),
    /accessor field/,
  )
  assert.equal(getterCalls, 0)

  const valid = createModelHistoryMessageRecord({
    afterRequestIdentity: anchor,
    source: "assistant_response",
    message: { role: "assistant", content: "ok" },
  })
  const tampered = { ...valid, recordIdentity: "0".repeat(64) }
  assert.throws(() => validateModelHistoryMessageRecord(tampered), /derived fields mismatch/)
  assert.throws(
    () => validateModelHistoryMessageRecord({ ...valid, unknown: true }),
    /unknown field: unknown/,
  )
})

test("history records are deeply immutable and projected messages are independent mutable copies", () => {
  const anchor = request([{ role: "user", content: "hello" }]).requestIdentity
  const input = JSON.parse('{"__proto__":{"marker":"exact"},"nested":{"value":1}}') as Record<string, unknown>
  const record = createModelHistoryMessageRecord({
    afterRequestIdentity: anchor,
    source: "assistant_response",
    message: {
      role: "assistant",
      content: "",
      toolCalls: [{ id: "call-1", name: "tool", input }],
    },
  })
  assert.equal(Object.isFrozen(record), true)
  assert.equal(Object.isFrozen(record.message), true)
  assert.equal(Object.isFrozen(record.message.toolCalls), true)
  const frozenInput = record.message.toolCalls?.[0]?.input as Record<string, unknown>
  assert.equal(Object.isFrozen(frozenInput), true)
  assert.equal(Object.prototype.hasOwnProperty.call(frozenInput, "__proto__"), true)
  assert.deepEqual(frozenInput.__proto__, { marker: "exact" })

  const events = [
    event(1, "session.started", {}),
    event(2, "model.request.snapshot", request([{ role: "user", content: "hello" }])),
    event(3, "model.history.message.appended", record),
  ]
  const projected = projectModelVisibleHistory(events)
  const mutableInput = projected.messages[1]?.toolCalls?.[0]?.input as Record<string, unknown>
  assert.equal(Object.isFrozen(mutableInput), false)
  assert.equal(Object.prototype.hasOwnProperty.call(mutableInput, "__proto__"), true)
  ;(mutableInput.nested as Record<string, unknown>).value = 2
  assert.equal((frozenInput.nested as Record<string, unknown>).value, 1)
})

test("projector proves request-anchor to history-record to next-request continuity", () => {
  const initial: ModelMessage[] = [{ role: "user", content: "do it" }]
  const firstRequest = request(initial)
  const assistant: ModelMessage = {
    role: "assistant",
    content: "",
    toolCalls: [{ id: "call-1", name: "test.echo", input: { value: "verified" } }],
  }
  const tool: ModelMessage = {
    role: "tool",
    name: "test.echo",
    toolCallId: "call-1",
    content: "{\"echoed\":\"verified\"}",
  }
  const assistantRecord = createModelHistoryMessageRecord({
    afterRequestIdentity: firstRequest.requestIdentity,
    source: "assistant_response",
    message: assistant,
  })
  const toolRecord = createModelHistoryMessageRecord({
    afterRequestIdentity: firstRequest.requestIdentity,
    source: "tool_result",
    message: tool,
  })
  const nextMessages = [...initial, assistant, tool]
  const secondRequest = request(nextMessages)
  const events = [
    event(1, "session.started", {}),
    event(2, "model.request.snapshot", firstRequest),
    event(3, "model.history.message.appended", assistantRecord),
    event(4, "model.history.message.appended", toolRecord),
    event(5, "model.request.snapshot", secondRequest),
  ]

  const beforeSecond = projectModelVisibleHistory(events.slice(0, 4))
  assert.equal(beforeSecond.anchorRequestIdentity, firstRequest.requestIdentity)
  assert.equal(modelVisibleMessagesEqual(beforeSecond.messages, nextMessages), true)

  const afterSecond = projectModelVisibleHistory(events)
  assert.equal(afterSecond.anchorRequestIdentity, secondRequest.requestIdentity)
  assert.equal(modelVisibleMessagesEqual(afterSecond.messages, secondRequest.messages), true)
})

test("projector fails closed on orphan stale mismatched and malformed event histories", () => {
  const first = request([{ role: "user", content: "one" }])
  const record = createModelHistoryMessageRecord({
    afterRequestIdentity: first.requestIdentity,
    source: "assistant_response",
    message: { role: "assistant", content: "two" },
  })

  assert.throws(
    () => projectModelVisibleHistory([
      event(1, "model.history.message.appended", record),
    ]),
    /cannot precede a request snapshot anchor/,
  )

  const stale = { ...record, afterRequestIdentity: "f".repeat(64) }
  assert.throws(
    () => projectModelVisibleHistory([
      event(1, "model.request.snapshot", first),
      event(2, "model.history.message.appended", stale),
    ]),
    /derived fields mismatch|stale request identity/,
  )

  assert.throws(
    () => projectModelVisibleHistory([
      event(1, "model.request.snapshot", first),
      event(3, "model.history.message.appended", record),
    ]),
    /contiguous strictly increasing/,
  )

  assert.throws(
    () => projectModelVisibleHistory([
      event(1, "model.request.snapshot", first, "session-a"),
      event(2, "model.history.message.appended", record, "session-b"),
    ]),
    /cannot mix session ids/,
  )

  const unknown = {
    ...event(2, "model.history.message.appended", record),
    type: "model.history.future.required",
  } as unknown as KodacEvent
  assert.throws(
    () => projectModelVisibleHistory([
      event(1, "model.request.snapshot", first),
      unknown,
    ]),
    /unsupported required model history event type/,
  )

  const mismatchedRequest = request([{ role: "user", content: "different" }])
  assert.throws(
    () => projectModelVisibleHistory([
      event(1, "model.request.snapshot", first),
      event(2, "model.history.message.appended", record),
      event(3, "model.request.snapshot", mismatchedRequest),
    ]),
    /do not match projected model-visible history/,
  )
})

test("projection and record bounds fail closed without truncation", () => {
  const anchor = request([{ role: "user", content: "x" }]).requestIdentity
  assert.throws(
    () => createModelHistoryMessageRecord({
      afterRequestIdentity: anchor,
      source: "assistant_response",
      message: { role: "assistant", content: "x".repeat(KDO_H2_R1_LIMITS.maxMessageContentBytes + 1) },
    }),
    /exceeds/,
  )

  const events: KodacEvent[] = []
  for (let sequence = 1; sequence <= KDO_H2_R2_LIMITS.maxProjectionEvents + 1; sequence += 1) {
    events.push(event(sequence, "agent.turn.started", {}))
  }
  assert.throws(() => projectModelVisibleHistory(events), /projection entries/)
})

test("RuntimeSession journals only events whose sink append succeeded", async () => {
  class RejectHistorySink implements EventSink {
    readonly events: KodacEvent[] = []

    append(candidate: KodacEvent): void {
      if (candidate.type === "model.history.message.appended") throw new Error("history sink rejected")
      this.events.push(candidate)
    }
  }

  const sink = new RejectHistorySink()
  const session = new RuntimeSession(sink, "session-journal")
  const anchor = request([{ role: "user", content: "x" }])
  await session.emit("model.request.snapshot", anchor)
  const before = session.eventsSnapshot()
  assert.equal(before.length, 1)
  assert.equal(before[0]?.sequence, 1)

  const record = createModelHistoryMessageRecord({
    afterRequestIdentity: anchor.requestIdentity,
    source: "assistant_response",
    message: { role: "assistant", content: "not persisted" },
  })
  await assert.rejects(() => session.emit("model.history.message.appended", record), /history sink rejected/)
  assert.equal(session.eventsSnapshot().length, 1)

  const next = await session.emit("model.failed", { error: "after rejection" })
  assert.equal(next.sequence, 2)
  assert.equal(session.eventsSnapshot().length, 2)
})

test("H2-R2 projector source has no new ambient execution or persistence authority", () => {
  const source = readFileSync(new URL("../src/session/model-visible-history.ts", import.meta.url), "utf8")
  const imports = [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]).sort()
  assert.deepEqual(imports, [
    "../model/provider.ts",
    "../protocol/event.ts",
    "./model-visible-request.ts",
    "node:crypto",
  ])
  assert.doesNotMatch(source, /\bfetch\s*\(/)
  assert.doesNotMatch(source, /from\s+["']node:(?:fs|fs\/promises|child_process|net|http|https)["']/)
  assert.doesNotMatch(source, /\bExecutionGateway\b|\bRuntimeOrchestrator\b|\bDoneGate\b/)
})

test("H2-R2 protected authority surfaces remain byte-identical", () => {
  const expected = new Map([
    ["../src/model/turn.ts", "401d796b929d350046128371fee4ba719d0d56c9"],
    ["../src/model/provider.ts", "a15f1d86ceab88ab6fa1be787719d222e354e0c4"],
    ["../src/model/openai.ts", "564851b2dc8cd1aa610fbc7eaa4b5be5853f97f4"],
    ["../src/model/openai-compatible.ts", "7ed56c7bac8e03d315b465e1f173ad934227051f"],
    ["../src/runtime/orchestrator.ts", "b069da69909b282fdbdc2c62279e0297cbd430e9"],
    ["../src/tools/registry.ts", "0bdf5cfd02efda7cab0c81976c7735bc7b46081b"],
    ["../src/execution/gateway.ts", "be5926e9a8dc5c4c29d441dac11661d71e797015"],
    ["../src/verification/done-gate.ts", "067e147569fa52cc2b04c5df26fbe20a01e958e9"],
  ])
  for (const [path, expectedBlob] of expected) {
    assert.equal(gitTextBlobSha1(readFileSync(new URL(path, import.meta.url))), expectedBlob, path)
  }
})

test("in-memory sink remains compatible with the H2-R2 required event", async () => {
  const sink = new InMemoryEventSink()
  const session = new RuntimeSession(sink, "session-memory")
  const anchor = request([{ role: "user", content: "x" }])
  await session.emit("model.request.snapshot", anchor)
  await session.emit("model.history.message.appended", createModelHistoryMessageRecord({
    afterRequestIdentity: anchor.requestIdentity,
    source: "assistant_response",
    message: { role: "assistant", content: "y" },
  }))
  assert.equal(projectModelVisibleHistory(session.eventsSnapshot()).messages.at(-1)?.content, "y")
})
