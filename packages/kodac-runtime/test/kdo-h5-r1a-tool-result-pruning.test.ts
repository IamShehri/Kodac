import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import test from "node:test"

import {
  KDO_H5_R1A_CHANGE_VERSION,
  KDO_H5_R1A_DEEPCODE_DONOR_PROVENANCE,
  KDO_H5_R1A_LIMITS,
  KDO_H5_R1A_PRUNING_VERSION,
  KDO_H5_R1A_RESULT_VERSION,
  KDO_H5_R1A_STRATEGY,
  createToolResultPruningPolicy,
  pruneModelVisibleToolResults,
  validateToolResultPruningPolicy,
} from "../src/agent/tool-result-pruning.ts"

const source = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8")

function gitBlobSha1(text: string): string {
  const canonical = text.replace(/\r\n/g, "\n")
  const body = Buffer.from(canonical, "utf8")
  return createHash("sha1").update(`blob ${body.byteLength}\0`).update(body).digest("hex")
}

function assertUtf8Stable(value: string): void {
  assert.equal(Buffer.from(value, "utf8").toString("utf8"), value)
}

test("H5-R1A provenance and pruning policy are strict deterministic and bounded", () => {
  assert.deepEqual(KDO_H5_R1A_DEEPCODE_DONOR_PROVENANCE, {
    repository: "HKUDS/DeepCode",
    sourceCommit: "287510fbf6820147a48adf79f7fd86b0ed1afe92",
    sourceTree: "7f44b320f86d04d4315242fabc74f1b325829be8",
    license: "MIT",
    intakeMode: "PORT",
    sources: [{ path: "core/agent_runtime/pruner.py", blob: "dae72f4439d79a2e8a31a85de69908ef87114ec9" }],
  })
  assert.equal(KDO_H5_R1A_PRUNING_VERSION, "kodac-tool-result-pruning-v1")
  assert.equal(KDO_H5_R1A_CHANGE_VERSION, "kodac-tool-result-pruning-change-v1")
  assert.equal(KDO_H5_R1A_RESULT_VERSION, "kodac-tool-result-pruning-result-v1")
  assert.equal(KDO_H5_R1A_STRATEGY, "head-tail-equal-v1")
  assert.equal(KDO_H5_R1A_LIMITS.minToolResultBytes, 128)
  assert.equal(KDO_H5_R1A_LIMITS.maxToolResultBytes, 512 * 1024)
  assert.equal(KDO_H5_R1A_LIMITS.maxStructuralDepth, 72)

  const first = createToolResultPruningPolicy({ maxToolResultBytes: 256 })
  const second = createToolResultPruningPolicy({ maxToolResultBytes: 256 })
  const different = createToolResultPruningPolicy({ maxToolResultBytes: 257 })
  assert.deepEqual(first, second)
  assert.equal(first.policyIdentity, second.policyIdentity)
  assert.notEqual(first.policyIdentity, different.policyIdentity)
  assert.equal(Object.isFrozen(first), true)
  assert.deepEqual(validateToolResultPruningPolicy(JSON.parse(JSON.stringify(first))), first)
  assert.throws(() => createToolResultPruningPolicy({ maxToolResultBytes: 127 }), RangeError)
  assert.throws(() => createToolResultPruningPolicy({ maxToolResultBytes: 512 * 1024 + 1 }), RangeError)
  assert.throws(() => createToolResultPruningPolicy({ maxToolResultBytes: Number.NaN }), RangeError)
  assert.throws(() => createToolResultPruningPolicy({ maxToolResultBytes: 256.5 }), RangeError)
  assert.throws(() => createToolResultPruningPolicy({ maxToolResultBytes: 256, extra: true } as never), /exactly/)
  assert.throws(() => validateToolResultPruningPolicy({ ...first, policyIdentity: "a".repeat(64) }), /identity mismatch/)
})

