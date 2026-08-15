import assert from "node:assert/strict"
import test from "node:test"

import { BoundedAgentLoop } from "../src/agent/loop.ts"
import {
  KDO_H5_R3A_DECISION_VERSION,
} from "../src/agent/guarded-tool-pipeline.ts"
import {
  KDO_H5_R3B_CALL_RULE_VERSION,
  KDO_H5_R3B_PLAN_VERSION,
} from "../src/agent/guarded-tool-plan.ts"
import type {
  ModelProvider,
  ModelProviderRequest,
  ModelProviderResponse,
  ModelProviderStreamEvent,
} from "../src/model/provider.ts"
import { ProviderRegistry } from "../src/model/provider.ts"
import { AgentTurnRunner } from "../src/model/turn.ts"
import {
  InMemoryEventSink,
  type EventSink,
  type KodacEvent,
} from "../src/protocol/event.ts"
import { RuntimeOrchestrator } from "../src/runtime/orchestrator.ts"
import { projectAgentStep } from "../src/session/agent-step.ts"
import { RuntimeSession } from "../src/session/session.ts"
import { ToolRegistry, type RuntimeTool } from "../src/tools/registry.ts"

type TerminalType = "agent.turn.completed" | "agent.turn.failed" | "agent.turn.stopped"

class ScriptedProvider implements ModelProvider {
  readonly name: string
  readonly requests: ModelProviderRequest[] = []
  private readonly script: Array<ModelProviderResponse | Error | ((request: ModelProviderRequest) => Promise<ModelProviderResponse>)>

  constructor(
    script: Array<ModelProviderResponse | Error | ((request: ModelProviderRequest) => Promise<ModelProviderResponse>)>,
    name = "r4b-scripted",
  ) {
    this.name = name
    this.script = [...script]
  }

  async generate(request: ModelProviderRequest): Promise<ModelProviderResponse> {
    this.requests.push(request)
    const next = this.script.shift()
    if (next === undefined) throw new Error("No scripted R4B provider response")
    if (next instanceof Error) throw next
    if (typeof next === "function") return next(request)
    return next
  }
}

class RejectingSink implements EventSink {
  readonly events: KodacEvent[] = []
  readonly attempts: string[] = []
  private readonly reject: (event: KodacEvent) => boolean

  constructor(reject: (event: KodacEvent) => boolean) {
    this.reject = reject
  }

  append(event: KodacEvent): void {
    this.attempts.push(event.type)
    if (this.reject(event)) throw new Error(`sink rejected ${event.type}`)
    this.events.push(event)
  }
}

function recordingTool(
  observed: unknown[],
  options: {
    name?: string
    capability?: string
    execute?: (input: unknown) => Promise<unknown> | unknown
  } = {},
): RuntimeTool {
  const name = options.name ?? "test.echo"
  const capability = options.capability ?? name
  return {
    name,
    capability,
    async execute(input) {
      observed.push(input)
      if (options.execute !== undefined) return options.execute(input)
      return { echoed: input }
    },
  }
}

function harness(input: {
  provider: ModelProvider
  tools?: RuntimeTool[]
  sink?: EventSink
  clock?: () => number
}): {
  runner: AgentTurnRunner
  loop: BoundedAgentLoop
  session: RuntimeSession
} {
  const sink = input.sink ?? new InMemoryEventSink()
  const session = new RuntimeSession(sink, "session-r4b-test")
  const tools = new ToolRegistry()
  for (const tool of input.tools ?? []) tools.register(tool)
  const orchestrator = new RuntimeOrchestrator(tools, session)
  const providers = new ProviderRegistry()
  providers.register(input.provider)
  const runner = new AgentTurnRunner(providers, tools, orchestrator, session)
  return {
    runner,
    loop: new BoundedAgentLoop(runner, session, input.clock),
    session,
  }
}

function responseStop(assistant = "done"): ModelProviderResponse {
  return { assistant, finishReason: "stop", toolCalls: [] }
}

function responseTool(id: string, input: unknown, name = "test.echo"): ModelProviderResponse {
  return {
    assistant: "",
    finishReason: "tool_calls",
    toolCalls: [{ id, name, input }],
  }
}

