import { createHash } from "node:crypto"
import { posix } from "node:path"
import { types as utilTypes } from "node:util"

import {
  validateSandboxExecutionRequirement,
  type SandboxExecutionRequirement,
} from "./sandbox-backend-evidence.ts"
import {
  validateGvisorProcessObservation,
  type GvisorProcessObservation,
} from "./sandbox-observer-gvisor.ts"
import {
  validateGvisorRuntimeLineageCommit,
  validateGvisorRuntimeLineageRecord,
  type GvisorRuntimeLineageCommit,
  type GvisorRuntimeLineageRecord,
} from "./sandbox-observer-gvisor-runtime.ts"

export const KDO_H4_R3G_A_VERSION = "kodac-h4-r3g-a-cgroup-v2-resource-v1" as const
export const KDO_H4_R3G_A_SNAPSHOT_VERSION = "kodac-h4-r3g-a-cgroup-v2-snapshot-v1" as const
export const KDO_H4_R3G_A_RECORD_VERSION = "kodac-h4-r3g-a-resource-record-v1" as const
export const KDO_H4_R3G_A_COMMIT_VERSION = "kodac-h4-r3g-a-resource-commit-v1" as const
export const KDO_H4_R3G_A_RUNTIME_CONFIG_VERSION = "kodac-h4-r3g-a-runtime-config-v1" as const
export const KDO_H4_R3G_A_EVIDENCE_CLASS = "e3-physical-resource-candidate" as const
export const KDO_H4_R3G_A_CAPABILITY = "runtime.observe.gvisor.cgroup-v2" as const
export const KDO_H4_R3G_A_CGROUP_ROOT = "/sys/fs/cgroup" as const

export const KDO_H4_R3G_A_LIMITS = Object.freeze({
  maxMountInfoBytes: 256 * 1024,
  maxProcStatBytes: 16 * 1024,
  maxProcStatusBytes: 128 * 1024,
  maxProcCgroupBytes: 16 * 1024,
  maxControlBytes: 64 * 1024,
  maxCgroupProcsBytes: 256 * 1024,
  maxHierarchyDepth: 64,
  maxPidTokens: 32_768,
  maxCpuRanges: 4096,
  maxCpuId: 1_048_575,
  maxPathBytes: 4096,
  maxDecimalDigits: 20,
  commitTimeoutMs: 5000,
} as const)

export interface GvisorCgroupV2RawLevel {
  readonly path: string
  readonly cgroupType: string
  readonly cpuMax: string
  readonly cpuMaxBurst: string
  readonly cpusetCpusEffective: string
  readonly memoryMax: string
  readonly memorySwapMax: string
}

export interface GvisorCgroupV2RawSnapshot {
  readonly mountInfo: string
  readonly procStat: string
  readonly procStatus: string
  readonly procCgroup: string
  readonly targetCgroupProcs: string
  readonly levels: readonly GvisorCgroupV2RawLevel[]
}

export interface GvisorCgroupV2LevelObservation {
  readonly path: string
  readonly cpuQuota: string | null
  readonly cpuPeriod: string
  readonly cpuMaxBurst: "0"
  readonly cpusetCpusEffective: string
  readonly memoryMax: string | null
  readonly memorySwapMax: string | null
  readonly levelIdentity: string
}

export interface GvisorCgroupV2PhysicalResourceSnapshot {
  readonly version: typeof KDO_H4_R3G_A_SNAPSHOT_VERSION
  readonly evidenceClass: typeof KDO_H4_R3G_A_EVIDENCE_CLASS
  readonly requirementIdentity: string
  readonly pid: number
  readonly startTicks: string
  readonly cgroupPath: string
  readonly mountIdentity: string
  readonly targetProcsIdentity: string
  readonly processCpusAllowed: string
  readonly processCpuIdentity: string
  readonly hierarchyIdentity: string
  readonly levels: readonly GvisorCgroupV2LevelObservation[]
  readonly effectiveCpuNumerator: string
  readonly effectiveCpuDenominator: string
  readonly availableCpuCount: number
  readonly schedulerPolicy: 0
  readonly rtPriority: 0
  readonly effectiveMemoryBytes: string
  readonly effectiveSwapBytes: "0"
  readonly snapshotIdentity: string
}

export interface GvisorCgroupV2ResourceRecord {
  readonly version: typeof KDO_H4_R3G_A_RECORD_VERSION
  readonly evidenceClass: typeof KDO_H4_R3G_A_EVIDENCE_CLASS
  readonly executionAttemptIdentity: string
  readonly requirementIdentity: string
  readonly workloadIdentity: string
  readonly containerBindingIdentity: string
  readonly containerId: string
  readonly r3eRecordIdentity: string
  readonly r3eCommitIdentity: string
  readonly runtimeInstanceIdentity: string
  readonly r3eObserverImplementationIdentity: string
  readonly observerProtocolIdentity: string
  readonly processIdentity: string
  readonly subjectPid: number
  readonly subjectStartTicks: string
  readonly cgroupPath: string
  readonly hierarchyIdentity: string
  readonly prePhysicalSnapshotIdentity: string
  readonly postPhysicalSnapshotIdentity: string
  readonly effectiveCpuNumerator: string
  readonly effectiveCpuDenominator: string
  readonly availableCpuCount: number
  readonly effectiveMemoryBytes: string
  readonly effectiveSwapBytes: "0"
  readonly resourceCandidateIdentity: string
}

export interface GvisorCgroupV2ResourceCommit {
  readonly version: typeof KDO_H4_R3G_A_COMMIT_VERSION
  readonly recordIdentity: string
  readonly commitIdentity: string
}

export interface GvisorCgroupV2RuntimeConfig {
  readonly version: typeof KDO_H4_R3G_A_RUNTIME_CONFIG_VERSION
  readonly commitResourceEvidence: (record: GvisorCgroupV2ResourceRecord) => Promise<unknown> | unknown
}

