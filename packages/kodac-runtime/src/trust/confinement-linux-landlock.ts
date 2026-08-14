import { createHash } from "node:crypto"
import { posix } from "node:path"
import { types as utilTypes } from "node:util"

import {
  createConfinementBackendDescriptor,
  type ConfinementBackendDescriptor,
  type ConfinementEnforcementResult,
} from "./confinement.ts"

export const KDO_H4_R2B_LINUX_LANDLOCK_PLAN_VERSION = "kodac-h4-r2b-linux-landlock-plan-v1" as const
export const KDO_H4_R2B_LINUX_LANDLOCK_PROBE_VERSION = "kodac-h4-r2b-linux-landlock-probe-v1" as const
export const KDO_H4_R2B_LINUX_LANDLOCK_CLAIM_SET = "kodac-linux-landlock-fs-v1" as const
export const KDO_H4_R2B_LINUX_LANDLOCK_FULL_CLAIM_ABI = 5 as const
export const KDO_H4_R2B_LINUX_LANDLOCK_LAUNCHER_FAILURE_EXIT = 125 as const

export const KDO_H4_R2B_DONOR_REPOSITORY = "deepseek-ai/deepseek-harness" as const
export const KDO_H4_R2B_DONOR_COMMIT = "47f943859bef60e4160492346772ded9b24f765a" as const
export const KDO_H4_R2B_DONOR_NATIVE_PATH = "native/landlock-run/packages/entry/src/main.c" as const
export const KDO_H4_R2B_DONOR_NATIVE_BLOB = "af0cc2a988b219a699f35aeb911dbd66f1946fd9" as const
export const KDO_H4_R2B_DONOR_PROFILE_PATH = "packages/sandbox/sandbox-local/src/profiles.ts" as const
export const KDO_H4_R2B_DONOR_PROFILE_BLOB = "5b76390319c9b0729cb64f3213e714ff2df702d7" as const
export const KDO_H4_R2B_DONOR_LICENSE_BLOB = "8187059c9a2f14902c3eb5ab18d207906794f3b3" as const

const MAX_PATH_BYTES = 4096
const MAX_ROOTS = 256
const MAX_ARG_ITEMS = 256
const MAX_ARG_BYTES = 64 * 1024
const MAX_ARGV_BYTES = 256 * 1024
const MAX_PROBE_OUTPUT_BYTES = 4096

export type LinuxLandlockConfinementMode = "read-only" | "workspace-write"

export interface LinuxLandlockLaunchPlan {
  version: typeof KDO_H4_R2B_LINUX_LANDLOCK_PLAN_VERSION
  claimSet: typeof KDO_H4_R2B_LINUX_LANDLOCK_CLAIM_SET
  planIdentity: string
  launcherPath: string
  mode: LinuxLandlockConfinementMode
  readOnlyRoots: readonly string[]
  readWriteRoots: readonly string[]
  targetArgv: readonly string[]
  launcherArgv: readonly string[]
}

