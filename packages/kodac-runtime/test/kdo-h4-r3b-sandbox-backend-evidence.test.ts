import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import test from "node:test"

import { createConfinementRequest } from "../src/trust/confinement.ts"
import {
  KDO_H4_R3A_NETWORK_MODE,
  createSandboxEntrypoint,
  createSandboxNetworkPolicy,
  createSandboxOciImageSource,
  createSandboxResourcePolicy,
  createSandboxWorkloadRequest,
} from "../src/trust/sandbox-workload.ts"
import {
  KDO_H4_R3B_BACKEND_CAPABILITY_VERSION,
  KDO_H4_R3B_BACKEND_FAMILY,
  KDO_H4_R3B_BACKEND_OBSERVATION_VERSION,
  KDO_H4_R3B_CREDENTIAL_MODE,
  KDO_H4_R3B_DOWNGRADE_POLICY,
  KDO_H4_R3B_EXECUTION_EVIDENCE_VERSION,
  KDO_H4_R3B_EXECUTION_REQUIREMENT_VERSION,
  KDO_H4_R3B_LIMITS,
  KDO_H4_R3B_SEMANTIC_RUNTIME_CLASSES,
  createSandboxBackendCapabilityDeclaration,
  createSandboxBackendObservation,
  createSandboxExecutionEvidence,
  createSandboxExecutionRequirement,
  validateSandboxBackendCapabilityDeclaration,
  validateSandboxBackendObservation,
  validateSandboxExecutionEvidence,
  validateSandboxExecutionRequirement,
  type SandboxBackendCapabilityDeclaration,
  type SandboxExecutionRequirement,
} from "../src/trust/sandbox-backend-evidence.ts"

const source = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8")

