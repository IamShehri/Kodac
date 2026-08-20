import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import test from "node:test"

import {
  KDO_H4_R1_APPROVAL_VERSION,
  type ApprovalRequest,
} from "../src/trust/approval.ts"
import { createConfinementRequest } from "../src/trust/confinement.ts"
import {
  createSandboxExecutionRequirement,
  type SandboxExecutionRequirement,
} from "../src/trust/sandbox-backend-evidence.ts"
import {
  KDO_H4_R3A_NETWORK_MODE,
  createSandboxEntrypoint,
  createSandboxNetworkPolicy,
  createSandboxOciImageSource,
  createSandboxResourcePolicy,
  createSandboxWorkloadRequest,
} from "../src/trust/sandbox-workload.ts"
import {
  KDO_H4_R4A_CAPABILITY,
  KDO_H4_R4A_LIMITS,
  KDO_H4_R4A_VERSION,
  createSandboxExecutionApprovalBinding,
  createSandboxExecutionApprovalIntent,
  validateSandboxExecutionApprovalBinding,
} from "../src/trust/sandbox-execution-approval-binding.ts"

const source = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8")

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

function referenceRequestIdentity(intent: ApprovalRequest["intent"]): string {
  return sha256(`${KDO_H4_R1_APPROVAL_VERSION}\n${JSON.stringify({
    capability: intent.capability,
    paths: intent.paths,
    inputDigest: intent.inputDigest,
  })}`)
}

const FIXTURE_DIGEST = `sha256:${"1".repeat(64)}`
const OTHER_DIGEST = `sha256:${"2".repeat(64)}`
const WORKSPACE_IDENTITY = "a".repeat(64)
const EXECUTION_INTENT_IDENTITY = "b".repeat(64)
const REQUEST_INSTANCE_A = "123e4567-e89b-42d3-a456-426614174000"
const REQUEST_INSTANCE_B = "123e4567-e89b-42d3-a456-426614174001"

function fixtureWorkload(overrides: { digest?: string; executable?: string; args?: readonly string[]; cpuMillis?: number; ttlMs?: number } = {}) {
  const confinement = createConfinementRequest({
    mode: "read-only",
    workspaceIdentity: WORKSPACE_IDENTITY,
    executionIntentIdentity: EXECUTION_INTENT_IDENTITY,
    scope: { readPaths: ["src"], writePaths: [] },
  })
  return createSandboxWorkloadRequest({
    source: createSandboxOciImageSource({
      repository: "ghcr.io/acme/kodac-fixture",
      digest: overrides.digest ?? FIXTURE_DIGEST,
    }),
    entrypoint: createSandboxEntrypoint({
      executable: overrides.executable ?? "/usr/bin/node",
      args: overrides.args ?? ["--version", "é"],
    }),
    resourcePolicy: createSandboxResourcePolicy({
      cpuMillis: overrides.cpuMillis ?? 1000,
      memoryBytes: 536870912,
      ttlMs: overrides.ttlMs ?? 60000,
      maxOutputBytes: 1048576,
    }),
    networkPolicy: createSandboxNetworkPolicy({ mode: KDO_H4_R3A_NETWORK_MODE }),
    confinement,
    credentialBindingIdentity: null,
  })
}

function fixtureRequirement(overrides: Parameters<typeof fixtureWorkload>[0] = {}): SandboxExecutionRequirement {
  return createSandboxExecutionRequirement({
    workload: fixtureWorkload(overrides),
    requiredSemanticRuntimeClass: "gvisor",
  })
}

function fixedRequest(requirement: SandboxExecutionRequirement, requestInstanceId = REQUEST_INSTANCE_A): ApprovalRequest {
  const expected = createSandboxExecutionApprovalIntent(requirement)
  const intent = {
    capability: expected.capability,
    paths: [...expected.paths],
    inputDigest: expected.inputDigest,
  }
  return {
    version: KDO_H4_R1_APPROVAL_VERSION,
    requestIdentity: referenceRequestIdentity(intent),
    requestInstanceId,
    intent,
  }
}

test("H4-R4A constants and production dependency boundary are exact", () => {
  assert.equal(KDO_H4_R4A_VERSION, "kodac-h4-r4a-exact-sandbox-approval-binding-v1")
  assert.equal(KDO_H4_R4A_CAPABILITY, "runtime.execute.sandbox")
  assert.deepEqual(KDO_H4_R4A_LIMITS, { maxRequestInstanceIdBytes: 128 })

  const production = source("../src/trust/sandbox-execution-approval-binding.ts")
  const imports = [...production.matchAll(/from "([^"]+)"|import "([^"]+)"/g)].map((match) => match[1] ?? match[2])
  assert.deepEqual(imports, [
    "node:crypto",
    "node:util",
    "./approval.ts",
    "./sandbox-backend-evidence.ts",
    "./sandbox-workload.ts",
    "./policy.ts",
  ])
  for (const forbidden of ["node:child_process", "node:fs", "node:net", "docker", "spawn(", "exec(", ".decide(", ".commit("]) {
    assert.equal(production.includes(forbidden), false, `production must not contain ${forbidden}`)
  }
})

