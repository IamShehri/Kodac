import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import test from "node:test"

import {
  createContextContentItem,
  createContextSourceChangeSet,
} from "../src/context-connectors/contracts.ts"
import {
  KDO_C12_AUGMENT_DONOR_PROVENANCE,
  KDO_C12_INDEXER_STATE_MACHINE_VERSION,
  KDO_C12_LIMITS,
  createContextIndexMembershipEntry,
  createContextIndexMembershipState,
  createContextIndexMembershipStateFromItems,
  planContextIndexTransition,
  validateContextIndexMembershipState,
  validateContextIndexTransitionPlan,
  verifyContextIndexTransitionPlan,
} from "../src/context-connectors/indexer-state-machine.ts"
import type { ContextContentItem } from "../src/context-connectors/contracts.ts"
import type { ContextIndexMembershipState } from "../src/context-connectors/indexer-state-machine.ts"

const digest = (label: string) => createHash("sha256").update(label, "utf8").digest("hex")
const SOURCE = digest("source-profile")
const OTHER_SOURCE = digest("other-source-profile")
const R1 = digest("revision-1")
const R2 = digest("revision-2")
const RX = digest("revision-x")

function item(path: string, content: string, revision: string | undefined = R1, source = SOURCE): ContextContentItem {
  return createContextContentItem({
    path,
    content,
    sourceProfileIdentity: source,
    ...(revision === undefined ? {} : { sourceRevisionIdentity: revision }),
  })
}

function initialState(): ContextIndexMembershipState {
  return createContextIndexMembershipStateFromItems(SOURCE, R1, [
    item("src/a.ts", "export const a = 1\n"),
    item("src/b.ts", "export const b = 1\n"),
    item("src/c.ts", "export const c = 1\n"),
  ])
}

function incrementalChange() {
  return createContextSourceChangeSet({
    kind: "INCREMENTAL",
    sourceProfileIdentity: SOURCE,
    previousRevisionIdentity: R1,
    currentRevisionIdentity: R2,
    added: [item("src/d.ts", "export const d = 1\n", R2)],
    modified: [item("src/b.ts", "export const b = 2\n", R2)],
    removed: ["src/c.ts"],
  })
}

function gitTextBlobSha1(raw: Buffer): string {
  const canonical = Buffer.from(raw.toString("utf8").replace(/\r\n/g, "\n"), "utf8")
  return createHash("sha1")
    .update(Buffer.from(`blob ${canonical.byteLength}\0`, "utf8"))
    .update(canonical)
    .digest("hex")
}

test("KDO-C12 donor provenance is pinned exactly", () => {
  assert.equal(KDO_C12_INDEXER_STATE_MACHINE_VERSION, "kodac-context-indexer-state-machine-v1")
  assert.deepEqual(KDO_C12_AUGMENT_DONOR_PROVENANCE, {
    repository: "augmentcode/context-connectors",
    sourceCommit: "f7d6472ae626c98fd768f64cdfd6160145eefa77",
    sourcePath: "src/core/indexer.ts",
    sourceBlob: "61b260621b418f8a03dbef66f1cff5ef8ed4d3ef",
    intakeMode: "PORT",
  })
})

test("first run requires a full build and performs no side-effect operations", () => {
  const change = createContextSourceChangeSet({
    kind: "FULL_REQUIRED",
    sourceProfileIdentity: SOURCE,
    currentRevisionIdentity: R1,
    reason: "incremental_unavailable",
  })
  const plan = planContextIndexTransition(null, change)
  assert.equal(plan.kind, "FULL_BUILD_REQUIRED")
  assert.equal(plan.reason, "no_previous_state")
  assert.equal(plan.previousStateIdentity, null)
  assert.equal(plan.nextState, null)
  assert.deepEqual(plan.removePaths, [])
  assert.deepEqual(plan.upserts, [])
})

test("explicit C11 FULL_REQUIRED yields a full rebuild for a compatible prior state", () => {
  const previous = initialState()
  const change = createContextSourceChangeSet({
    kind: "FULL_REQUIRED",
    sourceProfileIdentity: SOURCE,
    previousRevisionIdentity: R1,
    currentRevisionIdentity: R2,
    reason: "filter_changed",
  })
  const plan = planContextIndexTransition(previous, change)
  assert.equal(plan.kind, "FULL_BUILD_REQUIRED")
  assert.equal(plan.reason, "change_set_full_required")
  assert.equal(plan.previousStateIdentity, previous.stateIdentity)
})

test("source-profile changes require a full rebuild", () => {
  const previous = initialState()
  const change = createContextSourceChangeSet({
    kind: "UNCHANGED",
    sourceProfileIdentity: OTHER_SOURCE,
    previousRevisionIdentity: R1,
    currentRevisionIdentity: R1,
  })
  const plan = planContextIndexTransition(previous, change)
  assert.equal(plan.kind, "FULL_BUILD_REQUIRED")
  assert.equal(plan.reason, "source_profile_changed")
})

