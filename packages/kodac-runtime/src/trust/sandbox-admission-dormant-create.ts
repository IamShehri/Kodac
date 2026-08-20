import { createHash } from "node:crypto"
import { types as utilTypes } from "node:util"

import {
  createSandboxAdmissionConsumptionReservation,
  validateSandboxAdmissionConsumptionReservation,
  validateSandboxAdmissionPermit,
  type SandboxAdmissionConsumptionReservation,
} from "./sandbox-admission-permit.ts"
import { validateSandboxExecutionRequirement } from "./sandbox-backend-evidence.ts"
import { createGvisorContainerBinding } from "./sandbox-observer-gvisor-runtime.ts"
import {
  KDO_H4_R3F_BINDING_VERSION,
  KDO_H4_R3F_DOCKER_API_VERSION,
  KDO_H4_R3F_LABELS,
  KDO_H4_R3F_PROVIDER_ID,
} from "./sandbox-observer-docker-control-plane.ts"

export const KDO_H4_R4B_B1_VERSION = "kodac-h4-r4b-b1-dormant-create-v1" as const
export const KDO_H4_R4B_B1_RESERVATION_COMMIT_VERSION = "kodac-h4-r4b-b1-reservation-commit-v1" as const
export const KDO_H4_R4B_B1_CREATE_PREPARED_VERSION = "kodac-h4-r4b-b1-create-prepared-v1" as const
export const KDO_H4_R4B_B1_CREATE_PREPARED_COMMIT_VERSION = "kodac-h4-r4b-b1-create-prepared-commit-v1" as const
export const KDO_H4_R4B_B1_DOCKER_OBSERVATION_VERSION = "kodac-h4-r4b-b1-dormant-docker-observation-v1" as const
export const KDO_H4_R4B_B1_CREATED_ADMISSION_VERSION = "kodac-h4-r4b-b1-created-admission-v1" as const
export const KDO_H4_R4B_B1_CREATED_ADMISSION_COMMIT_VERSION = "kodac-h4-r4b-b1-created-admission-commit-v1" as const
export const KDO_H4_R4B_B1_DOCKER_API_VERSION = KDO_H4_R3F_DOCKER_API_VERSION
export const KDO_H4_R4B_B1_RUNTIME_NAME = "runsc" as const
export const KDO_H4_R4B_B1_NETWORK_MODE = "none" as const
export const KDO_H4_R4B_B1_DURABILITY = "durable" as const
export const KDO_H4_R4B_B1_DISPOSITIONS = Object.freeze(["created", "existing"] as const)
export type SandboxDormantCommitDisposition = (typeof KDO_H4_R4B_B1_DISPOSITIONS)[number]

export const KDO_H4_R4B_B1_LABELS = Object.freeze({
  bindingVersion: KDO_H4_R3F_LABELS.bindingVersion,
  requirementIdentity: KDO_H4_R3F_LABELS.requirementIdentity,
  workloadIdentity: KDO_H4_R3F_LABELS.workloadIdentity,
  executionAttemptIdentity: "io.kodac.execution-attempt-identity",
  createOperationIdentity: "io.kodac.r4b-b1-create-operation-identity",
} as const)

export interface SandboxDormantCreateLabels {
  readonly "io.kodac.binding-version": typeof KDO_H4_R3F_BINDING_VERSION
  readonly "io.kodac.requirement-identity": string
  readonly "io.kodac.workload-identity": string
  readonly "io.kodac.execution-attempt-identity": string
  readonly "io.kodac.r4b-b1-create-operation-identity": string
}

export interface SandboxAdmissionConsumptionReservationCommit {
  readonly version: typeof KDO_H4_R4B_B1_RESERVATION_COMMIT_VERSION
  readonly permitIdentity: string
  readonly executionAttemptIdentity: string
  readonly reservationIdentity: string
  readonly disposition: SandboxDormantCommitDisposition
  readonly durability: typeof KDO_H4_R4B_B1_DURABILITY
  readonly commitIdentity: string
}

