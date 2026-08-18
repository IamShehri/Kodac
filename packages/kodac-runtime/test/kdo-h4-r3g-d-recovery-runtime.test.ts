import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { chmod, mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"

import {
  GvisorTtlRecoveryCoordinator,
  KDO_H4_R3G_D_RECOVERY_RUNTIME_VERSION,
  validateGvisorTtlRecoveryRuntimeConfig,
} from "../src/execution/gateway-gvisor-ttl-recovery-runtime.ts"
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
  createGvisorTtlEvidenceCommit,
  payloadDigest,
  type GvisorTtlPreparedIntent,
} from "../src/trust/sandbox-lifecycle-gvisor-ttl.ts"
import { createGvisorTtlK2RecoverySnapshot } from "../src/trust/sandbox-lifecycle-gvisor-ttl-recovery.ts"

const ID = (character: string) => character.repeat(64)
const CONTAINER_ID = "c".repeat(64)

function r3gdHash(domain: string, value: unknown): string {
  return createHash("sha256")
    .update(Buffer.from(`KODAC-H4-R3G-D\0${domain}\0V1\0`, "ascii"))
    .update(Buffer.from(JSON.stringify(value), "utf8"))
    .digest("hex")
}

function requirementFixture(): SandboxExecutionRequirement {
  const confinement = createConfinementRequest({
    mode: "read-only",
    workspaceIdentity: ID("1"),
    executionIntentIdentity: ID("2"),
    scope: { readPaths: ["src"], writePaths: [] },
  })
  const workload = createSandboxWorkloadRequest({
    source: createSandboxOciImageSource({ repository: "ghcr.io/acme/r3g-d-recovery-runtime", digest: `sha256:${ID("3")}` }),
    entrypoint: createSandboxEntrypoint({ executable: "/usr/bin/node", args: ["--version"] }),
    resourcePolicy: createSandboxResourcePolicy({ cpuMillis: 1000, memoryBytes: 268_435_456, ttlMs: 60_000, maxOutputBytes: 1_048_576 }),
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
  const base = Object.freeze({ version: KDO_H4_R3G_D_PREPARED_VERSION, state: "PREPARED" as const, armOperationIdentity, ...armPayload, canonicalArmPayloadDigest })
  return Object.freeze({ ...base, intentIdentity: r3gdHash("PREPARED_INTENT", base) })
}

test("H4-R3G-D recovery runtime config is required strict and non-generic", () => {
  const valid = validateGvisorTtlRecoveryRuntimeConfig({ version: KDO_H4_R3G_D_RECOVERY_RUNTIME_VERSION, listRecoverySnapshots: () => [] })
  assert.equal(valid.version, KDO_H4_R3G_D_RECOVERY_RUNTIME_VERSION)
  assert.equal(typeof valid.listRecoverySnapshots, "function")
  assert.throws(() => validateGvisorTtlRecoveryRuntimeConfig({ version: KDO_H4_R3G_D_RECOVERY_RUNTIME_VERSION, listRecoverySnapshots: () => [], get: () => undefined }), /fields are not canonical/)
  assert.throws(() => validateGvisorTtlRecoveryRuntimeConfig({ version: "wrong", listRecoverySnapshots: () => [] }), /version mismatch/)
  assert.throws(() => validateGvisorTtlRecoveryRuntimeConfig({ version: KDO_H4_R3G_D_RECOVERY_RUNTIME_VERSION, listRecoverySnapshots: "not-a-function" }), /trusted function/)
})

test("H4-R3G-D concurrent startup recovery shares one internal recovery pass without a user-facing busy state", { skip: process.platform !== "linux" }, async () => {
  const root = await mkdtemp(join(tmpdir(), "kodac-r3gd-recovery-runtime-"))
  await chmod(root, 0o700)
  const requirement = requirementFixture()
  const prepared = preparedFixture(requirement)
  const snapshot = createGvisorTtlK2RecoverySnapshot({ requirement, prepared, arm: null, terminal: null })
  let reads = 0
  let release: (() => void) | undefined
  const blocked = new Promise<void>((resolvePromise) => { release = resolvePromise })
  const coordinator = new GvisorTtlRecoveryCoordinator({
    registryRoot: root,
    recoveryRuntime: {
      version: KDO_H4_R3G_D_RECOVERY_RUNTIME_VERSION,
      async listRecoverySnapshots() { reads += 1; await blocked; return [snapshot] },
    },
    commitArmEvidence() { throw new Error("PREPARED/no-physical startup recovery must not commit arm evidence") },
    commitTerminalEvidence() { throw new Error("PREPARED/no-physical startup recovery must not commit terminal evidence") },
  })
  try {
    const first = coordinator.ensureStartupRecovery()
    const second = coordinator.ensureStartupRecovery()
    await new Promise<void>((resolvePromise) => setImmediate(resolvePromise))
    assert.equal(reads, 1)
    release?.()
    await Promise.all([first, second])
    await coordinator.ensureStartupRecovery()
    assert.equal(reads, 1, "completed startup reconciliation must not become a recurring throughput gate")
  } finally { await rm(root, { recursive: true, force: true }) }
})

test("H4-R3G-D unknown PREPARED commit converges only from an exact durable K2 snapshot", async () => {
  const requirement = requirementFixture()
  const prepared = preparedFixture(requirement)
  const snapshot = createGvisorTtlK2RecoverySnapshot({ requirement, prepared, arm: null, terminal: null })
  const expected = createGvisorTtlEvidenceCommit({ kind: "prepared", armOperationIdentity: prepared.armOperationIdentity, leaseIdentity: null, recordIdentity: prepared.intentIdentity, payloadDigest: payloadDigest(prepared) })
  let reads = 0
  const coordinator = new GvisorTtlRecoveryCoordinator({
    registryRoot: "/tmp/kodac-r3gd-unused",
    recoveryRuntime: { version: KDO_H4_R3G_D_RECOVERY_RUNTIME_VERSION, listRecoverySnapshots() { reads += 1; return [snapshot] } },
    commitArmEvidence() { throw new Error("unused") },
    commitTerminalEvidence() { throw new Error("unused") },
  })
  await coordinator.commitEvidenceExact("R3G-D PREPARED evidence commit", () => { throw new Error("commit acknowledgement lost after durable write") }, expected)
  assert.equal(reads, 1)
})

test("H4-R3G-D unknown PREPARED commit remains failed when durable snapshot does not prove the exact record", async () => {
  const requirement = requirementFixture()
  const prepared = preparedFixture(requirement)
  const expected = createGvisorTtlEvidenceCommit({ kind: "prepared", armOperationIdentity: prepared.armOperationIdentity, leaseIdentity: null, recordIdentity: prepared.intentIdentity, payloadDigest: payloadDigest(prepared) })
  const coordinator = new GvisorTtlRecoveryCoordinator({
    registryRoot: "/tmp/kodac-r3gd-unused",
    recoveryRuntime: { version: KDO_H4_R3G_D_RECOVERY_RUNTIME_VERSION, listRecoverySnapshots: () => [] },
    commitArmEvidence() { throw new Error("unused") },
    commitTerminalEvidence() { throw new Error("unused") },
  })
  await assert.rejects(coordinator.commitEvidenceExact("R3G-D PREPARED evidence commit", () => { throw new Error("unknown commit result") }, expected), /unknown commit result/)
})

test("H4-R3G-D explicit malformed commit acknowledgement is never rescued by recovery lookup", async () => {
  const requirement = requirementFixture()
  const prepared = preparedFixture(requirement)
  const snapshot = createGvisorTtlK2RecoverySnapshot({ requirement, prepared, arm: null, terminal: null })
  const expected = createGvisorTtlEvidenceCommit({ kind: "prepared", armOperationIdentity: prepared.armOperationIdentity, leaseIdentity: null, recordIdentity: prepared.intentIdentity, payloadDigest: payloadDigest(prepared) })
  let reads = 0
  const coordinator = new GvisorTtlRecoveryCoordinator({
    registryRoot: "/tmp/kodac-r3gd-unused",
    recoveryRuntime: { version: KDO_H4_R3G_D_RECOVERY_RUNTIME_VERSION, listRecoverySnapshots() { reads += 1; return [snapshot] } },
    commitArmEvidence() { throw new Error("unused") },
    commitTerminalEvidence() { throw new Error("unused") },
  })
  await assert.rejects(coordinator.commitEvidenceExact("R3G-D PREPARED evidence commit", () => ({}), expected), /evidence commit must contain exactly|fields/)
  assert.equal(reads, 0, "explicit invalid acknowledgement must not invoke unknown-result reconciliation")
})