test("unproven revision continuity requires a full rebuild", () => {
  const previous = initialState()
  const change = createContextSourceChangeSet({
    kind: "UNCHANGED",
    sourceProfileIdentity: SOURCE,
    previousRevisionIdentity: RX,
    currentRevisionIdentity: R2,
  })
  const plan = planContextIndexTransition(previous, change)
  assert.equal(plan.kind, "FULL_BUILD_REQUIRED")
  assert.equal(plan.reason, "revision_continuity_unproven")
})

test("UNCHANGED retains membership while binding the new source revision", () => {
  const previous = initialState()
  const change = createContextSourceChangeSet({
    kind: "UNCHANGED",
    sourceProfileIdentity: SOURCE,
    previousRevisionIdentity: R1,
    currentRevisionIdentity: R2,
  })
  const plan = planContextIndexTransition(previous, change)
  assert.equal(plan.kind, "UNCHANGED")
  assert.equal(plan.reason, null)
  assert.ok(plan.nextState)
  assert.equal(plan.nextState.sourceRevisionIdentity, R2)
  assert.deepEqual(
    plan.nextState.entries.map((entry) => [entry.path, entry.itemIdentity]),
    previous.entries.map((entry) => [entry.path, entry.itemIdentity]),
  )
  assert.notEqual(plan.nextState.stateIdentity, previous.stateIdentity)
})

test("valid incremental transition removes, replaces and adds deterministically", () => {
  const previous = initialState()
  const plan = planContextIndexTransition(previous, incrementalChange())
  assert.equal(plan.kind, "INCREMENTAL_UPDATE")
  assert.deepEqual(plan.removePaths, ["src/c.ts"])
  assert.deepEqual(plan.upserts.map((operation) => [operation.action, operation.path]), [
    ["REPLACE", "src/b.ts"],
    ["ADD", "src/d.ts"],
  ])
  assert.ok(plan.nextState)
  assert.deepEqual(plan.nextState.entries.map((entry) => entry.path), ["src/a.ts", "src/b.ts", "src/d.ts"])
  assert.equal(plan.nextState.sourceRevisionIdentity, R2)
})

test("modified membership is replaced rather than appended", () => {
  const previous = initialState()
  const before = previous.entries.find((entry) => entry.path === "src/b.ts")
  const plan = planContextIndexTransition(previous, incrementalChange())
  const after = plan.nextState?.entries.find((entry) => entry.path === "src/b.ts")
  assert.ok(before)
  assert.ok(after)
  assert.notEqual(after.itemIdentity, before.itemIdentity)
  assert.equal(plan.nextState?.entries.filter((entry) => entry.path === "src/b.ts").length, 1)
})

test("removed membership disappears and unaffected membership is retained", () => {
  const previous = initialState()
  const aBefore = previous.entries.find((entry) => entry.path === "src/a.ts")
  const plan = planContextIndexTransition(previous, incrementalChange())
  assert.equal(plan.nextState?.entries.some((entry) => entry.path === "src/c.ts"), false)
  const aAfter = plan.nextState?.entries.find((entry) => entry.path === "src/a.ts")
  assert.equal(aAfter?.entryIdentity, aBefore?.entryIdentity)
})

test("transition identities are independent of incremental input ordering", () => {
  const previous = initialState()
  const added = [
    item("src/e.ts", "e\n", R2),
    item("src/d.ts", "d\n", R2),
  ]
  const modified = [
    item("src/b.ts", "b2\n", R2),
    item("src/a.ts", "a2\n", R2),
  ]
  const first = createContextSourceChangeSet({
    kind: "INCREMENTAL", sourceProfileIdentity: SOURCE, previousRevisionIdentity: R1, currentRevisionIdentity: R2,
    added, modified, removed: ["src/c.ts"],
  })
  const second = createContextSourceChangeSet({
    kind: "INCREMENTAL", sourceProfileIdentity: SOURCE, previousRevisionIdentity: R1, currentRevisionIdentity: R2,
    added: [...added].reverse(), modified: [...modified].reverse(), removed: ["src/c.ts"],
  })
  const firstPlan = planContextIndexTransition(previous, first)
  const secondPlan = planContextIndexTransition(previous, second)
  assert.equal(first.changeSetIdentity, second.changeSetIdentity)
  assert.equal(firstPlan.transitionIdentity, secondPlan.transitionIdentity)
  assert.equal(firstPlan.nextState?.stateIdentity, secondPlan.nextState?.stateIdentity)
})

test("incremental add of an existing path fails closed", () => {
  const previous = initialState()
  const change = createContextSourceChangeSet({
    kind: "INCREMENTAL", sourceProfileIdentity: SOURCE, previousRevisionIdentity: R1, currentRevisionIdentity: R2,
    added: [item("src/a.ts", "new a\n", R2)], modified: [], removed: [],
  })
  assert.throws(() => planContextIndexTransition(previous, change), /added path already exists/)
})

