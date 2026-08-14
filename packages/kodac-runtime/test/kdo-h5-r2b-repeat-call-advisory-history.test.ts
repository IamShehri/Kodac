import assert from "node:assert/strict"
import test from "node:test"

import {
  KDO_H5_R2A_CALL_VERSION,
  KDO_H5_R2A_POLICY_VERSION,
  KDO_H5_R2A_SIGNAL_JSON_MAX_BYTES,
  advanceRepeatCallSignal,
  serializeRepeatCallAdvisorySignal,
  validateRepeatCallAdvisorySignalJson,
} from "../src/agent/repeat-call-signal.ts"
import { BoundedAgentLoop } from "../src/agent/loop.ts"
import type { ModelProvider, ModelProviderRequest, ModelProviderResponse } from "../src/model/provider.ts"
import { ProviderRegistry } from "../src/model/provider.ts"
import { AgentTurnRunner } from "../src/model/turn.ts"
import { createEvent, InMemoryEventSink, type EventSink, type KodacEvent } from "../src/protocol/event.ts"
import { RuntimeOrchestrator } from "../src/runtime/orchestrator.ts"
import {
  KDO_H5_R2B_ADVISORY_HISTORY_VERSION,
  KDO_H5_R2B_ADVISORY_MESSAGE_CONTENT,
  KDO_H5_R2B_REPEAT_POLICY_IDENTITY,
  createModelHistoryMessageRecord,
  createRepeatCallAdvisoryHistoryRecord,
  projectModelVisibleHistory,
  validateRepeatCallAdvisoryHistoryRecord,
} from "../src/session/model-visible-history.ts"
import { createModelVisibleRequestSnapshot } from "../src/session/model-visible-request.ts"
import { RuntimeSession } from "../src/session/session.ts"
import { ToolRegistry, type RuntimeTool } from "../src/tools/registry.ts"

const POLICY_JSON = `{"thresholds":[2],"version":${JSON.stringify(KDO_H5_R2A_POLICY_VERSION)}}`

function callJson(toolName: string, input: unknown): string {
  return JSON.stringify({ version: KDO_H5_R2A_CALL_VERSION, toolName, toolInput: input })
}

function thresholdTwoSignalJson(toolName = "test.echo", input: unknown = { value: "same" }): string {
  const serialized = callJson(toolName, input)
  const first = advanceRepeatCallSignal(null, serialized, POLICY_JSON)
  const second = advanceRepeatCallSignal(first.nextStateJson, serialized, POLICY_JSON)
  assert.ok(second.advisorySignal)
  assert.ok(second.advisorySignalJson)
  return second.advisorySignalJson
}

class RecordingProvider implements ModelProvider {
  readonly name = "recording-r2b"
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
      tools: [...request.tools],
    })
    const response = this.responses.shift()
    if (!response) throw new Error("No scripted R2B response")
    return response
  }
}

function harness(
  provider: ModelProvider,
  tools: RuntimeTool[] = [],
  sink: EventSink = new InMemoryEventSink(),
): { loop: BoundedAgentLoop; session: RuntimeSession; sink: EventSink } {
  const session = new RuntimeSession(sink, "session-r2b-test")
  const registry = new ToolRegistry()
  for (const tool of tools) registry.register(tool)
  const orchestrator = new RuntimeOrchestrator(registry, session)
  const providers = new ProviderRegistry()
  providers.register(provider)
  const runner = new AgentTurnRunner(providers, registry, orchestrator, session)
  return { loop: new BoundedAgentLoop(runner, session), session, sink }
}

const echoTool: RuntimeTool<{ value: string }, { echoed: string }> = {
  name: "test.echo",
  capability: "test.echo",
  async execute(input) {
    return { echoed: input.value }
  },
}

const otherTool: RuntimeTool<{ value: string }, { echoed: string }> = {
  name: "test.other",
  capability: "test.other",
  async execute(input) {
    return { echoed: input.value }
  },
}

