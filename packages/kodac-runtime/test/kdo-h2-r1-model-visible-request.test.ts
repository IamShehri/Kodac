import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import test from "node:test"

import { AgentTurnRunner } from "../src/model/turn.ts"
import {
  type ModelProvider,
  type ModelProviderRequest,
  type ModelProviderResponse,
  ProviderRegistry,
} from "../src/model/provider.ts"
import {
  KDO_H2_R1_DEEPSEEK_HARNESS_DONOR_PROVENANCE,
  KDO_H2_R1_LIMITS,
  KDO_H2_R1_REQUEST_VERSION,
  createModelVisibleRequestSnapshot,
  materializeModelVisibleRequest,
  validateModelVisibleRequestSnapshot,
} from "../src/session/model-visible-request.ts"
import { InMemoryEventSink, type EventSink, type KodacEvent } from "../src/protocol/event.ts"
import { RuntimeSession } from "../src/session/session.ts"
import { RuntimeOrchestrator } from "../src/runtime/orchestrator.ts"
import { ToolRegistry } from "../src/tools/registry.ts"

class CapturingProvider implements ModelProvider {
  readonly name = "fixture-capture"
  calls = 0
  lastRequest?: ModelProviderRequest

  async generate(request: ModelProviderRequest): Promise<ModelProviderResponse> {
    this.calls += 1
    this.lastRequest = request
    return { assistant: "ok", toolCalls: [], finishReason: "stop" }
  }
}

class RejectSnapshotSink implements EventSink {
  append(event: KodacEvent): void {
    if (event.type === "model.request.snapshot") throw new Error("snapshot append rejected")
  }
}

function toolRegistry(): ToolRegistry {
  const tools = new ToolRegistry()
  tools.register({
    name: "zeta.read",
    capability: "repo.read",
    model: { description: "Read zeta", inputSchema: { type: "object", properties: { path: { type: "string" } } } },
    async execute() { return { ok: true } },
  })
  tools.register({
    name: "alpha.search",
    capability: "repo.search",
    model: { description: "Search alpha", inputSchema: { type: "object", additionalProperties: false } },
    async execute() { return { ok: true } },
  })
  return tools
}

function baseInput() {
  return {
    provider: "fixture-capture",
    model: "fixture-model",
    messages: [
      { role: "system" as const, content: "Follow the specification." },
      { role: "user" as const, content: "Inspect this repository." },
      {
        role: "assistant" as const,
        content: "",
        toolCalls: [{ id: "call-1", name: "alpha.search", input: { query: "needle", limit: 3 } }],
      },
      { role: "tool" as const, name: "alpha.search", toolCallId: "call-1", content: "{\"matches\":[]}" },
    ],
    tools: toolRegistry().list(),
  }
}

function source(relative: string): string {
  return readFileSync(new URL(relative, import.meta.url), "utf8")
}

function gitBlobSha1(text: string): string {
  const canonical = text.replace(/\r\n/g, "\n")
  const body = Buffer.from(canonical, "utf8")
  return createHash("sha1").update(`blob ${body.byteLength}\0`).update(body).digest("hex")
}

test("H2-R1 donor provenance pins the DeepSeek session source exactly", () => {
  assert.equal(KDO_H2_R1_REQUEST_VERSION, "kodac-model-visible-request-v1")
  assert.equal(KDO_H2_R1_DEEPSEEK_HARNESS_DONOR_PROVENANCE.repository, "deepseek-ai/deepseek-harness")
  assert.equal(KDO_H2_R1_DEEPSEEK_HARNESS_DONOR_PROVENANCE.sourceCommit, "47f943859bef60e4160492346772ded9b24f765a")
  assert.deepEqual(KDO_H2_R1_DEEPSEEK_HARNESS_DONOR_PROVENANCE.sources, [
    { path: "docs/subsystems/session.md", blob: "aea9d00b38e384e7a973ce168c3a75a62e70a8bb" },
  ])
})

test("request identity is deterministic, preserves message order, and canonicalizes tools", () => {
  const input = baseInput()
  const first = createModelVisibleRequestSnapshot(input)
  const second = createModelVisibleRequestSnapshot({ ...input, tools: [...input.tools].reverse() })
  assert.deepEqual(first, second)
  assert.deepEqual(first.tools.map((tool) => tool.name), ["alpha.search", "zeta.read"])

  const reorderedMessages = createModelVisibleRequestSnapshot({ ...input, messages: [...input.messages].reverse() })
  assert.notEqual(reorderedMessages.requestIdentity, first.requestIdentity)
  assert.deepEqual(validateModelVisibleRequestSnapshot(first), first)
})