function responseTools(calls: Array<{ id: string; name?: string; input: unknown }>): ModelProviderResponse {
  return {
    assistant: "",
    finishReason: "tool_calls",
    toolCalls: calls.map((call) => ({ id: call.id, name: call.name ?? "test.echo", input: call.input })),
  }
}

function terminals(events: readonly KodacEvent[]): KodacEvent[] {
  return events.filter((event) => (
    event.type === "agent.turn.completed" ||
    event.type === "agent.turn.failed" ||
    event.type === "agent.turn.stopped"
  ))
}

function turnBrackets(events: readonly KodacEvent[]): KodacEvent[][] {
  const brackets: KodacEvent[][] = []
  for (let index = 0; index < events.length; index += 1) {
    if (events[index]?.type !== "agent.turn.started") continue
    const bracket: KodacEvent[] = []
    for (let cursor = index; cursor < events.length; cursor += 1) {
      const current = events[cursor]
      if (current === undefined) break
      bracket.push(current)
      if (
        current.type === "agent.turn.completed" ||
        current.type === "agent.turn.failed" ||
        current.type === "agent.turn.stopped"
      ) break
    }
    brackets.push(bracket)
  }
  return brackets
}

function assertAllDurableTurnsReconstruct(events: readonly KodacEvent[]): void {
  const starts = events.filter((event) => event.type === "agent.turn.started")
  const terminalEvents = terminals(events)
  assert.equal(terminalEvents.length, starts.length)
  const brackets = turnBrackets(events)
  assert.equal(brackets.length, starts.length)
  for (const bracket of brackets) {
    const projected = projectAgentStep(bracket)
    const last = bracket.at(-1)
    assert.ok(last)
    if (last.type === "agent.turn.completed") assert.equal(projected.terminalKind, "completed")
    else if (last.type === "agent.turn.failed") assert.equal(projected.terminalKind, "failed")
    else assert.equal(projected.terminalKind, "stopped")
  }
}

function decision(kind: string, id: string): Record<string, unknown> {
  return {
    version: KDO_H5_R3A_DECISION_VERSION,
    decisionId: id,
    stageId: `stage-${id}`,
    code: `code-${id}`,
    kind,
  }
}

function guardPlan(input: { block?: boolean } = {}): string {
  return JSON.stringify({
    version: KDO_H5_R3B_PLAN_VERSION,
    toolDecisions: [],
    callRules: input.block
      ? [{
        version: KDO_H5_R3B_CALL_RULE_VERSION,
        ruleId: "block-echo",
        toolName: "test.echo",
        capability: "test.echo",
        decisions: [decision("block_call", "block")],
      }]
      : [],
  })
}

test("R4B successful no-tool and tool turns each persist exactly one completed terminal and reconstruct through R4A", async () => {
  const noToolProvider = new ScriptedProvider([responseStop("ok")], "r4b-no-tool")
  const noTool = harness({ provider: noToolProvider })
  const noToolResult = await noTool.loop.run({
    provider: noToolProvider.name,
    model: "fixture/model",
    messages: [{ role: "user", content: "finish" }],
  })
  assert.equal(noToolResult.status, "completed")
  assert.deepEqual(terminals(noTool.session.eventsSnapshot()).map((event) => event.type), ["agent.turn.completed"])
  assertAllDurableTurnsReconstruct(noTool.session.eventsSnapshot())

  const observed: unknown[] = []
  const toolProvider = new ScriptedProvider([
    responseTool("call-1", { value: 1 }),
    responseStop("after-tool"),
  ], "r4b-tool")
  const toolRun = harness({ provider: toolProvider, tools: [recordingTool(observed)] })
  const result = await toolRun.loop.run({
    provider: toolProvider.name,
    model: "fixture/model",
    messages: [{ role: "user", content: "run tool" }],
  })
  assert.equal(result.status, "completed")
  assert.deepEqual(observed, [{ value: 1 }])
  assert.deepEqual(terminals(toolRun.session.eventsSnapshot()).map((event) => event.type), [
    "agent.turn.completed",
    "agent.turn.completed",
  ])
  assertAllDurableTurnsReconstruct(toolRun.session.eventsSnapshot())
})

