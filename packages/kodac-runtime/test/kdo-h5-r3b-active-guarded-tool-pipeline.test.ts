import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import test from "node:test"

import { BoundedAgentLoop } from "../src/agent/loop.ts"
import {
  KDO_H5_R3A_DECISION_VERSION,
  KDO_H5_R3A_LIMITS,
  KDO_H5_R3A_PIPELINE_VERSION,
  reduceGuardedToolPipeline,
} from "../src/agent/guarded-tool-pipeline.ts"
import {
  KDO_H5_R3B_CALL_RULE_VERSION,
  KDO_H5_R3B_PLAN_VERSION,
  reduceGuardedToolCallWithPlan,
  reduceGuardedToolExposure,
} from "../src/agent/guarded-tool-plan.ts"
import {
  AgentTurnRunner,
  GuardedToolCallBlockedError,
  KDO_H5_R3B_EXECUTION_OBSERVATION_VERSION,
  KDO_H5_R3B_GUARD_EVIDENCE_VERSION,
} from "../src/model/turn.ts"
import type { ModelProvider, ModelProviderRequest, ModelProviderResponse } from "../src/model/provider.ts"
import { ProviderRegistry } from "../src/model/provider.ts"
import { RuntimeOrchestrator } from "../src/runtime/orchestrator.ts"
import { InMemoryEventSink, type EventSink, type KodacEvent } from "../src/protocol/event.ts"
import { KDO_H5_R2B_ADVISORY_MESSAGE_CONTENT } from "../src/session/model-visible-history.ts"
import { RuntimeSession } from "../src/session/session.ts"
import { ToolRegistry, type RuntimeTool } from "../src/tools/registry.ts"

const source = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8")

function gitBlobSha1(text: string): string {
  const canonical = text.replace(/\r\n/g, "\n")
  const body = Buffer.from(canonical, "utf8")
  return createHash("sha1").update(`blob ${body.byteLength}\0`).update(body).digest("hex")
}

function semanticJson(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value)) as unknown
}

function decision(kind: string, id: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    version: KDO_H5_R3A_DECISION_VERSION,
    decisionId: id,
    stageId: `stage-${id}`,
    code: `code-${id}`,
    kind,
    ...extra,
  }
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

function callRule(
  ruleId: string,
  toolName: string,
  capability: string,
  decisions: Array<Record<string, unknown>>,
): Record<string, unknown> {
  return { version: KDO_H5_R3B_CALL_RULE_VERSION, ruleId, toolName, capability, decisions }
}

function registeredPairs(tools: Array<{ name: string; capability: string }>): string {
  return JSON.stringify(tools)
}

class RecordingProvider implements ModelProvider {
  readonly name = "r3b-recording"
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
    if (!response) throw new Error("No scripted R3B response")
    return response
  }
}

function harness(
  provider: ModelProvider,
  tools: RuntimeTool[],
  sink: EventSink = new InMemoryEventSink(),
): { runner: AgentTurnRunner; loop: BoundedAgentLoop; session: RuntimeSession } {
  const session = new RuntimeSession(sink, "session-r3b-test")
  const registry = new ToolRegistry()
  for (const tool of tools) registry.register(tool)
  const orchestrator = new RuntimeOrchestrator(registry, session)
  const providers = new ProviderRegistry()
  providers.register(provider)
  const runner = new AgentTurnRunner(providers, registry, orchestrator, session)
  return { runner, loop: new BoundedAgentLoop(runner, session), session }
}

function recordingTool(
  name: string,
  capability: string,
  observed: unknown[],
): RuntimeTool<Record<string, unknown>, Record<string, unknown>> {
  return {
    name,
    capability,
    async execute(input) {
      observed.push(input)
      return { observed: input }
    },
  }
}