test("message tool-call and schema mutations change structural identity", () => {
  const input = baseInput()
  const baseline = createModelVisibleRequestSnapshot(input)
  const messageMutation = createModelVisibleRequestSnapshot({ ...input, messages: [{ role: "user", content: "different" }] })
  const toolMutation = createModelVisibleRequestSnapshot({ ...input, tools: input.tools.map((tool) => tool.name === "alpha.search" ? { ...tool, description: "Different" } : tool) })
  const schemaMutation = createModelVisibleRequestSnapshot({ ...input, tools: input.tools.map((tool) => tool.name === "alpha.search" ? { ...tool, inputSchema: { type: "object", properties: { changed: { type: "boolean" } } } } : tool) })
  assert.notEqual(messageMutation.requestIdentity, baseline.requestIdentity)
  assert.notEqual(toolMutation.requestIdentity, baseline.requestIdentity)
  assert.notEqual(schemaMutation.requestIdentity, baseline.requestIdentity)
})

test("serialized validation rejects unknown fields tampering and explicit undefined", () => {
  const snapshot = createModelVisibleRequestSnapshot(baseInput())
  assert.throws(() => validateModelVisibleRequestSnapshot({ ...snapshot, extra: true }), /unknown field/)
  assert.throws(() => validateModelVisibleRequestSnapshot({ ...snapshot, messageCount: snapshot.messageCount + 1 }), /derived fields mismatch/)
  assert.throws(() => validateModelVisibleRequestSnapshot({ ...snapshot, requestIdentity: "0".repeat(64) }), /derived fields mismatch/)
  const messages = snapshot.messages.map((message, index) => index === 0 ? { ...message, name: undefined } : message)
  assert.throws(() => validateModelVisibleRequestSnapshot({ ...snapshot, messages }), /undefined|derived fields/)
})

test("non-JSON cyclic sparse duplicate and malformed request data fails closed", () => {
  const cycle: Record<string, unknown> = {}
  cycle.self = cycle
  assert.throws(() => createModelVisibleRequestSnapshot({
    provider: "fixture",
    model: "model",
    messages: [{ role: "assistant", content: "", toolCalls: [{ id: "x", name: "tool", input: cycle }] }],
    tools: [],
  }), /cycle/)
  assert.throws(() => createModelVisibleRequestSnapshot({
    provider: "fixture",
    model: "model",
    messages: [{ role: "assistant", content: "", toolCalls: [
      { id: "x", name: "tool", input: {} },
      { id: "x", name: "tool", input: {} },
    ] }],
    tools: [],
  }), /duplicate id/)
  const sparse = Array(2) as unknown[]
  sparse[1] = "value"
  assert.throws(() => createModelVisibleRequestSnapshot({
    provider: "fixture",
    model: "model",
    messages: [{ role: "assistant", content: "", toolCalls: [{ id: "x", name: "tool", input: sparse }] }],
    tools: [],
  }), /sparse array/)
  assert.throws(() => createModelVisibleRequestSnapshot({
    provider: "fixture",
    model: "model",
    messages: [{ role: "assistant", content: "", toolCalls: [{ id: "x", name: "tool", input: { score: Number.NaN } }] }],
    tools: [],
  }), /non-finite/)
  assert.throws(() => createModelVisibleRequestSnapshot({ provider: "", model: "model", messages: [], tools: [] }), /provider/)
})