type PlainRecord = Record<string, unknown>
interface CpuRange { readonly start: number; readonly end: number }
interface ProcStatSubject { readonly pid: number; readonly startTicks: string; readonly rtPriority: number; readonly policy: number }
interface ParsedCpuMax { readonly quota: bigint | null; readonly period: bigint }
interface ParsedLevel {
  readonly observation: GvisorCgroupV2LevelObservation
  readonly cpu: ParsedCpuMax
  readonly cpuRanges: readonly CpuRange[]
  readonly memoryMax: bigint | null
  readonly memorySwapMax: bigint | null
}

const SHA256 = /^[0-9a-f]{64}$/
const DECIMAL = /^(0|[1-9][0-9]*)$/
const POSITIVE_DECIMAL = /^[1-9][0-9]*$/
const SAFE_CGROUP_COMPONENT = /^[A-Za-z0-9_.:@-]+$/

function utf8Bytes(value: string): number { return Buffer.byteLength(value, "utf8") }
function sha256Domain(domain: string, payload: string): string {
  return createHash("sha256")
    .update(Buffer.from(`KODAC-H4-R3G-A\0${domain}\0V1\0`, "ascii"))
    .update(Buffer.from(payload, "utf8"))
    .digest("hex")
}
function fail(message: string): never { throw new TypeError(message) }
function plainRecord(value: unknown, label: string): PlainRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value) || utilTypes.isProxy(value)) fail(`${label} must be a non-proxy plain object`)
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) fail(`${label} must be a plain object`)
  if (Object.getOwnPropertySymbols(value).length !== 0) fail(`${label} must not contain symbol fields`)
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (descriptor.get !== undefined || descriptor.set !== undefined || !("value" in descriptor) || !descriptor.enumerable || descriptor.value === undefined) fail(`${label}.${key} must be an enumerable defined data property`)
  }
  return value as PlainRecord
}
function exactKeys(record: PlainRecord, expected: readonly string[], label: string): void {
  const actual = Object.keys(record).sort(); const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) fail(`${label} must contain exactly: ${wanted.join(", ")}`)
}
function denseArray(value: unknown, label: string, maximum: number): readonly unknown[] {
  if (!Array.isArray(value) || utilTypes.isProxy(value)) fail(`${label} must be a non-proxy array`)
  if (Object.getPrototypeOf(value) !== Array.prototype || Object.getOwnPropertySymbols(value).length !== 0) fail(`${label} must be a plain array without symbol fields`)
  if (value.length === 0 || value.length > maximum) fail(`${label} must contain 1..${maximum} entries`)
  if (Object.keys(value).length !== value.length) fail(`${label} must be dense with no extra enumerable fields`)
  for (let index = 0; index < value.length; index += 1) if (!Object.prototype.hasOwnProperty.call(value, index)) fail(`${label} must not be sparse`)
  return value
}
function boundedString(value: unknown, label: string, maximumBytes: number, allowEmpty = false): string {
  if (typeof value !== "string" || (!allowEmpty && value.length === 0) || value.includes("\0") || utf8Bytes(value) > maximumBytes) fail(`${label} must be a bounded ${allowEmpty ? "string" : "non-empty string"}`)
  return value
}
function shaIdentity(value: unknown, label: string): string {
  if (typeof value !== "string" || !SHA256.test(value)) fail(`${label} must be a lowercase SHA-256 identity`)
  return value
}
function positivePid(value: unknown, label = "pid"): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0 || value > 2_147_483_647) fail(`${label} must be a positive Linux PID`)
  return value
}
function decimal(value: string, label: string, allowZero = true): bigint {
  if (value.length > KDO_H4_R3G_A_LIMITS.maxDecimalDigits || !(allowZero ? DECIMAL : POSITIVE_DECIMAL).test(value)) fail(`${label} must be a bounded canonical decimal integer`)
  return BigInt(value)
}
function decimalString(value: unknown, label: string, allowZero = true): string {
  if (typeof value !== "string") fail(`${label} must be a decimal string`)
  decimal(value, label, allowZero)
  return value
}
function oneLine(value: string, label: string): string {
  const normalized = value.endsWith("\n") ? value.slice(0, -1) : value
  if (normalized.includes("\n") || normalized.includes("\r")) fail(`${label} must contain exactly one line`)
  return normalized
}
function canonicalCgroupPath(value: unknown): string {
  const path = boundedString(value, "cgroup path", KDO_H4_R3G_A_LIMITS.maxPathBytes)
  if (!posix.isAbsolute(path) || posix.normalize(path) !== path || (path.length > 1 && path.endsWith("/"))) fail("cgroup path must be a canonical absolute POSIX path")
  if (path === "/") return path
  for (const component of path.slice(1).split("/")) if (!SAFE_CGROUP_COMPONENT.test(component)) fail("cgroup path contains an unsupported component")
  return path
}
function gcd(left: bigint, right: bigint): bigint {
  let a = left < 0n ? -left : left; let b = right < 0n ? -right : right
  while (b !== 0n) { const next = a % b; a = b; b = next }
  return a
}
function ratio(numerator: bigint, denominator: bigint): { readonly numerator: bigint; readonly denominator: bigint } {
  if (numerator <= 0n || denominator <= 0n) fail("CPU ratio must be positive")
  const divisor = gcd(numerator, denominator)
  return Object.freeze({ numerator: numerator / divisor, denominator: denominator / divisor })
}
function compareRatio(left: { readonly numerator: bigint; readonly denominator: bigint }, right: { readonly numerator: bigint; readonly denominator: bigint }): number {
  const a = left.numerator * right.denominator; const b = right.numerator * left.denominator
  return a < b ? -1 : a > b ? 1 : 0
}
function cpuMax(value: string, label: string): ParsedCpuMax {
  const line = oneLine(boundedString(value, label, KDO_H4_R3G_A_LIMITS.maxControlBytes), label)
  const match = /^(max|[1-9][0-9]*) ([1-9][0-9]*)$/.exec(line)
  if (!match) fail(`${label} must use canonical '<quota|max> <period>' grammar`)
  return Object.freeze({ quota: match[1] === "max" ? null : decimal(match[1], `${label} quota`, false), period: decimal(match[2], `${label} period`, false) })
}
function limit(value: string, label: string): bigint | null {
  const line = oneLine(boundedString(value, label, KDO_H4_R3G_A_LIMITS.maxControlBytes), label)
  return line === "max" ? null : decimal(line, label)
}
function requireZero(value: string, label: string): void {
  if (oneLine(boundedString(value, label, KDO_H4_R3G_A_LIMITS.maxControlBytes), label) !== "0") fail(`${label} must be exactly 0`)
}
function cpuRanges(value: string, label: string): readonly CpuRange[] {
  const line = oneLine(boundedString(value, label, KDO_H4_R3G_A_LIMITS.maxControlBytes), label)
  if (line.length === 0) fail(`${label} must not be empty`)
  const parts = line.split(",")
  if (parts.length > KDO_H4_R3G_A_LIMITS.maxCpuRanges) fail(`${label} exceeds CPU range bound`)
  const output: CpuRange[] = []; let previousEnd = -1
  for (const part of parts) {
    const match = /^([0-9]+)(?:-([0-9]+))?$/.exec(part)
    if (!match) fail(`${label} contains malformed CPU range`)
    const start = Number(decimal(match[1], `${label} start`)); const end = match[2] === undefined ? start : Number(decimal(match[2], `${label} end`))
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || end > KDO_H4_R3G_A_LIMITS.maxCpuId || start <= previousEnd) fail(`${label} CPU ranges must be bounded sorted and non-overlapping`)
    output.push(Object.freeze({ start, end })); previousEnd = end
  }
  return Object.freeze(output)
}
function intersectRanges(left: readonly CpuRange[], right: readonly CpuRange[]): readonly CpuRange[] {
  const output: CpuRange[] = []; let li = 0; let ri = 0
  while (li < left.length && ri < right.length) {
    const start = Math.max(left[li].start, right[ri].start); const end = Math.min(left[li].end, right[ri].end)
    if (start <= end) output.push(Object.freeze({ start, end }))
    if (left[li].end < right[ri].end) li += 1; else ri += 1
  }
  return Object.freeze(output)
}
function rangeCount(ranges: readonly CpuRange[]): number {
  let total = 0
  for (const range of ranges) {
    total += range.end - range.start + 1
    if (!Number.isSafeInteger(total) || total > KDO_H4_R3G_A_LIMITS.maxCpuId + 1) fail("CPU set count exceeds authorized bound")
  }
  return total
}
function canonicalRanges(ranges: readonly CpuRange[]): string { return ranges.map((item) => item.start === item.end ? String(item.start) : `${item.start}-${item.end}`).join(",") }
function finiteRatio(values: readonly ParsedCpuMax[]): { readonly numerator: bigint; readonly denominator: bigint } {
  let effective: { readonly numerator: bigint; readonly denominator: bigint } | undefined
  for (const value of values) {
    if (value.quota === null) continue
    const current = ratio(value.quota, value.period)
    if (effective === undefined || compareRatio(current, effective) < 0) effective = current
  }
  if (effective === undefined) fail("CPU hierarchy has no finite physical cpu.max ceiling")
  return effective
}
function finiteLimit(values: readonly (bigint | null)[], label: string): bigint {
  let effective: bigint | undefined
  for (const value of values) if (value !== null && (effective === undefined || value < effective)) effective = value
  if (effective === undefined) fail(`${label} hierarchy has no finite physical ceiling`)
  return effective
}
function parseProcStat(value: string): ProcStatSubject {
  const text = oneLine(boundedString(value, "/proc pid stat", KDO_H4_R3G_A_LIMITS.maxProcStatBytes), "/proc pid stat")
  const open = text.indexOf(" ("); const close = text.lastIndexOf(") ")
  if (open <= 0 || close <= open + 1) fail("/proc pid stat command field is malformed")
  const pid = Number(decimal(text.slice(0, open), "/proc pid stat pid", false)); positivePid(pid, "/proc pid stat pid")
  const suffix = text.slice(close + 2)
  if (suffix.length < 3 || suffix[1] !== " ") fail("/proc pid stat state field is malformed")
  const fields = suffix.slice(2).split(" ")
  if (fields.length < 38 || fields.some((field) => field.length === 0)) fail("/proc pid stat does not contain required fields")
  const startTicks = decimalString(fields[18], "/proc pid stat start_time")
  const rtPriority = Number(decimal(fields[36], "/proc pid stat rt_priority")); const policy = Number(decimal(fields[37], "/proc pid stat policy"))
  if (!Number.isSafeInteger(rtPriority) || !Number.isSafeInteger(policy)) fail("/proc pid stat scheduler fields exceed bound")
  return Object.freeze({ pid, startTicks, rtPriority, policy })
}
function parseStatusCpus(value: string): readonly CpuRange[] {
  const text = boundedString(value, "/proc pid status", KDO_H4_R3G_A_LIMITS.maxProcStatusBytes)
  const matches = text.split("\n").filter((line) => line.startsWith("Cpus_allowed_list:"))
  if (matches.length !== 1) fail("/proc pid status must contain exactly one Cpus_allowed_list field")
  return cpuRanges(matches[0].slice("Cpus_allowed_list:".length).trim(), "Cpus_allowed_list")
}
export function parseGvisorCgroupV2MembershipPath(value: string): string {
  const text = boundedString(value, "/proc pid cgroup", KDO_H4_R3G_A_LIMITS.maxProcCgroupBytes)
  const lines = text.split("\n").filter((line) => line.length !== 0)
  if (lines.length !== 1) fail("/proc pid cgroup must contain exactly one unified v2 entry")
  const match = /^0::(\/.*)$/.exec(lines[0])
  if (!match) fail("/proc pid cgroup must use unified v2 0::/path grammar")
  const path = canonicalCgroupPath(match[1])
  if (path === "/") fail("R3G-A requires a non-root target cgroup")
  return path
}
function parseMount(value: string): string {
  const text = boundedString(value, "/proc/self/mountinfo", KDO_H4_R3G_A_LIMITS.maxMountInfoBytes)
  const matches: string[] = []
  for (const line of text.split("\n").filter(Boolean)) {
    const fields = line.split(" "); const separator = fields.indexOf("-")
    if (separator < 6 || separator + 3 > fields.length || fields[separator + 1] !== "cgroup2") continue
    matches.push(JSON.stringify({ root: fields[3], mountpoint: fields[4], source: fields[separator + 2], superOptions: fields.slice(separator + 3).join(" ") }))
  }
  if (matches.length !== 1) fail("observer must see exactly one cgroup2 mount")
  const parsed = JSON.parse(matches[0]) as { root: string; mountpoint: string }
  if (parsed.root !== "/" || parsed.mountpoint !== KDO_H4_R3G_A_CGROUP_ROOT) fail("cgroup2 mount must use root=/ at /sys/fs/cgroup")
  return sha256Domain("CGROUP2_MOUNT", matches[0])
}
export function cgroupV2HierarchyPaths(value: string): readonly string[] {
  const target = canonicalCgroupPath(value)
  if (target === "/") fail("R3G-A controller hierarchy requires a non-root target")
  const output: string[] = [target]; let current = target
  while (posix.dirname(current) !== "/") {
    current = posix.dirname(current); output.push(current)
    if (output.length > KDO_H4_R3G_A_LIMITS.maxHierarchyDepth) fail("cgroup hierarchy exceeds authorized depth")
  }
  return Object.freeze(output)
}
export function cgroupV2FilesystemPath(value: string): string {
  const path = canonicalCgroupPath(value)
  return path === "/" ? KDO_H4_R3G_A_CGROUP_ROOT : `${KDO_H4_R3G_A_CGROUP_ROOT}${path}`
}
function targetProcsIdentity(value: string, expectedPid: number): string {
  const text = boundedString(value, "cgroup.procs", KDO_H4_R3G_A_LIMITS.maxCgroupProcsBytes, true)
  const lines = text.split("\n").filter(Boolean)
  if (lines.length > KDO_H4_R3G_A_LIMITS.maxPidTokens) fail("cgroup.procs exceeds PID token bound")
  const pids: number[] = []
  for (const line of lines) { const pid = Number(decimal(line, "cgroup.procs PID", false)); positivePid(pid, "cgroup.procs PID"); pids.push(pid) }
  const unique = [...new Set(pids)].sort((left, right) => left - right)
  if (!unique.includes(expectedPid)) fail("exact R3E PID is not a member of target cgroup.procs")
  return sha256Domain("TARGET_PROCS", JSON.stringify(unique))
}
function parsedLevel(value: unknown, expectedPath: string): ParsedLevel {
  const record = plainRecord(value, "cgroup level")
  exactKeys(record, ["path", "cgroupType", "cpuMax", "cpuMaxBurst", "cpusetCpusEffective", "memoryMax", "memorySwapMax"], "cgroup level")
  const path = canonicalCgroupPath(record.path)
  if (path === "/" || path !== expectedPath) fail("cgroup level must be the expected non-root hierarchy path")
  if (oneLine(boundedString(record.cgroupType, "cgroup.type", KDO_H4_R3G_A_LIMITS.maxControlBytes), "cgroup.type") !== "domain") fail("R3G-A v1 requires cgroup.type=domain on every non-root level")
  const cpu = cpuMax(boundedString(record.cpuMax, "cpu.max", KDO_H4_R3G_A_LIMITS.maxControlBytes), "cpu.max")
  requireZero(boundedString(record.cpuMaxBurst, "cpu.max.burst", KDO_H4_R3G_A_LIMITS.maxControlBytes), "cpu.max.burst")
  const cpus = cpuRanges(boundedString(record.cpusetCpusEffective, "cpuset.cpus.effective", KDO_H4_R3G_A_LIMITS.maxControlBytes), "cpuset.cpus.effective")
  const memoryMax = limit(boundedString(record.memoryMax, "memory.max", KDO_H4_R3G_A_LIMITS.maxControlBytes), "memory.max")
  const memorySwapMax = limit(boundedString(record.memorySwapMax, "memory.swap.max", KDO_H4_R3G_A_LIMITS.maxControlBytes), "memory.swap.max")
  const base = Object.freeze({
    path,
    cpuQuota: cpu.quota === null ? null : cpu.quota.toString(),
    cpuPeriod: cpu.period.toString(),
    cpuMaxBurst: "0" as const,
    cpusetCpusEffective: canonicalRanges(cpus),
    memoryMax: memoryMax === null ? null : memoryMax.toString(),
    memorySwapMax: memorySwapMax === null ? null : memorySwapMax.toString(),
  })
  return Object.freeze({ observation: Object.freeze({ ...base, levelIdentity: sha256Domain("CGROUP_LEVEL", JSON.stringify(base)) }), cpu, cpuRanges: cpus, memoryMax, memorySwapMax })
}
function validateLevel(value: unknown, expectedPath: string): ParsedLevel {
  const record = plainRecord(value, "normalized cgroup level")
  exactKeys(record, ["path", "cpuQuota", "cpuPeriod", "cpuMaxBurst", "cpusetCpusEffective", "memoryMax", "memorySwapMax", "levelIdentity"], "normalized cgroup level")
  const raw: GvisorCgroupV2RawLevel = {
    path: canonicalCgroupPath(record.path),
    cgroupType: "domain",
    cpuMax: `${record.cpuQuota === null ? "max" : decimalString(record.cpuQuota, "cpuQuota", false)} ${decimalString(record.cpuPeriod, "cpuPeriod", false)}`,
    cpuMaxBurst: record.cpuMaxBurst === "0" ? "0" : fail("cpuMaxBurst must be 0"),
    cpusetCpusEffective: boundedString(record.cpusetCpusEffective, "cpusetCpusEffective", KDO_H4_R3G_A_LIMITS.maxControlBytes),
    memoryMax: record.memoryMax === null ? "max" : decimalString(record.memoryMax, "memoryMax"),
    memorySwapMax: record.memorySwapMax === null ? "max" : decimalString(record.memorySwapMax, "memorySwapMax"),
  }
  const parsed = parsedLevel(raw, expectedPath)
  if (shaIdentity(record.levelIdentity, "levelIdentity") !== parsed.observation.levelIdentity) fail("R3G-A cgroup level identity mismatch")
  return parsed
}
function derivedHierarchy(mountIdentity: string, cgroupPath: string, levels: readonly GvisorCgroupV2LevelObservation[]): string {
  return sha256Domain("HIERARCHY", JSON.stringify({ mountIdentity, cgroupPath, levels: levels.map((level) => level.levelIdentity) }))
}
function snapshotPreimage(value: Omit<GvisorCgroupV2PhysicalResourceSnapshot, "snapshotIdentity">): string { return JSON.stringify(value) }

