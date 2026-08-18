import { types as utilTypes } from "node:util"

import { inspectGvisorTtlPhysicalRecoveryRegistry } from "./gateway-gvisor-ttl-recovery-registry.ts"
import { reconcileGvisorTtlRecoveryState, type GvisorTtlRecoveryDecision } from "./gateway-gvisor-ttl-reconcile.ts"
import {
  KDO_H4_R3G_D_LIMITS,
  createGvisorTtlEvidenceCommit,
  payloadDigest,
  validateGvisorTtlEvidenceCommit,
  type GvisorTtlArmRecord,
  type GvisorTtlTerminalRecord,
} from "../trust/sandbox-lifecycle-gvisor-ttl.ts"
import {
  validateGvisorTtlK2RecoverySnapshot,
  type GvisorTtlK2RecoverySnapshot,
} from "../trust/sandbox-lifecycle-gvisor-ttl-recovery.ts"

export const KDO_H4_R3G_D_RECOVERY_RUNTIME_VERSION = "kodac-h4-r3g-d-recovery-runtime-v1" as const
const MAX_RECOVERY_SNAPSHOTS = 4_096

export interface GvisorTtlRecoveryRuntimeConfig {
  readonly version: typeof KDO_H4_R3G_D_RECOVERY_RUNTIME_VERSION
  readonly listRecoverySnapshots: () => Promise<unknown> | unknown
}

export interface GvisorTtlRecoveryCoordinatorConfig {
  readonly registryRoot: string
  readonly recoveryRuntime: GvisorTtlRecoveryRuntimeConfig
  readonly commitArmEvidence: (record: GvisorTtlArmRecord) => Promise<unknown> | unknown
  readonly commitTerminalEvidence: (record: GvisorTtlTerminalRecord) => Promise<unknown> | unknown
}

type ExpectedEvidenceCommit = Readonly<{
  kind: "prepared" | "arm" | "terminal"
  armOperationIdentity: string
  leaseIdentity: string | null
  recordIdentity: string
  payloadDigest: string
}>

function asPlainRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value) || utilTypes.isProxy(value)) throw new TypeError(`${label} must be a non-proxy plain object`)
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must use a plain-object prototype`)
  if (Object.getOwnPropertySymbols(value).length !== 0) throw new TypeError(`${label} must not contain symbol properties`)
  const descriptors = Object.getOwnPropertyDescriptors(value)
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (!("value" in descriptor) || descriptor.enumerable !== true) throw new TypeError(`${label}.${key} must be an enumerable data property`)
  }
  return value as Record<string, unknown>
}

function exactKeys(record: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(record).sort()
  const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) throw new TypeError(`${label} fields are not canonical`)
}

export function validateGvisorTtlRecoveryRuntimeConfig(value: unknown): GvisorTtlRecoveryRuntimeConfig {
  const record = asPlainRecord(value, "R3G-D recovery runtime config")
  exactKeys(record, ["version", "listRecoverySnapshots"], "R3G-D recovery runtime config")
  if (record.version !== KDO_H4_R3G_D_RECOVERY_RUNTIME_VERSION) throw new TypeError("R3G-D recovery runtime version mismatch")
  if (typeof record.listRecoverySnapshots !== "function") throw new TypeError("R3G-D listRecoverySnapshots must be a trusted function")
  return Object.freeze({
    version: KDO_H4_R3G_D_RECOVERY_RUNTIME_VERSION,
    listRecoverySnapshots: record.listRecoverySnapshots as GvisorTtlRecoveryRuntimeConfig["listRecoverySnapshots"],
  })
}

function strictDenseArray(value: unknown): readonly unknown[] {
  if (!Array.isArray(value) || utilTypes.isProxy(value)) throw new TypeError("R3G-D recovery snapshot reader must return a non-proxy array")
  if (Object.getOwnPropertySymbols(value).length !== 0) throw new TypeError("R3G-D recovery snapshot array must not contain symbol properties")
  if (value.length > MAX_RECOVERY_SNAPSHOTS) throw new TypeError("R3G-D recovery snapshot reader exceeded the internal recovery bound")
  const descriptors = Object.getOwnPropertyDescriptors(value)
  const allowed = new Set<string>(["length"])
  for (let index = 0; index < value.length; index += 1) allowed.add(String(index))
  for (const key of Object.keys(descriptors)) if (!allowed.has(key)) throw new TypeError("R3G-D recovery snapshot array contains non-canonical properties")
  const result: unknown[] = []
  for (let index = 0; index < value.length; index += 1) {
    const descriptor = descriptors[String(index)]
    if (descriptor === undefined || !("value" in descriptor) || descriptor.enumerable !== true) throw new TypeError("R3G-D recovery snapshot array must be dense data-only input")
    result.push(descriptor.value)
  }
  return Object.freeze(result)
}

async function boundedTrusted<T>(label: string, operation: () => Promise<T> | T): Promise<T> {
  let timer: NodeJS.Timeout | undefined
  try {
    return await Promise.race([
      Promise.resolve().then(operation),
      new Promise<never>((_, rejectPromise) => {
        timer = setTimeout(() => rejectPromise(new Error(`${label} timed out`)), KDO_H4_R3G_D_LIMITS.evidenceCommitTimeoutMs)
      }),
    ])
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}

function commitMatchesSnapshot(expected: ExpectedEvidenceCommit, snapshot: GvisorTtlK2RecoverySnapshot): boolean {
  if (snapshot.prepared.armOperationIdentity !== expected.armOperationIdentity) return false
  if (expected.kind === "prepared") {
    return expected.leaseIdentity === null && snapshot.prepared.intentIdentity === expected.recordIdentity && payloadDigest(snapshot.prepared) === expected.payloadDigest
  }
  if (expected.kind === "arm") {
    return snapshot.arm !== null && snapshot.arm.leaseIdentity === expected.leaseIdentity && snapshot.arm.recordIdentity === expected.recordIdentity && payloadDigest(snapshot.arm) === expected.payloadDigest
  }
  return snapshot.terminal !== null && snapshot.terminal.leaseIdentity === expected.leaseIdentity && snapshot.terminal.recordIdentity === expected.recordIdentity && payloadDigest(snapshot.terminal) === expected.payloadDigest
}

export class GvisorTtlRecoveryCoordinator {
  private readonly registryRoot: string
  private readonly recoveryRuntime: GvisorTtlRecoveryRuntimeConfig
  private readonly commitArmEvidence: GvisorTtlRecoveryCoordinatorConfig["commitArmEvidence"]
  private readonly commitTerminalEvidence: GvisorTtlRecoveryCoordinatorConfig["commitTerminalEvidence"]
  private recoveryComplete = false
  private recoveryInFlight: Promise<void> | undefined

  constructor(config: GvisorTtlRecoveryCoordinatorConfig) {
    const record = asPlainRecord(config, "R3G-D recovery coordinator config")
    exactKeys(record, ["registryRoot", "recoveryRuntime", "commitArmEvidence", "commitTerminalEvidence"], "R3G-D recovery coordinator config")
    if (typeof record.registryRoot !== "string" || record.registryRoot.length === 0) throw new TypeError("R3G-D recovery coordinator registryRoot is required")
    if (typeof record.commitArmEvidence !== "function" || typeof record.commitTerminalEvidence !== "function") throw new TypeError("R3G-D recovery coordinator commit functions are required")
    this.registryRoot = record.registryRoot
    this.recoveryRuntime = validateGvisorTtlRecoveryRuntimeConfig(record.recoveryRuntime)
    this.commitArmEvidence = record.commitArmEvidence as GvisorTtlRecoveryCoordinatorConfig["commitArmEvidence"]
    this.commitTerminalEvidence = record.commitTerminalEvidence as GvisorTtlRecoveryCoordinatorConfig["commitTerminalEvidence"]
  }

  private async readSnapshots(label: string): Promise<readonly GvisorTtlK2RecoverySnapshot[]> {
    const raw = await boundedTrusted(label, this.recoveryRuntime.listRecoverySnapshots)
    const values = strictDenseArray(raw)
    return Object.freeze(values.map((value) => validateGvisorTtlK2RecoverySnapshot(value)))
  }

  private async exactCommitExists(expected: ExpectedEvidenceCommit): Promise<boolean> {
    const snapshots = await this.readSnapshots(`R3G-D ${expected.kind} unknown-commit reconciliation`)
    const matches = snapshots.filter((snapshot) => snapshot.prepared.armOperationIdentity === expected.armOperationIdentity)
    if (matches.length > 1) throw new TypeError(`R3G-D duplicate K2 recovery snapshots for ${expected.armOperationIdentity}`)
    return matches.length === 1 && commitMatchesSnapshot(expected, matches[0])
  }

  async commitEvidenceExact(label: string, runtimeCommit: () => Promise<unknown> | unknown, expected: ExpectedEvidenceCommit): Promise<void> {
    let raw: unknown
    try {
      raw = await boundedTrusted(label, runtimeCommit)
    } catch (error) {
      if (await this.exactCommitExists(expected)) return
      throw error
    }
    // An explicit malformed/conflicting acknowledgement is authoritative failure;
    // recovery may only converge an unknown/exceptional persistence result.
    validateGvisorTtlEvidenceCommit(raw, expected)
  }

  private async applyDecision(decision: GvisorTtlRecoveryDecision): Promise<void> {
    if (decision.kind === "RETRY_PREPARED" || decision.kind === "ARM_CURRENT" || decision.kind === "TERMINAL_CURRENT") return
    if (decision.kind === "RECONCILE_ARM" || decision.kind === "RECONCILE_ARM_AND_TERMINAL") {
      const expected = createGvisorTtlEvidenceCommit({ kind: "arm", armOperationIdentity: decision.recoveredArm.armOperationIdentity, leaseIdentity: decision.recoveredArm.leaseIdentity, recordIdentity: decision.recoveredArm.recordIdentity, payloadDigest: payloadDigest(decision.recoveredArm) })
      await this.commitEvidenceExact("R3G-D recovered arm evidence commit", () => this.commitArmEvidence(decision.recoveredArm), expected)
    }
    if (decision.kind === "RECONCILE_TERMINAL" || decision.kind === "RECONCILE_ARM_AND_TERMINAL") {
      const expected = createGvisorTtlEvidenceCommit({ kind: "terminal", armOperationIdentity: decision.recoveredTerminal.armOperationIdentity, leaseIdentity: decision.recoveredTerminal.leaseIdentity, recordIdentity: decision.recoveredTerminal.recordIdentity, payloadDigest: payloadDigest(decision.recoveredTerminal) })
      await this.commitEvidenceExact("R3G-D recovered terminal evidence commit", () => this.commitTerminalEvidence(decision.recoveredTerminal), expected)
    }
  }

  private async runStartupRecovery(): Promise<void> {
    const k2Snapshots = await this.readSnapshots("R3G-D startup K2 recovery snapshot read")
    const physicalSnapshots = await inspectGvisorTtlPhysicalRecoveryRegistry(this.registryRoot)
    const decisions = reconcileGvisorTtlRecoveryState({ k2Snapshots, physicalSnapshots })
    for (const decision of decisions) await this.applyDecision(decision)
  }

  async ensureStartupRecovery(): Promise<void> {
    if (this.recoveryComplete) return
    if (this.recoveryInFlight !== undefined) return this.recoveryInFlight
    const attempt = this.runStartupRecovery()
    this.recoveryInFlight = attempt
    try {
      await attempt
      this.recoveryComplete = true
    } finally {
      if (this.recoveryInFlight === attempt) this.recoveryInFlight = undefined
    }
  }
}