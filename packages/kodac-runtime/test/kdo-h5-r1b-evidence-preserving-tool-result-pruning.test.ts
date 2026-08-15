import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import test from "node:test"

import { BoundedAgentLoop } from "../src/agent/loop.ts"
import {
  KDO_H5_R1A_LIMITS,
  createToolResultPruningPolicy,
  pruneModelVisibleToolResults,
} from "../src/agent/tool-result-pruning.ts"
import type {
  ModelProvider,
  ModelProviderRequest,
  ModelProviderResponse,
} from "../src/model/provider.ts"
import { ProviderRegistry } from "../src/model/provider.ts"
import { AgentTurnRunner } from "../src/model/turn.ts"
import {
  InMemoryEventSink,
  createEvent,
  type EventSink,
  type KodacEvent,
} from "../src/protocol/event.ts"
import { RuntimeOrchestrator } from "../src/runtime/orchestrator.ts"
import {
  KDO_H5_R1B_PRUNING_HISTORY_VERSION,
  KDO_H5_R1B_PRUNING_RECORD_MAX_BYTES,
  createModelHistoryMessageRecord,
  createToolResultPruningHistoryRecord,
  projectModelVisibleHistory,
  validateToolResultPruningHistoryRecord,
} from "../src/session/model-visible-history.ts"
import { createModelVisibleRequestSnapshot } from "../src/session/model-visible-request.ts"
import { RuntimeSession } from "../src/session/session.ts"
import { ToolRegistry, type RuntimeTool } from "../src/tools/registry.ts"

const source = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8")

function gitTextBlobSha1(text: string): string {
  const canonical = text.replace(/\r\n/g, "\n")
  const body = Buffer.from(canonical, "utf8")
  return createHash("sha1").update(`blob ${body.byteLength}\0`).update(body).digest("hex")
}

class RecordingProvider implements ModelProvider {
  readonly name = "r1b-recording"
  readonly requests: ModelProviderRequest[] = []
  private readonly responses: ModelProviderResponse[]

  constructor(responses: ModelProviderResponse[]) {
    this.responses = responses.map((response) => ({
      ...response,
      toolCalls: response.toolCalls.map((call) => ({ ...call })),
    }))
  }

  async generate(request: ModelProviderRequest): Promise<ModelProviderResponse> {
    this.requests.push({
      ...request,
      messages: request.messages.map((message) => ({
        ...message,
        ...(message.toolCalls === undefined ? {} : { toolCalls: message.toolCalls.map((call) => ({ ...call })) }),
      })),
      tools: request.tools.map((tool) => ({ ...tool })),
    })
    const response = this.responses.shift()
    if (!response) throw new Error("No scripted R1B response")
    return response
  }
}

function loopHarness(
  provider: ModelProvider,
  tools: RuntimeTool[],
  sink: EventSink = new InMemoryEventSink(),
): { loop: BoundedAgentLoop; session: RuntimeSession } {
  const session = new RuntimeSession(sink, "session-r1b-test")
  const registry = new ToolRegistry()
  for (const tool of tools) registry.register(tool)
  const orchestrator = new RuntimeOrchestrator(registry, session)
  const providers = new ProviderRegistry()
  providers.register(provider)
  const runner = new AgentTurnRunner(providers, registry, orchestrator, session)
  return { loop: new BoundedAgentLoop(runner, session), session }
}

function event(sequence: number, type: KodacEvent["type"], payload: unknown): KodacEvent {
  return createEvent({
    sessionId: "session-r1b-projector",
    sequence,
    type,
    payload,
    emittedAt: "2026-08-15T00:00:00.000Z",
  })
}

function directFixture(contents: string[]): {
  events: KodacEvent[]
  anchor: string
  messages: ReturnType<typeof projectModelVisibleHistory>["messages"]
} {
  const snapshot = createModelVisibleRequestSnapshot({
    provider: "fixture",
    model: "fixture/model",
    messages: [{ role: "user", content: "run" }],
    tools: [],
  })
  const events: KodacEvent[] = [event(1, "model.request.snapshot", snapshot)]
  let sequence = 2
  contents.forEach((content, index) => {
    const assistant = createModelHistoryMessageRecord({
      afterRequestIdentity: snapshot.requestIdentity,
      source: "assistant_response",
      message: {
        role: "assistant",
        content: "",
        toolCalls: [{ id: `call-${index}`, name: "test.echo", input: { index } }],
      },
    })
    const tool = createModelHistoryMessageRecord({
      afterRequestIdentity: snapshot.requestIdentity,
      source: "tool_result",
      message: { role: "tool", name: "test.echo", toolCallId: `call-${index}`, content },
    })
    events.push(event(sequence++, "model.history.message.appended", assistant))
    events.push(event(sequence++, "model.history.message.appended", tool))
  })
  return { events, anchor: snapshot.requestIdentity, messages: projectModelVisibleHistory(events).messages }
}

