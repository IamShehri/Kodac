import assert from "node:assert/strict"
import test from "node:test"
import { BoundedAgentLoop } from "../src/agent/loop.ts"
import type { ModelProvider, ModelProviderRequest, ModelProviderResponse } from "../src/model/provider.ts"
import { ProviderRegistry } from "../src/model/provider.ts"
import { AgentTurnRunner } from "../src/model/turn.ts"
import { InMemoryEventSink, type EventSink, type KodacEvent } from "../src/protocol/event.ts"
import { RuntimeOrchestrator } from "../src/runtime/orchestrator.ts"
import { KDO_H2_R2_LIMITS, projectModelVisibleHistory } from "../src/session/model-visible-history.ts"
import { RuntimeSession } from "../src/session/session.ts"
import { ToolRegistry, type RuntimeTool } from "../src/tools/registry.ts"

class RecordingProvider implements ModelProvider {
  readonly name = "recording"
  readonly requests: ModelProviderRequest[] = []
  private readonly responses: ModelProviderResponse[]

  constructor(responses: ModelProviderResponse[]) {
    this.responses = responses.map((response) => ({ ...response, toolCalls: response.toolCalls.map((call) => ({ ...call })) }))
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
    if (!response) throw new Error("No scripted response")
    return response
  }
}

function harness(provider: ModelProvider, tools: RuntimeTool[] = [], clock: () => number = () => Date.now()): {
  loop: BoundedAgentLoop
  sink: InMemoryEventSink
  session: RuntimeSession
} {
  const sink = new InMemoryEventSink()
  const session = new RuntimeSession(sink, "session-loop-test")
  const registry = new ToolRegistry()
  for (const tool of tools) registry.register(tool)
  const orchestrator = new RuntimeOrchestrator(registry, session)
  const providers = new ProviderRegistry()
  providers.register(provider)
  const runner = new AgentTurnRunner(providers, registry, orchestrator, session)
  return { loop: new BoundedAgentLoop(runner, session, clock), sink, session }
}

const echoTool: RuntimeTool<{ value: string }, { echoed: string }> = {
  name: "test.echo",
  capability: "test.echo",
  async execute(input) {
    return { echoed: input.value }
  },
}

test("feeds event-derived tool history into the next model turn", async () => {
  const provider = new RecordingProvider([
    { assistant: "", finishReason: "tool_calls", toolCalls: [{ id: "call-1", name: "test.echo", input: { value: "verified" } }] },
    { assistant: "done", finishReason: "stop", toolCalls: [] },
  ])
  const { loop, sink } = harness(provider, [echoTool])
  const result = await loop.run({ provider: "recording", model: "fixture/model", messages: [{ role: "user", content: "do it" }] })

  assert.equal(result.status, "completed")
  assert.equal(result.budget.turnsUsed, 2)
  assert.equal(result.budget.toolCallsUsed, 1)
  assert.equal(provider.requests.length, 2)
  const toolMessage = provider.requests[1].messages.at(-1)
  assert.equal(toolMessage?.role, "tool")
  assert.equal(toolMessage?.toolCallId, "call-1")
  assert.equal(toolMessage?.content, "{\"echoed\":\"verified\"}")

  const snapshotIndexes = sink.events
    .map((event, index) => event.type === "model.request.snapshot" ? index : -1)
    .filter((index) => index >= 0)
  assert.equal(snapshotIndexes.length, 2)
  const throughSecondRequest = sink.events.slice(0, (snapshotIndexes[1] ?? -1) + 1)
  const projection = projectModelVisibleHistory(throughSecondRequest)
  assert.deepEqual(projection.messages, provider.requests[1].messages)

  const historySources = sink.events
    .filter((event) => event.type === "model.history.message.appended")
    .map((event) => (event.payload as { source: string }).source)
  assert.deepEqual(historySources.slice(0, 2), ["assistant_response", "tool_result"])
  assert.ok(sink.events.some((event) => event.type === "agent.loop.completed"))
})