test("R4B provider, malformed-provider, tool, unknown-tool and guard-block failures terminalize as failed", async () => {
  const cases: Array<{
    name: string
    provider: ModelProvider
    tools?: RuntimeTool[]
    guardPlanJson?: string
    expectedExecutions?: number
  }> = []

  cases.push({
    name: "provider",
    provider: new ScriptedProvider([new Error("provider exploded")], "r4b-provider-fail"),
  })
  cases.push({
    name: "malformed",
    provider: new ScriptedProvider([{
      assistant: "bad",
      finishReason: "stop",
      toolCalls: [{ id: "illegal", name: "test.echo", input: {} }],
    }], "r4b-malformed"),
  })

  const toolObserved: unknown[] = []
  cases.push({
    name: "tool",
    provider: new ScriptedProvider([responseTool("tool-fail", { value: 1 })], "r4b-tool-fail"),
    tools: [recordingTool(toolObserved, { execute() { throw new Error("tool exploded") } })],
    expectedExecutions: 1,
  })

  cases.push({
    name: "unknown-tool",
    provider: new ScriptedProvider([responseTool("unknown", {}, "missing.tool")], "r4b-unknown"),
  })

  const blockedObserved: unknown[] = []
  cases.push({
    name: "guard-block",
    provider: new ScriptedProvider([responseTool("blocked", { value: 1 })], "r4b-blocked"),
    tools: [recordingTool(blockedObserved)],
    guardPlanJson: guardPlan({ block: true }),
    expectedExecutions: 0,
  })

  for (const current of cases) {
    const run = harness({ provider: current.provider, tools: current.tools })
    const result = await run.loop.run({
      provider: current.provider.name,
      model: "fixture/model",
      messages: [{ role: "user", content: current.name }],
      limits: { maxFailures: 1 },
      ...(current.guardPlanJson === undefined ? {} : { guardPlanJson: current.guardPlanJson }),
    })
    assert.equal(result.status, "stopped", current.name)
    assert.equal(result.reason, "max_failures", current.name)
    assert.deepEqual(terminals(run.session.eventsSnapshot()).map((event) => event.type), ["agent.turn.failed"], current.name)
    assertAllDurableTurnsReconstruct(run.session.eventsSnapshot())
  }

  assert.equal(toolObserved.length, 1)
  assert.equal(blockedObserved.length, 0)
})

test("R4B duplicate and max-tool control stops persist stopped terminal before outer loop stop", async () => {
  const duplicateObserved: unknown[] = []
  const duplicateProvider = new ScriptedProvider([
    responseTool("one", { same: true }),
    responseTool("two", { same: true }),
  ], "r4b-duplicate")
  const duplicate = harness({ provider: duplicateProvider, tools: [recordingTool(duplicateObserved)] })
  const duplicateResult = await duplicate.loop.run({
    provider: duplicateProvider.name,
    model: "fixture/model",
    messages: [{ role: "user", content: "duplicate" }],
    limits: { maxIdenticalToolCalls: 1 },
  })
  assert.equal(duplicateResult.reason, "duplicate_tool_call")
  assert.equal(duplicateObserved.length, 1)
  const duplicateEvents = duplicate.session.eventsSnapshot()
  assert.deepEqual(terminals(duplicateEvents).map((event) => event.type), [
    "agent.turn.completed",
    "agent.turn.stopped",
  ])
  const duplicateStopped = duplicateEvents.findLast((event) => event.type === "agent.turn.stopped")
  assert.equal((duplicateStopped?.payload as { reason: string }).reason, "duplicate_tool_call")
  assert.ok(duplicateEvents.findIndex((event) => event.type === "agent.turn.stopped") < duplicateEvents.findIndex((event) => event.type === "agent.loop.stopped"))
  assertAllDurableTurnsReconstruct(duplicateEvents)

  const maxObserved: unknown[] = []
  const maxProvider = new ScriptedProvider([
    responseTool("one", { value: 1 }),
    responseTool("two", { value: 2 }),
  ], "r4b-max-tools")
  const maxRun = harness({ provider: maxProvider, tools: [recordingTool(maxObserved)] })
  const maxResult = await maxRun.loop.run({
    provider: maxProvider.name,
    model: "fixture/model",
    messages: [{ role: "user", content: "budget" }],
    limits: { maxToolCalls: 1, maxIdenticalToolCalls: 8 },
  })
  assert.equal(maxResult.reason, "max_tool_calls")
  assert.equal(maxObserved.length, 1)
  const maxEvents = maxRun.session.eventsSnapshot()
  assert.deepEqual(terminals(maxEvents).map((event) => event.type), ["agent.turn.completed", "agent.turn.stopped"])
  assert.equal((maxEvents.findLast((event) => event.type === "agent.turn.stopped")?.payload as { reason: string }).reason, "max_tool_calls")
  assertAllDurableTurnsReconstruct(maxEvents)
})

