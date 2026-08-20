import { types as utilTypes } from "node:util"

import {
  createApprovalEvidence,
  createApprovalRequest,
  validateApprovalDecision,
  validateApprovalEvidenceCommit,
  type ApprovalEvidence,
  type ApprovalEvidenceCommit,
  type ApprovalOutcome,
  type ApprovalRequest,
} from "../trust/approval.ts"
import {
  createSandboxExecutionApprovalBinding,
  createSandboxExecutionApprovalIntent,
  validateSandboxExecutionApprovalBinding,
  type SandboxExecutionApprovalBinding,
} from "../trust/sandbox-execution-approval-binding.ts"
import {
  createSandboxAdmissionPermit,
  validateSandboxAdmissionPermitCommit,
  type SandboxAdmissionPermit,
  type SandboxAdmissionPermitCommit,
} from "../trust/sandbox-admission-permit.ts"
import { validateSandboxExecutionRequirement } from "../trust/sandbox-backend-evidence.ts"
import type { ExecutionIntent, PolicyEngine, PolicyResult } from "../trust/policy.ts"

export const KDO_H4_R4B_A_RUNTIME_VERSION = "kodac-h4-r4b-a-sandbox-admission-approval-runtime-v1" as const

export interface SandboxAdmissionApprovalRuntimeConfig {
  readonly policy: PolicyEngine
  readonly approval: {
    readonly service: {
      readonly decide: (request: ApprovalRequest, options?: { readonly signal?: AbortSignal }) => Promise<unknown> | unknown
    }
    readonly evidence: {
      readonly commit: (evidence: ApprovalEvidence) => Promise<unknown> | unknown
    }
  }
  readonly commitAdmissionPermit: (
    permit: SandboxAdmissionPermit,
    options: { readonly signal?: AbortSignal },
  ) => Promise<unknown> | unknown
}

export interface SandboxAdmissionApprovalRuntime {
  readonly version: typeof KDO_H4_R4B_A_RUNTIME_VERSION
  readonly evaluatePolicy: (intent: ExecutionIntent) => Promise<unknown> | unknown
  readonly decide: (request: ApprovalRequest, options?: { readonly signal?: AbortSignal }) => Promise<unknown> | unknown
  readonly commitApprovalEvidence: (evidence: ApprovalEvidence) => Promise<unknown> | unknown
  readonly commitAdmissionPermit: (
    permit: SandboxAdmissionPermit,
    options: { readonly signal?: AbortSignal },
  ) => Promise<unknown> | unknown
}

export interface SandboxAdmissionApprovalResult {
  readonly permit: SandboxAdmissionPermit
  readonly commit: SandboxAdmissionPermitCommit
}

export class SandboxAdmissionApprovalBlockedError extends Error {
  readonly policy: PolicyResult
  readonly outcome?: ApprovalOutcome

  constructor(message: string, policy: PolicyResult, outcome?: ApprovalOutcome) {
    super(message)
    this.name = "SandboxAdmissionApprovalBlockedError"
    this.policy = policy
    this.outcome = outcome
  }
}

export class SandboxAdmissionApprovalUnprovenError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = "SandboxAdmissionApprovalUnprovenError"
  }
}

type PlainRecord = Record<string, unknown>
const RUNTIME_BRAND = new WeakSet<object>()

function asPlainRecord(value: unknown, label: string): PlainRecord {
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
    if (!descriptor.enumerable) throw new TypeError(`${label}.${key} must be enumerable`)
    if (descriptor.value === undefined) throw new TypeError(`${label}.${key} must be defined`)
  }
  return value as PlainRecord
}

function exactKeys(record: PlainRecord, expected: readonly string[], label: string): void {
  const actual = Object.keys(record).sort()
  const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new TypeError(`${label} must contain exactly: ${wanted.join(", ")}`)
  }
}

function requireFunction<T extends (...args: never[]) => unknown>(value: unknown, label: string): T {
  if (typeof value !== "function") throw new TypeError(`${label} must be a function`)
  return value as T
}

function validatePolicyResult(value: unknown): PolicyResult {
  const record = asPlainRecord(value, "R4B-A policy result")
  exactKeys(record, ["decision", "reason"], "R4B-A policy result")
  if (record.decision !== "allow" && record.decision !== "ask" && record.decision !== "deny") {
    throw new TypeError("R4B-A policy decision is invalid")
  }
  if (typeof record.reason !== "string" || record.reason.length === 0) throw new TypeError("R4B-A policy reason must be non-empty")
  return Object.freeze({ decision: record.decision, reason: record.reason })
}