test("records anchored recovery history before retrying a provider failure", async () => {
  const requests: ModelProviderRequest[] = []
  let calls = 0
  const provider: ModelProvider = {
    name: "recovering",
    async generate(request) {
      requests.push({ ...request, messages: request.messages.map((message) => ({ ...message })), tools: [...request.tools] })
      calls += 1
      if (calls === 1) throw new Error("temporary failure")
      return { assistant: "recovered", finishReason: "stop", toolCalls: [] }
    },
  }
  const { loop, sink } = harness(provider)
  const result = await loop.run({
    provider: "recovering",
    model: "fixture/model",
    messages: [{ role: "user", content: "recover" }],
    limits: { maxFailures: 2 },
  })

  assert.equal(result.status, "completed")
  assert.equal(requests.length, 2)
  assert.equal(requests[1].messages.at(-1)?.role, "system")
  assert.match(requests[1].messages.at(-1)?.content ?? "", /previous model\/tool turn failed/)
  const recovery = sink.events.find(
    (event) => event.type === "model.history.message.appended" &&
      (event.payload as { source?: string }).source === "recovery_system",
  )
  assert.ok(recovery)

  const secondSnapshotIndex = sink.events
    .map((event, index) => event.type === "model.request.snapshot" ? index : -1)
    .filter((index) => index >= 0)[1]
  assert.notEqual(secondSnapshotIndex, undefined)
  const projection = projectModelVisibleHistory(sink.events.slice(0, (secondSnapshotIndex ?? -1) + 1))
  assert.deepEqual(projection.messages, requests[1].messages)
})

test("history sink failure blocks a later provider invocation and does not enter the session journal", async () => {
  class RejectHistorySink implements EventSink {
    readonly events: KodacEvent[] = []

    append(event: KodacEvent): void {
      if (event.type === "model.history.message.appended") throw new Error("history sink rejected")
      this.events.push(event)
    }
  }

  let calls = 0
  const provider: ModelProvider = {
    name: "one-shot",
    async generate() {
      calls += 1
      return { assistant: "answer", finishReason: "stop", toolCalls: [] }
    },
  }
  const sink = new RejectHistorySink()
  const session = new RuntimeSession(sink, "session-history-failure")
  const registry = new ToolRegistry()
  const orchestrator = new RuntimeOrchestrator(registry, session)
  const providers = new ProviderRegistry()
  providers.register(provider)
  const loop = new BoundedAgentLoop(new AgentTurnRunner(providers, registry, orchestrator, session), session)

  await assert.rejects(
    () => loop.run({ provider: "one-shot", model: "fixture/model", messages: [{ role: "user", content: "x" }] }),
    /history sink rejected/,
  )
  assert.equal(calls, 1)
  assert.equal(session.eventsSnapshot().some((event) => event.type === "model.history.message.appended"), false)
  const priorSequence = session.eventsSnapshot().at(-1)?.sequence ?? 0
  const next = await session.emit("session.failed", { status: "failed", error: "history append rejected" })
  assert.equal(next.sequence, priorSequence + 1)
})

test("aggregate history bounds fail before an unprojectable history event is persisted", async () => {
  let calls = 0
  const provider: ModelProvider = {
    name: "history-bound",
    async generate() {
      calls += 1
      return { assistant: "would exceed the aggregate bound", finishReason: "stop", toolCalls: [] }
    },
  }
  const { loop, sink, session } = harness(provider)
  const messages: ModelProviderRequest["messages"] = Array.from(
    { length: KDO_H2_R2_LIMITS.maxProjectedMessages },
    (_, index) => ({ role: "user", content: `message-${index}` }),
  )

  await assert.rejects(
    () => loop.run({ provider: "history-bound", model: "fixture/model", messages }),
    new RegExp(`projected model history exceeds ${KDO_H2_R2_LIMITS.maxProjectedMessages} messages`),
  )
  assert.equal(calls, 1)
  assert.equal(sink.events.filter((event) => event.type === "model.request.snapshot").length, 1)
  assert.equal(sink.events.some((event) => event.type === "model.history.message.appended"), false)
  assert.equal(session.eventsSnapshot().some((event) => event.type === "model.history.message.appended"), false)
  assert.equal(projectModelVisibleHistory(session.eventsSnapshot()).messages.length, KDO_H2_R2_LIMITS.maxProjectedMessages)
})

test("complete turn message-count overflow is rejected before any history record from that turn is persisted", async () => {
  const provider = new RecordingProvider([
    {
      assistant: "",
      finishReason: "tool_calls",
      toolCalls: [
        { id: "call-a", name: "test.echo", input: { value: "a" } },
        { id: "call-b", name: "test.echo", input: { value: "b" } },
      ],
    },
  ])
  const { loop, sink, session } = harness(provider, [echoTool])
  const messages: ModelProviderRequest["messages"] = Array.from(
    { length: KDO_H2_R2_LIMITS.maxProjectedMessages - 2 },
    (_, index) => ({ role: "user", content: `message-${index}` }),
  )

  await assert.rejects(
    () => loop.run({ provider: "recording", model: "fixture/model", messages }),
    new RegExp(`projected model history exceeds ${KDO_H2_R2_LIMITS.maxProjectedMessages} messages`),
  )
  assert.equal(provider.requests.length, 1)
  assert.equal(sink.events.some((event) => event.type === "model.history.message.appended"), false)
  assert.equal(session.eventsSnapshot().some((event) => event.type === "model.history.message.appended"), false)
  assert.equal(projectModelVisibleHistory(session.eventsSnapshot()).messages.length, messages.length)
})