test("R4B in-turn abort and elapsed control stops terminalize as stopped while pre-turn abort starts no turn", async () => {
  const controller = new AbortController()
  const abortObserved: unknown[] = []
  const abortProvider = new ScriptedProvider([
    responseTools([
      { id: "one", input: { order: 1 } },
      { id: "two", input: { order: 2 } },
    ]),
  ], "r4b-abort")
  const abortTool = recordingTool(abortObserved, {
    execute(input) {
      if ((input as { order?: number }).order === 1) controller.abort(new Error("founder cancelled"))
      return { ok: true }
    },
  })
  const abortRun = harness({ provider: abortProvider, tools: [abortTool] })
  const abortResult = await abortRun.loop.run({
    provider: abortProvider.name,
    model: "fixture/model",
    messages: [{ role: "user", content: "abort during turn" }],
    signal: controller.signal,
  })
  assert.equal(abortResult.reason, "aborted")
  assert.equal(abortObserved.length, 1)
  const abortEvents = abortRun.session.eventsSnapshot()
  assert.deepEqual(terminals(abortEvents).map((event) => event.type), ["agent.turn.stopped"])
  assert.equal((abortEvents.find((event) => event.type === "agent.turn.stopped")?.payload as { reason: string }).reason, "aborted")
  assertAllDurableTurnsReconstruct(abortEvents)

  let now = 0
  const elapsedObserved: unknown[] = []
  const elapsedProvider = new ScriptedProvider([
    responseTools([
      { id: "one", input: { order: 1 } },
      { id: "two", input: { order: 2 } },
    ]),
  ], "r4b-elapsed")
  const elapsedTool = recordingTool(elapsedObserved, {
    execute(input) {
      if ((input as { order?: number }).order === 1) now = 100
      return { ok: true }
    },
  })
  const elapsedRun = harness({ provider: elapsedProvider, tools: [elapsedTool], clock: () => now })
  const elapsedResult = await elapsedRun.loop.run({
    provider: elapsedProvider.name,
    model: "fixture/model",
    messages: [{ role: "user", content: "elapsed" }],
    limits: { maxElapsedMs: 50 },
  })
  assert.equal(elapsedResult.reason, "max_elapsed")
  assert.equal(elapsedObserved.length, 1)
  const elapsedEvents = elapsedRun.session.eventsSnapshot()
  assert.deepEqual(terminals(elapsedEvents).map((event) => event.type), ["agent.turn.stopped"])
  assert.equal((elapsedEvents.find((event) => event.type === "agent.turn.stopped")?.payload as { reason: string }).reason, "max_elapsed")
  assertAllDurableTurnsReconstruct(elapsedEvents)

  const pre = new AbortController()
  pre.abort(new Error("already cancelled"))
  const preProvider = new ScriptedProvider([responseStop()], "r4b-pre-abort")
  const preRun = harness({ provider: preProvider })
  const preResult = await preRun.loop.run({
    provider: preProvider.name,
    model: "fixture/model",
    messages: [{ role: "user", content: "never starts" }],
    signal: pre.signal,
  })
  assert.equal(preResult.reason, "aborted")
  assert.equal(preProvider.requests.length, 0)
  assert.equal(preRun.session.eventsSnapshot().some((event) => event.type === "agent.turn.started"), false)
  assert.equal(terminals(preRun.session.eventsSnapshot()).length, 0)
})

