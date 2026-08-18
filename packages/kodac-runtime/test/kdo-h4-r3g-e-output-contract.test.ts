import assert from "node:assert/strict"
import test from "node:test"

import { createConfinementRequest } from "../src/trust/confinement.ts"
import { createSandboxExecutionRequirement, type SandboxExecutionRequirement } from "../src/trust/sandbox-backend-evidence.ts"
import {
  GvisorDockerMultiplexAccumulator,
  GvisorOutputLimitExceededError,
  KDO_H4_R3G_E_CAPABILITY,
  KDO_H4_R3G_E_DOCKER_API_VERSION,
  KDO_H4_R3G_E_EVIDENCE_CLASS,
  KDO_H4_R3G_E_MOBY_API_BLOB,
  KDO_H4_R3G_E_MOBY_SOURCE_COMMIT,
  KDO_H4_R3G_E_OUTPUT_VERSION,
  createGvisorOutputBoundCommit,
  createGvisorOutputBoundRecord,
  createGvisorOutputChannelIdentity,
  createGvisorOutputObserverImplementationIdentity,
  validateGvisorOutputBoundCommit,
  validateGvisorOutputBoundRecord,
} from "../src/trust/sandbox-output-gvisor.ts"
import {
  KDO_H4_R3A_NETWORK_MODE,
  createSandboxEntrypoint,
  createSandboxNetworkPolicy,
  createSandboxOciImageSource,
  createSandboxResourcePolicy,
  createSandboxWorkloadRequest,
} from "../src/trust/sandbox-workload.ts"

const CONTAINER_ID = "1".repeat(64)
const EXECUTION_ATTEMPT_IDENTITY = "2".repeat(64)
const CONTAINER_BINDING_IDENTITY = "3".repeat(64)
const RUNTIME_INSTANCE_IDENTITY = "4".repeat(64)
const PROVIDER_IDENTITY = "5".repeat(64)
const SOCKET_ENDPOINT_IDENTITY = "6".repeat(64)
const TERMINAL_EVIDENCE_IDENTITY = "7".repeat(64)
const WORKSPACE_IDENTITY = "8".repeat(64)
const EXECUTION_INTENT_IDENTITY = "9".repeat(64)

function fixtureRequirement(maxOutputBytes = 32): SandboxExecutionRequirement {
  const confinement = createConfinementRequest({
    mode: "read-only",
    workspaceIdentity: WORKSPACE_IDENTITY,
    executionIntentIdentity: EXECUTION_INTENT_IDENTITY,
    scope: { readPaths: ["src"], writePaths: [] },
  })
  const workload = createSandboxWorkloadRequest({
    source: createSandboxOciImageSource({ repository: "ghcr.io/acme/r3ge-fixture", digest: `sha256:${"a".repeat(64)}` }),
    entrypoint: createSandboxEntrypoint({ executable: "/usr/bin/node", args: ["--version"] }),
    resourcePolicy: createSandboxResourcePolicy({ cpuMillis: 1000, memoryBytes: 536870912, ttlMs: 60000, maxOutputBytes }),
    networkPolicy: createSandboxNetworkPolicy({ mode: KDO_H4_R3A_NETWORK_MODE }),
    confinement,
    credentialBindingIdentity: null,
  })
  return createSandboxExecutionRequirement({ workload, requiredSemanticRuntimeClass: "gvisor" })
}

function frame(stream: 1 | 2, payload: Buffer | string): Buffer {
  const body = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, "utf8")
  const header = Buffer.alloc(8)
  header[0] = stream
  header.writeUInt32BE(body.byteLength, 4)
  return Buffer.concat([header, body])
}

function aggregationRecord(result: ReturnType<GvisorDockerMultiplexAccumulator["finish"]>) {
  return {
    acceptedStdoutBytes: result.acceptedStdoutBytes,
    acceptedStderrBytes: result.acceptedStderrBytes,
    acceptedAggregateBytes: result.acceptedAggregateBytes,
    stdoutDigest: result.stdoutDigest,
    stderrDigest: result.stderrDigest,
    aggregateTranscriptDigest: result.aggregateTranscriptDigest,
  }
}

function expectOutputLimitExceeded(operation: () => void): GvisorOutputLimitExceededError {
  try {
    operation()
  } catch (error) {
    assert.ok(error instanceof GvisorOutputLimitExceededError)
    return error
  }
  assert.fail("expected GvisorOutputLimitExceededError")
}