test("R3B plan boundary is strict deterministic pure and reuses unchanged R3A vectors", () => {
  const tools = registeredPairs([
    { name: "repo.read", capability: "workspace.read" },
    { name: "shell", capability: "process.exec" },
  ])
  const plan = guardPlan({
    toolDecisions: [decision("remove_tool", "remove-shell", { toolName: "shell", capability: "process.exec" })],
    callRules: [callRule("read-rule", "repo.read", "workspace.read", [
      decision("replace_input", "rewrite-read", { input: { a: 1, b: 3 } }),
    ])],
  })
  const exposureA = reduceGuardedToolExposure(plan, tools)
  const exposureB = reduceGuardedToolExposure(plan, tools)
  assert.equal(exposureA.planIdentity, exposureB.planIdentity)
  assert.deepEqual(exposureA.effectiveTools, [{ name: "repo.read", capability: "workspace.read" }])

  const reduced = reduceGuardedToolCallWithPlan(
    plan,
    tools,
    JSON.stringify({ toolName: "repo.read", capability: "workspace.read", input: { a: 1, b: 2 } }),
  )
  assert.equal(reduced.planIdentity, exposureA.planIdentity)
  assert.equal(reduced.pipeline.inputChanged, true)
  assert.equal(reduced.pipeline.requiresK2Reevaluation, true)
  assert.deepEqual(semanticJson(reduced.pipeline.effectiveCall.input), { a: 1, b: 3 })

  const r3a = reduceGuardedToolPipeline(JSON.stringify({
    version: KDO_H5_R3A_PIPELINE_VERSION,
    tools: [
      { name: "repo.read", capability: "workspace.read" },
      { name: "shell", capability: "process.exec" },
    ],
    call: { toolName: "repo.read", capability: "workspace.read", input: { b: 2, a: 1 } },
    decisions: [
      decision("remove_tool", "d1", { toolName: "shell", capability: "process.exec" }),
      decision("replace_input", "d2", { input: { a: 1, b: 3 } }),
    ],
  }))
  assert.equal(r3a.baseToolSetIdentity, "1c32e41e2b831e41178154430382dd762b14632e04dc82a3632448675d2fc387")
  assert.equal(r3a.resultIdentity, "ac5f1b538ef8de99558d7ca1d0b31228d6b78e293978ad4a87e5a46bed90b09b")
  assert.equal(gitBlobSha1(source("../src/agent/guarded-tool-pipeline.ts")), "876656bf65a67df56c4cd5f078629cde06112af1")
})

test("R3B serialized plan/exposure/call boundaries reject hostile objects without executing traps", () => {
  let traps = 0
  const proxied = new Proxy({ value: guardPlan() }, {
    get(target, property, receiver) { traps += 1; return Reflect.get(target, property, receiver) },
    ownKeys(target) { traps += 1; return Reflect.ownKeys(target) },
    getPrototypeOf(target) { traps += 1; return Reflect.getPrototypeOf(target) },
  })
  assert.throws(() => reduceGuardedToolExposure(proxied as never, "[]"), /primitive JSON string/)
  assert.equal(traps, 0)
  assert.throws(() => reduceGuardedToolExposure(guardPlan(), proxied as never), /primitive JSON string/)
  assert.equal(traps, 0)
  assert.throws(() => reduceGuardedToolCallWithPlan(guardPlan(), "[]", proxied as never), /primitive JSON string/)
  assert.equal(traps, 0)

  assert.throws(
    () => reduceGuardedToolExposure(`{"version":"${KDO_H5_R3B_PLAN_VERSION}","version":"${KDO_H5_R3B_PLAN_VERSION}","toolDecisions":[],"callRules":[]}`, "[]"),
    /duplicate key/,
  )
  assert.throws(() => reduceGuardedToolExposure(JSON.stringify({ ...JSON.parse(guardPlan()), extra: true }), "[]"), /must contain exactly/)
  assert.throws(() => reduceGuardedToolExposure(guardPlan({ toolDecisions: [decision("block_call", "bad")] }), "[]"), /only observe\/remove_tool/)
  assert.throws(() => reduceGuardedToolExposure(guardPlan({ callRules: [callRule("bad", "x", "c", [decision("remove_tool", "bad-remove", { toolName: "x", capability: "c" })])] }), registeredPairs([{ name: "x", capability: "c" }])), /may not contain remove_tool/)
})

