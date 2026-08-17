import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { createServer, Socket, type Server } from "node:net"
import { homedir } from "node:os"
import { join } from "node:path"
import test from "node:test"

import type { GvisorRuntimeLineageRecord } from "../src/trust/sandbox-observer-gvisor-runtime.ts"
import {
  KDO_H4_R3G_C_LIMITS,
  deriveGvisorNetworkControlSocketPath,
  observeGvisorNetworkTopologyOnce,
} from "../src/trust/sandbox-observer-gvisor-network.ts"

const SOURCE = readFileSync(new URL("../src/trust/sandbox-observer-gvisor-network.ts", import.meta.url), "utf8")
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

function r3eHash(domain: string, payload: string): string {
  return createHash("sha256").update(Buffer.from(`KODAC-H4-R3E\0${domain}\0V1\0`, "ascii")).update(Buffer.from(payload, "utf8")).digest("hex")
}
function syntheticR3e(): GvisorRuntimeLineageRecord {
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
  }
  return { ...base, recordIdentity: r3eHash("RUNTIME_LINEAGE", JSON.stringify(base)) }
}
function trustedUid(): string { return typeof process.getuid === "function" ? String(process.getuid()) : "0" }
function trustedShortRoot(): string { return mkdtempSync(join(homedir(), ".k")) }
function fixtureSocketPath(root: string): string {
  const path = deriveGvisorNetworkControlSocketPath(root, CONTAINER_ID)
  assert.ok(Buffer.byteLength(path, "utf8") <= 107, `R3G-C fixture socket path too long: ${path}`)
  return path
}
async function closeServer(server: Server): Promise<void> { await new Promise<void>((resolve) => server.close(() => resolve())) }
function responseFor(): string {
  return JSON.stringify({
    success: true,
    err: "",
    result: {
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
    },
  })
}

test("H4-R3G-C uRPC response buffering is linear-copy bounded", () => {
  assert.doesNotMatch(SOURCE, /Buffer\.concat\(/)
  assert.match(SOURCE, /const responseBuffer = Buffer\.allocUnsafe\(KDO_H4_R3G_C_LIMITS\.maxResponseBytes\)/)
  assert.match(SOURCE, /chunk\.copy\(responseBuffer, total\)/)
  assert.match(SOURCE, /const received = responseBuffer\.subarray\(0, total\)/)
})

test("H4-R3G-C response timeout is created only after the Unix socket emits connect", { skip: process.platform !== "linux" }, async () => {
  const root = trustedShortRoot()
  const socketPath = fixtureSocketPath(root)
  const server = createServer()
  const originalEmit = Socket.prototype.emit
  const originalSetTimeout = globalThis.setTimeout
  let connectEmitted = false
  const rpcTimerConnectStates: boolean[] = []
  let connectTimerCount = 0

  try {
    server.on("connection", (socket) => socket.once("data", () => socket.write(responseFor())))
    await new Promise<void>((resolve, reject) => server.listen(socketPath, (error?: Error) => error ? reject(error) : resolve()))

    Socket.prototype.emit = (function (this: Socket, event: string | symbol, ...args: any[]): boolean {
      if (event === "connect") connectEmitted = true
      return Reflect.apply(originalEmit as (...emitArgs: any[]) => boolean, this, [event, ...args])
    }) as typeof Socket.prototype.emit

    globalThis.setTimeout = ((callback: (...args: any[]) => void, delay?: number, ...args: any[]) => {
      if (delay === KDO_H4_R3G_C_LIMITS.connectTimeoutMs) connectTimerCount += 1
      if (delay === KDO_H4_R3G_C_LIMITS.rpcTimeoutMs) rpcTimerConnectStates.push(connectEmitted)
      return originalSetTimeout(callback, delay, ...args)
    }) as typeof globalThis.setTimeout

    const read = await observeGvisorNetworkTopologyOnce({
      runtimeRoot: root,
      trustedHostUid: trustedUid(),
      runtimeLineage: syntheticR3e(),
    })

    assert.equal(connectTimerCount, 1, "R3G-C must create exactly one connect timeout")
    assert.deepEqual(rpcTimerConnectStates, [true], "R3G-C response timeout must be created only after Socket emits connect")
    assert.equal(read.topology.loopbackName, "lo")
  } finally {
    globalThis.setTimeout = originalSetTimeout
    Socket.prototype.emit = originalEmit
    if (server.listening) await closeServer(server)
    rmSync(root, { recursive: true, force: true })
  }
})
