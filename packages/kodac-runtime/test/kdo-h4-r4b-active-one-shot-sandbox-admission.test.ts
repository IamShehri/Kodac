import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import test from "node:test"

import {
  KDO_H4_R1_APPROVAL_VERSION,
  KDO_H4_R1_EVIDENCE_COMMIT_VERSION,
  createApprovalEvidence,
  type ApprovalEvidence,
  type ApprovalRequest,
} from "../src/trust/approval.ts"
import { createConfinementRequest } from "../src/trust/confinement.ts"
import {
  createSandboxExecutionRequirement,
  type SandboxExecutionRequirement,
  type SandboxSemanticRuntimeClass,
} from "../src/trust/sandbox-backend-evidence.ts"
import {
  createSandboxExecutionApprovalBinding,
  createSandboxExecutionApprovalIntent,
} from "../src/trust/sandbox-execution-approval-binding.ts"
import {
  KDO_H4_R3A_NETWORK_MODE,
  createSandboxEntrypoint,
  createSandboxNetworkPolicy,
  createSandboxOciImageSource,
  createSandboxResourcePolicy,
  createSandboxWorkloadRequest,
} from "../src/trust/sandbox-workload.ts"
import {
  KDO_H4_R4B_A_ADMISSION_ATTEMPT_LIMIT,
  KDO_H4_R4B_A_CONSUMPTION_RESERVATION_VERSION,
  KDO_H4_R4B_A_PERMIT_COMMIT_VERSION,
  KDO_H4_R4B_A_VERSION,
  createSandboxAdmissionConsumptionReservation,
  createSandboxAdmissionPermit,
  createSandboxAdmissionPermitCommit,
  validateSandboxAdmissionConsumptionReservation,
  validateSandboxAdmissionPermit,
  validateSandboxAdmissionPermitCommit,
  type SandboxAdmissionPermit,
} from "../src/trust/sandbox-admission-permit.ts"
import {
  KDO_H4_R4B_A_RUNTIME_VERSION,
  SandboxAdmissionApprovalBlockedError,
  SandboxAdmissionApprovalGateway,
  SandboxAdmissionApprovalUnprovenError,
  createSandboxAdmissionApprovalRuntime,
} from "../src/execution/sandbox-admission-approval-runtime.ts"
import type { PolicyDecision } from "../src/trust/policy.ts"

const source = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8")

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

function gitBlobSha1(value: string): string {
  const canonical = value.replace(/\r\n/g, "\n")
  const bytes = Buffer.from(canonical, "utf8")
  return createHash("sha1").update(`blob ${bytes.byteLength}\0`, "utf8").update(bytes).digest("hex")
}

function referenceRequestIdentity(intent: ApprovalRequest["intent"]): string {
  return sha256(`${KDO_H4_R1_APPROVAL_VERSION}\n${JSON.stringify({
    capability: intent.capability,
    paths: intent.paths,
    inputDigest: intent.inputDigest,
  })}`)
}

const FIXTURE_DIGEST = `sha256:${"1".repeat(64)}`
const WORKSPACE_IDENTITY = "a".repeat(64)
const EXECUTION_INTENT_IDENTITY = "b".repeat(64)
const REQUEST_INSTANCE_A = "123e4567-e89b-42d3-a456-426614174000"
const REQUEST_INSTANCE_B = "123e4567-e89b-42d3-a456-426614174001"

type FixtureOverrides = {
  repository?: string
  digest?: string
  executable?: string
  args?: readonly string[]
  cpuMillis?: number
  memoryBytes?: number
  ttlMs?: number
  maxOutputBytes?: number
  workspaceIdentity?: string
  executionIntentIdentity?: string
  readPaths?: readonly string[]
  requiredSemanticRuntimeClass?: SandboxSemanticRuntimeClass
}