test("H4-R4A exact requirement and approval occurrence produce one immutable self-validating binding", () => {
  const requirement = fixtureRequirement()
  const request = fixedRequest(requirement)
  const binding = createSandboxExecutionApprovalBinding(requirement, request)

  assert.equal(binding.requirementIdentity, requirement.requirementIdentity)
  assert.equal(binding.workloadIdentity, requirement.workload.workloadIdentity)
  assert.equal(binding.sourceDigest, FIXTURE_DIGEST)
  assert.equal(binding.approvalCapability, KDO_H4_R4A_CAPABILITY)
  assert.equal(binding.approvalRequestIdentity, request.requestIdentity)
  assert.equal(binding.approvalRequestInstanceId, REQUEST_INSTANCE_A)
  assert.deepEqual(binding.approvalRequest.intent.paths, [])
  assert.deepEqual(validateSandboxExecutionApprovalBinding(binding), binding)

  for (const value of [binding, binding.requirement, binding.requirement.workload, binding.approvalRequest, binding.approvalRequest.intent, binding.approvalRequest.intent.paths]) {
    assert.equal(Object.isFrozen(value), true)
  }

  console.log("H4_R4A_FIXED_VECTOR", JSON.stringify({
    requirementIdentity: binding.requirementIdentity,
    workloadIdentity: binding.workloadIdentity,
    sourceIdentity: binding.sourceIdentity,
    entrypointIdentity: binding.entrypointIdentity,
    resourcePolicyIdentity: binding.resourcePolicyIdentity,
    networkPolicyIdentity: binding.networkPolicyIdentity,
    confinementRequestIdentity: binding.confinementRequestIdentity,
    approvalInputDigest: binding.approvalInputDigest,
    approvalRequestIdentity: binding.approvalRequestIdentity,
    bindingIdentity: binding.bindingIdentity,
  }))
})

test("H4-R4A same requirement/request pair is deterministic while a new one-shot occurrence changes binding identity", () => {
  const requirement = fixtureRequirement()
  const first = createSandboxExecutionApprovalBinding(requirement, fixedRequest(requirement, REQUEST_INSTANCE_A))
  const replay = createSandboxExecutionApprovalBinding(requirement, fixedRequest(requirement, REQUEST_INSTANCE_A))
  const nextOccurrence = createSandboxExecutionApprovalBinding(requirement, fixedRequest(requirement, REQUEST_INSTANCE_B))

  assert.equal(first.bindingIdentity, replay.bindingIdentity)
  assert.equal(first.approvalInputDigest, nextOccurrence.approvalInputDigest)
  assert.equal(first.approvalRequestIdentity, nextOccurrence.approvalRequestIdentity)
  assert.notEqual(first.bindingIdentity, nextOccurrence.bindingIdentity)
})

test("H4-R4A approval intent is fixed namespace empty paths and requirement-sensitive", () => {
  const base = createSandboxExecutionApprovalIntent(fixtureRequirement())
  assert.equal(base.capability, KDO_H4_R4A_CAPABILITY)
  assert.deepEqual(base.paths, [])
  assert.equal(Object.isFrozen(base), true)
  assert.equal(Object.isFrozen(base.paths), true)

  for (const requirement of [
    fixtureRequirement({ digest: OTHER_DIGEST }),
    fixtureRequirement({ executable: "/usr/bin/python3" }),
    fixtureRequirement({ args: ["--version", "different"] }),
    fixtureRequirement({ cpuMillis: 1001 }),
    fixtureRequirement({ ttlMs: 60001 }),
  ]) {
    assert.notEqual(createSandboxExecutionApprovalIntent(requirement).inputDigest, base.inputDigest)
  }
})

test("H4-R4A rejects capability paths digest request identity and request-instance substitution", () => {
  const requirement = fixtureRequirement()
  const request = fixedRequest(requirement)

  const wrongCapability = clone(request)
  wrongCapability.intent.capability = "repo.apply_patch"
  wrongCapability.requestIdentity = referenceRequestIdentity(wrongCapability.intent)
  assert.throws(() => createSandboxExecutionApprovalBinding(requirement, wrongCapability), /capability mismatch/)

  const nonEmptyPaths = clone(request)
  nonEmptyPaths.intent.paths = ["src"]
  nonEmptyPaths.requestIdentity = referenceRequestIdentity(nonEmptyPaths.intent)
  assert.throws(() => createSandboxExecutionApprovalBinding(requirement, nonEmptyPaths), /paths must be exactly empty/)

  const wrongDigest = clone(request)
  wrongDigest.intent.inputDigest = "f".repeat(64)
  wrongDigest.requestIdentity = referenceRequestIdentity(wrongDigest.intent)
  assert.throws(() => createSandboxExecutionApprovalBinding(requirement, wrongDigest), /inputDigest mismatch/)

  const wrongRequestIdentity = clone(request)
  wrongRequestIdentity.requestIdentity = "f".repeat(64)
  assert.throws(() => createSandboxExecutionApprovalBinding(requirement, wrongRequestIdentity), /requestIdentity mismatch/)

  const emptyInstance = clone(request)
  emptyInstance.requestInstanceId = ""
  assert.throws(() => createSandboxExecutionApprovalBinding(requirement, emptyInstance), /requestInstanceId/)

  const oversizedInstance = clone(request)
  oversizedInstance.requestInstanceId = "é".repeat(65)
  assert.throws(() => createSandboxExecutionApprovalBinding(requirement, oversizedInstance), /128 UTF-8 bytes/)
})

