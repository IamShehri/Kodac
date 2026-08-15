import assert from "node:assert/strict"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"

import {
  KDO_H5_R3A_DECISION_VERSION,
  KDO_H5_R3A_LIMITS,
} from "../src/agent/guarded-tool-pipeline.ts"
import {
  KDO_H5_R3B_CALL_RULE_VERSION,
  KDO_H5_R3B_PLAN_LIMITS,
  KDO_H5_R3B_PLAN_VERSION,
  reduceGuardedToolExposure,
} from "../src/agent/guarded-tool-plan.ts"
import { NodeWorkspaceFileSystem } from "../src/edit/filesystem.ts"
import { ExecutionGateway } from "../src/execution/gateway.ts"
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
import { fixedPolicy } from "../src/trust/policy.ts"

function harness(provider: ModelProvider, tool?: RuntimeTool | RuntimeTool[]): {
  runner: AgentTurnRunner
  sink: InMemoryEventSink
} {
  const sink = new InMemoryEventSink()
  const session = new RuntimeSession(sink, "session-model-test")
  const tools = new ToolRegistry()
  for (const candidate of tool === undefined ? [] : Array.isArray(tool) ? tool : [tool]) tools.register(candidate)
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

function guardDecision(kind: string, id: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    version: KDO_H5_R3A_DECISION_VERSION,
    decisionId: id,
    stageId: `stage-${id}`,
    code: `code-${id}`,
    kind,
    ...extra,
  }
}

function guardRule(
  ruleId: string,
  toolName: string,
  capability: string,
  decisions: Array<Record<string, unknown>>,
): Record<string, unknown> {
  return { version: KDO_H5_R3B_CALL_RULE_VERSION, ruleId, toolName, capability, decisions }
}

