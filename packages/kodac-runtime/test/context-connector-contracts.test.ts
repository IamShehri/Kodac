import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import test from "node:test"

import {
  CONTEXT_CLIENT_CAPABILITIES,
  CONTEXT_SOURCE_CAPABILITIES,
  CONTEXT_STORE_CAPABILITIES,
  KDO_C11_AUGMENT_DONOR_PROVENANCE,
  KDO_C11_CONTEXT_CONNECTOR_VERSION,
  KDO_C11_LIMITS,
  createContextClientProfile,
  createContextContentItem,
  createContextSourceChangeSet,
  createContextSourceProfile,
  createContextStoreProfile,
  normalizeContextLogicalPath,
  validateContextClientProfile,
  validateContextContentItem,
  validateContextSourceProfile,
  validateContextStoreProfile,
} from "../src/context-connectors/contracts.ts"
import type {
  ContextContentItem,
  ContextSourceProfileInput,
} from "../src/context-connectors/contracts.ts"

const identity = (label: string) => createHash("sha256").update(label, "utf8").digest("hex")

function sourceInput(overrides: Partial<ContextSourceProfileInput> = {}): ContextSourceProfileInput {
  return {
    sourceKind: "versioned_repository",
    sourceId: "org/repo",
    capabilities: ["full_snapshot", "incremental_changes", "list_entries", "read_item", "revision_resolution"],
    sourceConfigIdentity: identity("source-config"),
    provenanceIdentity: identity("source-provenance"),
    sourceRevisionIdentity: identity("source-revision"),
    ...overrides,
  }
}

function item(path: string, content: string, sourceProfileIdentity: string): ContextContentItem {
  return createContextContentItem({
    path,
    content,
    sourceProfileIdentity,
    sourceRevisionIdentity: identity("source-revision"),
  })
}

function clone<T>(value: T): T { return structuredClone(value) }

function gitTextBlobSha1(raw: Buffer): string {
  const canonical = Buffer.from(raw.toString("utf8").replace(/\r\n/g, "\n"), "utf8")
  return createHash("sha1")
    .update(Buffer.from(`blob ${canonical.byteLength}\0`, "utf8"))
    .update(canonical)
    .digest("hex")
}

test("C11 donor provenance pins Augment source contracts exactly", () => {
  assert.equal(KDO_C11_CONTEXT_CONNECTOR_VERSION, "kodac-context-connector-contracts-v1")
  assert.deepEqual(KDO_C11_AUGMENT_DONOR_PROVENANCE, {
    repository: "augmentcode/context-connectors",
    sourceCommit: "f7d6472ae626c98fd768f64cdfd6160145eefa77",
    sourceContracts: [
      { path: "src/sources/types.ts", blob: "d21d61c178607eb28438652eb93911c90aa05aa1" },
      { path: "src/core/types.ts", blob: "c65f4757f0e7492e87fdbb08cbd584e03ed8efde" },
      { path: "src/stores/types.ts", blob: "bcd9cf7c70d2d2ae9e9540889c33fbe13e128838" },
    ],
    intakeMode: "PORT",
  })
})

test("source/store/client capability vocabularies are fixed", () => {
  assert.deepEqual(CONTEXT_SOURCE_CAPABILITIES, ["full_snapshot", "incremental_changes", "list_entries", "read_item", "revision_resolution"])
  assert.deepEqual(CONTEXT_STORE_CAPABILITIES, ["load_full_state", "load_search_state", "list_keys", "save_state", "delete_state"])
  assert.deepEqual(CONTEXT_CLIENT_CAPABILITIES, ["search", "list", "read", "mcp_exposure", "cli_exposure"])
})

