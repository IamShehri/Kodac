import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import test from "node:test"

import {
  KDO_H1_DEEPSEEK_HARNESS_DONOR_PROVENANCE,
  KDO_H1_EXTENSION_CONTRACT_VERSION,
  createExtensionDescriptor,
  validateExtensionDescriptor,
} from "../src/extensions/contracts.ts"
import { ExtensionDescriptorRegistry } from "../src/extensions/registry.ts"

const fixture = (extensionId: string, capabilityId = "context/search") => createExtensionDescriptor({
  extensionId,
  extensionVersion: "1.0.0",
  provenance: {
    sourceType: "DONOR_PORT",
    sourceId: "deepseek-ai/deepseek-harness",
    sourceRevision: "47f943859bef60e4160492346772ded9b24f765a",
    license: "MIT",
    intakeMode: "PORT",
  },
  capabilities: [
    { capabilityId, roles: ["CONSUMER", "DEFINITION"] },
    { capabilityId: "model/chat", roles: ["PROVIDER"] },
  ],
})

function gitBlobSha1(text: string): string {
  const canonical = text.replace(/\r\n/g, "\n")
  const body = Buffer.from(canonical, "utf8")
  return createHash("sha1").update(`blob ${body.byteLength}\0`).update(body).digest("hex")
}

const source = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8")

test("H1 donor provenance is pinned exactly", () => {
  assert.equal(KDO_H1_EXTENSION_CONTRACT_VERSION, "kodac-extension-capability-v1")
  assert.equal(KDO_H1_DEEPSEEK_HARNESS_DONOR_PROVENANCE.repository, "deepseek-ai/deepseek-harness")
  assert.equal(KDO_H1_DEEPSEEK_HARNESS_DONOR_PROVENANCE.sourceCommit, "47f943859bef60e4160492346772ded9b24f765a")
  assert.equal(KDO_H1_DEEPSEEK_HARNESS_DONOR_PROVENANCE.license, "MIT")
  assert.equal(KDO_H1_DEEPSEEK_HARNESS_DONOR_PROVENANCE.intakeMode, "PORT")
})

test("descriptor identity and capability-role ordering are deterministic", () => {
  const first = fixture("kodac/demo")
  const second = createExtensionDescriptor({
    extensionId: "kodac/demo",
    extensionVersion: "1.0.0",
    provenance: {
      sourceType: "DONOR_PORT",
      sourceId: "deepseek-ai/deepseek-harness",
      sourceRevision: "47f943859bef60e4160492346772ded9b24f765a",
      license: "MIT",
      intakeMode: "PORT",
    },
    capabilities: [
      { capabilityId: "model/chat", roles: ["PROVIDER"] },
      { capabilityId: "context/search", roles: ["DEFINITION", "CONSUMER"] },
    ],
  })
  assert.equal(first.descriptorIdentity, second.descriptorIdentity)
  assert.deepEqual(first.capabilities.map((entry) => entry.capabilityId), ["context/search", "model/chat"])
  assert.deepEqual(first.capabilities[0]?.roles, ["DEFINITION", "CONSUMER"])
})

test("malformed descriptors, unknown fields, and duplicates fail closed", () => {
  assert.throws(() => createExtensionDescriptor({
    extensionId: "NotNamespaced" as never,
    extensionVersion: "1.0.0",
    provenance: { sourceType: "DONOR_PORT", sourceId: "x", sourceRevision: "rev", license: "MIT", intakeMode: "PORT" },
    capabilities: [{ capabilityId: "context/search", roles: ["PROVIDER"] }],
  }))
  assert.throws(() => createExtensionDescriptor({
    extensionId: "kodac/demo",
    extensionVersion: "1.0.0",
    provenance: { sourceType: "DONOR_PORT", sourceId: "x", sourceRevision: "rev", license: "MIT", intakeMode: "PORT" },
    capabilities: [
      { capabilityId: "context/search", roles: ["PROVIDER"] },
      { capabilityId: "context/search", roles: ["CONSUMER"] },
    ],
  }))
  assert.throws(() => createExtensionDescriptor({
    extensionId: "kodac/demo",
    extensionVersion: "1.0.0",
    provenance: { sourceType: "DONOR_PORT", sourceId: "x", sourceRevision: "rev", license: "MIT", intakeMode: "PORT" },
    capabilities: [{ capabilityId: "context/search", roles: ["PROVIDER", "PROVIDER"] }],
  }))
  const valid = fixture("kodac/demo")
  assert.throws(() => validateExtensionDescriptor({ ...valid, unexpectedAuthority: true }))
  assert.throws(() => validateExtensionDescriptor({ ...valid, descriptorIdentity: "0".repeat(64) }))
})