function fixtureWorkload(overrides: FixtureOverrides = {}) {
  const confinement = createConfinementRequest({
    mode: "read-only",
    workspaceIdentity: overrides.workspaceIdentity ?? WORKSPACE_IDENTITY,
    executionIntentIdentity: overrides.executionIntentIdentity ?? EXECUTION_INTENT_IDENTITY,
    scope: { readPaths: [...(overrides.readPaths ?? ["src"])], writePaths: [] },
  })
  return createSandboxWorkloadRequest({
    source: createSandboxOciImageSource({
      repository: overrides.repository ?? "ghcr.io/acme/kodac-fixture",
      digest: overrides.digest ?? FIXTURE_DIGEST,
    }),
    entrypoint: createSandboxEntrypoint({
      executable: overrides.executable ?? "/usr/bin/node",
      args: overrides.args ?? ["--version", "é"],
    }),
    resourcePolicy: createSandboxResourcePolicy({
      cpuMillis: overrides.cpuMillis ?? 1000,
      memoryBytes: overrides.memoryBytes ?? 536870912,
      ttlMs: overrides.ttlMs ?? 60000,
      maxOutputBytes: overrides.maxOutputBytes ?? 1048576,
    }),
    networkPolicy: createSandboxNetworkPolicy({ mode: KDO_H4_R3A_NETWORK_MODE }),
    confinement,
    credentialBindingIdentity: null,
  })
}

function fixtureRequirement(overrides: FixtureOverrides = {}): SandboxExecutionRequirement {
  return createSandboxExecutionRequirement({
    workload: fixtureWorkload(overrides),
    requiredSemanticRuntimeClass: overrides.requiredSemanticRuntimeClass ?? "gvisor",
  })
}

function fixedRequest(requirement: SandboxExecutionRequirement, requestInstanceId = REQUEST_INSTANCE_A): ApprovalRequest {
  const expected = createSandboxExecutionApprovalIntent(requirement)
  const intent = { capability: expected.capability, paths: [...expected.paths], inputDigest: expected.inputDigest }
  return {
    version: KDO_H4_R1_APPROVAL_VERSION,
    requestIdentity: referenceRequestIdentity(intent),
    requestInstanceId,
    intent,
  }
}

function evidenceCommit(evidence: ApprovalEvidence) {
  return Object.freeze({
    version: KDO_H4_R1_EVIDENCE_COMMIT_VERSION,
    evidenceIdentity: evidence.evidenceIdentity,
    durability: "durable" as const,
  })
}

function fixedPermit(requirement: SandboxExecutionRequirement, requestInstanceId = REQUEST_INSTANCE_A): SandboxAdmissionPermit {
  const request = fixedRequest(requirement, requestInstanceId)
  const binding = createSandboxExecutionApprovalBinding(requirement, request)
  const askedEvidence = createApprovalEvidence(request, "asked")
  const decidedEvidence = createApprovalEvidence(request, "decided", "allowed-once")
  return createSandboxAdmissionPermit({
    binding,
    askedEvidence,
    askedEvidenceCommit: evidenceCommit(askedEvidence),
    decidedEvidence,
    decidedEvidenceCommit: evidenceCommit(decidedEvidence),
  })
}

type GatewayOverrides = {
  policyDecision?: PolicyDecision
  decisionOutcome?: "allowed-once" | "rejected" | "cancelled" | "unavailable"
  decisionMutator?: (request: ApprovalRequest) => unknown
  evidenceCommit?: (evidence: ApprovalEvidence) => unknown
  permitCommit?: (permit: SandboxAdmissionPermit, options: { readonly signal?: AbortSignal }) => unknown
}

function gatewayFixture(events: string[], overrides: GatewayOverrides = {}) {
  const runtime = createSandboxAdmissionApprovalRuntime({
    policy: {
      evaluate() {
        events.push("policy")
        return { decision: overrides.policyDecision ?? "ask", reason: "fixture policy" }
      },
    },
    approval: {
      service: {
        decide(request) {
          events.push("decide")
          if (overrides.decisionMutator) return overrides.decisionMutator(request)
          return {
            version: KDO_H4_R1_APPROVAL_VERSION,
            requestIdentity: request.requestIdentity,
            requestInstanceId: request.requestInstanceId,
            outcome: overrides.decisionOutcome ?? "allowed-once",
          }
        },
      },
      evidence: {
        commit(evidence) {
          events.push(`${evidence.phase}-commit`)
          if (overrides.evidenceCommit) return overrides.evidenceCommit(evidence)
          return evidenceCommit(evidence)
        },
      },
    },
    commitAdmissionPermit(permit, options) {
      events.push("permit-commit")
      if (overrides.permitCommit) return overrides.permitCommit(permit, options)
      return createSandboxAdmissionPermitCommit(permit)
    },
  })
  return new SandboxAdmissionApprovalGateway(runtime)
}