function strictApprovalDecision(value: unknown, request: ApprovalRequest) {
  const record = asPlainRecord(value, "R4B-A approval decision")
  exactKeys(record, ["version", "requestIdentity", "requestInstanceId", "outcome"], "R4B-A approval decision")
  return validateApprovalDecision(Object.freeze({
    version: record.version,
    requestIdentity: record.requestIdentity,
    requestInstanceId: record.requestInstanceId,
    outcome: record.outcome,
  }), request)
}

function strictApprovalEvidenceCommit(value: unknown, evidence: ApprovalEvidence, label: string): ApprovalEvidenceCommit {
  const record = asPlainRecord(value, label)
  exactKeys(record, ["version", "evidenceIdentity", "durability"], label)
  return validateApprovalEvidenceCommit(Object.freeze({
    version: record.version,
    evidenceIdentity: record.evidenceIdentity,
    durability: record.durability,
  }), evidence)
}

export function createSandboxAdmissionApprovalRuntime(value: SandboxAdmissionApprovalRuntimeConfig): SandboxAdmissionApprovalRuntime
export function createSandboxAdmissionApprovalRuntime(value: unknown): SandboxAdmissionApprovalRuntime
export function createSandboxAdmissionApprovalRuntime(value: unknown): SandboxAdmissionApprovalRuntime {
  const config = asPlainRecord(value, "R4B-A runtime config")
  exactKeys(config, ["policy", "approval", "commitAdmissionPermit"], "R4B-A runtime config")

  const policy = asPlainRecord(config.policy, "R4B-A policy")
  exactKeys(policy, ["evaluate"], "R4B-A policy")
  const evaluate = requireFunction<PolicyEngine["evaluate"]>(policy.evaluate, "R4B-A policy evaluate")

  const approval = asPlainRecord(config.approval, "R4B-A approval runtime")
  exactKeys(approval, ["service", "evidence"], "R4B-A approval runtime")
  const service = asPlainRecord(approval.service, "R4B-A approval service")
  exactKeys(service, ["decide"], "R4B-A approval service")
  const decide = requireFunction<SandboxAdmissionApprovalRuntime["decide"]>(service.decide, "R4B-A approval service decide")
  const evidence = asPlainRecord(approval.evidence, "R4B-A approval evidence sink")
  exactKeys(evidence, ["commit"], "R4B-A approval evidence sink")
  const commitEvidence = requireFunction<SandboxAdmissionApprovalRuntime["commitApprovalEvidence"]>(evidence.commit, "R4B-A approval evidence commit")
  const commitAdmissionPermit = requireFunction<SandboxAdmissionApprovalRuntime["commitAdmissionPermit"]>(config.commitAdmissionPermit, "R4B-A admission permit commit")

  const runtime = Object.freeze({
    version: KDO_H4_R4B_A_RUNTIME_VERSION,
    evaluatePolicy: (intent: ExecutionIntent) => evaluate.call(policy, intent),
    decide: (request: ApprovalRequest, options?: { readonly signal?: AbortSignal }) => decide.call(service, request, options),
    commitApprovalEvidence: (approvalEvidence: ApprovalEvidence) => commitEvidence.call(evidence, approvalEvidence),
    commitAdmissionPermit: (permit: SandboxAdmissionPermit, options: { readonly signal?: AbortSignal }) => commitAdmissionPermit.call(config, permit, options),
  })
  RUNTIME_BRAND.add(runtime)
  return runtime
}

export function validateSandboxAdmissionApprovalRuntime(value: unknown): SandboxAdmissionApprovalRuntime {
  if (value === null || typeof value !== "object" || !RUNTIME_BRAND.has(value as object)) {
    throw new TypeError("R4B-A runtime must originate from trusted K2 composition")
  }
  const runtime = value as SandboxAdmissionApprovalRuntime
  if (runtime.version !== KDO_H4_R4B_A_RUNTIME_VERSION) throw new TypeError("R4B-A runtime version mismatch")
  return runtime
}

async function commitApprovalEvidence(
  runtime: SandboxAdmissionApprovalRuntime,
  evidence: ApprovalEvidence,
  label: string,
): Promise<ApprovalEvidenceCommit> {
  let raw: unknown
  try {
    raw = await runtime.commitApprovalEvidence(evidence)
  } catch (error) {
    throw new SandboxAdmissionApprovalUnprovenError(`${label} could not be durably committed`, { cause: error })
  }
  try {
    return strictApprovalEvidenceCommit(raw, evidence, label)
  } catch (error) {
    throw new SandboxAdmissionApprovalUnprovenError(`${label} durable acknowledgment is invalid`, { cause: error })
  }
}