test("R3B call-rule preflight rejects combined pipelines that exceed canonical R3A limits", () => {
  const tools = registeredPairs([{ name: "test.alpha", capability: "test.alpha" }])
  const globals = Array.from({ length: KDO_H5_R3A_LIMITS.maxDecisions }, (_, index) => decision("observe", `global-${index}`))
  const plan = guardPlan({
    toolDecisions: globals,
    callRules: [callRule("overflow", "test.alpha", "test.alpha", [decision("observe", "rule-extra")])],
  })
  assert.throws(() => reduceGuardedToolExposure(plan, tools), /decisions.*128|at most 128/i)
})

test("R3B call-rule replacement input inherits R3A item bounds during exposure preflight", () => {
  const tools = registeredPairs([{ name: "test.alpha", capability: "test.alpha" }])
  const oversized = Array.from({ length: KDO_H5_R3A_LIMITS.maxInputItems + 1 }, () => 0)
  const plan = guardPlan({
    callRules: [callRule("oversized-input", "test.alpha", "test.alpha", [
      decision("replace_input", "replace-oversized", { input: oversized }),
    ])],
  })
  assert.throws(() => reduceGuardedToolExposure(plan, tools), /input items|8192|exceeds/i)
})

test("R3B invalid call-rule preflight fails before request snapshot and provider invocation", async () => {
  const observed: unknown[] = []
  const provider = new RecordingProvider([{ assistant: "never", finishReason: "stop", toolCalls: [] }])
  const { runner, session } = harness(provider, [recordingTool("test.alpha", "test.alpha", observed)])
  const globals = Array.from({ length: KDO_H5_R3A_LIMITS.maxDecisions }, (_, index) => decision("observe", `global-${index}`))
  const plan = guardPlan({
    toolDecisions: globals,
    callRules: [callRule("overflow", "test.alpha", "test.alpha", [decision("observe", "rule-extra")])],
  })
  await assert.rejects(() => runner.run({
    provider: provider.name,
    model: "fixture/model",
    messages: [{ role: "user", content: "hi" }],
    guardPlanJson: plan,
  }), /decisions.*128|at most 128/i)
  assert.equal(provider.requests.length, 0)
  assert.equal(session.eventsSnapshot().some((event) => event.type === "model.request.snapshot"), false)
  assert.deepEqual(session.eventsSnapshot().find((event) => event.type === "model.failed")?.payload, {
    provider: provider.name,
    stage: "tool_guard_plan",
    error: "guard plan rejected",
  })
})

test("R3B tool exposure is a strict H2-backed provider subset with registry descriptors preserved", async () => {
  const observedA: unknown[] = []
  const observedB: unknown[] = []
  const alpha = recordingTool("test.alpha", "test.alpha", observedA)
  const beta = recordingTool("test.beta", "test.beta", observedB)
  const provider = new RecordingProvider([{ assistant: "done", finishReason: "stop", toolCalls: [] }])
  const { runner, session } = harness(provider, [alpha, beta])
  const plan = guardPlan({ toolDecisions: [decision("remove_tool", "remove-beta", { toolName: "test.beta", capability: "test.beta" })] })

  await runner.run({ provider: provider.name, model: "fixture/model", messages: [{ role: "user", content: "hi" }], guardPlanJson: plan })
  assert.equal(provider.requests.length, 1)
  assert.deepEqual(provider.requests[0]?.tools, [{
    name: "test.alpha",
    capability: "test.alpha",
    description: "Kodac capability test.alpha",
    inputSchema: { type: "object", additionalProperties: true },
  }])
  const snapshotEvent = session.eventsSnapshot().find((event) => event.type === "model.request.snapshot")
  assert.ok(snapshotEvent)
  assert.deepEqual((snapshotEvent.payload as { tools: unknown[] }).tools, provider.requests[0]?.tools)
})