export function createGvisorCgroupV2PhysicalResourceSnapshot(input: {
  requirement: SandboxExecutionRequirement
  expectedPid: number
  expectedStartTicks: string
  raw: GvisorCgroupV2RawSnapshot
}): GvisorCgroupV2PhysicalResourceSnapshot {
  const outer = plainRecord(input, "R3G-A physical snapshot input")
  exactKeys(outer, ["requirement", "expectedPid", "expectedStartTicks", "raw"], "R3G-A physical snapshot input")
  const requirement = validateSandboxExecutionRequirement(outer.requirement)
  if (requirement.requiredSemanticRuntimeClass !== "gvisor") fail("R3G-A requires gvisor")
  const expectedPid = positivePid(outer.expectedPid, "expectedPid")
  const expectedStartTicks = decimalString(outer.expectedStartTicks, "expectedStartTicks")
  const raw = plainRecord(outer.raw, "R3G-A raw snapshot")
  exactKeys(raw, ["mountInfo", "procStat", "procStatus", "procCgroup", "targetCgroupProcs", "levels"], "R3G-A raw snapshot")
  const mountIdentity = parseMount(boundedString(raw.mountInfo, "mountInfo", KDO_H4_R3G_A_LIMITS.maxMountInfoBytes))
  const subject = parseProcStat(boundedString(raw.procStat, "procStat", KDO_H4_R3G_A_LIMITS.maxProcStatBytes))
  if (subject.pid !== expectedPid || subject.startTicks !== expectedStartTicks) fail("R3G-A /proc subject does not match exact R3E PID/startTicks")
  if (subject.policy !== 0 || subject.rtPriority !== 0) fail("R3G-A v1 requires SCHED_OTHER policy=0 and rt_priority=0")
  const processRanges = parseStatusCpus(boundedString(raw.procStatus, "procStatus", KDO_H4_R3G_A_LIMITS.maxProcStatusBytes))
  const processCpusAllowed = canonicalRanges(processRanges)
  const cgroupPath = parseGvisorCgroupV2MembershipPath(boundedString(raw.procCgroup, "procCgroup", KDO_H4_R3G_A_LIMITS.maxProcCgroupBytes))
  const expectedPaths = cgroupV2HierarchyPaths(cgroupPath)
  const rawLevels = denseArray(raw.levels, "R3G-A cgroup levels", KDO_H4_R3G_A_LIMITS.maxHierarchyDepth)
  if (rawLevels.length !== expectedPaths.length) fail("R3G-A cgroup levels must cover every non-root target/ancestor exactly")
  const levels = rawLevels.map((level, index) => parsedLevel(level, expectedPaths[index]))
  const targetProcs = targetProcsIdentity(boundedString(raw.targetCgroupProcs, "targetCgroupProcs", KDO_H4_R3G_A_LIMITS.maxCgroupProcsBytes, true), expectedPid)
  const effectiveCpu = finiteRatio(levels.map((level) => level.cpu)); const requiredCpu = ratio(BigInt(requirement.workload.resourcePolicy.cpuMillis), 1000n)
  if (compareRatio(effectiveCpu, requiredCpu) !== 0) fail("physical effective CPU ceiling does not exactly match required cpuMillis")
  let availableRanges = processRanges
  for (const level of levels) availableRanges = intersectRanges(availableRanges, level.cpuRanges)
  const targetRanges = levels[0].cpuRanges; const targetCanonical = canonicalRanges(targetRanges)
  if (canonicalRanges(intersectRanges(targetRanges, levels.slice(1).reduce<readonly CpuRange[]>((accumulator, level) => intersectRanges(accumulator, level.cpuRanges), targetRanges))) !== targetCanonical) fail("target cpuset.cpus.effective is inconsistent with ancestor effective sets")
  const availableCpuCount = rangeCount(availableRanges)
  if (availableCpuCount <= 0 || BigInt(availableCpuCount) * 1000n < BigInt(requirement.workload.resourcePolicy.cpuMillis)) fail("cpuset/process affinity is stricter than required CPU capacity")
  const effectiveMemory = finiteLimit(levels.map((level) => level.memoryMax), "memory.max")
  if (effectiveMemory !== BigInt(requirement.workload.resourcePolicy.memoryBytes)) fail("physical effective memory ceiling does not exactly match required memoryBytes")
  const effectiveSwap = finiteLimit(levels.map((level) => level.memorySwapMax), "memory.swap.max")
  if (effectiveSwap !== 0n) fail("physical effective swap ceiling must be exactly 0")
  const observations = Object.freeze(levels.map((level) => level.observation))
  const hierarchyIdentity = derivedHierarchy(mountIdentity, cgroupPath, observations)
  const processCpuIdentity = sha256Domain("PROCESS_CPU", JSON.stringify({ pid: expectedPid, startTicks: expectedStartTicks, policy: subject.policy, rtPriority: subject.rtPriority, cpusAllowed: processCpusAllowed, available: canonicalRanges(availableRanges) }))
  const base = Object.freeze({
    version: KDO_H4_R3G_A_SNAPSHOT_VERSION,
    evidenceClass: KDO_H4_R3G_A_EVIDENCE_CLASS,
    requirementIdentity: requirement.requirementIdentity,
    pid: expectedPid,
    startTicks: expectedStartTicks,
    cgroupPath,
    mountIdentity,
    targetProcsIdentity: targetProcs,
    processCpusAllowed,
    processCpuIdentity,
    hierarchyIdentity,
    levels: observations,
    effectiveCpuNumerator: effectiveCpu.numerator.toString(),
    effectiveCpuDenominator: effectiveCpu.denominator.toString(),
    availableCpuCount,
    schedulerPolicy: 0 as const,
    rtPriority: 0 as const,
    effectiveMemoryBytes: effectiveMemory.toString(),
    effectiveSwapBytes: "0" as const,
  })
  return Object.freeze({ ...base, snapshotIdentity: sha256Domain("PHYSICAL_SNAPSHOT", snapshotPreimage(base)) })
}

