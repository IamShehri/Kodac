import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { createServer, type IncomingMessage, type ServerResponse } from "node:http"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"

import {
  KDO_H4_R1_APPROVAL_VERSION,
  KDO_H4_R1_EVIDENCE_COMMIT_VERSION,
  createApprovalEvidence,
  type ApprovalEvidence,
  type ApprovalRequest,
} from "../src/trust/approval.ts"
import { createConfinementRequest } from "../src/trust/confinement.ts"
import { createSandboxExecutionRequirement, type SandboxExecutionRequirement } from "../src/trust/sandbox-backend-evidence.ts"
import { createSandboxExecutionApprovalBinding, createSandboxExecutionApprovalIntent } from "../src/trust/sandbox-execution-approval-binding.ts"
import {
  createSandboxAdmissionPermit,
  createSandboxAdmissionPermitCommit,
  type SandboxAdmissionPermit,
} from "../src/trust/sandbox-admission-permit.ts"
import {
  KDO_H4_R4B_B1_DOCKER_API_VERSION,
  KDO_H4_R4B_B1_LABELS,
  KDO_H4_R4B_B1_VERSION,
  createCanonicalR4BB1Reservation,
  createSandboxAdmissionConsumptionReservationCommit,
  createSandboxDormantCreatePrepared,
  createSandboxDormantCreatePreparedCommit,
  createSandboxDormantCreatedAdmissionCommit,
  createSandboxDormantExecutionAttemptIdentity,
  validateSandboxDormantCreatePrepared,
  type SandboxDormantCreatePrepared,
  type SandboxDormantCreatedAdmission,
} from "../src/trust/sandbox-admission-dormant-create.ts"
import { KDO_H4_R3F_BINDING_VERSION } from "../src/trust/sandbox-observer-docker-control-plane.ts"
import {
  KDO_H4_R3A_NETWORK_MODE,
  createSandboxEntrypoint,
  createSandboxNetworkPolicy,
  createSandboxOciImageSource,
  createSandboxResourcePolicy,
  createSandboxWorkloadRequest,
} from "../src/trust/sandbox-workload.ts"
import {
  GvisorDockerDormantCreateGateway,
  SandboxDormantCreateBlockedError,
  SandboxDormantCreateIndeterminateError,
  SandboxDormantCreateUnprovenError,
  createGvisorDockerDormantCreateRuntime,
  createSandboxDormantCreateDispatchClaimCommit,
  type SandboxDormantCreateDispatchClaim,
} from "../src/execution/gateway-gvisor-docker-dormant-create-runtime.ts"

const source = (relative: string) => readFile(new URL(relative, import.meta.url), "utf8")

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
  return sha256(`${KDO_H4_R1_APPROVAL_VERSION}\n${JSON.stringify({ capability: intent.capability, paths: intent.paths, inputDigest: intent.inputDigest })}`)
}

const FIXTURE_DIGEST = `sha256:${"1".repeat(64)}`
const WORKSPACE_IDENTITY = "a".repeat(64)
const EXECUTION_INTENT_IDENTITY = "b".repeat(64)
const REQUEST_INSTANCE_A = "123e4567-e89b-42d3-a456-426614174000"
const REQUEST_INSTANCE_B = "123e4567-e89b-42d3-a456-426614174001"
const CONTAINER_ID = "c".repeat(64)

function fixtureRequirement(): SandboxExecutionRequirement {
  const confinement = createConfinementRequest({
    mode: "read-only",
    workspaceIdentity: WORKSPACE_IDENTITY,
    executionIntentIdentity: EXECUTION_INTENT_IDENTITY,
    scope: { readPaths: ["src"], writePaths: [] },
  })
  const workload = createSandboxWorkloadRequest({
    source: createSandboxOciImageSource({ repository: "ghcr.io/acme/kodac-fixture", digest: FIXTURE_DIGEST }),
    entrypoint: createSandboxEntrypoint({ executable: "/usr/bin/node", args: ["--version", "é"] }),
    resourcePolicy: createSandboxResourcePolicy({ cpuMillis: 1000, memoryBytes: 536870912, ttlMs: 60000, maxOutputBytes: 1048576 }),
    networkPolicy: createSandboxNetworkPolicy({ mode: KDO_H4_R3A_NETWORK_MODE }),
    confinement,
    credentialBindingIdentity: null,
  })
  return createSandboxExecutionRequirement({ workload, requiredSemanticRuntimeClass: "gvisor" })
}