test("R3B rejects stale guard plan before request snapshot and provider invocation", async () => {
  const observed: unknown[] = []
  const provider = new RecordingProvider([{ assistant: "never", finishReason: "stop", toolCalls: [] }])
  const { runner, session } = harness(provider, [recordingTool("test.alpha", "test.alpha", observed)])
  const stale = guardPlan({ callRules: [callRule("stale", "missing", "missing.cap", [])] })
  await assert.rejects(() => runner.run({
    provider: provider.name,
    model: "fixture/model",
    messages: [{ role: "user", content: "hi" }],
    guardPlanJson: stale,
  }), /exact registered tool/)
  assert.equal(provider.requests.length, 0)
  assert.equal(session.eventsSnapshot().some((event) => event.type === "model.request.snapshot"), false)
  const failed = session.eventsSnapshot().find((event) => event.type === "model.failed")
  assert.deepEqual(failed?.payload, { provider: provider.name, stage: "tool_guard_plan", error: "guard plan rejected" })
})

test("R3B provider tool-call accessor cycle and hostile proxy fail before trusted hook or tool execution", async () => {
  for (const mode of ["accessor", "cycle", "proxy"] as const) {
    const observed: unknown[] = []
    let hooks = 0
    let getterCalls = 0
    let toolCall: unknown
    if (mode === "accessor") {
      const candidate: Record<string, unknown> = { name: "test.alpha", input: { value: 1 } }
      Object.defineProperty(candidate, "id", { enumerable: true, get() { getterCalls += 1; return "accessor" } })
      toolCall = candidate
    } else if (mode === "cycle") {
      const cyclic: Record<string, unknown> = { value: 1 }
      cyclic.self = cyclic
      toolCall = { id: "cycle", name: "test.alpha", input: cyclic }
    } else {
      toolCall = new Proxy({ id: "proxy", name: "test.alpha", input: { value: 1 } }, {
        getPrototypeOf() { return Array.prototype },
      })
    }
    const provider: ModelProvider = {
      name: `hostile-${mode}`,
      async generate() {
        return { assistant: "", finishReason: "tool_calls", toolCalls: [toolCall as never] }
      },
    }
    const { runner, session } = harness(provider, [recordingTool("test.alpha", "test.alpha", observed)])
    await assert.rejects(() => runner.run(
      { provider: provider.name, model: "fixture/model", messages: [{ role: "user", content: "run" }] },
      { beforeToolCall() { hooks += 1 } },
    ))
    assert.equal(hooks, 0)
    assert.equal(observed.length, 0)
    assert.equal(session.eventsSnapshot().some((event) => event.type === "tool.started"), false)
    if (mode === "accessor") assert.equal(getterCalls, 0)
  }
})

test("R3B rewrite reaches immutable beforeToolCall and tool execution while provider-original input does not", async () => {
  const observed: unknown[] = []
  const provider = new RecordingProvider([{
    assistant: "",
    finishReason: "tool_calls",
    toolCalls: [{ id: "call-1", name: "test.alpha", input: { secret: "ORIGINAL_SECRET", value: 1 } }],
  }])
  const { runner, session } = harness(provider, [recordingTool("test.alpha", "test.alpha", observed)])
  const plan = guardPlan({ callRules: [callRule("rewrite-alpha", "test.alpha", "test.alpha", [
    decision("replace_input", "rewrite", { input: { value: 9, marker: "EFFECTIVE_ONLY" } }),
  ])] })
  let hookCall: Readonly<{ id: string; name: string; input: unknown }> | undefined
  const result = await runner.run(
    { provider: provider.name, model: "fixture/model", messages: [{ role: "user", content: "run" }], guardPlanJson: plan },
    {
      beforeToolCall(call) {
        hookCall = call
        assert.equal(Object.isFrozen(call), true)
        assert.equal(Object.isFrozen(call.input), true)
        assert.throws(() => { (call as { name: string }).name = "test.other" }, TypeError)
        assert.throws(() => { ((call.input as { value: number }).value = 100) }, TypeError)
        return undefined
      },
    },
  )
  assert.deepEqual(semanticJson(hookCall), { id: "call-1", name: "test.alpha", input: { marker: "EFFECTIVE_ONLY", value: 9 } })
  assert.deepEqual(observed, [{ marker: "EFFECTIVE_ONLY", value: 9 }])
  assert.deepEqual(result.toolCalls, [{ id: "call-1", name: "test.alpha", input: { marker: "EFFECTIVE_ONLY", value: 9 } }])
  assert.equal(JSON.stringify(observed).includes("ORIGINAL_SECRET"), false)
  const guardEvent = session.eventsSnapshot().find((event) => event.type === "tool.guard.evaluated")
  assert.ok(guardEvent)
  assert.equal((guardEvent.payload as { version: string }).version, KDO_H5_R3B_GUARD_EVIDENCE_VERSION)
  assert.equal(JSON.stringify(guardEvent.payload).includes("ORIGINAL_SECRET"), false)
  assert.equal(JSON.stringify(guardEvent.payload).includes("EFFECTIVE_ONLY"), false)
  const observedEvent = session.eventsSnapshot().find((event) => event.type === "tool.guard.execution_observed")
  assert.equal((observedEvent?.payload as { version: string }).version, KDO_H5_R3B_EXECUTION_OBSERVATION_VERSION)
})

