import assert from "node:assert/strict"
import test from "node:test"
import { FixtureModelProvider } from "../src/model/fixture.ts"
import { ProviderRegistry, type ModelProvider } from "../src/model/provider.ts"
import { AgentTurnRunner } from "../src/model/turn.ts"
import { InMemoryEventSink } from "../src/protocol/event.ts"
import { RuntimeOrchestrator } from "../src/runtime/orchestrator.ts"
import {
  KDO_H2_R1_LIMITS,
  createModelVisibleRequestSnapshot,
  materializeModelVisibleRequest,
} from "../src/session/model-visible-request.ts"
import { RuntimeSession } from "../src/session/session.ts"
import { ToolRegistry, type RuntimeTool } from "../src/tools/registry.ts"

function harness(provider: ModelProvider, tool?: RuntimeTool): {
  runner: AgentTurnRunner
  sink: InMemoryEventSink
} {
  const sink = new InMemoryEventSink()
  const session = new RuntimeSession(sink, "session-model-test")
  const tools = new ToolRegistry()
  if (tool) tools.register(tool)
  const orchestrator = new RuntimeOrchestrator(tools, session)
  const providers = new ProviderRegistry()
  providers.register(provider)
  return { runner: new AgentTurnRunner(providers, tools, orchestrator, session), sink }
}

function withProtoMember(value: unknown): Record<string, unknown> {
  const record: Record<string, unknown> = {}
  Object.defineProperty(record, "__proto__", {
    value,
    enumerable: true,
    writable: true,
    configurable: true,
  })
  return record
}

test("runs a deterministic model turn with reconstructable request evidence and coarse response evidence", async () => {
  const { runner, sink } = harness(
    new FixtureModelProvider([{ assistant: "hello", toolCalls: [], finishReason: "stop" }]),
  )
  const result = await runner.run({
    provider: "fixture",
    model: "fixture/model",
    messages: [{ role: "user", content: "secret prompt" }],
  })

  assert.equal(result.assistant, "hello")
  assert.deepEqual(result.toolResults, [])
  assert.deepEqual(sink.events.map((event) => event.type), [
    "model.request.snapshot",
    "model.requested",
    "model.responded",
    "assistant.message",
  ])
  const snapshot = sink.events[0]
  assert.equal(snapshot?.type, "model.request.snapshot")
  assert.deepEqual((snapshot?.payload as { messages: unknown }).messages, [{ role: "user", content: "secret prompt" }])
  const coarseEvents = sink.events.slice(1)
  assert.equal(JSON.stringify(coarseEvents).includes("secret prompt"), false)
  assert.equal(JSON.stringify(coarseEvents).includes("hello"), false)
})

test("snapshot construction rejection records coarse failure evidence and never invokes provider", async () => {
  let providerCalls = 0
  const provider: ModelProvider = {
    name: "bounded-fixture",
    async generate() {
      providerCalls += 1
      return { assistant: "unexpected", toolCalls: [], finishReason: "stop" }
    },
  }
  const { runner, sink } = harness(provider)
  const secretMarker = "private-validation-prompt"
  const content = `${secretMarker}${"x".repeat(KDO_H2_R1_LIMITS.maxMessageContentBytes + 1)}`

  await assert.rejects(
    runner.run({ provider: provider.name, model: "fixture/model", messages: [{ role: "user", content }] }),
    /content/,
  )

  assert.equal(providerCalls, 0)
  assert.deepEqual(sink.events.map((event) => event.type), ["model.failed"])
  assert.deepEqual(sink.events[0]?.payload, {
    provider: provider.name,
    stage: "request_snapshot",
    error: "model-visible request snapshot rejected",
  })
  assert.equal(JSON.stringify(sink.events).includes(secretMarker), false)
  assert.equal(JSON.stringify(sink.events).includes("exceeds"), false)
})

