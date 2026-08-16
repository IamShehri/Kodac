import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import test from "node:test"

import {
  KDO_H5_R3A_AGENTICA_STUDY_PROVENANCE,
  KDO_H5_R3A_DECISION_VERSION,
  KDO_H5_R3A_DEEPCODE_DONOR_PROVENANCE,
  KDO_H5_R3A_LIMITS,
  KDO_H5_R3A_PIPELINE_VERSION,
  KDO_H5_R3A_RESULT_VERSION,
  reduceGuardedToolPipeline,
} from "../src/agent/guarded-tool-pipeline.ts"

const source = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8")

function gitBlobSha1(text: string): string {
  const canonical = text.replace(/\r\n/g, "\n")
  const body = Buffer.from(canonical, "utf8")
  return createHash("sha1").update(`blob ${body.byteLength}\0`).update(body).digest("hex")
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

function pipeline(input: {
  tools?: Array<{ name: string; capability: string }>
  call?: { toolName: string; capability: string; input: unknown }
  decisions?: Array<Record<string, unknown>>
} = {}): string {
  const tools = input.tools ?? [
    { name: "repo.read", capability: "workspace.read" },
    { name: "shell", capability: "process.exec" },
  ]
  return JSON.stringify({
    version: KDO_H5_R3A_PIPELINE_VERSION,
    tools,
    call: input.call ?? { toolName: "repo.read", capability: "workspace.read", input: { b: 2, a: 1 } },
    decisions: input.decisions ?? [],
  })
}

function rawPipeline(inputJson: string): string {
  return `{"version":"${KDO_H5_R3A_PIPELINE_VERSION}","tools":[{"name":"repo.read","capability":"workspace.read"}],"call":{"toolName":"repo.read","capability":"workspace.read","input":${inputJson}},"decisions":[]}`
}

test("H5-R3A donor provenance versions and fixed structural identity vector are exact", () => {
  assert.equal(KDO_H5_R3A_PIPELINE_VERSION, "kodac-guarded-tool-pipeline-v1")
  assert.equal(KDO_H5_R3A_DECISION_VERSION, "kodac-guarded-tool-decision-v1")
  assert.equal(KDO_H5_R3A_RESULT_VERSION, "kodac-guarded-tool-pipeline-result-v1")
  assert.deepEqual(KDO_H5_R3A_DEEPCODE_DONOR_PROVENANCE, {
    repository: "HKUDS/DeepCode",
    sourceCommit: "287510fbf6820147a48adf79f7fd86b0ed1afe92",
    sourceTree: "7f44b320f86d04d4315242fabc74f1b325829be8",
    license: "MIT",
    intakeMode: "PORT_SELECTED_CONTRACT_IDEAS",
    sources: [
      { path: "core/agent_runtime/runner.py", blob: "645ab82f768214cce0794984c4bc9b92b099ce5a", role: "integration-reference" },
      { path: "core/agent_runtime/hook.py", blob: "b0bbe5ea880f8688306a348ca72f2a29d4ffc9cc", role: "lifecycle-reference" },
      { path: "core/harness/hooks/events.py", blob: "ed393156d9e53d543220387fa4421785a0ce0b83", role: "matcher-reference" },
      { path: "core/harness/hooks/engine.py", blob: "26f66a1199057077372e26d831f58e7d54bf5d89", role: "fold-reference" },
    ],
  })
  assert.deepEqual(KDO_H5_R3A_AGENTICA_STUDY_PROVENANCE, {
    repository: "wrtnlabs/agentica",
    sourceCommit: "dc91f4307a3f2ee25e1ee07cf48777fcd13b6b0d",
    license: "MIT",
    licenseBlob: "886b7e88682164a5a22e609120c9f96c9ea57216",
    copyright: "Copyright (c) 2025 Wrtn Technologies",
    intakeMode: "STUDY_ONLY",
    sources: [{
      path: "website/content/docs/concepts/function-calling.mdx",
      blob: "9e5577511d65369e8439a958683b81e541dc87ee",
      role: "validation-feedback-design-reference",
    }],
  })

  const result = reduceGuardedToolPipeline(pipeline({ decisions: [
    decision("remove_tool", "d1", { toolName: "shell", capability: "process.exec" }),
    decision("replace_input", "d2", { input: { a: 1, b: 3 } }),
  ] }))
  assert.equal(result.baseToolSetIdentity, "1c32e41e2b831e41178154430382dd762b14632e04dc82a3632448675d2fc387")
  assert.equal(result.effectiveToolSetIdentity, "10e9c56ba5e660174810439be5e84baa9ca3ccb02643156a5e06464f8b8161b9")
  assert.equal(result.originalInputIdentity, "cbd18981586dafc5646b3e572361980a7fe4d365a5d376e74f487cb195cac25d")
  assert.equal(result.originalCallIdentity, "ba75e0d2679be68a730d7cbff8e34adca0c009de867840045e3fa41696006362")
  assert.equal(result.finalInputIdentity, "0cf52fe22d060d50c1f68cf6ea1ea3d1d09783ef1b3af61a46aaba02f28f3ed6")
  assert.equal(result.finalCallIdentity, "bba2ad9517c0618091a1e239a141efbfcb9fa745442382b1c344778b6fc9011f")
  assert.deepEqual(result.decisionIdentities, [
    "99a2451b85825aecea0a9f7123006704571cf0bc75fe15701e1bee815de9edf1",
    "6955a1abce427d1891abfbaa566604b0526ee388ae6a5fe1f9fb12887cb81e27",
  ])
  assert.equal(result.resultIdentity, "ac5f1b538ef8de99558d7ca1d0b31228d6b78e293978ad4a87e5a46bed90b09b")
})

test("empty and observe-only pipelines are deterministic no-op structural reductions", () => {
  const first = reduceGuardedToolPipeline(pipeline())
  const reorderedTools = reduceGuardedToolPipeline(pipeline({ tools: [
    { name: "shell", capability: "process.exec" },
    { name: "repo.read", capability: "workspace.read" },
  ] }))
  assert.equal(first.baseToolSetIdentity, reorderedTools.baseToolSetIdentity)
  assert.equal(first.effectiveToolSetIdentity, first.baseToolSetIdentity)
  assert.equal(first.originalCallIdentity, first.finalCallIdentity)
  assert.equal(first.inputChanged, false)
  assert.equal(first.blocked, false)
  assert.equal(first.requiresK2Reevaluation, false)

  const observed = reduceGuardedToolPipeline(pipeline({ decisions: [decision("observe", "observe-1")] }))
  assert.equal(observed.baseToolSetIdentity, first.baseToolSetIdentity)
  assert.equal(observed.effectiveToolSetIdentity, first.effectiveToolSetIdentity)
  assert.equal(observed.originalCallIdentity, observed.finalCallIdentity)
  assert.equal(observed.blocked, false)
  assert.equal(observed.requiresK2Reevaluation, false)
  assert.notEqual(observed.resultIdentity, first.resultIdentity)
})

test("remove_tool only narrows the base set and cannot add rename mismatch or re-remove", () => {
  const narrowed = reduceGuardedToolPipeline(pipeline({ decisions: [
    decision("remove_tool", "remove-shell", { toolName: "shell", capability: "process.exec" }),
  ] }))
  assert.deepEqual(narrowed.effectiveTools, [{ name: "repo.read", capability: "workspace.read" }])
  assert.notEqual(narrowed.effectiveToolSetIdentity, narrowed.baseToolSetIdentity)
  assert.equal(narrowed.blocked, false)

  assert.throws(() => reduceGuardedToolPipeline(pipeline({ decisions: [
    decision("remove_tool", "bad-cap", { toolName: "shell", capability: "workspace.read" }),
  ] })), /existing effective tool name\/capability pair/)
  assert.throws(() => reduceGuardedToolPipeline(pipeline({ decisions: [
    decision("remove_tool", "missing", { toolName: "missing", capability: "process.exec" }),
  ] })), /existing effective tool name\/capability pair/)
  assert.throws(() => reduceGuardedToolPipeline(pipeline({ decisions: [
    decision("remove_tool", "r1", { toolName: "shell", capability: "process.exec" }),
    decision("remove_tool", "r2", { toolName: "shell", capability: "process.exec" }),
  ] })), /existing effective tool name\/capability pair/)
  assert.throws(() => reduceGuardedToolPipeline(pipeline({ decisions: [decision("add_tool", "forbidden", { toolName: "x", capability: "x" })] })), /kind is unsupported/)
  assert.throws(() => reduceGuardedToolPipeline(pipeline({
    tools: [
      { name: "repo.read", capability: "workspace.read" },
      { name: "repo.read", capability: "process.exec" },
    ],
  })), /duplicate tool name/)
})

test("block is monotonic and current-tool removal cannot be reversed by later input rewrite", () => {
  const blocked = reduceGuardedToolPipeline(pipeline({ decisions: [
    decision("block_call", "block-1"),
    decision("observe", "after-block"),
    decision("replace_input", "rewrite-after-block", { input: { a: 2 } }),
  ] }))
  assert.equal(blocked.blocked, true)
  assert.equal(blocked.blockCode, "code-block-1")
  assert.equal(blocked.inputChanged, true)
  assert.equal(blocked.requiresK2Reevaluation, true)

  const removedCurrent = reduceGuardedToolPipeline(pipeline({ decisions: [
    decision("remove_tool", "remove-current", { toolName: "repo.read", capability: "workspace.read" }),
    decision("replace_input", "rewrite", { input: { a: 99 } }),
  ] }))
  assert.equal(removedCurrent.blocked, true)
  assert.equal(removedCurrent.blockCode, "tool_removed")
  assert.equal(removedCurrent.effectiveTools.some((tool) => tool.name === "repo.read"), false)
  assert.equal(removedCurrent.effectiveCall.toolName, "repo.read")
  assert.equal(removedCurrent.effectiveCall.capability, "workspace.read")
  assert.equal(removedCurrent.requiresK2Reevaluation, true)

  assert.throws(() => reduceGuardedToolPipeline(pipeline({ decisions: [decision("allow", "forbidden")] })), /kind is unsupported/)
})

test("replace_input preserves tool/capability and creates a new call identity requiring K2 re-evaluation", () => {
  const changed = reduceGuardedToolPipeline(pipeline({ decisions: [decision("replace_input", "rewrite", { input: { b: 2, a: 7 } })] }))
  assert.equal(changed.effectiveCall.toolName, "repo.read")
  assert.equal(changed.effectiveCall.capability, "workspace.read")
  assert.notEqual(changed.originalInputIdentity, changed.finalInputIdentity)
  assert.notEqual(changed.originalCallIdentity, changed.finalCallIdentity)
  assert.equal(changed.inputChanged, true)
  assert.equal(changed.requiresK2Reevaluation, true)

  const noOp = reduceGuardedToolPipeline(pipeline({ decisions: [decision("replace_input", "same", { input: { a: 1, b: 2 } })] }))
  assert.equal(noOp.originalInputIdentity, noOp.finalInputIdentity)
  assert.equal(noOp.originalCallIdentity, noOp.finalCallIdentity)
  assert.equal(noOp.inputChanged, false)
  assert.equal(noOp.requiresK2Reevaluation, false)

  const reverted = reduceGuardedToolPipeline(pipeline({ decisions: [
    decision("replace_input", "change", { input: { a: 9 } }),
    decision("replace_input", "restore", { input: { a: 1, b: 2 } }),
  ] }))
  assert.equal(reverted.inputChanged, false)
  assert.equal(reverted.originalCallIdentity, reverted.finalCallIdentity)
  assert.equal(reverted.requiresK2Reevaluation, true)

  assert.throws(() => reduceGuardedToolPipeline(pipeline({ decisions: [
    { ...decision("replace_input", "rename", { input: {} }), toolName: "shell" },
  ] })), /must contain exactly/)
})

test("phase order is deterministic and remove_tool cannot run after call-guard mutation begins", () => {
  assert.throws(() => reduceGuardedToolPipeline(pipeline({ decisions: [
    decision("replace_input", "rewrite", { input: { a: 7 } }),
    decision("remove_tool", "late-remove", { toolName: "shell", capability: "process.exec" }),
  ] })), /not allowed after call-guard mutation begins/)
  assert.throws(() => reduceGuardedToolPipeline(pipeline({ decisions: [
    decision("block_call", "block"),
    decision("remove_tool", "late-remove", { toolName: "shell", capability: "process.exec" }),
  ] })), /not allowed after call-guard mutation begins/)

  const left = reduceGuardedToolPipeline(pipeline({ decisions: [
    decision("replace_input", "one", { input: { value: 1 } }),
    decision("replace_input", "two", { input: { value: 2 } }),
  ] }))
  const right = reduceGuardedToolPipeline(pipeline({ decisions: [
    decision("replace_input", "two", { input: { value: 2 } }),
    decision("replace_input", "one", { input: { value: 1 } }),
  ] }))
  assert.notEqual(left.finalInputIdentity, right.finalInputIdentity)
  assert.notEqual(left.resultIdentity, right.resultIdentity)
})

test("public serialized boundary and exact schemas fail closed without executing caller hooks", () => {
  let traps = 0
  const proxy = new Proxy({ value: pipeline() }, {
    get(target, property, receiver) { traps += 1; return Reflect.get(target, property, receiver) },
    ownKeys(target) { traps += 1; return Reflect.ownKeys(target) },
    getPrototypeOf(target) { traps += 1; return Reflect.getPrototypeOf(target) },
  })
  assert.throws(() => reduceGuardedToolPipeline(proxy as never), /primitive JSON string/)
  assert.equal(traps, 0)

  let getterCalls = 0
  const accessor: Record<string, unknown> = {}
  Object.defineProperty(accessor, "value", { enumerable: true, get() { getterCalls += 1; return pipeline() } })
  assert.throws(() => reduceGuardedToolPipeline(accessor as never), /primitive JSON string/)
  assert.equal(getterCalls, 0)

  let toJsonCalls = 0
  const withToJson = { toJSON() { toJsonCalls += 1; return pipeline() } }
  assert.throws(() => reduceGuardedToolPipeline(withToJson as never), /primitive JSON string/)
  assert.equal(toJsonCalls, 0)

  assert.throws(() => reduceGuardedToolPipeline("{"), /invalid JSON|expected|unterminated|trailing/)
  assert.throws(() => reduceGuardedToolPipeline(`{"version":"${KDO_H5_R3A_PIPELINE_VERSION}","version":"${KDO_H5_R3A_PIPELINE_VERSION}","tools":[],"call":{},"decisions":[]}`), /duplicate key/)
  assert.throws(() => reduceGuardedToolPipeline(JSON.stringify({ ...JSON.parse(pipeline()), extra: true })), /must contain exactly/)
  assert.throws(() => reduceGuardedToolPipeline(pipeline({ decisions: [
    { ...decision("observe", "unknown-field"), extra: true },
  ] })), /must contain exactly/)
  assert.throws(() => reduceGuardedToolPipeline(pipeline({ decisions: [
    decision("observe", "duplicate"),
    decision("observe", "duplicate"),
  ] })), /duplicate decisionId/)
  assert.throws(() => reduceGuardedToolPipeline(pipeline({ call: { toolName: "repo.read", capability: "wrong", input: {} } })), /must exist exactly/)
})

test("JCS-compatible input identity covers key order number escapes Unicode and lone-surrogate rejection", () => {
  assert.equal(
    reduceGuardedToolPipeline(rawPipeline('{"b":1,"a":2}')).originalInputIdentity,
    reduceGuardedToolPipeline(rawPipeline('{"a":2,"b":1}')).originalInputIdentity,
  )
  assert.equal(
    reduceGuardedToolPipeline(rawPipeline("-0")).originalInputIdentity,
    reduceGuardedToolPipeline(rawPipeline("0")).originalInputIdentity,
  )
  assert.equal(
    reduceGuardedToolPipeline(rawPipeline("1e+0")).originalInputIdentity,
    reduceGuardedToolPipeline(rawPipeline("1.0")).originalInputIdentity,
  )
  assert.equal(
    reduceGuardedToolPipeline(rawPipeline('"\\u0061"')).originalInputIdentity,
    reduceGuardedToolPipeline(rawPipeline('"a"')).originalInputIdentity,
  )
  assert.notEqual(
    reduceGuardedToolPipeline(rawPipeline('"é"')).originalInputIdentity,
    reduceGuardedToolPipeline(rawPipeline('"e\\u0301"')).originalInputIdentity,
  )
  assert.throws(() => reduceGuardedToolPipeline(rawPipeline('"\\ud800"')), /unpaired high surrogate/)
})

test("tool and capability framing prevents delimiter and Unicode identity ambiguity", () => {
  const left = reduceGuardedToolPipeline(pipeline({
    tools: [{ name: "a\u0000b", capability: "c" }],
    call: { toolName: "a\u0000b", capability: "c", input: {} },
  }))
  const right = reduceGuardedToolPipeline(pipeline({
    tools: [{ name: "a", capability: "b\u0000c" }],
    call: { toolName: "a", capability: "b\u0000c", input: {} },
  }))
  const unicode = reduceGuardedToolPipeline(pipeline({
    tools: [{ name: "工具", capability: "读取" }],
    call: { toolName: "工具", capability: "读取", input: {} },
  }))
  assert.notEqual(left.originalCallIdentity, right.originalCallIdentity)
  assert.notEqual(left.originalCallIdentity, unicode.originalCallIdentity)
  assert.notEqual(left.baseToolSetIdentity, right.baseToolSetIdentity)
})

test("all R3A byte count and structural bounds fail closed at limit plus one", () => {
  const tooManyTools = Array.from({ length: KDO_H5_R3A_LIMITS.maxTools + 1 }, (_, index) => ({ name: `t${index}`, capability: "c" }))
  assert.throws(() => reduceGuardedToolPipeline(pipeline({
    tools: tooManyTools,
    call: { toolName: "t0", capability: "c", input: {} },
  })), /tools exceeds/)

  const tooManyDecisions = Array.from({ length: KDO_H5_R3A_LIMITS.maxDecisions + 1 }, (_, index) => decision("observe", `d${index}`))
  assert.throws(() => reduceGuardedToolPipeline(pipeline({ decisions: tooManyDecisions })), /decisions exceeds/)
  assert.throws(() => reduceGuardedToolPipeline(pipeline({ tools: [{ name: "x".repeat(161), capability: "c" }], call: { toolName: "x".repeat(161), capability: "c", input: {} } })), /name must be 1\.\.160/)
  assert.throws(() => reduceGuardedToolPipeline(pipeline({ tools: [{ name: "x", capability: "c".repeat(161) }], call: { toolName: "x", capability: "c".repeat(161), input: {} } })), /capability must be 1\.\.160/)
  assert.throws(() => reduceGuardedToolPipeline(pipeline({ decisions: [decision("observe", "d".repeat(161))] })), /decisionId must be 1\.\.160/)
  const stage = decision("observe", "d"); stage.stageId = "s".repeat(161)
  assert.throws(() => reduceGuardedToolPipeline(pipeline({ decisions: [stage] })), /stageId must be 1\.\.160/)
  const code = decision("observe", "d"); code.code = "c".repeat(161)
  assert.throws(() => reduceGuardedToolPipeline(pipeline({ decisions: [code] })), /code must be 1\.\.160/)
  assert.throws(() => reduceGuardedToolPipeline(pipeline({ call: { toolName: "repo.read", capability: "workspace.read", input: "x".repeat(KDO_H5_R3A_LIMITS.maxInputBytes + 1) } })), /input exceeds/)

  let deep: unknown = 0
  for (let depth = 0; depth < KDO_H5_R3A_LIMITS.maxJsonDepth + 1; depth += 1) deep = [deep]
  assert.throws(() => reduceGuardedToolPipeline(pipeline({ call: { toolName: "repo.read", capability: "workspace.read", input: deep } })), /JSON depth/)

  const tooManyItems = Array.from({ length: KDO_H5_R3A_LIMITS.maxInputItems + 1 }, () => 0)
  assert.throws(() => reduceGuardedToolPipeline(pipeline({ call: { toolName: "repo.read", capability: "workspace.read", input: tooManyItems } })), /array elements\/object members/)
  assert.throws(() => reduceGuardedToolPipeline(`${" ".repeat(KDO_H5_R3A_LIMITS.maxPipelineJsonBytes + 1)}${pipeline()}`), /UTF-8 bytes/)
})

test("result is deeply immutable and exposes no permission or execution-grant vocabulary", () => {
  const result = reduceGuardedToolPipeline(pipeline({ decisions: [decision("replace_input", "rewrite", { input: { nested: { value: 2 } } })] }))
  assert.equal(Object.isFrozen(result), true)
  assert.equal(Object.isFrozen(result.effectiveTools), true)
  assert.equal(Object.isFrozen(result.effectiveTools[0]), true)
  assert.equal(Object.isFrozen(result.effectiveCall), true)
  assert.equal(Object.isFrozen(result.effectiveCall.input), true)
  assert.equal(Object.isFrozen((result.effectiveCall.input as Record<string, unknown>).nested), true)
  assert.equal(Object.isFrozen(result.decisionIdentities), true)
  for (const forbidden of ["allowed", "approved", "policyAllowed", "permissionGranted", "sandboxed", "safeToExecute", "provenReady"]) {
    assert.equal(Object.prototype.hasOwnProperty.call(result, forbidden), false)
  }
})

test("R3A production remains pure while R3B integrates it only through the pure plan companion", () => {
  const production = source("../src/agent/guarded-tool-pipeline.ts")
  assert.equal(gitBlobSha1(production), "876656bf65a67df56c4cd5f078629cde06112af1")
  const imports = [...production.matchAll(/from\s+"([^"]+)"/g)].map((match) => match[1]).sort()
  assert.deepEqual(imports, ["node:crypto"])
  for (const forbidden of [
    "node:fs", "node:child_process", "node:http", "node:https", "node:net", "node:tls",
    "process.env", "session.emit", "fetch(", "spawn(", "execFile(", "RuntimeOrchestrator", "ExecutionGateway", "DoneGate",
  ]) {
    assert.equal(production.includes(forbidden), false, `R3A production source must not contain ${forbidden}`)
  }

  const plan = source("../src/agent/guarded-tool-plan.ts")
  const planImports = [...plan.matchAll(/from\s+"([^"]+)"/g)].map((match) => match[1]).sort()
  assert.deepEqual(planImports, ["./guarded-tool-pipeline.ts", "node:crypto"])
  assert.match(plan, /reduceGuardedToolPipeline/)
  assert.doesNotMatch(plan, /node:(?:fs|child_process|net|http|https|tls)|process\.env|\bfetch\s*\(|RuntimeOrchestrator|ExecutionGateway|DoneGate|session\.emit/)

  const turn = source("../src/model/turn.ts")
  assert.match(turn, /reduceGuardedToolExposure/)
  assert.match(turn, /reduceGuardedToolCallWithPlan/)
  assert.doesNotMatch(turn, /node:child_process|node:fs\/promises|import\s*\(.*guard|require\(.*guard/)

  const loop = source("../src/agent/loop.ts")
  assert.match(loop, /guardPlanJson/)
  assert.match(loop, /beforeToolCall/)
  assert.doesNotMatch(loop, /confinement-linux-landlock|confinement-runtime|runConfinedReadOnlyCommand|landlock-run/)

  const events = source("../src/protocol/event.ts")
  assert.match(events, /tool\.guard\.evaluated/)
  assert.match(events, /tool\.guard\.execution_observed/)

  const history = source("../src/session/model-visible-history.ts")
  assert.match(history, /model\.history\.tool_result_pruning\.applied/)
  assert.match(history, /pruneModelVisibleToolResults/)
  assert.doesNotMatch(history, /guarded-tool-pipeline|guarded-tool-plan|reduceGuardedToolPipeline|reduceGuardedToolExposure|reduceGuardedToolCallWithPlan/)
  assert.doesNotMatch(history, /tool\.guard\.evaluated|tool\.guard\.execution_observed|ExecutionGateway|RuntimeOrchestrator|DoneGate/)

  const protectedBlobs: Record<string, string> = {
    "../src/agent/repeat-call-signal.ts": "1fd23cbc4dffd6be5ee77446d84bdea2ca27471f",
    "../src/runtime/orchestrator.ts": "b069da69909b282fdbdc2c62279e0297cbd430e9",
    "../src/tools/registry.ts": "0bdf5cfd02efda7cab0c81976c7735bc7b46081b",
    "../src/session/session.ts": "d5f2334b18e89f7bac2bac7422ed8a33669b8afd",
    "../src/session/model-visible-request.ts": "0f4c7ef7ef0f4e4e1baa90944c39639c1dfa07a6",
    "../src/agent/tool-result-pruning.ts": "66cfee69032c4c24331e8cb9098a86a1d7b9135e",
    "../src/trust/policy.ts": "b4134e430204123bebe053ffc9105f05fca611c9",
    "../src/execution/gateway.ts": "8de6063a929381d0c889a0638507a41f5fbdc645",
    "../src/verification/done-gate.ts": "067e147569fa52cc2b04c5df26fbe20a01e958e9",
    "../package.json": "af4c20a3dae387c15cc5fb2eb28d415c8f115b95",
    "../scripts/run-tests.mjs": "9a0bcde0e565168c78eb7fe4d3cf08236d24baa7",
  }
  for (const [path, expected] of Object.entries(protectedBlobs)) {
    assert.equal(gitBlobSha1(source(path)), expected, `${path} must remain byte-identical to the non-superseded R3A boundary`)
  }

  const index = source("../src/index.ts")
  assert.match(index, /export \* from "\.\/agent\/guarded-tool-pipeline\.ts"/)
  const notices = source("../THIRD_PARTY_NOTICES.md")
  assert.match(notices, /HKUDS DeepCode guarded tool-pipeline contract adaptation/)
  assert.match(notices, /wrtnlabs\/agentica validation-feedback design reference/)
  assert.match(notices, /26f66a1199057077372e26d831f58e7d54bf5d89/)
  assert.match(notices, /9e5577511d65369e8439a958683b81e541dc87ee/)
  const authorization = source("../../../docs/planning/KODAC_KDO_H5_R3A_MONOTONIC_GUARDED_TOOL_PIPELINE_PRIMITIVE_AUTHORIZATION_2026-08-15.md")
  assert.equal(gitBlobSha1(authorization), "39d4786f37a5a7dd71ab872314364bf15726d423")
})