test("R1B predecessor documents primitive identity and non-authority boundary are pinned", () => {
  assert.equal(
    gitTextBlobSha1(source("../../../docs/planning/KODAC_KDO_H5_R1A_MODEL_FREE_TOOL_RESULT_PRUNING_AUTHORIZATION_2026-08-15.md")),
    "6986328c44812f14035b43892a9bf4c0db0f534f",
  )
  assert.equal(
    gitTextBlobSha1(source("../../../docs/planning/KODAC_KDO_H5_R1A_MODEL_FREE_TOOL_RESULT_PRUNING_EVIDENCE_2026-08-15.md")),
    "9cdcce0070638096779cdf30c8a20e20b45d9c62",
  )
  assert.equal(gitTextBlobSha1(source("../src/agent/tool-result-pruning.ts")), "66cfee69032c4c24331e8cb9098a86a1d7b9135e")
  assert.equal(gitTextBlobSha1(source("../src/model/turn.ts")), "9ae1298b3a4f917417efbe2228e0708bc813147d")
  const historySource = source("../src/session/model-visible-history.ts")
  assert.match(historySource, /pruneModelVisibleToolResults/)
  assert.doesNotMatch(historySource, /node:(?:fs|child_process|net|http|https|tls)|process\.env|\bfetch\s*\(|ExecutionGateway|RuntimeOrchestrator|DoneGate/)
})

test("R1B structural record replays exact R1A output while canonical source history remains recoverable", () => {
  const rawMarker = `RAW_TOOL_BODY_${"x".repeat(1400)}`
  const fixture = directFixture([rawMarker])
  const policy = createToolResultPruningPolicy(256)
  const expected = pruneModelVisibleToolResults(fixture.messages, policy)
  assert.equal(expected.changes.length, 1)

  const record = createToolResultPruningHistoryRecord({
    afterRequestIdentity: fixture.anchor,
    messages: fixture.messages,
    policy,
  })
  assert.equal(record.version, KDO_H5_R1B_PRUNING_HISTORY_VERSION)
  assert.equal(record.inputIdentity, expected.inputIdentity)
  assert.equal(record.outputIdentity, expected.outputIdentity)
  assert.equal(record.resultIdentity, expected.resultIdentity)
  assert.deepEqual(record.changes, expected.changes)
  assert.ok(record.recordPreimageBytes > 0)
  assert.match(record.recordIdentity, /^[0-9a-f]{64}$/)
  assert.ok(Buffer.byteLength(JSON.stringify(record), "utf8") < KDO_H5_R1B_PRUNING_RECORD_MAX_BYTES)
  assert.equal(JSON.stringify(record).includes(rawMarker), false)
  assert.equal(JSON.stringify(record).includes("[tool-result-pruned v1]"), false)

  const canonicalBefore = projectModelVisibleHistory(fixture.events)
  assert.equal(canonicalBefore.messages.some((message) => message.content === rawMarker), true)
  const transformedEvents = [...fixture.events, event(fixture.events.length + 1, "model.history.tool_result_pruning.applied", record)]
  const transformed = projectModelVisibleHistory(transformedEvents)
  assert.deepEqual(transformed.messages, expected.messages)
  const transformedTool = transformed.messages.findLast((message) => message.role === "tool")
  assert.ok(transformedTool)
  assert.match(transformedTool.content, /^\[tool-result-pruned v1\]/)
  assert.ok(Buffer.byteLength(transformedTool.content, "utf8") <= 256)
  assert.equal(projectModelVisibleHistory(fixture.events).messages.some((message) => message.content === rawMarker), true)
})

test("R1B record validator rejects stale tampered reordered and hostile evidence fail-closed", () => {
  const fixture = directFixture(["a".repeat(1200), "b".repeat(1300)])
  const policy = createToolResultPruningPolicy(256)
  const record = createToolResultPruningHistoryRecord({ afterRequestIdentity: fixture.anchor, messages: fixture.messages, policy })
  assert.equal(record.changes.length, 2)
  assert.doesNotThrow(() => validateToolResultPruningHistoryRecord(record))

  assert.throws(() => validateToolResultPruningHistoryRecord({ ...record, recordIdentity: "0".repeat(64) }), /derived fields mismatch/)
  assert.throws(() => validateToolResultPruningHistoryRecord({ ...record, resultIdentity: "f".repeat(64) }), /resultIdentity mismatch/)
  assert.throws(() => validateToolResultPruningHistoryRecord({ ...record, changes: [...record.changes].reverse() }), /ordered|resultIdentity|derived fields/)
  assert.throws(() => projectModelVisibleHistory([
    ...fixture.events,
    event(fixture.events.length + 1, "model.history.tool_result_pruning.applied", { ...record, afterRequestIdentity: "f".repeat(64) }),
  ]), /stale request identity/)

  let traps = 0
  const proxied = new Proxy(record as object, {
    get() { traps += 1; throw new Error("proxy get invoked") },
    ownKeys() { traps += 1; throw new Error("proxy ownKeys invoked") },
    getOwnPropertyDescriptor() { traps += 1; throw new Error("proxy descriptor invoked") },
    getPrototypeOf() { traps += 1; throw new Error("proxy prototype invoked") },
  })
  assert.throws(() => validateToolResultPruningHistoryRecord(proxied), /Proxy/)
  assert.equal(traps, 0)

  const accessor = { ...record } as Record<string, unknown>
  Object.defineProperty(accessor, "recordIdentity", { enumerable: true, get() { throw new Error("accessor invoked") } })
  assert.throws(() => validateToolResultPruningHistoryRecord(accessor), /accessor/)

  const cycle = { ...record } as Record<string, unknown>
  cycle.policy = { ...record.policy, self: cycle } as never
  assert.throws(() => validateToolResultPruningHistoryRecord(cycle), /cyclic/)

  const sparseChanges = [...record.changes]
  delete sparseChanges[0]
  assert.throws(() => validateToolResultPruningHistoryRecord({ ...record, changes: sparseChanges }), /sparse/)

  const withSymbol = { ...record } as Record<string | symbol, unknown>
  withSymbol[Symbol("hidden")] = true
  assert.throws(() => validateToolResultPruningHistoryRecord(withSymbol), /symbol-keyed/)

  const nonEnumerable = { ...record } as Record<string, unknown>
  Object.defineProperty(nonEnumerable, "extra", { value: true, enumerable: false })
  assert.throws(() => validateToolResultPruningHistoryRecord(nonEnumerable), /non-enumerable/)
})

test("R1B direct replay preserves UTF-8 byte bounds and deterministic ordered multi-change evidence", () => {
  const fixture = directFixture(["🙂".repeat(500), "界".repeat(500)])
  const policy = createToolResultPruningPolicy(300)
  const first = createToolResultPruningHistoryRecord({ afterRequestIdentity: fixture.anchor, messages: fixture.messages, policy })
  const second = createToolResultPruningHistoryRecord({ afterRequestIdentity: fixture.anchor, messages: fixture.messages, policy })
  assert.deepEqual(first, second)
  assert.deepEqual(first.changes.map((change) => change.messageIndex), [...first.changes.map((change) => change.messageIndex)].sort((a, b) => a - b))
  const transformed = projectModelVisibleHistory([...fixture.events, event(fixture.events.length + 1, "model.history.tool_result_pruning.applied", first)])
  for (const message of transformed.messages.filter((message) => message.role === "tool")) {
    assert.ok(Buffer.byteLength(message.content, "utf8") <= 300)
  }
  assert.equal(transformed.messages.filter((message) => message.role !== "tool").every((message, index) => {
    const originals = fixture.messages.filter((candidate) => candidate.role !== "tool")
    return JSON.stringify(message) === JSON.stringify(originals[index])
  }), true)
})

test("R1B no policy leaves working history unchanged and emits no pruning event", async () => {
  const raw = "NO_POLICY_RAW_" + "x".repeat(1200)
  const provider = new RecordingProvider([
    { assistant: "", finishReason: "tool_calls", toolCalls: [{ id: "one", name: "test.echo", input: { value: 1 } }] },
    { assistant: "done", finishReason: "stop", toolCalls: [] },
  ])
  const tool: RuntimeTool = { name: "test.echo", capability: "test.echo", async execute() { return { raw } } }
  const { loop, session } = loopHarness(provider, [tool])
  const result = await loop.run({ provider: provider.name, model: "fixture/model", messages: [{ role: "user", content: "run" }] })
  assert.equal(result.status, "completed")
  assert.equal(provider.requests.length, 2)
  assert.equal(session.eventsSnapshot().some((candidate) => candidate.type === "model.history.tool_result_pruning.applied"), false)
  assert.equal(provider.requests[1]?.messages.some((message) => message.role === "tool" && message.content.includes("NO_POLICY_RAW_")), true)
})

test("R1B explicit policy with no changes emits no transformation event", async () => {
  const provider = new RecordingProvider([
    { assistant: "", finishReason: "tool_calls", toolCalls: [{ id: "one", name: "test.echo", input: { value: 1 } }] },
    { assistant: "done", finishReason: "stop", toolCalls: [] },
  ])
  const tool: RuntimeTool = { name: "test.echo", capability: "test.echo", async execute() { return { raw: "small" } } }
  const { loop, session } = loopHarness(provider, [tool])
  await loop.run({
    provider: provider.name,
    model: "fixture/model",
    messages: [{ role: "user", content: "run" }],
    toolResultPruningMaxBytes: 4096,
  })
  assert.equal(session.eventsSnapshot().some((candidate) => candidate.type === "model.history.tool_result_pruning.applied"), false)
})

test("R1B loop durably transforms before the next H2 snapshot and preserves canonical tool history", async () => {
  const rawMarker = "LOOP_RAW_MARKER_" + "x".repeat(1500)
  const provider = new RecordingProvider([
    { assistant: "", finishReason: "tool_calls", toolCalls: [{ id: "one", name: "test.echo", input: { stable: "EFFECTIVE_INPUT" } }] },
    { assistant: "done", finishReason: "stop", toolCalls: [] },
  ])
  const tool: RuntimeTool = { name: "test.echo", capability: "test.echo", async execute() { return { raw: rawMarker } } }
  const { loop, session } = loopHarness(provider, [tool])
  const result = await loop.run({
    provider: provider.name,
    model: "fixture/model",
    messages: [{ role: "user", content: "run" }],
    toolResultPruningMaxBytes: 256,
  })
  assert.equal(result.status, "completed")
  assert.equal(provider.requests.length, 2)

  const events = session.eventsSnapshot()
  const pruningEvents = events.filter((candidate) => candidate.type === "model.history.tool_result_pruning.applied")
  assert.equal(pruningEvents.length, 1)
  const snapshots = events.filter((candidate) => candidate.type === "model.request.snapshot")
  assert.equal(snapshots.length, 2)
  assert.ok(events.indexOf(pruningEvents[0] as KodacEvent) < events.indexOf(snapshots[1] as KodacEvent))

  const canonicalToolEvent = events.find((candidate) => candidate.type === "model.history.message.appended" && (candidate.payload as { source?: string }).source === "tool_result")
  assert.ok(canonicalToolEvent)
  assert.equal(JSON.stringify(canonicalToolEvent.payload).includes(rawMarker), true)
  assert.equal(JSON.stringify(pruningEvents[0]?.payload).includes(rawMarker), false)

  const secondRequest = provider.requests[1]
  assert.ok(secondRequest)
  const secondTool = secondRequest.messages.find((message) => message.role === "tool")
  assert.ok(secondTool)
  assert.match(secondTool.content, /^\[tool-result-pruned v1\]/)
  assert.ok(Buffer.byteLength(secondTool.content, "utf8") <= 256)
  const assistant = secondRequest.messages.find((message) => message.role === "assistant" && message.toolCalls?.length)
  assert.deepEqual(assistant?.toolCalls?.[0], { id: "one", name: "test.echo", input: { stable: "EFFECTIVE_INPUT" } })
  assert.deepEqual((snapshots[1]?.payload as { messages: unknown }).messages, secondRequest.messages)
})

test("R1B transformation sink failure prevents the later provider request and is not journaled", async () => {
  class RejectPruningSink implements EventSink {
    readonly events: KodacEvent[] = []
    append(candidate: KodacEvent): void {
      if (candidate.type === "model.history.tool_result_pruning.applied") throw new Error("pruning evidence rejected")
      this.events.push(candidate)
    }
  }
  const sink = new RejectPruningSink()
  const provider = new RecordingProvider([
    { assistant: "", finishReason: "tool_calls", toolCalls: [{ id: "one", name: "test.echo", input: { value: 1 } }] },
    { assistant: "should-not-run", finishReason: "stop", toolCalls: [] },
  ])
  const tool: RuntimeTool = { name: "test.echo", capability: "test.echo", async execute() { return { raw: "x".repeat(1500) } } }
  const { loop, session } = loopHarness(provider, [tool], sink)
  await assert.rejects(() => loop.run({
    provider: provider.name,
    model: "fixture/model",
    messages: [{ role: "user", content: "run" }],
    toolResultPruningMaxBytes: 256,
  }), /pruning evidence rejected/)
  assert.equal(provider.requests.length, 1)
  assert.equal(session.eventsSnapshot().some((candidate) => candidate.type === "model.history.tool_result_pruning.applied"), false)
})

test("R1B pruning configuration is primitive-only and rejects hostile objects before any event or provider call", async () => {
  let traps = 0
  const hostile = new Proxy({}, {
    get() { traps += 1; return 256 },
    getPrototypeOf() { traps += 1; return Object.prototype },
    ownKeys() { traps += 1; return [] },
  })
  const provider = new RecordingProvider([{ assistant: "never", finishReason: "stop", toolCalls: [] }])
  const { loop, session } = loopHarness(provider, [])
  await assert.rejects(() => loop.run({
    provider: provider.name,
    model: "fixture/model",
    messages: [{ role: "user", content: "run" }],
    toolResultPruningMaxBytes: hostile as never,
  }), /primitive number/)
  assert.equal(traps, 0)
  assert.equal(provider.requests.length, 0)
  assert.equal(session.eventsSnapshot().length, 0)
})

test("R1B legacy maxToolResultChars remains a distinct earlier bound before evidence-preserving byte pruning", async () => {
  const provider = new RecordingProvider([
    { assistant: "", finishReason: "tool_calls", toolCalls: [{ id: "one", name: "test.echo", input: { value: 1 } }] },
    { assistant: "done", finishReason: "stop", toolCalls: [] },
  ])
  const tool: RuntimeTool = { name: "test.echo", capability: "test.echo", async execute() { return { raw: "x".repeat(5000) } } }
  const { loop, session } = loopHarness(provider, [tool])
  await loop.run({
    provider: provider.name,
    model: "fixture/model",
    messages: [{ role: "user", content: "run" }],
    toolResultPruningMaxBytes: 256,
    limits: { maxToolResultChars: 300 },
  })
  const canonicalToolEvent = session.eventsSnapshot().find((candidate) => candidate.type === "model.history.message.appended" && (candidate.payload as { source?: string }).source === "tool_result")
  const canonicalContent = ((canonicalToolEvent?.payload as { message?: { content?: string } }).message?.content) ?? ""
  assert.match(canonicalContent, /\[truncated by Kodac agent loop\]$/)
  assert.ok(canonicalContent.length > 300)
  const nextTool = provider.requests[1]?.messages.find((message) => message.role === "tool")
  assert.ok(nextTool)
  assert.match(nextTool.content, /^\[tool-result-pruned v1\]/)
  assert.ok(Buffer.byteLength(nextTool.content, "utf8") <= 256)
})

test("R1B record and projector reject unsupported versions and future required history events", () => {
  const fixture = directFixture(["x".repeat(1200)])
  const record = createToolResultPruningHistoryRecord({
    afterRequestIdentity: fixture.anchor,
    messages: fixture.messages,
    policy: createToolResultPruningPolicy(256),
  })
  assert.throws(() => validateToolResultPruningHistoryRecord({ ...record, version: "future" }), /unsupported/)
  assert.throws(() => projectModelVisibleHistory([...fixture.events, {
    ...event(fixture.events.length + 1, "agent.turn.started", {}),
    type: "model.history.future.required",
  } as unknown as KodacEvent]), /unsupported required model history event type/)
})

test("R1B bounds reject invalid primitive configuration before provider use", async () => {
  for (const invalid of [0, 255, KDO_H5_R1A_LIMITS.maxToolResultBytes + 1, Number.NaN, Number.POSITIVE_INFINITY, 256.5]) {
    const provider = new RecordingProvider([{ assistant: "never", finishReason: "stop", toolCalls: [] }])
    const { loop, session } = loopHarness(provider, [])
    await assert.rejects(() => loop.run({
      provider: provider.name,
      model: "fixture/model",
      messages: [{ role: "user", content: "run" }],
      toolResultPruningMaxBytes: invalid,
    }))
    assert.equal(provider.requests.length, 0)
    assert.equal(session.eventsSnapshot().length, 0)
  }
})
