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
  readonly cpuMaxBurst: string
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
  readonly physicalSnapshotIdentity: string
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

interface CpuRange { readonly start: number; readonly end: number }
interface ProcStatSubject { readonly pid: number; readonly startTicks: string; readonly rtPriority: number; readonly policy: number }
interface ParsedCpuMax { readonly quota: bigint | null; readonly period: bigint }

const SHA256 = /^[0-9a-f]{64}$/
const DECIMAL = /^(0|[1-9][0-9]*)$/
const POSITIVE_DECIMAL = /^[1-9][0-9]*$/
const SAFE_CGROUP_COMPONENT = /^[A-Za-z0-9_.:@-]+$/

function byteLength(value: string): number { return Buffer.byteLength(value, "utf8") }
function sha256Domain(domain: string, payload: string): string {
  return createHash("sha256")
    .update(Buffer.from(`KODAC-H4-R3G-A\0${domain}\0V1\0`, "ascii"))
    .update(Buffer.from(payload, "utf8"))
    .digest("hex")
}
function asPlainRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value) || utilTypes.isProxy(value)) throw new TypeError(`${label} must be a non-proxy plain object`)
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain object`)
  if (Object.getOwnPropertySymbols(value).length !== 0) throw new TypeError(`${label} must not contain symbol fields`)
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (descriptor.get !== undefined || descriptor.set !== undefined || !("value" in descriptor)) throw new TypeError(`${label}.${key} must be a data property`)
    if (!descriptor.enumerable || descriptor.value === undefined) throw new TypeError(`${label}.${key} must be an enumerable defined property`)
  }
  return value as Record<string, unknown>
}
function exactKeys(record: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(record).sort(); const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) throw new TypeError(`${label} must contain exactly: ${wanted.join(", ")}`)
}
function asDenseArray(value: unknown, label: string, maximum: number): readonly unknown[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > maximum) throw new TypeError(`${label} must contain 1..${maximum} entries`)
  if (Object.keys(value).length !== value.length) throw new TypeError(`${label} must be dense and contain no extra enumerable fields`)
  for (let index = 0; index < value.length; index += 1) if (!Object.prototype.hasOwnProperty.call(value, index)) throw new TypeError(`${label} must not be sparse`)
  return value
}
function boundedString(value: unknown, label: string, maximumBytes: number, allowEmpty = false): string {
  if (typeof value !== "string" || (!allowEmpty && value.length === 0) || value.includes("\0") || byteLength(value) > maximumBytes) throw new TypeError(`${label} must be a bounded ${allowEmpty ? "string" : "non-empty string"}`)
  return value
}
function identity(value: unknown, label: string): string {
  if (typeof value !== "string" || !SHA256.test(value)) throw new TypeError(`${label} must be a lowercase SHA-256 identity`)
  return value
}
function positivePid(value: unknown, label = "pid"): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0 || value > 2_147_483_647) throw new TypeError(`${label} must be a positive Linux PID`)
  return value
}
function canonicalDecimal(value: string, label: string, allowZero = true): bigint {
  if (value.length > KDO_H4_R3G_A_LIMITS.maxDecimalDigits || !(allowZero ? DECIMAL : POSITIVE_DECIMAL).test(value)) throw new TypeError(`${label} must be a bounded canonical decimal integer`)
  return BigInt(value)
}
function canonicalDecimalValue(value: unknown, label: string): string {
  if (typeof value !== "string") throw new TypeError(`${label} must be a decimal string`)
  canonicalDecimal(value, label)
  return value
}
function canonicalCgroupPath(value: unknown): string {
  const path = boundedString(value, "cgroup path", KDO_H4_R3G_A_LIMITS.maxPathBytes)
  if (!posix.isAbsolute(path) || posix.normalize(path) !== path || (path.length > 1 && path.endsWith("/"))) throw new TypeError("cgroup path must be a canonical absolute POSIX path")
  if (path === "/") return path
  for (const component of path.slice(1).split("/")) if (!SAFE_CGROUP_COMPONENT.test(component)) throw new TypeError("cgroup path contains an unsupported component")
  return path
}
function canonicalLevelPath(value: unknown): string { return canonicalCgroupPath(value) }
function trimSingleLine(value: string, label: string): string {
  const normalized = value.endsWith("\n") ? value.slice(0, -1) : value
  if (normalized.includes("\n") || normalized.includes("\r")) throw new TypeError(`${label} must contain exactly one line`)
  return normalized
}
function gcd(left: bigint, right: bigint): bigint {
  let a = left < 0n ? -left : left; let b = right < 0n ? -right : right
  while (b !== 0n) { const next = a % b; a = b; b = next }
  return a
}
function reducedRatio(numerator: bigint, denominator: bigint): { numerator: bigint; denominator: bigint } {
  if (numerator <= 0n || denominator <= 0n) throw new TypeError("CPU ratio must be positive")
  const divisor = gcd(numerator, denominator)
  return { numerator: numerator / divisor, denominator: denominator / divisor }
}
function compareRatio(left: { numerator: bigint; denominator: bigint }, right: { numerator: bigint; denominator: bigint }): number {
  const a = left.numerator * right.denominator; const b = right.numerator * left.denominator
  return a < b ? -1 : a > b ? 1 : 0
}
function parseCpuMax(value: string, label: string): ParsedCpuMax {
  const line = trimSingleLine(boundedString(value, label, KDO_H4_R3G_A_LIMITS.maxControlBytes), label)
  const match = /^(max|[1-9][0-9]*) ([1-9][0-9]*)$/.exec(line)
  if (!match) throw new TypeError(`${label} must use canonical '<quota|max> <period>' grammar`)
  const period = canonicalDecimal(match[2], `${label} period`, false)
  const quota = match[1] === "max" ? null : canonicalDecimal(match[1], `${label} quota`, false)
  return { quota, period }
}
function parseLimit(value: string, label: string): bigint | null {
  const line = trimSingleLine(boundedString(value, label, KDO_H4_R3G_A_LIMITS.maxControlBytes), label)
  if (line === "max") return null
  return canonicalDecimal(line, label)
}
function parseZero(value: string, label: string): void {
  const line = trimSingleLine(boundedString(value, label, KDO_H4_R3G_A_LIMITS.maxControlBytes), label)
  if (line !== "0") throw new TypeError(`${label} must be exactly 0`)
}
function parseCpuRanges(value: string, label: string): readonly CpuRange[] {
  const line = trimSingleLine(boundedString(value, label, KDO_H4_R3G_A_LIMITS.maxControlBytes), label)
  if (line.length === 0) throw new TypeError(`${label} must not be empty`)
  const pieces = line.split(",")
  if (pieces.length > KDO_H4_R3G_A_LIMITS.maxCpuRanges) throw new TypeError(`${label} exceeds CPU range bound`)
  const ranges: CpuRange[] = []; let previousEnd = -1
  for (const piece of pieces) {
    const match = /^([0-9]+)(?:-([0-9]+))?$/.exec(piece)
    if (!match) throw new TypeError(`${label} contains malformed CPU range`)
    const start = Number(canonicalDecimal(match[1], `${label} CPU start`)); const end = match[2] === undefined ? start : Number(canonicalDecimal(match[2], `${label} CPU end`))
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || end > KDO_H4_R3G_A_LIMITS.maxCpuId) throw new TypeError(`${label} CPU range is outside bound`)
    if (start <= previousEnd) throw new TypeError(`${label} CPU ranges must be sorted and non-overlapping`)
    ranges.push(Object.freeze({ start, end })); previousEnd = end
  }
  return Object.freeze(ranges)
}
function intersectCpuRanges(left: readonly CpuRange[], right: readonly CpuRange[]): readonly CpuRange[] {
  const output: CpuRange[] = []; let li = 0; let ri = 0
  while (li < left.length && ri < right.length) {
    const start = Math.max(left[li].start, right[ri].start); const end = Math.min(left[li].end, right[ri].end)
    if (start <= end) output.push(Object.freeze({ start, end }))
    if (left[li].end < right[ri].end) li += 1; else ri += 1
  }
  return Object.freeze(output)
}
function cpuRangeCount(ranges: readonly CpuRange[]): number {
  let total = 0
  for (const range of ranges) { total += range.end - range.start + 1; if (!Number.isSafeInteger(total) || total > KDO_H4_R3G_A_LIMITS.maxCpuId + 1) throw new TypeError("CPU set count exceeds authorized bound") }
  return total
}
function canonicalCpuRanges(ranges: readonly CpuRange[]): string { return ranges.map((range) => range.start === range.end ? String(range.start) : `${range.start}-${range.end}`).join(",") }
function parseProcStat(value: string): ProcStatSubject {
  const text = trimSingleLine(boundedString(value, "/proc pid stat", KDO_H4_R3G_A_LIMITS.maxProcStatBytes), "/proc pid stat")
  const openIndex = text.indexOf(" ("); const closeIndex = text.lastIndexOf(") ")
  if (openIndex <= 0 || closeIndex <= openIndex + 1) throw new TypeError("/proc pid stat command field is malformed")
  const pidText = text.slice(0, openIndex); const pidBig = canonicalDecimal(pidText, "/proc pid stat pid", false); const pid = Number(pidBig)
  positivePid(pid, "/proc pid stat pid")
  const suffix = text.slice(closeIndex + 2)
  if (suffix.length < 3 || suffix[1] !== " ") throw new TypeError("/proc pid stat state field is malformed")
  const fields = suffix.slice(2).split(" ")
  if (fields.length < 38 || fields.some((field) => field.length === 0)) throw new TypeError("/proc pid stat does not contain required fields")
  const startTicks = fields[18]; canonicalDecimal(startTicks, "/proc pid stat start_time")
  const rtPriorityBig = canonicalDecimal(fields[36], "/proc pid stat rt_priority"); const policyBig = canonicalDecimal(fields[37], "/proc pid stat policy")
  if (rtPriorityBig > 2_147_483_647n || policyBig > 2_147_483_647n) throw new TypeError("/proc pid stat scheduler fields exceed bound")
  return Object.freeze({ pid, startTicks, rtPriority: Number(rtPriorityBig), policy: Number(policyBig) })
}
function parseProcStatusCpuRanges(value: string): readonly CpuRange[] {
  const text = boundedString(value, "/proc pid status", KDO_H4_R3G_A_LIMITS.maxProcStatusBytes)
  const matches = text.split(/\n/).filter((line) => line.startsWith("Cpus_allowed_list:"))
  if (matches.length !== 1) throw new TypeError("/proc pid status must contain exactly one Cpus_allowed_list field")
  const raw = matches[0].slice("Cpus_allowed_list:".length).trim()
  return parseCpuRanges(raw, "Cpus_allowed_list")
}
function parseProcCgroupPath(value: string): string {
  const text = boundedString(value, "/proc pid cgroup", KDO_H4_R3G_A_LIMITS.maxProcCgroupBytes)
  const lines = text.split(/\n/).filter((line) => line.length !== 0)
  if (lines.length !== 1) throw new TypeError("/proc pid cgroup must contain exactly one unified v2 entry")
  const match = /^0::(\/.*)$/.exec(lines[0])
  if (!match) throw new TypeError("/proc pid cgroup must be the unified v2 0::/path form")
  return canonicalCgroupPath(match[1])
}
function parseCanonicalCgroup2Mount(value: string): { readonly mountIdentity: string } {
  const text = boundedString(value, "/proc/self/mountinfo", KDO_H4_R3G_A_LIMITS.maxMountInfoBytes)
  const matches: string[] = []
  for (const line of text.split(/\n/).filter(Boolean)) {
    const fields = line.split(" "); const separator = fields.indexOf("-")
    if (separator < 6 || separator + 3 > fields.length) continue
    if (fields[separator + 1] !== "cgroup2") continue
    matches.push(JSON.stringify({ root: fields[3], mountpoint: fields[4], source: fields[separator + 2], superOptions: fields.slice(separator + 3).join(" ") }))
  }
  if (matches.length !== 1) throw new TypeError("observer must see exactly one cgroup2 mount")
  const parsed = JSON.parse(matches[0]) as { root: string; mountpoint: string; source: string; superOptions: string }
  if (parsed.root !== "/" || parsed.mountpoint !== KDO_H4_R3G_A_CGROUP_ROOT) throw new TypeError("cgroup2 mount must use root=/ at /sys/fs/cgroup")
  return Object.freeze({ mountIdentity: sha256Domain("CGROUP2_MOUNT", matches[0]) })
}
function expectedHierarchyPaths(target: string): readonly string[] {
  const canonical = canonicalCgroupPath(target); const output: string[] = [canonical]
  let current = canonical
  while (current !== "/") {
    current = posix.dirname(current)
    output.push(current)
    if (output.length > KDO_H4_R3G_A_LIMITS.maxHierarchyDepth) throw new TypeError("cgroup hierarchy exceeds authorized depth")
  }
  return Object.freeze(output)
}
export function cgroupV2FilesystemPath(cgroupPath: string): string {
  const canonical = canonicalCgroupPath(cgroupPath)
  return canonical === "/" ? KDO_H4_R3G_A_CGROUP_ROOT : `${KDO_H4_R3G_A_CGROUP_ROOT}${canonical}`
}
export function cgroupV2HierarchyPaths(cgroupPath: string): readonly string[] { return expectedHierarchyPaths(cgroupPath) }
function parseTargetProcs(value: string, expectedPid: number): { readonly identity: string } {
  const text = boundedString(value, "cgroup.procs", KDO_H4_R3G_A_LIMITS.maxCgroupProcsBytes, true)
  const lines = text.split(/\n/).filter(Boolean)
  if (lines.length > KDO_H4_R3G_A_LIMITS.maxPidTokens) throw new TypeError("cgroup.procs exceeds PID token bound")
  const pids: number[] = []
  for (const line of lines) {
    const pidBig = canonicalDecimal(line, "cgroup.procs PID", false); const pid = Number(pidBig); positivePid(pid, "cgroup.procs PID"); pids.push(pid)
  }
  const unique = [...new Set(pids)].sort((left, right) => left - right)
  if (unique.length !== pids.length) throw new TypeError("cgroup.procs contains duplicate PID tokens")
  if (!unique.includes(expectedPid)) throw new TypeError("exact R3E PID is not a member of target cgroup.procs")
  return Object.freeze({ identity: sha256Domain("TARGET_PROCS", JSON.stringify(unique)) })
}
function parseRawLevel(value: unknown, expectedPath: string): {
  readonly observation: GvisorCgroupV2LevelObservation
  readonly cpu: ParsedCpuMax
  readonly cpuRanges: readonly CpuRange[]
  readonly memoryMax: bigint | null
  readonly memorySwapMax: bigint | null
} {
  const record = asPlainRecord(value, "cgroup level")
  exactKeys(record, ["path", "cgroupType", "cpuMax", "cpuMaxBurst", "cpusetCpusEffective", "memoryMax", "memorySwapMax"], "cgroup level")
  const path = canonicalLevelPath(record.path)
  if (path !== expectedPath) throw new TypeError("cgroup level path does not match canonical hierarchy")
  const cgroupType = trimSingleLine(boundedString(record.cgroupType, "cgroup.type", KDO_H4_R3G_A_LIMITS.maxControlBytes), "cgroup.type")
  if (cgroupType !== "domain") throw new TypeError("R3G-A v1 requires cgroup.type=domain throughout the hierarchy")
  const cpu = parseCpuMax(boundedString(record.cpuMax, "cpu.max", KDO_H4_R3G_A_LIMITS.maxControlBytes), "cpu.max")
  parseZero(boundedString(record.cpuMaxBurst, "cpu.max.burst", KDO_H4_R3G_A_LIMITS.maxControlBytes), "cpu.max.burst")
  const cpuRanges = parseCpuRanges(boundedString(record.cpusetCpusEffective, "cpuset.cpus.effective", KDO_H4_R3G_A_LIMITS.maxControlBytes), "cpuset.cpus.effective")
  const memoryMax = parseLimit(boundedString(record.memoryMax, "memory.max", KDO_H4_R3G_A_LIMITS.maxControlBytes), "memory.max")
  const memorySwapMax = parseLimit(boundedString(record.memorySwapMax, "memory.swap.max", KDO_H4_R3G_A_LIMITS.maxControlBytes), "memory.swap.max")
  const base = Object.freeze({
    path,
    cpuQuota: cpu.quota === null ? null : cpu.quota.toString(),
    cpuPeriod: cpu.period.toString(),
    cpuMaxBurst: "0",
    cpusetCpusEffective: canonicalCpuRanges(cpuRanges),
    memoryMax: memoryMax === null ? null : memoryMax.toString(),
    memorySwapMax: memorySwapMax === null ? null : memorySwapMax.toString(),
  })
  const observation = Object.freeze({ ...base, levelIdentity: sha256Domain("CGROUP_LEVEL", JSON.stringify(base)) })
  return { observation, cpu, cpuRanges, memoryMax, memorySwapMax }
}
function effectiveFiniteRatio(values: readonly ParsedCpuMax[]): { numerator: bigint; denominator: bigint } {
  let effective: { numerator: bigint; denominator: bigint } | undefined
  for (const value of values) {
    if (value.quota === null) continue
    const ratio = reducedRatio(value.quota, value.period)
    if (effective === undefined || compareRatio(ratio, effective) < 0) effective = ratio
  }
  if (effective === undefined) throw new TypeError("CPU hierarchy has no finite physical cpu.max ceiling")
  return effective
}
function effectiveFiniteLimit(values: readonly (bigint | null)[], label: string): bigint {
  let effective: bigint | undefined
  for (const value of values) if (value !== null && (effective === undefined || value < effective)) effective = value
  if (effective === undefined) throw new TypeError(`${label} hierarchy has no finite physical ceiling`)
  return effective
}
function snapshotPreimage(input: Omit<GvisorCgroupV2PhysicalResourceSnapshot, "snapshotIdentity">): string { return JSON.stringify(input) }

export function createGvisorCgroupV2PhysicalResourceSnapshot(input: {
  requirement: SandboxExecutionRequirement
  expectedPid: number
  expectedStartTicks: string
  raw: GvisorCgroupV2RawSnapshot
}): GvisorCgroupV2PhysicalResourceSnapshot {
  const top = asPlainRecord(input, "R3G-A physical snapshot input")
  exactKeys(top, ["requirement", "expectedPid", "expectedStartTicks", "raw"], "R3G-A physical snapshot input")
  const requirement = validateSandboxExecutionRequirement(top.requirement)
  if (requirement.requiredSemanticRuntimeClass !== "gvisor") throw new TypeError("R3G-A requires gvisor")
  const expectedPid = positivePid(top.expectedPid, "expectedPid")
  const expectedStartTicks = canonicalDecimalValue(top.expectedStartTicks, "expectedStartTicks")
  const raw = asPlainRecord(top.raw, "R3G-A raw snapshot")
  exactKeys(raw, ["mountInfo", "procStat", "procStatus", "procCgroup", "targetCgroupProcs", "levels"], "R3G-A raw snapshot")
  const mount = parseCanonicalCgroup2Mount(boundedString(raw.mountInfo, "mountInfo", KDO_H4_R3G_A_LIMITS.maxMountInfoBytes))
  const subject = parseProcStat(boundedString(raw.procStat, "procStat", KDO_H4_R3G_A_LIMITS.maxProcStatBytes))
  if (subject.pid !== expectedPid || subject.startTicks !== expectedStartTicks) throw new TypeError("R3G-A /proc subject does not match exact R3E PID/startTicks")
  if (subject.policy !== 0 || subject.rtPriority !== 0) throw new TypeError("R3G-A v1 requires SCHED_OTHER policy=0 and rt_priority=0")
  const processCpuRanges = parseProcStatusCpuRanges(boundedString(raw.procStatus, "procStatus", KDO_H4_R3G_A_LIMITS.maxProcStatusBytes))
  const cgroupPath = parseProcCgroupPath(boundedString(raw.procCgroup, "procCgroup", KDO_H4_R3G_A_LIMITS.maxProcCgroupBytes))
  const hierarchyPaths = expectedHierarchyPaths(cgroupPath)
  const rawLevels = asDenseArray(raw.levels, "R3G-A cgroup levels", KDO_H4_R3G_A_LIMITS.maxHierarchyDepth)
  if (rawLevels.length !== hierarchyPaths.length) throw new TypeError("R3G-A cgroup levels must cover target through root exactly")
  const parsedLevels = rawLevels.map((level, index) => parseRawLevel(level, hierarchyPaths[index]))
  const targetProcs = parseTargetProcs(boundedString(raw.targetCgroupProcs, "targetCgroupProcs", KDO_H4_R3G_A_LIMITS.maxCgroupProcsBytes, true), expectedPid)
  const effectiveCpu = effectiveFiniteRatio(parsedLevels.map((level) => level.cpu))
  const requiredCpu = reducedRatio(BigInt(requirement.workload.resourcePolicy.cpuMillis), 1000n)
  if (compareRatio(effectiveCpu, requiredCpu) !== 0) throw new TypeError("physical effective CPU ceiling does not exactly match required cpuMillis")
  let availableRanges = processCpuRanges
  for (const level of parsedLevels) availableRanges = intersectCpuRanges(availableRanges, level.cpuRanges)
  const availableCpuCount = cpuRangeCount(availableRanges)
  if (availableCpuCount <= 0 || BigInt(availableCpuCount) * 1000n < BigInt(requirement.workload.resourcePolicy.cpuMillis)) throw new TypeError("cpuset/process affinity is stricter than required CPU capacity")
  const effectiveMemory = effectiveFiniteLimit(parsedLevels.map((level) => level.memoryMax), "memory.max")
  if (effectiveMemory !== BigInt(requirement.workload.resourcePolicy.memoryBytes)) throw new TypeError("physical effective memory ceiling does not exactly match required memoryBytes")
  const effectiveSwap = effectiveFiniteLimit(parsedLevels.map((level) => level.memorySwapMax), "memory.swap.max")
  if (effectiveSwap !== 0n) throw new TypeError("physical effective swap ceiling must be exactly 0")
  const observations = Object.freeze(parsedLevels.map((level) => level.observation))
  const hierarchyIdentity = sha256Domain("HIERARCHY", JSON.stringify(observations.map((level) => level.levelIdentity)))
  const processCpuIdentity = sha256Domain("PROCESS_CPU", JSON.stringify({ pid: expectedPid, startTicks: expectedStartTicks, policy: subject.policy, rtPriority: subject.rtPriority, cpusAllowed: canonicalCpuRanges(processCpuRanges), effectiveAvailable: canonicalCpuRanges(availableRanges) }))
  const base = Object.freeze({
    version: KDO_H4_R3G_A_SNAPSHOT_VERSION,
    evidenceClass: KDO_H4_R3G_A_EVIDENCE_CLASS,
    requirementIdentity: requirement.requirementIdentity,
    pid: expectedPid,
    startTicks: expectedStartTicks,
    cgroupPath,
    mountIdentity: mount.mountIdentity,
    targetProcsIdentity: targetProcs.identity,
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
  const record = asPlainRecord(value, "R3G-A physical snapshot")
  exactKeys(record, ["version", "evidenceClass", "requirementIdentity", "pid", "startTicks", "cgroupPath", "mountIdentity", "targetProcsIdentity", "processCpuIdentity", "hierarchyIdentity", "levels", "effectiveCpuNumerator", "effectiveCpuDenominator", "availableCpuCount", "schedulerPolicy", "rtPriority", "effectiveMemoryBytes", "effectiveSwapBytes", "snapshotIdentity"], "R3G-A physical snapshot")
  if (record.version !== KDO_H4_R3G_A_SNAPSHOT_VERSION || record.evidenceClass !== KDO_H4_R3G_A_EVIDENCE_CLASS) throw new TypeError("R3G-A physical snapshot version/evidence class mismatch")
  const levelsRaw = asDenseArray(record.levels, "R3G-A physical snapshot levels", KDO_H4_R3G_A_LIMITS.maxHierarchyDepth)
  const levels = Object.freeze(levelsRaw.map((value, index) => {
    const level = asPlainRecord(value, `R3G-A physical snapshot level ${index}`)
    exactKeys(level, ["path", "cpuQuota", "cpuPeriod", "cpuMaxBurst", "cpusetCpusEffective", "memoryMax", "memorySwapMax", "levelIdentity"], `R3G-A physical snapshot level ${index}`)
    const base = Object.freeze({
      path: canonicalLevelPath(level.path),
      cpuQuota: level.cpuQuota === null ? null : canonicalDecimalValue(level.cpuQuota, "cpuQuota"),
      cpuPeriod: canonicalDecimalValue(level.cpuPeriod, "cpuPeriod"),
      cpuMaxBurst: level.cpuMaxBurst === "0" ? "0" : (() => { throw new TypeError("cpuMaxBurst must be 0") })(),
      cpusetCpusEffective: canonicalCpuRanges(parseCpuRanges(level.cpusetCpusEffective as string, "cpusetCpusEffective")),
      memoryMax: level.memoryMax === null ? null : canonicalDecimalValue(level.memoryMax, "memoryMax"),
      memorySwapMax: level.memorySwapMax === null ? null : canonicalDecimalValue(level.memorySwapMax, "memorySwapMax"),
    })
    const expected = sha256Domain("CGROUP_LEVEL", JSON.stringify(base))
    if (identity(level.levelIdentity, "levelIdentity") !== expected) throw new TypeError("R3G-A cgroup level identity mismatch")
    return Object.freeze({ ...base, levelIdentity: expected })
  }))
  const base = Object.freeze({
    version: KDO_H4_R3G_A_SNAPSHOT_VERSION,
    evidenceClass: KDO_H4_R3G_A_EVIDENCE_CLASS,
    requirementIdentity: identity(record.requirementIdentity, "requirementIdentity"),
    pid: positivePid(record.pid),
    startTicks: canonicalDecimalValue(record.startTicks, "startTicks"),
    cgroupPath: canonicalCgroupPath(record.cgroupPath),
    mountIdentity: identity(record.mountIdentity, "mountIdentity"),
    targetProcsIdentity: identity(record.targetProcsIdentity, "targetProcsIdentity"),
    processCpuIdentity: identity(record.processCpuIdentity, "processCpuIdentity"),
    hierarchyIdentity: identity(record.hierarchyIdentity, "hierarchyIdentity"),
    levels,
    effectiveCpuNumerator: canonicalDecimalValue(record.effectiveCpuNumerator, "effectiveCpuNumerator"),
    effectiveCpuDenominator: canonicalDecimalValue(record.effectiveCpuDenominator, "effectiveCpuDenominator"),
    availableCpuCount: (() => { const value = record.availableCpuCount; if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0 || value > KDO_H4_R3G_A_LIMITS.maxCpuId + 1) throw new TypeError("availableCpuCount is invalid"); return value })(),
    schedulerPolicy: record.schedulerPolicy === 0 ? 0 as const : (() => { throw new TypeError("schedulerPolicy must be 0") })(),
    rtPriority: record.rtPriority === 0 ? 0 as const : (() => { throw new TypeError("rtPriority must be 0") })(),
    effectiveMemoryBytes: canonicalDecimalValue(record.effectiveMemoryBytes, "effectiveMemoryBytes"),
    effectiveSwapBytes: record.effectiveSwapBytes === "0" ? "0" as const : (() => { throw new TypeError("effectiveSwapBytes must be 0") })(),
  })
  const expected = sha256Domain("PHYSICAL_SNAPSHOT", snapshotPreimage(base))
  if (identity(record.snapshotIdentity, "snapshotIdentity") !== expected) throw new TypeError("R3G-A physical snapshot identity mismatch")
  return Object.freeze({ ...base, snapshotIdentity: expected })
}

export function createGvisorCgroupV2ObserverProtocolIdentity(): string {
  return sha256Domain("OBSERVER_PROTOCOL", JSON.stringify({
    version: KDO_H4_R3G_A_VERSION,
    capability: KDO_H4_R3G_A_CAPABILITY,
    linuxSemanticBaseline: "linux-v6.12",
    gvisorSemanticBaseline: "50e1502a95d36ad2faf2c7ef33b8bf21fe975293",
    cgroupRoot: KDO_H4_R3G_A_CGROUP_ROOT,
    theorem: "domain-fair-cpu-memory-noswap-exact-v1",
  }))
}
function resourceRecordPreimage(input: Omit<GvisorCgroupV2ResourceRecord, "resourceCandidateIdentity">): string { return JSON.stringify(input) }

export function createGvisorCgroupV2ResourceRecord(input: {
  requirement: SandboxExecutionRequirement
  lineage: GvisorRuntimeLineageRecord
  lineageCommit: GvisorRuntimeLineageCommit
  process: GvisorProcessObservation
  snapshot: GvisorCgroupV2PhysicalResourceSnapshot
}): GvisorCgroupV2ResourceRecord {
  const top = asPlainRecord(input, "R3G-A resource record input")
  exactKeys(top, ["requirement", "lineage", "lineageCommit", "process", "snapshot"], "R3G-A resource record input")
  const requirement = validateSandboxExecutionRequirement(top.requirement)
  const lineage = validateGvisorRuntimeLineageRecord(top.lineage)
  const lineageCommit = validateGvisorRuntimeLineageCommit(top.lineageCommit, lineage)
  const process = validateGvisorProcessObservation(top.process)
  const snapshot = validateGvisorCgroupV2PhysicalResourceSnapshot(top.snapshot)
  if (lineage.requirementIdentity !== requirement.requirementIdentity || lineage.workloadIdentity !== requirement.workload.workloadIdentity) throw new TypeError("R3G-A lineage does not match requirement")
  if (snapshot.requirementIdentity !== requirement.requirementIdentity) throw new TypeError("R3G-A physical snapshot does not match requirement")
  if (process.processIdentity !== lineage.processIdentity || process.pid !== snapshot.pid || process.startTicks !== snapshot.startTicks) throw new TypeError("R3G-A physical subject does not match canonical R3E process lineage")
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
    subjectPid: snapshot.pid,
    subjectStartTicks: snapshot.startTicks,
    cgroupPath: snapshot.cgroupPath,
    hierarchyIdentity: snapshot.hierarchyIdentity,
    physicalSnapshotIdentity: snapshot.snapshotIdentity,
    effectiveCpuNumerator: snapshot.effectiveCpuNumerator,
    effectiveCpuDenominator: snapshot.effectiveCpuDenominator,
    availableCpuCount: snapshot.availableCpuCount,
    effectiveMemoryBytes: snapshot.effectiveMemoryBytes,
    effectiveSwapBytes: snapshot.effectiveSwapBytes,
  })
  return Object.freeze({ ...base, resourceCandidateIdentity: sha256Domain("RESOURCE_RECORD", resourceRecordPreimage(base)) })
}

export function validateGvisorCgroupV2ResourceRecord(value: unknown): GvisorCgroupV2ResourceRecord {
  const record = asPlainRecord(value, "R3G-A resource record")
  exactKeys(record, ["version", "evidenceClass", "executionAttemptIdentity", "requirementIdentity", "workloadIdentity", "containerBindingIdentity", "containerId", "r3eRecordIdentity", "r3eCommitIdentity", "runtimeInstanceIdentity", "r3eObserverImplementationIdentity", "observerProtocolIdentity", "processIdentity", "subjectPid", "subjectStartTicks", "cgroupPath", "hierarchyIdentity", "physicalSnapshotIdentity", "effectiveCpuNumerator", "effectiveCpuDenominator", "availableCpuCount", "effectiveMemoryBytes", "effectiveSwapBytes", "resourceCandidateIdentity"], "R3G-A resource record")
  if (record.version !== KDO_H4_R3G_A_RECORD_VERSION || record.evidenceClass !== KDO_H4_R3G_A_EVIDENCE_CLASS) throw new TypeError("R3G-A resource record version/evidence class mismatch")
  const base = Object.freeze({
    version: KDO_H4_R3G_A_RECORD_VERSION,
    evidenceClass: KDO_H4_R3G_A_EVIDENCE_CLASS,
    executionAttemptIdentity: identity(record.executionAttemptIdentity, "executionAttemptIdentity"),
    requirementIdentity: identity(record.requirementIdentity, "requirementIdentity"),
    workloadIdentity: identity(record.workloadIdentity, "workloadIdentity"),
    containerBindingIdentity: identity(record.containerBindingIdentity, "containerBindingIdentity"),
    containerId: identity(record.containerId, "containerId"),
    r3eRecordIdentity: identity(record.r3eRecordIdentity, "r3eRecordIdentity"),
    r3eCommitIdentity: identity(record.r3eCommitIdentity, "r3eCommitIdentity"),
    runtimeInstanceIdentity: identity(record.runtimeInstanceIdentity, "runtimeInstanceIdentity"),
    r3eObserverImplementationIdentity: identity(record.r3eObserverImplementationIdentity, "r3eObserverImplementationIdentity"),
    observerProtocolIdentity: identity(record.observerProtocolIdentity, "observerProtocolIdentity"),
    processIdentity: identity(record.processIdentity, "processIdentity"),
    subjectPid: positivePid(record.subjectPid, "subjectPid"),
    subjectStartTicks: canonicalDecimalValue(record.subjectStartTicks, "subjectStartTicks"),
    cgroupPath: canonicalCgroupPath(record.cgroupPath),
    hierarchyIdentity: identity(record.hierarchyIdentity, "hierarchyIdentity"),
    physicalSnapshotIdentity: identity(record.physicalSnapshotIdentity, "physicalSnapshotIdentity"),
    effectiveCpuNumerator: canonicalDecimalValue(record.effectiveCpuNumerator, "effectiveCpuNumerator"),
    effectiveCpuDenominator: canonicalDecimalValue(record.effectiveCpuDenominator, "effectiveCpuDenominator"),
    availableCpuCount: (() => { const value = record.availableCpuCount; if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) throw new TypeError("availableCpuCount is invalid"); return value })(),
    effectiveMemoryBytes: canonicalDecimalValue(record.effectiveMemoryBytes, "effectiveMemoryBytes"),
    effectiveSwapBytes: record.effectiveSwapBytes === "0" ? "0" as const : (() => { throw new TypeError("effectiveSwapBytes must be 0") })(),
  })
  const expected = sha256Domain("RESOURCE_RECORD", resourceRecordPreimage(base))
  if (identity(record.resourceCandidateIdentity, "resourceCandidateIdentity") !== expected) throw new TypeError("R3G-A resource record identity mismatch")
  return Object.freeze({ ...base, resourceCandidateIdentity: expected })
}

export function createGvisorCgroupV2ResourceCommit(record: GvisorCgroupV2ResourceRecord): GvisorCgroupV2ResourceCommit {
  const checked = validateGvisorCgroupV2ResourceRecord(record)
  const base = Object.freeze({ version: KDO_H4_R3G_A_COMMIT_VERSION, recordIdentity: checked.resourceCandidateIdentity })
  return Object.freeze({ ...base, commitIdentity: sha256Domain("RESOURCE_COMMIT", checked.resourceCandidateIdentity) })
}
export function validateGvisorCgroupV2ResourceCommit(value: unknown, expectedRecord: GvisorCgroupV2ResourceRecord): GvisorCgroupV2ResourceCommit {
  const record = asPlainRecord(value, "R3G-A resource commit")
  exactKeys(record, ["version", "recordIdentity", "commitIdentity"], "R3G-A resource commit")
  if (record.version !== KDO_H4_R3G_A_COMMIT_VERSION) throw new TypeError("R3G-A resource commit version mismatch")
  const expected = createGvisorCgroupV2ResourceCommit(expectedRecord)
  if (identity(record.recordIdentity, "resource commit recordIdentity") !== expected.recordIdentity || identity(record.commitIdentity, "resource commitIdentity") !== expected.commitIdentity) throw new TypeError("R3G-A resource commit identity mismatch")
  return expected
}
export function validateGvisorCgroupV2RuntimeConfig(value: unknown): GvisorCgroupV2RuntimeConfig {
  const record = asPlainRecord(value, "R3G-A runtime config")
  exactKeys(record, ["version", "commitResourceEvidence"], "R3G-A runtime config")
  if (record.version !== KDO_H4_R3G_A_RUNTIME_CONFIG_VERSION) throw new TypeError("R3G-A runtime config version mismatch")
  if (typeof record.commitResourceEvidence !== "function") throw new TypeError("R3G-A commitResourceEvidence must be a function")
  return Object.freeze({ version: KDO_H4_R3G_A_RUNTIME_CONFIG_VERSION, commitResourceEvidence: record.commitResourceEvidence as GvisorCgroupV2RuntimeConfig["commitResourceEvidence"] })
}
