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

test("R3G-E contract pins capability and Moby/API source identities", () => {
  assert.equal(KDO_H4_R3G_E_CAPABILITY, "runtime.enforce.gvisor.output-bound")
  assert.equal(KDO_H4_R3G_E_DOCKER_API_VERSION, "1.48")
  assert.equal(KDO_H4_R3G_E_MOBY_SOURCE_COMMIT, "d430e1c2c7e53611d16d19d2ffb8c6fecae5dae3")
  assert.equal(KDO_H4_R3G_E_MOBY_API_BLOB, "7b11c5d00028046576aad721c6a5fc83cbac4fa9")
  assert.match(createGvisorOutputObserverImplementationIdentity(), /^[0-9a-f]{64}$/)
})

test("R3G-E counts one raw aggregate budget across fragmented interleaved stdout and stderr", () => {
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
  assert.equal(result.acceptedStdoutBytes, 5)
  assert.equal(result.acceptedStderrBytes, 1)
  assert.equal(result.acceptedAggregateBytes, 6)
  assert.equal(result.stdout.toString("utf8"), "abdef")
  assert.equal(result.stderr.toString("utf8"), "c")
})

test("R3G-E exact aggregate bound is inclusive and Docker frame headers do not count", () => {
  const accumulator = new GvisorDockerMultiplexAccumulator(6)
  const encoded = Buffer.concat([frame(1, "ab"), frame(2, "cdef")])
  for (let offset = 0; offset < encoded.byteLength; offset += 3) accumulator.push(encoded.subarray(offset, Math.min(offset + 3, encoded.byteLength)))
  const result = accumulator.finish()
  assert.equal(result.acceptedStdoutBytes, 2)
  assert.equal(result.acceptedStderrBytes, 4)
  assert.equal(result.acceptedAggregateBytes, 6)
  assert.equal(result.stdout.toString("utf8"), "ab")
  assert.equal(result.stderr.toString("utf8"), "cdef")
})

test("R3G-E rejects N+1 before accepting the offending frame payload", () => {
  const accumulator = new GvisorDockerMultiplexAccumulator(4)
  accumulator.push(frame(1, "abcd"))
  const next = frame(2, "x")
  const error = assert.throws(() => accumulator.push(next), GvisorOutputLimitExceededError)
  assert.equal(error.limitBytes, 4)
  assert.equal(error.acceptedBytes, 4)
  assert.equal(error.rejectedFrameBytes, 1)
  assert.throws(() => accumulator.finish(), /already terminal/)
})

test("R3G-E does not grant independent maxOutputBytes allowances to stdout and stderr", () => {
  const accumulator = new GvisorDockerMultiplexAccumulator(4)
  accumulator.push(frame(1, "abc"))
  assert.throws(() => accumulator.push(frame(2, "de")), GvisorOutputLimitExceededError)
})

test("R3G-E counts UTF-8 payload bytes before text decoding", () => {
  const payload = Buffer.from("💥", "utf8")
  assert.equal(payload.byteLength, 4)
  const accumulator = new GvisorDockerMultiplexAccumulator(4)
  accumulator.push(frame(1, payload))
  assert.equal(accumulator.finish().acceptedAggregateBytes, 4)
})

test("R3G-E zero-length frames do not reset or replenish the aggregate budget", () => {
  const accumulator = new GvisorDockerMultiplexAccumulator(2)
  accumulator.push(Buffer.concat([frame(1, "a"), frame(2, Buffer.alloc(0)), frame(2, "b")]))
  const result = accumulator.finish()
  assert.equal(result.acceptedAggregateBytes, 2)
  assert.throws(() => {
    const next = new GvisorDockerMultiplexAccumulator(1)
    next.push(Buffer.concat([frame(1, Buffer.alloc(0)), frame(1, "ab")]))
  }, GvisorOutputLimitExceededError)
})

test("R3G-E rejects stdin/unknown stream types and nonzero reserved header bytes", () => {
  for (const stream of [0, 3, 255]) {
    const header = Buffer.alloc(8); header[0] = stream
    assert.throws(() => new GvisorDockerMultiplexAccumulator(8).push(header), /stream type/)
  }
  const reserved = Buffer.alloc(8); reserved[0] = 1; reserved[2] = 1
  assert.throws(() => new GvisorDockerMultiplexAccumulator(8).push(reserved), /reserved header bytes/)
})

test("R3G-E rejects truncated headers and payloads at terminalization", () => {
  const shortHeader = new GvisorDockerMultiplexAccumulator(8)
  shortHeader.push(Buffer.from([1, 0, 0, 0]))
  assert.throws(() => shortHeader.finish(), /truncated 8-byte header/)

  const shortPayload = new GvisorDockerMultiplexAccumulator(8)
  const declared = Buffer.alloc(8); declared[0] = 2; declared.writeUInt32BE(3, 4)
  shortPayload.push(Buffer.concat([declared, Buffer.from("xy")]))
  assert.throws(() => shortPayload.finish(), /truncated payload/)
})

test("R3G-E rejects oversized declared frame lengths without payload-sized allocation", () => {
  const header = Buffer.alloc(8); header[0] = 1; header.writeUInt32BE(1024, 4)
  const accumulator = new GvisorDockerMultiplexAccumulator(16)
  const error = assert.throws(() => accumulator.push(header), GvisorOutputLimitExceededError)
  assert.equal(error.acceptedBytes, 0)
  assert.equal(error.rejectedFrameBytes, 1024)
})

test("R3G-E aggregate transcript digest distinguishes stream and frame boundaries", () => {
  const first = new GvisorDockerMultiplexAccumulator(8)
  first.push(Buffer.concat([frame(1, "ab"), frame(2, "c")]))
  const a = first.finish()

  const second = new GvisorDockerMultiplexAccumulator(8)
  second.push(Buffer.concat([frame(1, "a"), frame(2, "bc")]))
  const b = second.finish()

  const third = new GvisorDockerMultiplexAccumulator(8)
  third.push(frame(1, "abc"))
  const c = third.finish()

  assert.notEqual(a.aggregateTranscriptDigest, b.aggregateTranscriptDigest)
  assert.notEqual(a.aggregateTranscriptDigest, c.aggregateTranscriptDigest)
  assert.notEqual(b.aggregateTranscriptDigest, c.aggregateTranscriptDigest)
})

test("R3G-E positive E3 record is deterministic, requirement-bound, and not an R3B final record", () => {
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
  const result = accumulator.finish()
  const record = createGvisorOutputBoundRecord({
    executionAttemptIdentity: EXECUTION_ATTEMPT_IDENTITY,
    requirement,
    containerBindingIdentity: CONTAINER_BINDING_IDENTITY,
    containerId: CONTAINER_ID,
    runtimeInstanceIdentity: RUNTIME_INSTANCE_IDENTITY,
    providerIdentity: PROVIDER_IDENTITY,
    socketEndpointIdentity: SOCKET_ENDPOINT_IDENTITY,
    outputChannelIdentity,
    aggregation: aggregationRecord(result),
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

  const forged = { ...record, acceptedAggregateBytes: 4 }
  assert.throws(() => validateGvisorOutputBoundRecord(forged, requirement), /must equal stdout\+stderr/)
  assert.throws(() => validateGvisorOutputBoundRecord(record, fixtureRequirement(6)), /expected requirement|does not match/)
})
