import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import test from "node:test"

import {
  KDO_C6_CONTINUE_DONOR_PROVENANCE,
  KDO_C6_MODEL_CAPABILITY_VERSION,
  MODEL_CAPABILITIES,
  checkModelCapabilities,
  createModelCapabilityProfile,
  modelSupports,
  selectModelCapabilityProfiles,
  validateModelCapabilityProfile,
} from "../src/model/capabilities.ts"
import type { ModelCapabilityProfile, ModelCapabilityProfileInput } from "../src/model/capabilities.ts"

const sha256 = (value: string) => createHash("sha256").update(value, "utf8").digest("hex")
const sourceIdentity = (label: string) => sha256(label)

function input(overrides: Partial<ModelCapabilityProfileInput> = {}): ModelCapabilityProfileInput {
  return {
    providerId: "fixture-provider",
    modelId: "fixture-model",
    capabilities: ["chat", "streaming", "tool_calling", "token_counting"],
    contextWindowTokens: 128_000,
    maxOutputTokens: 16_384,
    profileSource: "configured",
    profileSourceIdentity: sourceIdentity("fixture-source"),
    ...overrides,
  }
}

function clone<T>(value: T): T { return structuredClone(value) }

function gitTextBlobSha1(raw: Buffer): string {
  const canonical = Buffer.from(raw.toString("utf8").replace(/\r\n/g, "\n"), "utf8")
  return createHash("sha1")
    .update(Buffer.from(`blob ${canonical.byteLength}\0`, "utf8"))
    .update(canonical)
    .digest("hex")
}

test("KDO-C6 exposes the authorized canonical capability vocabulary", () => {
  assert.equal(KDO_C6_MODEL_CAPABILITY_VERSION, "kodac-model-capabilities-v1")
  assert.deepEqual(MODEL_CAPABILITIES, [
    "chat",
    "completion",
    "streaming",
    "fill_in_middle",
    "prefill",
    "image_input",
    "tool_calling",
    "embedding",
    "reranking",
    "token_counting",
    "model_listing",
  ])
})

test("Continue donor provenance is pinned exactly", () => {
  assert.deepEqual(KDO_C6_CONTINUE_DONOR_PROVENANCE, {
    repository: "continuedev/continue",
    sourceCommit: "5522c6f44ca0ac3528b37244818fbfa39b5af470",
    sourcePath: "core/config/types.ts",
    sourceBlob: "2500042e88706adfc09fdfc40cec33248ab7dae5",
    intakeMode: "PORT",
  })
})

test("capability ordering canonicalizes deterministically", () => {
  const first = createModelCapabilityProfile(input({ capabilities: ["tool_calling", "chat", "streaming"] }))
  const second = createModelCapabilityProfile(input({ capabilities: ["streaming", "tool_calling", "chat"] }))
  assert.deepEqual(first.capabilities, ["chat", "streaming", "tool_calling"])
  assert.equal(first.profileIdentity, second.profileIdentity)
})

test("semantically identical profiles produce the same identity", () => {
  assert.equal(createModelCapabilityProfile(input()).profileIdentity, createModelCapabilityProfile({ ...input() }).profileIdentity)
})

test("provider mutation changes profile identity", () => {
  assert.notEqual(createModelCapabilityProfile(input()).profileIdentity, createModelCapabilityProfile(input({ providerId: "other" })).profileIdentity)
})

test("model mutation changes profile identity", () => {
  assert.notEqual(createModelCapabilityProfile(input()).profileIdentity, createModelCapabilityProfile(input({ modelId: "other" })).profileIdentity)
})

test("capability mutation changes profile identity", () => {
  assert.notEqual(
    createModelCapabilityProfile(input()).profileIdentity,
    createModelCapabilityProfile(input({ capabilities: ["chat", "streaming"] })).profileIdentity,
  )
})

test("limit mutation changes profile identity", () => {
  assert.notEqual(
    createModelCapabilityProfile(input()).profileIdentity,
    createModelCapabilityProfile(input({ contextWindowTokens: 256_000 })).profileIdentity,
  )
})

test("provenance-source mutation changes profile identity", () => {
  assert.notEqual(
    createModelCapabilityProfile(input()).profileIdentity,
    createModelCapabilityProfile(input({ profileSourceIdentity: sourceIdentity("other") })).profileIdentity,
  )
})

test("duplicate capabilities fail closed", () => {
  assert.throws(
    () => createModelCapabilityProfile(input({ capabilities: ["chat", "chat"] })),
    /duplicate capability/,
  )
})

test("unknown capabilities fail closed", () => {
  assert.throws(
    () => createModelCapabilityProfile({ ...input(), capabilities: ["chat", "shell_access"] } as never),
    /unsupported model capability/,
  )
})

test("unknown profile input fields fail closed", () => {
  assert.throws(
    () => createModelCapabilityProfile({ ...input(), apiKey: "secret" } as never),
    /unknown field: apiKey/,
  )
})