export function validateGvisorCgroupV2PhysicalResourceSnapshot(value: unknown): GvisorCgroupV2PhysicalResourceSnapshot {
  const record = plainRecord(value, "R3G-A physical snapshot")
  exactKeys(record, ["version", "evidenceClass", "requirementIdentity", "pid", "startTicks", "cgroupPath", "mountIdentity", "targetProcsIdentity", "processCpusAllowed", "processCpuIdentity", "hierarchyIdentity", "levels", "effectiveCpuNumerator", "effectiveCpuDenominator", "availableCpuCount", "schedulerPolicy", "rtPriority", "effectiveMemoryBytes", "effectiveSwapBytes", "snapshotIdentity"], "R3G-A physical snapshot")
  if (record.version !== KDO_H4_R3G_A_SNAPSHOT_VERSION || record.evidenceClass !== KDO_H4_R3G_A_EVIDENCE_CLASS) fail("R3G-A physical snapshot version/evidence class mismatch")
  const cgroupPath = canonicalCgroupPath(record.cgroupPath); if (cgroupPath === "/") fail("R3G-A physical snapshot cannot target root cgroup")
  const expectedPaths = cgroupV2HierarchyPaths(cgroupPath)
  const levelValues = denseArray(record.levels, "R3G-A physical snapshot levels", KDO_H4_R3G_A_LIMITS.maxHierarchyDepth)
  if (levelValues.length !== expectedPaths.length) fail("R3G-A physical snapshot levels do not cover the non-root hierarchy")
  const parsed = levelValues.map((level, index) => validateLevel(level, expectedPaths[index])); const levels = Object.freeze(parsed.map((level) => level.observation))
  const mountIdentity = shaIdentity(record.mountIdentity, "mountIdentity")
  const hierarchyIdentity = derivedHierarchy(mountIdentity, cgroupPath, levels)
  if (shaIdentity(record.hierarchyIdentity, "hierarchyIdentity") !== hierarchyIdentity) fail("R3G-A hierarchy identity mismatch")
  const derivedCpu = finiteRatio(parsed.map((level) => level.cpu))
  if (decimalString(record.effectiveCpuNumerator, "effectiveCpuNumerator", false) !== derivedCpu.numerator.toString() || decimalString(record.effectiveCpuDenominator, "effectiveCpuDenominator", false) !== derivedCpu.denominator.toString()) fail("R3G-A effective CPU ratio does not match levels")
  const derivedMemory = finiteLimit(parsed.map((level) => level.memoryMax), "memory.max")
  if (decimalString(record.effectiveMemoryBytes, "effectiveMemoryBytes") !== derivedMemory.toString()) fail("R3G-A effective memory does not match levels")
  const derivedSwap = finiteLimit(parsed.map((level) => level.memorySwapMax), "memory.swap.max")
  if (record.effectiveSwapBytes !== "0" || derivedSwap !== 0n) fail("R3G-A effective swap does not match levels")
  const processCpusAllowed = canonicalRanges(cpuRanges(boundedString(record.processCpusAllowed, "processCpusAllowed", KDO_H4_R3G_A_LIMITS.maxControlBytes), "processCpusAllowed"))
  let availableRanges = cpuRanges(processCpusAllowed, "processCpusAllowed")
  for (const level of parsed) availableRanges = intersectRanges(availableRanges, level.cpuRanges)
  const availableCpuCount = rangeCount(availableRanges)
  if (record.availableCpuCount !== availableCpuCount) fail("R3G-A availableCpuCount does not match affinity/cpuset evidence")
  if (availableCpuCount <= 0 || availableCpuCount > KDO_H4_R3G_A_LIMITS.maxCpuId + 1) fail("R3G-A availableCpuCount is outside bound")
  if (record.schedulerPolicy !== 0 || record.rtPriority !== 0) fail("R3G-A scheduler posture must remain policy=0 rt_priority=0")
  const pid = positivePid(record.pid); const startTicks = decimalString(record.startTicks, "startTicks")
  const processCpuIdentity = sha256Domain("PROCESS_CPU", JSON.stringify({ pid, startTicks, policy: 0, rtPriority: 0, cpusAllowed: processCpusAllowed, available: canonicalRanges(availableRanges) }))
  if (shaIdentity(record.processCpuIdentity, "processCpuIdentity") !== processCpuIdentity) fail("R3G-A process CPU identity mismatch")
  const base = Object.freeze({
    version: KDO_H4_R3G_A_SNAPSHOT_VERSION,
    evidenceClass: KDO_H4_R3G_A_EVIDENCE_CLASS,
    requirementIdentity: shaIdentity(record.requirementIdentity, "requirementIdentity"),
    pid,
    startTicks,
    cgroupPath,
    mountIdentity,
    targetProcsIdentity: shaIdentity(record.targetProcsIdentity, "targetProcsIdentity"),
    processCpusAllowed,
    processCpuIdentity,
    hierarchyIdentity,
    levels,
    effectiveCpuNumerator: derivedCpu.numerator.toString(),
    effectiveCpuDenominator: derivedCpu.denominator.toString(),
    availableCpuCount,
    schedulerPolicy: 0 as const,
    rtPriority: 0 as const,
    effectiveMemoryBytes: derivedMemory.toString(),
    effectiveSwapBytes: "0" as const,
  })
  const expected = sha256Domain("PHYSICAL_SNAPSHOT", snapshotPreimage(base))
  if (shaIdentity(record.snapshotIdentity, "snapshotIdentity") !== expected) fail("R3G-A physical snapshot identity mismatch")
  return Object.freeze({ ...base, snapshotIdentity: expected })
}