async function decideApprovalOutcome(
  runtime: SandboxAdmissionApprovalRuntime,
  request: ApprovalRequest,
  signal?: AbortSignal,
): Promise<ApprovalOutcome> {
  if (signal?.aborted) return "cancelled"

  let started: Promise<unknown> | unknown
  try {
    started = runtime.decide(request, { signal })
  } catch {
    return signal?.aborted ? "cancelled" : "unavailable"
  }

  const settled = Promise.resolve(started).then(
    (value) => ({ kind: "fulfilled" as const, value }),
    (error: unknown) => ({ kind: "rejected" as const, error }),
  )
  if (signal === undefined) {
    const result = await settled
    if (result.kind === "rejected") return "unavailable"
    try {
      return strictApprovalDecision(result.value, request).outcome
    } catch {
      return "unavailable"
    }
  }

  let abortHandler: (() => void) | undefined
  const aborted = new Promise<{ readonly kind: "aborted" }>((resolve) => {
    abortHandler = () => resolve({ kind: "aborted" })
    signal.addEventListener("abort", abortHandler, { once: true })
    if (signal.aborted) abortHandler()
  })

  try {
    const first = await Promise.race([settled, aborted])
    if (first.kind === "aborted") return "cancelled"
    if (first.kind === "rejected") return signal.aborted ? "cancelled" : "unavailable"
    if (signal.aborted) return "cancelled"
    try {
      return strictApprovalDecision(first.value, request).outcome
    } catch {
      return signal.aborted ? "cancelled" : "unavailable"
    }
  } finally {
    if (abortHandler !== undefined) signal.removeEventListener("abort", abortHandler)
  }
}

function asynchronousMutationResult<T>(value: Promise<T> | T, label: string): Promise<T> | null {
  if (utilTypes.isPromise(value)) return Promise.resolve(value as Promise<T>)
  if (value === null || (typeof value !== "object" && typeof value !== "function")) return null
  let thenValue: unknown
  try {
    thenValue = Reflect.get(value as object, "then")
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error(`${label} failed while inspecting trusted asynchronous result: ${String(error)}`)
  }
  return typeof thenValue === "function" ? Promise.resolve(value as unknown as PromiseLike<T>) : null
}

function cancelledPermitPolicy(): PolicyResult {
  return Object.freeze({ decision: "ask", reason: "operation aborted" })
}

async function commitPermitAuthoritatively(
  runtime: SandboxAdmissionApprovalRuntime,
  permit: SandboxAdmissionPermit,
  callerSignal?: AbortSignal,
): Promise<SandboxAdmissionPermitCommit> {
  const label = "R4B-A admission permit durable commit"
  if (callerSignal?.aborted) {
    throw new SandboxAdmissionApprovalBlockedError(`${label} aborted before start`, cancelledPermitPolicy(), "cancelled")
  }

  const controller = new AbortController()
  const onAbort = () => controller.abort()
  callerSignal?.addEventListener("abort", onAbort, { once: true })
  if (callerSignal?.aborted) controller.abort()
  const abortOutcome = new Promise<{ readonly kind: "aborted" }>((resolve) => {
    controller.signal.addEventListener("abort", () => resolve({ kind: "aborted" }), { once: true })
  })

  try {
    if (controller.signal.aborted) {
      throw new SandboxAdmissionApprovalBlockedError(`${label} aborted before mutation start`, cancelledPermitPolicy(), "cancelled")
    }

    let started: Promise<unknown> | unknown
    try {
      started = runtime.commitAdmissionPermit(permit, { signal: controller.signal })
    } catch (error) {
      if (controller.signal.aborted) throw new SandboxAdmissionApprovalUnprovenError(`${label} aborted before durable completion`, { cause: error })
      throw new SandboxAdmissionApprovalUnprovenError(`${label} failed`, { cause: error })
    }

    const mutation = asynchronousMutationResult(started, label)
    let raw: unknown
    if (mutation === null) {
      if (controller.signal.aborted) throw new SandboxAdmissionApprovalUnprovenError(`${label} returned success after abort`)
      raw = started
    } else {
      const mutationOutcome = mutation.then(
        (result) => ({ kind: "fulfilled" as const, result }),
        (error: unknown) => ({ kind: "rejected" as const, error }),
      )
      const first = await Promise.race([mutationOutcome, abortOutcome])
      if (first.kind === "aborted") {
        const final = await mutationOutcome
        if (final.kind === "rejected") throw new SandboxAdmissionApprovalUnprovenError(`${label} aborted before durable completion`, { cause: final.error })
        throw new SandboxAdmissionApprovalUnprovenError(`${label} settled successfully after abort; positive permit is withheld`)
      }
      if (first.kind === "rejected") throw new SandboxAdmissionApprovalUnprovenError(`${label} failed`, { cause: first.error })
      if (controller.signal.aborted) throw new SandboxAdmissionApprovalUnprovenError(`${label} settled successfully after abort; positive permit is withheld`)
      raw = first.result
    }

    try {
      return validateSandboxAdmissionPermitCommit(raw, permit)
    } catch (error) {
      throw new SandboxAdmissionApprovalUnprovenError(`${label} durable acknowledgment is invalid`, { cause: error })
    }
  } finally {
    callerSignal?.removeEventListener("abort", onAbort)
  }
}

