import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import test from "node:test"

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
  KDO_H4_R3G_D_PREPARED_VERSION,
  type GvisorTtlPreparedIntent,
} from "../src/trust/sandbox-lifecycle-gvisor-ttl.ts"
import {
  KDO_H4_R3G_D_K2_RECOVERY_SNAPSHOT_VERSION,
  createGvisorTtlK2RecoverySnapshot,
  validateGvisorTtlK2RecoverySnapshot,
} from "../src/trust/sandbox-lifecycle-gvisor-ttl-recovery.ts"

const ID = (character: string) => character.repeat(64)
const CONTAINER_ID = "c".repeat(64)

function r3gdHash(domain: string, value: unknown): string {
  return createHash("sha256")
    .update(Buffer.from(`KODAC-H4-R3G-D\0${domain}\0V1\0`, "ascii"))
    .update(Buffer.from(JSON.stringify(value), "utf8"))
    .digest("hex")
}

function requirementFixture(ttlMs = 60_000): SandboxExecutionRequirement {
  const confinement = createConfinementRequest({
    mode: "read-only",
    workspaceIdentity: ID("1"),
    executionIntentIdentity: ID("2"),
    scope: { readPaths: ["src"], writePaths: [] },
  })
  const workload = createSandboxWorkloadRequest({
    source: createSandboxOciImageSource({ repository: "ghcr.io/acme/r3g-d-recovery", digest: `sha256:${ID("3")}` }),
    entrypoint: createSandboxEntrypoint({ executable: "/usr/bin/node", args: ["--version"] }),
    resourcePolicy: createSandboxResourcePolicy({ cpuMillis: 1000, memoryBytes: 268_435_456, ttlMs, maxOutputBytes: 1_048_576 }),
    networkPolicy: createSandboxNetworkPolicy({ mode: KDO_H4_R3A_NETWORK_MODE }),
    confinement,
    credentialBindingIdentity: null,
  })
  return createSandboxExecutionRequirement({ workload, requiredSemanticRuntimeClass: "gvisor" })
}

function preparedFixture(requirement: SandboxExecutionRequirement): GvisorTtlPreparedIntent {
  const armPayload = Object.freeze({
    executionAttemptIdentity: ID("4"),
    requirementIdentity: requirement.requirementIdentity,
    workloadIdentity: requirement.workload.workloadIdentity,
    containerBindingIdentity: ID("5"),
    containerId: CONTAINER_ID,
    runtimeInstanceIdentity: ID("6"),
    ttlMs: requirement.workload.resourcePolicy.ttlMs,
    watchdogImplementationIdentity: ID("7"),
  })
  const canonicalArmPayloadDigest = r3gdHash("ARM_PAYLOAD", armPayload)
  const armOperationIdentity = r3gdHash("ARM_OPERATION", armPayload)
  const base = Object.freeze({
    version: KDO_H4_R3G_D_PREPARED_VERSION,
    state: "PREPARED" as const,
    armOperationIdentity,
    ...armPayload,
    canonicalArmPayloadDigest,
  })
  return Object.freeze({ ...base, intentIdentity: r3gdHash("PREPARED_INTENT", base) })
}

function recoveryIdentity(state: string, requirement: SandboxExecutionRequirement, prepared: GvisorTtlPreparedIntent, armRecordIdentity = "-", terminalRecordIdentity = "-"): string {
  return r3gdHash("K2_RECOVERY_SNAPSHOT", [state, requirement.requirementIdentity, prepared.intentIdentity, armRecordIdentity, terminalRecordIdentity])
}

test("H4-R3G-D K2 recovery snapshot is deterministic strict and PREPARED-bound", () => {
  const requirement = requirementFixture()
  const prepared = preparedFixture(requirement)
  const first = createGvisorTtlK2RecoverySnapshot({ requirement, prepared, arm: null, terminal: null })
  const second = createGvisorTtlK2RecoverySnapshot({ requirement, prepared, arm: null, terminal: null })

  assert.equal(first.version, KDO_H4_R3G_D_K2_RECOVERY_SNAPSHOT_VERSION)
  assert.equal(first.state, "PREPARED")
  assert.equal(first.snapshotIdentity, second.snapshotIdentity)
  assert.deepEqual(validateGvisorTtlK2RecoverySnapshot(first), first)
  assert.ok(Object.isFrozen(first))
})

test("H4-R3G-D K2 recovery snapshot rejects requirement and PREPARED substitution", () => {
  const requirement = requirementFixture()
  const prepared = preparedFixture(requirement)
  const differentRequirement = requirementFixture(61_000)

  assert.throws(
    () => createGvisorTtlK2RecoverySnapshot({ requirement: differentRequirement, prepared, arm: null, terminal: null }),
    /does not match authoritative requirement/,
  )

  const substituted = preparedFixture(requirement)
  const forgedPayload = {
    ...substituted,
    runtimeInstanceIdentity: ID("8"),
  }
  assert.throws(
    () => createGvisorTtlK2RecoverySnapshot({ requirement, prepared: forgedPayload as GvisorTtlPreparedIntent, arm: null, terminal: null }),
    /prepared arm identity mismatch/,
  )
})

test("H4-R3G-D K2 recovery snapshot state cannot be upgraded by recomputing only the outer identity", () => {
  const requirement = requirementFixture()
  const prepared = preparedFixture(requirement)
  const snapshot = createGvisorTtlK2RecoverySnapshot({ requirement, prepared, arm: null, terminal: null })
  const forged = {
    ...snapshot,
    state: "ARM_COMMITTED",
    snapshotIdentity: recoveryIdentity("ARM_COMMITTED", requirement, prepared),
  }

  assert.throws(() => validateGvisorTtlK2RecoverySnapshot(forged), /state does not match canonical evidence chain/)
})

test("H4-R3G-D K2 recovery snapshot cannot accept terminal state without authoritative arm evidence", () => {
  const requirement = requirementFixture()
  const prepared = preparedFixture(requirement)

  assert.throws(
    () => createGvisorTtlK2RecoverySnapshot({ requirement, prepared, arm: null, terminal: {} as never }),
    /terminal state requires authoritative arm evidence/,
  )
})

test("H4-R3G-D K2 recovery snapshot rejects malformed arm injection before it can become recovery authority", () => {
  const requirement = requirementFixture()
  const prepared = preparedFixture(requirement)

  assert.throws(
    () => createGvisorTtlK2RecoverySnapshot({ requirement, prepared, arm: { recordIdentity: ID("9") } as never, terminal: null }),
    /arm record must contain exactly/,
  )
})

test("H4-R3G-D K2 recovery snapshot rejects unknown fields and hostile proxy structure without executing traps", () => {
  const requirement = requirementFixture()
  const prepared = preparedFixture(requirement)
  const snapshot = createGvisorTtlK2RecoverySnapshot({ requirement, prepared, arm: null, terminal: null })

  assert.throws(() => validateGvisorTtlK2RecoverySnapshot({ ...snapshot, extra: true }), /fields are not canonical/)
  assert.throws(() => validateGvisorTtlK2RecoverySnapshot({ ...snapshot, snapshotIdentity: ID("a") }), /identity mismatch/)

  let trapped = false
  const hostile = new Proxy({}, {
    ownKeys() { trapped = true; throw new Error("must not execute proxy trap") },
  })
  assert.throws(() => validateGvisorTtlK2RecoverySnapshot(hostile), /non-proxy plain object/)
  assert.equal(trapped, false)
})