test("complete turn total-content overflow is rejected before any history record from that turn is persisted", async () => {
  const valueA = "a".repeat(1_500)
  const valueB = "b".repeat(1_500)
  const provider = new RecordingProvider([
    {
      assistant: "",
      finishReason: "tool_calls",
      toolCalls: [
        { id: "call-a", name: "test.echo", input: { value: valueA } },
        { id: "call-b", name: "test.echo", input: { value: valueB } },
      ],
    },
  ])
  const { loop, sink, session } = harness(provider, [echoTool])
  const messageCount = 8
  const reservedHeadroom = 2_000
  const perMessageBytes = Math.floor(
    (KDO_H2_R2_LIMITS.maxTotalMessageContentBytes - reservedHeadroom) / messageCount,
  )
  const messages: ModelProviderRequest["messages"] = Array.from(
    { length: messageCount },
    () => ({ role: "user", content: "x".repeat(perMessageBytes) }),
  )

  await assert.rejects(
    () => loop.run({ provider: "recording", model: "fixture/model", messages }),
    new RegExp(`projected model history content exceeds ${KDO_H2_R2_LIMITS.maxTotalMessageContentBytes} UTF-8 bytes`),
  )
  assert.equal(provider.requests.length, 1)
  assert.equal(sink.events.some((event) => event.type === "model.history.message.appended"), false)
  assert.equal(session.eventsSnapshot().some((event) => event.type === "model.history.message.appended"), false)
  assert.equal(projectModelVisibleHistory(session.eventsSnapshot()).messages.length, messageCount)
})

test("separate loop.run invocations use independent canonical projection windows", async () => {
  const provider = new RecordingProvider([
    { assistant: "first done", finishReason: "stop", toolCalls: [] },
    { assistant: "second done", finishReason: "stop", toolCalls: [] },
  ])
  const { loop, sink } = harness(provider)

  const first = await loop.run({
    provider: "recording",
    model: "fixture/model",
    messages: [{ role: "user", content: "first probe" }],
  })
  const boundary = sink.events.length
  const second = await loop.run({
    provider: "recording",
    model: "fixture/model",
    messages: [{ role: "user", content: "second probe" }],
  })

  assert.equal(first.status, "completed")
  assert.equal(second.status, "completed")
  assert.equal(provider.requests.length, 2)
  assert.deepEqual(provider.requests[0].messages, [{ role: "user", content: "first probe" }])
  assert.deepEqual(provider.requests[1].messages, [{ role: "user", content: "second probe" }])

  const secondWindow = sink.events.slice(boundary)
  const projection = projectModelVisibleHistory(secondWindow)
  assert.equal(projection.messages[0]?.content, "second probe")
  assert.equal(projection.messages.at(-1)?.content, "second done")
})

test("RuntimeSession serializes concurrent sink appends before assigning sequence", async () => {
  let appendCalls = 0
  let signalFirstStarted!: () => void
  let releaseFirst!: () => void
  const firstStarted = new Promise<void>((resolve) => { signalFirstStarted = resolve })
  const firstGate = new Promise<void>((resolve) => { releaseFirst = resolve })

  class DelayedSink implements EventSink {
    readonly events: KodacEvent[] = []

    async append(event: KodacEvent): Promise<void> {
      appendCalls += 1
      if (appendCalls === 1) {
        signalFirstStarted()
        await firstGate
      }
      this.events.push(event)
    }
  }

  const sink = new DelayedSink()
  const session = new RuntimeSession(sink, "session-concurrent-emits")
  const first = session.emit("agent.turn.started", { turn: 1 })
  await firstStarted
  const second = session.emit("agent.turn.completed", { turn: 1 })
  await Promise.resolve()

  assert.equal(appendCalls, 1)
  assert.equal(sink.events.length, 0)
  releaseFirst()

  const [firstEvent, secondEvent] = await Promise.all([first, second])
  assert.deepEqual([firstEvent.sequence, secondEvent.sequence], [1, 2])
  assert.deepEqual(sink.events.map((event) => event.sequence), [1, 2])
  assert.deepEqual(session.eventsSnapshot().map((event) => event.sequence), [1, 2])
})

