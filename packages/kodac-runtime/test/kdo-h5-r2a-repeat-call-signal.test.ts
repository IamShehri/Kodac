import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import test from "node:test"

import {
  KDO_H5_R2A_CALL_VERSION,
  KDO_H5_R2A_DEEPCODE_DONOR_PROVENANCE,
  KDO_H5_R2A_LIMITS,
  KDO_H5_R2A_POLICY_VERSION,
  KDO_H5_R2A_SIGNAL_VERSION,
  KDO_H5_R2A_STATE_VERSION,
  advanceRepeatCallSignal,
} from "../src/agent/repeat-call-signal.ts"

const source = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8")

function gitBlobSha1(text: string): string {
  const canonical = text.replace(/\r\n/g, "\n")
  const body = Buffer.from(canonical, "utf8")
  return createHash("sha1").update(`blob ${body.byteLength}\0`).update(body).digest("hex")
}

function policy(thresholds: readonly number[]): string {
  return JSON.stringify({ version: KDO_H5_R2A_POLICY_VERSION, thresholds })
}

function call(toolName: string, toolInput: unknown): string {
  return JSON.stringify({ version: KDO_H5_R2A_CALL_VERSION, toolName, toolInput })
}

function domainHash(kind: "STATE", canonicalJson: string): string {
  return createHash("sha256")
    .update(Buffer.from(`KODAC-H5-R2A\0${kind}\0V1\0`, "ascii"))
    .update(Buffer.from(canonicalJson, "utf8"))
    .digest("hex")
}

function canonicalPrimitiveRecord(record: Record<string, string | number>): string {
  const keys = Object.keys(record).sort()
  return `{${keys.map((key) => `${JSON.stringify(key)}:${JSON.stringify(record[key])}`).join(",")}}`
}

test("H5-R2A provenance versions and fixed identity vectors are exact", () => {
  assert.deepEqual(KDO_H5_R2A_DEEPCODE_DONOR_PROVENANCE, {
    repository: "HKUDS/DeepCode",
    sourceCommit: "287510fbf6820147a48adf79f7fd86b0ed1afe92",
    sourceTree: "7f44b320f86d04d4315242fabc74f1b325829be8",
    license: "MIT",
    intakeMode: "PORT",
    sources: [
      { path: "core/agent_runtime/repeat_guard.py", blob: "37c24894cdbe7e647bdcbe45d055a1fd48b30777" },
      {
        path: "core/agent_runtime/runner.py",
        blob: "645ab82f768214cce0794984c4bc9b92b099ce5a",
        role: "integration-reference-only",
      },
    ],
  })
  assert.equal(KDO_H5_R2A_POLICY_VERSION, "kodac-repeat-call-policy-v1")
  assert.equal(KDO_H5_R2A_CALL_VERSION, "kodac-repeat-call-v1")
  assert.equal(KDO_H5_R2A_STATE_VERSION, "kodac-repeat-call-state-v1")
  assert.equal(KDO_H5_R2A_SIGNAL_VERSION, "kodac-repeat-call-signal-v1")

  const p = policy([2, 5])
  const c = call("repo.read", { a: 1, b: [true, null, "é"] })
  const first = advanceRepeatCallSignal(null, c, p)
  assert.equal(first.nextState.policyIdentity, "77650c712d3bcc40d1f4eb03a5c1dffe3a8b2b4b6d9fa6a65f386674d8c7d7b4")
  assert.equal(first.nextState.toolInputIdentity, "cd136733b75e725248fbfaf1ba55231ea1f92d89bca9014aa8860d9b473f83d9")
  assert.equal(first.nextState.callFingerprint, "55c839218c279d3f11154f30b618dde52f8d95de15d29ed2da01fc3b3cf3a434")
  assert.equal(first.nextState.stateIdentity, "9a53ca9800ea1dfe6ccb7be52ad8adf89481d7dc75bd385dd9e7cad41ff0711d")

  const second = advanceRepeatCallSignal(first.nextStateJson, c, p)
  assert.equal(second.nextState.stateIdentity, "cdd02839695cfe9740a2ffb1e94b707bb5a6e048d8bb94e2d4df9c6e48ca56de")
  assert.equal(second.advisorySignal?.signalIdentity, "a639ba334c2d820316aa608ba967bfe47d60bc06daa6eaf7a0ca6c67987e9003")
})