test("all authorized item and byte bounds fail closed without truncation", () => {
  const L = KDO_H2_R1_LIMITS
  assert.throws(() => createModelVisibleRequestSnapshot({ provider: "p".repeat(L.maxProviderBytes + 1), model: "m", messages: [], tools: [] }), /provider/)
  assert.throws(() => createModelVisibleRequestSnapshot({ provider: "p", model: "m".repeat(L.maxModelBytes + 1), messages: [], tools: [] }), /model/)
  assert.throws(() => createModelVisibleRequestSnapshot({ provider: "p", model: "m", messages: Array.from({ length: L.maxMessages + 1 }, () => ({ role: "user" as const, content: "x" })), tools: [] }), /messages/)
  assert.throws(() => createModelVisibleRequestSnapshot({ provider: "p", model: "m", messages: [{ role: "user", content: "x".repeat(L.maxMessageContentBytes + 1) }], tools: [] }), /content/)
  assert.throws(() => createModelVisibleRequestSnapshot({ provider: "p", model: "m", messages: Array.from({ length: 9 }, () => ({ role: "user" as const, content: "x".repeat(500_000) })), tools: [] }), /message content/)
  assert.throws(() => createModelVisibleRequestSnapshot({ provider: "p", model: "m", messages: [{ role: "tool", content: "x", name: "n".repeat(L.maxMessageNameBytes + 1), toolCallId: "id" }], tools: [] }), /name/)
  assert.throws(() => createModelVisibleRequestSnapshot({ provider: "p", model: "m", messages: [{ role: "tool", content: "x", toolCallId: "i".repeat(L.maxToolCallIdBytes + 1) }], tools: [] }), /toolCallId/)
  assert.throws(() => createModelVisibleRequestSnapshot({ provider: "p", model: "m", messages: [{ role: "assistant", content: "", toolCalls: Array.from({ length: L.maxToolCallsPerMessage + 1 }, (_, index) => ({ id: `c${index}`, name: "t", input: {} })) }], tools: [] }), /toolCalls/)
  assert.throws(() => createModelVisibleRequestSnapshot({ provider: "p", model: "m", messages: [{ role: "assistant", content: "", toolCalls: [{ id: "c", name: "t", input: "x".repeat(L.maxToolCallInputBytes + 1) }] }], tools: [] }), /input/)
  const tool = { name: "t", capability: "repo.read", description: "d", inputSchema: { type: "object" } }
  assert.throws(() => createModelVisibleRequestSnapshot({ provider: "p", model: "m", messages: [], tools: Array.from({ length: L.maxTools + 1 }, (_, index) => ({ ...tool, name: `t${index}` })) }), /tools/)
  assert.throws(() => createModelVisibleRequestSnapshot({ provider: "p", model: "m", messages: [], tools: [{ ...tool, name: "n".repeat(L.maxToolNameBytes + 1) }] }), /name/)
  assert.throws(() => createModelVisibleRequestSnapshot({ provider: "p", model: "m", messages: [], tools: [{ ...tool, capability: "c".repeat(L.maxCapabilityBytes + 1) }] }), /capability/)
  assert.throws(() => createModelVisibleRequestSnapshot({ provider: "p", model: "m", messages: [], tools: [{ ...tool, description: "d".repeat(L.maxToolDescriptionBytes + 1) }] }), /description/)
  assert.throws(() => createModelVisibleRequestSnapshot({ provider: "p", model: "m", messages: [], tools: [{ ...tool, inputSchema: { payload: "x".repeat(L.maxToolSchemaBytes) } }] }), /inputSchema/)
  const largeTools = Array.from({ length: 18 }, (_, index) => ({ name: `tool${index}`, capability: "repo.read", description: "d", inputSchema: { payload: "x".repeat(500_000) } }))
  assert.throws(() => createModelVisibleRequestSnapshot({ provider: "p", model: "m", messages: [], tools: largeTools }), /modelVisibleRequest exceeds/)
})

test("snapshots are deeply immutable and materialization returns independent data", () => {
  const snapshot = createModelVisibleRequestSnapshot(baseInput())
  assert.ok(Object.isFrozen(snapshot))
  assert.ok(Object.isFrozen(snapshot.messages))
  assert.ok(Object.isFrozen(snapshot.messages[0]))
  assert.ok(Object.isFrozen(snapshot.tools))
  assert.ok(Object.isFrozen(snapshot.tools[0]))
  assert.ok(Object.isFrozen(snapshot.tools[0]?.inputSchema))
  const materialized = materializeModelVisibleRequest(snapshot)
  assert.deepEqual(materialized, { model: snapshot.model, messages: snapshot.messages, tools: snapshot.tools })
  assert.notEqual(materialized.messages, snapshot.messages)
  assert.notEqual(materialized.tools, snapshot.tools)
})