test("source capability ordering is canonical and identity-stable", () => {
  const first = createContextSourceProfile(sourceInput({ capabilities: ["read_item", "full_snapshot", "incremental_changes"] }))
  const second = createContextSourceProfile(sourceInput({ capabilities: ["incremental_changes", "read_item", "full_snapshot"] }))
  assert.deepEqual(first.capabilities, ["full_snapshot", "incremental_changes", "read_item"])
  assert.equal(first.sourceProfileIdentity, second.sourceProfileIdentity)
})

test("source identity changes with source id revision configuration or provenance", () => {
  const baseline = createContextSourceProfile(sourceInput())
  for (const changed of [
    sourceInput({ sourceId: "org/other" }),
    sourceInput({ sourceRevisionIdentity: identity("other-revision") }),
    sourceInput({ sourceConfigIdentity: identity("other-config") }),
    sourceInput({ provenanceIdentity: identity("other-provenance") }),
  ]) {
    assert.notEqual(baseline.sourceProfileIdentity, createContextSourceProfile(changed).sourceProfileIdentity)
  }
})

test("duplicate and unknown source capabilities fail closed", () => {
  assert.throws(() => createContextSourceProfile(sourceInput({ capabilities: ["full_snapshot", "full_snapshot"] })), /duplicate capability/)
  assert.throws(() => createContextSourceProfile({ ...sourceInput(), capabilities: ["full_snapshot", "network_admin"] } as never), /unsupported/)
})

test("unknown source profile fields and malformed identities fail closed", () => {
  assert.throws(() => createContextSourceProfile({ ...sourceInput(), token: "secret" } as never), /unknown field: token/)
  assert.throws(() => createContextSourceProfile(sourceInput({ provenanceIdentity: "bad" })), /SHA-256 identity/)
})

test("serialized source profile identity recomputation detects mutation", () => {
  const profile = createContextSourceProfile(sourceInput())
  const mutated = clone(profile) as unknown as Record<string, unknown>
  mutated.sourceId = "other/repo"
  assert.throws(() => validateContextSourceProfile(mutated), /sourceProfileIdentity mismatch/)
})

test("logical path validation rejects absolute traversal alternate separators and NUL", () => {
  assert.equal(normalizeContextLogicalPath("src/core/index.ts"), "src/core/index.ts")
  for (const unsafe of ["/etc/passwd", "C:/repo/file.ts", "../secret", "src/../secret", "src\\file.ts", "src//file.ts", "./src/file.ts", "a\0b"]) {
    assert.throws(() => normalizeContextLogicalPath(unsafe), /relative|unsafe|forward-slash|NUL-free/)
  }
})

test("content byte count and identities are recomputed", () => {
  const source = createContextSourceProfile(sourceInput())
  const created = item("src/hello.ts", "const π = 3.14\n", source.sourceProfileIdentity)
  assert.equal(created.contentBytes, Buffer.byteLength(created.content, "utf8"))
  assert.equal(created.contentIdentity, createHash("sha256").update(created.content, "utf8").digest("hex"))
  const mutated = clone(created) as unknown as Record<string, unknown>
  mutated.content = "changed"
  assert.throws(() => validateContextContentItem(mutated), /contentBytes mismatch|contentIdentity mismatch|itemIdentity mismatch/)
})

test("oversized content fails closed without truncation", () => {
  const source = createContextSourceProfile(sourceInput())
  assert.throws(
    () => createContextContentItem({ path: "large.txt", content: "x".repeat(KDO_C11_LIMITS.maxContentBytes + 1), sourceProfileIdentity: source.sourceProfileIdentity }),
    /exceeds byte bound/,
  )
})

test("FULL_REQUIRED makes full rebuild explicit rather than null", () => {
  const source = createContextSourceProfile(sourceInput())
  const change = createContextSourceChangeSet({
    kind: "FULL_REQUIRED",
    sourceProfileIdentity: source.sourceProfileIdentity,
    previousRevisionIdentity: identity("previous"),
    currentRevisionIdentity: identity("current"),
    reason: "history_rewritten",
  })
  assert.equal(change.kind, "FULL_REQUIRED")
  assert.equal(change.reason, "history_rewritten")
  assert.deepEqual(change.added, [])
  assert.deepEqual(change.modified, [])
  assert.deepEqual(change.removed, [])
  assert.equal(change.itemCount, 0)
})