test("H5-R1A prunes only oversized tool content preserves identity fields and converges", () => {
  const policy = createToolResultPruningPolicy({ maxToolResultBytes: 192 })
  const oversized = `HEAD-${"x".repeat(1000)}-TAIL`
  const messages = [
    { role: "system" as const, content: "s".repeat(300) },
    { role: "user" as const, content: "u".repeat(300) },
    { role: "assistant" as const, content: "a".repeat(300) },
    { role: "tool" as const, name: "repo.read", toolCallId: "call-1", content: oversized },
    { role: "tool" as const, name: "repo.read", toolCallId: "call-2", content: "small" },
  ]
  const before = JSON.stringify(messages)

  const first = pruneModelVisibleToolResults(messages, policy)
  const repeatedSameInput = pruneModelVisibleToolResults(messages, policy)
  assert.equal(JSON.stringify(messages), before)
  assert.equal(first.resultIdentity, repeatedSameInput.resultIdentity)
  assert.equal(first.inputIdentity, repeatedSameInput.inputIdentity)
  assert.equal(first.outputIdentity, repeatedSameInput.outputIdentity)
  assert.equal(first.messages.length, messages.length)
  assert.equal(first.changes.length, 1)
  assert.equal(first.changes[0]?.messageIndex, 3)
  assert.equal(first.messages[0]?.content, messages[0]?.content)
  assert.equal(first.messages[1]?.content, messages[1]?.content)
  assert.equal(first.messages[2]?.content, messages[2]?.content)
  assert.equal(first.messages[4]?.content, "small")

  const changed = first.messages[3]
  assert.ok(changed)
  assert.equal(changed.role, "tool")
  assert.equal(changed.name, "repo.read")
  assert.equal(changed.toolCallId, "call-1")
  assert.ok(changed.content.startsWith("HEAD-"))
  assert.ok(changed.content.endsWith("-TAIL"))
  assert.match(changed.content, /\[kodac-tool-result-pruned-v1 original-bytes=1010\]/)
  assert.ok(Buffer.byteLength(changed.content, "utf8") <= policy.maxToolResultBytes)

  const change = first.changes[0]
  assert.ok(change)
  assert.equal(change.originalBytes, Buffer.byteLength(oversized, "utf8"))
  assert.equal(change.resultBytes, Buffer.byteLength(changed.content, "utf8"))
  assert.ok(change.removedBytes > 0)
  assert.equal(change.originalContentSha256, createHash("sha256").update(oversized, "utf8").digest("hex"))
  assert.equal(change.resultContentSha256, createHash("sha256").update(changed.content, "utf8").digest("hex"))
  assert.equal(change.policyIdentity, policy.policyIdentity)
  assert.match(change.changeIdentity, /^[0-9a-f]{64}$/)

  const secondPass = pruneModelVisibleToolResults(first.messages, policy)
  assert.equal(secondPass.changes.length, 0)
  assert.equal(secondPass.inputIdentity, first.outputIdentity)
  assert.equal(secondPass.outputIdentity, first.outputIdentity)
  assert.deepEqual(secondPass.messages, first.messages)

  assert.equal(Object.isFrozen(first), true)
  assert.equal(Object.isFrozen(first.messages), true)
  assert.equal(Object.isFrozen(first.changes), true)
  assert.equal(Object.isFrozen(first.changes[0]), true)
  assert.equal(Object.isFrozen(first.messages[3]), true)
})

test("H5-R1A enforces UTF-8 byte bounds across multibyte Unicode emoji combining text and mixed newlines", () => {
  const policy = createToolResultPruningPolicy({ maxToolResultBytes: 161 })
  const cases = [
    `BEGIN-${"é".repeat(400)}-END`,
    `BEGIN-${"😀".repeat(300)}-END`,
    `BEGIN-${"e\u0301".repeat(300)}-END`,
    `BEGIN\r\n${"αβγ\n".repeat(250)}END`,
  ]

  for (const [index, content] of cases.entries()) {
    const result = pruneModelVisibleToolResults([
      { role: "tool", name: "fixture", toolCallId: `unicode-${index}`, content },
    ], policy)
    assert.equal(result.changes.length, 1)
    const output = result.messages[0]?.content
    assert.ok(output)
    assert.ok(output.startsWith("BEGIN"))
    assert.ok(output.endsWith("END"))
    assert.match(output, /kodac-tool-result-pruned-v1/)
    assert.ok(Buffer.byteLength(output, "utf8") <= policy.maxToolResultBytes)
    assertUtf8Stable(output)
    assert.equal(result.changes[0]?.resultBytes, Buffer.byteLength(output, "utf8"))
    assert.ok((result.changes[0]?.removedBytes ?? 0) > 0)
  }
})