function fixedRequest(requirement: SandboxExecutionRequirement, requestInstanceId: string): ApprovalRequest {
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

function fixedPermit(requestInstanceId = REQUEST_INSTANCE_A): SandboxAdmissionPermit {
  const requirement = fixtureRequirement()
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

function inspectBody(
  prepared: SandboxDormantCreatePrepared,
  args: readonly string[],
  extraLabels: Readonly<Record<string, string>> = {},
  extraNetworks: Readonly<Record<string, unknown>> = {},
) {
  return {
    Id: CONTAINER_ID,
    Name: `/${prepared.containerName}`,
    Path: prepared.entrypointExecutable,
    Args: [...args],
    State: { Status: "created", Running: false, Paused: false, Restarting: false, Dead: false, Pid: 0 },
    RestartCount: 0,
    Config: { Tty: false, Labels: { ...prepared.labels, ...extraLabels } },
    ImageManifestDescriptor: { digest: prepared.sourceDigest },
    HostConfig: {
      Runtime: "runsc",
      NetworkMode: "none",
      Privileged: false,
      NanoCpus: prepared.nanoCpus,
      Memory: prepared.memoryBytes,
      MemorySwap: prepared.memorySwapBytes,
      RestartPolicy: { Name: "no", MaximumRetryCount: 0 },
    },
    NetworkSettings: { Networks: { none: {}, ...extraNetworks } },
  }
}

async function readRequestBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  return Buffer.concat(chunks).toString("utf8")
}

interface FakeDockerOptions {
  readonly abortController?: AbortController
  readonly loseCreateResponse?: boolean
  readonly persistOnLostResponse?: boolean
  readonly createStatusCode?: number
  readonly extraInspectLabels?: Readonly<Record<string, string>>
  readonly extraInspectNetworks?: Readonly<Record<string, unknown>>
}

async function withFakeDocker<T>(
  prepared: SandboxDormantCreatePrepared,
  args: readonly string[],
  options: FakeDockerOptions,
  run: (input: { readonly socketPath: string; readonly events: string[]; readonly createBodies: string[]; readonly createCount: () => number }) => Promise<T>,
): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), "kodac-r4b-b1-"))
  const socketPath = join(dir, "docker.sock")
  const events: string[] = []
  const createBodies: string[] = []
  let created = false
  let creates = 0
  const server = createServer(async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method === "POST" && request.url === `/v${KDO_H4_R4B_B1_DOCKER_API_VERSION}/containers/create?name=${prepared.containerName}`) {
      creates += 1
      events.push("docker:create")
      createBodies.push(await readRequestBody(request))
      if (options.loseCreateResponse) {
        if (options.persistOnLostResponse) created = true
        options.abortController?.abort()
        response.socket?.destroy()
        return
      }
      if (options.createStatusCode !== undefined) {
        if (options.persistOnLostResponse) created = true
        response.writeHead(options.createStatusCode, { "Content-Type": "application/json" })
        response.end(JSON.stringify({ message: "synthetic non-success create response" }))
        return
      }
      created = true
      response.writeHead(201, { "Content-Type": "application/json" })
      response.end(JSON.stringify({ Id: CONTAINER_ID, Warnings: [] }))
      return
    }
    if (request.method === "GET" && request.url === `/v${KDO_H4_R4B_B1_DOCKER_API_VERSION}/containers/${prepared.containerName}/json`) {
      events.push("docker:inspect")
      if (!created) {
        response.writeHead(404)
        response.end("{}")
        return
      }
      response.writeHead(200, { "Content-Type": "application/json" })
      response.end(JSON.stringify(inspectBody(prepared, args, options.extraInspectLabels, options.extraInspectNetworks)))
      return
    }
    response.writeHead(500)
    response.end("unexpected endpoint")
  })
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject)
    server.listen(socketPath, () => resolve())
  })
  try {
    return await run({ socketPath, events, createBodies, createCount: () => creates })
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()))
    await rm(dir, { recursive: true, force: true })
  }
}