test("FULL_REQUIRED and UNCHANGED reject hidden incremental fields", () => {
  const source = createContextSourceProfile(sourceInput())
  assert.throws(
    () => createContextSourceChangeSet({ kind: "FULL_REQUIRED", sourceProfileIdentity: source.sourceProfileIdentity, reason: "unknown", added: [] } as never),
    /unknown field: added/,
  )
  assert.throws(
    () => createContextSourceChangeSet({ kind: "UNCHANGED", sourceProfileIdentity: source.sourceProfileIdentity, removed: ["a.ts"] } as never),
    /unknown field: removed/,
  )
})

test("incremental sets canonicalize added modified and removed ordering", () => {
  const source = createContextSourceProfile(sourceInput())
  const first = createContextSourceChangeSet({
    kind: "INCREMENTAL",
    sourceProfileIdentity: source.sourceProfileIdentity,
    previousRevisionIdentity: identity("previous"),
    currentRevisionIdentity: identity("current"),
    added: [item("z.ts", "z", source.sourceProfileIdentity), item("a.ts", "a", source.sourceProfileIdentity)],
    modified: [item("m2.ts", "2", source.sourceProfileIdentity), item("m1.ts", "1", source.sourceProfileIdentity)],
    removed: ["old/z.ts", "old/a.ts"],
  })
  const second = createContextSourceChangeSet({
    kind: "INCREMENTAL",
    sourceProfileIdentity: source.sourceProfileIdentity,
    previousRevisionIdentity: identity("previous"),
    currentRevisionIdentity: identity("current"),
    added: [...first.added].reverse(),
    modified: [...first.modified].reverse(),
    removed: [...first.removed].reverse(),
  })
  assert.deepEqual(first.added.map((x) => x.path), ["a.ts", "z.ts"])
  assert.deepEqual(first.modified.map((x) => x.path), ["m1.ts", "m2.ts"])
  assert.deepEqual(first.removed, ["old/a.ts", "old/z.ts"])
  assert.equal(first.changeSetIdentity, second.changeSetIdentity)
})

test("incremental duplicate and cross-class path overlap fails closed", () => {
  const source = createContextSourceProfile(sourceInput())
  const same = item("same.ts", "a", source.sourceProfileIdentity)
  assert.throws(() => createContextSourceChangeSet({
    kind: "INCREMENTAL",
    sourceProfileIdentity: source.sourceProfileIdentity,
    added: [same, same],
    modified: [],
    removed: [],
  }), /duplicate path/)
  assert.throws(() => createContextSourceChangeSet({
    kind: "INCREMENTAL",
    sourceProfileIdentity: source.sourceProfileIdentity,
    added: [same],
    modified: [],
    removed: ["same.ts"],
  }), /multiple classes/)
})

test("incremental content must bind to the same source profile", () => {
  const source = createContextSourceProfile(sourceInput())
  const other = createContextSourceProfile(sourceInput({ sourceId: "org/other" }))
  assert.throws(() => createContextSourceChangeSet({
    kind: "INCREMENTAL",
    sourceProfileIdentity: source.sourceProfileIdentity,
    added: [item("a.ts", "a", other.sourceProfileIdentity)],
    modified: [],
    removed: [],
  }), /sourceProfileIdentity mismatch/)
})

test("empty incremental set fails closed", () => {
  const source = createContextSourceProfile(sourceInput())
  assert.throws(() => createContextSourceChangeSet({
    kind: "INCREMENTAL",
    sourceProfileIdentity: source.sourceProfileIdentity,
    added: [],
    modified: [],
    removed: [],
  }), /at least one change/)
})