test("R3B hardens legacy beforeToolCall mutation even without a guard plan", async () => {
  const observed: unknown[] = []
  const provider = new RecordingProvider([{
    assistant: "",
    finishReason: "tool_calls",
    toolCalls: [{ id: "call-legacy", name: "test.alpha", input: { value: 1 } }],
  }])
  const { runner } = harness(provider, [recordingTool("test.alpha", "test.alpha", observed)])
  await runner.run(
    { provider: provider.name, model: "fixture/model", messages: [{ role: "user", content: "run" }] },
    {
      beforeToolCall(call) {
        try { (call as { name: string }).name = "mutated" } catch {}
        try { (call.input as { value: number }).value = 99 } catch {}
      },
    },
  )
  assert.deepEqual(observed, [{ value: 1 }])
})

test("R3B block and removed-tool hallucination cannot reach trusted hook or tool execution", async () => {
  for (const mode of ["rule-block", "removed"] as const) {
    const observed: unknown[] = []
    const provider = new RecordingProvider([{
      assistant: "",
      finishReason: "tool_calls",
      toolCalls: [{ id: `call-${mode}`, name: "test.alpha", input: { value: 1 } }],
    }])
    const { runner, session } = harness(provider, [recordingTool("test.alpha", "test.alpha", observed)])
    const plan = mode === "rule-block"
      ? guardPlan({ callRules: [callRule("block-alpha", "test.alpha", "test.alpha", [decision("block_call", "block")])] })
      : guardPlan({ toolDecisions: [decision("remove_tool", "remove-alpha", { toolName: "test.alpha", capability: "test.alpha" })] })
    let hooks = 0
    await assert.rejects(
      () => runner.run(
        { provider: provider.name, model: "fixture/model", messages: [{ role: "user", content: "run" }], guardPlanJson: plan },
        { beforeToolCall() { hooks += 1 } },
      ),
      (error: unknown) => error instanceof GuardedToolCallBlockedError && error.code === "guard_blocked",
    )
    assert.equal(hooks, 0)
    assert.equal(observed.length, 0)
    const guardEvent = session.eventsSnapshot().find((event) => event.type === "tool.guard.evaluated")
    assert.equal((guardEvent?.payload as { blocked: boolean }).blocked, true)
    assert.equal(session.eventsSnapshot().some((event) => event.type === "tool.started"), false)
  }
})

test("R3B guard-preflights an entire provider call batch before executing its first tool", async () => {
  const observedA: unknown[] = []
  const observedB: unknown[] = []
  const provider = new RecordingProvider([{
    assistant: "",
    finishReason: "tool_calls",
    toolCalls: [
      { id: "first", name: "test.alpha", input: { value: 1 } },
      { id: "second", name: "test.beta", input: { value: 2 } },
    ],
  }])
  const { runner, session } = harness(provider, [
    recordingTool("test.alpha", "test.alpha", observedA),
    recordingTool("test.beta", "test.beta", observedB),
  ])
  const plan = guardPlan({ callRules: [
    callRule("block-beta", "test.beta", "test.beta", [decision("block_call", "block-beta")]),
  ] })
  await assert.rejects(
    () => runner.run({
      provider: provider.name,
      model: "fixture/model",
      messages: [{ role: "user", content: "run batch" }],
      guardPlanJson: plan,
    }),
    (error: unknown) => error instanceof GuardedToolCallBlockedError && error.code === "guard_blocked",
  )
  assert.equal(observedA.length, 0)
  assert.equal(observedB.length, 0)
  assert.equal(session.eventsSnapshot().some((event) => event.type === "tool.started"), false)
  assert.equal(session.eventsSnapshot().filter((event) => event.type === "tool.guard.evaluated").length, 2)
})