test("R3G-E pins the narrow output capability and Moby/API source identities", () => {
  assert.equal(KDO_H4_R3G_E_CAPABILITY, "runtime.enforce.gvisor.output-bound")
  assert.equal(KDO_H4_R3G_E_DOCKER_API_VERSION, "1.48")
  assert.equal(KDO_H4_R3G_E_MOBY_SOURCE_COMMIT, "d430e1c2c7e53611d16d19d2ffb8c6fecae5dae3")
  assert.equal(KDO_H4_R3G_E_MOBY_API_BLOB, "7b11c5d00028046576aad721c6a5fc83cbac4fa9")
  assert.match(createGvisorOutputObserverImplementationIdentity(), /^[0-9a-f]{64}$/)
})

test("R3G-E parses fragmented interleaved frames and uses one stdout+stderr byte budget", () => {
  const accumulator = new GvisorDockerMultiplexAccumulator(6)
  const encoded = Buffer.concat([frame(1, "ab"), frame(2, "c"), frame(1, "def")])
  const fragmentSizes = [1, 2, 7, 3, 5]
  let offset = 0
  let fragment = 0
  while (offset < encoded.byteLength) {
    const size = fragmentSizes[fragment % fragmentSizes.length]!
    accumulator.push(encoded.subarray(offset, Math.min(offset + size, encoded.byteLength)))
    offset += size
    fragment += 1
  }
  const result = accumulator.finish()
  assert.deepEqual(
    [result.acceptedStdoutBytes, result.acceptedStderrBytes, result.acceptedAggregateBytes],
    [5, 1, 6],
  )
  assert.equal(result.stdout.toString("utf8"), "abdef")
  assert.equal(result.stderr.toString("utf8"), "c")
})

test("R3G-E bound is inclusive and transport headers do not count as workload bytes", () => {
  const accumulator = new GvisorDockerMultiplexAccumulator(6)
  accumulator.push(Buffer.concat([frame(1, "ab"), frame(2, "cdef")]))
  const result = accumulator.finish()
  assert.equal(result.acceptedAggregateBytes, 6)
  assert.ok(Buffer.concat([frame(1, "ab"), frame(2, "cdef")]).byteLength > 6)
})

test("R3G-E rejects N+1 at the offending frame header and never grants per-stream allowances", () => {
  const accumulator = new GvisorDockerMultiplexAccumulator(4)
  accumulator.push(frame(1, "abcd"))
  const error = expectOutputLimitExceeded(() => accumulator.push(frame(2, "x")))
  assert.deepEqual([error.limitBytes, error.acceptedBytes, error.rejectedFrameBytes], [4, 4, 1])
  assert.throws(() => accumulator.finish(), /already terminal/)

  const split = new GvisorDockerMultiplexAccumulator(4)
  split.push(frame(1, "abc"))
  expectOutputLimitExceeded(() => split.push(frame(2, "de")))
})

test("R3G-E counts raw UTF-8 bytes and zero-length frames never replenish budget", () => {
  const payload = Buffer.from("💥", "utf8")
  assert.equal(payload.byteLength, 4)
  const utf8 = new GvisorDockerMultiplexAccumulator(4)
  utf8.push(frame(1, payload))
  assert.equal(utf8.finish().acceptedAggregateBytes, 4)

  const zero = new GvisorDockerMultiplexAccumulator(2)
  zero.push(Buffer.concat([frame(1, "a"), frame(2, Buffer.alloc(0)), frame(2, "b")]))
  assert.equal(zero.finish().acceptedAggregateBytes, 2)
  const overflow = new GvisorDockerMultiplexAccumulator(1)
  expectOutputLimitExceeded(() => overflow.push(Buffer.concat([frame(1, Buffer.alloc(0)), frame(1, "ab")])))
})

