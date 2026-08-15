import { createHash } from "node:crypto"
import { posix } from "node:path"
import { types as utilTypes } from "node:util"

import {
  validateSandboxExecutionRequirement,
  type SandboxExecutionRequirement,
} from "./sandbox-backend-evidence.ts"
import {
  KDO_H4_R3D_GVISOR_OBSERVER_PLAN_VERSION,
  KDO_H4_R3D_GVISOR_PROCESS_VERSION,
  KDO_H4_R3D_GVISOR_RUNTIME_CLASS,
  validateGvisorRuntimeObservationCandidate,
  validateGvisorStateObservation,
  validateGvisorStatsObservation,
  validateGvisorProcessObservation,
  type GvisorObserverPlan,
  type GvisorProcessObservation,
  type GvisorRuntimeObservationCandidate,
  type GvisorStateObservation,
  type GvisorStatsObservation,
} from "./sandbox-observer-gvisor.ts"

export const KDO_H4_R3E_RUNTIME_CONFIG_VERSION = "kodac-h4-r3e-runtime-config-v1" as const
export const KDO_H4_R3E_BINDING_REQUEST_VERSION = "kodac-h4-r3e-container-binding-request-v1" as const
export const KDO_H4_R3E_BINDING_VERSION = "kodac-h4-r3e-container-binding-v1" as const
export const KDO_H4_R3E_ARTIFACT_VERSION = "kodac-h4-r3e-artifact-v1" as const
export const KDO_H4_R3E_LINEAGE_VERSION = "kodac-h4-r3e-gvisor-runtime-lineage-v1" as const
export const KDO_H4_R3E_COMMIT_VERSION = "kodac-h4-r3e-lineage-commit-v1" as const
export const KDO_H4_R3E_EVIDENCE_CLASS = "e3-integrated-runtime-lineage" as const
export const KDO_H4_R3E_RUNSC_FD = 3 as const
export const KDO_H4_R3E_HELPER_FD = 4 as const

export const KDO_H4_R3E_LIMITS = Object.freeze({
  maxPathBytes: 4096,
  maxProviderIdBytes: 128,
  maxRunscBytes: 512 * 1024 * 1024,
  maxHelperBytes: 16 * 1024 * 1024,
  maxStateStdoutBytes: 65_536,
  maxStatsStdoutBytes: 262_144,
  maxHelperStdoutBytes: 512,
  maxStderrBytes: 4096,
  stateTimeoutMs: 5000,
  statsTimeoutMs: 5000,
  helperTimeoutMs: 3000,
} as const)

export interface GvisorContainerBindingRequest {
  readonly version: typeof KDO_H4_R3E_BINDING_REQUEST_VERSION
  readonly executionAttemptIdentity: string
  readonly requirementIdentity: string
  readonly workloadIdentity: string
  readonly bindingRequestIdentity: string
}

export interface GvisorContainerBinding {
  readonly version: typeof KDO_H4_R3E_BINDING_VERSION
  readonly providerId: string
  readonly executionAttemptIdentity: string
  readonly requirementIdentity: string
  readonly workloadIdentity: string
  readonly containerId: string
  readonly bindingIdentity: string
}

export type GvisorObserverArtifactRole = "runsc" | "observer-helper"

export interface GvisorObserverArtifact {
  readonly version: typeof KDO_H4_R3E_ARTIFACT_VERSION
  readonly role: GvisorObserverArtifactRole
  readonly sha256: string
  readonly sizeBytes: number
  readonly artifactIdentity: string
}

export interface GvisorRuntimeLineageRecord {
  readonly version: typeof KDO_H4_R3E_LINEAGE_VERSION
  readonly evidenceClass: typeof KDO_H4_R3E_EVIDENCE_CLASS
  readonly executionAttemptIdentity: string
  readonly requirementIdentity: string
  readonly workloadIdentity: string
  readonly containerBindingIdentity: string
  readonly containerId: string
  readonly observerImplementationIdentity: string
  readonly runscArtifactIdentity: string
  readonly observerHelperArtifactIdentity: string
  readonly planIdentity: string
  readonly stateIdentity: string
  readonly statsIdentity: string
  readonly processIdentity: string
  readonly r3dCandidateIdentity: string
  readonly runtimeInstanceIdentity: string
  readonly recordIdentity: string
}

export interface GvisorRuntimeLineageCommit {
  readonly version: typeof KDO_H4_R3E_COMMIT_VERSION
  readonly recordIdentity: string
  readonly commitIdentity: string
}