test("H4-R4A serialized outer-field substitution fails even with canonical nested predecessors", () => {
  const requirement = fixtureRequirement()
  const binding = createSandboxExecutionApprovalBinding(requirement, fixedRequest(requirement))
  const scalarFields = [
    "requirementIdentity",
    "workloadIdentity",
    "sourceIdentity",
    "entrypointIdentity",
    "resourcePolicyIdentity",
    "networkPolicyIdentity",
    "confinementRequestIdentity",
    "executionIntentIdentity",
    "workspaceIdentity",
    "approvalInputDigest",
    "approvalRequestIdentity",
    "bindingIdentity",
  ] as const

  for (const field of scalarFields) {
    const broken = clone(binding) as unknown as Record<string, unknown>
    broken[field] = "f".repeat(64)
    assert.throws(() => validateSandboxExecutionApprovalBinding(broken), new RegExp(`${field} mismatch`))
  }

  const sourceDigest = clone(binding) as unknown as Record<string, unknown>
  sourceDigest.sourceDigest = OTHER_DIGEST
  assert.throws(() => validateSandboxExecutionApprovalBinding(sourceDigest), /sourceDigest mismatch/)

  const instance = clone(binding) as unknown as Record<string, unknown>
  instance.approvalRequestInstanceId = REQUEST_INSTANCE_B
  assert.throws(() => validateSandboxExecutionApprovalBinding(instance), /approvalRequestInstanceId mismatch/)
})

test("H4-R4A nested requirement substitution cannot be rescued by recomputing only outer fields", () => {
  const requirement = fixtureRequirement()
  const binding = createSandboxExecutionApprovalBinding(requirement, fixedRequest(requirement))
  const broken = clone(binding)
  ;(broken.requirement.workload.source as { digest: string }).digest = OTHER_DIGEST
  assert.throws(() => validateSandboxExecutionApprovalBinding(broken), /OCI image source identity mismatch/)
})

test("H4-R4A hostile top-level and approval-request structures fail closed without executing hooks", () => {
  const requirement = fixtureRequirement()
  const request = fixedRequest(requirement)
  const binding = createSandboxExecutionApprovalBinding(requirement, request)

  let touched = false
  const accessor: Record<string, unknown> = { ...binding }
  Object.defineProperty(accessor, "bindingIdentity", {
    enumerable: true,
    get() {
      touched = true
      return binding.bindingIdentity
    },
  })
  assert.throws(() => validateSandboxExecutionApprovalBinding(accessor), /data property/)
  assert.equal(touched, false)

  const proxy = new Proxy(binding as unknown as Record<string, unknown>, {
    ownKeys() {
      touched = true
      return []
    },
  })
  assert.throws(() => validateSandboxExecutionApprovalBinding(proxy), /non-proxy plain object/)
  assert.equal(touched, false)

  const requestAccessor: Record<string, unknown> = { ...request }
  Object.defineProperty(requestAccessor, "intent", {
    enumerable: true,
    get() {
      touched = true
      return request.intent
    },
  })
  assert.throws(() => createSandboxExecutionApprovalBinding(requirement, requestAccessor), /data property/)
  assert.equal(touched, false)
})

test("H4-R4A schema is closed and cannot represent approval outcome", () => {
  const schema = JSON.parse(source("../../../schema/kdo-h4-r4a-sandbox-execution-approval-binding.schema.json")) as {
    additionalProperties: boolean
    required: string[]
    properties: Record<string, unknown>
    $defs: { approvalRequest: { properties: Record<string, unknown> }; approvalIntent: { properties: { capability: { const: string }; paths: { maxItems: number } } } }
  }
  assert.equal(schema.additionalProperties, false)
  assert.equal(schema.$defs.approvalIntent.properties.capability.const, KDO_H4_R4A_CAPABILITY)
  assert.equal(schema.$defs.approvalIntent.properties.paths.maxItems, 0)
  assert.equal(Object.hasOwn(schema.properties, "outcome"), false)
  assert.equal(Object.hasOwn(schema.$defs.approvalRequest.properties, "outcome"), false)
  assert.deepEqual(new Set(schema.required), new Set([
    "version", "requirement", "approvalRequest", "requirementIdentity", "workloadIdentity", "sourceIdentity",
    "sourceDigest", "entrypointIdentity", "resourcePolicyIdentity", "networkPolicyIdentity",
    "confinementRequestIdentity", "executionIntentIdentity", "workspaceIdentity", "requiredSemanticRuntimeClass",
    "downgradePolicy", "credentialBindingIdentity", "approvalCapability", "approvalInputDigest",
    "approvalRequestIdentity", "approvalRequestInstanceId", "bindingIdentity",
  ]))
})
