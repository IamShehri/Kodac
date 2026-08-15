import { createHash } from "node:crypto"
import { posix } from "node:path"
import { types as utilTypes } from "node:util"

export const KDO_H4_R3D_GVISOR_OBSERVER_PLAN_VERSION = "kodac-h4-r3d-gvisor-observer-plan-v1" as const
export const KDO_H4_R3D_GVISOR_STATE_VERSION = "kodac-h4-r3d-gvisor-state-v1" as const
export const KDO_H4_R3D_GVISOR_STATS_VERSION = "kodac-h4-r3d-gvisor-stats-v1" as const
export const KDO_H4_R3D_GVISOR_PROCESS_VERSION = "kodac-h4-r3d-gvisor-process-v1" as const
export const KDO_H4_R3D_GVISOR_CANDIDATE_VERSION = "kodac-h4-r3d-gvisor-runtime-candidate-v1" as const
export const KDO_H4_R3D_GVISOR_RUNTIME_CLASS = "gvisor" as const
export const KDO_H4_R3D_EVIDENCE_CLASS = "e3-candidate" as const
export const KDO_H4_R3D_RUNSC_ARTIFACT_FD = 3 as const
export const KDO_H4_R3D_NATIVE_FAILURE_EXIT = 125 as const

export const KDO_H4_R3D_LIMITS = Object.freeze({
  maxPathBytes: 4096,
  maxOciVersionBytes: 64,
  maxStateBytes: 65536,
  maxStatsBytes: 262144,
  maxProcessRecordBytes: 512,
  maxAnnotations: 128,
  maxAnnotationBytes: 2048,
  maxJsonDepth: 64,
  maxStatsDepth: 32,
  maxStatsNodes: 8192,
  maxStatsObjectKeys: 1024,
  maxStatsArrayItems: 4096,
  maxStatsStringBytes: 8192,
})

export interface GvisorObserverPlan {
  version: typeof KDO_H4_R3D_GVISOR_OBSERVER_PLAN_VERSION
  runscPath: string
  expectedRunscSha256: string
  runtimeRoot: string
  containerId: string
  planIdentity: string
}

export interface GvisorStateObservation {
  version: typeof KDO_H4_R3D_GVISOR_STATE_VERSION
  ociVersion: string
  containerId: string
  status: "running"
  pid: number
  bundle: string
  annotations: Readonly<Record<string, string>>
  stateIdentity: string
}

export interface GvisorStatsObservation {
  version: typeof KDO_H4_R3D_GVISOR_STATS_VERSION
  containerId: string
  eventType: "stats"
  statsIdentity: string
}

export interface GvisorProcessObservation {
  version: typeof KDO_H4_R3D_GVISOR_PROCESS_VERSION
  pid: number
  startTicks: string
  exeDev: string
  exeIno: string
  exeSize: string
  processIdentity: string
}

export interface GvisorRuntimeObservationCandidate {
  version: typeof KDO_H4_R3D_GVISOR_CANDIDATE_VERSION
  runtimeClass: typeof KDO_H4_R3D_GVISOR_RUNTIME_CLASS
  evidenceClass: typeof KDO_H4_R3D_EVIDENCE_CLASS
  planIdentity: string
  stateIdentity: string
  statsIdentity: string
  processIdentity: string
  candidateIdentity: string
}

const MAX_UINT64 = 18446744073709551615n
const MAX_PID = 2147483647

function byteLength(value: string): number {
  return Buffer.byteLength(value, "utf8")
}

function sha256Domain(domain: string, value: string): string {
  return createHash("sha256").update(domain, "utf8").update("\0", "utf8").update(value, "utf8").digest("hex")
}

function asPlainRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value) || utilTypes.isProxy(value)) {
    throw new TypeError(`${label} must be a non-proxy plain object`)
  }
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain object`)
  if (Object.getOwnPropertySymbols(value).length !== 0) throw new TypeError(`${label} must not contain symbol fields`)
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (descriptor.get !== undefined || descriptor.set !== undefined) throw new TypeError(`${label}.${key} must be a data property`)
    if (!descriptor.enumerable) throw new TypeError(`${label}.${key} must be enumerable`)
  }
  return value as Record<string, unknown>
}

function exactKeys(record: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(record).sort()
  const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new TypeError(`${label} must contain exactly: ${wanted.join(", ")}`)
  }
}

function boundedString(value: unknown, label: string, maxBytes: number, allowEmpty = false): string {
  if (typeof value !== "string" || (!allowEmpty && value.length === 0)) {
    throw new TypeError(`${label} must be ${allowEmpty ? "a string" : "a non-empty string"}`)
  }
  if (value.includes("\0")) throw new TypeError(`${label} must not contain NUL`)
  if (byteLength(value) > maxBytes) throw new TypeError(`${label} exceeds ${maxBytes} UTF-8 bytes`)
  return value
}

function absoluteCanonicalPath(value: unknown, label: string): string {
  const path = boundedString(value, label, KDO_H4_R3D_LIMITS.maxPathBytes)
  if (!posix.isAbsolute(path)) throw new TypeError(`${label} must be an absolute POSIX path`)
  if (path.length > 1 && path.endsWith("/")) throw new TypeError(`${label} must not contain a trailing slash`)
  if (posix.normalize(path) !== path) throw new TypeError(`${label} must be canonical`)
  return path
}

function fullContainerId(value: unknown, label = "containerId"): string {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/.test(value)) {
    throw new TypeError(`${label} must be exactly 64 lowercase hexadecimal characters`)
  }
  return value
}

function sha256Hex(value: unknown, label: string): string {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/.test(value)) throw new TypeError(`${label} must be 64 lowercase hexadecimal characters`)
  return value
}

function requireIdentity(value: unknown, label: string): string {
  return sha256Hex(value, label)
}

function printableAscii(value: unknown, label: string, maxBytes: number): string {
  const text = boundedString(value, label, maxBytes)
  if (!/^[\x20-\x7e]+$/.test(text)) throw new TypeError(`${label} must contain printable ASCII only`)
  return text
}

function parsePositivePid(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0 || value > MAX_PID) {
    throw new TypeError(`${label} must be a positive safe Linux pid`)
  }
  return value
}

function canonicalUint64Decimal(value: string, label: string, allowZero: boolean): string {
  const pattern = allowZero ? /^(?:0|[1-9][0-9]*)$/ : /^[1-9][0-9]*$/
  if (!pattern.test(value)) throw new TypeError(`${label} must be canonical unsigned decimal`)
  let parsed: bigint
  try { parsed = BigInt(value) } catch { throw new TypeError(`${label} is not a valid uint64`) }
  if (parsed > MAX_UINT64) throw new TypeError(`${label} exceeds uint64`)
  return value
}

function validateJsonSyntaxNoDuplicateKeys(text: string, label: string): void {
  let index = 0
  const length = text.length
  const isWhitespace = (char: string) => char === " " || char === "\t" || char === "\r" || char === "\n"
  const skipWhitespace = () => { while (index < length && isWhitespace(text[index] ?? "")) index += 1 }

  const parseStringToken = (): string => {
    if (text[index] !== '"') throw new TypeError(`${label} contains invalid JSON string syntax`)
    const start = index
    index += 1
    while (index < length) {
      const char = text[index] ?? ""
      if (char === '"') {
        index += 1
        try { return JSON.parse(text.slice(start, index)) as string }
        catch { throw new TypeError(`${label} contains invalid JSON string syntax`) }
      }
      if (char === "\\") {
        index += 1
        if (index >= length) throw new TypeError(`${label} contains an unterminated JSON escape`)
        if (text[index] === "u") index += 4
      } else if (char.charCodeAt(0) < 0x20) {
        throw new TypeError(`${label} contains an unescaped JSON control character`)
      }
      index += 1
    }
    throw new TypeError(`${label} contains an unterminated JSON string`)
  }

  const parseValue = (depth: number): void => {
    if (depth > KDO_H4_R3D_LIMITS.maxJsonDepth) throw new TypeError(`${label} exceeds JSON nesting depth`)
    skipWhitespace()
    const char = text[index]
    if (char === "{") {
      index += 1
      skipWhitespace()
      const keys = new Set<string>()
      if (text[index] === "}") { index += 1; return }
      for (;;) {
        skipWhitespace()
        const key = parseStringToken()
        if (keys.has(key)) throw new TypeError(`${label} contains duplicate JSON object key: ${key}`)
        keys.add(key)
        skipWhitespace()
        if (text[index] !== ":") throw new TypeError(`${label} contains invalid JSON object syntax`)
        index += 1
        parseValue(depth + 1)
        skipWhitespace()
        if (text[index] === "}") { index += 1; return }
        if (text[index] !== ",") throw new TypeError(`${label} contains invalid JSON object syntax`)
        index += 1
      }
    }
    if (char === "[") {
      index += 1
      skipWhitespace()
      if (text[index] === "]") { index += 1; return }
      for (;;) {
        parseValue(depth + 1)
        skipWhitespace()
        if (text[index] === "]") { index += 1; return }
        if (text[index] !== ",") throw new TypeError(`${label} contains invalid JSON array syntax`)
        index += 1
      }
    }
    if (char === '"') { parseStringToken(); return }
    const rest = text.slice(index)
    const number = rest.match(/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/)
    if (number) { index += number[0].length; return }
    for (const literal of ["true", "false", "null"] as const) {
      if (rest.startsWith(literal)) { index += literal.length; return }
    }
    throw new TypeError(`${label} contains invalid JSON value syntax`)
  }

  parseValue(0)
  skipWhitespace()
  if (index !== length) throw new TypeError(`${label} contains trailing JSON content`)
}

function parseJsonRecord(text: unknown, label: string, maxBytes: number): Record<string, unknown> {
  if (typeof text !== "string") throw new TypeError(`${label} must be a UTF-8 string`)
  if (byteLength(text) > maxBytes) throw new TypeError(`${label} exceeds ${maxBytes} UTF-8 bytes`)
  validateJsonSyntaxNoDuplicateKeys(text, label)
  let parsed: unknown
  try { parsed = JSON.parse(text) } catch { throw new TypeError(`${label} is not valid JSON`) }
  return asPlainRecord(parsed, label)
}

function validateAnnotations(value: unknown): Readonly<Record<string, string>> {
  if (value === undefined) return Object.freeze({})
  const record = asPlainRecord(value, "gVisor state annotations")
  const entries = Object.entries(record)
  if (entries.length > KDO_H4_R3D_LIMITS.maxAnnotations) throw new TypeError(`gVisor state annotations exceed ${KDO_H4_R3D_LIMITS.maxAnnotations} entries`)
  const normalized: Record<string, string> = {}
  for (const [key, rawValue] of entries.sort(([left], [right]) => left.localeCompare(right))) {
    const normalizedKey = boundedString(key, "gVisor state annotation key", KDO_H4_R3D_LIMITS.maxAnnotationBytes, true)
    const normalizedValue = boundedString(rawValue, `gVisor state annotation ${key}`, KDO_H4_R3D_LIMITS.maxAnnotationBytes, true)
    normalized[normalizedKey] = normalizedValue
  }
  return Object.freeze(normalized)
}

function validateBoundedJson(value: unknown, label: string): void {
  let nodes = 0
  const visit = (current: unknown, depth: number): void => {
    nodes += 1
    if (nodes > KDO_H4_R3D_LIMITS.maxStatsNodes) throw new TypeError(`${label} exceeds JSON node bound`)
    if (depth > KDO_H4_R3D_LIMITS.maxStatsDepth) throw new TypeError(`${label} exceeds JSON depth bound`)
    if (current === null || typeof current === "boolean") return
    if (typeof current === "number") {
      if (!Number.isFinite(current)) throw new TypeError(`${label} contains a non-finite number`)
      return
    }
    if (typeof current === "string") {
      if (byteLength(current) > KDO_H4_R3D_LIMITS.maxStatsStringBytes) throw new TypeError(`${label} contains an oversized string`)
      return
    }
    if (Array.isArray(current)) {
      if (current.length > KDO_H4_R3D_LIMITS.maxStatsArrayItems) throw new TypeError(`${label} contains an oversized array`)
      for (const item of current) visit(item, depth + 1)
      return
    }
    const record = asPlainRecord(current, label)
    const keys = Object.keys(record)
    if (keys.length > KDO_H4_R3D_LIMITS.maxStatsObjectKeys) throw new TypeError(`${label} contains too many object keys`)
    for (const key of keys) {
      if (byteLength(key) > KDO_H4_R3D_LIMITS.maxStatsStringBytes) throw new TypeError(`${label} contains an oversized object key`)
      visit(record[key], depth + 1)
    }
  }
  visit(value, 0)
}

function planPreimage(base: Omit<GvisorObserverPlan, "planIdentity">): string {
  return JSON.stringify({
    version: base.version,
    runscPath: base.runscPath,
    expectedRunscSha256: base.expectedRunscSha256,
    runtimeRoot: base.runtimeRoot,
    containerId: base.containerId,
  })
}

export function createGvisorObserverPlan(input: {
  runscPath: string
  expectedRunscSha256: string
  runtimeRoot: string
  containerId: string
}): GvisorObserverPlan {
  const record = asPlainRecord(input, "gVisor observer plan input")
  exactKeys(record, ["runscPath", "expectedRunscSha256", "runtimeRoot", "containerId"], "gVisor observer plan input")
  const base = Object.freeze({
    version: KDO_H4_R3D_GVISOR_OBSERVER_PLAN_VERSION,
    runscPath: absoluteCanonicalPath(record.runscPath, "runscPath"),
    expectedRunscSha256: sha256Hex(record.expectedRunscSha256, "expectedRunscSha256"),
    runtimeRoot: absoluteCanonicalPath(record.runtimeRoot, "runtimeRoot"),
    containerId: fullContainerId(record.containerId),
  })
  return Object.freeze({ ...base, planIdentity: sha256Domain("KODAC_H4_R3D_PLAN_V1", planPreimage(base)) })
}

export function validateGvisorObserverPlan(value: unknown): GvisorObserverPlan {
  const record = asPlainRecord(value, "gVisor observer plan")
  exactKeys(record, ["version", "runscPath", "expectedRunscSha256", "runtimeRoot", "containerId", "planIdentity"], "gVisor observer plan")
  if (record.version !== KDO_H4_R3D_GVISOR_OBSERVER_PLAN_VERSION) throw new TypeError("gVisor observer plan version mismatch")
  const rebuilt = createGvisorObserverPlan({
    runscPath: absoluteCanonicalPath(record.runscPath, "runscPath"),
    expectedRunscSha256: sha256Hex(record.expectedRunscSha256, "expectedRunscSha256"),
    runtimeRoot: absoluteCanonicalPath(record.runtimeRoot, "runtimeRoot"),
    containerId: fullContainerId(record.containerId),
  })
  if (requireIdentity(record.planIdentity, "planIdentity") !== rebuilt.planIdentity) throw new TypeError("gVisor observer plan identity mismatch")
  return rebuilt
}

export function materializeGvisorStateCommand(planValue: unknown): Readonly<{ file: string; args: readonly string[] }> {
  const plan = validateGvisorObserverPlan(planValue)
  return Object.freeze({ file: plan.runscPath, args: Object.freeze(["--root", plan.runtimeRoot, "state", plan.containerId]) })
}

export function materializeGvisorStatsCommand(planValue: unknown): Readonly<{ file: string; args: readonly string[] }> {
  const plan = validateGvisorObserverPlan(planValue)
  return Object.freeze({ file: plan.runscPath, args: Object.freeze(["--root", plan.runtimeRoot, "events", "--stats", plan.containerId]) })
}

function statePreimage(base: Omit<GvisorStateObservation, "annotations" | "stateIdentity">): string {
  return JSON.stringify({
    version: base.version,
    ociVersion: base.ociVersion,
    containerId: base.containerId,
    status: base.status,
    pid: base.pid,
    bundle: base.bundle,
  })
}

function buildStateObservation(input: {
  ociVersion: unknown
  containerId: unknown
  status: unknown
  pid: unknown
  bundle: unknown
  annotations?: unknown
}): GvisorStateObservation {
  if (input.status !== "running") throw new TypeError("gVisor state status must be running")
  const base = Object.freeze({
    version: KDO_H4_R3D_GVISOR_STATE_VERSION,
    ociVersion: printableAscii(input.ociVersion, "gVisor state ociVersion", KDO_H4_R3D_LIMITS.maxOciVersionBytes),
    containerId: fullContainerId(input.containerId, "gVisor state id"),
    status: "running" as const,
    pid: parsePositivePid(input.pid, "gVisor state pid"),
    bundle: absoluteCanonicalPath(input.bundle, "gVisor state bundle"),
  })
  const annotations = validateAnnotations(input.annotations)
  return Object.freeze({ ...base, annotations, stateIdentity: sha256Domain("KODAC_H4_R3D_STATE_V1", statePreimage(base)) })
}

export function parseGvisorStateOutput(stdout: unknown, planValue: unknown): GvisorStateObservation {
  const plan = validateGvisorObserverPlan(planValue)
  const record = parseJsonRecord(stdout, "gVisor state output", KDO_H4_R3D_LIMITS.maxStateBytes)
  const allowed = new Set(["ociVersion", "id", "status", "pid", "bundle", "annotations"])
  for (const key of Object.keys(record)) if (!allowed.has(key)) throw new TypeError(`gVisor state output contains unknown key: ${key}`)
  for (const key of ["ociVersion", "id", "status", "pid", "bundle"]) if (!Object.hasOwn(record, key)) throw new TypeError(`gVisor state output is missing required key: ${key}`)
  const state = buildStateObservation({
    ociVersion: record.ociVersion,
    containerId: record.id,
    status: record.status,
    pid: record.pid,
    bundle: record.bundle,
    ...(Object.hasOwn(record, "annotations") ? { annotations: record.annotations } : {}),
  })
  if (state.containerId !== plan.containerId) throw new TypeError("gVisor state container id does not match observer plan")
  return state
}

export function validateGvisorStateObservation(value: unknown): GvisorStateObservation {
  const record = asPlainRecord(value, "gVisor state observation")
  exactKeys(record, ["version", "ociVersion", "containerId", "status", "pid", "bundle", "annotations", "stateIdentity"], "gVisor state observation")
  if (record.version !== KDO_H4_R3D_GVISOR_STATE_VERSION) throw new TypeError("gVisor state observation version mismatch")
  const rebuilt = buildStateObservation({ ociVersion: record.ociVersion, containerId: record.containerId, status: record.status, pid: record.pid, bundle: record.bundle, annotations: record.annotations })
  if (requireIdentity(record.stateIdentity, "stateIdentity") !== rebuilt.stateIdentity) throw new TypeError("gVisor state observation identity mismatch")
  return rebuilt
}

function statsPreimage(base: Omit<GvisorStatsObservation, "statsIdentity">): string {
  return JSON.stringify({ version: base.version, containerId: base.containerId, eventType: base.eventType })
}

function buildStatsObservation(containerId: unknown, eventType: unknown): GvisorStatsObservation {
  if (eventType !== "stats") throw new TypeError("gVisor stats event type must be stats")
  const base = Object.freeze({
    version: KDO_H4_R3D_GVISOR_STATS_VERSION,
    containerId: fullContainerId(containerId, "gVisor stats id"),
    eventType: "stats" as const,
  })
  return Object.freeze({ ...base, statsIdentity: sha256Domain("KODAC_H4_R3D_STATS_V1", statsPreimage(base)) })
}

export function parseGvisorStatsOutput(stdout: unknown, planValue: unknown): GvisorStatsObservation {
  const plan = validateGvisorObserverPlan(planValue)
  const record = parseJsonRecord(stdout, "gVisor stats output", KDO_H4_R3D_LIMITS.maxStatsBytes)
  exactKeys(record, ["type", "id", "data"], "gVisor stats output")
  const statsData = asPlainRecord(record.data, "gVisor stats data")
  validateBoundedJson(statsData, "gVisor stats data")
  const observation = buildStatsObservation(record.id, record.type)
  if (observation.containerId !== plan.containerId) throw new TypeError("gVisor stats container id does not match observer plan")
  return observation
}

export function validateGvisorStatsObservation(value: unknown): GvisorStatsObservation {
  const record = asPlainRecord(value, "gVisor stats observation")
  exactKeys(record, ["version", "containerId", "eventType", "statsIdentity"], "gVisor stats observation")
  if (record.version !== KDO_H4_R3D_GVISOR_STATS_VERSION) throw new TypeError("gVisor stats observation version mismatch")
  const rebuilt = buildStatsObservation(record.containerId, record.eventType)
  if (requireIdentity(record.statsIdentity, "statsIdentity") !== rebuilt.statsIdentity) throw new TypeError("gVisor stats observation identity mismatch")
  return rebuilt
}

function processPreimage(base: Omit<GvisorProcessObservation, "processIdentity">): string {
  return JSON.stringify({
    version: base.version,
    pid: base.pid,
    startTicks: base.startTicks,
    exeDev: base.exeDev,
    exeIno: base.exeIno,
    exeSize: base.exeSize,
  })
}

function buildProcessObservation(input: { pid: number; startTicks: string; exeDev: string; exeIno: string; exeSize: string }): GvisorProcessObservation {
  const base = Object.freeze({
    version: KDO_H4_R3D_GVISOR_PROCESS_VERSION,
    pid: parsePositivePid(input.pid, "gVisor process pid"),
    startTicks: canonicalUint64Decimal(input.startTicks, "start-ticks", false),
    exeDev: canonicalUint64Decimal(input.exeDev, "exe-dev", true),
    exeIno: canonicalUint64Decimal(input.exeIno, "exe-ino", false),
    exeSize: canonicalUint64Decimal(input.exeSize, "exe-size", false),
  })
  return Object.freeze({ ...base, processIdentity: sha256Domain("KODAC_H4_R3D_PROCESS_V1", processPreimage(base)) })
}

export function parseGvisorProcessObservation(stdout: unknown): GvisorProcessObservation {
  if (typeof stdout !== "string") throw new TypeError("gVisor process observation must be a string")
  if (byteLength(stdout) > KDO_H4_R3D_LIMITS.maxProcessRecordBytes) throw new TypeError(`gVisor process observation exceeds ${KDO_H4_R3D_LIMITS.maxProcessRecordBytes} UTF-8 bytes`)
  if (!/^[\x00-\x7f]*$/.test(stdout)) throw new TypeError("gVisor process observation must be ASCII")
  const match = stdout.match(/^kodac-gvisor-proc-v1 pid=([1-9][0-9]*) start-ticks=([1-9][0-9]*) exe-dev=(0|[1-9][0-9]*) exe-ino=([1-9][0-9]*) exe-size=([1-9][0-9]*)\n$/)
  if (!match) throw new TypeError("gVisor process observation protocol is malformed")
  const pid = Number(match[1])
  return buildProcessObservation({ pid, startTicks: match[2] ?? "", exeDev: match[3] ?? "", exeIno: match[4] ?? "", exeSize: match[5] ?? "" })
}

export function validateGvisorProcessObservation(value: unknown): GvisorProcessObservation {
  const record = asPlainRecord(value, "gVisor process observation")
  exactKeys(record, ["version", "pid", "startTicks", "exeDev", "exeIno", "exeSize", "processIdentity"], "gVisor process observation")
  if (record.version !== KDO_H4_R3D_GVISOR_PROCESS_VERSION) throw new TypeError("gVisor process observation version mismatch")
  const rebuilt = buildProcessObservation({
    pid: parsePositivePid(record.pid, "gVisor process pid"),
    startTicks: typeof record.startTicks === "string" ? record.startTicks : "",
    exeDev: typeof record.exeDev === "string" ? record.exeDev : "",
    exeIno: typeof record.exeIno === "string" ? record.exeIno : "",
    exeSize: typeof record.exeSize === "string" ? record.exeSize : "",
  })
  if (requireIdentity(record.processIdentity, "processIdentity") !== rebuilt.processIdentity) throw new TypeError("gVisor process observation identity mismatch")
  return rebuilt
}

function candidatePreimage(base: Omit<GvisorRuntimeObservationCandidate, "candidateIdentity">): string {
  return JSON.stringify({
    version: base.version,
    runtimeClass: base.runtimeClass,
    evidenceClass: base.evidenceClass,
    planIdentity: base.planIdentity,
    stateIdentity: base.stateIdentity,
    statsIdentity: base.statsIdentity,
    processIdentity: base.processIdentity,
  })
}

export function createGvisorRuntimeObservationCandidate(input: {
  plan: GvisorObserverPlan
  state: GvisorStateObservation
  stats: GvisorStatsObservation
  process: GvisorProcessObservation
}): GvisorRuntimeObservationCandidate {
  const record = asPlainRecord(input, "gVisor runtime candidate input")
  exactKeys(record, ["plan", "state", "stats", "process"], "gVisor runtime candidate input")
  const plan = validateGvisorObserverPlan(record.plan)
  const state = validateGvisorStateObservation(record.state)
  const stats = validateGvisorStatsObservation(record.stats)
  const process = validateGvisorProcessObservation(record.process)
  if (state.containerId !== plan.containerId) throw new TypeError("gVisor state container id does not match candidate plan")
  if (stats.containerId !== plan.containerId) throw new TypeError("gVisor stats container id does not match candidate plan")
  if (process.pid !== state.pid) throw new TypeError("gVisor process pid does not match state pid")
  const base = Object.freeze({
    version: KDO_H4_R3D_GVISOR_CANDIDATE_VERSION,
    runtimeClass: KDO_H4_R3D_GVISOR_RUNTIME_CLASS,
    evidenceClass: KDO_H4_R3D_EVIDENCE_CLASS,
    planIdentity: plan.planIdentity,
    stateIdentity: state.stateIdentity,
    statsIdentity: stats.statsIdentity,
    processIdentity: process.processIdentity,
  })
  return Object.freeze({ ...base, candidateIdentity: sha256Domain("KODAC_H4_R3D_CANDIDATE_V1", candidatePreimage(base)) })
}

export function validateGvisorRuntimeObservationCandidate(
  value: unknown,
  input: {
    plan: GvisorObserverPlan
    state: GvisorStateObservation
    stats: GvisorStatsObservation
    process: GvisorProcessObservation
  },
): GvisorRuntimeObservationCandidate {
  const record = asPlainRecord(value, "gVisor runtime observation candidate")
  exactKeys(record, ["version", "runtimeClass", "evidenceClass", "planIdentity", "stateIdentity", "statsIdentity", "processIdentity", "candidateIdentity"], "gVisor runtime observation candidate")
  const rebuilt = createGvisorRuntimeObservationCandidate(input)
  if (record.version !== rebuilt.version) throw new TypeError("gVisor runtime observation candidate version mismatch")
  if (record.runtimeClass !== rebuilt.runtimeClass) throw new TypeError("gVisor runtime observation candidate runtime class mismatch")
  if (record.evidenceClass !== rebuilt.evidenceClass) throw new TypeError("gVisor runtime observation candidate evidence class mismatch")
  for (const key of ["planIdentity", "stateIdentity", "statsIdentity", "processIdentity", "candidateIdentity"] as const) {
    if (requireIdentity(record[key], key) !== rebuilt[key]) throw new TypeError(`gVisor runtime observation candidate ${key} mismatch`)
  }
  return rebuilt
}