export interface GvisorObserverRuntimeConfig {
  readonly version: typeof KDO_H4_R3E_RUNTIME_CONFIG_VERSION
  readonly runscPath: string
  readonly expectedRunscSha256: string
  readonly observerHelperPath: string
  readonly expectedObserverHelperSha256: string
  readonly runtimeRoot: string
  readonly resolveContainerBinding: (request: GvisorContainerBindingRequest, options: { readonly signal?: AbortSignal }) => Promise<unknown> | unknown
  readonly commitLineageEvidence: (record: GvisorRuntimeLineageRecord) => Promise<unknown> | unknown
}

const SHA256 = /^[0-9a-f]{64}$/
const PROVIDER_ID = /^[a-z0-9][a-z0-9._-]{0,127}$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

function sha256Domain(domain: string, payload: string): string {
  return createHash("sha256")
    .update(Buffer.from(`KODAC-H4-R3E\0${domain}\0V1\0`, "ascii"))
    .update(Buffer.from(payload, "utf8"))
    .digest("hex")
}

function asPlainRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value) || utilTypes.isProxy(value)) throw new TypeError(`${label} must be a non-proxy plain object`)
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain object`)
  if (Object.getOwnPropertySymbols(value).length !== 0) throw new TypeError(`${label} must not contain symbol fields`)
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (descriptor.get !== undefined || descriptor.set !== undefined || !("value" in descriptor)) throw new TypeError(`${label}.${key} must be a data property`)
    if (!descriptor.enumerable || descriptor.value === undefined) throw new TypeError(`${label}.${key} must be an enumerable defined property`)
  }
  return value as Record<string, unknown>
}

function exactKeys(record: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(record).sort(); const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) throw new TypeError(`${label} must contain exactly: ${wanted.join(", ")}`)
}

function identity(value: unknown, label: string): string {
  if (typeof value !== "string" || !SHA256.test(value)) throw new TypeError(`${label} must be a lowercase SHA-256 identity`)
  return value
}

function sha(value: unknown, label: string): string {
  if (typeof value !== "string" || !SHA256.test(value)) throw new TypeError(`${label} must be 64 lowercase hexadecimal characters`)
  return value
}

function fullContainerId(value: unknown): string {
  if (typeof value !== "string" || !SHA256.test(value)) throw new TypeError("containerId must be exactly 64 lowercase hexadecimal characters")
  return value
}

function providerId(value: unknown): string {
  if (typeof value !== "string" || !PROVIDER_ID.test(value) || Buffer.byteLength(value, "utf8") > KDO_H4_R3E_LIMITS.maxProviderIdBytes) throw new TypeError("providerId must be a bounded lowercase canonical identifier")
  return value
}

function canonicalPath(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0 || value.includes("\0") || Buffer.byteLength(value, "utf8") > KDO_H4_R3E_LIMITS.maxPathBytes) throw new TypeError(`${label} must be a bounded non-empty POSIX path`)
  if (!posix.isAbsolute(value) || posix.normalize(value) !== value || (value.length > 1 && value.endsWith("/"))) throw new TypeError(`${label} must be a canonical absolute POSIX path`)
  return value
}

function positiveSize(value: unknown, maximum: number, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0 || value > maximum) throw new TypeError(`${label} must be an integer in 1..${maximum}`)
  return value
}

export function createGvisorExecutionAttemptIdentity(input: { requirementIdentity: string; workloadIdentity: string; nonce: string }): string {
  const record = asPlainRecord(input, "gVisor execution attempt input")
  exactKeys(record, ["requirementIdentity", "workloadIdentity", "nonce"], "gVisor execution attempt input")
  const requirementIdentity = identity(record.requirementIdentity, "requirementIdentity")
  const workloadIdentity = identity(record.workloadIdentity, "workloadIdentity")
  if (typeof record.nonce !== "string" || !UUID.test(record.nonce)) throw new TypeError("nonce must be a canonical lowercase UUID")
  return sha256Domain("EXECUTION_ATTEMPT", JSON.stringify({ requirementIdentity, workloadIdentity, nonce: record.nonce }))
}

function bindingRequestPreimage(input: Omit<GvisorContainerBindingRequest, "bindingRequestIdentity">): string {
  return JSON.stringify(input)
}

export function createGvisorContainerBindingRequest(input: { executionAttemptIdentity: string; requirement: SandboxExecutionRequirement }): GvisorContainerBindingRequest {
  const record = asPlainRecord(input, "gVisor container binding request input")
  exactKeys(record, ["executionAttemptIdentity", "requirement"], "gVisor container binding request input")
  const requirement = validateSandboxExecutionRequirement(record.requirement)
  if (requirement.requiredSemanticRuntimeClass !== KDO_H4_R3D_GVISOR_RUNTIME_CLASS) throw new TypeError("R3E requires requiredSemanticRuntimeClass=gvisor")
  const base = Object.freeze({
    version: KDO_H4_R3E_BINDING_REQUEST_VERSION,
    executionAttemptIdentity: identity(record.executionAttemptIdentity, "executionAttemptIdentity"),
    requirementIdentity: requirement.requirementIdentity,
    workloadIdentity: requirement.workload.workloadIdentity,
  })
  return Object.freeze({ ...base, bindingRequestIdentity: sha256Domain("BINDING_REQUEST", bindingRequestPreimage(base)) })
}

export function validateGvisorContainerBindingRequest(value: unknown): GvisorContainerBindingRequest {
  const record = asPlainRecord(value, "gVisor container binding request")
  exactKeys(record, ["version", "executionAttemptIdentity", "requirementIdentity", "workloadIdentity", "bindingRequestIdentity"], "gVisor container binding request")
  if (record.version !== KDO_H4_R3E_BINDING_REQUEST_VERSION) throw new TypeError("gVisor container binding request version mismatch")
  const base = Object.freeze({
    version: KDO_H4_R3E_BINDING_REQUEST_VERSION,
    executionAttemptIdentity: identity(record.executionAttemptIdentity, "executionAttemptIdentity"),
    requirementIdentity: identity(record.requirementIdentity, "requirementIdentity"),
    workloadIdentity: identity(record.workloadIdentity, "workloadIdentity"),
  })
  const expected = sha256Domain("BINDING_REQUEST", bindingRequestPreimage(base))
  if (identity(record.bindingRequestIdentity, "bindingRequestIdentity") !== expected) throw new TypeError("gVisor container binding request identity mismatch")
  return Object.freeze({ ...base, bindingRequestIdentity: expected })
}

function bindingPreimage(input: Omit<GvisorContainerBinding, "bindingIdentity">): string { return JSON.stringify(input) }

export function createGvisorContainerBinding(input: {
  providerId: string
  executionAttemptIdentity: string
  requirementIdentity: string
  workloadIdentity: string
  containerId: string
}): GvisorContainerBinding {
  const record = asPlainRecord(input, "gVisor container binding input")
  exactKeys(record, ["providerId", "executionAttemptIdentity", "requirementIdentity", "workloadIdentity", "containerId"], "gVisor container binding input")
  const base = Object.freeze({
    version: KDO_H4_R3E_BINDING_VERSION,
    providerId: providerId(record.providerId),
    executionAttemptIdentity: identity(record.executionAttemptIdentity, "binding executionAttemptIdentity"),
    requirementIdentity: identity(record.requirementIdentity, "binding requirementIdentity"),
    workloadIdentity: identity(record.workloadIdentity, "binding workloadIdentity"),
    containerId: fullContainerId(record.containerId),
  })
  return Object.freeze({ ...base, bindingIdentity: sha256Domain("CONTAINER_BINDING", bindingPreimage(base)) })
}

export function validateGvisorContainerBinding(value: unknown, request?: GvisorContainerBindingRequest): GvisorContainerBinding {
  const record = asPlainRecord(value, "gVisor container binding")
  exactKeys(record, ["version", "providerId", "executionAttemptIdentity", "requirementIdentity", "workloadIdentity", "containerId", "bindingIdentity"], "gVisor container binding")
  if (record.version !== KDO_H4_R3E_BINDING_VERSION) throw new TypeError("gVisor container binding version mismatch")
  const rebuilt = createGvisorContainerBinding({
    providerId: record.providerId as string,
    executionAttemptIdentity: record.executionAttemptIdentity as string,
    requirementIdentity: record.requirementIdentity as string,
    workloadIdentity: record.workloadIdentity as string,
    containerId: record.containerId as string,
  })
  if (identity(record.bindingIdentity, "bindingIdentity") !== rebuilt.bindingIdentity) throw new TypeError("gVisor container binding identity mismatch")
  if (request !== undefined) {
    const checked = validateGvisorContainerBindingRequest(request)
    if (rebuilt.executionAttemptIdentity !== checked.executionAttemptIdentity || rebuilt.requirementIdentity !== checked.requirementIdentity || rebuilt.workloadIdentity !== checked.workloadIdentity) throw new TypeError("gVisor container binding does not match its request")
  }
  return rebuilt
}

function artifactPreimage(input: Omit<GvisorObserverArtifact, "artifactIdentity">): string { return JSON.stringify(input) }

export function createGvisorObserverArtifact(input: { role: GvisorObserverArtifactRole; sha256: string; sizeBytes: number }): GvisorObserverArtifact {
  const record = asPlainRecord(input, "gVisor observer artifact input")
  exactKeys(record, ["role", "sha256", "sizeBytes"], "gVisor observer artifact input")
  if (record.role !== "runsc" && record.role !== "observer-helper") throw new TypeError("artifact role must be runsc or observer-helper")
  const maximum = record.role === "runsc" ? KDO_H4_R3E_LIMITS.maxRunscBytes : KDO_H4_R3E_LIMITS.maxHelperBytes
  const base = Object.freeze({ version: KDO_H4_R3E_ARTIFACT_VERSION, role: record.role, sha256: sha(record.sha256, "artifact sha256"), sizeBytes: positiveSize(record.sizeBytes, maximum, "artifact sizeBytes") })
  return Object.freeze({ ...base, artifactIdentity: sha256Domain("ARTIFACT", artifactPreimage(base)) })
}

export function validateGvisorObserverArtifact(value: unknown): GvisorObserverArtifact {
  const record = asPlainRecord(value, "gVisor observer artifact")
  exactKeys(record, ["version", "role", "sha256", "sizeBytes", "artifactIdentity"], "gVisor observer artifact")
  if (record.version !== KDO_H4_R3E_ARTIFACT_VERSION) throw new TypeError("gVisor observer artifact version mismatch")
  const rebuilt = createGvisorObserverArtifact({ role: record.role as GvisorObserverArtifactRole, sha256: record.sha256 as string, sizeBytes: record.sizeBytes as number })
  if (identity(record.artifactIdentity, "artifactIdentity") !== rebuilt.artifactIdentity) throw new TypeError("gVisor observer artifact identity mismatch")
  return rebuilt
}

export function createGvisorObserverImplementationIdentity(input: { runsc: GvisorObserverArtifact; helper: GvisorObserverArtifact }): string {
  const record = asPlainRecord(input, "gVisor observer implementation input")
  exactKeys(record, ["runsc", "helper"], "gVisor observer implementation input")
  const runsc = validateGvisorObserverArtifact(record.runsc)
  const helper = validateGvisorObserverArtifact(record.helper)
  if (runsc.role !== "runsc" || helper.role !== "observer-helper") throw new TypeError("observer implementation artifact roles mismatch")
  return sha256Domain("OBSERVER_IMPLEMENTATION", JSON.stringify({
    integrationVersion: KDO_H4_R3E_LINEAGE_VERSION,
    runscSha256: runsc.sha256,
    helperSha256: helper.sha256,
    r3dPlanVersion: KDO_H4_R3D_GVISOR_OBSERVER_PLAN_VERSION,
    r3dProcessVersion: KDO_H4_R3D_GVISOR_PROCESS_VERSION,
  }))
}

export function createGvisorRuntimeInstanceIdentity(input: {
  containerId: string
  state: GvisorStateObservation
  process: GvisorProcessObservation
  runscArtifactIdentity: string
  planIdentity: string
}): string {
  const record = asPlainRecord(input, "gVisor runtime instance input")
  exactKeys(record, ["containerId", "state", "process", "runscArtifactIdentity", "planIdentity"], "gVisor runtime instance input")
  const state = validateGvisorStateObservation(record.state)
  const process = validateGvisorProcessObservation(record.process)
  const containerId = fullContainerId(record.containerId)
  if (state.containerId !== containerId || process.pid !== state.pid) throw new TypeError("runtime instance subject mismatch")
  return sha256Domain("RUNTIME_INSTANCE", JSON.stringify({
    containerId,
    statePid: state.pid,
    startTicks: process.startTicks,
    runscArtifactIdentity: identity(record.runscArtifactIdentity, "runscArtifactIdentity"),
    planIdentity: identity(record.planIdentity, "planIdentity"),
  }))
}

function lineagePreimage(input: Omit<GvisorRuntimeLineageRecord, "recordIdentity">): string { return JSON.stringify(input) }

export function createGvisorRuntimeLineageRecord(input: {
  executionAttemptIdentity: string
  requirement: SandboxExecutionRequirement
  binding: GvisorContainerBinding
  runsc: GvisorObserverArtifact
  helper: GvisorObserverArtifact
  plan: GvisorObserverPlan
  state: GvisorStateObservation
  stats: GvisorStatsObservation
  process: GvisorProcessObservation
  candidate: GvisorRuntimeObservationCandidate
}): GvisorRuntimeLineageRecord {
  const record = asPlainRecord(input, "gVisor runtime lineage input")
  exactKeys(record, ["executionAttemptIdentity", "requirement", "binding", "runsc", "helper", "plan", "state", "stats", "process", "candidate"], "gVisor runtime lineage input")
  const requirement = validateSandboxExecutionRequirement(record.requirement)
  if (requirement.requiredSemanticRuntimeClass !== KDO_H4_R3D_GVISOR_RUNTIME_CLASS) throw new TypeError("R3E lineage requires gvisor")
  const binding = validateGvisorContainerBinding(record.binding)
  const runsc = validateGvisorObserverArtifact(record.runsc); const helper = validateGvisorObserverArtifact(record.helper)
  if (runsc.role !== "runsc" || helper.role !== "observer-helper") throw new TypeError("R3E lineage artifact role mismatch")
  const plan = record.plan as GvisorObserverPlan
  const state = validateGvisorStateObservation(record.state)
  const stats = validateGvisorStatsObservation(record.stats)
  const process = validateGvisorProcessObservation(record.process)
  const candidate = validateGvisorRuntimeObservationCandidate(record.candidate, { plan, state, stats, process })
  const executionAttemptIdentity = identity(record.executionAttemptIdentity, "executionAttemptIdentity")
  if (binding.executionAttemptIdentity !== executionAttemptIdentity || binding.requirementIdentity !== requirement.requirementIdentity || binding.workloadIdentity !== requirement.workload.workloadIdentity) throw new TypeError("R3E lineage binding mismatch")
  if (plan.containerId !== binding.containerId || state.containerId !== binding.containerId || stats.containerId !== binding.containerId || process.pid !== state.pid) throw new TypeError("R3E lineage runtime subject mismatch")
  const observerImplementationIdentity = createGvisorObserverImplementationIdentity({ runsc, helper })
  const runtimeInstanceIdentity = createGvisorRuntimeInstanceIdentity({ containerId: binding.containerId, state, process, runscArtifactIdentity: runsc.artifactIdentity, planIdentity: plan.planIdentity })
  const base = Object.freeze({
    version: KDO_H4_R3E_LINEAGE_VERSION,
    evidenceClass: KDO_H4_R3E_EVIDENCE_CLASS,
    executionAttemptIdentity,
    requirementIdentity: requirement.requirementIdentity,
    workloadIdentity: requirement.workload.workloadIdentity,
    containerBindingIdentity: binding.bindingIdentity,
    containerId: binding.containerId,
    observerImplementationIdentity,
    runscArtifactIdentity: runsc.artifactIdentity,
    observerHelperArtifactIdentity: helper.artifactIdentity,
    planIdentity: plan.planIdentity,
    stateIdentity: state.stateIdentity,
    statsIdentity: stats.statsIdentity,
    processIdentity: process.processIdentity,
    r3dCandidateIdentity: candidate.candidateIdentity,
    runtimeInstanceIdentity,
  })
  return Object.freeze({ ...base, recordIdentity: sha256Domain("RUNTIME_LINEAGE", lineagePreimage(base)) })
}

export function validateGvisorRuntimeLineageRecord(value: unknown): GvisorRuntimeLineageRecord {
  const record = asPlainRecord(value, "gVisor runtime lineage record")
  exactKeys(record, ["version", "evidenceClass", "executionAttemptIdentity", "requirementIdentity", "workloadIdentity", "containerBindingIdentity", "containerId", "observerImplementationIdentity", "runscArtifactIdentity", "observerHelperArtifactIdentity", "planIdentity", "stateIdentity", "statsIdentity", "processIdentity", "r3dCandidateIdentity", "runtimeInstanceIdentity", "recordIdentity"], "gVisor runtime lineage record")
  if (record.version !== KDO_H4_R3E_LINEAGE_VERSION || record.evidenceClass !== KDO_H4_R3E_EVIDENCE_CLASS) throw new TypeError("gVisor runtime lineage version/evidence class mismatch")
  const base = Object.freeze({
    version: KDO_H4_R3E_LINEAGE_VERSION,
    evidenceClass: KDO_H4_R3E_EVIDENCE_CLASS,
    executionAttemptIdentity: identity(record.executionAttemptIdentity, "executionAttemptIdentity"),
    requirementIdentity: identity(record.requirementIdentity, "requirementIdentity"),
    workloadIdentity: identity(record.workloadIdentity, "workloadIdentity"),
    containerBindingIdentity: identity(record.containerBindingIdentity, "containerBindingIdentity"),
    containerId: fullContainerId(record.containerId),
    observerImplementationIdentity: identity(record.observerImplementationIdentity, "observerImplementationIdentity"),
    runscArtifactIdentity: identity(record.runscArtifactIdentity, "runscArtifactIdentity"),
    observerHelperArtifactIdentity: identity(record.observerHelperArtifactIdentity, "observerHelperArtifactIdentity"),
    planIdentity: identity(record.planIdentity, "planIdentity"),
    stateIdentity: identity(record.stateIdentity, "stateIdentity"),
    statsIdentity: identity(record.statsIdentity, "statsIdentity"),
    processIdentity: identity(record.processIdentity, "processIdentity"),
    r3dCandidateIdentity: identity(record.r3dCandidateIdentity, "r3dCandidateIdentity"),
    runtimeInstanceIdentity: identity(record.runtimeInstanceIdentity, "runtimeInstanceIdentity"),
  })
  const expected = sha256Domain("RUNTIME_LINEAGE", lineagePreimage(base))
  if (identity(record.recordIdentity, "recordIdentity") !== expected) throw new TypeError("gVisor runtime lineage record identity mismatch")
  return Object.freeze({ ...base, recordIdentity: expected })
}

export function createGvisorRuntimeLineageCommit(record: GvisorRuntimeLineageRecord): GvisorRuntimeLineageCommit {
  const checked = validateGvisorRuntimeLineageRecord(record)
  const base = Object.freeze({ version: KDO_H4_R3E_COMMIT_VERSION, recordIdentity: checked.recordIdentity })
  return Object.freeze({ ...base, commitIdentity: sha256Domain("LINEAGE_COMMIT", checked.recordIdentity) })
}

export function validateGvisorRuntimeLineageCommit(value: unknown, expectedRecord: GvisorRuntimeLineageRecord): GvisorRuntimeLineageCommit {
  const record = asPlainRecord(value, "gVisor runtime lineage commit")
  exactKeys(record, ["version", "recordIdentity", "commitIdentity"], "gVisor runtime lineage commit")
  if (record.version !== KDO_H4_R3E_COMMIT_VERSION) throw new TypeError("gVisor runtime lineage commit version mismatch")
  const expected = createGvisorRuntimeLineageCommit(expectedRecord)
  if (identity(record.recordIdentity, "commit recordIdentity") !== expected.recordIdentity || identity(record.commitIdentity, "commitIdentity") !== expected.commitIdentity) throw new TypeError("gVisor runtime lineage commit identity mismatch")
  return expected
}

export function validateGvisorObserverRuntimeConfig(value: unknown): GvisorObserverRuntimeConfig {
  const record = asPlainRecord(value, "gVisor observer runtime config")
  exactKeys(record, ["version", "runscPath", "expectedRunscSha256", "observerHelperPath", "expectedObserverHelperSha256", "runtimeRoot", "resolveContainerBinding", "commitLineageEvidence"], "gVisor observer runtime config")
  if (record.version !== KDO_H4_R3E_RUNTIME_CONFIG_VERSION) throw new TypeError("gVisor observer runtime config version mismatch")
  if (typeof record.resolveContainerBinding !== "function" || typeof record.commitLineageEvidence !== "function") throw new TypeError("gVisor observer runtime callbacks must be functions")
  return Object.freeze({
    version: KDO_H4_R3E_RUNTIME_CONFIG_VERSION,
    runscPath: canonicalPath(record.runscPath, "runscPath"),
    expectedRunscSha256: sha(record.expectedRunscSha256, "expectedRunscSha256"),
    observerHelperPath: canonicalPath(record.observerHelperPath, "observerHelperPath"),
    expectedObserverHelperSha256: sha(record.expectedObserverHelperSha256, "expectedObserverHelperSha256"),
    runtimeRoot: canonicalPath(record.runtimeRoot, "runtimeRoot"),
    resolveContainerBinding: record.resolveContainerBinding as GvisorObserverRuntimeConfig["resolveContainerBinding"],
    commitLineageEvidence: record.commitLineageEvidence as GvisorObserverRuntimeConfig["commitLineageEvidence"],
  })
}