export interface LinuxLandlockProbeClassification {
  version: typeof KDO_H4_R2B_LINUX_LANDLOCK_PROBE_VERSION
  claimSet: typeof KDO_H4_R2B_LINUX_LANDLOCK_CLAIM_SET
  observedAbi: number | null
  enforcement: ConfinementEnforcementResult
  reason: string
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

function byteLength(value: string): number {
  return Buffer.byteLength(value, "utf8")
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

function denseArrayValues(value: unknown, label: string, maxItems: number): unknown[] {
  if (!Array.isArray(value) || utilTypes.isProxy(value) || Object.getPrototypeOf(value) !== Array.prototype) {
    throw new TypeError(`${label} must be a non-proxy plain array`)
  }
  if (Object.getOwnPropertySymbols(value).length !== 0) throw new TypeError(`${label} must not contain symbol fields`)
  const descriptors = Object.getOwnPropertyDescriptors(value)
  const lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length")
  if (lengthDescriptor === undefined || !("value" in lengthDescriptor) || typeof lengthDescriptor.value !== "number") {
    throw new TypeError(`${label} length is invalid`)
  }
  const length = lengthDescriptor.value
  if (!Number.isInteger(length) || length < 0 || length > maxItems) throw new TypeError(`${label} exceeds ${maxItems} entries`)
  const allowedKeys = new Set(["length", ...Array.from({ length }, (_, index) => String(index))])
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (!allowedKeys.has(key)) throw new TypeError(`${label} contains an unexpected array field: ${key}`)
    if (key !== "length" && (descriptor.get !== undefined || descriptor.set !== undefined)) {
      throw new TypeError(`${label}[${key}] must be a data property`)
    }
  }
  const values: unknown[] = []
  for (let index = 0; index < length; index += 1) {
    const descriptor = descriptors[String(index)]
    if (descriptor === undefined || !("value" in descriptor)) throw new TypeError(`${label} must be dense`)
    values.push(descriptor.value)
  }
  return values
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
  const path = boundedString(value, label, MAX_PATH_BYTES)
  if (!posix.isAbsolute(path)) throw new TypeError(`${label} must be an absolute POSIX path`)
  if (path.length > 1 && path.endsWith("/")) throw new TypeError(`${label} must not contain a trailing slash`)
  if (posix.normalize(path) !== path) throw new TypeError(`${label} must be canonical`)
  return path
}

function canonicalRoots(value: unknown, label: string): readonly string[] {
  const entries = denseArrayValues(value, label, MAX_ROOTS)
  const roots = entries.map((entry, index) => absoluteCanonicalPath(entry, `${label}[${index}]`))
  const sorted = [...roots].sort()
  if (roots.some((root, index) => root !== sorted[index])) throw new TypeError(`${label} must be in canonical sorted order`)
  if (new Set(roots).size !== roots.length) throw new TypeError(`${label} must not contain duplicates`)
  return Object.freeze([...roots])
}

function canonicalTargetArgv(value: unknown): readonly string[] {
  const entries = denseArrayValues(value, "targetArgv", MAX_ARG_ITEMS)
  if (entries.length === 0) throw new TypeError("targetArgv must contain an executable")
  const argv = entries.map((entry, index) => boundedString(entry, `targetArgv[${index}]`, MAX_ARG_BYTES, index > 0))
  if (!posix.isAbsolute(argv[0] ?? "")) throw new TypeError("targetArgv[0] must be an absolute POSIX executable path")
  const totalBytes = argv.reduce((total, item) => total + byteLength(item), 0)
  if (totalBytes > MAX_ARGV_BYTES) throw new TypeError(`targetArgv exceeds ${MAX_ARGV_BYTES} UTF-8 bytes`)
  return Object.freeze([...argv])
}

function requireMode(value: unknown): LinuxLandlockConfinementMode {
  if (value !== "read-only" && value !== "workspace-write") {
    throw new TypeError("Linux Landlock backend supports only read-only or workspace-write")
  }
  return value
}

function planPreimage(input: Omit<LinuxLandlockLaunchPlan, "planIdentity" | "launcherArgv">): string {
  return JSON.stringify({
    version: input.version,
    claimSet: input.claimSet,
    launcherPath: input.launcherPath,
    mode: input.mode,
    readOnlyRoots: input.readOnlyRoots,
    readWriteRoots: input.readWriteRoots,
    targetArgv: input.targetArgv,
  })
}

export function createLinuxLandlockBackendDescriptor(): ConfinementBackendDescriptor {
  return createConfinementBackendDescriptor({
    name: "linux-landlock",
    revision: "h4-r2b-kodac-linux-landlock-fs-v1",
    platform: "linux",
    supportedModes: ["read-only", "workspace-write"],
  })
}

export function createLinuxLandlockLaunchPlan(input: {
  launcherPath: string
  mode: LinuxLandlockConfinementMode
  readOnlyRoots: string[]
  readWriteRoots: string[]
  targetArgv: string[]
}): LinuxLandlockLaunchPlan {
  const record = asPlainRecord(input, "Linux Landlock launch-plan input")
  exactKeys(record, ["launcherPath", "mode", "readOnlyRoots", "readWriteRoots", "targetArgv"], "Linux Landlock launch-plan input")

  const launcherPath = absoluteCanonicalPath(record.launcherPath, "launcherPath")
  const mode = requireMode(record.mode)
  const readOnlyRoots = canonicalRoots(record.readOnlyRoots, "readOnlyRoots")
  const readWriteRoots = canonicalRoots(record.readWriteRoots, "readWriteRoots")
  const targetArgv = canonicalTargetArgv(record.targetArgv)

  if (!readOnlyRoots.includes("/")) throw new TypeError("readOnlyRoots must include host root / for the H4-R2B file-effect profile")
  const overlap = readOnlyRoots.find((root) => readWriteRoots.includes(root))
  if (overlap !== undefined) throw new TypeError(`grant root cannot be both read-only and read-write: ${overlap}`)
  if (mode === "read-only" && readWriteRoots.some((root) => root !== "/dev/null")) {
    throw new TypeError("read-only mode permits no read-write root other than /dev/null")
  }
  if (mode === "workspace-write" && readWriteRoots.length === 0) {
    throw new TypeError("workspace-write mode requires at least one explicit read-write root")
  }

  const base = Object.freeze({
    version: KDO_H4_R2B_LINUX_LANDLOCK_PLAN_VERSION,
    claimSet: KDO_H4_R2B_LINUX_LANDLOCK_CLAIM_SET,
    launcherPath,
    mode,
    readOnlyRoots,
    readWriteRoots,
    targetArgv,
  })
  const launcherArgv = Object.freeze([
    ...readOnlyRoots.flatMap((root) => ["--ro", root]),
    ...readWriteRoots.flatMap((root) => ["--rw", root]),
    "--",
    ...targetArgv,
  ])
  return Object.freeze({ ...base, planIdentity: sha256(planPreimage(base)), launcherArgv })
}

export function materializeLinuxLandlockInvocation(plan: LinuxLandlockLaunchPlan): { file: string; args: string[] } {
  const rebuilt = createLinuxLandlockLaunchPlan({
    launcherPath: plan.launcherPath,
    mode: plan.mode,
    readOnlyRoots: [...plan.readOnlyRoots],
    readWriteRoots: [...plan.readWriteRoots],
    targetArgv: [...plan.targetArgv],
  })
  if (rebuilt.planIdentity !== plan.planIdentity) throw new TypeError("Linux Landlock launch-plan identity mismatch")
  return { file: rebuilt.launcherPath, args: [...rebuilt.launcherArgv] }
}

function unavailable(reason: string): LinuxLandlockProbeClassification {
  return Object.freeze({
    version: KDO_H4_R2B_LINUX_LANDLOCK_PROBE_VERSION,
    claimSet: KDO_H4_R2B_LINUX_LANDLOCK_CLAIM_SET,
    observedAbi: null,
    enforcement: "unavailable",
    reason,
  })
}

export function classifyLinuxLandlockProbe(input: {
  exitCode: number
  stdout: string
  stderr: string
}): LinuxLandlockProbeClassification {
  const record = asPlainRecord(input, "Linux Landlock probe result")
  exactKeys(record, ["exitCode", "stdout", "stderr"], "Linux Landlock probe result")
  if (!Number.isInteger(record.exitCode) || (record.exitCode as number) < 0 || (record.exitCode as number) > 255) {
    throw new TypeError("probe exitCode must be an integer from 0 to 255")
  }
  if (typeof record.stdout !== "string" || typeof record.stderr !== "string") {
    throw new TypeError("probe stdout and stderr must be strings")
  }
  if (byteLength(record.stdout) > MAX_PROBE_OUTPUT_BYTES || byteLength(record.stderr) > MAX_PROBE_OUTPUT_BYTES) {
    return unavailable("probe output exceeded bounded H4-R2B evidence limits")
  }

  const exitCode = record.exitCode as number
  if (exitCode !== 0) return unavailable(`launcher probe failed with exit code ${exitCode}`)
  if (record.stderr.length !== 0) return unavailable("successful launcher probe produced unexpected stderr")

  const match = /^kodac-landlock-v1 abi=([1-9][0-9]*) claim-set=kodac-linux-landlock-fs-v1 enforcement=(full|partial)\n?$/.exec(record.stdout)
  if (match === null) return unavailable("launcher probe output did not match the exact H4-R2B contract")

  const observedAbi = Number(match[1])
  if (!Number.isSafeInteger(observedAbi) || observedAbi < 1) return unavailable("launcher probe reported an invalid Landlock ABI")
  const enforcement = match[2] as "full" | "partial"
  const expected = observedAbi >= KDO_H4_R2B_LINUX_LANDLOCK_FULL_CLAIM_ABI ? "full" : "partial"
  if (enforcement !== expected) return unavailable("launcher probe classification contradicted the observed Landlock ABI")

  return Object.freeze({
    version: KDO_H4_R2B_LINUX_LANDLOCK_PROBE_VERSION,
    claimSet: KDO_H4_R2B_LINUX_LANDLOCK_CLAIM_SET,
    observedAbi,
    enforcement,
    reason: `Landlock ABI ${observedAbi} ${enforcement === "full" ? "covers" : "partially covers"} ${KDO_H4_R2B_LINUX_LANDLOCK_CLAIM_SET}`,
  })
}