function durableHarness(permit: SandboxAdmissionPermit, events: string[]) {
  let reservationIdentity: string | undefined
  let preparedIdentity: string | undefined
  let dispatchClaimIdentity: string | undefined
  let createdIdentity: string | undefined
  return {
    commitReservation: (reservation: ReturnType<typeof createCanonicalR4BB1Reservation>) => {
      events.push("store:reservation")
      const disposition = reservationIdentity === undefined ? "created" : "existing"
      if (reservationIdentity !== undefined && reservationIdentity !== reservation.reservationIdentity) throw new Error("reservation conflict")
      reservationIdentity = reservation.reservationIdentity
      return createSandboxAdmissionConsumptionReservationCommit(reservation, permit, disposition)
    },
    commitCreatePrepared: (prepared: SandboxDormantCreatePrepared) => {
      events.push("store:prepared")
      const disposition = preparedIdentity === undefined ? "created" : "existing"
      if (preparedIdentity !== undefined && preparedIdentity !== prepared.preparedIdentity) throw new Error("prepared conflict")
      preparedIdentity = prepared.preparedIdentity
      return createSandboxDormantCreatePreparedCommit(prepared, permit, disposition)
    },
    commitCreateDispatchClaim: (claim: SandboxDormantCreateDispatchClaim) => {
      events.push("store:dispatch")
      const disposition = dispatchClaimIdentity === undefined ? "created" : "existing"
      if (dispatchClaimIdentity !== undefined && dispatchClaimIdentity !== claim.claimIdentity) throw new Error("dispatch claim conflict")
      dispatchClaimIdentity = claim.claimIdentity
      return createSandboxDormantCreateDispatchClaimCommit(claim, disposition)
    },
    commitCreatedAdmission: (created: SandboxDormantCreatedAdmission) => {
      events.push("store:created")
      const disposition = createdIdentity === undefined ? "created" : "existing"
      if (createdIdentity !== undefined && createdIdentity !== created.createdAdmissionIdentity) throw new Error("created admission conflict")
      createdIdentity = created.createdAdmissionIdentity
      return createSandboxDormantCreatedAdmissionCommit(created, permit, disposition)
    },
  }
}

test("H4-R4B-B1 identities are permit-derived deterministic and R3F-label compatible", () => {
  const permitA = fixedPermit(REQUEST_INSTANCE_A)
  const permitB = fixedPermit(REQUEST_INSTANCE_B)
  const attemptA = createSandboxDormantExecutionAttemptIdentity(permitA)
  const reservationA1 = createCanonicalR4BB1Reservation(permitA)
  const reservationA2 = createCanonicalR4BB1Reservation(permitA)
  const preparedA1 = createSandboxDormantCreatePrepared(permitA, reservationA1)
  const preparedA2 = createSandboxDormantCreatePrepared(permitA, reservationA2)
  const preparedB = createSandboxDormantCreatePrepared(permitB, createCanonicalR4BB1Reservation(permitB))

  assert.equal(attemptA, reservationA1.executionAttemptIdentity)
  assert.deepEqual(reservationA1, reservationA2)
  assert.deepEqual(preparedA1, preparedA2)
  assert.notEqual(preparedA1.executionAttemptIdentity, preparedB.executionAttemptIdentity)
  assert.notEqual(preparedA1.createOperationIdentity, preparedB.createOperationIdentity)
  assert.match(preparedA1.containerName, /^kodac-r4b-b1-[0-9a-f]{32}$/)
  assert.equal(preparedA1.labels[KDO_H4_R4B_B1_LABELS.bindingVersion], KDO_H4_R3F_BINDING_VERSION)
  assert.equal(preparedA1.runtimeName, "runsc")
  assert.equal(preparedA1.networkMode, "none")
  assert.equal(preparedA1.memorySwapBytes, preparedA1.memoryBytes)
  assert.equal(preparedA1.nanoCpus, 1_000_000_000)
})

test("H4-R4B-B1 prepared theorem fails closed on serialized substitution", () => {
  const permit = fixedPermit()
  const prepared = createSandboxDormantCreatePrepared(permit, createCanonicalR4BB1Reservation(permit))
  for (const mutation of [
    (value: any) => { value.runtimeName = "runc" },
    (value: any) => { value.networkMode = "bridge" },
    (value: any) => { value.privileged = true },
    (value: any) => { value.memorySwapBytes += 1 },
    (value: any) => { value.labels[KDO_H4_R4B_B1_LABELS.bindingVersion] = "wrong" },
    (value: any) => { value.containerName = "caller-selected" },
  ]) {
    const candidate = clone(prepared)
    mutation(candidate)
    assert.throws(() => validateSandboxDormantCreatePrepared(candidate, permit))
  }
})