export function createGvisorCgroupV2ObserverProtocolIdentity(): string {
  return sha256Domain("OBSERVER_PROTOCOL", JSON.stringify({ version: KDO_H4_R3G_A_VERSION, capability: KDO_H4_R3G_A_CAPABILITY, linuxSemanticBaseline: "linux-v6.12", gvisorSemanticBaseline: "50e1502a95d36ad2faf2c7ef33b8bf21fe975293", cgroupRoot: KDO_H4_R3G_A_CGROUP_ROOT, theorem: "nonroot-domain-fair-cpu-memory-noswap-exact-v1" }))
}
function resourcePreimage(value: Omit<GvisorCgroupV2ResourceRecord, "resourceCandidateIdentity">): string { return JSON.stringify(value) }

export function createGvisorCgroupV2ResourceRecord(input: {
  requirement: SandboxExecutionRequirement
  lineage: GvisorRuntimeLineageRecord
  lineageCommit: GvisorRuntimeLineageCommit
  process: GvisorProcessObservation
  preSnapshot: GvisorCgroupV2PhysicalResourceSnapshot
  postSnapshot: GvisorCgroupV2PhysicalResourceSnapshot
}): GvisorCgroupV2ResourceRecord {
  const outer = plainRecord(input, "R3G-A resource record input")
  exactKeys(outer, ["requirement", "lineage", "lineageCommit", "process", "preSnapshot", "postSnapshot"], "R3G-A resource record input")
  const requirement = validateSandboxExecutionRequirement(outer.requirement)
  const lineage = validateGvisorRuntimeLineageRecord(outer.lineage)
  const lineageCommit = validateGvisorRuntimeLineageCommit(outer.lineageCommit, lineage)
  const process = validateGvisorProcessObservation(outer.process)
  const pre = validateGvisorCgroupV2PhysicalResourceSnapshot(outer.preSnapshot); const post = validateGvisorCgroupV2PhysicalResourceSnapshot(outer.postSnapshot)
  if (pre.snapshotIdentity !== post.snapshotIdentity) fail("R3G-A pre/post physical snapshots are not stable")
  if (lineage.requirementIdentity !== requirement.requirementIdentity || lineage.workloadIdentity !== requirement.workload.workloadIdentity || pre.requirementIdentity !== requirement.requirementIdentity) fail("R3G-A evidence does not match exact requirement")
  if (process.processIdentity !== lineage.processIdentity || process.pid !== pre.pid || process.startTicks !== pre.startTicks) fail("R3G-A physical subject does not match canonical R3E process lineage")
  const base = Object.freeze({
    version: KDO_H4_R3G_A_RECORD_VERSION,
    evidenceClass: KDO_H4_R3G_A_EVIDENCE_CLASS,
    executionAttemptIdentity: lineage.executionAttemptIdentity,
    requirementIdentity: requirement.requirementIdentity,
    workloadIdentity: requirement.workload.workloadIdentity,
    containerBindingIdentity: lineage.containerBindingIdentity,
    containerId: lineage.containerId,
    r3eRecordIdentity: lineage.recordIdentity,
    r3eCommitIdentity: lineageCommit.commitIdentity,
    runtimeInstanceIdentity: lineage.runtimeInstanceIdentity,
    r3eObserverImplementationIdentity: lineage.observerImplementationIdentity,
    observerProtocolIdentity: createGvisorCgroupV2ObserverProtocolIdentity(),
    processIdentity: process.processIdentity,
    subjectPid: pre.pid,
    subjectStartTicks: pre.startTicks,
    cgroupPath: pre.cgroupPath,
    hierarchyIdentity: pre.hierarchyIdentity,
    prePhysicalSnapshotIdentity: pre.snapshotIdentity,
    postPhysicalSnapshotIdentity: post.snapshotIdentity,
    effectiveCpuNumerator: pre.effectiveCpuNumerator,
    effectiveCpuDenominator: pre.effectiveCpuDenominator,
    availableCpuCount: pre.availableCpuCount,
    effectiveMemoryBytes: pre.effectiveMemoryBytes,
    effectiveSwapBytes: pre.effectiveSwapBytes,
  })
  return Object.freeze({ ...base, resourceCandidateIdentity: sha256Domain("RESOURCE_RECORD", resourcePreimage(base)) })
}

