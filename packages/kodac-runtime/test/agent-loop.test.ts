import assert from "node:assert/strict"
import test from "node:test"
import { BoundedAgentLoop } from "../src/agent/loop.ts"
import type { ModelProvider, ModelProviderRequest, ModelProviderResponse } from "../src/model/provider.ts"
import { ProviderRegistry } from "../src/model/provider.ts"
import { AgentTurnRunner } from "../src/model/turn.ts"
import { InMemoryEventSink } from "../src/protocol/event.ts"
import { RuntimeOrchestrator } from "../src/runtime/orchestrator.ts"
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
    this.requests.push({ ...request, messages: request.messages.map((message) => ({ ...message })), tools: [...request.tools] })
    const response = this.responses.shift()
    if (!response) throw new Error("No scripted response")
    return response
  }
}

function harness(provider: ModelProvider, tools: RuntimeTool[] = []): {
  loop: BoundedAgentLoop
  sink: InMemoryEventSink
} {
  const sink = new InMemoryEventSink()
  const session = new RuntimeSession(sink, "session-loop-test")
  const registry = new ToolRegistry()
  for (const tool of tools) registry.register(tool)
  const orchestrator = new RuntimeOrchestrator(registry, session)
  const providers = new ProviderRegistry()
  providers.register(provider)
  const runner = new AgentTurnRunner(providers, registry, orchestrator, session)
  return { loop: new BoundedAgentLoop(runner, session), sink }
}

const echoTool: RuntimeTool<{ value: string }, { echoed: string }> = {
  name: "test.echo",
  capability: "test.echo",
  async execute(input) {
    return { echoed: input.value }
  },
}

test("feeds tool results back into the next model turn", async () => {
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
  assert.ok(sink.events.some((event) => event.type === "agent.loop.completed"))
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