test("H5-R2A canonicalization is JCS-compatible across key order numbers escapes and Unicode", () => {
  const p1 = policy([5, 2])
  const p2 = policy([2, 5])
  const base1 = advanceRepeatCallSignal(null, call("fixture", { b: 1, a: 2 }), p1)
  const base2 = advanceRepeatCallSignal(null, call("fixture", { a: 2, b: 1 }), p2)
  assert.equal(base1.nextState.policyIdentity, base2.nextState.policyIdentity)
  assert.equal(base1.nextState.callFingerprint, base2.nextState.callFingerprint)

  const minusZero = `{"version":"${KDO_H5_R2A_CALL_VERSION}","toolName":"fixture","toolInput":-0}`
  const plusZero = `{"version":"${KDO_H5_R2A_CALL_VERSION}","toolName":"fixture","toolInput":0}`
  assert.equal(
    advanceRepeatCallSignal(null, minusZero, p2).nextState.callFingerprint,
    advanceRepeatCallSignal(null, plusZero, p2).nextState.callFingerprint,
  )

  const exponent = `{"version":"${KDO_H5_R2A_CALL_VERSION}","toolName":"fixture","toolInput":1e+0}`
  const decimal = `{"version":"${KDO_H5_R2A_CALL_VERSION}","toolName":"fixture","toolInput":1.0}`
  assert.equal(
    advanceRepeatCallSignal(null, exponent, p2).nextState.callFingerprint,
    advanceRepeatCallSignal(null, decimal, p2).nextState.callFingerprint,
  )

  const escaped = `{"version":"${KDO_H5_R2A_CALL_VERSION}","toolName":"fixture","toolInput":"\\u0061"}`
  assert.equal(
    advanceRepeatCallSignal(null, escaped, p2).nextState.callFingerprint,
    advanceRepeatCallSignal(null, call("fixture", "a"), p2).nextState.callFingerprint,
  )

  const composed = advanceRepeatCallSignal(null, call("fixture", "é"), p2)
  const decomposed = advanceRepeatCallSignal(null, call("fixture", "e\u0301"), p2)
  assert.notEqual(composed.nextState.callFingerprint, decomposed.nextState.callFingerprint)

  const duplicateKey = `{"version":"${KDO_H5_R2A_CALL_VERSION}","toolName":"fixture","toolInput":{"a":1,"a":2}}`
  assert.throws(() => advanceRepeatCallSignal(null, duplicateKey, p2), /duplicate key/)
  const loneSurrogate = `{"version":"${KDO_H5_R2A_CALL_VERSION}","toolName":"fixture","toolInput":"\\ud800"}`
  assert.throws(() => advanceRepeatCallSignal(null, loneSurrogate, p2), /unpaired high surrogate/)
})

test("H5-R2A consecutive chain resets deterministically and ignores provider transport ids", () => {
  const p = policy([2, 4])
  const a = call("repo.read", { path: "a" })
  const b = call("repo.read", { path: "b" })
  const differentTool = call("repo.search", { path: "a" })

  const r1 = advanceRepeatCallSignal(null, a, p)
  const r2 = advanceRepeatCallSignal(r1.nextStateJson, a, p)
  const r3 = advanceRepeatCallSignal(r2.nextStateJson, b, p)
  const r4 = advanceRepeatCallSignal(r3.nextStateJson, a, p)
  assert.deepEqual(
    [r1.nextState.consecutiveCount, r2.nextState.consecutiveCount, r3.nextState.consecutiveCount, r4.nextState.consecutiveCount],
    [1, 2, 1, 1],
  )
  assert.equal(r2.advisorySignal?.threshold, 2)
  assert.equal(r3.advisorySignal, null)

  const changedTool = advanceRepeatCallSignal(r2.nextStateJson, differentTool, p)
  assert.equal(changedTool.nextState.consecutiveCount, 1)

  const transportA = { id: "provider-call-a", serializedCall: a }
  const transportB = { id: "provider-call-b", serializedCall: a }
  assert.notEqual(transportA.id, transportB.id)
  assert.equal(
    advanceRepeatCallSignal(null, transportA.serializedCall, p).nextState.callFingerprint,
    advanceRepeatCallSignal(null, transportB.serializedCall, p).nextState.callFingerprint,
  )
})

test("H5-R2A threshold signals emit once on advance and remain evidence-safe immutable structures", () => {
  const p = policy([2, 3])
  const c = call("fixture", { secret: "do-not-preview" })
  const first = advanceRepeatCallSignal(null, c, p)
  const second = advanceRepeatCallSignal(first.nextStateJson, c, p)
  const third = advanceRepeatCallSignal(second.nextStateJson, c, p)
  const fourth = advanceRepeatCallSignal(third.nextStateJson, c, p)

  assert.equal(first.advisorySignal, null)
  assert.equal(second.advisorySignal?.threshold, 2)
  assert.equal(second.advisorySignal?.thresholdIndex, 0)
  assert.equal(third.advisorySignal?.threshold, 3)
  assert.equal(third.advisorySignal?.thresholdIndex, 1)
  assert.equal(fourth.advisorySignal, null)
  assert.equal(Object.isFrozen(first), true)
  assert.equal(Object.isFrozen(first.nextState), true)
  assert.equal(Object.isFrozen(second.advisorySignal), true)
  assert.equal(JSON.stringify(second.advisorySignal).includes("do-not-preview"), false)
  assert.match(second.nextState.stateIdentity, /^[0-9a-f]{64}$/)
  assert.match(second.advisorySignal?.signalIdentity ?? "", /^[0-9a-f]{64}$/)
})