test("H4-R4B-A constants authority surface and protected gateways are exact", () => {
  assert.equal(KDO_H4_R4B_A_VERSION, "kodac-h4-r4b-a-sandbox-admission-permit-v1")
  assert.equal(KDO_H4_R4B_A_PERMIT_COMMIT_VERSION, "kodac-h4-r4b-a-sandbox-admission-permit-commit-v1")
  assert.equal(KDO_H4_R4B_A_CONSUMPTION_RESERVATION_VERSION, "kodac-h4-r4b-a-consumption-reservation-v1")
  assert.equal(KDO_H4_R4B_A_RUNTIME_VERSION, "kodac-h4-r4b-a-sandbox-admission-approval-runtime-v1")
  assert.equal(KDO_H4_R4B_A_ADMISSION_ATTEMPT_LIMIT, 1)

  const permitSource = source("../src/trust/sandbox-admission-permit.ts")
  const runtimeSource = source("../src/execution/sandbox-admission-approval-runtime.ts")
  for (const production of [permitSource, runtimeSource]) {
    for (const forbidden of ["node:child_process", "node:fs", "node:net", "docker", "spawn(", "exec("]) {
      assert.equal(production.includes(forbidden), false, `R4B-A production must not contain ${forbidden}`)
    }
  }

  assert.equal(gitBlobSha1(source("../src/execution/gateway.ts")), "1732dae059fc878c04e6b1bb6a117385efe9ed6a")
  assert.equal(gitBlobSha1(source("../src/execution/gateway-gvisor-physical-proof-runtime.ts")), "4e094b54cbe2c301deff5ecb64634199fca2c425")

  const root = source("../src/index.ts")
  assert.equal(root.includes("createSandboxAdmissionApprovalRuntime"), false)
  assert.equal(root.includes("createSandboxAdmissionPermitCommit"), false)
  assert.equal(root.includes("createSandboxAdmissionConsumptionReservation"), false)
  assert.doesNotMatch(root, /\bcreateSandboxAdmissionPermit\b/)
})

test("H4-R4B-A exact allowed-once flow persists asked and decided evidence before one durable permit", async () => {
  const events: string[] = []
  const gateway = gatewayFixture(events)
  const result = await gateway.authorizeSandboxAdmission(fixtureRequirement())
  assert.deepEqual(events, ["policy", "asked-commit", "decide", "decided-commit", "permit-commit"])
  assert.equal(result.permit.outcome, "allowed-once")
  assert.equal(result.permit.admissionAttemptLimit, 1)
  assert.equal(result.commit.permitIdentity, result.permit.permitIdentity)
  assert.equal(result.commit.durability, "durable")
  assert.deepEqual(validateSandboxAdmissionPermit(result.permit), result.permit)
  assert.deepEqual(validateSandboxAdmissionPermitCommit(result.commit, result.permit), result.commit)
  assert.equal(Object.isFrozen(result), true)
  assert.equal(Object.isFrozen(result.permit), true)
  assert.equal(Object.isFrozen(result.commit), true)
})

test("H4-R4B-A policy deny and allow never invoke approval or fabricate a one-shot permit", async () => {
  for (const decision of ["deny", "allow"] as const) {
    const events: string[] = []
    const gateway = gatewayFixture(events, { policyDecision: decision })
    await assert.rejects(() => gateway.authorizeSandboxAdmission(fixtureRequirement()), SandboxAdmissionApprovalBlockedError)
    assert.deepEqual(events, ["policy"])
  }
})

test("H4-R4B-A pre-aborted ASK blocks before approval evidence or service activity", async () => {
  const events: string[] = []
  const controller = new AbortController()
  controller.abort()
  const gateway = gatewayFixture(events)
  await assert.rejects(() => gateway.authorizeSandboxAdmission(fixtureRequirement(), { signal: controller.signal }), (error: unknown) => {
    assert.equal(error instanceof SandboxAdmissionApprovalBlockedError, true)
    assert.equal((error as SandboxAdmissionApprovalBlockedError).outcome, "cancelled")
    return true
  })
  assert.deepEqual(events, ["policy"])
})