test("H4-R4B-B1 exact create orders durable reservation, preparation, and dispatch claim before one Docker mutation", { skip: process.platform !== "linux" }, async () => {
  const permit = fixedPermit()
  const permitCommit = createSandboxAdmissionPermitCommit(permit)
  const prepared = createSandboxDormantCreatePrepared(permit, createCanonicalR4BB1Reservation(permit))
  const args = permit.binding.requirement.workload.entrypoint.args
  await withFakeDocker(prepared, args, {}, async ({ socketPath, events, createBodies, createCount }) => {
    const stores = durableHarness(permit, events)
    const runtime = createGvisorDockerDormantCreateRuntime({ socketPath, ...stores })
    const gateway = new GvisorDockerDormantCreateGateway(runtime)
    const result = await gateway.createDormantAdmission(permit, permitCommit)

    assert.equal(createCount(), 1)
    assert.deepEqual(events, ["store:reservation", "store:prepared", "store:dispatch", "docker:create", "docker:inspect", "store:created"])
    assert.equal(result.recovered, false)
    assert.equal(result.createdAdmission.containerId, CONTAINER_ID)
    assert.equal(result.observation.running, false)
    assert.equal(result.observation.pid, 0)
    assert.equal(result.observation.networkAttachmentCount, 0)

    const payload = JSON.parse(createBodies[0]!)
    assert.deepEqual(payload, {
      Image: prepared.sourceReference,
      Entrypoint: [prepared.entrypointExecutable],
      Cmd: [...args],
      Tty: false,
      Labels: prepared.labels,
      HostConfig: {
        Runtime: "runsc",
        NetworkMode: "none",
        NanoCpus: prepared.nanoCpus,
        Memory: prepared.memoryBytes,
        MemorySwap: prepared.memorySwapBytes,
        RestartPolicy: { Name: "no", MaximumRetryCount: 0 },
        Privileged: false,
      },
    })
  })
})

test("H4-R4B-B1 prepared-only recovery may acquire the first dispatch claim and issue the first POST", { skip: process.platform !== "linux" }, async () => {
  const permit = fixedPermit()
  const permitCommit = createSandboxAdmissionPermitCommit(permit)
  const prepared = createSandboxDormantCreatePrepared(permit, createCanonicalR4BB1Reservation(permit))
  const args = permit.binding.requirement.workload.entrypoint.args
  await withFakeDocker(prepared, args, {}, async ({ socketPath, events, createCount }) => {
    const stores = durableHarness(permit, events)
    const firstRuntime = createGvisorDockerDormantCreateRuntime({
      socketPath,
      ...stores,
      commitCreateDispatchClaim: () => {
        events.push("store:dispatch-failed")
        throw new Error("synthetic pre-dispatch persistence outage")
      },
    })
    await assert.rejects(
      new GvisorDockerDormantCreateGateway(firstRuntime).createDormantAdmission(permit, permitCommit),
      SandboxDormantCreateUnprovenError,
    )
    assert.equal(createCount(), 0)

    events.length = 0
    const recovered = await new GvisorDockerDormantCreateGateway(
      createGvisorDockerDormantCreateRuntime({ socketPath, ...stores }),
    ).createDormantAdmission(permit, permitCommit)
    assert.equal(recovered.recovered, true)
    assert.equal(createCount(), 1)
    assert.deepEqual(events, ["store:reservation", "store:prepared", "store:dispatch", "docker:create", "docker:inspect", "store:created"])
  })
})

test("H4-R4B-B1 retry after durable dispatch claim reconciles and never sends a second create", { skip: process.platform !== "linux" }, async () => {
  const permit = fixedPermit()
  const permitCommit = createSandboxAdmissionPermitCommit(permit)
  const prepared = createSandboxDormantCreatePrepared(permit, createCanonicalR4BB1Reservation(permit))
  const args = permit.binding.requirement.workload.entrypoint.args
  await withFakeDocker(prepared, args, {}, async ({ socketPath, events, createCount }) => {
    const stores = durableHarness(permit, events)
    const runtime = createGvisorDockerDormantCreateRuntime({ socketPath, ...stores })
    const gateway = new GvisorDockerDormantCreateGateway(runtime)
    await gateway.createDormantAdmission(permit, permitCommit)
    events.length = 0
    const recovered = await gateway.createDormantAdmission(permit, permitCommit)
    assert.equal(recovered.recovered, true)
    assert.equal(createCount(), 1)
    assert.deepEqual(events, ["store:reservation", "store:prepared", "store:dispatch", "docker:inspect", "store:created"])
  })
})