test("R2B keeps R2A identities exact and adds canonical signal JSON validation", () => {
  assert.equal(KDO_H5_R2B_REPEAT_POLICY_IDENTITY, "7331f353c9a29af123cd54fa99453768b35fe2534db5d009df9dae67cdc80222")
  const legacyPolicy = JSON.stringify({ version: KDO_H5_R2A_POLICY_VERSION, thresholds: [2, 5] })
  const legacyCall = callJson("repo.read", { a: 1, b: [true, null, "é"] })
  const first = advanceRepeatCallSignal(null, legacyCall, legacyPolicy)
  const second = advanceRepeatCallSignal(first.nextStateJson, legacyCall, legacyPolicy)
  assert.equal(first.nextState.policyIdentity, "77650c712d3bcc40d1f4eb03a5c1dffe3a8b2b4b6d9fa6a65f386674d8c7d7b4")
  assert.equal(first.nextState.toolInputIdentity, "cd136733b75e725248fbfaf1ba55231ea1f92d89bca9014aa8860d9b473f83d9")
  assert.equal(first.nextState.callFingerprint, "55c839218c279d3f11154f30b618dde52f8d95de15d29ed2da01fc3b3cf3a434")
  assert.equal(first.nextState.stateIdentity, "9a53ca9800ea1dfe6ccb7be52ad8adf89481d7dc75bd385dd9e7cad41ff0711d")
  assert.equal(second.nextState.stateIdentity, "cdd02839695cfe9740a2ffb1e94b707bb5a6e048d8bb94e2d4df9c6e48ca56de")
  assert.equal(second.advisorySignal?.signalIdentity, "a639ba334c2d820316aa608ba967bfe47d60bc06daa6eaf7a0ca6c67987e9003")
  assert.equal(second.advisorySignalJson, serializeRepeatCallAdvisorySignal(second.advisorySignal!))
  assert.deepEqual(validateRepeatCallAdvisorySignalJson(second.advisorySignalJson), second.advisorySignal)
})

test("R2B signal JSON boundary rejects hostile non-string objects without hooks", () => {
  let gets = 0
  const proxy = new Proxy({ value: thresholdTwoSignalJson() }, {
    get(target, property, receiver) {
      gets += 1
      return Reflect.get(target, property, receiver)
    },
    ownKeys(target) {
      gets += 1
      return Reflect.ownKeys(target)
    },
    getPrototypeOf(target) {
      gets += 1
      return Reflect.getPrototypeOf(target)
    },
  })
  assert.throws(() => validateRepeatCallAdvisorySignalJson(proxy), /primitive JSON string/)
  assert.equal(gets, 0)

  const parsed = JSON.parse(thresholdTwoSignalJson()) as Record<string, unknown>
  parsed.signalIdentity = "a".repeat(64)
  assert.throws(() => validateRepeatCallAdvisorySignalJson(JSON.stringify(parsed)), /signal identity mismatch/)
  parsed.signalIdentity = thresholdTwoSignalJson().match(/"signalIdentity":"([0-9a-f]{64})"/)?.[1] ?? ""
  parsed.extra = true
  assert.throws(() => validateRepeatCallAdvisorySignalJson(JSON.stringify(parsed)), /must contain exactly/)
  assert.throws(
    () => validateRepeatCallAdvisorySignalJson(" ".repeat(KDO_H5_R2A_SIGNAL_JSON_MAX_BYTES + 1)),
    /UTF-8 bytes/,
  )
})