export function validateGvisorCgroupV2ResourceRecord(value: unknown): GvisorCgroupV2ResourceRecord {
  const record = plainRecord(value, "R3G-A resource record")
  exactKeys(record, ["version", "evidenceClass", "executionAttemptIdentity", "requirementIdentity", "workloadIdentity", "containerBindingIdentity", "containerId", "r3eRecordIdentity", "r3eCommitIdentity", "runtimeInstanceIdentity", "r3eObserverImplementationIdentity", "observerProtocolIdentity", "processIdentity", "subjectPid", "subjectStartTicks", "cgroupPath", "hierarchyIdentity", "prePhysicalSnapshotIdentity", "postPhysicalSnapshotIdentity", "effectiveCpuNumerator", "effectiveCpuDenominator", "availableCpuCount", "effectiveMemoryBytes", "effectiveSwapBytes", "resourceCandidateIdentity"], "R3G-A resource record")
  if (record.version !== KDO_H4_R3G_A_RECORD_VERSION || record.evidenceClass !== KDO_H4_R3G_A_EVIDENCE_CLASS) fail("R3G-A resource record version/evidence class mismatch")
  const availableCpuCount = record.availableCpuCount
  if (typeof availableCpuCount !== "number" || !Number.isSafeInteger(availableCpuCount) || availableCpuCount <= 0 || availableCpuCount > KDO_H4_R3G_A_LIMITS.maxCpuId + 1) fail("R3G-A availableCpuCount is invalid")
  const preIdentity = shaIdentity(record.prePhysicalSnapshotIdentity, "prePhysicalSnapshotIdentity"); const postIdentity = shaIdentity(record.postPhysicalSnapshotIdentity, "postPhysicalSnapshotIdentity")
  if (preIdentity !== postIdentity) fail("R3G-A resource record must bind identical pre/post physical snapshots")
  const expectedObserverProtocolIdentity = createGvisorCgroupV2ObserverProtocolIdentity()
  if (shaIdentity(record.observerProtocolIdentity, "observerProtocolIdentity") !== expectedObserverProtocolIdentity) fail("R3G-A observerProtocolIdentity does not match canonical protocol")
  const base = Object.freeze({
    version: KDO_H4_R3G_A_RECORD_VERSION,
    evidenceClass: KDO_H4_R3G_A_EVIDENCE_CLASS,
    executionAttemptIdentity: shaIdentity(record.executionAttemptIdentity, "executionAttemptIdentity"),
    requirementIdentity: shaIdentity(record.requirementIdentity, "requirementIdentity"),
    workloadIdentity: shaIdentity(record.workloadIdentity, "workloadIdentity"),
    containerBindingIdentity: shaIdentity(record.containerBindingIdentity, "containerBindingIdentity"),
    containerId: shaIdentity(record.containerId, "containerId"),
    r3eRecordIdentity: shaIdentity(record.r3eRecordIdentity, "r3eRecordIdentity"),
    r3eCommitIdentity: shaIdentity(record.r3eCommitIdentity, "r3eCommitIdentity"),
    runtimeInstanceIdentity: shaIdentity(record.runtimeInstanceIdentity, "runtimeInstanceIdentity"),
    r3eObserverImplementationIdentity: shaIdentity(record.r3eObserverImplementationIdentity, "r3eObserverImplementationIdentity"),
    observerProtocolIdentity: expectedObserverProtocolIdentity,
    processIdentity: shaIdentity(record.processIdentity, "processIdentity"),
    subjectPid: positivePid(record.subjectPid, "subjectPid"),
    subjectStartTicks: decimalString(record.subjectStartTicks, "subjectStartTicks"),
    cgroupPath: (() => { const path = canonicalCgroupPath(record.cgroupPath); if (path === "/") fail("R3G-A record cannot target root cgroup"); return path })(),
    hierarchyIdentity: shaIdentity(record.hierarchyIdentity, "hierarchyIdentity"),
    prePhysicalSnapshotIdentity: preIdentity,
    postPhysicalSnapshotIdentity: postIdentity,
    effectiveCpuNumerator: decimalString(record.effectiveCpuNumerator, "effectiveCpuNumerator", false),
    effectiveCpuDenominator: decimalString(record.effectiveCpuDenominator, "effectiveCpuDenominator", false),
    availableCpuCount,
    effectiveMemoryBytes: decimalString(record.effectiveMemoryBytes, "effectiveMemoryBytes"),
    effectiveSwapBytes: record.effectiveSwapBytes === "0" ? "0" as const : fail("effectiveSwapBytes must be 0"),
  })
  const expected = sha256Domain("RESOURCE_RECORD", resourcePreimage(base))
  if (shaIdentity(record.resourceCandidateIdentity, "resourceCandidateIdentity") !== expected) fail("R3G-A resource record identity mismatch")
  return Object.freeze({ ...base, resourceCandidateIdentity: expected })
}