test("concurrent loop runs sharing one RuntimeSession are serialized into exclusive projection windows", async () => {
  let calls = 0
  let signalFirstStarted!: () => void
  let releaseFirst!: () => void
  const firstStarted = new Promise<void>((resolve) => { signalFirstStarted = resolve })
  const firstGate = new Promise<void>((resolve) => { releaseFirst = resolve })
  const requests: ModelProviderRequest[] = []

  const provider: ModelProvider = {
    name: "concurrent",
    async generate(request) {
      calls += 1
      requests.push({
        ...request,
        messages: request.messages.map((message) => ({ ...message })),
        tools: [...request.tools],
      })
      if (calls === 1) {
        signalFirstStarted()
        await firstGate
        return { assistant: "first done", finishReason: "stop", toolCalls: [] }
      }
      return { assistant: "second done", finishReason: "stop", toolCalls: [] }
    },
  }

  const sink = new InMemoryEventSink()
  const session = new RuntimeSession(sink, "session-concurrent-loops")
  const registry = new ToolRegistry()
  const orchestrator = new RuntimeOrchestrator(registry, session)
  const providers = new ProviderRegistry()
  providers.register(provider)
  const runner = new AgentTurnRunner(providers, registry, orchestrator, session)
  const firstLoop = new BoundedAgentLoop(runner, session)
  const secondLoop = new BoundedAgentLoop(runner, session)

  const firstRun = firstLoop.run({
    provider: "concurrent",
    model: "fixture/model",
    messages: [{ role: "user", content: "first concurrent run" }],
  })
  await firstStarted
  const secondRun = secondLoop.run({
    provider: "concurrent",
    model: "fixture/model",
    messages: [{ role: "user", content: "second concurrent run" }],
  })
  await Promise.resolve()

  assert.equal(calls, 1)
  releaseFirst()
  const [firstResult, secondResult] = await Promise.all([firstRun, secondRun])

  assert.equal(firstResult.status, "completed")
  assert.equal(secondResult.status, "completed")
  assert.equal(calls, 2)
  assert.deepEqual(requests[0]?.messages, [{ role: "user", content: "first concurrent run" }])
  assert.deepEqual(requests[1]?.messages, [{ role: "user", content: "second concurrent run" }])

  const startIndexes = sink.events
    .map((event, index) => event.type === "agent.loop.started" ? index : -1)
    .filter((index) => index >= 0)
  assert.equal(startIndexes.length, 2)
  const firstCompletedIndex = sink.events.findIndex((event) => event.type === "agent.loop.completed")
  assert.ok(firstCompletedIndex >= 0)
  assert.ok((startIndexes[1] ?? 0) > firstCompletedIndex)
})

test("blocks an identical tool call before a second execution", async () => {
  let executions = 0
  const countingTool: RuntimeTool<{ value: string }, { echoed: string }> = {
    ...echoTool,
    async execute(input) {
      executions += 1
      return { echoed: input.value }
    },
  }
  const provider = new RecordingProvider([
    { assistant: "", finishReason: "tool_calls", toolCalls: [{ id: "call-1", name: "test.echo", input: { value: "same" } }] },
    { assistant: "", finishReason: "tool_calls", toolCalls: [{ id: "call-2", name: "test.echo", input: { value: "same" } }] },
  ])
  const { loop } = harness(provider, [countingTool])
  const result = await loop.run({
    provider: "recording",
    model: "fixture/model",
    messages: [{ role: "user", content: "repeat" }],
    limits: { maxIdenticalToolCalls: 1 },
  })

  assert.equal(result.status, "stopped")
  assert.equal(result.reason, "duplicate_tool_call")
  assert.equal(executions, 1)
  assert.equal(result.budget.toolCallsUsed, 1)
})

