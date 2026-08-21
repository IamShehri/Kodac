import { lstatSync, readFileSync } from "node:fs"
import { request as httpRequest, type IncomingMessage } from "node:http"
import { posix } from "node:path"
import { performance } from "node:perf_hooks"
import { TextDecoder, types as utilTypes } from "node:util"

import {
  validateSandboxAdmissionPermit,
  type SandboxAdmissionPermit,
} from "../trust/sandbox-admission-permit.ts"
import {
  KDO_H4_R4B_B1_LABELS,
  validateSandboxDormantCreatedAdmission,
  validateSandboxDormantCreatedAdmissionCommit,
  type SandboxDormantCreatedAdmission,
} from "../trust/sandbox-admission-dormant-create.ts"
import { validateSandboxExecutionRequirement } from "../trust/sandbox-backend-evidence.ts"
import {
  KDO_H4_R3F_BINDING_VERSION,
  KDO_H4_R3F_LIMITS,
  createDockerControlPlaneBindingProvider,
  createDockerSocketEndpointIdentity,
  type DockerSocketEndpointIdentity,
} from "../trust/sandbox-observer-docker-control-plane.ts"
import {
  createSandboxPrestartFailedFence,
  createSandboxPrestartFailure,
  createSandboxPrestartFailureCommit,
  createSandboxPrestartOwnerCapability,
  createSandboxPrestartOwnerClaimedFence,
  createSandboxPrestartOwnershipClaim,
  createSandboxPrestartOwnershipClaimCommit,
  createSandboxPrestartPrepared,
  createSandboxPrestartPreparedCommit,
  createSandboxPrestartPreparedFence,
  sandboxPrestartOwnerInstanceIdentity,
  validateSandboxPrestartFailure,
  validateSandboxPrestartFailureCommit,
  validateSandboxPrestartOwnershipClaim,
  validateSandboxPrestartOwnershipClaimCommit,
  validateSandboxPrestartPrepared,
  validateSandboxPrestartPreparedCommit,
  validateSandboxPrestartStateFence,
  type SandboxPrestartFailure,
  type SandboxPrestartFailureCode,
  type SandboxPrestartFailureCommit,
  type SandboxPrestartFailurePhase,
  type SandboxPrestartOwnerCapability,
  type SandboxPrestartOwnershipClaim,
  type SandboxPrestartOwnershipClaimCommit,
  type SandboxPrestartPrepared,
  type SandboxPrestartPreparedCommit,
  type SandboxPrestartStateFence,
} from "../trust/sandbox-admission-prestart-output.ts"
import {
  InternalGvisorAttachError,
  InternalGvisorPrestartMultiplexReader,
  openExactGvisorDockerAttach,
} from "./gateway-gvisor-output-channel-internal.ts"

export const KDO_H4_R4B_B2A_RUNTIME_VERSION = "kodac-h4-r4b-b2a-docker-prestart-runtime-v1" as const
export const KDO_H4_R4B_B2A_PRESTART_READY_VERSION = "kodac-h4-r4b-b2a-prestart-ready-v1" as const
export const KDO_H4_R4B_B2A_RUNTIME_LIMITS = Object.freeze({
  attachUpgradeTimeoutMs: KDO_H4_R3F_LIMITS.requestTimeoutMs,
  readerActivationTimeoutMs: KDO_H4_R3F_LIMITS.requestTimeoutMs,
  dormantRevalidationTimeoutMs: KDO_H4_R3F_LIMITS.requestTimeoutMs,
  ownerToReadyTimeoutMs: KDO_H4_R3F_LIMITS.requestTimeoutMs * 3,
} as const)

export interface SandboxPrestartReadyCapability {
  readonly version: typeof KDO_H4_R4B_B2A_PRESTART_READY_VERSION
}
export interface SandboxPrestartReadyResult {
  readonly status: "PRESTART_READY"
  readonly prepared: SandboxPrestartPrepared
  readonly preparedCommit: SandboxPrestartPreparedCommit
  readonly ownershipClaim: SandboxPrestartOwnershipClaim
  readonly ownershipClaimCommit: SandboxPrestartOwnershipClaimCommit
  readonly readiness: SandboxPrestartReadyCapability
}
export interface SandboxPrestartOwnerUnavailableResult {
  readonly status: "OWNER_CLAIMED_UNAVAILABLE"
  readonly classification: "INDETERMINATE"
  readonly reusable: false
}
export type SandboxPrestartPreparationResult = SandboxPrestartReadyResult | SandboxPrestartOwnerUnavailableResult

export interface GvisorDockerPrestartOutputRuntimeConfig {
  readonly socketPath: string
  readonly commitPreparationTransaction: (
    input: { readonly prepared: SandboxPrestartPrepared; readonly preparedCommit: SandboxPrestartPreparedCommit; readonly fence: SandboxPrestartStateFence },
    options: { readonly signal: AbortSignal },
  ) => Promise<unknown> | unknown
  readonly readStateFence: (prestartOutputOperationIdentity: string, options: { readonly signal: AbortSignal }) => Promise<unknown> | unknown
  readonly commitOwnershipClaimTransaction: (
    input: { readonly claim: SandboxPrestartOwnershipClaim; readonly claimCommit: SandboxPrestartOwnershipClaimCommit; readonly expectedFence: SandboxPrestartStateFence; readonly nextFence: SandboxPrestartStateFence },
    options: { readonly signal: AbortSignal },
  ) => Promise<unknown> | unknown
  readonly commitFailureTransaction: (
    input: { readonly failure: SandboxPrestartFailure; readonly failureCommit: SandboxPrestartFailureCommit; readonly expectedFence: SandboxPrestartStateFence; readonly nextFence: SandboxPrestartStateFence },
    options: { readonly signal: AbortSignal },
  ) => Promise<unknown> | unknown
}

export class SandboxPrestartBlockedError extends Error { constructor(message: string) { super(message); this.name = "SandboxPrestartBlockedError" } }
export class SandboxPrestartIndeterminateError extends Error { constructor(message: string) { super(message); this.name = "SandboxPrestartIndeterminateError" } }
export class SandboxPrestartTerminalError extends Error { constructor(message: string) { super(message); this.name = "SandboxPrestartTerminalError" } }
class SandboxPrestartClientUnauthorizedError extends SandboxPrestartBlockedError { constructor(message: string) { super(message); this.name = "SandboxPrestartClientUnauthorizedError" } }

interface TrustedGvisorDockerPrestartOutputRuntime {
  readonly version: typeof KDO_H4_R4B_B2A_RUNTIME_VERSION
  readonly socketPath: string
  readonly commitPreparationTransaction: GvisorDockerPrestartOutputRuntimeConfig["commitPreparationTransaction"]
  readonly readStateFence: GvisorDockerPrestartOutputRuntimeConfig["readStateFence"]
  readonly commitOwnershipClaimTransaction: GvisorDockerPrestartOutputRuntimeConfig["commitOwnershipClaimTransaction"]
  readonly commitFailureTransaction: GvisorDockerPrestartOutputRuntimeConfig["commitFailureTransaction"]
}
interface NamespaceEntrySnapshot { readonly path: string; readonly device: string; readonly inode: string; readonly uid: string; readonly gid: string; readonly mode: string; readonly kind: "directory" | "socket" }
interface HostTrustSnapshot { readonly uidMap: "0:0:4294967295"; readonly gidMap: "0:0:4294967295"; readonly entries: readonly NamespaceEntrySnapshot[]; readonly socketEndpoint: DockerSocketEndpointIdentity }
interface DockerImagePreflight { readonly imageId: string; readonly manifestDigest: string; readonly user: string; readonly env: readonly string[]; readonly workingDir: string }
interface ReadinessTerminalizationState {
  phase: SandboxPrestartFailurePhase | null
  code: SandboxPrestartFailureCode | null
  promise: Promise<void> | null
  error: SandboxPrestartIndeterminateError | null
}
interface ReadinessBinding { readonly prepared: SandboxPrestartPrepared; readonly claim: SandboxPrestartOwnershipClaim; readonly ownerCapability: SandboxPrestartOwnerCapability; readonly reader: InternalGvisorPrestartMultiplexReader; readonly controller: AbortController; readonly runtime: TrustedGvisorDockerPrestartOutputRuntime; readonly terminalization: ReadinessTerminalizationState }
type PreparationSettlementKind = "prepared" | "owner-claimed-unavailable" | "failed-terminal"

