import { createHash } from "node:crypto"
import { lstat } from "node:fs/promises"
import { createConnection } from "node:net"
import { posix } from "node:path"
import { TextDecoder, types as utilTypes } from "node:util"

import {
  validateDockerControlPlaneObservation,
  type DockerControlPlaneObservation,
} from "./sandbox-observer-docker-control-plane.ts"
import {
  validateGvisorRuntimeLineageRecord,
  type GvisorRuntimeLineageRecord,
} from "./sandbox-observer-gvisor-runtime.ts"

export const KDO_H4_R3G_C_VERSION = "kodac-h4-r3g-c-gvisor-network-v1" as const
export const KDO_H4_R3G_C_EVIDENCE_CLASS = "e3-physical-network-candidate" as const
export const KDO_H4_R3G_C_RUNTIME_CONFIG_VERSION = "kodac-h4-r3g-c-runtime-config-v1" as const
export const KDO_H4_R3G_C_COMMIT_VERSION = "kodac-h4-r3g-c-network-commit-v1" as const
export const KDO_H4_R3G_C_CAPABILITY = "runtime.observe.gvisor.network" as const
export const KDO_H4_R3G_C_NETWORK_POLICY = "deny-all-non-loopback" as const
export const KDO_H4_R3G_C_SERIALIZATION_THEOREM_VERSION = "kodac-h4-r3g-c-trusted-host-serialization-v1" as const
export const KDO_H4_R3G_C_GVISOR_SOURCE_COMMIT = "50e1502a95d36ad2faf2c7ef33b8bf21fe975293" as const
export const KDO_H4_R3G_C_URPC_METHOD = "containerManager.GetNetworkConfig" as const

export const KDO_H4_R3G_C_LIMITS = Object.freeze({
  maxPathBytes: 4096,
  maxResponseBytes: 262_144,
  maxJsonDepth: 32,
  maxJsonNodes: 4096,
  maxObjectKeys: 128,
  maxArrayItems: 128,
  maxStringBytes: 4096,
  connectTimeoutMs: 1500,
  rpcTimeoutMs: 3000,
  totalObservationTimeoutMs: 15_000,
  commitTimeoutMs: 3000,
} as const)

export interface GvisorNetworkPathComponentIdentity {
  readonly path: string
  readonly device: string
  readonly inode: string
  readonly uid: string
  readonly gid: string
  readonly mode: string
  readonly componentIdentity: string
}

export interface GvisorNetworkRuntimeRootAuthorityIdentity {
  readonly runtimeRoot: string
  readonly trustedHostUid: string
  readonly components: readonly GvisorNetworkPathComponentIdentity[]
  readonly authorityIdentity: string
}

export interface GvisorNetworkControlEndpointIdentity {
  readonly path: string
  readonly device: string
  readonly inode: string
  readonly uid: string
  readonly gid: string
  readonly mode: string
  readonly parentAuthorityIdentity: string
  readonly endpointIdentity: string
}

export interface GvisorNetworkTopologyObservation {
  readonly loopbackName: "lo"
  readonly loopbackAddresses: readonly ["127.0.0.1/8", "::1/128"]
  readonly loopbackRoutes: readonly ["127.0.0.0/8", "::1/128"]
  readonly gvisorGro: boolean
  readonly isRestore: boolean
  readonly fdBasedLinkCount: 0
  readonly xdpLinkCount: 0
  readonly hasDefaultV4Gateway: false
  readonly hasDefaultV6Gateway: false
  readonly networkTopologyIdentity: string
}

export interface GvisorNetworkObservationRead {
  readonly endpointBefore: GvisorNetworkControlEndpointIdentity
  readonly endpointAfter: GvisorNetworkControlEndpointIdentity
  readonly topology: GvisorNetworkTopologyObservation
}

export interface GvisorPhysicalNetworkRecord {
  readonly version: typeof KDO_H4_R3G_C_VERSION
  readonly evidenceClass: typeof KDO_H4_R3G_C_EVIDENCE_CLASS
  readonly executionAttemptIdentity: string
  readonly requirementIdentity: string
  readonly workloadIdentity: string
  readonly containerBindingIdentity: string
  readonly containerId: string
  readonly runtimeInstanceIdentity: string
  readonly runscArtifactIdentity: string
  readonly stateIdentity: string
  readonly processIdentity: string
  readonly r3eBeforeRecordIdentity: string
  readonly r3eAfterRecordIdentity: string
  readonly dockerControlPlaneObservationIdentity: string
  readonly controlEndpointIdentity: string
  readonly networkTopologyIdentity: string
  readonly networkObserverImplementationIdentity: string
  readonly networkPolicy: typeof KDO_H4_R3G_C_NETWORK_POLICY
  readonly trustedHostSerializationTheoremVersion: typeof KDO_H4_R3G_C_SERIALIZATION_THEOREM_VERSION
  readonly recordIdentity: string
}

export interface GvisorPhysicalNetworkCommit {
  readonly version: typeof KDO_H4_R3G_C_COMMIT_VERSION
  readonly recordIdentity: string
  readonly commitIdentity: string
}

export interface GvisorNetworkObserverRuntimeConfig {
  readonly version: typeof KDO_H4_R3G_C_RUNTIME_CONFIG_VERSION
  readonly trustedHostUid: string
  readonly trustedHostSerializationTheoremVersion: typeof KDO_H4_R3G_C_SERIALIZATION_THEOREM_VERSION
  readonly commitNetworkEvidence: (record: GvisorPhysicalNetworkRecord) => Promise<unknown> | unknown
}

