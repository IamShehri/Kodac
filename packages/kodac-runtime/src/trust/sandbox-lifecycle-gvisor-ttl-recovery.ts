import { createHash } from "node:crypto"
import { types as utilTypes } from "node:util"

import {
  validateSandboxExecutionRequirement,
  type SandboxExecutionRequirement,
} from "./sandbox-backend-evidence.ts"
import {
  validateGvisorTtlArmRecord,
  validateGvisorTtlPreparedIntent,
  validateGvisorTtlTerminalRecord,
  type GvisorTtlArmRecord,
  type GvisorTtlPreparedIntent,
  type GvisorTtlTerminalRecord,
} from "./sandbox-lifecycle-gvisor-ttl.ts"

export const KDO_H4_R3G_D_K2_RECOVERY_SNAPSHOT_VERSION = "kodac-h4-r3g-d-k2-recovery-snapshot-v1" as const

export type GvisorTtlK2RecoveryState = "PREPARED" | "ARM_COMMITTED" | "TERMINAL_COMMITTED"

export interface GvisorTtlK2RecoverySnapshot {
  readonly version: typeof KDO_H4_R3G_D_K2_RECOVERY_SNAPSHOT_VERSION
  readonly state: GvisorTtlK2RecoveryState
  readonly requirement: SandboxExecutionRequirement
  readonly prepared: GvisorTtlPreparedIntent
  readonly arm: GvisorTtlArmRecord | null
  readonly terminal: GvisorTtlTerminalRecord | null
  readonly snapshotIdentity: string
}

function hash(domain: string, value: unknown): string {
  if (!/^[A-Z0-9_]+$/.test(domain)) throw new TypeError("R3G-D recovery hash domain must be canonical uppercase ASCII")
  return createHash("sha256")
    .update(Buffer.from(`KODAC-H4-R3G-D\0${domain}\0V1\0`, "ascii"))
    .update(Buffer.from(JSON.stringify(value), "utf8"))
    .digest("hex")
}

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

function requirePreparedRequirementBinding(requirement: SandboxExecutionRequirement, prepared: GvisorTtlPreparedIntent): void {
  if (requirement.requiredSemanticRuntimeClass !== "gvisor") throw new TypeError("R3G-D recovery requires requiredSemanticRuntimeClass=gvisor")
  if (
    prepared.requirementIdentity !== requirement.requirementIdentity ||
    prepared.workloadIdentity !== requirement.workload.workloadIdentity ||
    prepared.ttlMs !== requirement.workload.resourcePolicy.ttlMs
  ) throw new TypeError("R3G-D recovery PREPARED intent does not match authoritative requirement")
}

function requireArmPreparedBinding(arm: GvisorTtlArmRecord, prepared: GvisorTtlPreparedIntent): void {
  if (
    arm.armOperationIdentity !== prepared.armOperationIdentity ||
    arm.canonicalArmPayloadDigest !== prepared.canonicalArmPayloadDigest ||
    arm.executionAttemptIdentity !== prepared.executionAttemptIdentity ||
    arm.requirementIdentity !== prepared.requirementIdentity ||
    arm.workloadIdentity !== prepared.workloadIdentity ||
    arm.containerBindingIdentity !== prepared.containerBindingIdentity ||
    arm.containerId !== prepared.containerId ||
    arm.runtimeInstanceIdentity !== prepared.runtimeInstanceIdentity ||
    arm.ttlMs !== prepared.ttlMs ||
    arm.watchdogImplementationIdentity !== prepared.watchdogImplementationIdentity
  ) throw new TypeError("R3G-D recovery arm record does not match authoritative PREPARED intent")
}

function recoveryState(arm: GvisorTtlArmRecord | null, terminal: GvisorTtlTerminalRecord | null): GvisorTtlK2RecoveryState {
  if (terminal !== null) return "TERMINAL_COMMITTED"
  if (arm !== null) return "ARM_COMMITTED"
  return "PREPARED"
}

export function createGvisorTtlK2RecoverySnapshot(input: {
  requirement: SandboxExecutionRequirement
  prepared: GvisorTtlPreparedIntent
  arm: GvisorTtlArmRecord | null
  terminal: GvisorTtlTerminalRecord | null
}): GvisorTtlK2RecoverySnapshot {
  const record = asPlainRecord(input, "R3G-D K2 recovery snapshot input")
  exactKeys(record, ["requirement", "prepared", "arm", "terminal"], "R3G-D K2 recovery snapshot input")
  const requirement = validateSandboxExecutionRequirement(record.requirement)
  const prepared = validateGvisorTtlPreparedIntent(record.prepared)
  requirePreparedRequirementBinding(requirement, prepared)

  let arm: GvisorTtlArmRecord | null = null
  if (record.arm !== null) {
    arm = validateGvisorTtlArmRecord(record.arm)
    requireArmPreparedBinding(arm, prepared)
  }

  let terminal: GvisorTtlTerminalRecord | null = null
  if (record.terminal !== null) {
    if (arm === null) throw new TypeError("R3G-D recovery terminal state requires authoritative arm evidence")
    terminal = validateGvisorTtlTerminalRecord(record.terminal, arm)
  }

  const state = recoveryState(arm, terminal)
  const base = Object.freeze({
    version: KDO_H4_R3G_D_K2_RECOVERY_SNAPSHOT_VERSION,
    state,
    requirement,
    prepared,
    arm,
    terminal,
  })
  const snapshotIdentity = hash("K2_RECOVERY_SNAPSHOT", [
    state,
    requirement.requirementIdentity,
    prepared.intentIdentity,
    arm?.recordIdentity ?? "-",
    terminal?.recordIdentity ?? "-",
  ])
  return Object.freeze({ ...base, snapshotIdentity })
}

export function validateGvisorTtlK2RecoverySnapshot(value: unknown): GvisorTtlK2RecoverySnapshot {
  const record = asPlainRecord(value, "R3G-D K2 recovery snapshot")
  exactKeys(record, ["version", "state", "requirement", "prepared", "arm", "terminal", "snapshotIdentity"], "R3G-D K2 recovery snapshot")
  if (record.version !== KDO_H4_R3G_D_K2_RECOVERY_SNAPSHOT_VERSION) throw new TypeError("R3G-D recovery snapshot version mismatch")
  const rebuilt = createGvisorTtlK2RecoverySnapshot({
    requirement: record.requirement as SandboxExecutionRequirement,
    prepared: record.prepared as GvisorTtlPreparedIntent,
    arm: record.arm as GvisorTtlArmRecord | null,
    terminal: record.terminal as GvisorTtlTerminalRecord | null,
  })
  if (record.state !== rebuilt.state) throw new TypeError("R3G-D recovery snapshot state does not match canonical evidence chain")
  if (record.snapshotIdentity !== rebuilt.snapshotIdentity) throw new TypeError("R3G-D recovery snapshot identity mismatch")
  return rebuilt
}