const trustedRuntimes = new WeakSet<object>()
const readinessBindings = new WeakMap<object, ReadinessBinding>()
const UTF8 = new TextDecoder("utf-8", { fatal: true })
const FULL_CONTAINER_ID = /^[0-9a-f]{64}$/
const DOCKER_IMAGE_ID = /^sha256:[0-9a-f]{64}$/
const B2A_DURABLE_OPERATION_TIMEOUT_MS = KDO_H4_R3F_LIMITS.requestTimeoutMs
const DOCKER_API_1_48_MASKED_PATH_FLOOR = Object.freeze(["/proc/asound", "/proc/acpi", "/proc/kcore", "/proc/keys", "/proc/latency_stats", "/proc/timer_list", "/proc/timer_stats", "/proc/sched_debug", "/proc/scsi", "/sys/firmware", "/sys/devices/virtual/powercap"] as const)
const DOCKER_API_1_48_READONLY_PATH_FLOOR = Object.freeze(["/proc/bus", "/proc/fs", "/proc/irq", "/proc/sys", "/proc/sysrq-trigger"] as const)

function asPlainRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value) || utilTypes.isProxy(value)) throw new TypeError(`${label} must be a non-proxy plain object`)
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain object`)
  if (Object.getOwnPropertySymbols(value).length !== 0) throw new TypeError(`${label} must not contain symbol fields`)
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) if (descriptor.get !== undefined || descriptor.set !== undefined || !("value" in descriptor) || !descriptor.enumerable || descriptor.value === undefined) throw new TypeError(`${label}.${key} must be an enumerable defined data property`)
  return value as Record<string, unknown>
}
function exactKeys(record: Record<string, unknown>, expected: readonly string[], label: string): void { const actual = Object.keys(record).sort(); const wanted = [...expected].sort(); if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) throw new TypeError(`${label} must contain exactly: ${wanted.join(", ")}`) }
function trustedCallback<T>(value: unknown, label: string): T { if (typeof value !== "function" || utilTypes.isProxy(value)) throw new TypeError(`${label} must be a non-proxy function`); return value as T }
function canonicalSocketPath(value: unknown): string { if (typeof value !== "string" || value.length === 0 || value.includes("\0") || Buffer.byteLength(value, "utf8") > KDO_H4_R3F_LIMITS.maxSocketPathBytes) throw new TypeError("B2A Docker socket path must be bounded non-empty POSIX text"); if (!posix.isAbsolute(value) || posix.normalize(value) !== value || (value.length > 1 && value.endsWith("/"))) throw new TypeError("B2A Docker socket path must be canonical absolute POSIX path"); return value }
function indeterminate(error: unknown, prefix: string): SandboxPrestartIndeterminateError { return error instanceof SandboxPrestartIndeterminateError ? error : new SandboxPrestartIndeterminateError(`${prefix}: ${error instanceof Error ? error.message : String(error)}`) }

export function createGvisorDockerPrestartOutputRuntime(value: unknown): TrustedGvisorDockerPrestartOutputRuntime {
  if (process.platform !== "linux") throw new Error("B2A Docker prestart runtime requires Linux")
  const record = asPlainRecord(value, "B2A runtime config")
  exactKeys(record, ["socketPath", "commitPreparationTransaction", "readStateFence", "commitOwnershipClaimTransaction", "commitFailureTransaction"], "B2A runtime config")
  const runtime = Object.freeze({
    version: KDO_H4_R4B_B2A_RUNTIME_VERSION,
    socketPath: canonicalSocketPath(record.socketPath),
    commitPreparationTransaction: trustedCallback<GvisorDockerPrestartOutputRuntimeConfig["commitPreparationTransaction"]>(record.commitPreparationTransaction, "commitPreparationTransaction"),
    readStateFence: trustedCallback<GvisorDockerPrestartOutputRuntimeConfig["readStateFence"]>(record.readStateFence, "readStateFence"),
    commitOwnershipClaimTransaction: trustedCallback<GvisorDockerPrestartOutputRuntimeConfig["commitOwnershipClaimTransaction"]>(record.commitOwnershipClaimTransaction, "commitOwnershipClaimTransaction"),
    commitFailureTransaction: trustedCallback<GvisorDockerPrestartOutputRuntimeConfig["commitFailureTransaction"]>(record.commitFailureTransaction, "commitFailureTransaction"),
  })
  trustedRuntimes.add(runtime)
  return runtime
}
function requireTrustedRuntime(value: unknown): TrustedGvisorDockerPrestartOutputRuntime { if (value === null || typeof value !== "object" || !trustedRuntimes.has(value as object)) throw new TypeError("B2A gateway requires a runtime created by createGvisorDockerPrestartOutputRuntime"); return value as TrustedGvisorDockerPrestartOutputRuntime }

function canonicalMap(text: string, label: string): "0:0:4294967295" {
  const trimmed = text.replace(/[\t\r\n ]+/g, " ").trim()
  if (trimmed.length === 0) throw new TypeError(`${label} is empty`)
  const parts = trimmed.split(" ")
  if (parts.length !== 3 || parts.some((part) => !/^(?:0|[1-9][0-9]*)$/.test(part))) throw new TypeError(`${label} must contain exactly one unsigned-decimal mapping triplet`)
  for (const [index, part] of parts.entries()) { const value = Number(part); if (!Number.isSafeInteger(value) || value < 0 || value > 4_294_967_295) throw new TypeError(`${label}[${index}] is outside uint32`) }
  if (parts[0] !== "0" || parts[1] !== "0" || parts[2] !== "4294967295") throw new TypeError(`${label} is not the required full identity mapping`)
  return "0:0:4294967295"
}
/** Deep-module test seam only. Never exported from the package root. */
export function validateGvisorDockerPrestartHostIdMappingForTest(uidMapText: string, gidMapText: string): true { canonicalMap(uidMapText, "B2A test uid_map"); canonicalMap(gidMapText, "B2A test gid_map"); return true }
function namespacePaths(socketPath: string): readonly string[] { const ancestors: string[] = []; let current = posix.dirname(socketPath); for (;;) { ancestors.push(current); if (current === "/") break; current = posix.dirname(current) } ancestors.reverse(); return Object.freeze([...ancestors, socketPath]) }
function snapshotHostTrust(runtime: TrustedGvisorDockerPrestartOutputRuntime): HostTrustSnapshot {
  if (process.geteuid?.() !== 0 || process.getegid?.() !== 0) throw new SandboxPrestartClientUnauthorizedError("B2A requires effective uid=0 and effective gid=0")
  const uidMap = canonicalMap(readFileSync("/proc/self/uid_map", "utf8"), "B2A uid_map"); const gidMap = canonicalMap(readFileSync("/proc/self/gid_map", "utf8"), "B2A gid_map"); const paths = namespacePaths(runtime.socketPath)
  const entries = paths.map((path, index) => {
    const stats = lstatSync(path, { bigint: true }); const isFinal = index === paths.length - 1
    if (isFinal) { if (!stats.isSocket()) throw new SandboxPrestartBlockedError("B2A Docker endpoint must be a pathname Unix socket"); if (stats.uid !== 0n || stats.gid !== 0n) throw new SandboxPrestartBlockedError("B2A Docker socket must be owned by uid=0 gid=0"); if ((stats.mode & 0o777n) !== 0o600n) throw new SandboxPrestartBlockedError("B2A Docker socket permission bits must be exactly 0600") }
    else { if (!stats.isDirectory()) throw new SandboxPrestartBlockedError(`B2A protected namespace component must be a directory: ${path}`); if (stats.uid !== 0n) throw new SandboxPrestartBlockedError(`B2A protected namespace component must be uid=0: ${path}`); if ((stats.mode & 0o022n) !== 0n) throw new SandboxPrestartBlockedError(`B2A protected namespace component cannot be group/world writable: ${path}`) }
    return Object.freeze({ path, device: stats.dev.toString(10), inode: stats.ino.toString(10), uid: stats.uid.toString(10), gid: stats.gid.toString(10), mode: stats.mode.toString(10), kind: isFinal ? "socket" as const : "directory" as const })
  })
  const socket = entries[entries.length - 1]!; const socketEndpoint = createDockerSocketEndpointIdentity({ device: socket.device, inode: socket.inode, uid: socket.uid, gid: socket.gid, mode: socket.mode })
  return Object.freeze({ uidMap, gidMap, entries: Object.freeze(entries), socketEndpoint })
}
function sameHostTrust(left: HostTrustSnapshot, right: HostTrustSnapshot): boolean { return left.uidMap === right.uidMap && left.gidMap === right.gidMap && left.socketEndpoint.endpointIdentity === right.socketEndpoint.endpointIdentity && left.entries.length === right.entries.length && left.entries.every((entry, index) => { const other = right.entries[index]; return other !== undefined && entry.path === other.path && entry.device === other.device && entry.inode === other.inode && entry.uid === other.uid && entry.gid === other.gid && entry.mode === other.mode && entry.kind === other.kind }) }

function requiredRecord(record: Record<string, unknown>, key: string, label: string): Record<string, unknown> { return asPlainRecord(record[key], `${label}.${key}`) }
function requiredString(record: Record<string, unknown>, key: string, label: string): string { const value = record[key]; if (typeof value !== "string") throw new TypeError(`${label}.${key} must be string`); return value }
function requiredBoolean(record: Record<string, unknown>, key: string, label: string): boolean { const value = record[key]; if (typeof value !== "boolean") throw new TypeError(`${label}.${key} must be boolean`); return value }
function requiredInteger(record: Record<string, unknown>, key: string, label: string): number { const value = record[key]; if (typeof value !== "number" || !Number.isSafeInteger(value)) throw new TypeError(`${label}.${key} must be a safe integer`); return value }
function requiredStringArray(record: Record<string, unknown>, key: string, label: string): readonly string[] { const value = record[key]; if (!Array.isArray(value) || utilTypes.isProxy(value) || Object.getPrototypeOf(value) !== Array.prototype) throw new TypeError(`${label}.${key} must be a plain array`); return Object.freeze(value.map((entry, index) => { if (typeof entry !== "string") throw new TypeError(`${label}.${key}[${index}] must be string`); return entry })) }
function optionalString(record: Record<string, unknown>, key: string, label: string): string { const value = record[key]; if (value === undefined || value === null) return ""; if (typeof value !== "string") throw new TypeError(`${label}.${key} must be absent/null/string`); return value }
function optionalStringArray(record: Record<string, unknown>, key: string, label: string): readonly string[] { const value = record[key]; if (value === undefined || value === null) return Object.freeze([]); if (!Array.isArray(value) || utilTypes.isProxy(value) || Object.getPrototypeOf(value) !== Array.prototype) throw new TypeError(`${label}.${key} must be absent/null/array`); return Object.freeze(value.map((entry, index) => { if (typeof entry !== "string") throw new TypeError(`${label}.${key}[${index}] must be string`); return entry })) }
function sameStringArray(left: readonly string[], right: readonly string[]): boolean { return left.length === right.length && left.every((value, index) => value === right[index]) }
function optionalEmptyArray(record: Record<string, unknown>, key: string, label: string): void { const value = record[key]; if (value === undefined || value === null) return; if (!Array.isArray(value) || utilTypes.isProxy(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length !== 0) throw new TypeError(`${label}.${key} must be absent/null/empty array`) }
function optionalEmptyRecord(record: Record<string, unknown>, key: string, label: string): void { const value = record[key]; if (value === undefined || value === null) return; const nested = asPlainRecord(value, `${label}.${key}`); if (Object.keys(nested).length !== 0) throw new TypeError(`${label}.${key} must be absent/null/empty`) }
function optionalFalse(record: Record<string, unknown>, key: string, label: string): void { const value = record[key]; if (value === undefined || value === null) return; if (value !== false) throw new TypeError(`${label}.${key} must be absent/null/false`) }
function optionalStringIn(record: Record<string, unknown>, key: string, allowed: readonly string[], label: string): void { const value = record[key]; if (value === undefined || value === null) return; if (typeof value !== "string" || !allowed.includes(value)) throw new TypeError(`${label}.${key} contains unadmitted authority`) }
function requireProtectionPathFloor(record: Record<string, unknown>, key: string, required: readonly string[], label: string): void { const observed = requiredStringArray(record, key, label); const set = new Set(observed); if (set.size !== observed.length) throw new TypeError(`${label}.${key} contains duplicate paths`); for (const path of required) if (!set.has(path)) throw new TypeError(`${label}.${key} missing ${path}`) }

function validateJsonSyntaxNoDuplicateKeys(text: string, label: string): void {
  let index = 0; const length = text.length; const whitespace = (char: string) => char === " " || char === "\t" || char === "\r" || char === "\n"; const skip = () => { while (index < length && whitespace(text[index] ?? "")) index += 1 }; const number = /-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/y
  const stringToken = (): string => { if (text[index] !== '"') throw new TypeError(`${label} contains invalid JSON string syntax`); const start = index++; while (index < length) { const char = text[index] ?? ""; if (char === '"') { index += 1; try { return JSON.parse(text.slice(start, index)) as string } catch { throw new TypeError(`${label} contains invalid JSON string syntax`) } } if (char === "\\") { index += 1; if (index >= length) throw new TypeError(`${label} contains unterminated JSON escape`); if (text[index] === "u") { if (!/^[0-9a-fA-F]{4}$/.test(text.slice(index + 1, index + 5))) throw new TypeError(`${label} contains invalid JSON unicode escape`); index += 4 } else if (!'"\\/bfnrt'.includes(text[index] ?? "")) throw new TypeError(`${label} contains invalid JSON escape`) } else if (char.charCodeAt(0) < 0x20) throw new TypeError(`${label} contains unescaped JSON control character`); index += 1 } throw new TypeError(`${label} contains unterminated JSON string`) }
  const parseValue = (depth: number): void => { if (depth > 64) throw new TypeError(`${label} exceeds JSON nesting depth`); skip(); const char = text[index]; if (char === "{") { index += 1; skip(); const keys = new Set<string>(); if (text[index] === "}") { index += 1; return } for (;;) { skip(); const key = stringToken(); if (keys.has(key)) throw new TypeError(`${label} contains duplicate JSON key: ${key}`); keys.add(key); skip(); if (text[index] !== ":") throw new TypeError(`${label} contains invalid JSON object syntax`); index += 1; parseValue(depth + 1); skip(); if (text[index] === "}") { index += 1; return } if (text[index] !== ",") throw new TypeError(`${label} contains invalid JSON object syntax`); index += 1 } } if (char === "[") { index += 1; skip(); if (text[index] === "]") { index += 1; return } for (;;) { parseValue(depth + 1); skip(); if (text[index] === "]") { index += 1; return } if (text[index] !== ",") throw new TypeError(`${label} contains invalid JSON array syntax`); index += 1 } } if (char === '"') { stringToken(); return } number.lastIndex = index; const match = number.exec(text); if (match !== null) { index = number.lastIndex; return } for (const literal of ["true", "false", "null"] as const) if (text.startsWith(literal, index)) { index += literal.length; return } throw new TypeError(`${label} contains invalid JSON value syntax`) }
  parseValue(0); skip(); if (index !== length) throw new TypeError(`${label} contains trailing JSON content`)
}
function parseJsonObject(body: Buffer, label: string): Record<string, unknown> { let text: string; try { text = UTF8.decode(body) } catch { throw new TypeError(`${label} must be valid UTF-8`) } validateJsonSyntaxNoDuplicateKeys(text, label); return asPlainRecord(JSON.parse(text) as unknown, label) }
async function boundedDockerGet(runtime: TrustedGvisorDockerPrestartOutputRuntime, path: string, maximum: number, signal: AbortSignal): Promise<Buffer> {
  if (signal.aborted) throw new SandboxPrestartBlockedError("B2A Docker read aborted")
  return await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []; let bytes = 0; let settled = false; const cleanup = () => signal.removeEventListener("abort", onAbort); const finishReject = (error: unknown) => { if (settled) return; settled = true; cleanup(); reject(error instanceof Error ? error : new Error(String(error))) }; const finishResolve = () => { if (settled) return; settled = true; cleanup(); resolve(Buffer.concat(chunks, bytes)) }
    const request = httpRequest({ method: "GET", socketPath: runtime.socketPath, path, agent: false, maxHeaderSize: KDO_H4_R3F_LIMITS.maxResponseHeaderBytes, headers: Object.freeze({ Accept: "application/json", Connection: "close" }) }, (response: IncomingMessage) => { const headerBytes = response.rawHeaders.reduce((total, item) => total + Buffer.byteLength(item, "utf8") + 2, 0); if (headerBytes > KDO_H4_R3F_LIMITS.maxResponseHeaderBytes) { const error = new Error("B2A Docker response headers exceed bound"); finishReject(error); response.destroy(error); return } if (response.statusCode !== 200) { const error = new Error(`B2A Docker read failed with HTTP ${String(response.statusCode ?? "unknown")}`); finishReject(error); response.destroy(error); return } response.on("data", (chunk: Buffer | string) => { const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk); bytes += part.byteLength; if (bytes > maximum) { const error = new Error("B2A Docker response exceeds byte bound"); finishReject(error); response.destroy(error); return } chunks.push(part) }); response.on("end", finishResolve); response.on("aborted", () => finishReject(new Error("B2A Docker response aborted"))); response.on("error", finishReject) })
    const onAbort = () => { const error = new SandboxPrestartBlockedError("B2A Docker read aborted"); finishReject(error); request.destroy(error) }; request.on("error", finishReject); request.setTimeout(KDO_H4_R3F_LIMITS.requestTimeoutMs, () => { const error = new Error("B2A Docker read timed out"); finishReject(error); request.destroy(error) }); signal.addEventListener("abort", onAbort, { once: true }); if (signal.aborted) { onAbort(); return } request.end()
  })
}
async function exactImagePreflight(runtime: TrustedGvisorDockerPrestartOutputRuntime, created: SandboxDormantCreatedAdmission, signal: AbortSignal): Promise<DockerImagePreflight> { const body = await boundedDockerGet(runtime, `/v1.48/images/${encodeURIComponent(created.prepared.sourceReference)}/json`, KDO_H4_R3F_LIMITS.maxImageInspectResponseBytes, signal); const image = parseJsonObject(body, "B2A Docker image inspect"); const imageId = requiredString(image, "Id", "B2A Docker image inspect"); if (!DOCKER_IMAGE_ID.test(imageId)) throw new TypeError("B2A image Id must be exact sha256 image ID"); const descriptor = requiredRecord(image, "Descriptor", "B2A Docker image inspect"); const manifestDigest = requiredString(descriptor, "digest", "B2A Docker image inspect Descriptor"); if (manifestDigest !== created.prepared.sourceDigest) throw new TypeError("B2A image manifest digest drifted from B1"); const config = requiredRecord(image, "Config", "B2A Docker image inspect"); optionalEmptyRecord(config, "Volumes", "B2A Docker image inspect Config"); return Object.freeze({ imageId, manifestDigest, user: optionalString(config, "User", "B2A Docker image inspect Config"), env: optionalStringArray(config, "Env", "B2A Docker image inspect Config"), workingDir: optionalString(config, "WorkingDir", "B2A Docker image inspect Config") }) }
function requireNoHostAuthority(inspect: Record<string, unknown>, config: Record<string, unknown>, hostConfig: Record<string, unknown>): void { requireProtectionPathFloor(hostConfig, "MaskedPaths", DOCKER_API_1_48_MASKED_PATH_FLOOR, "B2A Docker inspect HostConfig"); requireProtectionPathFloor(hostConfig, "ReadonlyPaths", DOCKER_API_1_48_READONLY_PATH_FLOOR, "B2A Docker inspect HostConfig"); for (const key of ["Binds", "Links", "Dns", "DnsOptions", "DnsSearch", "ExtraHosts", "VolumesFrom", "CapAdd", "CapDrop", "GroupAdd", "Devices", "DeviceCgroupRules", "DeviceRequests", "Ulimits", "SecurityOpt", "Mounts"] as const) optionalEmptyArray(hostConfig, key, "B2A Docker inspect HostConfig"); for (const key of ["PortBindings", "StorageOpt", "Tmpfs", "Sysctls"] as const) optionalEmptyRecord(hostConfig, key, "B2A Docker inspect HostConfig"); for (const key of ["PublishAllPorts", "AutoRemove", "ReadonlyRootfs"] as const) optionalFalse(hostConfig, key, "B2A Docker inspect HostConfig"); optionalStringIn(hostConfig, "PidMode", [""], "B2A Docker inspect HostConfig"); optionalStringIn(hostConfig, "IpcMode", ["", "private"], "B2A Docker inspect HostConfig"); optionalStringIn(hostConfig, "UTSMode", [""], "B2A Docker inspect HostConfig"); optionalStringIn(hostConfig, "UsernsMode", [""], "B2A Docker inspect HostConfig"); optionalStringIn(hostConfig, "CgroupnsMode", ["", "private"], "B2A Docker inspect HostConfig"); optionalStringIn(hostConfig, "CgroupParent", [""], "B2A Docker inspect HostConfig"); optionalStringIn(hostConfig, "VolumeDriver", [""], "B2A Docker inspect HostConfig"); optionalFalse(config, "NetworkDisabled", "B2A Docker inspect Config"); optionalEmptyRecord(config, "Volumes", "B2A Docker inspect Config"); const health = config.Healthcheck; if (health !== undefined && health !== null) { const record = asPlainRecord(health, "B2A Docker inspect Config.Healthcheck"); const test = requiredStringArray(record, "Test", "B2A Docker inspect Config.Healthcheck"); if (test.length !== 1 || test[0] !== "NONE") throw new TypeError("B2A Docker healthcheck must remain disabled") } const mounts = inspect.Mounts; if (mounts !== undefined && mounts !== null && (!Array.isArray(mounts) || utilTypes.isProxy(mounts) || Object.getPrototypeOf(mounts) !== Array.prototype || mounts.length !== 0)) throw new TypeError("B2A Docker inspect Mounts must be empty") }
async function revalidatePristineDormant(runtime: TrustedGvisorDockerPrestartOutputRuntime, permit: SandboxAdmissionPermit, created: SandboxDormantCreatedAdmission, signal: AbortSignal): Promise<void> {
  const image = await exactImagePreflight(runtime, created, signal); const body = await boundedDockerGet(runtime, `/v1.48/containers/${created.containerId}/json`, KDO_H4_R3F_LIMITS.maxInspectResponseBytes, signal); const inspect = parseJsonObject(body, "B2A Docker inspect")
  if (!FULL_CONTAINER_ID.test(created.containerId) || requiredString(inspect, "Id", "B2A Docker inspect") !== created.containerId) throw new TypeError("B2A Docker container ID drifted")
  if (requiredString(inspect, "Name", "B2A Docker inspect") !== `/${created.containerName}` || requiredString(inspect, "Image", "B2A Docker inspect") !== image.imageId || requiredString(inspect, "Path", "B2A Docker inspect") !== created.prepared.entrypointExecutable) throw new TypeError("B2A Docker immutable identity drifted")
  const args = requiredStringArray(inspect, "Args", "B2A Docker inspect"); if (!sameStringArray(args, permit.binding.requirement.workload.entrypoint.args)) throw new TypeError("B2A Docker args drifted")
  const state = requiredRecord(inspect, "State", "B2A Docker inspect"); if (requiredString(state, "Status", "B2A Docker inspect State") !== "created" || requiredBoolean(state, "Running", "B2A Docker inspect State") || requiredBoolean(state, "Paused", "B2A Docker inspect State") || requiredBoolean(state, "Restarting", "B2A Docker inspect State") || requiredBoolean(state, "Dead", "B2A Docker inspect State") || requiredInteger(state, "Pid", "B2A Docker inspect State") !== 0 || requiredInteger(inspect, "RestartCount", "B2A Docker inspect") !== 0) throw new TypeError("B2A Docker subject is not pristine dormant")
  const config = requiredRecord(inspect, "Config", "B2A Docker inspect"); if (requiredString(config, "Image", "B2A Docker inspect Config") !== created.prepared.sourceReference) throw new TypeError("B2A Config.Image drifted"); if (optionalString(config, "User", "B2A Docker inspect Config") !== image.user || !sameStringArray(optionalStringArray(config, "Env", "B2A Docker inspect Config"), image.env) || optionalString(config, "WorkingDir", "B2A Docker inspect Config") !== image.workingDir) throw new TypeError("B2A image-derived config drifted"); if (!requiredBoolean(config, "AttachStdout", "B2A Docker inspect Config") || !requiredBoolean(config, "AttachStderr", "B2A Docker inspect Config") || requiredBoolean(config, "AttachStdin", "B2A Docker inspect Config") || requiredBoolean(config, "OpenStdin", "B2A Docker inspect Config") || requiredBoolean(config, "Tty", "B2A Docker inspect Config")) throw new TypeError("B2A Docker attach/TTY configuration is incompatible")
  const labels = requiredRecord(config, "Labels", "B2A Docker inspect Config"); const expectedLabels = { ...created.prepared.labels, [KDO_H4_R4B_B1_LABELS.bindingVersion]: KDO_H4_R3F_BINDING_VERSION }; if (Object.keys(labels).length !== Object.keys(expectedLabels).length) throw new TypeError("B2A Docker labels contain unadmitted keys"); for (const [key, value] of Object.entries(expectedLabels)) if (labels[key] !== value) throw new TypeError(`B2A Docker label drift: ${key}`)
  const host = requiredRecord(inspect, "HostConfig", "B2A Docker inspect"); if (requiredString(host, "Runtime", "B2A Docker inspect HostConfig") !== "runsc" || requiredString(host, "NetworkMode", "B2A Docker inspect HostConfig") !== "none" || requiredBoolean(host, "Privileged", "B2A Docker inspect HostConfig")) throw new TypeError("B2A Docker runtime/network/privilege drifted"); if (requiredInteger(host, "NanoCpus", "B2A Docker inspect HostConfig") !== created.prepared.nanoCpus || requiredInteger(host, "Memory", "B2A Docker inspect HostConfig") !== created.prepared.memoryBytes || requiredInteger(host, "MemorySwap", "B2A Docker inspect HostConfig") !== created.prepared.memorySwapBytes) throw new TypeError("B2A Docker resource policy drifted"); const restart = requiredRecord(host, "RestartPolicy", "B2A Docker inspect HostConfig"); if (requiredString(restart, "Name", "B2A Docker inspect RestartPolicy") !== "no" || requiredInteger(restart, "MaximumRetryCount", "B2A Docker inspect RestartPolicy") !== 0) throw new TypeError("B2A Docker restart policy drifted"); requireNoHostAuthority(inspect, config, host)
  const networks = requiredRecord(requiredRecord(inspect, "NetworkSettings", "B2A Docker inspect"), "Networks", "B2A Docker inspect NetworkSettings"); const keys = Object.keys(networks); if (keys.some((key) => key !== "none") || keys.length > 1) throw new TypeError("B2A Docker network attachments drifted"); if (keys.length === 1) requiredRecord(networks, "none", "B2A Docker inspect Networks")
}

function validatePreparationSettlement(value: unknown, prepared: SandboxPrestartPrepared, preparedCommit: SandboxPrestartPreparedCommit, created: SandboxDormantCreatedAdmission, createdCommit: unknown, permit: SandboxAdmissionPermit): { readonly kind: PreparationSettlementKind; readonly disposition: "created" | "existing"; readonly fence: SandboxPrestartStateFence } {
  const record = asPlainRecord(value, "B2A preparation transaction result"); exactKeys(record, ["disposition", "prepared", "preparedCommit", "fence"], "B2A preparation transaction result"); if (record.disposition !== "created" && record.disposition !== "existing") throw new TypeError("B2A preparation disposition must be created or existing")
  const observedPrepared = validateSandboxPrestartPrepared(record.prepared, created, createdCommit, permit); if (observedPrepared.prestartOutputOperationIdentity !== prepared.prestartOutputOperationIdentity) throw new TypeError("B2A transaction prepared identity mismatch"); const observedCommit = validateSandboxPrestartPreparedCommit(record.preparedCommit, prepared); if (observedCommit.commitIdentity !== preparedCommit.commitIdentity) throw new TypeError("B2A transaction prepared commit mismatch"); const fence = validateSandboxPrestartStateFence(record.fence, prepared)
  if (record.disposition === "created" && fence.state !== "PREPARED") throw new TypeError("B2A created preparation transaction must establish PREPARED")
  const kind: PreparationSettlementKind = fence.state === "PREPARED" ? "prepared" : fence.state === "OWNER_CLAIMED" ? "owner-claimed-unavailable" : "failed-terminal"
  return Object.freeze({ kind, disposition: record.disposition, fence })
}
function validateClaimSettlement(value: unknown, prepared: SandboxPrestartPrepared, claim: SandboxPrestartOwnershipClaim, claimCommit: SandboxPrestartOwnershipClaimCommit): { readonly kind: "created" | "owner-claimed-unavailable" | "failed-terminal"; readonly fence: SandboxPrestartStateFence } {
  const record = asPlainRecord(value, "B2A claim transaction result"); exactKeys(record, ["kind", "claim", "claimCommit", "fence"], "B2A claim transaction result"); if (record.kind !== "created" && record.kind !== "owner-claimed-unavailable" && record.kind !== "failed-terminal") throw new TypeError("B2A claim settlement kind is invalid"); const fence = validateSandboxPrestartStateFence(record.fence, prepared)
  if (record.kind === "created") { const observedClaim = validateSandboxPrestartOwnershipClaim(record.claim, prepared); const observedCommit = validateSandboxPrestartOwnershipClaimCommit(record.claimCommit, claim); if (observedClaim.ownershipClaimIdentity !== claim.ownershipClaimIdentity || observedCommit.commitIdentity !== claimCommit.commitIdentity || fence.state !== "OWNER_CLAIMED" || fence.ownershipClaimIdentity !== claim.ownershipClaimIdentity || fence.ownerInstanceIdentity !== claim.ownerInstanceIdentity) throw new TypeError("B2A created claim settlement mismatch") }
  else { if (record.claim !== null || record.claimCommit !== null) throw new TypeError("B2A non-created claim settlement cannot carry a new claim write"); if (record.kind === "owner-claimed-unavailable" && fence.state !== "OWNER_CLAIMED") throw new TypeError("B2A unavailable claim settlement requires OWNER_CLAIMED"); if (record.kind === "failed-terminal" && fence.state !== "FAILED_TERMINAL") throw new TypeError("B2A failed claim settlement requires FAILED_TERMINAL") }
  return Object.freeze({ kind: record.kind, fence })
}
async function boundedDurableOperation<T>(label: string, operation: (signal: AbortSignal) => Promise<T> | T, parentSignal?: AbortSignal): Promise<T> {
  const timeoutSignal = AbortSignal.timeout(B2A_DURABLE_OPERATION_TIMEOUT_MS)
  const operationSignal = parentSignal === undefined ? timeoutSignal : AbortSignal.any([parentSignal, timeoutSignal])
  let onTimeout: (() => void) | undefined
  const boundary = new Promise<never>((_resolve, reject) => {
    onTimeout = () => reject(new SandboxPrestartIndeterminateError(`${label} timed out with uncertain durable outcome`))
    timeoutSignal.addEventListener("abort", onTimeout, { once: true })
    if (timeoutSignal.aborted) onTimeout()
  })
  try {
    const result = await Promise.race([Promise.resolve().then(() => operation(operationSignal)), boundary])
    if (timeoutSignal.aborted) throw new SandboxPrestartIndeterminateError(`${label} timed out with uncertain durable outcome`)
    return result
  } catch (error) {
    throw indeterminate(error, label)
  } finally {
    if (onTimeout !== undefined) timeoutSignal.removeEventListener("abort", onTimeout)
  }
}
async function exactFence(runtime: TrustedGvisorDockerPrestartOutputRuntime, prepared: SandboxPrestartPrepared, parentSignal?: AbortSignal): Promise<SandboxPrestartStateFence> {
  const raw = await boundedDurableOperation("B2A durable state fence read", (signal) => runtime.readStateFence(prepared.prestartOutputOperationIdentity, { signal }), parentSignal)
  try { return validateSandboxPrestartStateFence(raw, prepared) } catch (error) { throw new SandboxPrestartIndeterminateError(`B2A durable state fence is unreadable or uncertain: ${error instanceof Error ? error.message : String(error)}`) }
}
async function commitTerminalFailure(runtime: TrustedGvisorDockerPrestartOutputRuntime, prepared: SandboxPrestartPrepared, expectedFence: SandboxPrestartStateFence, claim: SandboxPrestartOwnershipClaim | null, owner: SandboxPrestartOwnerCapability | null, phase: SandboxPrestartFailurePhase, code: SandboxPrestartFailureCode): Promise<void> {
  const failure = createSandboxPrestartFailure(prepared, phase, code, owner); const failureCommit = createSandboxPrestartFailureCommit(failure, "created"); const nextFence = createSandboxPrestartFailedFence(prepared, failure, claim)
  const raw = await boundedDurableOperation("B2A failure settlement", (signal) => runtime.commitFailureTransaction({ failure, failureCommit, expectedFence, nextFence }, { signal }))
  let record: Record<string, unknown>
  try { record = asPlainRecord(raw, "B2A failure transaction result") } catch (error) { throw indeterminate(error, "B2A failure settlement is indeterminate") }
  exactKeys(record, ["disposition", "failure", "failureCommit", "fence"], "B2A failure transaction result"); if (record.disposition !== "created" && record.disposition !== "existing") throw new SandboxPrestartIndeterminateError("B2A failure settlement disposition is invalid"); const observedFailure = validateSandboxPrestartFailure(record.failure, prepared); const observedCommit = validateSandboxPrestartFailureCommit(record.failureCommit, failure); const fence = validateSandboxPrestartStateFence(record.fence, prepared); if (observedFailure.failureIdentity !== failure.failureIdentity || observedCommit.failureIdentity !== failure.failureIdentity || fence.state !== "FAILED_TERMINAL" || fence.failureIdentity !== failure.failureIdentity || fence.fenceIdentity !== nextFence.fenceIdentity) throw new SandboxPrestartIndeterminateError("B2A failure settlement does not prove the exact terminal identity")
}
async function fail(runtime: TrustedGvisorDockerPrestartOutputRuntime, prepared: SandboxPrestartPrepared, expectedFence: SandboxPrestartStateFence, claim: SandboxPrestartOwnershipClaim | null, owner: SandboxPrestartOwnerCapability | null, phase: SandboxPrestartFailurePhase, code: SandboxPrestartFailureCode): Promise<never> { await commitTerminalFailure(runtime, prepared, expectedFence, claim, owner, phase, code); throw new SandboxPrestartTerminalError(`B2A settled terminal failure: ${code}`) }
function classifyHostFailure(error: unknown): SandboxPrestartFailureCode { return error instanceof SandboxPrestartClientUnauthorizedError ? "socket-client-unauthorized" : "socket-namespace-untrusted" }
function classifyAttachFailure(error: unknown, controller: AbortController, ownerStartedAt: number): SandboxPrestartFailureCode {
  if (error instanceof InternalGvisorAttachError) {
    if (error.kind === "timeout") return "attach-timeout"
    if (error.kind === "protocol-invalid") return "attach-protocol-invalid"
    if (error.kind === "socket-identity-changed") return "socket-identity-changed"
    if (error.kind === "aborted") return performance.now() - ownerStartedAt >= KDO_H4_R4B_B2A_RUNTIME_LIMITS.ownerToReadyTimeoutMs ? "prestart-total-timeout" : "aborted"
  }
  if (controller.signal.aborted) return performance.now() - ownerStartedAt >= KDO_H4_R4B_B2A_RUNTIME_LIMITS.ownerToReadyTimeoutMs ? "prestart-total-timeout" : "aborted"
  return "attach-failed"
}
function createReadiness(binding: ReadinessBinding): SandboxPrestartReadyCapability { const readiness = Object.freeze({ version: KDO_H4_R4B_B2A_PRESTART_READY_VERSION }); readinessBindings.set(readiness, binding); return readiness }
function linkedPhaseController(parent: AbortSignal, timeoutMs: number): { readonly signal: AbortSignal; cleanup(): void; timedOut(): boolean } { const controller = new AbortController(); let timeoutWon = false; const onAbort = () => controller.abort(); parent.addEventListener("abort", onAbort, { once: true }); if (parent.aborted) controller.abort(); const timer = setTimeout(() => { timeoutWon = true; controller.abort() }, timeoutMs); return Object.freeze({ signal: controller.signal, cleanup: () => { clearTimeout(timer); parent.removeEventListener("abort", onAbort) }, timedOut: () => timeoutWon }) }
async function settleReadinessTerminalFailure(binding: ReadinessBinding, phase: SandboxPrestartFailurePhase, code: SandboxPrestartFailureCode): Promise<void> {
  const fence = await exactFence(binding.runtime, binding.prepared)
  if (fence.state === "FAILED_TERMINAL") return
  if (fence.state !== "OWNER_CLAIMED" || fence.ownershipClaimIdentity !== binding.claim.ownershipClaimIdentity || fence.ownerInstanceIdentity !== sandboxPrestartOwnerInstanceIdentity(binding.ownerCapability)) throw new SandboxPrestartIndeterminateError("B2A readiness terminalization cannot prove exact durable owner")
  await commitTerminalFailure(binding.runtime, binding.prepared, fence, binding.claim, binding.ownerCapability, phase, code)
}
function startReadinessTerminalization(readiness: object, binding: ReadinessBinding, phase: SandboxPrestartFailurePhase, code: SandboxPrestartFailureCode): Promise<void> {
  const state = binding.terminalization
  if (state.phase === null || state.code === null) { state.phase = phase; state.code = code }
  if (state.promise !== null) return state.promise
  state.error = null
  const attempt = settleReadinessTerminalFailure(binding, state.phase, state.code)
  const tracked = attempt.then(
    () => { state.error = null; readinessBindings.delete(readiness) },
    (error: unknown) => { const observed = indeterminate(error, "B2A readiness terminalization is indeterminate"); state.error = observed; state.promise = null; throw observed },
  )
  state.promise = tracked
  return tracked
}

export class GvisorDockerPrestartOutputGateway {
  readonly #runtime: TrustedGvisorDockerPrestartOutputRuntime
  constructor(runtime: unknown) { this.#runtime = requireTrustedRuntime(runtime) }

  async preparePrestartOutput(permitValue: unknown, createdValue: unknown, createdCommitValue: unknown, options: { readonly signal?: AbortSignal } = {}): Promise<SandboxPrestartPreparationResult> {
    const permit = validateSandboxAdmissionPermit(permitValue); const created = validateSandboxDormantCreatedAdmission(createdValue, permit); const createdCommit = validateSandboxDormantCreatedAdmissionCommit(createdCommitValue, created, permit); const requirement = validateSandboxExecutionRequirement(permit.binding.requirement); const controller = new AbortController(); let userAbort: (() => void) | undefined
    if (options.signal !== undefined) { userAbort = () => controller.abort(); options.signal.addEventListener("abort", userAbort, { once: true }); if (options.signal.aborted) controller.abort() }
    let reader: InternalGvisorPrestartMultiplexReader | undefined; let absoluteTimer: NodeJS.Timeout | undefined; let readinessRef: SandboxPrestartReadyCapability | undefined
    try {
      if (controller.signal.aborted) throw new SandboxPrestartBlockedError("B2A admission aborted before dormant revalidation")
      let preReadGate: HostTrustSnapshot
      try { preReadGate = snapshotHostTrust(this.#runtime) } catch (error) { throw new SandboxPrestartBlockedError(`B2A pre-I/O host trust rejected: ${error instanceof Error ? error.message : String(error)}`) }
      if (preReadGate.socketEndpoint.endpointIdentity !== created.observation.socketEndpointIdentity) throw new SandboxPrestartBlockedError("B2A protected Docker socket does not match exact B1 observation before Docker read")
      try { await revalidatePristineDormant(this.#runtime, permit, created, controller.signal) } catch (error) { throw new SandboxPrestartBlockedError(`B2A initial pristine-dormant revalidation failed: ${error instanceof Error ? error.message : String(error)}`) }
      let gateA: HostTrustSnapshot
      try { gateA = snapshotHostTrust(this.#runtime) } catch (error) { throw new SandboxPrestartBlockedError(`B2A initial host trust rejected: ${error instanceof Error ? error.message : String(error)}`) }
      if (!sameHostTrust(preReadGate, gateA)) throw new SandboxPrestartBlockedError("B2A protected Docker socket namespace changed during initial pristine-dormant revalidation")
      if (gateA.socketEndpoint.endpointIdentity !== created.observation.socketEndpointIdentity) throw new SandboxPrestartBlockedError("B2A protected Docker socket does not match exact B1 observation")
      let provider
      try { provider = createDockerControlPlaneBindingProvider({ socketPath: this.#runtime.socketPath, requirement }) } catch (error) { throw new SandboxPrestartBlockedError(`B2A canonical provider rejected: ${error instanceof Error ? error.message : String(error)}`) }
      if (provider.socketEndpoint.endpointIdentity !== gateA.socketEndpoint.endpointIdentity) throw new SandboxPrestartBlockedError("B2A canonical provider socket endpoint mismatch")
      const prepared = createSandboxPrestartPrepared({ createdAdmission: created, createdAdmissionCommit: createdCommit, permit, providerIdentity: provider.providerIdentity, socketEndpointIdentity: gateA.socketEndpoint.endpointIdentity }); const preparedCommit = createSandboxPrestartPreparedCommit(prepared); const preparedFence = createSandboxPrestartPreparedFence(prepared)
      let preparationRaw: unknown
      try { preparationRaw = await boundedDurableOperation("B2A preparation transaction", (signal) => this.#runtime.commitPreparationTransaction({ prepared, preparedCommit, fence: preparedFence }, { signal }), controller.signal) } catch (error) { throw new SandboxPrestartIndeterminateError(`B2A preparation transaction is indeterminate: ${error instanceof Error ? error.message : String(error)}`) }
      let preparation
      try { preparation = validatePreparationSettlement(preparationRaw, prepared, preparedCommit, created, createdCommit, permit) } catch (error) { throw new SandboxPrestartIndeterminateError(`B2A preparation state is indeterminate: ${error instanceof Error ? error.message : String(error)}`) }
      if (preparation.kind === "owner-claimed-unavailable") return Object.freeze({ status: "OWNER_CLAIMED_UNAVAILABLE", classification: "INDETERMINATE", reusable: false })
      if (preparation.kind === "failed-terminal") throw new SandboxPrestartTerminalError("B2A operation is already FAILED_TERMINAL")
      if (controller.signal.aborted) return await fail(this.#runtime, prepared, preparation.fence, null, null, "prepare", "aborted")
      let gateAfterPreparation: HostTrustSnapshot
      try { gateAfterPreparation = snapshotHostTrust(this.#runtime) } catch (error) { return await fail(this.#runtime, prepared, preparation.fence, null, null, "prepare", classifyHostFailure(error)) }
      if (!sameHostTrust(gateA, gateAfterPreparation)) return await fail(this.#runtime, prepared, preparation.fence, null, null, "prepare", "socket-identity-changed")

      const ownerCapability = createSandboxPrestartOwnerCapability(); const claim = createSandboxPrestartOwnershipClaim(prepared, ownerCapability); const claimCommit = createSandboxPrestartOwnershipClaimCommit(claim); const ownerFence = createSandboxPrestartOwnerClaimedFence(prepared, claim); let claimRaw: unknown
      try { claimRaw = await boundedDurableOperation("B2A owner claim transaction", (signal) => this.#runtime.commitOwnershipClaimTransaction({ claim, claimCommit, expectedFence: preparation.fence, nextFence: ownerFence }, { signal }), controller.signal) } catch (error) { throw new SandboxPrestartIndeterminateError(`B2A owner claim transaction is indeterminate: ${error instanceof Error ? error.message : String(error)}`) }
      let claimSettlement
      try { claimSettlement = validateClaimSettlement(claimRaw, prepared, claim, claimCommit) } catch (error) { throw new SandboxPrestartIndeterminateError(`B2A owner claim settlement is indeterminate: ${error instanceof Error ? error.message : String(error)}`) }
      if (claimSettlement.kind === "owner-claimed-unavailable") return Object.freeze({ status: "OWNER_CLAIMED_UNAVAILABLE", classification: "INDETERMINATE", reusable: false })
      if (claimSettlement.kind === "failed-terminal") throw new SandboxPrestartTerminalError("B2A operation became FAILED_TERMINAL before owner claim")

      const ownerStartedAt = performance.now(); let localState: "OWNER_CLAIMED_LOCAL" | "ATTACHING" | "READER_ACTIVE" | "PRESTART_READY" | "INVALIDATED" = "OWNER_CLAIMED_LOCAL"
      absoluteTimer = setTimeout(() => { if (localState !== "PRESTART_READY" && localState !== "INVALIDATED") { localState = "INVALIDATED"; controller.abort(); reader?.destroy(new Error("B2A owner-to-ready deadline expired")) } }, KDO_H4_R4B_B2A_RUNTIME_LIMITS.ownerToReadyTimeoutMs)
      if (controller.signal.aborted) return await fail(this.#runtime, prepared, ownerFence, claim, ownerCapability, "owner-claim", "aborted")
      let preAttachFence: SandboxPrestartStateFence
      try { preAttachFence = await exactFence(this.#runtime, prepared, controller.signal) } catch (error) { if (controller.signal.aborted) return await fail(this.#runtime, prepared, ownerFence, claim, ownerCapability, "owner-claim", performance.now() - ownerStartedAt >= KDO_H4_R4B_B2A_RUNTIME_LIMITS.ownerToReadyTimeoutMs ? "prestart-total-timeout" : "aborted"); throw error }
      if (preAttachFence.state === "FAILED_TERMINAL") throw new SandboxPrestartTerminalError("B2A operation became terminal before attach"); if (preAttachFence.state !== "OWNER_CLAIMED" || preAttachFence.ownershipClaimIdentity !== claim.ownershipClaimIdentity || preAttachFence.ownerInstanceIdentity !== claim.ownerInstanceIdentity) throw new SandboxPrestartIndeterminateError("B2A durable owner changed before attach")
      try { await revalidatePristineDormant(this.#runtime, permit, created, controller.signal) } catch { return await fail(this.#runtime, prepared, ownerFence, claim, ownerCapability, "attaching", controller.signal.aborted ? (performance.now() - ownerStartedAt >= KDO_H4_R4B_B2A_RUNTIME_LIMITS.ownerToReadyTimeoutMs ? "prestart-total-timeout" : "aborted") : "dormant-revalidation-failed") }
      let gateB: HostTrustSnapshot; try { gateB = snapshotHostTrust(this.#runtime) } catch (error) { return await fail(this.#runtime, prepared, ownerFence, claim, ownerCapability, "attaching", classifyHostFailure(error)) }; if (!sameHostTrust(gateA, gateB)) return await fail(this.#runtime, prepared, ownerFence, claim, ownerCapability, "attaching", "socket-identity-changed")
      if (controller.signal.aborted || localState !== "OWNER_CLAIMED_LOCAL") return await fail(this.#runtime, prepared, ownerFence, claim, ownerCapability, "attaching", performance.now() - ownerStartedAt >= KDO_H4_R4B_B2A_RUNTIME_LIMITS.ownerToReadyTimeoutMs ? "prestart-total-timeout" : "aborted"); if (performance.now() - ownerStartedAt >= KDO_H4_R4B_B2A_RUNTIME_LIMITS.ownerToReadyTimeoutMs) return await fail(this.#runtime, prepared, ownerFence, claim, ownerCapability, "attaching", "prestart-total-timeout")
      localState = "ATTACHING"
      let channel: Awaited<ReturnType<typeof openExactGvisorDockerAttach>>
      try { channel = await openExactGvisorDockerAttach({ socketPath: this.#runtime.socketPath, endpoint: gateA.socketEndpoint, containerId: created.containerId, signal: controller.signal, timeoutMs: KDO_H4_R4B_B2A_RUNTIME_LIMITS.attachUpgradeTimeoutMs, requireSameSocketEndpoint: () => { const current = snapshotHostTrust(this.#runtime); if (!sameHostTrust(gateA, current)) throw new SandboxPrestartBlockedError("B2A Docker socket namespace identity changed") } }) }
      catch (error) { return await fail(this.#runtime, prepared, ownerFence, claim, ownerCapability, "upgrade-validation", classifyAttachFailure(error, controller, ownerStartedAt)) }
      if (controller.signal.aborted || localState !== "ATTACHING") { channel.socket.destroy(); return await fail(this.#runtime, prepared, ownerFence, claim, ownerCapability, "reader-activation", "aborted") }
      let gateC: HostTrustSnapshot; try { gateC = snapshotHostTrust(this.#runtime) } catch (error) { channel.socket.destroy(); return await fail(this.#runtime, prepared, ownerFence, claim, ownerCapability, "reader-activation", classifyHostFailure(error)) }; if (!sameHostTrust(gateA, gateC)) { channel.socket.destroy(); return await fail(this.#runtime, prepared, ownerFence, claim, ownerCapability, "reader-activation", "socket-identity-changed") }
      const upgradeAcceptedAt = performance.now(); let readerFailure: SandboxPrestartFailureCode | undefined
      reader = new InternalGvisorPrestartMultiplexReader({ socket: channel.socket, head: channel.head, maxOutputBytes: requirement.workload.resourcePolicy.maxOutputBytes, onFailure: (reason) => { if (localState === "INVALIDATED") return; const wasReady = localState === "PRESTART_READY"; localState = "INVALIDATED"; controller.abort(); readerFailure = reason; if (wasReady && readinessRef !== undefined) { const readiness = readinessRef; const binding = readinessBindings.get(readiness); if (binding !== undefined) { void startReadinessTerminalization(readiness, binding, "ready-invalidation", reason).catch((error: unknown) => { const current = readinessBindings.get(readiness); if (current !== undefined) current.terminalization.error = indeterminate(error, "B2A asynchronous readiness terminalization is indeterminate") }) } } } })
      if (performance.now() - upgradeAcceptedAt > KDO_H4_R4B_B2A_RUNTIME_LIMITS.readerActivationTimeoutMs) { reader.destroy(); return await fail(this.#runtime, prepared, ownerFence, claim, ownerCapability, "reader-activation", "reader-activation-timeout") }
      if (readerFailure !== undefined || controller.signal.aborted) return await fail(this.#runtime, prepared, ownerFence, claim, ownerCapability, "reader-activation", readerFailure ?? "aborted")
      try { reader.assertReadyForPrestart() } catch { reader.destroy(); return await fail(this.#runtime, prepared, ownerFence, claim, ownerCapability, "reader-activation", "reader-failed") }
      localState = "READER_ACTIVE"
      const phase = linkedPhaseController(controller.signal, KDO_H4_R4B_B2A_RUNTIME_LIMITS.dormantRevalidationTimeoutMs)
      try { await revalidatePristineDormant(this.#runtime, permit, created, phase.signal) } catch { reader.destroy(); return await fail(this.#runtime, prepared, ownerFence, claim, ownerCapability, "post-attach-revalidation", phase.timedOut() ? "dormant-revalidation-timeout" : controller.signal.aborted ? (performance.now() - ownerStartedAt >= KDO_H4_R4B_B2A_RUNTIME_LIMITS.ownerToReadyTimeoutMs ? "prestart-total-timeout" : "aborted") : "dormant-revalidation-failed") } finally { phase.cleanup() }
      let gateD: HostTrustSnapshot; try { gateD = snapshotHostTrust(this.#runtime) } catch (error) { reader.destroy(); return await fail(this.#runtime, prepared, ownerFence, claim, ownerCapability, "ready-invalidation", classifyHostFailure(error)) }; if (!sameHostTrust(gateA, gateD)) { reader.destroy(); return await fail(this.#runtime, prepared, ownerFence, claim, ownerCapability, "ready-invalidation", "socket-identity-changed") }
      let finalFence: SandboxPrestartStateFence
      try { finalFence = await exactFence(this.#runtime, prepared, controller.signal) } catch (error) { if (controller.signal.aborted || readerFailure !== undefined) { reader.destroy(); return await fail(this.#runtime, prepared, ownerFence, claim, ownerCapability, "ready-invalidation", performance.now() - ownerStartedAt >= KDO_H4_R4B_B2A_RUNTIME_LIMITS.ownerToReadyTimeoutMs ? "prestart-total-timeout" : readerFailure ?? "aborted") } reader.destroy(); throw error }
      if (finalFence.state === "FAILED_TERMINAL") { reader.destroy(); throw new SandboxPrestartTerminalError("B2A operation became terminal before readiness") } if (finalFence.state !== "OWNER_CLAIMED" || finalFence.ownershipClaimIdentity !== claim.ownershipClaimIdentity || finalFence.ownerInstanceIdentity !== claim.ownerInstanceIdentity) { reader.destroy(); throw new SandboxPrestartIndeterminateError("B2A exact durable owner cannot be proven before readiness") }
      if (controller.signal.aborted || localState !== "READER_ACTIVE") { reader.destroy(); return await fail(this.#runtime, prepared, ownerFence, claim, ownerCapability, "ready-invalidation", performance.now() - ownerStartedAt >= KDO_H4_R4B_B2A_RUNTIME_LIMITS.ownerToReadyTimeoutMs ? "prestart-total-timeout" : readerFailure ?? "aborted") } if (performance.now() - ownerStartedAt >= KDO_H4_R4B_B2A_RUNTIME_LIMITS.ownerToReadyTimeoutMs) { reader.destroy(); return await fail(this.#runtime, prepared, ownerFence, claim, ownerCapability, "ready-invalidation", "prestart-total-timeout") }
      try { reader.assertReadyForPrestart() } catch { reader.destroy(); return await fail(this.#runtime, prepared, ownerFence, claim, ownerCapability, "ready-invalidation", "reader-failed") }
      localState = "PRESTART_READY"; if (absoluteTimer !== undefined) { clearTimeout(absoluteTimer); absoluteTimer = undefined }; const terminalization: ReadinessTerminalizationState = { phase: null, code: null, promise: null, error: null }; const readiness = createReadiness({ prepared, claim, ownerCapability, reader, controller, runtime: this.#runtime, terminalization }); readinessRef = readiness; return Object.freeze({ status: "PRESTART_READY", prepared, preparedCommit, ownershipClaim: claim, ownershipClaimCommit: claimCommit, readiness })
    } finally { if (userAbort !== undefined) options.signal?.removeEventListener("abort", userAbort); if (absoluteTimer !== undefined) clearTimeout(absoluteTimer); if (readinessRef === undefined) reader?.destroy(new Error("B2A prestart preparation did not reach readiness")) }
  }

  async invalidatePrestartOutput(readinessValue: unknown): Promise<void> {
    if (readinessValue === null || typeof readinessValue !== "object" || utilTypes.isProxy(readinessValue)) throw new TypeError("B2A readiness capability is not trusted")
    const binding = readinessBindings.get(readinessValue); if (binding === undefined || binding.runtime !== this.#runtime) throw new TypeError("B2A readiness capability is not trusted by this gateway")
    binding.controller.abort(); binding.reader.destroy(new Error("B2A readiness invalidated by exact owner"))
    try { await startReadinessTerminalization(readinessValue, binding, "ready-invalidation", "owner-lost-graceful") } catch (error) { throw indeterminate(error, "B2A graceful invalidation remains retryable but durably indeterminate") }
  }
}