test("H4-R4B-B1 durable dispatch claim without observed container burns the attempt and remains inspect-only", { skip: process.platform !== "linux" }, async () => {
  const permit = fixedPermit()
  const permitCommit = createSandboxAdmissionPermitCommit(permit)
  const prepared = createSandboxDormantCreatePrepared(permit, createCanonicalR4BB1Reservation(permit))
  const args = permit.binding.requirement.workload.entrypoint.args
  const controller = new AbortController()
  await withFakeDocker(prepared, args, {}, async ({ socketPath, events, createCount }) => {
    const stores = durableHarness(permit, events)
    const firstRuntime = createGvisorDockerDormantCreateRuntime({
      socketPath,
      ...stores,
      commitCreateDispatchClaim: (claim) => {
        const commit = stores.commitCreateDispatchClaim(claim)
        controller.abort()
        return commit
      },
    })
    await assert.rejects(
      new GvisorDockerDormantCreateGateway(firstRuntime).createDormantAdmission(permit, permitCommit, { signal: controller.signal }),
      SandboxDormantCreateBlockedError,
    )
    assert.equal(createCount(), 0)

    await assert.rejects(
      new GvisorDockerDormantCreateGateway(createGvisorDockerDormantCreateRuntime({ socketPath, ...stores })).createDormantAdmission(permit, permitCommit),
      SandboxDormantCreateIndeterminateError,
    )
    assert.equal(createCount(), 0)
  })
})

test("H4-R4B-B1 lost create response may recover one exact dormant candidate without retry", { skip: process.platform !== "linux" }, async () => {
  const permit = fixedPermit()
  const permitCommit = createSandboxAdmissionPermitCommit(permit)
  const prepared = createSandboxDormantCreatePrepared(permit, createCanonicalR4BB1Reservation(permit))
  const args = permit.binding.requirement.workload.entrypoint.args
  await withFakeDocker(prepared, args, { loseCreateResponse: true, persistOnLostResponse: true }, async ({ socketPath, events, createCount }) => {
    const runtime = createGvisorDockerDormantCreateRuntime({ socketPath, ...durableHarness(permit, events) })
    const result = await new GvisorDockerDormantCreateGateway(runtime).createDormantAdmission(permit, permitCommit)
    assert.equal(result.recovered, true)
    assert.equal(createCount(), 1)
    assert.equal(result.createdAdmission.containerId, CONTAINER_ID)
  })
})

test("H4-R4B-B1 non-201 create response still reconciles one exact dormant side effect", { skip: process.platform !== "linux" }, async () => {
  const permit = fixedPermit()
  const permitCommit = createSandboxAdmissionPermitCommit(permit)
  const prepared = createSandboxDormantCreatePrepared(permit, createCanonicalR4BB1Reservation(permit))
  const args = permit.binding.requirement.workload.entrypoint.args
  await withFakeDocker(prepared, args, { createStatusCode: 500, persistOnLostResponse: true }, async ({ socketPath, events, createCount }) => {
    const runtime = createGvisorDockerDormantCreateRuntime({ socketPath, ...durableHarness(permit, events) })
    const result = await new GvisorDockerDormantCreateGateway(runtime).createDormantAdmission(permit, permitCommit)
    assert.equal(result.recovered, true)
    assert.equal(createCount(), 1)
    assert.equal(result.createdAdmission.containerId, CONTAINER_ID)
    assert.deepEqual(events, ["store:reservation", "store:prepared", "store:dispatch", "docker:create", "docker:inspect", "store:created"])
  })
})

test("H4-R4B-B1 observed Docker labels must contain exactly the canonical reconciliation keys", { skip: process.platform !== "linux" }, async () => {
  const permit = fixedPermit()
  const permitCommit = createSandboxAdmissionPermitCommit(permit)
  const prepared = createSandboxDormantCreatePrepared(permit, createCanonicalR4BB1Reservation(permit))
  const args = permit.binding.requirement.workload.entrypoint.args
  await withFakeDocker(prepared, args, { extraInspectLabels: { "io.kodac.unexpected": "forbidden" } }, async ({ socketPath, events, createCount }) => {
    const runtime = createGvisorDockerDormantCreateRuntime({ socketPath, ...durableHarness(permit, events) })
    await assert.rejects(
      new GvisorDockerDormantCreateGateway(runtime).createDormantAdmission(permit, permitCommit),
      SandboxDormantCreateIndeterminateError,
    )
    assert.equal(createCount(), 1)
    assert.deepEqual(events, ["store:reservation", "store:prepared", "store:dispatch", "docker:create", "docker:inspect"])
  })
})