test("H4-R4B-A asked persistence failure prevents approval service invocation", async () => {
  const events: string[] = []
  const gateway = gatewayFixture(events, {
    evidenceCommit(evidence) {
      if (evidence.phase === "asked") throw new Error("asked-store-down")
      return evidenceCommit(evidence)
    },
  })
  await assert.rejects(() => gateway.authorizeSandboxAdmission(fixtureRequirement()), SandboxAdmissionApprovalUnprovenError)
  assert.deepEqual(events, ["policy", "asked-commit"])
})

test("H4-R4B-A cancellation during pending approval converts late allowed-once to durable cancelled evidence", async () => {
  const events: string[] = []
  const controller = new AbortController()
  let resolveDecision: ((value: unknown) => void) | undefined
  let capturedRequest: ApprovalRequest | undefined
  const gateway = gatewayFixture(events, {
    decisionMutator(request) {
      capturedRequest = request
      return new Promise<unknown>((resolve) => {
        resolveDecision = resolve
      })
    },
  })

  const pending = gateway.authorizeSandboxAdmission(fixtureRequirement(), { signal: controller.signal })
  while (resolveDecision === undefined || capturedRequest === undefined) {
    await new Promise<void>((resolve) => setImmediate(resolve))
  }
  controller.abort()
  resolveDecision({
    version: KDO_H4_R1_APPROVAL_VERSION,
    requestIdentity: capturedRequest.requestIdentity,
    requestInstanceId: capturedRequest.requestInstanceId,
    outcome: "allowed-once",
  })
  await assert.rejects(() => pending, (error: unknown) => {
    assert.equal(error instanceof SandboxAdmissionApprovalBlockedError, true)
    assert.equal((error as SandboxAdmissionApprovalBlockedError).outcome, "cancelled")
    return true
  })
  assert.deepEqual(events, ["policy", "asked-commit", "decide", "decided-commit"])
})

test("H4-R4B-A cancellation does not wait for a non-cooperative approval service", async () => {
  const events: string[] = []
  const controller = new AbortController()
  let decisionStarted = false
  const gateway = gatewayFixture(events, {
    decisionMutator() {
      decisionStarted = true
      return new Promise<unknown>(() => undefined)
    },
  })

  const pending = gateway.authorizeSandboxAdmission(fixtureRequirement(), { signal: controller.signal })
  while (!decisionStarted) {
    await new Promise<void>((resolve) => setImmediate(resolve))
  }
  controller.abort()

  const outcome = await Promise.race([
    pending.then(
      () => ({ kind: "fulfilled" as const }),
      (error: unknown) => ({ kind: "rejected" as const, error }),
    ),
    new Promise<{ readonly kind: "timeout" }>((resolve) => setTimeout(() => resolve({ kind: "timeout" }), 2000)),
  ])
  assert.notEqual(outcome.kind, "timeout")
  assert.equal(outcome.kind, "rejected")
  if (outcome.kind === "rejected") {
    assert.equal(outcome.error instanceof SandboxAdmissionApprovalBlockedError, true)
    assert.equal((outcome.error as SandboxAdmissionApprovalBlockedError).outcome, "cancelled")
  }
  assert.deepEqual(events, ["policy", "asked-commit", "decide", "decided-commit"])
})

test("H4-R4B-A decision request identity and occurrence mismatch fail closed and never commit a permit", async () => {
  for (const mutate of [
    (request: ApprovalRequest) => ({ version: KDO_H4_R1_APPROVAL_VERSION, requestIdentity: "f".repeat(64), requestInstanceId: request.requestInstanceId, outcome: "allowed-once" }),
    (request: ApprovalRequest) => ({ version: KDO_H4_R1_APPROVAL_VERSION, requestIdentity: request.requestIdentity, requestInstanceId: "wrong-occurrence", outcome: "allowed-once" }),
  ]) {
    const events: string[] = []
    const gateway = gatewayFixture(events, { decisionMutator: mutate })
    await assert.rejects(() => gateway.authorizeSandboxAdmission(fixtureRequirement()), (error: unknown) => {
      assert.equal(error instanceof SandboxAdmissionApprovalBlockedError, true)
      assert.equal((error as SandboxAdmissionApprovalBlockedError).outcome, "unavailable")
      return true
    })
    assert.deepEqual(events, ["policy", "asked-commit", "decide", "decided-commit"])
  }
})