export class SandboxAdmissionApprovalGateway {
  private readonly runtime: SandboxAdmissionApprovalRuntime

  constructor(runtime: SandboxAdmissionApprovalRuntime) {
    this.runtime = validateSandboxAdmissionApprovalRuntime(runtime)
  }

  async authorizeSandboxAdmission(
    requirementValue: unknown,
    options: { readonly signal?: AbortSignal } = {},
  ): Promise<SandboxAdmissionApprovalResult> {
    const requirement = validateSandboxExecutionRequirement(requirementValue)
    const intent = createSandboxExecutionApprovalIntent(requirement)
    const policy = validatePolicyResult(await this.runtime.evaluatePolicy(intent))

    if (policy.decision === "deny") {
      throw new SandboxAdmissionApprovalBlockedError(`R4B-A sandbox admission denied: ${policy.reason}`, policy)
    }
    if (policy.decision === "allow") {
      throw new SandboxAdmissionApprovalBlockedError("R4B-A cannot fabricate one-shot approval from policy=allow", policy)
    }
    if (options.signal?.aborted) {
      throw new SandboxAdmissionApprovalBlockedError("R4B-A sandbox admission aborted before one-shot approval", policy, "cancelled")
    }

    const request = createApprovalRequest(intent)
    const binding = createSandboxExecutionApprovalBinding(requirement, request)
    const askedEvidence = createApprovalEvidence(request, "asked")
    const askedEvidenceCommit = await commitApprovalEvidence(this.runtime, askedEvidence, "R4B-A asked approval evidence")

    let outcome = await decideApprovalOutcome(this.runtime, request, options.signal)
    if (options.signal?.aborted) outcome = "cancelled"

    const decidedEvidence = createApprovalEvidence(request, "decided", outcome)
    const decidedEvidenceCommit = await commitApprovalEvidence(this.runtime, decidedEvidence, "R4B-A decided approval evidence")

    if (outcome !== "allowed-once") {
      throw new SandboxAdmissionApprovalBlockedError(`R4B-A one-shot approval outcome: ${outcome}`, policy, outcome)
    }
    if (options.signal?.aborted) {
      throw new SandboxAdmissionApprovalBlockedError("R4B-A sandbox admission aborted after allowed-once decision", policy, "cancelled")
    }

    const revalidatedBinding: SandboxExecutionApprovalBinding = validateSandboxExecutionApprovalBinding(binding)
    const revalidatedRequirement = validateSandboxExecutionRequirement(requirement)
    if (revalidatedBinding.requirementIdentity !== revalidatedRequirement.requirementIdentity) {
      throw new SandboxAdmissionApprovalUnprovenError("R4B-A requirement identity drifted after approval")
    }
    if (revalidatedBinding.approvalRequestIdentity !== request.requestIdentity || revalidatedBinding.approvalRequestInstanceId !== request.requestInstanceId) {
      throw new SandboxAdmissionApprovalUnprovenError("R4B-A approval occurrence drifted after decision persistence")
    }

    const permit = createSandboxAdmissionPermit({
      binding: revalidatedBinding,
      askedEvidence,
      askedEvidenceCommit,
      decidedEvidence,
      decidedEvidenceCommit,
    })
    const commit = await commitPermitAuthoritatively(this.runtime, permit, options.signal)
    return Object.freeze({ permit, commit })
  }
}