test("R2B advisory record is deterministic fixed system history and projects only after bound matching sources", () => {
  const secret = "S3CRET_R2B_INPUT_92841"
  const snapshot = createModelVisibleRequestSnapshot({
    provider: "fixture",
    model: "fixture/model",
    messages: [{ role: "user", content: "repeat" }],
    tools: [],
  })
  const assistant = createModelHistoryMessageRecord({
    afterRequestIdentity: snapshot.requestIdentity,
    source: "assistant_response",
    message: {
      role: "assistant",
      content: "",
      toolCalls: [{ id: "call-2", name: "test.echo", input: { value: secret } }],
    },
  })
  const tool = createModelHistoryMessageRecord({
    afterRequestIdentity: snapshot.requestIdentity,
    source: "tool_result",
    message: { role: "tool", name: "test.echo", toolCallId: "call-2", content: JSON.stringify({ echoed: secret }) },
  })
  const signalJson = thresholdTwoSignalJson("test.echo", { value: secret })
  const record = createRepeatCallAdvisoryHistoryRecord({
    afterRequestIdentity: snapshot.requestIdentity,
    assistantHistoryRecordIdentity: assistant.recordIdentity,
    toolResultHistoryRecordIdentity: tool.recordIdentity,
    signalJson,
  })
  const duplicate = createRepeatCallAdvisoryHistoryRecord({
    afterRequestIdentity: snapshot.requestIdentity,
    assistantHistoryRecordIdentity: assistant.recordIdentity,
    toolResultHistoryRecordIdentity: tool.recordIdentity,
    signalJson,
  })
  assert.equal(record.version, KDO_H5_R2B_ADVISORY_HISTORY_VERSION)
  assert.equal(record.recordIdentity, duplicate.recordIdentity)
  assert.equal(record.message.role, "system")
  assert.equal(record.message.content, KDO_H5_R2B_ADVISORY_MESSAGE_CONTENT)
  assert.equal(record.message.content.includes("test.echo"), false)
  assert.equal(record.message.content.includes(secret), false)
  assert.equal(record.message.content.includes("echoed"), false)
  assert.deepEqual(validateRepeatCallAdvisoryHistoryRecord(record), record)

  const events = [
    createEvent({ sessionId: "r2b-projection", sequence: 1, type: "model.request.snapshot", payload: snapshot }),
    createEvent({ sessionId: "r2b-projection", sequence: 2, type: "model.history.message.appended", payload: assistant }),
    createEvent({ sessionId: "r2b-projection", sequence: 3, type: "model.history.message.appended", payload: tool }),
    createEvent({ sessionId: "r2b-projection", sequence: 4, type: "model.history.repeat_call_advisory.appended", payload: record }),
  ]
  const projection = projectModelVisibleHistory(events)
  assert.equal(projection.messages.at(-1)?.role, "system")
  assert.equal(projection.messages.at(-1)?.content, KDO_H5_R2B_ADVISORY_MESSAGE_CONTENT)

  assert.throws(
    () => projectModelVisibleHistory([events[0], events[3]]),
    /contiguous strictly increasing|unseen assistant history record/,
  )
  assert.throws(
    () => projectModelVisibleHistory([
      events[0],
      createEvent({ sessionId: "r2b-projection", sequence: 2, type: "model.history.repeat_call_advisory.appended", payload: record }),
    ]),
    /unseen assistant history record/,
  )

  const mismatchedRecord = createRepeatCallAdvisoryHistoryRecord({
    afterRequestIdentity: snapshot.requestIdentity,
    assistantHistoryRecordIdentity: assistant.recordIdentity,
    toolResultHistoryRecordIdentity: tool.recordIdentity,
    signalJson: thresholdTwoSignalJson("test.echo", { value: "DIFFERENT_R2B_INPUT_81234" }),
  })
  assert.throws(
    () => projectModelVisibleHistory([
      events[0],
      events[1],
      events[2],
      createEvent({ sessionId: "r2b-projection", sequence: 4, type: "model.history.repeat_call_advisory.appended", payload: mismatchedRecord }),
    ]),
    /does not match its bound assistant\/tool-result source records/,
  )
})

