import { createHash } from "node:crypto"
import { types as utilTypes } from "node:util"

import type { WorkspaceFileSystem } from "../edit/filesystem.ts"
import { createReceipt, type ExecutionReceipt } from "../evidence/receipt.ts"
import {
  validateSandboxExecutionRequirement,
  type SandboxBackendCapabilityDeclaration,
  type SandboxBackendObservation,
  type SandboxExecutionEvidence,
  type SandboxExecutionRequirement,
} from "../trust/sandbox-backend-evidence.ts"
import {
  KDO_H4_R3G_F_CAPABILITY,
  KDO_H4_R3G_F_LIMITS,
  createGvisorPhysicalConjunctionRecord,
  mintGvisorPhysicalProof,
  validateGvisorPhysicalConjunctionCommit,
  validateGvisorPhysicalEvidenceResolution,
  validateGvisorPhysicalSubjectCoherence,
  type GvisorPhysicalConjunctionCommit,
  type GvisorPhysicalConjunctionRecord,
  type GvisorPhysicalEvidenceResolution,
  type GvisorPhysicalSubjectCoherence,
} from "../trust/sandbox-physical-conjunction-gvisor.ts"
import type { ExecutionIntent, PolicyEngine, PolicyResult } from "../trust/policy.ts"
import {
  ExecutionBlockedError,
  ExecutionFailedError,
  ExecutionGateway,
  type ExecutionObserver,
} from "./gateway.ts"

export const KDO_H4_R3G_F_RUNTIME_VERSION = "kodac-h4-r3g-f-physical-proof-runtime-v1" as const

export interface GvisorPhysicalConjunctionRuntimeConfig {
  readonly resolveEvidence: (
    requirement: SandboxExecutionRequirement,
    options: { readonly signal?: AbortSignal },
  ) => Promise<unknown> | unknown
  readonly revalidateSubject: (
    requirement: SandboxExecutionRequirement,
    resolution: GvisorPhysicalEvidenceResolution,
    options: { readonly signal?: AbortSignal },
  ) => Promise<unknown> | unknown
  readonly commitConjunctionEvidence: (
    record: GvisorPhysicalConjunctionRecord,
    options: { readonly signal?: AbortSignal },
  ) => Promise<unknown> | unknown
}

export interface GvisorPhysicalConjunctionRuntime extends GvisorPhysicalConjunctionRuntimeConfig {
  readonly version: typeof KDO_H4_R3G_F_RUNTIME_VERSION
}

export interface GvisorPhysicalProofExecutionGatewayConfig {
  readonly filesystem: WorkspaceFileSystem
  readonly policy: PolicyEngine
  readonly conjunctionRuntime: GvisorPhysicalConjunctionRuntime
}

export interface GvisorPhysicalProofExecutionResult {
  readonly capability: SandboxBackendCapabilityDeclaration
  readonly observation: SandboxBackendObservation
  readonly evidence: SandboxExecutionEvidence
  readonly record: GvisorPhysicalConjunctionRecord
  readonly commit: GvisorPhysicalConjunctionCommit
  readonly trustedProvenanceIdentity: string
  readonly evidenceBundleIdentity: string
  readonly subjectCoherenceIdentity: string
}

type PlainRecord = Record<string, unknown>
const RUNTIME_BRAND = new WeakSet<object>()