test("incremental modification of an absent path fails closed", () => {
  const previous = initialState()
  const change = createContextSourceChangeSet({
    kind: "INCREMENTAL", sourceProfileIdentity: SOURCE, previousRevisionIdentity: R1, currentRevisionIdentity: R2,
    added: [], modified: [item("src/missing.ts", "x\n", R2)], removed: [],
  })
  assert.throws(() => planContextIndexTransition(previous, change), /modified path is absent/)
})

test("incremental removal of an absent path fails closed", () => {
  const previous = initialState()
  const change = createContextSourceChangeSet({
    kind: "INCREMENTAL", sourceProfileIdentity: SOURCE, previousRevisionIdentity: R1, currentRevisionIdentity: R2,
    added: [], modified: [], removed: ["src/missing.ts"],
  })
  assert.throws(() => planContextIndexTransition(previous, change), /remove path is absent/)
})

test("changed item revision must be bound to the current change-set revision", () => {
  const previous = initialState()
  const change = createContextSourceChangeSet({
    kind: "INCREMENTAL", sourceProfileIdentity: SOURCE, previousRevisionIdentity: R1, currentRevisionIdentity: R2,
    added: [item("src/d.ts", "d\n", RX)], modified: [], removed: [],
  })
  assert.throws(() => planContextIndexTransition(previous, change), /sourceRevisionIdentity mismatch/)
})

test("membership state creation rejects items from the wrong revision", () => {
  assert.throws(
    () => createContextIndexMembershipStateFromItems(SOURCE, R1, [item("src/a.ts", "a\n", R2)]),
    /item sourceRevisionIdentity mismatch/,
  )
})

test("serialized membership-state identity mutation is rejected", () => {
  const mutated = structuredClone(initialState()) as unknown as Record<string, unknown>
  mutated.stateIdentity = digest("forged-state")
  assert.throws(() => validateContextIndexMembershipState(mutated), /stateIdentity mismatch/)
})

test("serialized membership-state derived count mutation is rejected", () => {
  const mutated = structuredClone(initialState()) as unknown as Record<string, unknown>
  mutated.entryCount = 99
  assert.throws(() => validateContextIndexMembershipState(mutated), /entryCount mismatch/)
})

test("serialized transition-plan identity mutation is rejected", () => {
  const plan = planContextIndexTransition(initialState(), incrementalChange())
  const mutated = structuredClone(plan) as unknown as Record<string, unknown>
  mutated.transitionIdentity = digest("forged-transition")
  assert.throws(() => validateContextIndexTransitionPlan(mutated), /transitionIdentity mismatch/)
})

test("canonical verification rejects a valid plan replayed against different evidence", () => {
  const previous = initialState()
  const first = incrementalChange()
  const firstPlan = planContextIndexTransition(previous, first)
  const other = createContextSourceChangeSet({
    kind: "UNCHANGED", sourceProfileIdentity: SOURCE, previousRevisionIdentity: R1, currentRevisionIdentity: R2,
  })
  assert.throws(() => verifyContextIndexTransitionPlan(previous, other, firstPlan), /does not match canonical transition/)
})

test("canonical verification accepts the exact transition evidence", () => {
  const previous = initialState()
  const change = incrementalChange()
  const plan = planContextIndexTransition(previous, change)
  assert.equal(verifyContextIndexTransitionPlan(previous, change, plan).transitionIdentity, plan.transitionIdentity)
})

test("state entry-count bound is enforced before entry expansion", () => {
  const one = createContextIndexMembershipEntry(item("src/a.ts", "a\n"))
  assert.throws(
    () => createContextIndexMembershipState({ sourceProfileIdentity: SOURCE, sourceRevisionIdentity: R1, entries: Array(KDO_C12_LIMITS.maxStateEntries + 1).fill(one) }),
    /entry-count bound/,
  )
})

test("C12 production source is pure and imports only crypto plus C11 contracts", () => {
  const source = readFileSync(new URL("../src/context-connectors/indexer-state-machine.ts", import.meta.url), "utf8")
  const imports = [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]).sort()
  assert.deepEqual(imports, ["./contracts.ts", "./contracts.ts", "node:crypto"])
  assert.doesNotMatch(source, /\bprocess\.env\b|\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bchild_process\b/)
  assert.doesNotMatch(source, /\b(?:writeFile|appendFile|createWriteStream|rm|unlink|mkdir)\s*\(/)
  assert.doesNotMatch(source, /@augmentcode\/auggie-sdk|\bDirectContext\b\s*[.(]|\bExecutionGateway\b\s*[.(]/)
})

test("canonical C11 contracts remain byte-identical", () => {
  const raw = readFileSync(new URL("../src/context-connectors/contracts.ts", import.meta.url))
  assert.equal(gitTextBlobSha1(raw), "bd6f1feb57df8cd91ef27082fb40a1bbaa9c51c9")
})