test("R2B record rejects non-canonical policy and threshold semantics", () => {
  const snapshot = createModelVisibleRequestSnapshot({
    provider: "fixture",
    model: "fixture/model",
    messages: [{ role: "user", content: "repeat" }],
    tools: [],
  })
  const assistantIdentity = "1".repeat(64)
  const toolIdentity = "2".repeat(64)
  const first = advanceRepeatCallSignal(null, callJson("test.echo", { value: "same" }), JSON.stringify({
    version: KDO_H5_R2A_POLICY_VERSION,
    thresholds: [2, 5],
  }))
  const second = advanceRepeatCallSignal(first.nextStateJson, callJson("test.echo", { value: "same" }), JSON.stringify({
    version: KDO_H5_R2A_POLICY_VERSION,
    thresholds: [2, 5],
  }))
  assert.throws(
    () => createRepeatCallAdvisoryHistoryRecord({
      afterRequestIdentity: snapshot.requestIdentity,
      assistantHistoryRecordIdentity: assistantIdentity,
      toolResultHistoryRecordIdentity: toolIdentity,
      signalJson: second.advisorySignalJson!,
    }),
    /canonical R2B policy/,
  )
})

test("R2B loop makes the second consecutive completion a canonical advisory before the hard third stop", async () => {
  const provider = new RecordingProvider([
    { assistant: "", finishReason: "tool_calls", toolCalls: [{ id: "call-1", name: "test.echo", input: { value: "same" } }] },
    { assistant: "", finishReason: "tool_calls", toolCalls: [{ id: "call-2", name: "test.echo", input: { value: "same" } }] },
    { assistant: "", finishReason: "tool_calls", toolCalls: [{ id: "call-3", name: "test.echo", input: { value: "same" } }] },
  ])
  const { loop, session } = harness(provider, [echoTool])
  const result = await loop.run({
    provider: provider.name,
    model: "fixture/model",
    messages: [{ role: "user", content: "repeat safely" }],
  })

  assert.equal(result.status, "stopped")
  assert.equal(result.reason, "duplicate_tool_call")
  assert.equal(provider.requests.length, 3)
  const advisoryEvents = session.eventsSnapshot().filter((event) => event.type === "model.history.repeat_call_advisory.appended")
  assert.equal(advisoryEvents.length, 1)
  const thirdRequestAdvisory = provider.requests[2]?.messages.at(-1)
  assert.equal(thirdRequestAdvisory?.role, "system")
  assert.equal(thirdRequestAdvisory?.content, KDO_H5_R2B_ADVISORY_MESSAGE_CONTENT)

  const eventTypes = session.eventsSnapshot().map((event) => event.type)
  const advisoryIndex = eventTypes.indexOf("model.history.repeat_call_advisory.appended")
  const precedingToolResultIndex = eventTypes.lastIndexOf("model.history.message.appended", advisoryIndex - 1)
  assert.ok(precedingToolResultIndex >= 0)
  assert.ok(advisoryIndex > precedingToolResultIndex)
})

test("R2B disables observation when the hard identical-call limit is one", async () => {
  const provider = new RecordingProvider([
    { assistant: "", finishReason: "tool_calls", toolCalls: [{ id: "call-1", name: "test.echo", input: { value: "same" } }] },
    { assistant: "", finishReason: "tool_calls", toolCalls: [{ id: "call-2", name: "test.echo", input: { value: "same" } }] },
  ])
  const { loop, session } = harness(provider, [echoTool])
  const result = await loop.run({
    provider: provider.name,
    model: "fixture/model",
    messages: [{ role: "user", content: "repeat" }],
    limits: { maxIdenticalToolCalls: 1 },
  })
  assert.equal(result.reason, "duplicate_tool_call")
  assert.equal(session.eventsSnapshot().some((event) => event.type === "model.history.repeat_call_advisory.appended"), false)
})

test("R2B suppresses a stale advisory when a later call in the same provider batch resets the chain", async () => {
  const provider = new RecordingProvider([
    {
      assistant: "",
      finishReason: "tool_calls",
      toolCalls: [
        { id: "call-a1", name: "test.echo", input: { value: "same" } },
        { id: "call-a2", name: "test.echo", input: { value: "same" } },
        { id: "call-b", name: "test.other", input: { value: "different" } },
      ],
    },
    { assistant: "done", finishReason: "stop", toolCalls: [] },
  ])
  const { loop, session } = harness(provider, [echoTool, otherTool])
  const result = await loop.run({
    provider: provider.name,
    model: "fixture/model",
    messages: [{ role: "user", content: "batch" }],
    limits: { maxIdenticalToolCalls: 3 },
  })
  assert.equal(result.status, "completed")
  assert.equal(session.eventsSnapshot().some((event) => event.type === "model.history.repeat_call_advisory.appended"), false)
})