test("empty provider and model identifiers fail closed", () => {
  assert.throws(() => createModelCapabilityProfile(input({ providerId: "" })), /providerId must be a non-empty string/)
  assert.throws(() => createModelCapabilityProfile(input({ modelId: "" })), /modelId must be a non-empty string/)
})

test("malformed profile source identity fails closed", () => {
  assert.throws(() => createModelCapabilityProfile(input({ profileSourceIdentity: "not-a-digest" })), /SHA-256 identity/)
})

test("invalid numeric token limits fail closed", () => {
  for (const bad of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => createModelCapabilityProfile(input({ contextWindowTokens: bad })), /positive safe integer/)
  }
})

test("max output tokens cannot exceed context window", () => {
  assert.throws(
    () => createModelCapabilityProfile(input({ contextWindowTokens: 8_000, maxOutputTokens: 8_001 })),
    /must not exceed contextWindowTokens/,
  )
})

test("profile identity recomputation detects mutation", () => {
  const profile = createModelCapabilityProfile(input())
  const mutated = clone(profile) as unknown as Record<string, unknown>
  mutated.modelId = "mutated"
  assert.throws(() => validateModelCapabilityProfile(mutated), /profileIdentity mismatch/)
})

test("unknown serialized profile fields fail closed", () => {
  const profile = clone(createModelCapabilityProfile(input())) as unknown as Record<string, unknown>
  profile.apiBase = "https://example.invalid"
  assert.throws(() => validateModelCapabilityProfile(profile), /unknown field: apiBase/)
})

test("required capability checks are canonical and deterministic", () => {
  const profile = createModelCapabilityProfile(input())
  assert.deepEqual(checkModelCapabilities(profile, ["tool_calling", "chat"]), {
    supported: true,
    required: ["chat", "tool_calling"],
    missing: [],
  })
  assert.deepEqual(checkModelCapabilities(profile, ["embedding", "chat", "fill_in_middle"]), {
    supported: false,
    required: ["chat", "embedding", "fill_in_middle"],
    missing: ["embedding", "fill_in_middle"],
  })
})

test("modelSupports is a pure boolean helper", () => {
  const profile = createModelCapabilityProfile(input())
  assert.equal(modelSupports(profile, "chat", "streaming"), true)
  assert.equal(modelSupports(profile, "embedding"), false)
})

test("profile selection is deterministic across input order", () => {
  const profiles: ModelCapabilityProfile[] = [
    createModelCapabilityProfile(input({ providerId: "z-provider", modelId: "z", capabilities: ["chat", "embedding"] })),
    createModelCapabilityProfile(input({ providerId: "a-provider", modelId: "b", capabilities: ["chat", "embedding"] })),
    createModelCapabilityProfile(input({ providerId: "a-provider", modelId: "a", capabilities: ["chat", "embedding"] })),
    createModelCapabilityProfile(input({ providerId: "m-provider", modelId: "m", capabilities: ["chat"] })),
  ]
  const selected = selectModelCapabilityProfiles([...profiles].reverse(), ["embedding", "chat"])
  assert.deepEqual(selected.map(({ providerId, modelId }) => `${providerId}/${modelId}`), [
    "a-provider/a",
    "a-provider/b",
    "z-provider/z",
  ])
})

test("duplicate profile identities fail closed during selection", () => {
  const profile = createModelCapabilityProfile(input())
  assert.throws(() => selectModelCapabilityProfiles([profile, profile], ["chat"]), /duplicate model capability profile identity/)
})

test("capability negotiation source remains pure and contains no ambient authority", () => {
  const source = readFileSync(new URL("../src/model/capabilities.ts", import.meta.url), "utf8")
  const imports = [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]).sort()
  assert.deepEqual(imports, ["node:crypto"])
  assert.doesNotMatch(source, /\bfetch\s*\(/)
  assert.doesNotMatch(source, /\bnew\s+(?:XMLHttpRequest|WebSocket)\b/)
  assert.doesNotMatch(source, /from\s+["']node:child_process["']/)
  assert.doesNotMatch(source, /\bExecutionGateway\b/)
  assert.doesNotMatch(source, /\bapi(?:Key|Base)\s*[:=]/)
  assert.doesNotMatch(source, /\b(?:writeFile|appendFile|createWriteStream)\s*\(/)
})

test("existing canonical model provider and transports remain byte-identical", () => {
  const expected = new Map([
    ["../src/model/provider.ts", "a15f1d86ceab88ab6fa1be787719d222e354e0c4"],
    ["../src/model/openai.ts", "564851b2dc8cd1aa610fbc7eaa4b5be5853f97f4"],
    ["../src/model/openai-compatible.ts", "7ed56c7bac8e03d315b465e1f173ad934227051f"],
    ["../src/model/turn.ts", "628334fb4edb7b3e4bcfcb090b8e709835096b3b"],
  ])
  for (const [path, expectedBlob] of expected) {
    assert.equal(gitTextBlobSha1(readFileSync(new URL(path, import.meta.url))), expectedBlob, path)
  }
})