export function createGvisorCgroupV2ResourceCommit(record: GvisorCgroupV2ResourceRecord): GvisorCgroupV2ResourceCommit {
  const checked = validateGvisorCgroupV2ResourceRecord(record)
  const base = Object.freeze({ version: KDO_H4_R3G_A_COMMIT_VERSION, recordIdentity: checked.resourceCandidateIdentity })
  return Object.freeze({ ...base, commitIdentity: sha256Domain("RESOURCE_COMMIT", checked.resourceCandidateIdentity) })
}
export function validateGvisorCgroupV2ResourceCommit(value: unknown, expectedRecord: GvisorCgroupV2ResourceRecord): GvisorCgroupV2ResourceCommit {
  const record = plainRecord(value, "R3G-A resource commit")
  exactKeys(record, ["version", "recordIdentity", "commitIdentity"], "R3G-A resource commit")
  if (record.version !== KDO_H4_R3G_A_COMMIT_VERSION) fail("R3G-A resource commit version mismatch")
  const expected = createGvisorCgroupV2ResourceCommit(expectedRecord)
  if (shaIdentity(record.recordIdentity, "resource commit recordIdentity") !== expected.recordIdentity || shaIdentity(record.commitIdentity, "resource commitIdentity") !== expected.commitIdentity) fail("R3G-A resource commit identity mismatch")
  return expected
}
export function validateGvisorCgroupV2RuntimeConfig(value: unknown): GvisorCgroupV2RuntimeConfig {
  const record = plainRecord(value, "R3G-A runtime config")
  exactKeys(record, ["version", "commitResourceEvidence"], "R3G-A runtime config")
  if (record.version !== KDO_H4_R3G_A_RUNTIME_CONFIG_VERSION) fail("R3G-A runtime config version mismatch")
  if (typeof record.commitResourceEvidence !== "function") fail("R3G-A commitResourceEvidence must be a function")
  return Object.freeze({ version: KDO_H4_R3G_A_RUNTIME_CONFIG_VERSION, commitResourceEvidence: record.commitResourceEvidence as GvisorCgroupV2RuntimeConfig["commitResourceEvidence"] })
}
