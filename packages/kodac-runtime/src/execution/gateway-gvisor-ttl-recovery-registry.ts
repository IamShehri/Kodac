import { constants } from "node:fs"
import { open, readdir, type FileHandle } from "node:fs/promises"
import { posix } from "node:path"

import {
  parseGvisorTtlPhysicalArmReplayRecord,
  type GvisorTtlPhysicalArmReplayRecord,
} from "./gateway-gvisor-ttl-arm-replay.ts"
import {
  inspectGvisorTtlPhysicalRegistry,
  type GvisorTtlPhysicalRegistrySnapshot,
} from "./gateway-gvisor-ttl-registry.ts"

const ARM_FILE = /^([0-9a-f]{64})\.arm$/
const ARM_SUFFIX = /\.arm$/
const MAX_PATH_BYTES = 4_096
const MAX_RECORD_BYTES = 16_384n
const MAX_REGISTRY_ENTRIES = 4_096

type Fingerprint = Readonly<{ dev: bigint; ino: bigint; size: bigint; mtimeNs: bigint; ctimeNs: bigint }>
type ArmLeaf = Readonly<{ armOperationIdentity: string; fingerprint: Fingerprint; replay: GvisorTtlPhysicalArmReplayRecord }>

export interface GvisorTtlPhysicalRecoverySnapshot extends GvisorTtlPhysicalRegistrySnapshot {
  readonly armReplay: GvisorTtlPhysicalArmReplayRecord | null
}

function canonicalRegistryRoot(value: string): string {
  if (typeof value !== "string" || Buffer.byteLength(value, "utf8") > MAX_PATH_BYTES || value.includes("\0") || !posix.isAbsolute(value) || posix.normalize(value) !== value || (value.length > 1 && value.endsWith("/"))) {
    throw new TypeError("R3G-D recovery registryRoot must be a canonical bounded absolute POSIX path")
  }
  return value
}

function fingerprint(stat: Awaited<ReturnType<FileHandle["stat"]>>): Fingerprint {
  const value = stat as unknown as { dev: bigint; ino: bigint; size: bigint; mtimeNs: bigint; ctimeNs: bigint }
  return Object.freeze({ dev: value.dev, ino: value.ino, size: value.size, mtimeNs: value.mtimeNs, ctimeNs: value.ctimeNs })
}

function sameFingerprint(left: Fingerprint, right: Fingerprint): boolean {
  return left.dev === right.dev && left.ino === right.ino && left.size === right.size && left.mtimeNs === right.mtimeNs && left.ctimeNs === right.ctimeNs
}

function sameBaseSnapshot(left: GvisorTtlPhysicalRegistrySnapshot, right: GvisorTtlPhysicalRegistrySnapshot): boolean {
  return left.armOperationIdentity === right.armOperationIdentity &&
    left.clockContinuity === right.clockContinuity &&
    left.claim.claimRecordIdentity === right.claim.claimRecordIdentity &&
    left.lease.registryRecordIdentity === right.lease.registryRecordIdentity &&
    (left.terminal?.registryTerminalRecordIdentity ?? null) === (right.terminal?.registryTerminalRecordIdentity ?? null)
}

async function armNames(procRoot: string): Promise<readonly string[]> {
  const names = await readdir(procRoot, { encoding: "utf8" })
  if (names.length > MAX_REGISTRY_ENTRIES) throw new TypeError("R3G-D arm replay enumeration exceeds the internal recovery bound")
  for (const name of names) if (ARM_SUFFIX.test(name) && !ARM_FILE.test(name)) throw new TypeError(`R3G-D recovery registry contains malformed arm replay entry ${name}`)
  return Object.freeze(names.filter((name) => ARM_FILE.test(name)).sort())
}

async function readPinnedArmLeaf(procRoot: string, name: string, euid: number, lease: GvisorTtlPhysicalRegistrySnapshot["lease"]): Promise<ArmLeaf> {
  let handle: FileHandle | undefined
  try {
    handle = await open(`${procRoot}/${name}`, constants.O_RDONLY | constants.O_NOFOLLOW)
    const before = await handle.stat({ bigint: true })
    if (!before.isFile() || before.uid !== BigInt(euid) || before.nlink !== 1n || (before.mode & 0o077n) !== 0n || before.size === 0n || before.size > MAX_RECORD_BYTES) {
      throw new TypeError(`R3G-D arm replay leaf ${name} metadata is unsafe`)
    }
    const text = await handle.readFile({ encoding: "utf8" })
    const after = await handle.stat({ bigint: true })
    const beforeFingerprint = fingerprint(before as never)
    const afterFingerprint = fingerprint(after as never)
    if (!sameFingerprint(beforeFingerprint, afterFingerprint)) throw new TypeError(`R3G-D arm replay leaf ${name} changed during read`)
    const match = ARM_FILE.exec(name)
    if (match === null) throw new TypeError("R3G-D arm replay filename is not canonical")
    const replay = parseGvisorTtlPhysicalArmReplayRecord(text, lease)
    if (replay.armOperationIdentity !== match[1]) throw new TypeError("R3G-D arm replay filename does not match embedded operation identity")
    return Object.freeze({ armOperationIdentity: replay.armOperationIdentity, fingerprint: afterFingerprint, replay })
  } catch (error) {
    if (error instanceof TypeError) throw error
    throw new TypeError(`R3G-D arm replay leaf ${name} is unavailable or unsafe`)
  } finally {
    await handle?.close().catch(() => {})
  }
}