const SHA256 = /^[0-9a-f]{64}$/
const FULL_CONTAINER_ID = /^[0-9a-f]{64}$/
const UNSIGNED_DECIMAL = /^(?:0|[1-9][0-9]*)$/
const UTF8 = new TextDecoder("utf-8", { fatal: true })
const GROUP_OR_WORLD_WRITE = 0o022n
const REQUEST_BYTES = Buffer.from(`{"method":"${KDO_H4_R3G_C_URPC_METHOD}","arg":{}}`, "utf8")

function byteLength(value: string): number { return Buffer.byteLength(value, "utf8") }
function hash(domain: string, tuple: readonly unknown[]): string {
  if (!/^[A-Z0-9_]+$/.test(domain)) throw new TypeError("R3G-C hash domain must be canonical uppercase ASCII")
  return createHash("sha256")
    .update(Buffer.from(`KODAC-H4-R3G-C\0${domain}\0V1\0`, "ascii"))
    .update(Buffer.from(JSON.stringify(tuple), "utf8"))
    .digest("hex")
}
function asPlainRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value) || utilTypes.isProxy(value)) throw new TypeError(`${label} must be a non-proxy plain object`)
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain object`)
  if (Object.getOwnPropertySymbols(value).length !== 0) throw new TypeError(`${label} must not contain symbol fields`)
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (descriptor.get !== undefined || descriptor.set !== undefined || !("value" in descriptor) || !descriptor.enumerable || descriptor.value === undefined) {
      throw new TypeError(`${label}.${key} must be an enumerable defined data property`)
    }
  }
  return value as Record<string, unknown>
}
function exactKeys(record: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(record).sort(); const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) throw new TypeError(`${label} must contain exactly: ${wanted.join(", ")}`)
}
function identity(value: unknown, label: string): string {
  if (typeof value !== "string" || !SHA256.test(value)) throw new TypeError(`${label} must be a lowercase SHA-256 identity`)
  return value
}
function fullContainerId(value: unknown): string {
  if (typeof value !== "string" || !FULL_CONTAINER_ID.test(value)) throw new TypeError("containerId must be exactly 64 lowercase hexadecimal characters")
  return value
}
function canonicalUnsignedDecimal(value: unknown, label: string): string {
  if (typeof value !== "string" || !UNSIGNED_DECIMAL.test(value)) throw new TypeError(`${label} must be canonical unsigned decimal`)
  return value
}
function canonicalPath(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0 || value.includes("\0") || byteLength(value) > KDO_H4_R3G_C_LIMITS.maxPathBytes) throw new TypeError(`${label} must be a bounded non-empty POSIX path`)
  if (!posix.isAbsolute(value) || posix.normalize(value) !== value || (value.length > 1 && value.endsWith("/"))) throw new TypeError(`${label} must be a canonical absolute POSIX path`)
  return value
}
function canonicalMode(value: unknown, label: string): string { return canonicalUnsignedDecimal(value, label) }
function noGroupOrWorldWrite(mode: string, label: string): void {
  if ((BigInt(mode) & GROUP_OR_WORLD_WRITE) !== 0n) throw new TypeError(`${label} must not be group/world writable`)
}
function isTrustedOwner(uid: string, trustedHostUid: string): boolean { return uid === "0" || uid === trustedHostUid }

export function createGvisorNetworkObserverImplementationIdentity(): string {
  return hash("OBSERVER_IMPLEMENTATION", [
    KDO_H4_R3G_C_VERSION,
    KDO_H4_R3G_C_GVISOR_SOURCE_COMMIT,
    KDO_H4_R3G_C_URPC_METHOD,
    KDO_H4_R3G_C_LIMITS,
  ])
}

export function validateGvisorNetworkObserverRuntimeConfig(value: unknown): GvisorNetworkObserverRuntimeConfig {
  const record = asPlainRecord(value, "R3G-C runtime config")
  exactKeys(record, ["version", "trustedHostUid", "trustedHostSerializationTheoremVersion", "commitNetworkEvidence"], "R3G-C runtime config")
  if (record.version !== KDO_H4_R3G_C_RUNTIME_CONFIG_VERSION) throw new TypeError("R3G-C runtime config version mismatch")
  if (record.trustedHostSerializationTheoremVersion !== KDO_H4_R3G_C_SERIALIZATION_THEOREM_VERSION) throw new TypeError("R3G-C trusted-host serialization theorem is not admitted")
  if (typeof record.commitNetworkEvidence !== "function") throw new TypeError("R3G-C commitNetworkEvidence must be a trusted function")
  return Object.freeze({
    version: KDO_H4_R3G_C_RUNTIME_CONFIG_VERSION,
    trustedHostUid: canonicalUnsignedDecimal(record.trustedHostUid, "trustedHostUid"),
    trustedHostSerializationTheoremVersion: KDO_H4_R3G_C_SERIALIZATION_THEOREM_VERSION,
    commitNetworkEvidence: record.commitNetworkEvidence as GvisorNetworkObserverRuntimeConfig["commitNetworkEvidence"],
  })
}

function runtimeRootComponentPaths(runtimeRoot: string): string[] {
  const parts = runtimeRoot.split("/").filter(Boolean)
  const paths = ["/"]
  let current = ""
  for (const part of parts) { current += `/${part}`; paths.push(current) }
  return paths
}

export async function observeGvisorNetworkRuntimeRootAuthority(runtimeRootValue: unknown, trustedHostUidValue: unknown): Promise<GvisorNetworkRuntimeRootAuthorityIdentity> {
  const runtimeRoot = canonicalPath(runtimeRootValue, "runtimeRoot")
  const trustedHostUid = canonicalUnsignedDecimal(trustedHostUidValue, "trustedHostUid")
  const components: GvisorNetworkPathComponentIdentity[] = []
  for (const path of runtimeRootComponentPaths(runtimeRoot)) {
    const stats = await lstat(path, { bigint: true })
    if (!stats.isDirectory() || stats.isSymbolicLink()) throw new TypeError(`R3G-C runtimeRoot component must be a non-symlink directory: ${path}`)
    const uid = stats.uid.toString(10); const mode = stats.mode.toString(10)
    if (!isTrustedOwner(uid, trustedHostUid)) throw new TypeError(`R3G-C runtimeRoot component is not trusted-host-owned: ${path}`)
    noGroupOrWorldWrite(mode, `R3G-C runtimeRoot component ${path}`)
    const base = Object.freeze({
      path,
      device: stats.dev.toString(10),
      inode: stats.ino.toString(10),
      uid,
      gid: stats.gid.toString(10),
      mode,
    })
    components.push(Object.freeze({ ...base, componentIdentity: hash("RUNTIME_ROOT_COMPONENT", [base.path, base.device, base.inode, base.uid, base.gid, base.mode]) }))
  }
  const frozen = Object.freeze([...components])
  return Object.freeze({
    runtimeRoot,
    trustedHostUid,
    components: frozen,
    authorityIdentity: hash("RUNTIME_ROOT_AUTHORITY", [runtimeRoot, trustedHostUid, frozen.map((entry) => entry.componentIdentity)]),
  })
}

export function deriveGvisorNetworkControlSocketPath(runtimeRootValue: unknown, containerIdValue: unknown): string {
  const runtimeRoot = canonicalPath(runtimeRootValue, "runtimeRoot")
  const containerId = fullContainerId(containerIdValue)
  const basename = `runsc-${containerId}.sock`
  const path = posix.join(runtimeRoot, basename)
  if (posix.dirname(path) !== runtimeRoot || posix.basename(path) !== basename) throw new TypeError("R3G-C control endpoint derivation escaped trusted runtimeRoot")
  return canonicalPath(path, "R3G-C control endpoint path")
}

export async function snapshotGvisorNetworkControlEndpoint(input: {
  runtimeRoot: string
  containerId: string
  trustedHostUid: string
}): Promise<GvisorNetworkControlEndpointIdentity> {
  const record = asPlainRecord(input, "R3G-C endpoint snapshot input")
  exactKeys(record, ["runtimeRoot", "containerId", "trustedHostUid"], "R3G-C endpoint snapshot input")
  const authority = await observeGvisorNetworkRuntimeRootAuthority(record.runtimeRoot, record.trustedHostUid)
  const path = deriveGvisorNetworkControlSocketPath(authority.runtimeRoot, record.containerId)
  const stats = await lstat(path, { bigint: true })
  if (!stats.isSocket() || stats.isSymbolicLink()) throw new TypeError("R3G-C control endpoint must be a real Unix socket")
  const uid = stats.uid.toString(10); const mode = stats.mode.toString(10)
  if (!isTrustedOwner(uid, authority.trustedHostUid)) throw new TypeError("R3G-C control endpoint is not trusted-host-owned")
  noGroupOrWorldWrite(mode, "R3G-C control endpoint")
  const base = Object.freeze({
    path,
    device: stats.dev.toString(10),
    inode: stats.ino.toString(10),
    uid,
    gid: stats.gid.toString(10),
    mode,
    parentAuthorityIdentity: authority.authorityIdentity,
  })
  return Object.freeze({ ...base, endpointIdentity: hash("CONTROL_ENDPOINT", [base.path, base.device, base.inode, base.uid, base.gid, base.mode, base.parentAuthorityIdentity]) })
}

export function validateGvisorNetworkControlEndpointIdentity(value: unknown): GvisorNetworkControlEndpointIdentity {
  const record = asPlainRecord(value, "R3G-C control endpoint identity")
  exactKeys(record, ["path", "device", "inode", "uid", "gid", "mode", "parentAuthorityIdentity", "endpointIdentity"], "R3G-C control endpoint identity")
  const base = Object.freeze({
    path: canonicalPath(record.path, "endpoint path"),
    device: canonicalUnsignedDecimal(record.device, "endpoint device"),
    inode: canonicalUnsignedDecimal(record.inode, "endpoint inode"),
    uid: canonicalUnsignedDecimal(record.uid, "endpoint uid"),
    gid: canonicalUnsignedDecimal(record.gid, "endpoint gid"),
    mode: canonicalMode(record.mode, "endpoint mode"),
    parentAuthorityIdentity: identity(record.parentAuthorityIdentity, "parentAuthorityIdentity"),
  })
  const expected = hash("CONTROL_ENDPOINT", [base.path, base.device, base.inode, base.uid, base.gid, base.mode, base.parentAuthorityIdentity])
  if (identity(record.endpointIdentity, "endpointIdentity") !== expected) throw new TypeError("R3G-C control endpoint identity mismatch")
  return Object.freeze({ ...base, endpointIdentity: expected })
}

function validateJsonSyntaxNoDuplicateKeys(text: string, label: string): void {
  let index = 0; const length = text.length; let nodes = 0
  const whitespace = (char: string) => char === " " || char === "\t" || char === "\r" || char === "\n"
  const skip = () => { while (index < length && whitespace(text[index] ?? "")) index += 1 }
  const numberPattern = /-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/y
  const stringToken = (): string => {
    if (text[index] !== '"') throw new TypeError(`${label} contains invalid JSON string syntax`)
    const start = index; index += 1
    while (index < length) {
      const char = text[index] ?? ""
      if (char === '"') { index += 1; try { return JSON.parse(text.slice(start, index)) as string } catch { throw new TypeError(`${label} contains invalid JSON string syntax`) } }
      if (char === "\\") {
        index += 1
        if (index >= length) throw new TypeError(`${label} contains an unterminated JSON escape`)
        if (text[index] === "u") { if (!/^[0-9a-fA-F]{4}$/.test(text.slice(index + 1, index + 5))) throw new TypeError(`${label} contains an invalid JSON unicode escape`); index += 4 }
        else if (!'"\\/bfnrt'.includes(text[index] ?? "")) throw new TypeError(`${label} contains an invalid JSON escape`)
      } else if (char.charCodeAt(0) < 0x20) throw new TypeError(`${label} contains an unescaped JSON control character`)
      index += 1
    }
    throw new TypeError(`${label} contains an unterminated JSON string`)
  }
  const value = (depth: number): void => {
    nodes += 1
    if (nodes > KDO_H4_R3G_C_LIMITS.maxJsonNodes) throw new TypeError(`${label} exceeds JSON node bound`)
    if (depth > KDO_H4_R3G_C_LIMITS.maxJsonDepth) throw new TypeError(`${label} exceeds JSON nesting depth`)
    skip(); const char = text[index]
    if (char === "{") {
      index += 1; skip(); const keys = new Set<string>()
      if (text[index] === "}") { index += 1; return }
      for (;;) {
        skip(); const key = stringToken(); if (byteLength(key) > KDO_H4_R3G_C_LIMITS.maxStringBytes) throw new TypeError(`${label} contains an oversized key`)
        if (keys.has(key)) throw new TypeError(`${label} contains duplicate JSON object key: ${key}`); keys.add(key)
        if (keys.size > KDO_H4_R3G_C_LIMITS.maxObjectKeys) throw new TypeError(`${label} contains too many object keys`)
        skip(); if (text[index] !== ":") throw new TypeError(`${label} contains invalid JSON object syntax`); index += 1; value(depth + 1); skip()
        if (text[index] === "}") { index += 1; return }
        if (text[index] !== ",") throw new TypeError(`${label} contains invalid JSON object syntax`); index += 1
      }
    }
    if (char === "[") {
      index += 1; skip(); if (text[index] === "]") { index += 1; return }; let items = 0
      for (;;) { items += 1; if (items > KDO_H4_R3G_C_LIMITS.maxArrayItems) throw new TypeError(`${label} contains an oversized array`); value(depth + 1); skip(); if (text[index] === "]") { index += 1; return }; if (text[index] !== ",") throw new TypeError(`${label} contains invalid JSON array syntax`); index += 1 }
    }
    if (char === '"') { const parsed = stringToken(); if (byteLength(parsed) > KDO_H4_R3G_C_LIMITS.maxStringBytes) throw new TypeError(`${label} contains an oversized string`); return }
    numberPattern.lastIndex = index; const number = numberPattern.exec(text); if (number !== null) { index = numberPattern.lastIndex; return }
    for (const literal of ["true", "false", "null"] as const) if (text.startsWith(literal, index)) { index += literal.length; return }
    throw new TypeError(`${label} contains invalid JSON value syntax`)
  }
  value(0); skip(); if (index !== length) throw new TypeError(`${label} contains trailing JSON content`)
}

function zeroArray(value: unknown, label: string): void {
  if (value === null) return
  if (!Array.isArray(value) || value.length !== 0 || utilTypes.isProxy(value)) throw new TypeError(`${label} must contain zero entries`)
}
function exactZeroDestination(value: unknown, label: string): void {
  const record = asPlainRecord(value, label); exactKeys(record, ["IP", "Mask"], label)
  if (record.IP !== "" || record.Mask !== null) throw new TypeError(`${label} must be empty`)
}
function exactZeroRoute(value: unknown, label: string): void {
  const record = asPlainRecord(value, label); exactKeys(record, ["Destination", "Gateway", "MTU"], label)
  exactZeroDestination(record.Destination, `${label}.Destination`)
  if (record.Gateway !== "" || record.MTU !== 0) throw new TypeError(`${label} must contain no gateway authority`)
}
function exactZeroDefaultRoute(value: unknown, label: string): void {
  const record = asPlainRecord(value, label); exactKeys(record, ["Route", "Name"], label); exactZeroRoute(record.Route, `${label}.Route`)
  if (record.Name !== "") throw new TypeError(`${label}.Name must be empty`)
}
function exactIpPrefix(value: unknown, expectedAddress: string, expectedPrefix: number, label: string): void {
  const record = asPlainRecord(value, label); exactKeys(record, ["Address", "PrefixLen"], label)
  if (record.Address !== expectedAddress || record.PrefixLen !== expectedPrefix) throw new TypeError(`${label} is not canonical loopback`)
}
function exactRoute(value: unknown, expectedIp: string, expectedMask: string, label: string): void {
  const record = asPlainRecord(value, label); exactKeys(record, ["Destination", "Gateway", "MTU"], label)
  const destination = asPlainRecord(record.Destination, `${label}.Destination`); exactKeys(destination, ["IP", "Mask"], `${label}.Destination`)
  if (destination.IP !== expectedIp || destination.Mask !== expectedMask || record.Gateway !== "" || record.MTU !== 0) throw new TypeError(`${label} is not a canonical loopback route`)
}

export function normalizeGvisorNetworkTopology(value: unknown): GvisorNetworkTopologyObservation {
  const record = asPlainRecord(value, "R3G-C gVisor network topology")
  exactKeys(record, ["LoopbackLinks", "FDBasedLinks", "XDPLinks", "Defaultv4Gateway", "Defaultv6Gateway", "PCAP", "LogPackets", "NATBlob", "PauseExternalNetworking", "AllowConnectedOnSave", "IsRestore"], "R3G-C gVisor network topology")
  if (!Array.isArray(record.LoopbackLinks) || utilTypes.isProxy(record.LoopbackLinks) || record.LoopbackLinks.length !== 1) throw new TypeError("R3G-C requires exactly one loopback link")
  const loopback = asPlainRecord(record.LoopbackLinks[0], "R3G-C loopback link")
  exactKeys(loopback, ["Name", "Addresses", "Routes", "GVisorGRO"], "R3G-C loopback link")
  if (loopback.Name !== "lo") throw new TypeError("R3G-C loopback name must be lo")
  if (!Array.isArray(loopback.Addresses) || loopback.Addresses.length !== 2 || utilTypes.isProxy(loopback.Addresses)) throw new TypeError("R3G-C loopback addresses must contain exactly IPv4 and IPv6 loopback")
  exactIpPrefix(loopback.Addresses[0], "127.0.0.1", 8, "R3G-C IPv4 loopback address")
  exactIpPrefix(loopback.Addresses[1], "::1", 128, "R3G-C IPv6 loopback address")
  if (!Array.isArray(loopback.Routes) || loopback.Routes.length !== 2 || utilTypes.isProxy(loopback.Routes)) throw new TypeError("R3G-C loopback routes must contain exactly IPv4 and IPv6 loopback routes")
  exactRoute(loopback.Routes[0], "127.0.0.0", "/wAAAA==", "R3G-C IPv4 loopback route")
  exactRoute(loopback.Routes[1], "::1", "/////////////////////w==", "R3G-C IPv6 loopback route")
  if (typeof loopback.GVisorGRO !== "boolean") throw new TypeError("R3G-C GVisorGRO must be boolean")
  zeroArray(record.FDBasedLinks, "R3G-C FDBasedLinks"); zeroArray(record.XDPLinks, "R3G-C XDPLinks")
  exactZeroDefaultRoute(record.Defaultv4Gateway, "R3G-C Defaultv4Gateway"); exactZeroDefaultRoute(record.Defaultv6Gateway, "R3G-C Defaultv6Gateway")
  for (const key of ["PCAP", "LogPackets", "NATBlob", "PauseExternalNetworking", "AllowConnectedOnSave"] as const) if (record[key] !== false) throw new TypeError(`R3G-C ${key} must be false`)
  if (typeof record.IsRestore !== "boolean") throw new TypeError("R3G-C IsRestore must be boolean")
  const base = Object.freeze({
    loopbackName: "lo" as const,
    loopbackAddresses: Object.freeze(["127.0.0.1/8", "::1/128"] as const),
    loopbackRoutes: Object.freeze(["127.0.0.0/8", "::1/128"] as const),
    gvisorGro: loopback.GVisorGRO,
    isRestore: record.IsRestore,
    fdBasedLinkCount: 0 as const,
    xdpLinkCount: 0 as const,
    hasDefaultV4Gateway: false as const,
    hasDefaultV6Gateway: false as const,
  })
  return Object.freeze({ ...base, networkTopologyIdentity: hash("NETWORK_TOPOLOGY", [base.loopbackName, base.loopbackAddresses, base.loopbackRoutes, base.gvisorGro, base.isRestore, 0, 0, false, false]) })
}

export function parseGvisorGetNetworkConfigResponse(text: string): GvisorNetworkTopologyObservation {
  if (typeof text !== "string" || byteLength(text) === 0 || byteLength(text) > KDO_H4_R3G_C_LIMITS.maxResponseBytes) throw new TypeError("R3G-C uRPC response has invalid size")
  validateJsonSyntaxNoDuplicateKeys(text, "R3G-C uRPC response")
  let parsed: unknown
  try { parsed = JSON.parse(text) } catch { throw new TypeError("R3G-C uRPC response is malformed JSON") }
  const response = asPlainRecord(parsed, "R3G-C uRPC response")
  exactKeys(response, ["success", "err", "result"], "R3G-C uRPC response")
  if (response.success !== true || response.err !== "") throw new Error(`R3G-C GetNetworkConfig remote error: ${typeof response.err === "string" ? response.err : "invalid remote error"}`)
  return normalizeGvisorNetworkTopology(response.result)
}

function findCompleteTopLevelJsonObjectEnd(buffer: Buffer): number | null {
  let index = 0
  while (index < buffer.length && (buffer[index] === 0x20 || buffer[index] === 0x09 || buffer[index] === 0x0a || buffer[index] === 0x0d)) index += 1
  if (index >= buffer.length) return null
  if (buffer[index] !== 0x7b) throw new TypeError("R3G-C uRPC response must begin with a JSON object")
  const stack: number[] = []; let inString = false; let escaped = false
  for (; index < buffer.length; index += 1) {
    const byte = buffer[index] ?? 0
    if (inString) {
      if (escaped) { escaped = false; continue }
      if (byte === 0x5c) { escaped = true; continue }
      if (byte === 0x22) inString = false
      continue
    }
    if (byte === 0x22) { inString = true; continue }
    if (byte === 0x7b || byte === 0x5b) { stack.push(byte); continue }
    if (byte === 0x7d || byte === 0x5d) {
      const expected = byte === 0x7d ? 0x7b : 0x5b
      if (stack.pop() !== expected) throw new TypeError("R3G-C uRPC response has mismatched JSON delimiters")
      if (stack.length === 0) return index + 1
    }
  }
  return null
}
function onlyJsonWhitespace(buffer: Buffer, start: number): boolean {
  for (let index = start; index < buffer.length; index += 1) if (![0x20, 0x09, 0x0a, 0x0d].includes(buffer[index] ?? -1)) return false
  return true
}

async function fixedGetNetworkConfigRpc(endpointPath: string, signal?: AbortSignal): Promise<GvisorNetworkTopologyObservation> {
  const path = canonicalPath(endpointPath, "R3G-C derived endpoint path")
  return new Promise((resolvePromise, rejectPromise) => {
    const socket = createConnection({ path, allowHalfOpen: false })
    let chunks: Buffer[] = []; let total = 0; let completedEnd: number | null = null; let parsed: GvisorNetworkTopologyObservation | undefined; let terminalError: Error | undefined; let finishing = false
    const clear = () => { clearTimeout(connectTimer); clearTimeout(rpcTimer); signal?.removeEventListener("abort", onAbort) }
    const finishError = (error: Error) => { if (finishing) return; finishing = true; terminalError = error; clear(); socket.destroy() }
    const finishSuccess = (value: GvisorNetworkTopologyObservation) => { if (finishing) return; finishing = true; parsed = value; clear(); socket.destroy() }
    const onAbort = () => finishError(new Error("R3G-C GetNetworkConfig aborted"))
    const connectTimer = setTimeout(() => finishError(new Error("R3G-C GetNetworkConfig connect timeout")), KDO_H4_R3G_C_LIMITS.connectTimeoutMs)
    const rpcTimer = setTimeout(() => finishError(new Error("R3G-C GetNetworkConfig response timeout")), KDO_H4_R3G_C_LIMITS.rpcTimeoutMs)
    signal?.addEventListener("abort", onAbort, { once: true })
    if (signal?.aborted) onAbort()
    socket.once("connect", () => { clearTimeout(connectTimer); if (!finishing) socket.write(REQUEST_BYTES) })
    socket.on("data", (chunk: Buffer) => {
      if (finishing) return
      total += chunk.byteLength
      if (total > KDO_H4_R3G_C_LIMITS.maxResponseBytes) { finishError(new Error("R3G-C uRPC response exceeds byte bound")); return }
      chunks.push(Buffer.from(chunk))
      const combined = Buffer.concat(chunks, total)
      try {
        if (completedEnd === null) completedEnd = findCompleteTopLevelJsonObjectEnd(combined)
        if (completedEnd === null) return
        if (!onlyJsonWhitespace(combined, completedEnd)) { finishError(new Error("R3G-C uRPC response contains trailing JSON content")); return }
        const text = UTF8.decode(combined.subarray(0, completedEnd))
        const candidate = parseGvisorGetNetworkConfigResponse(text)
        setImmediate(() => {
          if (finishing) return
          const latest = Buffer.concat(chunks, total)
          if (!onlyJsonWhitespace(latest, completedEnd ?? latest.length)) { finishError(new Error("R3G-C uRPC response contains trailing JSON content")); return }
          finishSuccess(candidate)
        })
      } catch (error) { finishError(error instanceof Error ? error : new Error(String(error))) }
    })
    socket.once("error", (error) => { if (!finishing) finishError(error) })
    socket.once("close", () => {
      clear()
      chunks = []
      if (terminalError !== undefined) rejectPromise(terminalError)
      else if (parsed !== undefined) resolvePromise(parsed)
      else rejectPromise(new Error("R3G-C GetNetworkConfig transport closed without a complete response"))
    })
  })
}

export async function observeGvisorNetworkTopologyOnce(input: {
  runtimeRoot: string
  trustedHostUid: string
  runtimeLineage: GvisorRuntimeLineageRecord
  signal?: AbortSignal
}): Promise<GvisorNetworkObservationRead> {
  const record = asPlainRecord(input, "R3G-C topology observation input")
  const inputKeys = Object.keys(record).sort()
  const expectedKeys = ("signal" in record ? ["runtimeRoot", "signal", "trustedHostUid", "runtimeLineage"] : ["runtimeRoot", "trustedHostUid", "runtimeLineage"]).sort()
  if (inputKeys.length !== expectedKeys.length || inputKeys.some((key, index) => key !== expectedKeys[index])) throw new TypeError("R3G-C topology observation input contains unauthorized fields")
  const runtimeLineage = validateGvisorRuntimeLineageRecord(record.runtimeLineage)
  const runtimeRoot = canonicalPath(record.runtimeRoot, "runtimeRoot")
  const trustedHostUid = canonicalUnsignedDecimal(record.trustedHostUid, "trustedHostUid")
  const signal = record.signal as AbortSignal | undefined
  if (signal?.aborted) throw new Error("R3G-C topology observation aborted before endpoint snapshot")
  const endpointBefore = await snapshotGvisorNetworkControlEndpoint({ runtimeRoot, containerId: runtimeLineage.containerId, trustedHostUid })
  const topology = await fixedGetNetworkConfigRpc(endpointBefore.path, signal)
  const endpointAfter = await snapshotGvisorNetworkControlEndpoint({ runtimeRoot, containerId: runtimeLineage.containerId, trustedHostUid })
  if (endpointAfter.endpointIdentity !== endpointBefore.endpointIdentity) throw new Error("R3G-C control endpoint identity changed during GetNetworkConfig")
  return Object.freeze({ endpointBefore, endpointAfter, topology })
}

function requireSameR3eInstance(beforeValue: unknown, afterValue: unknown): { before: GvisorRuntimeLineageRecord; after: GvisorRuntimeLineageRecord } {
  const before = validateGvisorRuntimeLineageRecord(beforeValue); const after = validateGvisorRuntimeLineageRecord(afterValue)
  for (const key of ["executionAttemptIdentity", "requirementIdentity", "workloadIdentity", "containerBindingIdentity", "containerId", "observerImplementationIdentity", "runscArtifactIdentity", "observerHelperArtifactIdentity", "planIdentity", "stateIdentity", "processIdentity", "runtimeInstanceIdentity"] as const) {
    if (before[key] !== after[key]) throw new TypeError(`R3G-C R3E exact-instance bracket mismatch: ${key}`)
  }
  return { before, after }
}

function physicalNetworkPreimage(input: Omit<GvisorPhysicalNetworkRecord, "recordIdentity">): string { return JSON.stringify(input) }

export function createGvisorPhysicalNetworkRecord(input: {
  r3eBefore: GvisorRuntimeLineageRecord
  r3eAfter: GvisorRuntimeLineageRecord
  dockerControlPlane: DockerControlPlaneObservation
  firstRead: GvisorNetworkObservationRead
  secondRead: GvisorNetworkObservationRead
  trustedHostSerializationTheoremVersion: string
}): GvisorPhysicalNetworkRecord {
  const record = asPlainRecord(input, "R3G-C physical network record input")
  exactKeys(record, ["r3eBefore", "r3eAfter", "dockerControlPlane", "firstRead", "secondRead", "trustedHostSerializationTheoremVersion"], "R3G-C physical network record input")
  if (record.trustedHostSerializationTheoremVersion !== KDO_H4_R3G_C_SERIALIZATION_THEOREM_VERSION) throw new TypeError("R3G-C trusted-host serialization theorem is not admitted")
  const { before, after } = requireSameR3eInstance(record.r3eBefore, record.r3eAfter)
  const docker = validateDockerControlPlaneObservation(record.dockerControlPlane)
  for (const key of ["executionAttemptIdentity", "requirementIdentity", "workloadIdentity", "containerId"] as const) if (docker[key] !== before[key]) throw new TypeError(`R3G-C Docker/R3E exact-subject mismatch: ${key}`)
  if (docker.bindingIdentity !== before.containerBindingIdentity) throw new TypeError("R3G-C Docker/R3E container binding mismatch")
  if (docker.networkMode !== "none" || docker.networkAttachmentCount !== 0) throw new TypeError("R3G-C requires fresh Docker deny-all E2 posture")
  const validateRead = (value: unknown, label: string): GvisorNetworkObservationRead => {
    const checked = asPlainRecord(value, label)
    exactKeys(checked, ["endpointBefore", "endpointAfter", "topology"], label)
    return Object.freeze({
      endpointBefore: validateGvisorNetworkControlEndpointIdentity(checked.endpointBefore),
      endpointAfter: validateGvisorNetworkControlEndpointIdentity(checked.endpointAfter),
      topology: normalizeValidatedTopology(checked.topology),
    })
  }
  const firstRead = validateRead(record.firstRead, "R3G-C first topology read")
  const secondRead = validateRead(record.secondRead, "R3G-C second topology read")
  const endpoints = [firstRead.endpointBefore, firstRead.endpointAfter, secondRead.endpointBefore, secondRead.endpointAfter]
  if (endpoints.some((entry) => entry.endpointIdentity !== endpoints[0]?.endpointIdentity)) throw new TypeError("R3G-C control endpoint changed across observation bracket")
  const firstTopology = firstRead.topology; const secondTopology = secondRead.topology
  if (firstTopology.networkTopologyIdentity !== secondTopology.networkTopologyIdentity) throw new TypeError("R3G-C retained network topology changed across observation bracket")
  const endpoint = endpoints[0]; if (endpoint === undefined) throw new TypeError("R3G-C endpoint bracket is empty")
  const base = Object.freeze({
    version: KDO_H4_R3G_C_VERSION,
    evidenceClass: KDO_H4_R3G_C_EVIDENCE_CLASS,
    executionAttemptIdentity: before.executionAttemptIdentity,
    requirementIdentity: before.requirementIdentity,
    workloadIdentity: before.workloadIdentity,
    containerBindingIdentity: before.containerBindingIdentity,
    containerId: before.containerId,
    runtimeInstanceIdentity: before.runtimeInstanceIdentity,
    runscArtifactIdentity: before.runscArtifactIdentity,
    stateIdentity: before.stateIdentity,
    processIdentity: before.processIdentity,
    r3eBeforeRecordIdentity: before.recordIdentity,
    r3eAfterRecordIdentity: after.recordIdentity,
    dockerControlPlaneObservationIdentity: docker.controlPlaneObservationIdentity,
    controlEndpointIdentity: endpoint.endpointIdentity,
    networkTopologyIdentity: firstTopology.networkTopologyIdentity,
    networkObserverImplementationIdentity: createGvisorNetworkObserverImplementationIdentity(),
    networkPolicy: KDO_H4_R3G_C_NETWORK_POLICY,
    trustedHostSerializationTheoremVersion: KDO_H4_R3G_C_SERIALIZATION_THEOREM_VERSION,
  })
  return Object.freeze({ ...base, recordIdentity: hash("PHYSICAL_NETWORK_RECORD", [physicalNetworkPreimage(base)]) })
}

function normalizeValidatedTopology(value: unknown): GvisorNetworkTopologyObservation {
  const record = asPlainRecord(value, "R3G-C normalized topology")
  exactKeys(record, ["loopbackName", "loopbackAddresses", "loopbackRoutes", "gvisorGro", "isRestore", "fdBasedLinkCount", "xdpLinkCount", "hasDefaultV4Gateway", "hasDefaultV6Gateway", "networkTopologyIdentity"], "R3G-C normalized topology")
  if (record.loopbackName !== "lo" || record.fdBasedLinkCount !== 0 || record.xdpLinkCount !== 0 || record.hasDefaultV4Gateway !== false || record.hasDefaultV6Gateway !== false || typeof record.gvisorGro !== "boolean" || typeof record.isRestore !== "boolean") throw new TypeError("R3G-C normalized topology policy mismatch")
  if (!Array.isArray(record.loopbackAddresses) || JSON.stringify(record.loopbackAddresses) !== JSON.stringify(["127.0.0.1/8", "::1/128"])) throw new TypeError("R3G-C normalized loopback address mismatch")
  if (!Array.isArray(record.loopbackRoutes) || JSON.stringify(record.loopbackRoutes) !== JSON.stringify(["127.0.0.0/8", "::1/128"])) throw new TypeError("R3G-C normalized loopback route mismatch")
  const expected = hash("NETWORK_TOPOLOGY", ["lo", ["127.0.0.1/8", "::1/128"], ["127.0.0.0/8", "::1/128"], record.gvisorGro, record.isRestore, 0, 0, false, false])
  if (identity(record.networkTopologyIdentity, "networkTopologyIdentity") !== expected) throw new TypeError("R3G-C network topology identity mismatch")
  return Object.freeze({
    loopbackName: "lo",
    loopbackAddresses: Object.freeze(["127.0.0.1/8", "::1/128"]),
    loopbackRoutes: Object.freeze(["127.0.0.0/8", "::1/128"]),
    gvisorGro: record.gvisorGro,
    isRestore: record.isRestore,
    fdBasedLinkCount: 0,
    xdpLinkCount: 0,
    hasDefaultV4Gateway: false,
    hasDefaultV6Gateway: false,
    networkTopologyIdentity: expected,
  }) as GvisorNetworkTopologyObservation
}

export function validateGvisorPhysicalNetworkRecord(value: unknown): GvisorPhysicalNetworkRecord {
  const record = asPlainRecord(value, "R3G-C physical network record")
  exactKeys(record, ["version", "evidenceClass", "executionAttemptIdentity", "requirementIdentity", "workloadIdentity", "containerBindingIdentity", "containerId", "runtimeInstanceIdentity", "runscArtifactIdentity", "stateIdentity", "processIdentity", "r3eBeforeRecordIdentity", "r3eAfterRecordIdentity", "dockerControlPlaneObservationIdentity", "controlEndpointIdentity", "networkTopologyIdentity", "networkObserverImplementationIdentity", "networkPolicy", "trustedHostSerializationTheoremVersion", "recordIdentity"], "R3G-C physical network record")
  if (record.version !== KDO_H4_R3G_C_VERSION || record.evidenceClass !== KDO_H4_R3G_C_EVIDENCE_CLASS || record.networkPolicy !== KDO_H4_R3G_C_NETWORK_POLICY || record.trustedHostSerializationTheoremVersion !== KDO_H4_R3G_C_SERIALIZATION_THEOREM_VERSION) throw new TypeError("R3G-C physical network record version/class/policy mismatch")
  const base = Object.freeze({
    version: KDO_H4_R3G_C_VERSION,
    evidenceClass: KDO_H4_R3G_C_EVIDENCE_CLASS,
    executionAttemptIdentity: identity(record.executionAttemptIdentity, "executionAttemptIdentity"),
    requirementIdentity: identity(record.requirementIdentity, "requirementIdentity"),
    workloadIdentity: identity(record.workloadIdentity, "workloadIdentity"),
    containerBindingIdentity: identity(record.containerBindingIdentity, "containerBindingIdentity"),
    containerId: fullContainerId(record.containerId),
    runtimeInstanceIdentity: identity(record.runtimeInstanceIdentity, "runtimeInstanceIdentity"),
    runscArtifactIdentity: identity(record.runscArtifactIdentity, "runscArtifactIdentity"),
    stateIdentity: identity(record.stateIdentity, "stateIdentity"),
    processIdentity: identity(record.processIdentity, "processIdentity"),
    r3eBeforeRecordIdentity: identity(record.r3eBeforeRecordIdentity, "r3eBeforeRecordIdentity"),
    r3eAfterRecordIdentity: identity(record.r3eAfterRecordIdentity, "r3eAfterRecordIdentity"),
    dockerControlPlaneObservationIdentity: identity(record.dockerControlPlaneObservationIdentity, "dockerControlPlaneObservationIdentity"),
    controlEndpointIdentity: identity(record.controlEndpointIdentity, "controlEndpointIdentity"),
    networkTopologyIdentity: identity(record.networkTopologyIdentity, "networkTopologyIdentity"),
    networkObserverImplementationIdentity: identity(record.networkObserverImplementationIdentity, "networkObserverImplementationIdentity"),
    networkPolicy: KDO_H4_R3G_C_NETWORK_POLICY,
    trustedHostSerializationTheoremVersion: KDO_H4_R3G_C_SERIALIZATION_THEOREM_VERSION,
  })
  if (base.networkObserverImplementationIdentity !== createGvisorNetworkObserverImplementationIdentity()) throw new TypeError("R3G-C network observer implementation identity mismatch")
  const expected = hash("PHYSICAL_NETWORK_RECORD", [physicalNetworkPreimage(base)])
  if (identity(record.recordIdentity, "recordIdentity") !== expected) throw new TypeError("R3G-C physical network record identity mismatch")
  return Object.freeze({ ...base, recordIdentity: expected })
}

export function createGvisorPhysicalNetworkCommit(recordValue: GvisorPhysicalNetworkRecord): GvisorPhysicalNetworkCommit {
  const record = validateGvisorPhysicalNetworkRecord(recordValue)
  const base = Object.freeze({ version: KDO_H4_R3G_C_COMMIT_VERSION, recordIdentity: record.recordIdentity })
  return Object.freeze({ ...base, commitIdentity: hash("NETWORK_COMMIT", [record.recordIdentity]) })
}

export function validateGvisorPhysicalNetworkCommit(value: unknown, expectedRecord: GvisorPhysicalNetworkRecord): GvisorPhysicalNetworkCommit {
  const record = asPlainRecord(value, "R3G-C physical network commit")
  exactKeys(record, ["version", "recordIdentity", "commitIdentity"], "R3G-C physical network commit")
  if (record.version !== KDO_H4_R3G_C_COMMIT_VERSION) throw new TypeError("R3G-C physical network commit version mismatch")
  const expected = createGvisorPhysicalNetworkCommit(expectedRecord)
  if (identity(record.recordIdentity, "commit recordIdentity") !== expected.recordIdentity || identity(record.commitIdentity, "commitIdentity") !== expected.commitIdentity) throw new TypeError("R3G-C physical network commit acknowledgment mismatch")
  return expected
}