test("registry is deterministic and duplicate registration fails closed", () => {
  const registry = new ExtensionDescriptorRegistry()
  const beta = registry.register(fixture("kodac/beta"))
  const alpha = registry.register(fixture("kodac/alpha"))
  assert.equal(registry.size, 2)
  assert.deepEqual(registry.list().map((entry) => entry.extensionId), ["kodac/alpha", "kodac/beta"])
  assert.deepEqual(registry.findByCapability("context/search").map((entry) => entry.extensionId), ["kodac/alpha", "kodac/beta"])
  assert.deepEqual(registry.findByCapability("model/chat", "PROVIDER").map((entry) => entry.extensionId), ["kodac/alpha", "kodac/beta"])
  assert.throws(() => registry.register(fixture("kodac/alpha", "repo/read")))
  assert.equal(alpha.extensionId, "kodac/alpha")
  assert.equal(beta.extensionId, "kodac/beta")
})

test("disposal is ownership-safe idempotent and stale receipts cannot remove replacements", () => {
  const registry = new ExtensionDescriptorRegistry()
  const descriptor = fixture("kodac/demo")
  const first = registry.register(descriptor)
  assert.equal(registry.dispose(first), true)
  assert.equal(registry.dispose(first), false)
  const replacement = registry.register(descriptor)
  assert.notEqual(first.registrationSerial, replacement.registrationSerial)
  assert.equal(registry.dispose(first), false)
  assert.equal(registry.has("kodac/demo"), true)
  assert.equal(registry.dispose(replacement), true)
  assert.equal(registry.has("kodac/demo"), false)
})

test("registry outputs are immutable snapshots rather than internal aliases", () => {
  const registry = new ExtensionDescriptorRegistry()
  registry.register(fixture("kodac/demo"))
  const descriptor = registry.get("kodac/demo")
  assert.ok(descriptor)
  assert.equal(Object.isFrozen(descriptor), true)
  assert.equal(Object.isFrozen(descriptor.provenance), true)
  assert.equal(Object.isFrozen(descriptor.capabilities), true)
  assert.equal(Object.isFrozen(descriptor.capabilities[0]?.roles), true)
  assert.equal(Object.isFrozen(registry.list()), true)
})

test("published schema mirrors descriptor and registration receipt contracts", () => {
  const schema = JSON.parse(source("../../../schema/kdo-extension-capability.schema.json")) as Record<string, unknown>
  const oneOf = schema.oneOf as readonly Record<string, unknown>[]
  assert.deepEqual(oneOf.map((entry) => entry.$ref), ["#/$defs/extensionDescriptor", "#/$defs/registrationReceipt"])
  const defs = schema.$defs as Record<string, Record<string, unknown>>
  const descriptor = defs.extensionDescriptor as Record<string, unknown>
  const receipt = defs.registrationReceipt as Record<string, unknown>
  assert.equal(descriptor.type, "object")
  assert.equal(descriptor.additionalProperties, false)
  assert.equal(receipt.type, "object")
  assert.equal(receipt.additionalProperties, false)
  const descriptorProperties = descriptor.properties as Record<string, Record<string, unknown>>
  const receiptProperties = receipt.properties as Record<string, Record<string, unknown>>
  assert.equal(descriptorProperties.version?.const, KDO_H1_EXTENSION_CONTRACT_VERSION)
  assert.equal(receiptProperties.version?.const, "kodac-extension-registration-v1")
  const provenance = defs.provenance as Record<string, unknown>
  assert.equal(provenance.additionalProperties, false)
})

test("H1 production surface is descriptive only and canonical authority surfaces remain unchanged", () => {
  const contracts = source("../src/extensions/contracts.ts")
  const registry = source("../src/extensions/registry.ts")
  assert.deepEqual([...contracts.matchAll(/^import .* from "([^"]+)"/gm)].map((match) => match[1]), ["node:crypto"])
  assert.deepEqual([...registry.matchAll(/from "([^"]+)"/gm)].map((match) => match[1]), ["./contracts.ts"])
  for (const text of [contracts, registry]) {
    assert.doesNotMatch(text, /\b(?:eval|Function|fetch|ExecutionGateway|RuntimeTool|child_process|worker_threads)\b/)
  }
  assert.equal(gitBlobSha1(source("../src/execution/gateway.ts")), "be5926e9a8dc5c4c29d441dac11661d71e797015")
  assert.equal(gitBlobSha1(source("../src/verification/done-gate.ts")), "067e147569fa52cc2b04c5df26fbe20a01e958e9")
  assert.equal(gitBlobSha1(source("../src/tools/registry.ts")), "0bdf5cfd02efda7cab0c81976c7735bc7b46081b")
  assert.equal(gitBlobSha1(source("../src/model/provider.ts")), "a15f1d86ceab88ab6fa1be787719d222e354e0c4")
})
