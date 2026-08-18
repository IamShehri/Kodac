import { recoverGvisorTtlLogicalArmRecord } from "./gateway-gvisor-ttl-arm-replay.ts"
import type { GvisorTtlPhysicalRecoverySnapshot } from "./gateway-gvisor-ttl-recovery-registry.ts"
import { recoverGvisorTtlLogicalTerminalRecord } from "./gateway-gvisor-ttl-terminal-replay.ts"
import {
  validateGvisorTtlK2RecoverySnapshot,
  type GvisorTtlK2RecoverySnapshot,
} from "../trust/sandbox-lifecycle-gvisor-ttl-recovery.ts"
import type {
  GvisorTtlArmRecord,
  GvisorTtlTerminalRecord,
} from "../trust/sandbox-lifecycle-gvisor-ttl.ts"

const MAX_RECOVERY_OPERATIONS = 4_096

export type GvisorTtlRecoveryDecision =
  | Readonly<{ kind: "RETRY_PREPARED"; k2: GvisorTtlK2RecoverySnapshot }>
  | Readonly<{ kind: "RECONCILE_ARM"; k2: GvisorTtlK2RecoverySnapshot; physical: GvisorTtlPhysicalRecoverySnapshot; recoveredArm: GvisorTtlArmRecord }>
  | Readonly<{ kind: "ARM_CURRENT"; k2: GvisorTtlK2RecoverySnapshot; physical: GvisorTtlPhysicalRecoverySnapshot; recoveredArm: GvisorTtlArmRecord }>
  | Readonly<{ kind: "RECONCILE_ARM_AND_TERMINAL"; k2: GvisorTtlK2RecoverySnapshot; physical: GvisorTtlPhysicalRecoverySnapshot; recoveredArm: GvisorTtlArmRecord; recoveredTerminal: GvisorTtlTerminalRecord }>
  | Readonly<{ kind: "RECONCILE_TERMINAL"; k2: GvisorTtlK2RecoverySnapshot; physical: GvisorTtlPhysicalRecoverySnapshot; recoveredArm: GvisorTtlArmRecord; recoveredTerminal: GvisorTtlTerminalRecord }>
  | Readonly<{ kind: "TERMINAL_CURRENT"; k2: GvisorTtlK2RecoverySnapshot; physical: GvisorTtlPhysicalRecoverySnapshot; recoveredArm: GvisorTtlArmRecord; recoveredTerminal: GvisorTtlTerminalRecord }>

function assertPhysicalMatchesPrepared(physical: GvisorTtlPhysicalRecoverySnapshot, k2: GvisorTtlK2RecoverySnapshot): void {
  const prepared = k2.prepared
  const lease = physical.lease
  if (
    physical.armOperationIdentity !== prepared.armOperationIdentity ||
    physical.claim.armOperationIdentity !== prepared.armOperationIdentity ||
    lease.armOperationIdentity !== prepared.armOperationIdentity ||
    lease.canonicalArmPayloadDigest !== prepared.canonicalArmPayloadDigest ||
    lease.executionAttemptIdentity !== prepared.executionAttemptIdentity ||
    lease.requirementIdentity !== prepared.requirementIdentity ||
    lease.workloadIdentity !== prepared.workloadIdentity ||
    lease.containerBindingIdentity !== prepared.containerBindingIdentity ||
    lease.containerId !== prepared.containerId ||
    lease.runtimeInstanceIdentity !== prepared.runtimeInstanceIdentity ||
    lease.ttlMs !== prepared.ttlMs ||
    lease.watchdogImplementationIdentity !== prepared.watchdogImplementationIdentity
  ) throw new TypeError("R3G-D physical recovery state does not match authoritative K2 PREPARED intent")
}

function canonicalK2Snapshots(values: readonly GvisorTtlK2RecoverySnapshot[]): ReadonlyMap<string, GvisorTtlK2RecoverySnapshot> {
  if (!Array.isArray(values) || values.length > MAX_RECOVERY_OPERATIONS) throw new TypeError("R3G-D K2 recovery snapshot set exceeds the internal recovery bound")
  const map = new Map<string, GvisorTtlK2RecoverySnapshot>()
  for (const value of values) {
    const snapshot = validateGvisorTtlK2RecoverySnapshot(value)
    const operation = snapshot.prepared.armOperationIdentity
    if (map.has(operation)) throw new TypeError(`R3G-D duplicate K2 recovery snapshot for ${operation}`)
    map.set(operation, snapshot)
  }
  return map
}

