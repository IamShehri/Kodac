import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync, unlinkSync } from "node:fs"
import { createServer, type Server } from "node:net"
import { homedir } from "node:os"
import { join } from "node:path"
import test from "node:test"

import { createDockerControlPlaneObservation } from "../src/trust/sandbox-observer-docker-control-plane.ts"
import type { GvisorRuntimeLineageRecord } from "../src/trust/sandbox-observer-gvisor-runtime.ts"
import {
  KDO_H4_R3G_C_CAPABILITY,
  KDO_H4_R3G_C_COMMIT_VERSION,
  KDO_H4_R3G_C_EVIDENCE_CLASS,
  KDO_H4_R3G_C_GVISOR_SOURCE_COMMIT,
  KDO_H4_R3G_C_LIMITS,
  KDO_H4_R3G_C_NETWORK_POLICY,
  KDO_H4_R3G_C_RUNTIME_CONFIG_VERSION,
  KDO_H4_R3G_C_SERIALIZATION_THEOREM_VERSION,
  KDO_H4_R3G_C_URPC_METHOD,
  KDO_H4_R3G_C_VERSION,
  createGvisorNetworkObserverImplementationIdentity,
  createGvisorPhysicalNetworkCommit,
  createGvisorPhysicalNetworkRecord,
  deriveGvisorNetworkControlSocketPath,
  normalizeGvisorNetworkTopology,
  observeGvisorNetworkRuntimeRootAuthority,
  observeGvisorNetworkTopologyOnce,
  parseGvisorGetNetworkConfigResponse,
  snapshotGvisorNetworkControlEndpoint,
  validateGvisorNetworkObserverRuntimeConfig,
  validateGvisorPhysicalNetworkCommit,
  validateGvisorPhysicalNetworkRecord,
  type GvisorNetworkControlEndpointIdentity,
  type GvisorNetworkObservationRead,
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
  return createHash("sha256").update(Buffer.from(`KODAC-H4-R3E\0${domain}\0V1\0`, "ascii")).update(Buffer.from(payload, "utf8")).digest("hex")
}
function r3gCHash(domain: string, tuple: readonly unknown[]): string {
  return createHash("sha256").update(Buffer.from(`KODAC-H4-R3G-C\0${domain}\0V1\0`, "ascii")).update(Buffer.from(JSON.stringify(tuple), "utf8")).digest("hex")
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
function dockerObservation(overrides: Partial<Parameters<typeof createDockerControlPlaneObservation>[0]> = {}) {
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
    ...overrides,
  })
}
function canonicalTopologyResult(): any {
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
function responseFor(result: unknown = canonicalTopologyResult()): string { return JSON.stringify({ success: true, err: "", result }) }
function syntheticEndpoint(path = "/run/runsc/runsc-" + CONTAINER_ID + ".sock"): GvisorNetworkControlEndpointIdentity {
  const base = { path, device: "1", inode: "2", uid: "0", gid: "0", mode: String(0o140600), parentAuthorityIdentity: "e".repeat(64) }
  return { ...base, endpointIdentity: r3gCHash("CONTROL_ENDPOINT", [base.path, base.device, base.inode, base.uid, base.gid, base.mode, base.parentAuthorityIdentity]) }
}
function observationRead(endpoint = syntheticEndpoint()): GvisorNetworkObservationRead {
  const topology = parseGvisorGetNetworkConfigResponse(responseFor())
  return Object.freeze({ endpointBefore: endpoint, endpointAfter: endpoint, topology })
}
function trustedUid(): string { return typeof process.getuid === "function" ? String(process.getuid()) : "0" }
async function closeServer(server: Server): Promise<void> { await new Promise<void>((resolve) => server.close(() => resolve())) }

test("H4-R3G-C constants and runtime config preserve bounded theorem", () => {
  assert.equal(KDO_H4_R3G_C_VERSION, "kodac-h4-r3g-c-gvisor-network-v1")
  assert.equal(KDO_H4_R3G_C_EVIDENCE_CLASS, "e3-physical-network-candidate")
  assert.equal(KDO_H4_R3G_C_CAPABILITY, "runtime.observe.gvisor.network")
  assert.equal(KDO_H4_R3G_C_NETWORK_POLICY, "deny-all-non-loopback")
  assert.equal(KDO_H4_R3G_C_GVISOR_SOURCE_COMMIT, "50e1502a95d36ad2faf2c7ef33b8bf21fe975293")
  assert.equal(KDO_H4_R3G_C_URPC_METHOD, "containerManager.GetNetworkConfig")
  const config = validateGvisorNetworkObserverRuntimeConfig({ version: KDO_H4_R3G_C_RUNTIME_CONFIG_VERSION, trustedHostUid: trustedUid(), trustedHostSerializationTheoremVersion: KDO_H4_R3G_C_SERIALIZATION_THEOREM_VERSION, commitNetworkEvidence: () => ({}) })
  assert.equal(config.trustedHostSerializationTheoremVersion, KDO_H4_R3G_C_SERIALIZATION_THEOREM_VERSION)
  for (const extra of ["socketPath", "containerId", "pid", "runtimeRoot", "method", "rpc", "setNetworkArgs"]) assert.throws(() => validateGvisorNetworkObserverRuntimeConfig({ ...config, [extra]: "forbidden" }))
  assert.throws(() => validateGvisorNetworkObserverRuntimeConfig({ ...config, trustedHostSerializationTheoremVersion: "self-reported" }))
  assert.match(createGvisorNetworkObserverImplementationIdentity(), /^[0-9a-f]{64}$/)
})

test("H4-R3G-C strict topology accepts canonical loopback and binds non-authority tuning", () => {
  const base = canonicalTopologyResult()
  const first = normalizeGvisorNetworkTopology(base)
  assert.deepEqual(first.loopbackAddresses, ["127.0.0.1/8", "::1/128"])
  assert.deepEqual(first.loopbackRoutes, ["127.0.0.0/8", "::1/128"])
  assert.equal(first.fdBasedLinkCount, 0)
  assert.equal(first.xdpLinkCount, 0)
  assert.equal(first.hasDefaultV4Gateway, false)
  assert.equal(first.hasDefaultV6Gateway, false)
  const tuned = structuredClone(base); tuned.LoopbackLinks[0]!.GVisorGRO = true; tuned.IsRestore = true
  const second = normalizeGvisorNetworkTopology(tuned)
  assert.notEqual(first.networkTopologyIdentity, second.networkTopologyIdentity)
})

test("H4-R3G-C strict topology fails closed on every external authority shape", () => {
  const mutations: Array<(value: ReturnType<typeof canonicalTopologyResult>) => void> = [
    (v) => { v.FDBasedLinks = [{}] },
    (v) => { v.XDPLinks = [{}] },
    (v) => { v.LoopbackLinks[0]!.Name = "eth0" },
    (v) => { v.LoopbackLinks[0]!.Addresses[0]!.Address = "10.0.0.1" },
    (v) => { v.LoopbackLinks[0]!.Routes[0]!.Destination.IP = "0.0.0.0" },
    (v) => { v.Defaultv4Gateway.Name = "eth0" },
    (v) => { v.Defaultv6Gateway.Route.Gateway = "::2" },
    (v) => { v.PCAP = true },
    (v) => { v.NATBlob = true },
  ]
  for (const mutate of mutations) { const value = structuredClone(canonicalTopologyResult()); mutate(value); assert.throws(() => normalizeGvisorNetworkTopology(value)) }
  assert.throws(() => normalizeGvisorNetworkTopology({ ...canonicalTopologyResult(), Neighbors: [] }))
})

test("H4-R3G-C uRPC parser rejects duplicate/trailing/malformed/deep/oversized/remote-error responses", () => {
  assert.deepEqual(parseGvisorGetNetworkConfigResponse(responseFor()).loopbackName, "lo")
  const body = responseFor()
  assert.throws(() => parseGvisorGetNetworkConfigResponse(body.replace('{"success":true', '{"success":true,"success":true')), /duplicate/)
  assert.throws(() => parseGvisorGetNetworkConfigResponse(`${body}{}`), /trailing/)
  assert.throws(() => parseGvisorGetNetworkConfigResponse('{"success":true'), /JSON/)
  assert.throws(() => parseGvisorGetNetworkConfigResponse(JSON.stringify({ success: false, err: "denied", result: {} })), /remote error/)
  let nested: unknown = null; for (let i = 0; i < KDO_H4_R3G_C_LIMITS.maxJsonDepth + 2; i += 1) nested = [nested]
  assert.throws(() => parseGvisorGetNetworkConfigResponse(JSON.stringify({ success: true, err: "", result: nested })), /depth|nesting/)
  assert.throws(() => parseGvisorGetNetworkConfigResponse("x".repeat(KDO_H4_R3G_C_LIMITS.maxResponseBytes + 1)), /size/)
})

test("H4-R3G-C record binds exact R3E/R3F subject, stable bracket, and replay acknowledgment", () => {
  const before = syntheticR3e(); const after = syntheticR3e({ statsIdentity: "f".repeat(64) })
  const firstRead = observationRead(); const secondRead = observationRead()
  const record = createGvisorPhysicalNetworkRecord({ r3eBefore: before, r3eAfter: after, dockerControlPlane: dockerObservation(), firstRead, secondRead, trustedHostSerializationTheoremVersion: KDO_H4_R3G_C_SERIALIZATION_THEOREM_VERSION })
  assert.equal(record.evidenceClass, KDO_H4_R3G_C_EVIDENCE_CLASS)
  assert.equal(record.networkPolicy, KDO_H4_R3G_C_NETWORK_POLICY)
  assert.deepEqual(validateGvisorPhysicalNetworkRecord(record), record)
  const commit = createGvisorPhysicalNetworkCommit(record)
  assert.equal(commit.version, KDO_H4_R3G_C_COMMIT_VERSION)
  assert.deepEqual(validateGvisorPhysicalNetworkCommit(commit, record), commit)
  assert.throws(() => validateGvisorPhysicalNetworkCommit({ ...commit, commitIdentity: "0".repeat(64) }, record))
  assert.throws(() => createGvisorPhysicalNetworkRecord({ r3eBefore: before, r3eAfter: syntheticR3e({ processIdentity: "0".repeat(64) }), dockerControlPlane: dockerObservation(), firstRead, secondRead, trustedHostSerializationTheoremVersion: KDO_H4_R3G_C_SERIALIZATION_THEOREM_VERSION }), /bracket mismatch/)
  assert.throws(() => createGvisorPhysicalNetworkRecord({ r3eBefore: before, r3eAfter: after, dockerControlPlane: dockerObservation({ executionAttemptIdentity: "0".repeat(64) }), firstRead, secondRead, trustedHostSerializationTheoremVersion: KDO_H4_R3G_C_SERIALIZATION_THEOREM_VERSION }), /mismatch/)
  const changedTopology = { ...secondRead, topology: parseGvisorGetNetworkConfigResponse(responseFor({ ...canonicalTopologyResult(), IsRestore: true })) }
  assert.throws(() => createGvisorPhysicalNetworkRecord({ r3eBefore: before, r3eAfter: after, dockerControlPlane: dockerObservation(), firstRead, secondRead: changedTopology, trustedHostSerializationTheoremVersion: KDO_H4_R3G_C_SERIALIZATION_THEOREM_VERSION }), /topology changed/)
  const changedEndpoint = syntheticEndpoint("/run/runsc/runsc-" + "2".repeat(64) + ".sock")
  assert.throws(() => createGvisorPhysicalNetworkRecord({ r3eBefore: before, r3eAfter: after, dockerControlPlane: dockerObservation(), firstRead, secondRead: { ...secondRead, endpointAfter: changedEndpoint }, trustedHostSerializationTheoremVersion: KDO_H4_R3G_C_SERIALIZATION_THEOREM_VERSION }), /endpoint changed/)
})

test("H4-R3G-C exact endpoint derivation never falls back or accepts alternate identity", () => {
  assert.equal(deriveGvisorNetworkControlSocketPath("/run/runsc", CONTAINER_ID), `/run/runsc/runsc-${CONTAINER_ID}.sock`)
  assert.throws(() => deriveGvisorNetworkControlSocketPath("run/runsc", CONTAINER_ID))
  assert.throws(() => deriveGvisorNetworkControlSocketPath("/run/runsc", "short"))
})

test("H4-R3G-C runtimeRoot authority rejects a world-writable ancestor", { skip: process.platform !== "linux" }, async () => {
  const root = mkdtempSync("/tmp/kodac-r3gc-untrusted-")
  try { await assert.rejects(observeGvisorNetworkRuntimeRootAuthority(root, trustedUid()), /group\/world writable/) }
  finally { rmSync(root, { recursive: true, force: true }) }
})

test("H4-R3G-C live fixed uRPC uses only exact derived socket and canonical request", { skip: process.platform !== "linux" }, async () => {
  const root = mkdtempSync(join(homedir(), ".r3gc-live-")); const socketPath = deriveGvisorNetworkControlSocketPath(root, CONTAINER_ID); const server = createServer()
  try {
    let request = ""
    server.on("connection", (socket) => socket.on("data", (chunk) => { request += chunk.toString("utf8"); if (request === `{"method":"${KDO_H4_R3G_C_URPC_METHOD}","arg":{}}`) socket.write(responseFor()) }))
    await new Promise<void>((resolve, reject) => server.listen(socketPath, (error?: Error) => error ? reject(error) : resolve()))
    const read = await observeGvisorNetworkTopologyOnce({ runtimeRoot: root, trustedHostUid: trustedUid(), runtimeLineage: syntheticR3e() })
    assert.equal(request, '{"method":"containerManager.GetNetworkConfig","arg":{}}')
    assert.equal(read.endpointBefore.endpointIdentity, read.endpointAfter.endpointIdentity)
    assert.equal(read.topology.loopbackName, "lo")
  } finally { if (server.listening) await closeServer(server); rmSync(root, { recursive: true, force: true }) }
})

test("H4-R3G-C exact endpoint absence fails even when a fallback socket exists", { skip: process.platform !== "linux" }, async () => {
  const root = mkdtempSync(join(homedir(), ".r3gc-missing-")); const fallback = join(root, "fallback.sock"); const server = createServer()
  try {
    await new Promise<void>((resolve, reject) => server.listen(fallback, (error?: Error) => error ? reject(error) : resolve()))
    await assert.rejects(snapshotGvisorNetworkControlEndpoint({ runtimeRoot: root, containerId: CONTAINER_ID, trustedHostUid: trustedUid() }))
  } finally { if (server.listening) await closeServer(server); rmSync(root, { recursive: true, force: true }) }
})

test("H4-R3G-C endpoint rejects symlink and non-socket replacements", { skip: process.platform !== "linux" }, async () => {
  const root = mkdtempSync(join(homedir(), ".r3gc-types-")); const path = deriveGvisorNetworkControlSocketPath(root, CONTAINER_ID); const target = join(root, "target")
  try {
    writeFileSync(target, "not socket"); symlinkSync(target, path)
    await assert.rejects(snapshotGvisorNetworkControlEndpoint({ runtimeRoot: root, containerId: CONTAINER_ID, trustedHostUid: trustedUid() }), /Unix socket/)
    unlinkSync(path); writeFileSync(path, "still not socket")
    await assert.rejects(snapshotGvisorNetworkControlEndpoint({ runtimeRoot: root, containerId: CONTAINER_ID, trustedHostUid: trustedUid() }), /Unix socket/)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test("H4-R3G-C endpoint replacement during fixed RPC fails the complete read", { skip: process.platform !== "linux" }, async () => {
  const root = mkdtempSync(join(homedir(), ".r3gc-swap-")); const path = deriveGvisorNetworkControlSocketPath(root, CONTAINER_ID); const first = createServer(); const replacement = createServer()
  try {
    first.on("connection", (socket) => socket.once("data", () => {
      unlinkSync(path)
      replacement.listen(path, () => socket.write(responseFor()))
    }))
    await new Promise<void>((resolve, reject) => first.listen(path, (error?: Error) => error ? reject(error) : resolve()))
    await assert.rejects(observeGvisorNetworkTopologyOnce({ runtimeRoot: root, trustedHostUid: trustedUid(), runtimeLineage: syntheticR3e() }), /endpoint identity changed/)
  } finally {
    if (first.listening) await closeServer(first)
    if (replacement.listening) await closeServer(replacement)
    if (existsSync(path)) unlinkSync(path)
    rmSync(root, { recursive: true, force: true })
  }
})

test("H4-R3G-C cancellation closes owned transport and late bytes cannot become success", { skip: process.platform !== "linux" }, async () => {
  const root = mkdtempSync(join(homedir(), ".r3gc-cancel-")); const path = deriveGvisorNetworkControlSocketPath(root, CONTAINER_ID); const server = createServer(); const abort = new AbortController()
  try {
    server.on("connection", (socket) => socket.once("data", () => setTimeout(() => { if (!socket.destroyed) socket.write(responseFor()) }, 50)))
    await new Promise<void>((resolve, reject) => server.listen(path, (error?: Error) => error ? reject(error) : resolve()))
    const pending = observeGvisorNetworkTopologyOnce({ runtimeRoot: root, trustedHostUid: trustedUid(), runtimeLineage: syntheticR3e(), signal: abort.signal })
    setTimeout(() => abort.abort(), 10)
    await assert.rejects(pending, /aborted/)
    await new Promise((resolve) => setTimeout(resolve, 75))
  } finally { if (server.listening) await closeServer(server); rmSync(root, { recursive: true, force: true }) }
})

test("H4-R3G-C production module has no mutation method, generic RPC, helper, or active probe surface", () => {
  const source = readFileSync(new URL("../src/trust/sandbox-observer-gvisor-network.ts", import.meta.url), "utf8")
  assert.doesNotMatch(source, /SetNetworkArgs|CreateLinksAndRoutes|runsc\s+(?:create|start|exec|kill|delete)|node:http|node:https|node:dns|child_process|setns|ptrace|sudo/)
  assert.doesNotMatch(source, /method:\s*string|rpc\s*\(|connect\([^)]*socketPath/)
  assert.match(source, /containerManager\.GetNetworkConfig/)
})