export interface SandboxDormantCreatePrepared {
  readonly version: typeof KDO_H4_R4B_B1_CREATE_PREPARED_VERSION
  readonly reservation: SandboxAdmissionConsumptionReservation
  readonly permitIdentity: string
  readonly reservationIdentity: string
  readonly executionAttemptIdentity: string
  readonly requirementIdentity: string
  readonly workloadIdentity: string
  readonly sourceReference: string
  readonly sourceDigest: string
  readonly entrypointExecutable: string
  readonly argsIdentity: string
  readonly nanoCpus: number
  readonly memoryBytes: number
  readonly memorySwapBytes: number
  readonly runtimeName: typeof KDO_H4_R4B_B1_RUNTIME_NAME
  readonly networkMode: typeof KDO_H4_R4B_B1_NETWORK_MODE
  readonly restartPolicy: "no"
  readonly privileged: false
  readonly tty: false
  readonly createOperationIdentity: string
  readonly containerName: string
  readonly labels: SandboxDormantCreateLabels
  readonly preparedIdentity: string
}

export interface SandboxDormantCreatePreparedCommit {
  readonly version: typeof KDO_H4_R4B_B1_CREATE_PREPARED_COMMIT_VERSION
  readonly preparedIdentity: string
  readonly createOperationIdentity: string
  readonly disposition: SandboxDormantCommitDisposition
  readonly durability: typeof KDO_H4_R4B_B1_DURABILITY
  readonly commitIdentity: string
}

export interface SandboxDormantDockerObservation {
  readonly version: typeof KDO_H4_R4B_B1_DOCKER_OBSERVATION_VERSION
  readonly socketEndpointIdentity: string
  readonly executionAttemptIdentity: string
  readonly requirementIdentity: string
  readonly workloadIdentity: string
  readonly createOperationIdentity: string
  readonly containerId: string
  readonly containerName: string
  readonly bindingIdentity: string
  readonly imageManifestDigest: string
  readonly executable: string
  readonly argsIdentity: string
  readonly runtimeName: typeof KDO_H4_R4B_B1_RUNTIME_NAME
  readonly networkMode: typeof KDO_H4_R4B_B1_NETWORK_MODE
  readonly networkAttachmentCount: 0
  readonly nanoCpus: number
  readonly memoryBytes: number
  readonly memorySwapBytes: number
  readonly restartCount: 0
  readonly restartPolicy: "no"
  readonly privileged: false
  readonly tty: false
  readonly running: false
  readonly paused: false
  readonly restarting: false
  readonly dead: false
  readonly pid: 0
  readonly labels: SandboxDormantCreateLabels
  readonly observationIdentity: string
}

export interface SandboxDormantCreatedAdmission {
  readonly version: typeof KDO_H4_R4B_B1_CREATED_ADMISSION_VERSION
  readonly prepared: SandboxDormantCreatePrepared
  readonly observation: SandboxDormantDockerObservation
  readonly permitIdentity: string
  readonly reservationIdentity: string
  readonly executionAttemptIdentity: string
  readonly requirementIdentity: string
  readonly workloadIdentity: string
  readonly createOperationIdentity: string
  readonly preparedIdentity: string
  readonly containerId: string
  readonly containerName: string
  readonly bindingIdentity: string
  readonly observationIdentity: string
  readonly createdAdmissionIdentity: string
}

export interface SandboxDormantCreatedAdmissionCommit {
  readonly version: typeof KDO_H4_R4B_B1_CREATED_ADMISSION_COMMIT_VERSION
  readonly createdAdmissionIdentity: string
  readonly createOperationIdentity: string
  readonly containerId: string
  readonly disposition: SandboxDormantCommitDisposition
  readonly durability: typeof KDO_H4_R4B_B1_DURABILITY
  readonly commitIdentity: string
}

const SHA256 = /^[0-9a-f]{64}$/
const CONTAINER_NAME = /^kodac-r4b-b1-[0-9a-f]{32}$/

function sha256Domain(domain: string, payload: string | readonly string[]): string {
  const body = typeof payload === "string" ? payload : payload.join("\n")
  return createHash("sha256")
    .update(Buffer.from(`KODAC-H4-R4B-B1\0${domain}\0V1\0`, "ascii"))
    .update(Buffer.from(body, "utf8"))
    .digest("hex")
}

function asPlainRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value) || utilTypes.isProxy(value)) {
    throw new TypeError(`${label} must be a non-proxy plain object`)
  }
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain object`)
  if (Object.getOwnPropertySymbols(value).length !== 0) throw new TypeError(`${label} must not contain symbol fields`)
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (descriptor.get !== undefined || descriptor.set !== undefined || !("value" in descriptor)) {
      throw new TypeError(`${label}.${key} must be a data property`)
    }
    if (!descriptor.enumerable || descriptor.value === undefined) {
      throw new TypeError(`${label}.${key} must be an enumerable defined property`)
    }
  }
  return value as Record<string, unknown>
}

function exactKeys(record: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(record).sort()
  const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new TypeError(`${label} must contain exactly: ${wanted.join(", ")}`)
  }
}

function identity(value: unknown, label: string): string {
  if (typeof value !== "string" || !SHA256.test(value)) throw new TypeError(`${label} must be a lowercase SHA-256 identity`)
  return value
}

function fullContainerId(value: unknown, label = "containerId"): string {
  if (typeof value !== "string" || !SHA256.test(value)) throw new TypeError(`${label} must be exactly 64 lowercase hexadecimal characters`)
  return value
}

function disposition(value: unknown): SandboxDormantCommitDisposition {
  if (value !== "created" && value !== "existing") throw new TypeError("commit disposition must be created or existing")
  return value
}

function positiveSafeInteger(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) throw new TypeError(`${label} must be a positive safe integer`)
  return value
}

function exactContainerName(value: unknown): string {
  if (typeof value !== "string" || !CONTAINER_NAME.test(value)) throw new TypeError("containerName must be the canonical R4B-B1 deterministic name")
  return value
}

function labelsFrom(input: {
  requirementIdentity: string
  workloadIdentity: string
  executionAttemptIdentity: string
  createOperationIdentity: string
}): SandboxDormantCreateLabels {
  return Object.freeze({
    [KDO_H4_R4B_B1_LABELS.bindingVersion]: KDO_H4_R3F_BINDING_VERSION,
    [KDO_H4_R4B_B1_LABELS.requirementIdentity]: identity(input.requirementIdentity, "label requirementIdentity"),
    [KDO_H4_R4B_B1_LABELS.workloadIdentity]: identity(input.workloadIdentity, "label workloadIdentity"),
    [KDO_H4_R4B_B1_LABELS.executionAttemptIdentity]: identity(input.executionAttemptIdentity, "label executionAttemptIdentity"),
    [KDO_H4_R4B_B1_LABELS.createOperationIdentity]: identity(input.createOperationIdentity, "label createOperationIdentity"),
  }) as SandboxDormantCreateLabels
}

function validateLabels(value: unknown, expected: SandboxDormantCreateLabels): SandboxDormantCreateLabels {
  const record = asPlainRecord(value, "R4B-B1 Docker labels")
  exactKeys(record, Object.values(KDO_H4_R4B_B1_LABELS), "R4B-B1 Docker labels")
  for (const [key, wanted] of Object.entries(expected)) {
    if (record[key] !== wanted) throw new TypeError(`R4B-B1 Docker label mismatch: ${key}`)
  }
  return expected
}

export function createSandboxDormantExecutionAttemptIdentity(permitValue: unknown): string {
  const permit = validateSandboxAdmissionPermit(permitValue)
  return sha256Domain("EXECUTION_ATTEMPT", [
    KDO_H4_R4B_B1_VERSION,
    permit.permitIdentity,
    permit.requirementIdentity,
    permit.workloadIdentity,
    String(permit.admissionAttemptLimit),
  ])
}

export function createSandboxAdmissionConsumptionReservationCommit(
  reservationValue: unknown,
  permitValue: unknown,
  dispositionValue: SandboxDormantCommitDisposition,
): SandboxAdmissionConsumptionReservationCommit {
  const permit = validateSandboxAdmissionPermit(permitValue)
  const reservation = validateSandboxAdmissionConsumptionReservation(reservationValue, permit)
  const commitDisposition = disposition(dispositionValue)
  const base = Object.freeze({
    version: KDO_H4_R4B_B1_RESERVATION_COMMIT_VERSION,
    permitIdentity: reservation.permitIdentity,
    executionAttemptIdentity: reservation.executionAttemptIdentity,
    reservationIdentity: reservation.reservationIdentity,
    disposition: commitDisposition,
    durability: KDO_H4_R4B_B1_DURABILITY,
  })
  return Object.freeze({ ...base, commitIdentity: sha256Domain("RESERVATION_COMMIT", JSON.stringify(base)) })
}

export function validateSandboxAdmissionConsumptionReservationCommit(
  value: unknown,
  reservationValue: unknown,
  permitValue: unknown,
): SandboxAdmissionConsumptionReservationCommit {
  const record = asPlainRecord(value, "R4B-B1 reservation commit")
  exactKeys(record, ["version", "permitIdentity", "executionAttemptIdentity", "reservationIdentity", "disposition", "durability", "commitIdentity"], "R4B-B1 reservation commit")
  if (record.version !== KDO_H4_R4B_B1_RESERVATION_COMMIT_VERSION) throw new TypeError("R4B-B1 reservation commit version mismatch")
  if (record.durability !== KDO_H4_R4B_B1_DURABILITY) throw new TypeError("R4B-B1 reservation commit must be durable")
  const rebuilt = createSandboxAdmissionConsumptionReservationCommit(reservationValue, permitValue, disposition(record.disposition))
  for (const key of ["permitIdentity", "executionAttemptIdentity", "reservationIdentity", "disposition", "durability", "commitIdentity"] as const) {
    if (record[key] !== rebuilt[key]) throw new TypeError(`R4B-B1 reservation commit ${key} mismatch`)
  }
  return rebuilt
}

export function createSandboxDormantCreatePrepared(
  permitValue: unknown,
  reservationValue: unknown,
): SandboxDormantCreatePrepared {
  const permit = validateSandboxAdmissionPermit(permitValue)
  const reservation = validateSandboxAdmissionConsumptionReservation(reservationValue, permit)
  const requirement = validateSandboxExecutionRequirement(permit.binding.requirement)
  if (requirement.requiredSemanticRuntimeClass !== "gvisor") throw new TypeError("R4B-B1 requires requiredSemanticRuntimeClass=gvisor")
  if (requirement.downgradePolicy !== "forbid" || permit.credentialBindingIdentity !== null) throw new TypeError("R4B-B1 forbids runtime downgrade and credentials")
  if (requirement.workload.networkPolicy.mode !== "deny-all") throw new TypeError("R4B-B1 requires deny-all network policy")
  const expectedAttempt = createSandboxDormantExecutionAttemptIdentity(permit)
  if (reservation.executionAttemptIdentity !== expectedAttempt) throw new TypeError("R4B-B1 reservation must use the permit-derived execution attempt")

  const sourceReference = `${requirement.workload.source.repository}@${requirement.workload.source.digest}`
  const argsIdentity = sha256Domain("ENTRYPOINT_ARGS", JSON.stringify(requirement.workload.entrypoint.args))
  const nanoCpus = requirement.workload.resourcePolicy.cpuMillis * 1_000_000
  if (!Number.isSafeInteger(nanoCpus) || nanoCpus <= 0) throw new TypeError("R4B-B1 NanoCpus translation is not a positive safe integer")
  const memoryBytes = requirement.workload.resourcePolicy.memoryBytes
  const memorySwapBytes = memoryBytes
  const createOperationIdentity = sha256Domain("CREATE_OPERATION", [
    KDO_H4_R4B_B1_CREATE_PREPARED_VERSION,
    permit.permitIdentity,
    reservation.reservationIdentity,
    reservation.executionAttemptIdentity,
    requirement.requirementIdentity,
    requirement.workload.workloadIdentity,
  ])
  const containerName = `kodac-r4b-b1-${createOperationIdentity.slice(0, 32)}`
  const labels = labelsFrom({
    requirementIdentity: requirement.requirementIdentity,
    workloadIdentity: requirement.workload.workloadIdentity,
    executionAttemptIdentity: reservation.executionAttemptIdentity,
    createOperationIdentity,
  })
  const base = Object.freeze({
    version: KDO_H4_R4B_B1_CREATE_PREPARED_VERSION,
    reservation,
    permitIdentity: permit.permitIdentity,
    reservationIdentity: reservation.reservationIdentity,
    executionAttemptIdentity: reservation.executionAttemptIdentity,
    requirementIdentity: requirement.requirementIdentity,
    workloadIdentity: requirement.workload.workloadIdentity,
    sourceReference,
    sourceDigest: requirement.workload.source.digest,
    entrypointExecutable: requirement.workload.entrypoint.executable,
    argsIdentity,
    nanoCpus,
    memoryBytes,
    memorySwapBytes,
    runtimeName: KDO_H4_R4B_B1_RUNTIME_NAME,
    networkMode: KDO_H4_R4B_B1_NETWORK_MODE,
    restartPolicy: "no" as const,
    privileged: false as const,
    tty: false as const,
    createOperationIdentity,
    containerName,
    labels,
  })
  return Object.freeze({ ...base, preparedIdentity: sha256Domain("CREATE_PREPARED", JSON.stringify(base)) })
}

export function validateSandboxDormantCreatePrepared(
  value: unknown,
  permitValue: unknown,
): SandboxDormantCreatePrepared {
  const record = asPlainRecord(value, "R4B-B1 create prepared")
  exactKeys(record, [
    "version", "reservation", "permitIdentity", "reservationIdentity", "executionAttemptIdentity", "requirementIdentity", "workloadIdentity",
    "sourceReference", "sourceDigest", "entrypointExecutable", "argsIdentity", "nanoCpus", "memoryBytes", "memorySwapBytes", "runtimeName",
    "networkMode", "restartPolicy", "privileged", "tty", "createOperationIdentity", "containerName", "labels", "preparedIdentity",
  ], "R4B-B1 create prepared")
  if (record.version !== KDO_H4_R4B_B1_CREATE_PREPARED_VERSION) throw new TypeError("R4B-B1 create prepared version mismatch")
  const rebuilt = createSandboxDormantCreatePrepared(permitValue, record.reservation)
  validateLabels(record.labels, rebuilt.labels)
  for (const key of [
    "permitIdentity", "reservationIdentity", "executionAttemptIdentity", "requirementIdentity", "workloadIdentity", "sourceReference", "sourceDigest",
    "entrypointExecutable", "argsIdentity", "nanoCpus", "memoryBytes", "memorySwapBytes", "runtimeName", "networkMode", "restartPolicy",
    "privileged", "tty", "createOperationIdentity", "containerName", "preparedIdentity",
  ] as const) {
    if (record[key] !== rebuilt[key]) throw new TypeError(`R4B-B1 create prepared ${key} mismatch`)
  }
  return rebuilt
}

export function createSandboxDormantCreatePreparedCommit(
  preparedValue: unknown,
  permitValue: unknown,
  dispositionValue: SandboxDormantCommitDisposition,
): SandboxDormantCreatePreparedCommit {
  const prepared = validateSandboxDormantCreatePrepared(preparedValue, permitValue)
  const commitDisposition = disposition(dispositionValue)
  const base = Object.freeze({
    version: KDO_H4_R4B_B1_CREATE_PREPARED_COMMIT_VERSION,
    preparedIdentity: prepared.preparedIdentity,
    createOperationIdentity: prepared.createOperationIdentity,
    disposition: commitDisposition,
    durability: KDO_H4_R4B_B1_DURABILITY,
  })
  return Object.freeze({ ...base, commitIdentity: sha256Domain("CREATE_PREPARED_COMMIT", JSON.stringify(base)) })
}

export function validateSandboxDormantCreatePreparedCommit(
  value: unknown,
  preparedValue: unknown,
  permitValue: unknown,
): SandboxDormantCreatePreparedCommit {
  const record = asPlainRecord(value, "R4B-B1 create prepared commit")
  exactKeys(record, ["version", "preparedIdentity", "createOperationIdentity", "disposition", "durability", "commitIdentity"], "R4B-B1 create prepared commit")
  if (record.version !== KDO_H4_R4B_B1_CREATE_PREPARED_COMMIT_VERSION) throw new TypeError("R4B-B1 create prepared commit version mismatch")
  if (record.durability !== KDO_H4_R4B_B1_DURABILITY) throw new TypeError("R4B-B1 create prepared commit must be durable")
  const rebuilt = createSandboxDormantCreatePreparedCommit(preparedValue, permitValue, disposition(record.disposition))
  for (const key of ["preparedIdentity", "createOperationIdentity", "disposition", "durability", "commitIdentity"] as const) {
    if (record[key] !== rebuilt[key]) throw new TypeError(`R4B-B1 create prepared commit ${key} mismatch`)
  }
  return rebuilt
}

export function createSandboxDormantDockerObservation(input: {
  socketEndpointIdentity: string
  containerId: string
  containerName: string
  imageManifestDigest: string
  executable: string
  argsIdentity: string
  runtimeName: string
  networkMode: string
  networkAttachmentCount: number
  nanoCpus: number
  memoryBytes: number
  memorySwapBytes: number
  restartCount: number
  restartPolicy: string
  privileged: boolean
  tty: boolean
  running: boolean
  paused: boolean
  restarting: boolean
  dead: boolean
  pid: number
  labels: unknown
}, preparedValue: unknown, permitValue: unknown): SandboxDormantDockerObservation {
  const inputRecord = asPlainRecord(input, "R4B-B1 Docker observation input")
  exactKeys(inputRecord, [
    "socketEndpointIdentity", "containerId", "containerName", "imageManifestDigest", "executable", "argsIdentity", "runtimeName", "networkMode",
    "networkAttachmentCount", "nanoCpus", "memoryBytes", "memorySwapBytes", "restartCount", "restartPolicy", "privileged", "tty", "running", "paused",
    "restarting", "dead", "pid", "labels",
  ], "R4B-B1 Docker observation input")
  const prepared = validateSandboxDormantCreatePrepared(preparedValue, permitValue)
  const socketEndpointIdentity = identity(inputRecord.socketEndpointIdentity, "socketEndpointIdentity")
  const containerId = fullContainerId(inputRecord.containerId)
  if (exactContainerName(inputRecord.containerName) !== prepared.containerName) throw new TypeError("R4B-B1 observed container name mismatch")
  if (inputRecord.imageManifestDigest !== prepared.sourceDigest) throw new TypeError("R4B-B1 observed image manifest digest mismatch")
  if (inputRecord.executable !== prepared.entrypointExecutable || inputRecord.argsIdentity !== prepared.argsIdentity) throw new TypeError("R4B-B1 observed entrypoint mismatch")
  if (inputRecord.runtimeName !== KDO_H4_R4B_B1_RUNTIME_NAME || inputRecord.networkMode !== KDO_H4_R4B_B1_NETWORK_MODE) throw new TypeError("R4B-B1 observed runtime/network mismatch")
  if (inputRecord.networkAttachmentCount !== 0) throw new TypeError("R4B-B1 observed network attachments must be zero")
  if (positiveSafeInteger(inputRecord.nanoCpus, "observed NanoCpus") !== prepared.nanoCpus) throw new TypeError("R4B-B1 observed NanoCpus mismatch")
  if (positiveSafeInteger(inputRecord.memoryBytes, "observed Memory") !== prepared.memoryBytes) throw new TypeError("R4B-B1 observed Memory mismatch")
  if (positiveSafeInteger(inputRecord.memorySwapBytes, "observed MemorySwap") !== prepared.memorySwapBytes) throw new TypeError("R4B-B1 observed MemorySwap mismatch")
  if (inputRecord.restartCount !== 0 || inputRecord.restartPolicy !== "no" || inputRecord.privileged !== false || inputRecord.tty !== false) {
    throw new TypeError("R4B-B1 observed restart/privilege/TTY posture mismatch")
  }
  if (inputRecord.running !== false || inputRecord.paused !== false || inputRecord.restarting !== false || inputRecord.dead !== false || inputRecord.pid !== 0) {
    throw new TypeError("R4B-B1 positive observation requires a pristine dormant never-started container")
  }
  const labels = validateLabels(inputRecord.labels, prepared.labels)
  const binding = createGvisorContainerBinding({
    providerId: KDO_H4_R3F_PROVIDER_ID,
    executionAttemptIdentity: prepared.executionAttemptIdentity,
    requirementIdentity: prepared.requirementIdentity,
    workloadIdentity: prepared.workloadIdentity,
    containerId,
  })
  const base = Object.freeze({
    version: KDO_H4_R4B_B1_DOCKER_OBSERVATION_VERSION,
    socketEndpointIdentity,
    executionAttemptIdentity: prepared.executionAttemptIdentity,
    requirementIdentity: prepared.requirementIdentity,
    workloadIdentity: prepared.workloadIdentity,
    createOperationIdentity: prepared.createOperationIdentity,
    containerId,
    containerName: prepared.containerName,
    bindingIdentity: binding.bindingIdentity,
    imageManifestDigest: prepared.sourceDigest,
    executable: prepared.entrypointExecutable,
    argsIdentity: prepared.argsIdentity,
    runtimeName: KDO_H4_R4B_B1_RUNTIME_NAME,
    networkMode: KDO_H4_R4B_B1_NETWORK_MODE,
    networkAttachmentCount: 0 as const,
    nanoCpus: prepared.nanoCpus,
    memoryBytes: prepared.memoryBytes,
    memorySwapBytes: prepared.memorySwapBytes,
    restartCount: 0 as const,
    restartPolicy: "no" as const,
    privileged: false as const,
    tty: false as const,
    running: false as const,
    paused: false as const,
    restarting: false as const,
    dead: false as const,
    pid: 0 as const,
    labels,
  })
  return Object.freeze({ ...base, observationIdentity: sha256Domain("DORMANT_DOCKER_OBSERVATION", JSON.stringify(base)) })
}

export function validateSandboxDormantDockerObservation(
  value: unknown,
  preparedValue: unknown,
  permitValue: unknown,
): SandboxDormantDockerObservation {
  const record = asPlainRecord(value, "R4B-B1 Docker observation")
  exactKeys(record, [
    "version", "socketEndpointIdentity", "executionAttemptIdentity", "requirementIdentity", "workloadIdentity", "createOperationIdentity", "containerId",
    "containerName", "bindingIdentity", "imageManifestDigest", "executable", "argsIdentity", "runtimeName", "networkMode", "networkAttachmentCount",
    "nanoCpus", "memoryBytes", "memorySwapBytes", "restartCount", "restartPolicy", "privileged", "tty", "running", "paused", "restarting", "dead",
    "pid", "labels", "observationIdentity",
  ], "R4B-B1 Docker observation")
  if (record.version !== KDO_H4_R4B_B1_DOCKER_OBSERVATION_VERSION) throw new TypeError("R4B-B1 Docker observation version mismatch")
  const rebuilt = createSandboxDormantDockerObservation({
    socketEndpointIdentity: record.socketEndpointIdentity as string,
    containerId: record.containerId as string,
    containerName: record.containerName as string,
    imageManifestDigest: record.imageManifestDigest as string,
    executable: record.executable as string,
    argsIdentity: record.argsIdentity as string,
    runtimeName: record.runtimeName as string,
    networkMode: record.networkMode as string,
    networkAttachmentCount: record.networkAttachmentCount as number,
    nanoCpus: record.nanoCpus as number,
    memoryBytes: record.memoryBytes as number,
    memorySwapBytes: record.memorySwapBytes as number,
    restartCount: record.restartCount as number,
    restartPolicy: record.restartPolicy as string,
    privileged: record.privileged as boolean,
    tty: record.tty as boolean,
    running: record.running as boolean,
    paused: record.paused as boolean,
    restarting: record.restarting as boolean,
    dead: record.dead as boolean,
    pid: record.pid as number,
    labels: record.labels,
  }, preparedValue, permitValue)
  for (const key of [
    "executionAttemptIdentity", "requirementIdentity", "workloadIdentity", "createOperationIdentity", "containerId", "containerName", "bindingIdentity",
    "imageManifestDigest", "executable", "argsIdentity", "runtimeName", "networkMode", "networkAttachmentCount", "nanoCpus", "memoryBytes",
    "memorySwapBytes", "restartCount", "restartPolicy", "privileged", "tty", "running", "paused", "restarting", "dead", "pid", "observationIdentity",
  ] as const) {
    if (record[key] !== rebuilt[key]) throw new TypeError(`R4B-B1 Docker observation ${key} mismatch`)
  }
  validateLabels(record.labels, rebuilt.labels)
  return rebuilt
}

export function createSandboxDormantCreatedAdmission(
  preparedValue: unknown,
  observationValue: unknown,
  permitValue: unknown,
): SandboxDormantCreatedAdmission {
  const prepared = validateSandboxDormantCreatePrepared(preparedValue, permitValue)
  const observation = validateSandboxDormantDockerObservation(observationValue, prepared, permitValue)
  const base = Object.freeze({
    version: KDO_H4_R4B_B1_CREATED_ADMISSION_VERSION,
    prepared,
    observation,
    permitIdentity: prepared.permitIdentity,
    reservationIdentity: prepared.reservationIdentity,
    executionAttemptIdentity: prepared.executionAttemptIdentity,
    requirementIdentity: prepared.requirementIdentity,
    workloadIdentity: prepared.workloadIdentity,
    createOperationIdentity: prepared.createOperationIdentity,
    preparedIdentity: prepared.preparedIdentity,
    containerId: observation.containerId,
    containerName: observation.containerName,
    bindingIdentity: observation.bindingIdentity,
    observationIdentity: observation.observationIdentity,
  })
  return Object.freeze({ ...base, createdAdmissionIdentity: sha256Domain("CREATED_ADMISSION", JSON.stringify(base)) })
}

export function validateSandboxDormantCreatedAdmission(value: unknown, permitValue: unknown): SandboxDormantCreatedAdmission {
  const record = asPlainRecord(value, "R4B-B1 created admission")
  exactKeys(record, [
    "version", "prepared", "observation", "permitIdentity", "reservationIdentity", "executionAttemptIdentity", "requirementIdentity", "workloadIdentity",
    "createOperationIdentity", "preparedIdentity", "containerId", "containerName", "bindingIdentity", "observationIdentity", "createdAdmissionIdentity",
  ], "R4B-B1 created admission")
  if (record.version !== KDO_H4_R4B_B1_CREATED_ADMISSION_VERSION) throw new TypeError("R4B-B1 created admission version mismatch")
  const rebuilt = createSandboxDormantCreatedAdmission(record.prepared, record.observation, permitValue)
  for (const key of [
    "permitIdentity", "reservationIdentity", "executionAttemptIdentity", "requirementIdentity", "workloadIdentity", "createOperationIdentity", "preparedIdentity",
    "containerId", "containerName", "bindingIdentity", "observationIdentity", "createdAdmissionIdentity",
  ] as const) {
    if (record[key] !== rebuilt[key]) throw new TypeError(`R4B-B1 created admission ${key} mismatch`)
  }
  return rebuilt
}

export function createSandboxDormantCreatedAdmissionCommit(
  createdValue: unknown,
  permitValue: unknown,
  dispositionValue: SandboxDormantCommitDisposition,
): SandboxDormantCreatedAdmissionCommit {
  const created = validateSandboxDormantCreatedAdmission(createdValue, permitValue)
  const commitDisposition = disposition(dispositionValue)
  const base = Object.freeze({
    version: KDO_H4_R4B_B1_CREATED_ADMISSION_COMMIT_VERSION,
    createdAdmissionIdentity: created.createdAdmissionIdentity,
    createOperationIdentity: created.createOperationIdentity,
    containerId: created.containerId,
    disposition: commitDisposition,
    durability: KDO_H4_R4B_B1_DURABILITY,
  })
  return Object.freeze({ ...base, commitIdentity: sha256Domain("CREATED_ADMISSION_COMMIT", JSON.stringify(base)) })
}

export function validateSandboxDormantCreatedAdmissionCommit(
  value: unknown,
  createdValue: unknown,
  permitValue: unknown,
): SandboxDormantCreatedAdmissionCommit {
  const record = asPlainRecord(value, "R4B-B1 created admission commit")
  exactKeys(record, ["version", "createdAdmissionIdentity", "createOperationIdentity", "containerId", "disposition", "durability", "commitIdentity"], "R4B-B1 created admission commit")
  if (record.version !== KDO_H4_R4B_B1_CREATED_ADMISSION_COMMIT_VERSION) throw new TypeError("R4B-B1 created admission commit version mismatch")
  if (record.durability !== KDO_H4_R4B_B1_DURABILITY) throw new TypeError("R4B-B1 created admission commit must be durable")
  const rebuilt = createSandboxDormantCreatedAdmissionCommit(createdValue, permitValue, disposition(record.disposition))
  for (const key of ["createdAdmissionIdentity", "createOperationIdentity", "containerId", "disposition", "durability", "commitIdentity"] as const) {
    if (record[key] !== rebuilt[key]) throw new TypeError(`R4B-B1 created admission commit ${key} mismatch`)
  }
  return rebuilt
}

export function createCanonicalR4BB1Reservation(permitValue: unknown): SandboxAdmissionConsumptionReservation {
  const permit = validateSandboxAdmissionPermit(permitValue)
  return createSandboxAdmissionConsumptionReservation(permit, createSandboxDormantExecutionAttemptIdentity(permit))
}