test("enforces the total tool-call budget before execution", async () => {
  let executions = 0
  const countingTool: RuntimeTool<{ value: string }, { echoed: string }> = {
    ...echoTool,
    async execute(input) {
      executions += 1
      return { echoed: input.value }
    },
  }
  const provider = new RecordingProvider([
    { assistant: "", finishReason: "tool_calls", toolCalls: [{ id: "call-1", name: "test.echo", input: { value: "a" } }] },
    { assistant: "", finishReason: "tool_calls", toolCalls: [{ id: "call-2", name: "test.echo", input: { value: "b" } }] },
  ])
  const { loop } = harness(provider, [countingTool])
  const result = await loop.run({
    provider: "recording",
    model: "fixture/model",
    messages: [{ role: "user", content: "budget" }],
    limits: { maxToolCalls: 1 },
  })

  assert.equal(result.reason, "max_tool_calls")
  assert.equal(executions, 1)
})

test("stops at max turns when the model keeps requesting tools", async () => {
  const provider = new RecordingProvider([
    { assistant: "", finishReason: "tool_calls", toolCalls: [{ id: "call-1", name: "test.echo", input: { value: "a" } }] },
  ])
  const { loop } = harness(provider, [echoTool])
  const result = await loop.run({
    provider: "recording",
    model: "fixture/model",
    messages: [{ role: "user", content: "one turn" }],
    limits: { maxTurns: 1 },
  })
  assert.equal(result.reason, "max_turns")
  assert.equal(result.budget.turnsUsed, 1)
})

test("counts provider failures and stops at the failure budget", async () => {
  const provider: ModelProvider = {
    name: "failing",
    async generate() {
      throw new Error("unavailable")
    },
  }
  const { loop } = harness(provider)
  const result = await loop.run({
    provider: "failing",
    model: "fixture/model",
    messages: [{ role: "user", content: "x" }],
    limits: { maxFailures: 1 },
  })
  assert.equal(result.reason, "max_failures")
  assert.equal(result.budget.failuresUsed, 1)
})

test("honors a pre-aborted signal without calling the provider", async () => {
  let calls = 0
  const provider: ModelProvider = {
    name: "abortable",
    async generate() {
      calls += 1
      return { assistant: "unexpected", finishReason: "stop", toolCalls: [] }
    },
  }
  const controller = new AbortController()
  controller.abort(new Error("cancelled"))
  const { loop } = harness(provider)
  const result = await loop.run({
    provider: "abortable",
    model: "fixture/model",
    messages: [{ role: "user", content: "x" }],
    signal: controller.signal,
  })
  assert.equal(result.reason, "aborted")
  assert.equal(calls, 0)
})

test("enforces max elapsed time before starting a model turn", async () => {
  let calls = 0
  const provider: ModelProvider = {
    name: "clocked",
    async generate() {
      calls += 1
      return { assistant: "unexpected", finishReason: "stop", toolCalls: [] }
    },
  }
  let now = 0
  const { loop } = harness(provider, [], () => {
    now += 10
    return now
  })
  const result = await loop.run({
    provider: "clocked",
    model: "fixture/model",
    messages: [{ role: "user", content: "x" }],
    limits: { maxElapsedMs: 5 },
  })
  assert.equal(result.reason, "max_elapsed")
  assert.equal(calls, 0)
})

test("propagates the bounded abort signal into tool context", async () => {
  let signalSeen = false
  const signalTool: RuntimeTool<{ value: string }, { echoed: string }> = {
    ...echoTool,
    async execute(input, context) {
      signalSeen = context.signal instanceof AbortSignal
      return { echoed: input.value }
    },
  }
  const provider = new RecordingProvider([
    { assistant: "", finishReason: "tool_calls", toolCalls: [{ id: "call-1", name: "test.echo", input: { value: "signal" } }] },
    { assistant: "done", finishReason: "stop", toolCalls: [] },
  ])
  const { loop } = harness(provider, [signalTool])
  const result = await loop.run({ provider: "recording", model: "fixture/model", messages: [{ role: "user", content: "x" }] })
  assert.equal(result.status, "completed")
  assert.equal(signalSeen, true)
})

test("detects a repeated turn signature even when duplicate-tool threshold is higher", async () => {
  const provider = new RecordingProvider([
    { assistant: "working", finishReason: "tool_calls", toolCalls: [{ id: "call-1", name: "test.echo", input: { value: "same" } }] },
    { assistant: "working", finishReason: "tool_calls", toolCalls: [{ id: "call-2", name: "test.echo", input: { value: "same" } }] },
  ])
  const { loop } = harness(provider, [echoTool])
  const result = await loop.run({
    provider: "recording",
    model: "fixture/model",
    messages: [{ role: "user", content: "cycle" }],
    limits: { maxIdenticalToolCalls: 10, maxRepeatedTurnSignatures: 1 },
  })
  assert.equal(result.reason, "cycle_detected")
})