test("incremental item-count bound fails closed", () => {
  const source = createContextSourceProfile(sourceInput())
  const removed = Array.from({ length: KDO_C11_LIMITS.maxChangeEntries + 1 }, (_, index) => `old/${index}.ts`)
  assert.throws(() => createContextSourceChangeSet({ kind: "INCREMENTAL", sourceProfileIdentity: source.sourceProfileIdentity, added: [], modified: [], removed }), /item-count bound/)
})

test("malformed change revision identities fail closed", () => {
  const source = createContextSourceProfile(sourceInput())
  assert.throws(() => createContextSourceChangeSet({ kind: "UNCHANGED", sourceProfileIdentity: source.sourceProfileIdentity, currentRevisionIdentity: "bad" }), /SHA-256 identity/)
})

test("read-only store cannot advertise write capabilities", () => {
  assert.throws(() => createContextStoreProfile({
    storeId: "readonly",
    mode: "read_only",
    capabilities: ["load_search_state", "save_state"],
    storeConfigIdentity: identity("store-config"),
    provenanceIdentity: identity("store-provenance"),
  }), /cannot advertise write capabilities/)
})

test("store profile canonicalizes capabilities and validates identity", () => {
  const first = createContextStoreProfile({
    storeId: "local-store",
    mode: "read_write",
    capabilities: ["save_state", "load_search_state", "load_full_state", "delete_state"],
    storeConfigIdentity: identity("store-config"),
    provenanceIdentity: identity("store-provenance"),
  })
  const second = createContextStoreProfile({
    storeId: "local-store",
    mode: "read_write",
    capabilities: [...first.capabilities].reverse(),
    storeConfigIdentity: identity("store-config"),
    provenanceIdentity: identity("store-provenance"),
  })
  assert.equal(first.storeProfileIdentity, second.storeProfileIdentity)
  const mutated = clone(first) as unknown as Record<string, unknown>
  mutated.storeId = "other"
  assert.throws(() => validateContextStoreProfile(mutated), /storeProfileIdentity mismatch/)
})

test("client exposure modes are deterministic descriptors only", () => {
  const first = createContextClientProfile({
    clientId: "agent-client",
    capabilities: ["mcp_exposure", "read", "search", "list"],
    clientConfigIdentity: identity("client-config"),
    provenanceIdentity: identity("client-provenance"),
  })
  const second = createContextClientProfile({
    clientId: "agent-client",
    capabilities: [...first.capabilities].reverse(),
    clientConfigIdentity: identity("client-config"),
    provenanceIdentity: identity("client-provenance"),
  })
  assert.equal(first.clientProfileIdentity, second.clientProfileIdentity)
  const mutated = clone(first) as unknown as Record<string, unknown>
  mutated.clientId = "other"
  assert.throws(() => validateContextClientProfile(mutated), /clientProfileIdentity mismatch/)
})

test("C11 production source has no donor SDK network process or filesystem-write surface", () => {
  const source = readFileSync(new URL("../src/context-connectors/contracts.ts", import.meta.url), "utf8")
  const imports = [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]).sort()
  assert.deepEqual(imports, ["node:crypto"])
  assert.doesNotMatch(source, /from\s+["']@augmentcode\/auggie-sdk["']/)
  assert.doesNotMatch(source, /\bDirectContext\s*\(/)
  assert.doesNotMatch(source, /\bfetch\s*\(/)
  assert.doesNotMatch(source, /from\s+["']node:(?:fs|child_process|net|http|https)["']/)
  assert.doesNotMatch(source, /\bExecutionGateway\b/)
  assert.doesNotMatch(source, /\b(?:apiToken|apiKey|writeFile|appendFile|createWriteStream)\s*[:=(]/)
})

test("canonical K3 context engine remains byte-identical", () => {
  assert.equal(
    gitTextBlobSha1(readFileSync(new URL("../src/context-engine/context-engine.ts", import.meta.url))),
    "13f16c99f76c133793e5bbc50474197ee1d6e045",
  )
})