test("H5-R2A rejects malformed hostile or over-bound serialized inputs without executing hooks", () => {
  const p = policy([2])
  const c = call("fixture", {})

  let proxyGets = 0
  const proxied = new Proxy({ value: c }, {
    get(target, property, receiver) {
      proxyGets += 1
      return Reflect.get(target, property, receiver)
    },
    ownKeys(target) {
      proxyGets += 1
      return Reflect.ownKeys(target)
    },
    getPrototypeOf(target) {
      proxyGets += 1
      return Reflect.getPrototypeOf(target)
    },
  })
  assert.throws(() => advanceRepeatCallSignal(null, proxied as never, p), /primitive JSON string/)
  assert.equal(proxyGets, 0)

  let getterCalls = 0
  const accessor: Record<string, unknown> = {}
  Object.defineProperty(accessor, "value", {
    enumerable: true,
    get() {
      getterCalls += 1
      return c
    },
  })
  assert.throws(() => advanceRepeatCallSignal(null, accessor as never, p), /primitive JSON string/)
  assert.equal(getterCalls, 0)

  let toJsonCalls = 0
  const withToJson = {
    toJSON() {
      toJsonCalls += 1
      return c
    },
  }
  assert.throws(() => advanceRepeatCallSignal(null, withToJson as never, p), /primitive JSON string/)
  assert.equal(toJsonCalls, 0)

  assert.throws(() => advanceRepeatCallSignal(null, "{", p), /invalid JSON|unterminated|expected|trailing/)
  assert.throws(() => advanceRepeatCallSignal(null, JSON.stringify({ version: KDO_H5_R2A_CALL_VERSION, toolName: "fixture", toolInput: {}, extra: true }), p), /exactly/)
  assert.throws(() => advanceRepeatCallSignal(null, c, JSON.stringify({ version: KDO_H5_R2A_POLICY_VERSION, thresholds: [2], extra: true })), /exactly/)
  assert.throws(() => advanceRepeatCallSignal(null, c, policy([1])), /from 2 through/)
  assert.throws(() => advanceRepeatCallSignal(null, c, policy([2, 2])), /unique/)
  assert.throws(() => advanceRepeatCallSignal(null, c, policy(Array.from({ length: 17 }, (_, index) => index + 2))), /thresholds/)
  assert.throws(() => advanceRepeatCallSignal(null, c, policy([KDO_H5_R2A_LIMITS.maxThreshold + 1])), /from 2 through/)

  const tooLongName = "x".repeat(KDO_H5_R2A_LIMITS.maxToolNameBytes + 1)
  assert.throws(() => advanceRepeatCallSignal(null, call(tooLongName, {}), p), /toolName/)

  const tooLargeInput = "x".repeat(KDO_H5_R2A_LIMITS.maxToolInputBytes + 1)
  assert.throws(() => advanceRepeatCallSignal(null, call("fixture", tooLargeInput), p), /toolInput exceeds/)

  const tooManyItems = Array.from({ length: KDO_H5_R2A_LIMITS.maxToolInputItems + 1 }, () => 0)
  assert.throws(() => advanceRepeatCallSignal(null, call("fixture", tooManyItems), p), /array elements\/object members/)

  let tooDeep: unknown = 0
  for (let depth = 0; depth < KDO_H5_R2A_LIMITS.maxJsonDepth + 1; depth += 1) tooDeep = [tooDeep]
  assert.throws(() => advanceRepeatCallSignal(null, call("fixture", tooDeep), p), /JSON depth/)

  const oversizedCall = `${" ".repeat(KDO_H5_R2A_LIMITS.maxCurrentCallJsonBytes + 1)}${c}`
  assert.throws(() => advanceRepeatCallSignal(null, oversizedCall, p), /UTF-8 bytes/)

  const valid = advanceRepeatCallSignal(null, c, p)
  const corrupted = JSON.parse(valid.nextStateJson) as Record<string, unknown>
  corrupted.stateIdentity = "a".repeat(64)
  assert.throws(() => advanceRepeatCallSignal(JSON.stringify(corrupted), c, p), /state identity mismatch/)
})