test("R3B unknown provider tool cannot reach hook or orchestrator", async () => {
  const provider = new RecordingProvider([{
    assistant: "",
    finishReason: "tool_calls",
    toolCalls: [{ id: "unknown", name: "test.unknown", input: { value: 1 } }],
  }])
  const { runner, session } = harness(provider, [])
  let hooks = 0
  await assert.rejects(
    () => runner.run(
      { provider: provider.name, model: "fixture/model", messages: [{ role: "user", content: "run" }] },
      { beforeToolCall() { hooks += 1 } },
    ),
    (error: unknown) => error instanceof GuardedToolCallBlockedError && error.code === "unknown_tool",
  )
  assert.equal(hooks, 0)
  assert.equal(session.eventsSnapshot().some((event) => event.type === "tool.started"), false)
})

test("R3B beforeToolCall throw is a monotonic veto before tool execution", async () => {
  const observed: unknown[] = []
  const provider = new RecordingProvider([{
    assistant: "",
    finishReason: "tool_calls",
    toolCalls: [{ id: "call-veto", name: "test.alpha", input: { value: 1 } }],
  }])
  const { runner } = harness(provider, [recordingTool("test.alpha", "test.alpha", observed)])
  await assert.rejects(() => runner.run(
    { provider: provider.name, model: "fixture/model", messages: [{ role: "user", content: "run" }] },
    { beforeToolCall() { throw new Error("trusted host veto") } },
  ), /trusted host veto/)
  assert.equal(observed.length, 0)
})

test("R3B loop hard duplicate guard fingerprints effective rewritten input", async () => {
  const observed: unknown[] = []
  const provider = new RecordingProvider([
    { assistant: "", finishReason: "tool_calls", toolCalls: [{ id: "one", name: "test.alpha", input: { provider: 1 } }] },
    { assistant: "", finishReason: "tool_calls", toolCalls: [{ id: "two", name: "test.alpha", input: { provider: 2 } }] },
  ])
  const { loop } = harness(provider, [recordingTool("test.alpha", "test.alpha", observed)])
  const plan = guardPlan({ callRules: [callRule("rewrite", "test.alpha", "test.alpha", [
    decision("replace_input", "same-effective", { input: { canonical: "same" } }),
  ])] })
  const result = await loop.run({
    provider: provider.name,
    model: "fixture/model",
    messages: [{ role: "user", content: "repeat" }],
    guardPlanJson: plan,
    limits: { maxIdenticalToolCalls: 1 },
  })
  assert.equal(result.reason, "duplicate_tool_call")
  assert.equal(observed.length, 1)
  assert.deepEqual(observed[0], { canonical: "same" })
})