test("H4-R4B-B1 canonical Docker none endpoint is not counted as a live attachment and other networks fail closed", { skip: process.platform !== "linux" }, async () => {
  const permit = fixedPermit()
  const permitCommit = createSandboxAdmissionPermitCommit(permit)
  const prepared = createSandboxDormantCreatePrepared(permit, createCanonicalR4BB1Reservation(permit))
  const args = permit.binding.requirement.workload.entrypoint.args

  await withFakeDocker(prepared, args, {}, async ({ socketPath, events }) => {
    const runtime = createGvisorDockerDormantCreateRuntime({ socketPath, ...durableHarness(permit, events) })
    const result = await new GvisorDockerDormantCreateGateway(runtime).createDormantAdmission(permit, permitCommit)
    assert.equal(result.observation.networkMode, "none")
    assert.equal(result.observation.networkAttachmentCount, 0)
  })

  await withFakeDocker(prepared, args, { extraInspectNetworks: { bridge: {} } }, async ({ socketPath, events }) => {
    const runtime = createGvisorDockerDormantCreateRuntime({ socketPath, ...durableHarness(permit, events) })
    await assert.rejects(
      new GvisorDockerDormantCreateGateway(runtime).createDormantAdmission(permit, permitCommit),
      SandboxDormantCreateIndeterminateError,
    )
  })
})

test("H4-R4B-B1 unresolved create outcome burns the dispatch-claimed attempt and a retry remains read-only", { skip: process.platform !== "linux" }, async () => {
  const permit = fixedPermit()
  const permitCommit = createSandboxAdmissionPermitCommit(permit)
  const prepared = createSandboxDormantCreatePrepared(permit, createCanonicalR4BB1Reservation(permit))
  const args = permit.binding.requirement.workload.entrypoint.args
  await withFakeDocker(prepared, args, { loseCreateResponse: true, persistOnLostResponse: false }, async ({ socketPath, events, createCount }) => {
    const stores = durableHarness(permit, events)
    const gateway = new GvisorDockerDormantCreateGateway(createGvisorDockerDormantCreateRuntime({ socketPath, ...stores }))
    await assert.rejects(gateway.createDormantAdmission(permit, permitCommit), SandboxDormantCreateIndeterminateError)
    assert.equal(createCount(), 1)
    await assert.rejects(gateway.createDormantAdmission(permit, permitCommit), SandboxDormantCreateIndeterminateError)
    assert.equal(createCount(), 1)
  })
})

test("H4-R4B-B1 caller cancellation after Docker dispatch withholds authority while recovery remains exact", { skip: process.platform !== "linux" }, async () => {
  const permit = fixedPermit()
  const permitCommit = createSandboxAdmissionPermitCommit(permit)
  const prepared = createSandboxDormantCreatePrepared(permit, createCanonicalR4BB1Reservation(permit))
  const args = permit.binding.requirement.workload.entrypoint.args
  const controller = new AbortController()
  await withFakeDocker(prepared, args, { loseCreateResponse: true, persistOnLostResponse: true, abortController: controller }, async ({ socketPath, events, createCount }) => {
    const stores = durableHarness(permit, events)
    const gateway = new GvisorDockerDormantCreateGateway(createGvisorDockerDormantCreateRuntime({ socketPath, ...stores }))
    await assert.rejects(gateway.createDormantAdmission(permit, permitCommit, { signal: controller.signal }), SandboxDormantCreateBlockedError)
    assert.equal(createCount(), 1)
    const recovered = await gateway.createDormantAdmission(permit, permitCommit)
    assert.equal(recovered.recovered, true)
    assert.equal(createCount(), 1)
  })
})

