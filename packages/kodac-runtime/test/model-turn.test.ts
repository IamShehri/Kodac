import assert from "node:assert/strict"
import test from "node:test"
import { FixtureModelProvider } from "../src/model/fixture.ts"
import { ProviderRegistry, type ModelProvider } from "../src/model/provider.ts"
import { AgentTurnRunner } from "../src/model/turn.ts"
import { InMemoryEventSink } from "../src/protocol/event.ts"
import { RuntimeOrchestrator } from "../src/runtime/orchestrator.ts"
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

test("runs a deterministic model turn and records model evidence without raw content", async () => {
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
  assert.deepEqual(sink.events.map((event) => event.type), ["model.requested", "model.responded", "assistant.message"])
  assert.equal(JSON.stringify(sink.events).includes("secret prompt"), false)
  assert.equal(JSON.stringify(sink.events).includes("hello"), false)
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
    "model.requested",
    "model.responded",
    "model.tool_call.requested",
    "tool.started",
    "tool.completed",
  ])
})

test("provider failures are recorded and propagated", async () => {
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
  assert.deepEqual(sink.events.map((event) => event.type), ["model.requested", "model.failed"])
})

test("provider registry rejects duplicate provider names", () => {
  const registry = new ProviderRegistry()
  registry.register(new FixtureModelProvider())
  assert.throws(() => registry.register(new FixtureModelProvider()), /Provider already registered/)
})