test("fixture provider receives exactly the model-visible request reconstructed from the logged snapshot", async () => {
  const sink = new InMemoryEventSink()
  const session = new RuntimeSession(sink, "h2-r1-session")
  const providers = new ProviderRegistry()
  const provider = new CapturingProvider()
  providers.register(provider)
  const tools = toolRegistry()
  const runner = new AgentTurnRunner(providers, tools, new RuntimeOrchestrator(tools, session), session)
  const messages = baseInput().messages

  await runner.run({ provider: provider.name, model: "fixture-model", messages })
  assert.equal(provider.calls, 1)
  const event = sink.events.find((candidate) => candidate.type === "model.request.snapshot")
  assert.ok(event)
  const snapshot = validateModelVisibleRequestSnapshot(event.payload)
  assert.equal(snapshot.provider, provider.name)
  assert.deepEqual(
    { model: provider.lastRequest?.model, messages: provider.lastRequest?.messages, tools: provider.lastRequest?.tools },
    materializeModelVisibleRequest(snapshot),
  )
  assert.equal("signal" in (event.payload as object), false)
  assert.equal("onStreamEvent" in (event.payload as object), false)
})

test("snapshot append failure prevents provider invocation", async () => {
  const session = new RuntimeSession(new RejectSnapshotSink(), "reject-session")
  const providers = new ProviderRegistry()
  const provider = new CapturingProvider()
  providers.register(provider)
  const tools = toolRegistry()
  const runner = new AgentTurnRunner(providers, tools, new RuntimeOrchestrator(tools, session), session)
  await assert.rejects(() => runner.run({ provider: provider.name, model: "fixture-model", messages: [{ role: "user", content: "hello" }] }), /snapshot append rejected/)
  assert.equal(provider.calls, 0)
})

test("repeated identical provider-boundary requests retain structural identity while session sequences distinguish occurrences", async () => {
  const sink = new InMemoryEventSink()
  const session = new RuntimeSession(sink, "repeat-session")
  const providers = new ProviderRegistry()
  const provider = new CapturingProvider()
  providers.register(provider)
  const tools = toolRegistry()
  const runner = new AgentTurnRunner(providers, tools, new RuntimeOrchestrator(tools, session), session)
  const input = { provider: provider.name, model: "fixture-model", messages: [{ role: "user" as const, content: "same" }] }
  await runner.run(input)
  await runner.run(input)
  const events = sink.events.filter((candidate) => candidate.type === "model.request.snapshot")
  assert.equal(events.length, 2)
  const first = validateModelVisibleRequestSnapshot(events[0]?.payload)
  const second = validateModelVisibleRequestSnapshot(events[1]?.payload)
  assert.equal(first.requestIdentity, second.requestIdentity)
  assert.notEqual(events[0]?.sequence, events[1]?.sequence)
})

test("published schema mirrors the strict model-visible snapshot structure", () => {
  const schema = JSON.parse(source("../../../schema/kdo-model-visible-request.schema.json")) as any
  assert.equal(schema.additionalProperties, false)
  assert.equal(schema.properties.version.const, "kodac-model-visible-request-v1")
  assert.equal(schema.properties.messages.maxItems, KDO_H2_R1_LIMITS.maxMessages)
  assert.equal(schema.properties.tools.maxItems, KDO_H2_R1_LIMITS.maxTools)
  assert.equal(schema.$defs.message.additionalProperties, false)
  assert.equal(schema.$defs.call.additionalProperties, false)
  assert.equal(schema.$defs.tool.additionalProperties, false)
})

test("H2-R1 contract has no execution transport or secret authority and protected surfaces stay unchanged", () => {
  const contract = source("../src/session/model-visible-request.ts")
  assert.doesNotMatch(contract, /\bfetch\s*\(|child_process|worker_threads|ExecutionGateway|RuntimeTool|process\.env|apiKey|Authorization/)
  assert.equal(gitBlobSha1(source("../src/agent/loop.ts")), "fe92ffdc9cc057d620a8f2de2296e14eec43a1e0")
  assert.equal(gitBlobSha1(source("../src/tools/registry.ts")), "0bdf5cfd02efda7cab0c81976c7735bc7b46081b")
  assert.equal(gitBlobSha1(source("../src/model/openai.ts")), "564851b2dc8cd1aa610fbc7eaa4b5be5853f97f4")
  assert.equal(gitBlobSha1(source("../src/model/openai-compatible.ts")), "7ed56c7bac8e03d315b465e1f173ad934227051f")
  assert.equal(gitBlobSha1(source("../src/execution/gateway.ts")), "be5926e9a8dc5c4c29d441dac11661d71e797015")
  assert.equal(gitBlobSha1(source("../src/verification/done-gate.ts")), "067e147569fa52cc2b04c5df26fbe20a01e958e9")
})