test("R4B R1B pruning persistence failure after turn start creates failed terminal and blocks later provider request", async () => {
  const raw = `RAW_${"x".repeat(1800)}`
  const provider = new ScriptedProvider([
    responseTool("one", { value: 1 }),
    responseStop("must-not-run"),
  ], "r4b-pruning-reject")
  const sink = new RejectingSink((event) => event.type === "model.history.tool_result_pruning.applied")
  const run = harness({
    provider,
    tools: [recordingTool([], { execute() { return { raw } } })],
    sink,
  })
  await assert.rejects(() => run.loop.run({
    provider: provider.name,
    model: "fixture/model",
    messages: [{ role: "user", content: "prune" }],
    toolResultPruningMaxBytes: 256,
  }), /sink rejected model\.history\.tool_result_pruning\.applied/)
  assert.equal(provider.requests.length, 1)
  assert.deepEqual(terminals(sink.events).map((event) => event.type), ["agent.turn.completed", "agent.turn.failed"])
  assert.equal(sink.events.some((event) => event.type === "agent.loop.completed"), false)
  assertAllDurableTurnsReconstruct(sink.events)
})

test("R4B post-run H2 history and R2B advisory persistence failures create failed not completed terminal", async () => {
  const historyProvider = new ScriptedProvider([responseStop("answer")], "r4b-history-reject")
  const historySink = new RejectingSink((event) => event.type === "model.history.message.appended")
  const history = harness({ provider: historyProvider, sink: historySink })
  await assert.rejects(() => history.loop.run({
    provider: historyProvider.name,
    model: "fixture/model",
    messages: [{ role: "user", content: "history" }],
  }), /sink rejected model\.history\.message\.appended/)
  assert.deepEqual(terminals(historySink.events).map((event) => event.type), ["agent.turn.failed"])
  assert.equal(historySink.events.some((event) => event.type === "agent.turn.completed"), false)
  assertAllDurableTurnsReconstruct(historySink.events)

  const advisoryProvider = new ScriptedProvider([
    responseTool("one", { same: true }),
    responseTool("two", { same: true }),
  ], "r4b-advisory-reject")
  const advisorySink = new RejectingSink((event) => event.type === "model.history.repeat_call_advisory.appended")
  const advisory = harness({
    provider: advisoryProvider,
    tools: [recordingTool([])],
    sink: advisorySink,
  })
  await assert.rejects(() => advisory.loop.run({
    provider: advisoryProvider.name,
    model: "fixture/model",
    messages: [{ role: "user", content: "advisory" }],
    limits: { maxIdenticalToolCalls: 3 },
  }), /sink rejected model\.history\.repeat_call_advisory\.appended/)
  assert.deepEqual(terminals(advisorySink.events).map((event) => event.type), [
    "agent.turn.completed",
    "agent.turn.failed",
  ])
  assert.equal(advisorySink.events.filter((event) => event.type === "agent.turn.completed").length, 1)
  assertAllDurableTurnsReconstruct(advisorySink.events)
})

test("R4B guard execution-observation persistence failure becomes failed terminal with no completed claim", async () => {
  const provider = new ScriptedProvider([responseTool("guarded", { value: 1 })], "r4b-guard-observe-reject")
  const sink = new RejectingSink((event) => event.type === "tool.guard.execution_observed")
  const observed: unknown[] = []
  const run = harness({ provider, tools: [recordingTool(observed)], sink })
  const result = await run.loop.run({
    provider: provider.name,
    model: "fixture/model",
    messages: [{ role: "user", content: "guard" }],
    guardPlanJson: guardPlan(),
    limits: { maxFailures: 1 },
  })
  assert.equal(result.reason, "max_failures")
  assert.equal(observed.length, 1)
  assert.deepEqual(terminals(sink.events).map((event) => event.type), ["agent.turn.failed"])
  assert.equal(sink.events.some((event) => event.type === "agent.turn.completed"), false)
  assertAllDurableTurnsReconstruct(sink.events)
})