test("R3B R2B repeat advisory is computed from effective rewritten input", async () => {
  const observed: unknown[] = []
  const provider = new RecordingProvider([
    { assistant: "", finishReason: "tool_calls", toolCalls: [{ id: "one", name: "test.alpha", input: { provider: 1 } }] },
    { assistant: "", finishReason: "tool_calls", toolCalls: [{ id: "two", name: "test.alpha", input: { provider: 2 } }] },
    { assistant: "done", finishReason: "stop", toolCalls: [] },
  ])
  const { loop, session } = harness(provider, [recordingTool("test.alpha", "test.alpha", observed)])
  const plan = guardPlan({ callRules: [callRule("rewrite", "test.alpha", "test.alpha", [
    decision("replace_input", "same-effective", { input: { canonical: "same" } }),
  ])] })
  const result = await loop.run({
    provider: provider.name,
    model: "fixture/model",
    messages: [{ role: "user", content: "repeat" }],
    guardPlanJson: plan,
    limits: { maxIdenticalToolCalls: 3 },
  })
  assert.equal(result.status, "completed")
  assert.equal(observed.length, 2)
  assert.equal(session.eventsSnapshot().filter((event) => event.type === "model.history.repeat_call_advisory.appended").length, 1)
  assert.equal(provider.requests[2]?.messages.at(-1)?.content, KDO_H5_R2B_ADVISORY_MESSAGE_CONTENT)
  const assistantHistory = session.eventsSnapshot().filter((event) => event.type === "model.history.message.appended")
    .map((event) => event.payload as { source?: string; message?: { toolCalls?: Array<{ input: unknown }> } })
    .findLast((record) => record.source === "assistant_response" && record.message?.toolCalls?.length)
  assert.deepEqual(semanticJson(assistantHistory?.message?.toolCalls?.[0]?.input), { canonical: "same" })
})

test("R3B post-execution guard evidence failure prevents successful turn completion", async () => {
  class RejectObservedSink implements EventSink {
    readonly events: KodacEvent[] = []
    append(event: KodacEvent): void {
      if (event.type === "tool.guard.execution_observed") throw new Error("guard observation rejected")
      this.events.push(event)
    }
  }
  const observed: unknown[] = []
  const provider = new RecordingProvider([{
    assistant: "",
    finishReason: "tool_calls",
    toolCalls: [{ id: "call-observe", name: "test.alpha", input: { value: 1 } }],
  }])
  const sink = new RejectObservedSink()
  const { runner, session } = harness(provider, [recordingTool("test.alpha", "test.alpha", observed)], sink)
  await assert.rejects(() => runner.run({
    provider: provider.name,
    model: "fixture/model",
    messages: [{ role: "user", content: "run" }],
    guardPlanJson: guardPlan(),
  }), /guard observation rejected/)
  assert.equal(observed.length, 1)
  assert.equal(session.eventsSnapshot().some((event) => event.type === "tool.guard.execution_observed"), false)
})

test("R3B pure plan module has no ambient authority and active protected surfaces stay isolated", () => {
  const planSource = source("../src/agent/guarded-tool-plan.ts")
  const imports = [...planSource.matchAll(/from\s+"([^"]+)"/g)].map((match) => match[1]).sort()
  assert.deepEqual(imports, ["./guarded-tool-pipeline.ts", "node:crypto"])
  assert.doesNotMatch(planSource, /node:(?:fs|child_process|net|http|https|tls)|process\.env|\bfetch\s*\(|RuntimeOrchestrator|ExecutionGateway|DoneGate|session\.emit/)
  assert.equal(gitBlobSha1(source("../src/agent/guarded-tool-pipeline.ts")), "876656bf65a67df56c4cd5f078629cde06112af1")
  assert.equal(gitBlobSha1(source("../src/tools/registry.ts")), "0bdf5cfd02efda7cab0c81976c7735bc7b46081b")
  assert.equal(gitBlobSha1(source("../src/runtime/orchestrator.ts")), "b069da69909b282fdbdc2c62279e0297cbd430e9")
  assert.equal(gitBlobSha1(source("../src/session/model-visible-request.ts")), "0f4c7ef7ef0f4e4e1baa90944c39639c1dfa07a6")
  assert.equal(gitBlobSha1(source("../src/session/model-visible-history.ts")), "06909401c6ddf2880154eb3d5fb1fe646d12d7fb")
  assert.equal(gitBlobSha1(source("../src/trust/policy.ts")), "b4134e430204123bebe053ffc9105f05fca611c9")
  assert.equal(gitBlobSha1(source("../src/execution/gateway.ts")), "ecf9cc9d3eda6a2280a280ed2f9a2e472f397560")
  assert.equal(gitBlobSha1(source("../src/verification/done-gate.ts")), "067e147569fa52cc2b04c5df26fbe20a01e958e9")
})