function canonicalPhysicalSnapshots(values: readonly GvisorTtlPhysicalRecoverySnapshot[]): ReadonlyMap<string, GvisorTtlPhysicalRecoverySnapshot> {
  if (!Array.isArray(values) || values.length > MAX_RECOVERY_OPERATIONS) throw new TypeError("R3G-D physical recovery snapshot set exceeds the internal recovery bound")
  const map = new Map<string, GvisorTtlPhysicalRecoverySnapshot>()
  for (const snapshot of values) {
    if (snapshot === null || typeof snapshot !== "object" || typeof snapshot.armOperationIdentity !== "string") throw new TypeError("R3G-D physical recovery snapshot is malformed")
    if (snapshot.clockContinuity !== "SAME_BOOT" && snapshot.clockContinuity !== "UNRECOVERABLE_CLOCK_DOMAIN") throw new TypeError("R3G-D physical recovery clock continuity is malformed")
    if (map.has(snapshot.armOperationIdentity)) throw new TypeError(`R3G-D duplicate physical recovery snapshot for ${snapshot.armOperationIdentity}`)
    map.set(snapshot.armOperationIdentity, snapshot)
  }
  return map
}

export function reconcileGvisorTtlRecoveryState(input: {
  k2Snapshots: readonly GvisorTtlK2RecoverySnapshot[]
  physicalSnapshots: readonly GvisorTtlPhysicalRecoverySnapshot[]
}): readonly GvisorTtlRecoveryDecision[] {
  const k2ByOperation = canonicalK2Snapshots(input.k2Snapshots)
  const physicalByOperation = canonicalPhysicalSnapshots(input.physicalSnapshots)

  for (const operation of physicalByOperation.keys()) {
    if (!k2ByOperation.has(operation)) throw new TypeError(`R3G-D orphan physical recovery state ${operation} has no authoritative K2 intent`)
  }

  const decisions: GvisorTtlRecoveryDecision[] = []
  for (const operation of [...k2ByOperation.keys()].sort()) {
    const k2 = k2ByOperation.get(operation) as GvisorTtlK2RecoverySnapshot
    const physical = physicalByOperation.get(operation)
    if (physical === undefined) {
      if (k2.state !== "PREPARED") throw new TypeError(`R3G-D committed K2 state ${operation} is missing authoritative physical recovery state`)
      decisions.push(Object.freeze({ kind: "RETRY_PREPARED" as const, k2 }))
      continue
    }

    assertPhysicalMatchesPrepared(physical, k2)
    if (physical.clockContinuity !== "SAME_BOOT") throw new TypeError(`R3G-D recovery ${operation} is UNRECOVERABLE_CLOCK_DOMAIN; a fresh TTL window is forbidden`)
    if (physical.armReplay === null) {
      if (k2.state !== "PREPARED") throw new TypeError(`R3G-D committed K2 arm state ${operation} has no durable positive physical arm replay`)
      if (physical.terminal !== null) throw new TypeError(`R3G-D terminal physical state ${operation} cannot exist without durable positive physical arm replay`)
      throw new TypeError(`R3G-D physical lease ${operation} exists without durable positive arm replay; re-arm or positive recovery is forbidden`)
    }

    const recoveredArm = recoverGvisorTtlLogicalArmRecord({ prepared: k2.prepared, physicalLease: physical.lease, replay: physical.armReplay })
    if (k2.arm !== null && k2.arm.recordIdentity !== recoveredArm.recordIdentity) throw new TypeError(`R3G-D recovered arm ${operation} conflicts with authoritative K2 arm evidence`)

    if (physical.terminal === null) {
      if (k2.terminal !== null) throw new TypeError(`R3G-D K2 terminal state ${operation} has no authoritative physical terminal state`)
      throw new TypeError(`R3G-D recovery ${operation} has durable ARM state without terminal state; the restarted K2 process does not retain the authenticated watchdog control channels, so positive ARM recovery or ARM_CURRENT classification is forbidden`)
    }

    const recoveredTerminal = recoverGvisorTtlLogicalTerminalRecord({ arm: recoveredArm, physicalLease: physical.lease, armReplay: physical.armReplay, physicalTerminal: physical.terminal })
    if (k2.terminal !== null && k2.terminal.recordIdentity !== recoveredTerminal.recordIdentity) throw new TypeError(`R3G-D recovered terminal ${operation} conflicts with authoritative K2 terminal evidence`)
    if (k2.arm === null) decisions.push(Object.freeze({ kind: "RECONCILE_ARM_AND_TERMINAL" as const, k2, physical, recoveredArm, recoveredTerminal }))
    else if (k2.terminal === null) decisions.push(Object.freeze({ kind: "RECONCILE_TERMINAL" as const, k2, physical, recoveredArm, recoveredTerminal }))
    else decisions.push(Object.freeze({ kind: "TERMINAL_CURRENT" as const, k2, physical, recoveredArm, recoveredTerminal }))
  }
  return Object.freeze(decisions)
}