test("R4B terminal sink rejection never produces a fallback terminal", async () => {
  const completedProvider = new ScriptedProvider([responseStop("done")], "r4b-reject-completed")
  const completedSink = new RejectingSink((event) => event.type === "agent.turn.completed")
  const completed = harness({ provider: completedProvider, sink: completedSink })
  await assert.rejects(() => completed.loop.run({
    provider: completedProvider.name,
    model: "fixture/model",
    messages: [{ role: "user", content: "complete" }],
  }), /sink rejected agent\.turn\.completed/)
  assert.equal(terminals(completedSink.events).length, 0)
  assert.equal(completedSink.attempts.filter((type) => type.startsWith("agent.turn.") && type !== "agent.turn.started").length, 1)
  assert.equal(completedSink.events.some((event) => event.type === "agent.loop.completed"), false)

  const failedProvider = new ScriptedProvider([new Error("provider failed")], "r4b-reject-failed")
  const failedSink = new RejectingSink((event) => event.type === "agent.turn.failed")
  const failed = harness({ provider: failedProvider, sink: failedSink })
  await assert.rejects(() => failed.loop.run({
    provider: failedProvider.name,
    model: "fixture/model",
    messages: [{ role: "user", content: "fail" }],
    limits: { maxFailures: 1 },
  }), /sink rejected agent\.turn\.failed/)
  assert.equal(terminals(failedSink.events).length, 0)
  assert.equal(failedSink.attempts.filter((type) => type === "agent.turn.failed" || type === "agent.turn.completed" || type === "agent.turn.stopped").length, 1)

  const stoppedProvider = new ScriptedProvider([
    responseTool("one", { same: true }),
    responseTool("two", { same: true }),
  ], "r4b-reject-stopped")
  const stoppedSink = new RejectingSink((event) => event.type === "agent.turn.stopped")
  const stopped = harness({ provider: stoppedProvider, tools: [recordingTool([])], sink: stoppedSink })
  await assert.rejects(() => stopped.loop.run({
    provider: stoppedProvider.name,
    model: "fixture/model",
    messages: [{ role: "user", content: "stop" }],
    limits: { maxIdenticalToolCalls: 1 },
  }), /sink rejected agent\.turn\.stopped/)
  assert.deepEqual(terminals(stoppedSink.events).map((event) => event.type), ["agent.turn.completed"])
  assert.equal(stoppedSink.events.some((event) => event.type === "agent.loop.stopped"), false)
  assert.equal(stoppedSink.attempts.filter((type) => type === "agent.turn.stopped").length, 1)
})

test("R4B durable stopped terminal survives a later outer loop-stop persistence failure without second terminal", async () => {
  const provider = new ScriptedProvider([
    responseTool("one", { same: true }),
    responseTool("two", { same: true }),
  ], "r4b-loop-stop-reject")
  const sink = new RejectingSink((event) => event.type === "agent.loop.stopped")
  const run = harness({ provider, tools: [recordingTool([])], sink })
  await assert.rejects(() => run.loop.run({
    provider: provider.name,
    model: "fixture/model",
    messages: [{ role: "user", content: "outer stop rejects" }],
    limits: { maxIdenticalToolCalls: 1 },
  }), /sink rejected agent\.loop\.stopped/)
  assert.deepEqual(terminals(sink.events).map((event) => event.type), ["agent.turn.completed", "agent.turn.stopped"])
  assert.equal(sink.attempts.filter((type) => type === "agent.turn.stopped").length, 1)
  assertAllDurableTurnsReconstruct(sink.events)
})

test("R4B sync and async stream observer failures are contained only after canonical stream evidence succeeds", async () => {
  for (const mode of ["sync", "async"] as const) {
    const provider = new ScriptedProvider([
      async (request) => {
        await request.onStreamEvent?.({ type: "started" })
        await request.onStreamEvent?.({ type: "text_delta", text: "hello" })
        await request.onStreamEvent?.({ type: "completed", finishReason: "stop", responseId: "resp-1" })
        return responseStop("hello")
      },
    ], `r4b-stream-${mode}`)
    const run = harness({ provider })
    let observerCalls = 0
    const result = await run.runner.run(
      {
        provider: provider.name,
        model: "fixture/model",
        messages: [{ role: "user", content: "stream" }],
      },
      {
        onStreamEvent() {
          observerCalls += 1
          if (mode === "sync") throw new Error("observer sync failure")
          return Promise.reject(new Error("observer async failure"))
        },
      },
    )
    assert.equal(result.assistant, "hello")
    assert.equal(observerCalls, 3)
    assert.equal(run.session.eventsSnapshot().filter((event) => event.type.startsWith("model.stream.")).length, 3)
    assert.equal(run.session.eventsSnapshot().some((event) => event.type === "model.failed"), false)
  }
})

