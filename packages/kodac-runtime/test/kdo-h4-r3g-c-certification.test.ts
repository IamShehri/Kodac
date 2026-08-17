import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { createServer, type Server } from "node:net"
import { homedir, tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"

import {
  createDockerControlPlaneObservation,
} from "../src/trust/sandbox-observer-docker-control-plane.ts"
import type { GvisorRuntimeLineageRecord } from "../src/trust/sandbox-observer-gvisor-runtime.ts"
import {
  KDO_H4_R3G_C_RUNTIME_CONFIG_VERSION,
  KDO_H4_R3G_C_SERIALIZATION_THEOREM_VERSION,
  createGvisorPhysicalNetworkCommit,
  createGvisorPhysicalNetworkRecord,
  deriveGvisorNetworkControlSocketPath,
  observeGvisorNetworkTopologyOnce,
  parseGvisorGetNetworkConfigResponse,
  snapshotGvisorNetworkControlEndpoint,
  validateGvisorNetworkObserverRuntimeConfig,
  validateGvisorPhysicalNetworkCommit,
  validateGvisorPhysicalNetworkRecord,
  type GvisorNetworkControlEndpointIdentity,
  type GvisorNetworkObservationRead,
  type GvisorPhysicalNetworkRecord,
} from "../src/trust/sandbox-observer-gvisor-network.ts"

const CONTAINER_ID = "1".repeat(64)
const EXECUTION_ATTEMPT = "2".repeat(64)
const REQUIREMENT = "3".repeat(64)
const WORKLOAD = "4".repeat(64)
const BINDING = "5".repeat(64)
const RUNTIME_INSTANCE = "6".repeat(64)
const RUNSC = "7".repeat(64)
const HELPER = "8".repeat(64)
const PLAN = "9".repeat(64)
const STATE = "a".repeat(64)
const PROCESS = "b".repeat(64)
const OBSERVER = "c".repeat(64)
const CANDIDATE = "d".repeat(64)
const ARGS = "e".repeat(64)
const DOCKER_PROVIDER = "f".repeat(64)
const DOCKER_SOCKET = "0".repeat(64)

function r3eHash(domain: string, payload: string): string {
  return createHash("sha256")
    .update(Buffer.from(`KODAC-H4-R3E\0${domain}\0V1\0`, "ascii"))
    .update(Buffer.from(payload, "utf8"))
    .digest("hex")
}
function r3gCHash(domain: string, tuple: readonly unknown[]): string {
  return createHash("sha256")
    .update(Buffer.from(`KODAC-H4-R3G-C\0${domain}\0V1\0`, "ascii"))
    .update(Buffer.from(JSON.stringify(tuple), "utf8"))
    .digest("hex")
}
function syntheticR3e(overrides: Partial<GvisorRuntimeLineageRecord> = {}): GvisorRuntimeLineageRecord {
  const base = {
    version: "kodac-h4-r3e-gvisor-runtime-lineage-v1" as const,
    evidenceClass: "e3-integrated-runtime-lineage" as const,
    executionAttemptIdentity: EXECUTION_ATTEMPT,
    requirementIdentity: REQUIREMENT,
    workloadIdentity: WORKLOAD,
    containerBindingIdentity: BINDING,
    containerId: CONTAINER_ID,
    observerImplementationIdentity: OBSERVER,
    runscArtifactIdentity: RUNSC,
    observerHelperArtifactIdentity: HELPER,
    planIdentity: PLAN,
    stateIdentity: STATE,
    statsIdentity: "1".repeat(64),
    processIdentity: PROCESS,
    r3dCandidateIdentity: CANDIDATE,
    runtimeInstanceIdentity: RUNTIME_INSTANCE,
    ...Object.fromEntries(Object.entries(overrides).filter(([key]) => key !== "recordIdentity")),
  }
  return { ...base, recordIdentity: r3eHash("RUNTIME_LINEAGE", JSON.stringify(base)) } as GvisorRuntimeLineageRecord
}
function dockerObservation() {
  return createDockerControlPlaneObservation({
    providerIdentity: DOCKER_PROVIDER,
    socketEndpointIdentity: DOCKER_SOCKET,
    executionAttemptIdentity: EXECUTION_ATTEMPT,
    requirementIdentity: REQUIREMENT,
    workloadIdentity: WORKLOAD,
    containerId: CONTAINER_ID,
    bindingIdentity: BINDING,
    imageManifestDigest: `sha256:${"2".repeat(64)}`,
    executable: "/usr/bin/node",
    argsIdentity: ARGS,
    nanoCpus: 1_000_000_000,
    memoryBytes: 536_870_912,
    memorySwapBytes: 536_870_912,
  })
}
function canonicalTopologyResult() {
  return {
    LoopbackLinks: [{
      Name: "lo",
      Addresses: [{ Address: "127.0.0.1", PrefixLen: 8 }, { Address: "::1", PrefixLen: 128 }],
      Routes: [
        { Destination: { IP: "127.0.0.0", Mask: "/wAAAA==" }, Gateway: "", MTU: 0 },
        { Destination: { IP: "::1", Mask: "/////////////////////w==" }, Gateway: "", MTU: 0 },
      ],
      GVisorGRO: false,
    }],
    FDBasedLinks: null,
    XDPLinks: null,
    Defaultv4Gateway: { Route: { Destination: { IP: "", Mask: null }, Gateway: "", MTU: 0 }, Name: "" },
    Defaultv6Gateway: { Route: { Destination: { IP: "", Mask: null }, Gateway: "", MTU: 0 }, Name: "" },
    PCAP: false,
    LogPackets: false,
    NATBlob: false,
    PauseExternalNetworking: false,
    AllowConnectedOnSave: false,
    IsRestore: false,
  }
}
function responseFor(): string {
  return JSON.stringify({ success: true, err: "", result: canonicalTopologyResult() })
}
function syntheticEndpoint(path = `/run/runsc/runsc-${CONTAINER_ID}.sock`): GvisorNetworkControlEndpointIdentity {
  const base = {
    path,
    device: "1",
    inode: "2",
    uid: "0",
    gid: "0",
    mode: String(0o140600),
    parentAuthorityIdentity: "e".repeat(64),
  }
  return {
    ...base,
    endpointIdentity: r3gCHash("CONTROL_ENDPOINT", [base.path, base.device, base.inode, base.uid, base.gid, base.mode, base.parentAuthorityIdentity]),
  }
}
function observationRead(endpoint = syntheticEndpoint()): GvisorNetworkObservationRead {
  return Object.freeze({
    endpointBefore: endpoint,
    endpointAfter: endpoint,
    topology: parseGvisorGetNetworkConfigResponse(responseFor()),
  })
}
function fixtureRecord(): GvisorPhysicalNetworkRecord {
  return createGvisorPhysicalNetworkRecord({
    r3eBefore: syntheticR3e(),
    r3eAfter: syntheticR3e({ statsIdentity: "f".repeat(64) }),
    dockerControlPlane: dockerObservation(),
    firstRead: observationRead(),
    secondRead: observationRead(),
    trustedHostSerializationTheoremVersion: KDO_H4_R3G_C_SERIALIZATION_THEOREM_VERSION,
  })
}
function trustedUid(): string {
  return typeof process.getuid === "function" ? String(process.getuid()) : "0"
}
async function closeServer(server: Server): Promise<void> {
  if (!server.listening) return
  await new Promise<void>((resolve) => server.close(() => resolve()))
}

test("H4-R3G-C rejects an independently valid R3E record when runtime-instance identity changes across the bracket", () => {
  const before = syntheticR3e()
  const after = syntheticR3e({ runtimeInstanceIdentity: "0".repeat(64), statsIdentity: "f".repeat(64) })
  assert.throws(() => createGvisorPhysicalNetworkRecord({
    r3eBefore: before,
    r3eAfter: after,
    dockerControlPlane: dockerObservation(),
    firstRead: observationRead(),
    secondRead: observationRead(),
    trustedHostSerializationTheoremVersion: KDO_H4_R3G_C_SERIALIZATION_THEOREM_VERSION,
  }), /bracket mismatch/)
})

test("H4-R3G-C rejects an R3F network-mode mismatch before physical-network record acceptance", () => {
  const tamperedDockerObservation = {
    ...dockerObservation(),
    networkMode: "bridge",
  } as unknown as ReturnType<typeof dockerObservation>
  assert.throws(() => createGvisorPhysicalNetworkRecord({
    r3eBefore: syntheticR3e(),
    r3eAfter: syntheticR3e({ statsIdentity: "f".repeat(64) }),
    dockerControlPlane: tamperedDockerObservation,
    firstRead: observationRead(),
    secondRead: observationRead(),
    trustedHostSerializationTheoremVersion: KDO_H4_R3G_C_SERIALIZATION_THEOREM_VERSION,
  }), /runtime\/network mismatch/)
})

test("H4-R3G-C trusted store exact replay is idempotent and conflicting canonical bytes fail closed", () => {
  const record = validateGvisorPhysicalNetworkRecord(fixtureRecord())
  const canonicalBytes = JSON.stringify(record)
  const stored = new Map<string, string>()
  const put = (recordIdentity: string, bytes: string) => {
    const existing = stored.get(recordIdentity)
    if (existing !== undefined && existing !== bytes) throw new Error("R3G-C durable store integrity violation: conflicting canonical bytes for recordIdentity")
    if (existing === undefined) stored.set(recordIdentity, bytes)
    return createGvisorPhysicalNetworkCommit(record)
  }

  const first = put(record.recordIdentity, canonicalBytes)
  const second = put(record.recordIdentity, canonicalBytes)
  assert.equal(stored.size, 1)
  assert.equal(stored.get(record.recordIdentity), canonicalBytes)
  assert.deepEqual(second, first)
  assert.equal(validateGvisorPhysicalNetworkCommit(first, record).recordIdentity, record.recordIdentity)
  assert.equal(validateGvisorPhysicalNetworkCommit(second, record).recordIdentity, record.recordIdentity)

  assert.throws(() => put(record.recordIdentity, `${canonicalBytes} `), /integrity violation/)
  assert.equal(stored.size, 1)
  assert.equal(stored.get(record.recordIdentity), canonicalBytes)
})

test("H4-R3G-C exact socket authority has no fallback search outside the selected runtimeRoot", { skip: process.platform !== "linux" }, async () => {
  const selectedRoot = mkdtempSync(join(homedir(), ".r3f-"))
  const fallbackRoot = mkdtempSync(join(tmpdir(), "r3g-c-fallback-"))
  const fallbackPath = deriveGvisorNetworkControlSocketPath(fallbackRoot, CONTAINER_ID)
  const fallbackServer = createServer()
  try {
    await new Promise<void>((resolve, reject) => fallbackServer.listen(fallbackPath, (error?: Error) => error ? reject(error) : resolve()))
    await assert.rejects(snapshotGvisorNetworkControlEndpoint({
      runtimeRoot: selectedRoot,
      containerId: CONTAINER_ID,
      trustedHostUid: trustedUid(),
    }))
    const source = readFileSync(new URL("../src/trust/sandbox-observer-gvisor-network.ts", import.meta.url), "utf8")
    assert.doesNotMatch(source, /["']\/(?:tmp|run|var\/run)\//)
  } finally {
    await closeServer(fallbackServer).catch(() => {})
    rmSync(fallbackRoot, { recursive: true, force: true })
    rmSync(selectedRoot, { recursive: true, force: true })
  }
})

test("H4-R3G-C RPC timeout closes the owned stream and late response bytes cannot become evidence", { skip: process.platform !== "linux" }, async () => {
  const root = mkdtempSync(join(homedir(), ".r3t-"))
  const socketPath = deriveGvisorNetworkControlSocketPath(root, CONTAINER_ID)
  const server = createServer()
  const sockets = new Set<import("node:net").Socket>()
  let closeCount = 0
  let lateWriteAttempted = false
  try {
    server.on("connection", (socket) => {
      sockets.add(socket)
      socket.once("close", () => { sockets.delete(socket); closeCount += 1 })
      socket.once("data", () => {
        setTimeout(() => {
          lateWriteAttempted = true
          if (!socket.destroyed) socket.write(responseFor())
        }, 3100)
      })
    })
    await new Promise<void>((resolve, reject) => server.listen(socketPath, (error?: Error) => error ? reject(error) : resolve()))
    await assert.rejects(observeGvisorNetworkTopologyOnce({
      runtimeRoot: root,
      trustedHostUid: trustedUid(),
      runtimeLineage: syntheticR3e(),
    }), /R3G-C GetNetworkConfig response timeout/)
    await new Promise<void>((resolve) => setTimeout(resolve, 200))
    assert.equal(lateWriteAttempted, true)
    assert.ok(closeCount >= 1, "timed-out R3G-C transport must close before late bytes")
  } finally {
    for (const socket of sockets) socket.destroy()
    await closeServer(server).catch(() => {})
    rmSync(root, { recursive: true, force: true })
  }
})

test("H4-R3G-C models delayed pre-start and malicious trusted-host mutation outside the observer theorem", () => {
  const config = validateGvisorNetworkObserverRuntimeConfig({
    version: KDO_H4_R3G_C_RUNTIME_CONFIG_VERSION,
    trustedHostUid: trustedUid(),
    trustedHostSerializationTheoremVersion: KDO_H4_R3G_C_SERIALIZATION_THEOREM_VERSION,
    commitNetworkEvidence: () => ({}),
  })
  assert.throws(() => validateGvisorNetworkObserverRuntimeConfig({ ...config, trustedHostSerializationObserved: true }))

  const authorization = readFileSync(new URL("../../../docs/planning/KODAC_KDO_H4_R3G_C_PHYSICAL_DENY_ALL_NETWORK_OBSERVATION_AUTHORIZATION_2026-08-17.md", import.meta.url), "utf8")
  assert.match(authorization, /S6\. the trusted host enforces S1-S5 outside the R3G-C observer; the observer does not pretend to observe or create this serialization authority\./)
  assert.match(authorization, /delayed-pre-start-call race/)
  assert.match(authorization, /compromised root host[\s\S]*violating §9 invalidates the theorem/)

  const runtimeSource = readFileSync(new URL("../src/trust/sandbox-observer-gvisor-network-runtime.ts", import.meta.url), "utf8")
  assert.doesNotMatch(runtimeSource, /SetNetworkArgs|CreateLinksAndRoutes|verifyTrustedHostSerialization|observeTrustedHostSerialization/)
})