function asPlainRecord(value: unknown, label: string): PlainRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value) || utilTypes.isProxy(value)) throw new TypeError(`${label} must be a non-proxy plain object`)
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain object`)
  if (Object.getOwnPropertySymbols(value).length !== 0) throw new TypeError(`${label} must not contain symbol fields`)
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (descriptor.get !== undefined || descriptor.set !== undefined || !("value" in descriptor) || !descriptor.enumerable || descriptor.value === undefined) {
      throw new TypeError(`${label}.${key} must be an enumerable defined data property`)
    }
  }
  return value as PlainRecord
}

function exactKeys(record: PlainRecord, expected: readonly string[], label: string): void {
  const actual = Object.keys(record).sort()
  const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) throw new TypeError(`${label} must contain exactly: ${wanted.join(", ")}`)
}

function validatePolicyResult(value: unknown): PolicyResult {
  const record = asPlainRecord(value, "R3G-F policy result")
  exactKeys(record, ["decision", "reason"], "R3G-F policy result")
  if (record.decision !== "allow" && record.decision !== "ask" && record.decision !== "deny") throw new TypeError("R3G-F policy decision is invalid")
  if (typeof record.reason !== "string" || record.reason.length === 0) throw new TypeError("R3G-F policy reason must be non-empty")
  return Object.freeze({ decision: record.decision, reason: record.reason })
}

function intentDigest(requirement: SandboxExecutionRequirement): string {
  return createHash("sha256")
    .update(Buffer.from("KODAC-H4-R3G-F\0INTENT\0V1\0", "ascii"))
    .update(Buffer.from(JSON.stringify([requirement.requirementIdentity, requirement.workload.workloadIdentity]), "utf8"))
    .digest("hex")
}

function proofIntent(requirement: SandboxExecutionRequirement): ExecutionIntent {
  return Object.freeze({
    capability: KDO_H4_R3G_F_CAPABILITY,
    paths: Object.freeze([]) as unknown as string[],
    inputDigest: intentDigest(requirement),
  })
}

export function createGvisorPhysicalConjunctionRuntime(value: GvisorPhysicalConjunctionRuntimeConfig): GvisorPhysicalConjunctionRuntime
export function createGvisorPhysicalConjunctionRuntime(value: unknown): GvisorPhysicalConjunctionRuntime
export function createGvisorPhysicalConjunctionRuntime(value: unknown): GvisorPhysicalConjunctionRuntime {
  const record = asPlainRecord(value, "R3G-F conjunction runtime config")
  exactKeys(record, ["resolveEvidence", "revalidateSubject", "commitConjunctionEvidence"], "R3G-F conjunction runtime config")
  for (const key of ["resolveEvidence", "revalidateSubject", "commitConjunctionEvidence"] as const) {
    if (typeof record[key] !== "function") throw new TypeError(`R3G-F ${key} must be a trusted function`)
  }
  const runtime = Object.freeze({
    version: KDO_H4_R3G_F_RUNTIME_VERSION,
    resolveEvidence: record.resolveEvidence as GvisorPhysicalConjunctionRuntimeConfig["resolveEvidence"],
    revalidateSubject: record.revalidateSubject as GvisorPhysicalConjunctionRuntimeConfig["revalidateSubject"],
    commitConjunctionEvidence: record.commitConjunctionEvidence as GvisorPhysicalConjunctionRuntimeConfig["commitConjunctionEvidence"],
  })
  RUNTIME_BRAND.add(runtime)
  return runtime
}

export function validateGvisorPhysicalConjunctionRuntime(value: unknown): GvisorPhysicalConjunctionRuntime {
  if (value === null || typeof value !== "object" || !RUNTIME_BRAND.has(value as object)) throw new TypeError("R3G-F conjunction runtime must originate from trusted K2 composition")
  const runtime = value as GvisorPhysicalConjunctionRuntime
  if (runtime.version !== KDO_H4_R3G_F_RUNTIME_VERSION) throw new TypeError("R3G-F conjunction runtime version mismatch")
  for (const key of ["resolveEvidence", "revalidateSubject", "commitConjunctionEvidence"] as const) {
    if (typeof runtime[key] !== "function") throw new TypeError(`R3G-F conjunction runtime ${key} is invalid`)
  }
  return runtime
}

async function boundedReadStage<T>(
  label: string,
  timeoutMs: number,
  callerSignal: AbortSignal | undefined,
  operation: (signal: AbortSignal) => Promise<T> | T,
): Promise<T> {
  if (callerSignal?.aborted) throw new Error(`${label} aborted before start`)
  const controller = new AbortController()
  const onCallerAbort = () => controller.abort()
  callerSignal?.addEventListener("abort", onCallerAbort, { once: true })
  let timer: NodeJS.Timeout | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort()
      reject(new Error(`${label} timed out`))
    }, timeoutMs)
  })
  const aborted = new Promise<never>((_, reject) => {
    controller.signal.addEventListener("abort", () => reject(new Error(`${label} aborted`)), { once: true })
  })
  try {
    return await Promise.race([Promise.resolve().then(() => operation(controller.signal)), timeout, aborted])
  } finally {
    if (timer !== undefined) clearTimeout(timer)
    callerSignal?.removeEventListener("abort", onCallerAbort)
  }
}

async function boundedDurableCommit(
  runtime: GvisorPhysicalConjunctionRuntime,
  record: GvisorPhysicalConjunctionRecord,
  callerSignal?: AbortSignal,
): Promise<unknown> {
  if (callerSignal?.aborted) throw new Error("R3G-F final durable commit aborted before start")
  const controller = new AbortController()
  const onCallerAbort = () => controller.abort()
  callerSignal?.addEventListener("abort", onCallerAbort, { once: true })
  let timer: NodeJS.Timeout | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort()
      reject(new Error("R3G-F final durable commit timed out"))
    }, KDO_H4_R3G_F_LIMITS.commitTimeoutMs)
  })
  const aborted = new Promise<never>((_, reject) => {
    controller.signal.addEventListener("abort", () => reject(new Error("R3G-F final durable commit aborted")), { once: true })
  })
  try {
    const result = await Promise.race([
      Promise.resolve().then(() => runtime.commitConjunctionEvidence(record, { signal: controller.signal })),
      timeout,
      aborted,
    ])
    if (callerSignal?.aborted) throw new Error("R3G-F caller aborted before positive durable completion")
    return result
  } finally {
    if (timer !== undefined) clearTimeout(timer)
    callerSignal?.removeEventListener("abort", onCallerAbort)
  }
}

export class GvisorPhysicalProofExecutionGateway extends ExecutionGateway {
  private readonly physicalPolicy: PolicyEngine
  private readonly conjunctionRuntime: GvisorPhysicalConjunctionRuntime

  constructor(config: GvisorPhysicalProofExecutionGatewayConfig) {
    super(config.filesystem, config.policy)
    this.physicalPolicy = config.policy
    this.conjunctionRuntime = validateGvisorPhysicalConjunctionRuntime(config.conjunctionRuntime)
  }

  private async failureReceipt(intent: ExecutionIntent, policy: PolicyResult, startedAt: string, message: string, observer?: ExecutionObserver): Promise<ExecutionReceipt> {
    const receipt = createReceipt({
      capability: intent.capability,
      inputDigest: intent.inputDigest,
      paths: intent.paths,
      policy,
      startedAt,
      completedAt: new Date().toISOString(),
      result: { status: "failure", error: message },
    })
    await observer?.onReceipt?.(receipt)
    return receipt
  }

  async proveGvisorPhysicalExecution(
    requirementValue: SandboxExecutionRequirement,
    observer?: ExecutionObserver,
    options: { readonly signal?: AbortSignal } = {},
  ): Promise<GvisorPhysicalProofExecutionResult> {
    const requirement = validateSandboxExecutionRequirement(requirementValue)
    const startedAt = new Date().toISOString()
    const intent = proofIntent(requirement)
    await observer?.onIntent?.(intent)
    const policy = validatePolicyResult(await this.physicalPolicy.evaluate(intent))
    await observer?.onPolicy?.(intent, policy)
    if (policy.decision !== "allow") {
      const reason = policy.decision === "ask" ? "R3G-F physical proof conjunction does not permit ASK" : policy.reason
      const receipt = createReceipt({
        capability: intent.capability,
        inputDigest: intent.inputDigest,
        paths: intent.paths,
        policy,
        startedAt,
        completedAt: new Date().toISOString(),
        result: { status: "blocked", reason },
      })
      await observer?.onReceipt?.(receipt)
      throw new ExecutionBlockedError(reason, receipt)
    }

    try {
      if (process.platform !== "linux") throw new Error("R3G-F physical proof conjunction requires Linux")
      if (requirement.requiredSemanticRuntimeClass !== "gvisor") throw new Error("R3G-F v1 requires requiredSemanticRuntimeClass=gvisor")
      if (requirement.workload.credentialBindingIdentity !== null) throw new Error("R3G-F v1 requires null credential binding")

      const resolutionRaw = await boundedReadStage(
        "R3G-F trusted predecessor evidence resolution",
        KDO_H4_R3G_F_LIMITS.resolveTimeoutMs,
        options.signal,
        (signal) => this.conjunctionRuntime.resolveEvidence(requirement, { signal }),
      )
      const resolution = validateGvisorPhysicalEvidenceResolution(resolutionRaw, requirement)

      const coherenceRaw = await boundedReadStage(
        "R3G-F final exact-subject coherence revalidation",
        KDO_H4_R3G_F_LIMITS.coherenceTimeoutMs,
        options.signal,
        (signal) => this.conjunctionRuntime.revalidateSubject(requirement, resolution, { signal }),
      )
      const coherence: GvisorPhysicalSubjectCoherence = validateGvisorPhysicalSubjectCoherence(coherenceRaw, requirement, resolution)

      // No asynchronous work is permitted between the final subject bracket and
      // canonical mint construction. These operations are pure and deterministic.
      const mint = mintGvisorPhysicalProof(requirement, resolution, coherence)
      const record = createGvisorPhysicalConjunctionRecord({ requirement, resolution, coherence, mint })

      // The positive evidence exists only inside this call until the exact final
      // record is durably acknowledged. It is never passed to the commit callback.
      const commitRaw = await boundedDurableCommit(this.conjunctionRuntime, record, options.signal)
      const commit = validateGvisorPhysicalConjunctionCommit(commitRaw, record)

      const receipt = createReceipt({
        capability: intent.capability,
        inputDigest: intent.inputDigest,
        paths: intent.paths,
        policy,
        startedAt,
        completedAt: new Date().toISOString(),
        result: { status: "success", outputDigest: record.recordIdentity, outputBytes: 0, exitCode: 0 },
      })
      await observer?.onReceipt?.(receipt)
      return Object.freeze({
        capability: mint.capability,
        observation: mint.observation,
        evidence: mint.evidence,
        record,
        commit,
        trustedProvenanceIdentity: resolution.trustedProvenanceIdentity,
        evidenceBundleIdentity: resolution.evidenceBundleIdentity,
        subjectCoherenceIdentity: coherence.subjectCoherenceIdentity,
      })
    } catch (error) {
      if (error instanceof ExecutionBlockedError || error instanceof ExecutionFailedError) throw error
      const message = error instanceof Error ? error.message : String(error)
      const receipt = await this.failureReceipt(intent, policy, startedAt, message, observer)
      throw new ExecutionFailedError(message, receipt, { cause: error })
    }
  }
}