test("preserves own __proto__ JSON members through snapshot and provider materialization", () => {
  for (const value of ["primitive", null, { nested: true }]) {
    const input = withProtoMember(value)
    const schema = withProtoMember(value)
    const snapshot = createModelVisibleRequestSnapshot({
      provider: "fixture",
      model: "fixture/model",
      messages: [{
        role: "assistant",
        content: "",
        toolCalls: [{ id: "call-1", name: "test.tool", input }],
      }],
      tools: [{
        name: "test.tool",
        capability: "test.tool",
        description: "test",
        inputSchema: schema,
      }],
    })

    const snapshotInput = snapshot.messages[0]?.toolCalls?.[0]?.input as Record<string, unknown>
    const snapshotSchema = snapshot.tools[0]?.inputSchema as Record<string, unknown>
    assert.equal(Object.prototype.hasOwnProperty.call(snapshotInput, "__proto__"), true)
    assert.equal(Object.prototype.hasOwnProperty.call(snapshotSchema, "__proto__"), true)
    assert.deepEqual(Object.getOwnPropertyDescriptor(snapshotInput, "__proto__")?.value, value)
    assert.deepEqual(Object.getOwnPropertyDescriptor(snapshotSchema, "__proto__")?.value, value)

    const materialized = materializeModelVisibleRequest(snapshot)
    const materializedInput = materialized.messages[0]?.toolCalls?.[0]?.input as Record<string, unknown>
    const materializedSchema = materialized.tools[0]?.inputSchema as Record<string, unknown>
    assert.equal(Object.prototype.hasOwnProperty.call(materializedInput, "__proto__"), true)
    assert.equal(Object.prototype.hasOwnProperty.call(materializedSchema, "__proto__"), true)
    assert.deepEqual(Object.getOwnPropertyDescriptor(materializedInput, "__proto__")?.value, value)
    assert.deepEqual(Object.getOwnPropertyDescriptor(materializedSchema, "__proto__")?.value, value)
    assert.equal(Object.getPrototypeOf(materializedInput), Object.prototype)
    assert.equal(Object.getPrototypeOf(materializedSchema), Object.prototype)
  }
})

test("routes provider tool calls through the canonical RuntimeOrchestrator", async () => {
  let executions = 0
  const echoTool: RuntimeTool<{ value: string }, { echoed: string }> = {
    name: "test.echo",
    capability: "test.echo",
    async execute(input) {
      executions += 1
      return { echoed: input.value }
    },
  }
  const { runner, sink } = harness(
    new FixtureModelProvider([
      {
        assistant: "",
        finishReason: "tool_calls",
        toolCalls: [{ id: "call-1", name: "test.echo", input: { value: "verified" } }],
      },
    ]),
    echoTool,
  )

  const result = await runner.run({
    provider: "fixture",
    model: "fixture/model",
    messages: [{ role: "user", content: "invoke tool" }],
  })

  assert.equal(executions, 1)
  assert.deepEqual(result.toolResults, [{ id: "call-1", name: "test.echo", output: { echoed: "verified" } }])
  assert.deepEqual(sink.events.map((event) => event.type), [
    "model.request.snapshot",
    "model.requested",
    "model.responded",
    "model.tool_call.requested",
    "tool.started",
    "tool.completed",
  ])
})

test("provider failures are recorded and propagated after request snapshot evidence", async () => {
  const failing: ModelProvider = {
    name: "failing",
    async generate() {
      throw new Error("provider unavailable")
    },
  }
  const { runner, sink } = harness(failing)
  await assert.rejects(
    runner.run({ provider: "failing", model: "fixture/model", messages: [{ role: "user", content: "x" }] }),
    /provider unavailable/,
  )
  assert.deepEqual(sink.events.map((event) => event.type), ["model.request.snapshot", "model.requested", "model.failed"])
})

test("provider registry rejects duplicate provider names", () => {
  const registry = new ProviderRegistry()
  registry.register(new FixtureModelProvider())
  assert.throws(() => registry.register(new FixtureModelProvider()), /Provider already registered/)
})
