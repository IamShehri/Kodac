import assert from "node:assert/strict"
import test from "node:test"

import { createConfinementRequest } from "../src/trust/confinement.ts"
import { createSandboxExecutionRequirement } from "../src/trust/sandbox-backend-evidence.ts"
import { validateGvisorPhysicalEvidenceBundle } from "../src/trust/sandbox-physical-conjunction-gvisor.ts"
import {
  KDO_H4_R3A_NETWORK_MODE,
  createSandboxEntrypoint,
  createSandboxNetworkPolicy,
  createSandboxOciImageSource,
  createSandboxResourcePolicy,
  createSandboxWorkloadRequest,
} from "../src/trust/sandbox-workload.ts"

function fixtureRequirement() {
  const confinement = createConfinementRequest({
    mode: "read-only",
    workspaceIdentity: "a".repeat(64),
    executionIntentIdentity: "b".repeat(64),
    scope: { readPaths: ["src"], writePaths: [] },
  })
  const workload = createSandboxWorkloadRequest({
    source: createSandboxOciImageSource({
      repository: "ghcr.io/acme/r3gf-hostile-fixture",
      digest: `sha256:${"2".repeat(64)}`,
    }),
    entrypoint: createSandboxEntrypoint({ executable: "/usr/bin/node", args: ["--version"] }),
    resourcePolicy: createSandboxResourcePolicy({
      cpuMillis: 1000,
      memoryBytes: 536_870_912,
      ttlMs: 60_000,
      maxOutputBytes: 1_048_576,
    }),
    networkPolicy: createSandboxNetworkPolicy({ mode: KDO_H4_R3A_NETWORK_MODE }),
    confinement,
    credentialBindingIdentity: null,
  })
  return createSandboxExecutionRequirement({ workload, requiredSemanticRuntimeClass: "gvisor" })
}

test("H4-R3G-F rejects nested serialization hooks before JSON traversal", () => {
  const requirement = fixtureRequirement()
  let toJsonCalls = 0
  const hostileResourceRecord = {
    toJSON() {
      toJsonCalls += 1
      return {}
    },
  }
  const bundle = {
    resourceRecord: hostileResourceRecord,
    resourceCommit: {},
    sourceRecord: {},
    sourceCommit: {},
    networkRecord: {},
    networkCommit: {},
    ttlArmRecord: {},
    ttlArmCommit: {},
    ttlTerminalRecord: {},
    ttlTerminalCommit: {},
    outputRecord: {},
    outputCommit: {},
  }

  assert.throws(() => validateGvisorPhysicalEvidenceBundle(bundle as never, requirement))
  assert.equal(toJsonCalls, 0, "R3G-F must never invoke hostile nested toJSON before structural validation")
})