test("H4-R4B-A rejected cancelled and unavailable outcomes never yield permits", async () => {
  for (const outcome of ["rejected", "cancelled", "unavailable"] as const) {
    const events: string[] = []
    const gateway = gatewayFixture(events, { decisionOutcome: outcome })
    await assert.rejects(() => gateway.authorizeSandboxAdmission(fixtureRequirement()), (error: unknown) => {
      assert.equal(error instanceof SandboxAdmissionApprovalBlockedError, true)
      assert.equal((error as SandboxAdmissionApprovalBlockedError).outcome, outcome)
      return true
    })
    assert.deepEqual(events, ["policy", "asked-commit", "decide", "decided-commit"])
  }
})

test("H4-R4B-A decided evidence persistence failure prevents positive permit commit", async () => {
  const events: string[] = []
  const gateway = gatewayFixture(events, {
    evidenceCommit(evidence) {
      if (evidence.phase === "decided") throw new Error("decided-store-down")
      return evidenceCommit(evidence)
    },
  })
  await assert.rejects(() => gateway.authorizeSandboxAdmission(fixtureRequirement()), SandboxAdmissionApprovalUnprovenError)
  assert.deepEqual(events, ["policy", "asked-commit", "decide", "decided-commit"])
})

test("H4-R4B-A permit commit failure never exposes a positive permit", async () => {
  const events: string[] = []
  const gateway = gatewayFixture(events, {
    permitCommit() {
      throw new Error("permit-store-down")
    },
  })
  await assert.rejects(() => gateway.authorizeSandboxAdmission(fixtureRequirement()), SandboxAdmissionApprovalUnprovenError)
  assert.deepEqual(events, ["policy", "asked-commit", "decide", "decided-commit", "permit-commit"])
})

test("H4-R4B-A abort after permit mutation starts waits for settlement and withholds late durable success", async () => {
  const events: string[] = []
  const controller = new AbortController()
  let resolveCommit: ((value: unknown) => void) | undefined
  let committedPermit: SandboxAdmissionPermit | undefined
  const gateway = gatewayFixture(events, {
    permitCommit(permit) {
      committedPermit = permit
      return new Promise<unknown>((resolve) => {
        resolveCommit = resolve
      })
    },
  })

  const pending = gateway.authorizeSandboxAdmission(fixtureRequirement(), { signal: controller.signal })
  while (resolveCommit === undefined || committedPermit === undefined) {
    await new Promise<void>((resolve) => setImmediate(resolve))
  }
  controller.abort()
  resolveCommit(createSandboxAdmissionPermitCommit(committedPermit))
  await assert.rejects(() => pending, /positive permit is withheld/)
  assert.deepEqual(events, ["policy", "asked-commit", "decide", "decided-commit", "permit-commit"])
})

test("H4-R4B-A permit identity is deterministic for one exact occurrence and changes for a new occurrence or repository-only drift", () => {
  const baseRequirement = fixtureRequirement()
  const first = fixedPermit(baseRequirement, REQUEST_INSTANCE_A)
  const replay = fixedPermit(baseRequirement, REQUEST_INSTANCE_A)
  const nextOccurrence = fixedPermit(baseRequirement, REQUEST_INSTANCE_B)
  const repositoryDrift = fixedPermit(fixtureRequirement({ repository: "ghcr.io/acme/kodac-fixture-alt" }), REQUEST_INSTANCE_A)
  assert.equal(first.permitIdentity, replay.permitIdentity)
  assert.notEqual(first.permitIdentity, nextOccurrence.permitIdentity)
  assert.notEqual(first.permitIdentity, repositoryDrift.permitIdentity)
  assert.notEqual(first.bindingIdentity, repositoryDrift.bindingIdentity)
})