test("R2B retains only one advisory for the final still-active chain in a multi-call batch", async () => {
  const provider = new RecordingProvider([
    {
      assistant: "",
      finishReason: "tool_calls",
      toolCalls: [
        { id: "call-a1", name: "test.echo", input: { value: "same" } },
        { id: "call-a2", name: "test.echo", input: { value: "same" } },
        { id: "call-a3", name: "test.echo", input: { value: "same" } },
      ],
    },
    { assistant: "done", finishReason: "stop", toolCalls: [] },
  ])
  const { loop, session } = harness(provider, [echoTool])
  const result = await loop.run({
    provider: provider.name,
    model: "fixture/model",
    messages: [{ role: "user", content: "batch" }],
    limits: { maxIdenticalToolCalls: 4 },
  })
  assert.equal(result.status, "completed")
  assert.equal(
    session.eventsSnapshot().filter((event) => event.type === "model.history.repeat_call_advisory.appended").length,
    1,
  )
})

test("R2B resets repeat state across a failed different-tool turn", async () => {
  let otherCalls = 0
  const failingOther: RuntimeTool<{ value: string }, never> = {
    name: "test.other",
    capability: "test.other",
    async execute() {
      otherCalls += 1
      throw new Error("fixture failure")
    },
  }
  const provider = new RecordingProvider([
    { assistant: "", finishReason: "tool_calls", toolCalls: [{ id: "a1", name: "test.echo", input: { value: "same" } }] },
    { assistant: "", finishReason: "tool_calls", toolCalls: [{ id: "b1", name: "test.other", input: { value: "fail" } }] },
    { assistant: "", finishReason: "tool_calls", toolCalls: [{ id: "a2", name: "test.echo", input: { value: "same" } }] },
    { assistant: "done", finishReason: "stop", toolCalls: [] },
  ])
  const { loop, session } = harness(provider, [echoTool, failingOther])
  const result = await loop.run({
    provider: provider.name,
    model: "fixture/model",
    messages: [{ role: "user", content: "recover" }],
    limits: { maxIdenticalToolCalls: 3, maxFailures: 2 },
  })
  assert.equal(result.status, "completed")
  assert.equal(otherCalls, 1)
  assert.equal(session.eventsSnapshot().some((event) => event.type === "model.history.repeat_call_advisory.appended"), false)
})

test("R2B advisory sink failure aborts before a later provider request and never journals the advisory", async () => {
  class RejectAdvisorySink implements EventSink {
    readonly events: KodacEvent[] = []

    append(event: KodacEvent): void {
      if (event.type === "model.history.repeat_call_advisory.appended") throw new Error("advisory sink rejected")
      this.events.push(event)
    }
  }

  const provider = new RecordingProvider([
    { assistant: "", finishReason: "tool_calls", toolCalls: [{ id: "call-1", name: "test.echo", input: { value: "same" } }] },
    { assistant: "", finishReason: "tool_calls", toolCalls: [{ id: "call-2", name: "test.echo", input: { value: "same" } }] },
    { assistant: "should not run", finishReason: "stop", toolCalls: [] },
  ])
  const sink = new RejectAdvisorySink()
  const { loop, session } = harness(provider, [echoTool], sink)
  await assert.rejects(
    () => loop.run({ provider: provider.name, model: "fixture/model", messages: [{ role: "user", content: "repeat" }] }),
    /advisory sink rejected/,
  )
  assert.equal(provider.requests.length, 2)
  assert.equal(session.eventsSnapshot().some((event) => event.type === "model.history.repeat_call_advisory.appended"), false)
  assert.equal(sink.events.some((event) => event.type === "model.history.repeat_call_advisory.appended"), false)
})