test("H5-R1A fails closed on malformed or hostile structural inputs without executing hooks", () => {
  const policy = createToolResultPruningPolicy({ maxToolResultBytes: 192 })
  assert.throws(() => pruneModelVisibleToolResults({}, policy), /plain array/)
  assert.throws(() => pruneModelVisibleToolResults([{ role: "unknown", content: "x" }], policy), /role is unsupported/)
  assert.throws(() => pruneModelVisibleToolResults([{ role: "tool", name: "x", toolCallId: "y", content: "x", extra: true }], policy), /unknown field/)

  let getterCalls = 0
  const accessorMessage: Record<string, unknown> = { content: "x" }
  Object.defineProperty(accessorMessage, "role", {
    enumerable: true,
    get() { getterCalls += 1; return "tool" },
  })
  assert.throws(() => pruneModelVisibleToolResults([accessorMessage], policy), /data property/)
  assert.equal(getterCalls, 0)

  let proxyGets = 0
  const proxiedMessage = new Proxy(
    { role: "tool", name: "x", toolCallId: "y", content: "x".repeat(300) },
    { get(target, property, receiver) { proxyGets += 1; return Reflect.get(target, property, receiver) } },
  )
  assert.throws(() => pruneModelVisibleToolResults([proxiedMessage], policy), /proxy/)
  assert.equal(proxyGets, 0)

  const hidden = { role: "tool", name: "x", toolCallId: "y", content: "x".repeat(300) }
  Object.defineProperty(hidden, "secret", { value: "hidden", enumerable: false })
  assert.throws(() => pruneModelVisibleToolResults([hidden], policy), /enumerable/)

  const hiddenLengthPolicy = { maxToolResultBytes: 192 } as Record<string, unknown>
  Object.defineProperty(hiddenLengthPolicy, "length", { value: 1, enumerable: false })
  assert.throws(() => createToolResultPruningPolicy(hiddenLengthPolicy as never), /length must be enumerable/)

  const symbolBearing = { role: "tool", name: "x", toolCallId: "y", content: "x".repeat(300) } as Record<PropertyKey, unknown>
  symbolBearing[Symbol("hostile")] = true
  assert.throws(() => pruneModelVisibleToolResults([symbolBearing], policy), /symbol/)

  const cyclic = { role: "tool", name: "x", toolCallId: "y", content: "x".repeat(300) } as Record<string, unknown>
  cyclic.self = cyclic
  assert.throws(() => pruneModelVisibleToolResults([cyclic], policy), /cyclic/)

  let deeplyNested: unknown = "leaf"
  for (let depth = 0; depth < KDO_H5_R1A_LIMITS.maxStructuralDepth + 8; depth += 1) {
    deeplyNested = { next: deeplyNested }
  }
  assert.throws(() => pruneModelVisibleToolResults([
    {
      role: "assistant",
      content: "deep",
      toolCalls: [{ id: "deep-1", name: "fixture", input: deeplyNested }],
    },
  ], policy), /structural depth/)

  let policyProxyGets = 0
  const proxiedPolicyInput = new Proxy(
    { maxToolResultBytes: 192 },
    { get(target, property, receiver) { policyProxyGets += 1; return Reflect.get(target, property, receiver) } },
  )
  assert.throws(() => createToolResultPruningPolicy(proxiedPolicyInput), /proxy/)
  assert.equal(policyProxyGets, 0)
})

test("H5-R1A production source is pure attributed and R1B integration cannot widen runtime authority", () => {
  const production = source("../src/agent/tool-result-pruning.ts")
  const imports = [...production.matchAll(/from\s+"([^"]+)"/g)].map((match) => match[1]).sort()
  assert.deepEqual(imports, ["../session/model-visible-request.ts", "node:crypto", "node:util"])
  for (const forbidden of [
    "node:fs", "node:child_process", "node:http", "node:https", "node:net", "node:tls",
    "process.env", "session.emit", "fetch(", "spawn(", "exec(", "execFile(",
  ]) {
    assert.equal(production.includes(forbidden), false, `production pruning source must not contain ${forbidden}`)
  }
  assert.equal(gitBlobSha1(production), "66cfee69032c4c24331e8cb9098a86a1d7b9135e")

  const index = source("../src/index.ts")
  assert.match(index, /export \* from "\.\/agent\/tool-result-pruning\.ts"/)
  const loop = source("../src/agent/loop.ts")
  assert.match(loop, /createToolResultPruningPolicy/)
  assert.match(loop, /pruneModelVisibleToolResults/)
  assert.match(loop, /model\.history\.tool_result_pruning\.applied/)
  const history = source("../src/session/model-visible-history.ts")
  assert.match(history, /pruneModelVisibleToolResults/)
  assert.match(history, /model\.history\.tool_result_pruning\.applied/)
  assert.doesNotMatch(history, /\bExecutionGateway\b|\bRuntimeOrchestrator\b|\bDoneGate\b/)
  const turn = source("../src/model/turn.ts")
  assert.equal(turn.includes("tool-result-pruning"), false)
  assert.equal(turn.includes("pruneModelVisibleToolResults"), false)

  const protectedBlobs: Record<string, string> = {
    "../src/session/model-visible-request.ts": "0f4c7ef7ef0f4e4e1baa90944c39639c1dfa07a6",
    "../src/trust/policy.ts": "b4134e430204123bebe053ffc9105f05fca611c9",
    "../src/execution/gateway.ts": "5e4c3cea9982d7c774d0c18beb40f2fcbfde4e64",
    "../src/verification/done-gate.ts": "067e147569fa52cc2b04c5df26fbe20a01e958e9",
    "../package.json": "af4c20a3dae387c15cc5fb2eb28d415c8f115b95",
    "../scripts/run-tests.mjs": "9a0bcde0e565168c78eb7fe4d3cf08236d24baa7",
  }
  for (const [path, expected] of Object.entries(protectedBlobs)) {
    assert.equal(gitBlobSha1(source(path)), expected, `${path} must remain byte-identical to H5-R1A authorization`)
  }

  const notices = source("../THIRD_PARTY_NOTICES.md")
  assert.match(notices, /HKUDS DeepCode tool-result pruning adaptation/)
  assert.match(notices, /287510fbf6820147a48adf79f7fd86b0ed1afe92/)
  assert.match(notices, /dae72f4439d79a2e8a31a85de69908ef87114ec9/)
  assert.match(notices, /Copyright \(c\) 2025 Data Intelligence Lab@HKU/)
})