test("H4-R4B-A permit validation rejects outer and nested binding substitution", () => {
  const permit = fixedPermit(fixtureRequirement())
  const outer = clone(permit) as unknown as Record<string, unknown>
  outer.bindingIdentity = "f".repeat(64)
  assert.throws(() => validateSandboxAdmissionPermit(outer), /bindingIdentity mismatch/)

  const nested = clone(permit)
  ;(nested.binding.requirement.workload.source as { digest: string }).digest = `sha256:${"2".repeat(64)}`
  assert.throws(() => validateSandboxAdmissionPermit(nested), /source identity mismatch/i)

  const outcome = clone(permit) as unknown as Record<string, unknown>
  outcome.outcome = "rejected"
  assert.throws(() => validateSandboxAdmissionPermit(outcome), /outcome mismatch/)
})

test("H4-R4B-A hostile serialized permit structures fail closed without executing caller hooks", () => {
  const permit = fixedPermit(fixtureRequirement())
  let touched = false
  const accessor: Record<string, unknown> = { ...permit }
  Object.defineProperty(accessor, "permitIdentity", {
    enumerable: true,
    get() {
      touched = true
      return permit.permitIdentity
    },
  })
  assert.throws(() => validateSandboxAdmissionPermit(accessor), /data property/)
  assert.equal(touched, false)

  const proxy = new Proxy(permit as unknown as Record<string, unknown>, {
    ownKeys() {
      touched = true
      return []
    },
  })
  assert.throws(() => validateSandboxAdmissionPermit(proxy), /non-proxy plain object/)
  assert.equal(touched, false)
})

test("H4-R4B-A future consumption reservation binds exactly one permit and one execution attempt", () => {
  const permit = fixedPermit(fixtureRequirement())
  const attemptA = "c".repeat(64)
  const attemptB = "d".repeat(64)
  const first = createSandboxAdmissionConsumptionReservation(permit, attemptA)
  const replay = createSandboxAdmissionConsumptionReservation(permit, attemptA)
  const other = createSandboxAdmissionConsumptionReservation(permit, attemptB)
  assert.equal(first.reservationIdentity, replay.reservationIdentity)
  assert.notEqual(first.reservationIdentity, other.reservationIdentity)
  assert.deepEqual(validateSandboxAdmissionConsumptionReservation(first, permit), first)
})

test("H4-R4B-A schema is closed and positive permit can represent only allowed-once with one attempt", () => {
  const schema = JSON.parse(source("../../../schema/kdo-h4-r4b-sandbox-admission-permit.schema.json")) as {
    additionalProperties: boolean
    properties: Record<string, unknown>
    $defs: {
      requestInstanceId: { minLength: number; pattern: string; description: string; maxLength?: number }
      askedEvidence: { additionalProperties: boolean }
      decidedEvidence: { additionalProperties: boolean; properties: { outcome: { const: string } } }
      approvalEvidenceCommit: { additionalProperties: boolean }
    }
  }
  assert.equal(schema.additionalProperties, false)
  assert.equal(schema.$defs.askedEvidence.additionalProperties, false)
  assert.equal(schema.$defs.decidedEvidence.additionalProperties, false)
  assert.equal(schema.$defs.approvalEvidenceCommit.additionalProperties, false)
  assert.equal(schema.$defs.decidedEvidence.properties.outcome.const, "allowed-once")
  assert.deepEqual(schema.properties.outcome, { const: "allowed-once" })
  assert.deepEqual(schema.properties.admissionAttemptLimit, { const: 1 })
  assert.deepEqual(schema.properties.binding, { $ref: "./kdo-h4-r4a-sandbox-execution-approval-binding.schema.json" })
  assert.equal(Object.hasOwn(schema.$defs.requestInstanceId, "maxLength"), false)
  assert.match(schema.$defs.requestInstanceId.description, /128 UTF-8 bytes/)
  assert.equal(Object.hasOwn(schema.properties, "containerId"), false)
  assert.equal(Object.hasOwn(schema.properties, "processId"), false)
  assert.equal(Object.hasOwn(schema.properties, "dockerOperation"), false)
})