test("H4-R4B-B1 pre-abort performs no durable reservation or Docker mutation", { skip: process.platform !== "linux" }, async () => {
  const permit = fixedPermit()
  const permitCommit = createSandboxAdmissionPermitCommit(permit)
  const prepared = createSandboxDormantCreatePrepared(permit, createCanonicalR4BB1Reservation(permit))
  const args = permit.binding.requirement.workload.entrypoint.args
  const controller = new AbortController()
  controller.abort()
  await withFakeDocker(prepared, args, {}, async ({ socketPath, events, createCount }) => {
    const gateway = new GvisorDockerDormantCreateGateway(createGvisorDockerDormantCreateRuntime({ socketPath, ...durableHarness(permit, events) }))
    await assert.rejects(gateway.createDormantAdmission(permit, permitCommit, { signal: controller.signal }), SandboxDormantCreateBlockedError)
    assert.deepEqual(events, [])
    assert.equal(createCount(), 0)
  })
})

test("H4-R4B-B1 schema is closed and encodes dormant-only authority", async () => {
  const schema = JSON.parse(await source("../../../schema/kdo-h4-r4b-b1-dormant-created-admission.schema.json"))
  assert.equal(schema.additionalProperties, false)
  assert.equal(schema.$defs.prepared.additionalProperties, false)
  assert.equal(schema.$defs.observation.additionalProperties, false)
  assert.equal(schema.$defs.labels.additionalProperties, false)
  assert.equal(schema.$defs.labels.properties["io.kodac.binding-version"].const, KDO_H4_R3F_BINDING_VERSION)
  assert.equal(schema.$defs.observation.properties.running.const, false)
  assert.equal(schema.$defs.observation.properties.pid.const, 0)
  assert.equal(schema.$defs.observation.properties.networkAttachmentCount.const, 0)
})

test("H4-R4B-B1 production authority is create-only and protected predecessor blobs remain canonical", async () => {
  const runtimeSource = await source("../src/execution/gateway-gvisor-docker-dormant-create-runtime.ts")
  const trustSource = await source("../src/trust/sandbox-admission-dormant-create.ts")
  assert.equal(runtimeSource.includes("node:child_process"), false)
  assert.equal(runtimeSource.includes("execFile"), false)
  assert.equal(runtimeSource.includes("spawn("), false)
  assert.equal(runtimeSource.includes('method: "DELETE"'), false)
  assert.doesNotMatch(runtimeSource, /\/containers\/[^\s"'`]*\/(?:start|exec|kill|stop)\b/)
  assert.equal(trustSource.includes("node:http"), false)
  assert.equal(trustSource.includes("node:fs"), false)

  const protectedFiles: readonly [string, string][] = [
    ["../src/execution/gateway.ts", "1732dae059fc878c04e6b1bb6a117385efe9ed6a"],
    ["../src/execution/sandbox-admission-approval-runtime.ts", "e6329d8a24d617883d97aca95240e48891dd5039"],
    ["../src/execution/gateway-gvisor-ttl-runtime.ts", "26b0f8094afb8e61ec29e05496c7aa91bf2f6e7f"],
    ["../src/execution/gateway-gvisor-output-runtime.ts", "b55e5068682d9ae824a619b682c694c3a95e6095"],
    ["../src/execution/gateway-gvisor-physical-proof-runtime.ts", "4e094b54cbe2c301deff5ecb64634199fca2c425"],
    ["../src/trust/sandbox-observer-docker-control-plane.ts", "f9e2dda11fe26d481e2e6c328c37cd37a6260106"],
    ["../src/trust/sandbox-admission-permit.ts", "c21d889e9da11a535f1d189820cfd9e906a445db"],
  ]
  for (const [path, expected] of protectedFiles) assert.equal(gitBlobSha1(await source(path)), expected, path)
})

test("H4-R4B-B1 package root exposes bounded gateway and validators but withholds raw mutation/store constructors", async () => {
  const root = await source("../src/index.ts")
  assert.match(root, /\bGvisorDockerDormantCreateGateway\b/)
  assert.match(root, /\bvalidateSandboxDormantCreatedAdmission\b/)
  assert.doesNotMatch(root, /\bcreateGvisorDockerDormantCreateRuntime\b/)
  assert.doesNotMatch(root, /\bcreateSandboxDormantCreateDispatchClaimCommit\b/)
  assert.doesNotMatch(root, /\bcreateSandboxDormantCreatePrepared\b/)
  assert.doesNotMatch(root, /\bcreateSandboxDormantCreatedAdmissionCommit\b/)
  assert.doesNotMatch(root, /\bcreateCanonicalR4BB1Reservation\b/)
})