function gitBlobSha1(text: string): string {
  const canonical = text.replace(/\r\n/g, "\n")
  const body = Buffer.from(canonical, "utf8")
  return createHash("sha1").update(`blob ${body.byteLength}\0`).update(body).digest("hex")
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

const FIXTURE_DIGEST = `sha256:${"1".repeat(64)}`
const OTHER_DIGEST = `sha256:${"2".repeat(64)}`
const WORKSPACE_IDENTITY = "a".repeat(64)
const EXECUTION_INTENT_IDENTITY = "b".repeat(64)
const IMPLEMENTATION_IDENTITY = "c".repeat(64)
const OBSERVER_IDENTITY = "d".repeat(64)
const EXECUTION_INSTANCE_IDENTITY = "e".repeat(64)

function fixtureWorkload() {
  const confinement = createConfinementRequest({
    mode: "read-only",
    workspaceIdentity: WORKSPACE_IDENTITY,
    executionIntentIdentity: EXECUTION_INTENT_IDENTITY,
    scope: { readPaths: ["src"], writePaths: [] },
  })
  return createSandboxWorkloadRequest({
    source: createSandboxOciImageSource({
      repository: "ghcr.io/acme/kodac-fixture",
      digest: FIXTURE_DIGEST,
    }),
    entrypoint: createSandboxEntrypoint({ executable: "/usr/bin/node", args: ["--version", "é"] }),
    resourcePolicy: createSandboxResourcePolicy({
      cpuMillis: 1000,
      memoryBytes: 536870912,
      ttlMs: 60000,
      maxOutputBytes: 1048576,
    }),
    networkPolicy: createSandboxNetworkPolicy({ mode: KDO_H4_R3A_NETWORK_MODE }),
    confinement,
    credentialBindingIdentity: null,
  })
}

type CapabilityInput = Parameters<typeof createSandboxBackendCapabilityDeclaration>[0]
type ObservationInput = Parameters<typeof createSandboxBackendObservation>[0]

function capabilityInput(overrides: Partial<CapabilityInput> = {}): CapabilityInput {
  return {
    providerId: "fixture-secure-oci",
    implementationIdentity: IMPLEMENTATION_IDENTITY,
    semanticRuntimeClasses: ["gvisor", "kata-firecracker", "kata-qemu"],
    supportsImmutableImageDigestObservation: true,
    supportsDenyAllNetworkObservation: true,
    supportsCpuBudgetObservation: true,
    supportsMemoryLimitObservation: true,
    supportsTtlObservation: true,
    supportsOutputLimitObservation: true,
    ...overrides,
  }
}

function fixtureCapability(overrides: Partial<CapabilityInput> = {}): SandboxBackendCapabilityDeclaration {
  return createSandboxBackendCapabilityDeclaration(capabilityInput(overrides))
}

function fixtureRequirement(runtime: "gvisor" | "kata-firecracker" | "kata-qemu" = "gvisor"): SandboxExecutionRequirement {
  return createSandboxExecutionRequirement({ workload: fixtureWorkload(), requiredSemanticRuntimeClass: runtime })
}

function observationInput(
  requirement: SandboxExecutionRequirement,
  capability: SandboxBackendCapabilityDeclaration,
  overrides: Partial<ObservationInput> = {},
): ObservationInput {
  return {
    requirementIdentity: requirement.requirementIdentity,
    workloadIdentity: requirement.workload.workloadIdentity,
    capabilityIdentity: capability.capabilityIdentity,
    observerIdentity: OBSERVER_IDENTITY,
    executionInstanceIdentity: EXECUTION_INSTANCE_IDENTITY,
    observedSourceDigest: requirement.workload.source.digest,
    observedSemanticRuntimeClass: requirement.requiredSemanticRuntimeClass,
    observedNetworkPolicy: requirement.workload.networkPolicy,
    observedResourcePolicy: requirement.workload.resourcePolicy,
    observedCredentialBindingIdentity: null,
    downgradeOccurred: false,
    ...overrides,
  }
}

function fixtureObservation(
  requirement: SandboxExecutionRequirement,
  capability: SandboxBackendCapabilityDeclaration,
  overrides: Partial<ObservationInput> = {},
) {
  return createSandboxBackendObservation(observationInput(requirement, capability, overrides))
}

test("H4-R3B constants protected authority and pure dependency boundary are exact", () => {
  assert.equal(KDO_H4_R3B_BACKEND_CAPABILITY_VERSION, "kodac-h4-r3b-backend-capability-v1")
  assert.equal(KDO_H4_R3B_EXECUTION_REQUIREMENT_VERSION, "kodac-h4-r3b-execution-requirement-v1")
  assert.equal(KDO_H4_R3B_BACKEND_OBSERVATION_VERSION, "kodac-h4-r3b-backend-observation-v1")
  assert.equal(KDO_H4_R3B_EXECUTION_EVIDENCE_VERSION, "kodac-h4-r3b-execution-evidence-v1")
  assert.equal(KDO_H4_R3B_BACKEND_FAMILY, "oci-container")
  assert.equal(KDO_H4_R3B_CREDENTIAL_MODE, "none")
  assert.equal(KDO_H4_R3B_DOWNGRADE_POLICY, "forbid")
  assert.deepEqual(KDO_H4_R3B_LIMITS, { maxProviderIdBytes: 128, maxSemanticRuntimeClasses: 3 })
  assert.deepEqual(KDO_H4_R3B_SEMANTIC_RUNTIME_CLASSES, ["gvisor", "kata-firecracker", "kata-qemu"])

  assert.equal(
    gitBlobSha1(source("../../../docs/planning/KODAC_KDO_H4_R3B_SANDBOX_BACKEND_CAPABILITY_EXECUTION_EVIDENCE_AUTHORIZATION_2026-08-15.md")),
    "3f615a234d1435cf82135f4d4e9339e213549c99",
  )
  assert.equal(
    gitBlobSha1(source("../../../schema/kdo-h4-r3a-sandbox-workload.schema.json")),
    "b8f5b8b97a49e550bfe036b73d259b0826ec75bd",
  )

  const protectedBlobs: Record<string, string> = {
    "../src/trust/sandbox-workload.ts": "84ee9f8ec49bd5e187d564ae4433cfe0a44f7af8",
    "../src/trust/approval.ts": "d36a604cb1957bc65dac3978c626ba48a9b299fb",
    "../src/trust/confinement.ts": "873f235120645c0a12f10a5bff7e9591db6bb341",
    "../src/trust/confinement-linux-landlock.ts": "94b325f73246514f31b950ba4fed38023e3e3cfc",
    "../src/trust/confinement-runtime.ts": "1ca0313fb25c62e549445ebcf1aef029b18e6b86",
    "../src/execution/gateway.ts": "ecf9cc9d3eda6a2280a280ed2f9a2e472f397560",
    "../src/evidence/receipt.ts": "214403398751c9d22bf695786c7fd7c6fd7e35e1",
    "../src/verification/done-gate.ts": "067e147569fa52cc2b04c5df26fbe20a01e958e9",
    "../src/agent/loop.ts": "576ad425db7e845b9705c982e95dd4f7522f8c43",
    "../package.json": "af4c20a3dae387c15cc5fb2eb28d415c8f115b95",
    "../scripts/run-tests.mjs": "9a0bcde0e565168c78eb7fe4d3cf08236d24baa7",
    "../THIRD_PARTY_NOTICES.md": "aaa1ce56d27f5b7dd185f9aaa257d978c2a56c76",
  }
  for (const [path, expected] of Object.entries(protectedBlobs)) {
    assert.equal(gitBlobSha1(source(path)), expected, `${path} must remain byte-identical`)
  }

  const production = source("../src/trust/sandbox-backend-evidence.ts")
  const imports = [...production.matchAll(/from "([^"]+)"|import "([^"]+)"/g)].map((match) => match[1] ?? match[2])
  assert.deepEqual(imports, ["node:crypto", "node:util", "./sandbox-workload.ts"])
})

test("H4-R3B four normative fixed identity vectors are exact and outputs are frozen", () => {
  const capability = fixtureCapability()
  const requirement = fixtureRequirement()
  const observation = fixtureObservation(requirement, capability)
  const evidence = createSandboxExecutionEvidence({ requirement, capability, observation })

  assert.equal(capability.capabilityIdentity, "b23c759edd03197380e0c9e5a1382c364eba4ed68ec33cada226d6878248f7c1")
  assert.equal(requirement.requirementIdentity, "46a11674fd3d973204bdaa8aa140076b5e45b84c276cb66cbb453c0b0b4cbc7f")
  assert.equal(observation.observationIdentity, "96031bfde14a9826978c7eb65f59463aab24d395b955bd5e07ea69c9d191dac7")
  assert.equal(evidence.evidenceIdentity, "baae3419934f5862c458e376999c2fe962ce2aca2745fd2a794e4007761c5e9f")

  assert.deepEqual(validateSandboxBackendCapabilityDeclaration(capability), capability)
  assert.deepEqual(validateSandboxExecutionRequirement(requirement), requirement)
  assert.deepEqual(validateSandboxBackendObservation(observation), observation)
  assert.deepEqual(validateSandboxExecutionEvidence(evidence), evidence)

  for (const value of [capability, capability.semanticRuntimeClasses, requirement, requirement.workload, observation, observation.observedNetworkPolicy, observation.observedResourcePolicy, evidence]) {
    assert.equal(Object.isFrozen(value), true)
  }
})

test("H4-R3B capability runtime ordering is canonical bounded detached and fail-closed", () => {
  const classes = ["gvisor", "kata-firecracker", "kata-qemu"] as const
  const mutable = [...classes] as Array<(typeof classes)[number]>
  const capability = fixtureCapability({ semanticRuntimeClasses: mutable })
  mutable[0] = "kata-qemu"
  assert.deepEqual(capability.semanticRuntimeClasses, classes)

  for (const semanticRuntimeClasses of [
    ["kata-qemu", "gvisor"],
    ["kata-firecracker", "gvisor"],
    ["gvisor", "gvisor"],
    [],
    ["runc"],
    ["fallback"],
    ["unknown"],
  ]) {
    assert.throws(() => fixtureCapability({ semanticRuntimeClasses: semanticRuntimeClasses as never }))
  }

  const sparse = new Array(1)
  assert.throws(() => fixtureCapability({ semanticRuntimeClasses: sparse as never }), /dense/)
  const extra = ["gvisor"] as string[] & { extra?: boolean }
  extra.extra = true
  assert.throws(() => fixtureCapability({ semanticRuntimeClasses: extra as never }), /unexpected array field/)

  assert.doesNotThrow(() => fixtureCapability({ providerId: "a".repeat(128) }))
  for (const providerId of ["", "A", "a/b", "a b", "a".repeat(129), "é"]) {
    assert.throws(() => fixtureCapability({ providerId }))
  }
})

test("H4-R3B requirement accepts only full canonical R3A workload and secure runtime classes", () => {
  const workload = fixtureWorkload()
  assert.equal(createSandboxExecutionRequirement({ workload, requiredSemanticRuntimeClass: "gvisor" }).workload.workloadIdentity, workload.workloadIdentity)
  assert.throws(() => createSandboxExecutionRequirement({ workload, requiredSemanticRuntimeClass: "runc" as never }))
  assert.throws(() => createSandboxExecutionRequirement({ workload, requiredSemanticRuntimeClass: "fallback" as never }))
  assert.throws(() => createSandboxExecutionRequirement({ workload, requiredSemanticRuntimeClass: "unknown" as never }))

  const duplicate = { workload, requiredSemanticRuntimeClass: "gvisor", workloadIdentity: workload.workloadIdentity }
  assert.throws(() => createSandboxExecutionRequirement(duplicate as never), /contain exactly/)
  assert.throws(() => createSandboxExecutionRequirement({ workload: workload.workloadIdentity as never, requiredSemanticRuntimeClass: "gvisor" }))

  for (const field of ["workloadIdentity", "executionIntentIdentity", "confinementRequestIdentity"] as const) {
    const broken = clone(workload) as typeof workload & Record<string, unknown>
    broken[field] = "f".repeat(64)
    assert.throws(() => createSandboxExecutionRequirement({ workload: broken, requiredSemanticRuntimeClass: "gvisor" }), field)
  }

  const brokenNetwork = clone(workload)
  ;(brokenNetwork.networkPolicy as { networkPolicyIdentity: string }).networkPolicyIdentity = "f".repeat(64)
  assert.throws(() => createSandboxExecutionRequirement({ workload: brokenNetwork, requiredSemanticRuntimeClass: "gvisor" }), /network policy identity/)

  const brokenResource = clone(workload)
  ;(brokenResource.resourcePolicy as { resourcePolicyIdentity: string }).resourcePolicyIdentity = "f".repeat(64)
  assert.throws(() => createSandboxExecutionRequirement({ workload: brokenResource, requiredSemanticRuntimeClass: "gvisor" }), /resource policy identity/)
})

test("H4-R3B evidence rejects runtime source network resource credential and downgrade mismatches", () => {
  const capability = fixtureCapability()
  const requirement = fixtureRequirement()

  const runtimeMismatch = fixtureObservation(requirement, capability, { observedSemanticRuntimeClass: "kata-qemu" })
  assert.throws(() => createSandboxExecutionEvidence({ requirement, capability, observation: runtimeMismatch }), /runtime class mismatch/)

  const kataRequirement = fixtureRequirement("kata-firecracker")
  const wrongRuntime = fixtureObservation(kataRequirement, capability, { observedSemanticRuntimeClass: "gvisor" })
  assert.throws(() => createSandboxExecutionEvidence({ requirement: kataRequirement, capability, observation: wrongRuntime }), /runtime class mismatch/)

  const sourceMismatch = fixtureObservation(requirement, capability, { observedSourceDigest: OTHER_DIGEST })
  assert.throws(() => createSandboxExecutionEvidence({ requirement, capability, observation: sourceMismatch }), /source digest mismatch/)

  const forgedNetwork = clone(requirement.workload.networkPolicy)
  ;(forgedNetwork as { networkPolicyIdentity: string }).networkPolicyIdentity = "f".repeat(64)
  assert.throws(() => createSandboxBackendObservation(observationInput(requirement, capability, { observedNetworkPolicy: forgedNetwork })), /network policy identity/)

  const resourceCases = [
    { cpuMillis: 1001, memoryBytes: 536870912, ttlMs: 60000, maxOutputBytes: 1048576 },
    { cpuMillis: 1000, memoryBytes: 536870913, ttlMs: 60000, maxOutputBytes: 1048576 },
    { cpuMillis: 1000, memoryBytes: 536870912, ttlMs: 60001, maxOutputBytes: 1048576 },
    { cpuMillis: 1000, memoryBytes: 536870912, ttlMs: 60000, maxOutputBytes: 1048577 },
  ]
  for (const policy of resourceCases) {
    const observation = fixtureObservation(requirement, capability, { observedResourcePolicy: createSandboxResourcePolicy(policy) })
    assert.throws(() => createSandboxExecutionEvidence({ requirement, capability, observation }), /resource policy/)
  }

  assert.throws(() => createSandboxBackendObservation(observationInput(requirement, capability, { observedCredentialBindingIdentity: "f".repeat(64) as never })), /must be null/)
  assert.throws(() => createSandboxBackendObservation(observationInput(requirement, capability, { downgradeOccurred: true as never })), /downgradeOccurred=false/)
})

test("H4-R3B evidence rejects each insufficient capability and cross-identity mismatch", () => {
  const supportKeys = [
    "supportsImmutableImageDigestObservation",
    "supportsDenyAllNetworkObservation",
    "supportsCpuBudgetObservation",
    "supportsMemoryLimitObservation",
    "supportsTtlObservation",
    "supportsOutputLimitObservation",
  ] as const
  const requirement = fixtureRequirement()

  for (const key of supportKeys) {
    const capability = fixtureCapability({ [key]: false })
    const observation = fixtureObservation(requirement, capability)
    assert.throws(() => createSandboxExecutionEvidence({ requirement, capability, observation }), /capability is insufficient/, key)
  }

  const capability = fixtureCapability()
  const otherCapability = fixtureCapability({ providerId: "fixture-other" })
  const wrongCapabilityObservation = fixtureObservation(requirement, otherCapability)
  assert.throws(() => createSandboxExecutionEvidence({ requirement, capability, observation: wrongCapabilityObservation }), /capability identity mismatch/)

  const otherRequirement = createSandboxExecutionRequirement({ workload: fixtureWorkload(), requiredSemanticRuntimeClass: "kata-qemu" })
  const wrongRequirementObservation = fixtureObservation(otherRequirement, capability)
  assert.throws(() => createSandboxExecutionEvidence({ requirement, capability, observation: wrongRequirementObservation }), /requirement identity mismatch/)
})

test("H4-R3B rejects hostile object shapes before semantic acceptance", () => {
  const normal = capabilityInput()
  assert.throws(() => createSandboxBackendCapabilityDeclaration(new Proxy(normal, {}) as never), /non-proxy/)

  const customPrototype = Object.assign(Object.create({ inherited: true }), normal)
  assert.throws(() => createSandboxBackendCapabilityDeclaration(customPrototype as never), /plain object/)

  const accessor = { ...normal } as Record<string, unknown>
  Object.defineProperty(accessor, "providerId", { enumerable: true, get: () => "fixture-secure-oci" })
  assert.throws(() => createSandboxBackendCapabilityDeclaration(accessor as never), /data property/)

  const symbol = { ...normal } as Record<PropertyKey, unknown>
  symbol[Symbol("x")] = true
  assert.throws(() => createSandboxBackendCapabilityDeclaration(symbol as never), /symbol fields/)

  const nonEnumerable = { ...normal } as Record<string, unknown>
  Object.defineProperty(nonEnumerable, "providerId", { enumerable: false, value: "fixture-secure-oci" })
  assert.throws(() => createSandboxBackendCapabilityDeclaration(nonEnumerable as never), /enumerable/)

  const extra = { ...normal, unexpected: true }
  assert.throws(() => createSandboxBackendCapabilityDeclaration(extra as never), /contain exactly/)
})

test("H4-R3B schema pins R3A locally and admits only seven canonical runtime arrays", () => {
  const schema = JSON.parse(source("../../../schema/kdo-h4-r3b-sandbox-backend-evidence.schema.json")) as Record<string, unknown>
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema")
  assert.equal(schema.$id, "https://kodac.dev/schema/kdo-h4-r3b-sandbox-backend-evidence.schema.json")
  assert.match(String(schema.description), /b8f5b8b97a49e550bfe036b73d259b0826ec75bd/)

  const defs = schema.$defs as Record<string, Record<string, unknown>>
  const runtimeArrays = defs.semanticRuntimeClasses.enum
  assert.deepEqual(runtimeArrays, [
    ["gvisor"],
    ["kata-firecracker"],
    ["kata-qemu"],
    ["gvisor", "kata-firecracker"],
    ["gvisor", "kata-qemu"],
    ["kata-firecracker", "kata-qemu"],
    ["gvisor", "kata-firecracker", "kata-qemu"],
  ])
  assert.equal(
    (runtimeArrays as unknown[][]).some((value) => JSON.stringify(value) === JSON.stringify(["kata-qemu", "gvisor"])),
    false,
  )

  const requirementProperties = (defs.requirement.properties as Record<string, Record<string, unknown>>)
  assert.equal(
    requirementProperties.workload.$ref,
    "https://kodac.dev/schema/kdo-h4-r3a-sandbox-workload.schema.json#/$defs/workload",
  )
  const observationProperties = defs.observation.properties as Record<string, Record<string, unknown>>
  assert.equal(
    observationProperties.observedNetworkPolicy.$ref,
    "https://kodac.dev/schema/kdo-h4-r3a-sandbox-workload.schema.json#/$defs/networkPolicy",
  )
  assert.equal(
    observationProperties.observedResourcePolicy.$ref,
    "https://kodac.dev/schema/kdo-h4-r3a-sandbox-workload.schema.json#/$defs/resourcePolicy",
  )
})