export async function inspectGvisorTtlPhysicalRecoveryRegistry(registryRootValue: string): Promise<readonly GvisorTtlPhysicalRecoverySnapshot[]> {
  if (process.platform !== "linux") throw new TypeError("R3G-D physical recovery registry inspection is Linux-only")
  const geteuid = process.geteuid
  if (typeof geteuid !== "function") throw new TypeError("R3G-D physical recovery registry inspection requires Linux effective uid")
  const euid = geteuid()
  const registryRoot = canonicalRegistryRoot(registryRootValue)
  const before = await inspectGvisorTtlPhysicalRegistry(registryRoot)
  const beforeByOperation = new Map(before.map((snapshot) => [snapshot.armOperationIdentity, snapshot] as const))

  let root: FileHandle | undefined
  let initialArmNames: readonly string[] = []
  const armLeaves = new Map<string, ArmLeaf>()
  try {
    root = await open(registryRoot, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW)
    const rootBefore = await root.stat({ bigint: true })
    if (!rootBefore.isDirectory() || rootBefore.uid !== BigInt(euid) || (rootBefore.mode & 0o022n) !== 0n) throw new TypeError("R3G-D recovery registry root metadata is unsafe")
    const procRoot = `/proc/self/fd/${root.fd}`
    initialArmNames = await armNames(procRoot)
    for (const name of initialArmNames) {
      const operation = (ARM_FILE.exec(name) as RegExpExecArray)[1]
      const base = beforeByOperation.get(operation)
      if (base === undefined) throw new TypeError(`R3G-D orphan physical arm replay ${operation} has no authoritative claim/lease state`)
      armLeaves.set(operation, await readPinnedArmLeaf(procRoot, name, euid, base.lease))
    }
    const afterArmNames = await armNames(procRoot)
    if (initialArmNames.length !== afterArmNames.length || initialArmNames.some((name, index) => name !== afterArmNames[index])) throw new TypeError("R3G-D physical arm replay set changed during recovery snapshot")
    for (const name of afterArmNames) {
      const operation = (ARM_FILE.exec(name) as RegExpExecArray)[1]
      const prior = armLeaves.get(operation)
      const base = beforeByOperation.get(operation)
      if (prior === undefined || base === undefined) throw new TypeError("R3G-D arm replay recovery state changed during snapshot")
      const reread = await readPinnedArmLeaf(procRoot, name, euid, base.lease)
      if (!sameFingerprint(prior.fingerprint, reread.fingerprint) || prior.replay.armRegistryRecordIdentity !== reread.replay.armRegistryRecordIdentity) throw new TypeError(`R3G-D arm replay ${operation} changed across recovery snapshot`)
    }
    const rootAfter = await root.stat({ bigint: true })
    if (rootBefore.dev !== rootAfter.dev || rootBefore.ino !== rootAfter.ino) throw new TypeError("R3G-D retained recovery registry root identity changed during snapshot")
  } finally {
    await root?.close().catch(() => {})
  }

  const after = await inspectGvisorTtlPhysicalRegistry(registryRoot)
  if (before.length !== after.length) throw new TypeError("R3G-D physical registry changed across arm replay recovery bracket")
  for (let index = 0; index < before.length; index += 1) if (!sameBaseSnapshot(before[index], after[index])) throw new TypeError("R3G-D physical registry changed across arm replay recovery bracket")

  return Object.freeze(before.map((snapshot) => {
    const armReplay = armLeaves.get(snapshot.armOperationIdentity)?.replay ?? null
    if (snapshot.terminal !== null && armReplay === null) throw new TypeError(`R3G-D terminal registry state ${snapshot.armOperationIdentity} is missing durable physical arm replay`)
    return Object.freeze({ ...snapshot, armReplay })
  }))
}