test("R3G-E rejects untrusted stream types, reserved bits, and incomplete framing", () => {
  for (const stream of [0, 3, 255]) {
    const header = Buffer.alloc(8); header[0] = stream
    assert.throws(() => new GvisorDockerMultiplexAccumulator(8).push(header), /stream type/)
  }
  const reserved = Buffer.alloc(8); reserved[0] = 1; reserved[2] = 1
  assert.throws(() => new GvisorDockerMultiplexAccumulator(8).push(reserved), /reserved header bytes/)

  const shortHeader = new GvisorDockerMultiplexAccumulator(8)
  shortHeader.push(Buffer.from([1, 0, 0, 0]))
  assert.throws(() => shortHeader.finish(), /truncated 8-byte header/)

  const shortPayload = new GvisorDockerMultiplexAccumulator(8)
  const declared = Buffer.alloc(8); declared[0] = 2; declared.writeUInt32BE(3, 4)
  shortPayload.push(Buffer.concat([declared, Buffer.from("xy")]))
  assert.throws(() => shortPayload.finish(), /truncated payload/)
})

test("R3G-E rejects oversized declared frames before payload-sized allocation", () => {
  const header = Buffer.alloc(8); header[0] = 1; header.writeUInt32BE(1024, 4)
  const error = expectOutputLimitExceeded(() => new GvisorDockerMultiplexAccumulator(16).push(header))
  assert.deepEqual([error.acceptedBytes, error.rejectedFrameBytes], [0, 1024])
})

test("R3G-E transcript digest distinguishes stream and frame boundaries", () => {
  const first = new GvisorDockerMultiplexAccumulator(8); first.push(Buffer.concat([frame(1, "ab"), frame(2, "c")]))
  const second = new GvisorDockerMultiplexAccumulator(8); second.push(Buffer.concat([frame(1, "a"), frame(2, "bc")]))
  const third = new GvisorDockerMultiplexAccumulator(8); third.push(frame(1, "abc"))
  const digests = [first.finish(), second.finish(), third.finish()].map((value) => value.aggregateTranscriptDigest)
  assert.equal(new Set(digests).size, 3)
})

test("R3G-E E3 record is deterministic, requirement-bound, and structurally distinct from final R3B evidence", () => {
  const requirement = fixtureRequirement(5)
  const outputChannelIdentity = createGvisorOutputChannelIdentity({
    executionAttemptIdentity: EXECUTION_ATTEMPT_IDENTITY,
    requirementIdentity: requirement.requirementIdentity,
    workloadIdentity: requirement.workload.workloadIdentity,
    containerBindingIdentity: CONTAINER_BINDING_IDENTITY,
    containerId: CONTAINER_ID,
    providerIdentity: PROVIDER_IDENTITY,
    socketEndpointIdentity: SOCKET_ENDPOINT_IDENTITY,
  })
  const accumulator = new GvisorDockerMultiplexAccumulator(5)
  accumulator.push(Buffer.concat([frame(1, "abc"), frame(2, "de")]))
  const record = createGvisorOutputBoundRecord({
    executionAttemptIdentity: EXECUTION_ATTEMPT_IDENTITY,
    requirement,
    containerBindingIdentity: CONTAINER_BINDING_IDENTITY,
    containerId: CONTAINER_ID,
    runtimeInstanceIdentity: RUNTIME_INSTANCE_IDENTITY,
    providerIdentity: PROVIDER_IDENTITY,
    socketEndpointIdentity: SOCKET_ENDPOINT_IDENTITY,
    outputChannelIdentity,
    aggregation: aggregationRecord(accumulator.finish()),
    terminalEvidenceIdentity: TERMINAL_EVIDENCE_IDENTITY,
  })
  assert.equal(record.version, KDO_H4_R3G_E_OUTPUT_VERSION)
  assert.equal(record.evidenceClass, KDO_H4_R3G_E_EVIDENCE_CLASS)
  assert.equal(record.maxOutputBytes, 5)
  assert.equal(record.acceptedAggregateBytes, 5)
  assert.equal(validateGvisorOutputBoundRecord(record, requirement), record)
  assert.equal("observedResourcePolicy" in record, false)
  assert.equal("capabilityIdentity" in record, false)
  assert.equal("evidenceIdentity" in record, false)

  const commit = createGvisorOutputBoundCommit(record)
  assert.equal(validateGvisorOutputBoundCommit(commit, record), commit)
  assert.throws(() => validateGvisorOutputBoundRecord({ ...record, acceptedAggregateBytes: 4 }, requirement), /must equal stdout\+stderr/)
  assert.throws(() => validateGvisorOutputBoundRecord(record, fixtureRequirement(6)), /expected requirement|does not match/)
})