test("R4B canonical stream evidence persistence failure still fails closed and caller observer is not invoked", async () => {
  const provider = new ScriptedProvider([
    async (request) => {
      await request.onStreamEvent?.({ type: "text_delta", text: "secretless" })
      return responseStop("never")
    },
  ], "r4b-stream-sink-reject")
  const sink = new RejectingSink((event) => event.type === "model.stream.text_delta")
  const run = harness({ provider, sink })
  let observerCalls = 0
  await assert.rejects(() => run.runner.run(
    {
      provider: provider.name,
      model: "fixture/model",
      messages: [{ role: "user", content: "stream fail" }],
    },
    { onStreamEvent() { observerCalls += 1 } },
  ), /sink rejected model\.stream\.text_delta/)
  assert.equal(observerCalls, 0)
  assert.equal(sink.events.some((event) => event.type === "model.failed"), true)
})

test("R4B preserves beforeToolCall as a trusted veto before tool execution", async () => {
  const observed: unknown[] = []
  const provider = new ScriptedProvider([responseTool("veto", { value: 1 })], "r4b-veto")
  const run = harness({ provider, tools: [recordingTool(observed)] })
  await assert.rejects(() => run.runner.run(
    {
      provider: provider.name,
      model: "fixture/model",
      messages: [{ role: "user", content: "veto" }],
    },
    { beforeToolCall() { throw new Error("trusted host veto") } },
  ), /trusted host veto/)
  assert.equal(observed.length, 0)
  assert.equal(run.session.eventsSnapshot().some((event) => event.type === "tool.started"), false)
})

test("R4B cycle, max-turns and max-failures outer stops occur only after a terminalized current turn", async () => {
  const cycleProvider = new ScriptedProvider([
    responseTool("one", { same: true }),
    responseTool("two", { same: true }),
  ], "r4b-cycle")
  const cycle = harness({ provider: cycleProvider, tools: [recordingTool([])] })
  const cycleResult = await cycle.loop.run({
    provider: cycleProvider.name,
    model: "fixture/model",
    messages: [{ role: "user", content: "cycle" }],
    limits: { maxRepeatedTurnSignatures: 1, maxIdenticalToolCalls: 8 },
  })
  assert.equal(cycleResult.reason, "cycle_detected")
  assert.deepEqual(terminals(cycle.session.eventsSnapshot()).map((event) => event.type), [
    "agent.turn.completed",
    "agent.turn.completed",
  ])
  assertAllDurableTurnsReconstruct(cycle.session.eventsSnapshot())

  const maxTurnsProvider = new ScriptedProvider([responseTool("one", { value: 1 })], "r4b-max-turns")
  const maxTurns = harness({ provider: maxTurnsProvider, tools: [recordingTool([])] })
  const maxTurnsResult = await maxTurns.loop.run({
    provider: maxTurnsProvider.name,
    model: "fixture/model",
    messages: [{ role: "user", content: "one turn" }],
    limits: { maxTurns: 1 },
  })
  assert.equal(maxTurnsResult.reason, "max_turns")
  assert.deepEqual(terminals(maxTurns.session.eventsSnapshot()).map((event) => event.type), ["agent.turn.completed"])
  assertAllDurableTurnsReconstruct(maxTurns.session.eventsSnapshot())

  const failProvider = new ScriptedProvider([new Error("failure")], "r4b-max-failures")
  const failures = harness({ provider: failProvider })
  const failResult = await failures.loop.run({
    provider: failProvider.name,
    model: "fixture/model",
    messages: [{ role: "user", content: "fail" }],
    limits: { maxFailures: 1 },
  })
  assert.equal(failResult.reason, "max_failures")
  assert.deepEqual(terminals(failures.session.eventsSnapshot()).map((event) => event.type), ["agent.turn.failed"])
  assertAllDurableTurnsReconstruct(failures.session.eventsSnapshot())
})