test("H5-R2A count saturates at 65535 without overflow rejection or repeated signal", () => {
  const p = policy([KDO_H5_R2A_LIMITS.maxConsecutiveCount])
  const c = call("fixture", { stable: true })
  const initial = advanceRepeatCallSignal(null, c, p)
  const base = initial.nextState

  const nearLimitBase: Record<string, string | number> = {
    version: base.version,
    policyIdentity: base.policyIdentity,
    toolName: base.toolName,
    toolInputIdentity: base.toolInputIdentity,
    callFingerprint: base.callFingerprint,
    consecutiveCount: KDO_H5_R2A_LIMITS.maxConsecutiveCount - 1,
  }
  const nearLimitIdentity = domainHash("STATE", canonicalPrimitiveRecord(nearLimitBase))
  const nearLimitJson = canonicalPrimitiveRecord({ ...nearLimitBase, stateIdentity: nearLimitIdentity })

  const reachesLimit = advanceRepeatCallSignal(nearLimitJson, c, p)
  assert.equal(reachesLimit.nextState.consecutiveCount, KDO_H5_R2A_LIMITS.maxConsecutiveCount)
  assert.equal(reachesLimit.advisorySignal?.threshold, KDO_H5_R2A_LIMITS.maxConsecutiveCount)

  const saturated = advanceRepeatCallSignal(reachesLimit.nextStateJson, c, p)
  assert.equal(saturated.nextState.consecutiveCount, KDO_H5_R2A_LIMITS.maxConsecutiveCount)
  assert.equal(saturated.nextState.stateIdentity, reachesLimit.nextState.stateIdentity)
  assert.equal(saturated.advisorySignal, null)
})

test("H5-R2A tool-name length binding and input identity prevent delimiter ambiguity", () => {
  const p = policy([2])
  const a = advanceRepeatCallSignal(null, call("a\u0000b", { value: "c" }), p)
  const b = advanceRepeatCallSignal(null, call("a", { value: "b\u0000c" }), p)
  const unicode = advanceRepeatCallSignal(null, call("工具", { value: "c" }), p)
  assert.notEqual(a.nextState.callFingerprint, b.nextState.callFingerprint)
  assert.notEqual(a.nextState.callFingerprint, unicode.nextState.callFingerprint)
})

test("H5-R2A production source is pure attributed and all protected authority surfaces remain byte-identical", () => {
  const production = source("../src/agent/repeat-call-signal.ts")
  const imports = [...production.matchAll(/from\s+"([^"]+)"/g)].map((match) => match[1]).sort()
  assert.deepEqual(imports, ["node:crypto"])
  for (const forbidden of [
    "node:fs", "node:child_process", "node:http", "node:https", "node:net", "node:tls",
    "process.env", "session.emit", "fetch(", "spawn(", "exec(", "execFile(", "agent/loop", "done-gate",
  ]) {
    assert.equal(production.includes(forbidden), false, `production repeat-call source must not contain ${forbidden}`)
  }

  const index = source("../src/index.ts")
  assert.match(index, /export \* from "\.\/agent\/repeat-call-signal\.ts"/)
  const loop = source("../src/agent/loop.ts")
  assert.equal(loop.includes("repeat-call-signal"), false)
  assert.equal(loop.includes("advanceRepeatCallSignal"), false)

  const protectedBlobs: Record<string, string> = {
    "../src/agent/loop.ts": "a5b7c2bbb2a5f7658f683e7baf45655b41b775f8",
    "../src/agent/tool-result-pruning.ts": "66cfee69032c4c24331e8cb9098a86a1d7b9135e",
    "../src/session/model-visible-history.ts": "6b348a7ce9bfcc7b49463bad5fddae8a445f8135",
    "../src/session/model-visible-request.ts": "0f4c7ef7ef0f4e4e1baa90944c39639c1dfa07a6",
    "../src/protocol/event.ts": "ef402bb2cc0364122e6b79a3090b1cb8eed0ee85",
    "../src/model/turn.ts": "401d796b929d350046128371fee4ba719d0d56c9",
    "../src/trust/policy.ts": "b4134e430204123bebe053ffc9105f05fca611c9",
    "../src/execution/gateway.ts": "ecf9cc9d3eda6a2280a280ed2f9a2e472f397560",
    "../src/verification/done-gate.ts": "067e147569fa52cc2b04c5df26fbe20a01e958e9",
    "../package.json": "af4c20a3dae387c15cc5fb2eb28d415c8f115b95",
    "../scripts/run-tests.mjs": "9a0bcde0e565168c78eb7fe4d3cf08236d24baa7",
  }
  for (const [path, expected] of Object.entries(protectedBlobs)) {
    assert.equal(gitBlobSha1(source(path)), expected, `${path} must remain byte-identical to H5-R2A authorization`)
  }

  const notices = source("../THIRD_PARTY_NOTICES.md")
  assert.match(notices, /HKUDS DeepCode consecutive repeat-call signal adaptation/)
  assert.match(notices, /37c24894cdbe7e647bdcbe45d055a1fd48b30777/)
  assert.match(notices, /Copyright \(c\) 2025 Data Intelligence Lab@HKU/)
})