function guardPlan(input: {
  toolDecisions?: Array<Record<string, unknown>>
  callRules?: Array<Record<string, unknown>>
} = {}): string {
  return JSON.stringify({
    version: KDO_H5_R3B_PLAN_VERSION,
    toolDecisions: input.toolDecisions ?? [],
    callRules: input.callRules ?? [],
  })
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

test("R3B no-plan request exposes every registry descriptor exactly", async () => {
  let visibleTools: unknown[] | undefined
  const provider: ModelProvider = {
    name: "r3b-no-plan-tools",
    async generate(request) {
      visibleTools = request.tools
      return { assistant: "done", finishReason: "stop", toolCalls: [] }
    },
  }
  const alpha: RuntimeTool = {
    name: "test.alpha",
    capability: "cap.alpha",
    model: { description: "Alpha exact", inputSchema: { type: "object", properties: { x: { type: "string" } }, additionalProperties: false } },
    async execute() { return null },
  }
  const beta: RuntimeTool = {
    name: "test.beta",
    capability: "cap.beta",
    async execute() { return null },
  }
  const { runner, sink } = harness(provider, [beta, alpha])
  await runner.run({ provider: provider.name, model: "fixture/model", messages: [{ role: "user", content: "tools" }] })
  const expected = [
    { name: "test.alpha", capability: "cap.alpha", description: "Alpha exact", inputSchema: { type: "object", properties: { x: { type: "string" } }, additionalProperties: false } },
    { name: "test.beta", capability: "cap.beta", description: "Kodac capability cap.beta", inputSchema: { type: "object", additionalProperties: true } },
  ]
  assert.deepEqual(visibleTools, expected)
  const snapshot = sink.events.find((event) => event.type === "model.request.snapshot")
  assert.deepEqual((snapshot?.payload as { tools: unknown[] }).tools, expected)
  assert.equal(sink.events.some((event) => event.type === "tool.guard.evaluated"), false)
})

test("R3B supports an empty effective provider tool surface", async () => {
  let visibleTools: unknown[] | undefined
  const provider: ModelProvider = {
    name: "r3b-empty-tools",
    async generate(request) {
      visibleTools = request.tools
      return { assistant: "done", finishReason: "stop", toolCalls: [] }
    },
  }
  const tool: RuntimeTool = { name: "test.alpha", capability: "cap.alpha", async execute() { return null } }
  const plan = guardPlan({
    toolDecisions: [guardDecision("remove_tool", "remove-alpha", { toolName: "test.alpha", capability: "cap.alpha" })],
  })
  const { runner, sink } = harness(provider, tool)
  await runner.run({ provider: provider.name, model: "fixture/model", messages: [{ role: "user", content: "none" }], guardPlanJson: plan })
  assert.deepEqual(visibleTools, [])
  const snapshot = sink.events.find((event) => event.type === "model.request.snapshot")
  assert.deepEqual((snapshot?.payload as { tools: unknown[] }).tools, [])
})

test("R3B ignores beforeToolCall return values as execution authority", async () => {
  const observed: unknown[] = []
  const tool: RuntimeTool<{ value: number }, null> = {
    name: "test.return-ignore",
    capability: "test.return-ignore",
    async execute(input) { observed.push(input); return null },
  }
  const provider = new FixtureModelProvider([{
    assistant: "",
    finishReason: "tool_calls",
    toolCalls: [{ id: "call-return", name: tool.name, input: { value: 1 } }],
  }])
  const { runner } = harness(provider, tool)
  await runner.run(
    { provider: "fixture", model: "fixture/model", messages: [{ role: "user", content: "run" }] },
    { beforeToolCall() { return { name: "mutated", input: { value: 999 } } as never } },
  )
  assert.deepEqual(observed, [{ value: 1 }])
})

test("R3B plan limit and uniqueness boundaries fail closed at limit plus one", () => {
  const pair = JSON.stringify([{ name: "test.alpha", capability: "cap.alpha" }])
  assert.throws(() => reduceGuardedToolExposure("x".repeat(KDO_H5_R3B_PLAN_LIMITS.maxPlanJsonBytes + 1), pair), /guardPlanJson exceeds/)
  assert.throws(() => reduceGuardedToolExposure(guardPlan({
    toolDecisions: Array.from({ length: KDO_H5_R3B_PLAN_LIMITS.maxToolDecisions + 1 }, (_, index) => guardDecision("observe", `d-${index}`)),
  }), pair), /toolDecisions exceeds/)
  assert.throws(() => reduceGuardedToolExposure(guardPlan({
    callRules: Array.from({ length: KDO_H5_R3B_PLAN_LIMITS.maxCallRules + 1 }, (_, index) => guardRule(`r-${index}`, "test.alpha", "cap.alpha", [])),
  }), pair), /callRules exceeds/)
  assert.throws(() => reduceGuardedToolExposure(guardPlan({
    callRules: [guardRule("rule", "test.alpha", "cap.alpha", Array.from({ length: KDO_H5_R3B_PLAN_LIMITS.maxRuleDecisions + 1 }, (_, index) => guardDecision("observe", `r-d-${index}`)))],
  }), pair), /decisions exceeds/)
  assert.throws(() => reduceGuardedToolExposure(guardPlan({
    callRules: [guardRule("x".repeat(KDO_H5_R3B_PLAN_LIMITS.maxRuleIdBytes + 1), "test.alpha", "cap.alpha", [])],
  }), pair), /ruleId/)
  assert.throws(() => reduceGuardedToolExposure(guardPlan({
    callRules: [guardRule("same", "test.alpha", "cap.alpha", []), guardRule("same", "test.alpha", "cap.alpha", [])],
  }), pair), /duplicate ruleId/)
  assert.throws(() => reduceGuardedToolExposure(guardPlan({
    callRules: [guardRule("one", "test.alpha", "cap.alpha", []), guardRule("two", "test.alpha", "cap.alpha", [])],
  }), pair), /duplicate toolName\/capability pair/)

  const tools = Array.from({ length: 9 }, (_, index) => ({ name: `test.${index}`, capability: `cap.${index}` }))
  const totalOverflow = guardPlan({
    callRules: tools.map((tool, index) => guardRule(`rule-${index}`, tool.name, tool.capability,
      Array.from({ length: 114 }, (_, decisionIndex) => guardDecision("observe", `r${index}-d${decisionIndex}`)))),
  })
  assert.throws(() => reduceGuardedToolExposure(totalOverflow, JSON.stringify(tools)), /total decisions/)
})

test("R3B guard evidence is deterministic bounded and never serves as gateway permission", async () => {
  async function capture() {
    const provider = new FixtureModelProvider([{
      assistant: "",
      finishReason: "tool_calls",
      toolCalls: [{ id: "call-stable", name: "test.stable", input: { value: "provider" } }],
    }])
    const tool: RuntimeTool = { name: "test.stable", capability: "cap.stable", async execute() { return null } }
    const plan = guardPlan({ callRules: [guardRule("stable", tool.name, tool.capability, [
      guardDecision("replace_input", "rewrite-stable", { input: { value: "effective" } }),
    ])] })
    const { runner, sink } = harness(provider, tool)
    await runner.run({ provider: "fixture", model: "fixture/model", messages: [{ role: "user", content: "run" }], guardPlanJson: plan })
    return sink.events.find((event) => event.type === "tool.guard.evaluated")?.payload
  }
  const first = await capture()
  const second = await capture()
  assert.deepEqual(first, second)
  const payload = first as Record<string, unknown>
  assert.deepEqual(Object.keys(payload).sort(), [
    "baseToolSetIdentity", "blockCode", "blocked", "callId", "capability", "effectiveToolSetIdentity",
    "finalCallIdentity", "inputChanged", "originalCallIdentity", "pipelineResultIdentity", "planIdentity",
    "requiresK2Reevaluation", "tool", "version",
  ].sort())
  for (const key of ["baseToolSetIdentity", "effectiveToolSetIdentity", "finalCallIdentity", "originalCallIdentity", "pipelineResultIdentity", "planIdentity"]) {
    assert.match(String(payload[key]), /^[0-9a-f]{64}$/)
  }
  assert.equal(payload.blocked, false)
  assert.equal(JSON.stringify(payload).includes("provider"), false)
  assert.equal(JSON.stringify(payload).includes("effective"), false)
  assert.ok(Buffer.byteLength(JSON.stringify(payload), "utf8") < 2048)
})

test("R3B rewritten bytes alone reach the real ExecutionGateway and policy path", async () => {
  const dir = await mkdtemp(join(tmpdir(), "kodac-r3b-gateway-"))
  try {
    const order: string[] = []
    const gateway = new ExecutionGateway(new NodeWorkspaceFileSystem(dir), fixedPolicy("allow", "r3b fixture allow"))
    const tool: RuntimeTool<{ marker: string }, { stdout: string; policy: string }> = {
      name: "test.gateway",
      capability: "cap.gateway",
      async execute(input) {
        order.push(`tool:${input.marker}`)
        const result = await gateway.runCommand(
          "fixture.r3b-effective",
          process.execPath,
          ["-e", "process.stdout.write(process.argv[1] ?? '')", input.marker],
          {
            onIntent() { order.push("gateway.intent") },
            onPolicy(_intent, policy) { order.push(`gateway.policy:${policy.decision}`) },
          },
        )
        return { stdout: result.stdout, policy: result.receipt.policy.decision }
      },
    }
    const provider = new FixtureModelProvider([{
      assistant: "",
      finishReason: "tool_calls",
      toolCalls: [{ id: "gateway-call", name: tool.name, input: { marker: "ORIGINAL_K2_MARKER" } }],
    }])
    const plan = guardPlan({ callRules: [guardRule("gateway-rule", tool.name, tool.capability, [
      guardDecision("replace_input", "gateway-rewrite", { input: { marker: "EFFECTIVE_K2_MARKER" } }),
    ])] })
    const { runner, sink } = harness(provider, tool)
    const result = await runner.run(
      { provider: "fixture", model: "fixture/model", messages: [{ role: "user", content: "run gateway" }], guardPlanJson: plan },
      { beforeToolCall(call) { order.push(`hook:${(call.input as { marker: string }).marker}`) } },
    )

    assert.deepEqual(order, [
      "hook:EFFECTIVE_K2_MARKER",
      "tool:EFFECTIVE_K2_MARKER",
      "gateway.intent",
      "gateway.policy:allow",
    ])
    assert.equal(JSON.stringify(order).includes("ORIGINAL_K2_MARKER"), false)
    assert.deepEqual(result.toolCalls, [{ id: "gateway-call", name: tool.name, input: { marker: "EFFECTIVE_K2_MARKER" } }])
    assert.deepEqual(result.toolResults, [{ id: "gateway-call", name: tool.name, output: { stdout: "EFFECTIVE_K2_MARKER", policy: "allow" } }])
    const types = sink.events.map((event) => event.type)
    assert.ok(types.indexOf("tool.guard.evaluated") < types.indexOf("tool.started"))
    assert.ok(types.indexOf("tool.started") < types.indexOf("tool.guard.execution_observed"))
    assert.equal(JSON.stringify(sink.events.filter((event) => event.type.startsWith("tool.guard."))).includes("ORIGINAL_K2_MARKER"), false)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test("R3B emits no post-execution guard observation when tool execution fails", async () => {
  const tool: RuntimeTool = {
    name: "test.fail-after-guard",
    capability: "cap.fail-after-guard",
    async execute() { throw new Error("fixture tool failure") },
  }
  const provider = new FixtureModelProvider([{
    assistant: "",
    finishReason: "tool_calls",
    toolCalls: [{ id: "call-fail", name: tool.name, input: { value: 1 } }],
  }])
  const plan = guardPlan({ callRules: [guardRule("observe-failure", tool.name, tool.capability, [guardDecision("observe", "observe")])] })
  const { runner, sink } = harness(provider, tool)
  await assert.rejects(() => runner.run({
    provider: "fixture",
    model: "fixture/model",
    messages: [{ role: "user", content: "run" }],
    guardPlanJson: plan,
  }), /fixture tool failure/)
  assert.equal(sink.events.some((event) => event.type === "tool.guard.evaluated"), true)
  assert.equal(sink.events.some((event) => event.type === "tool.guard.execution_observed"), false)
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
