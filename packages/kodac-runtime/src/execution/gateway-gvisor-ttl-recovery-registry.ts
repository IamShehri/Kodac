import { constants } from "node:fs"
import { open, readFile, readdir, type FileHandle } from "node:fs/promises"
import { posix } from "node:path"

import {
  parseGvisorTtlPhysicalArmReplayRecord,
  type GvisorTtlPhysicalArmReplayRecord,
} from "./gateway-gvisor-ttl-arm-replay.ts"
import {
  parseGvisorTtlPhysicalLeaseRecord,
  parseGvisorTtlPhysicalOwnerClaimRecord,
  parseGvisorTtlPhysicalTerminalRecord,
  type GvisorTtlPhysicalClockContinuity,
  type GvisorTtlPhysicalLeaseRecord,
  type GvisorTtlPhysicalOwnerClaim,
  type GvisorTtlPhysicalTerminalRecord,
} from "./gateway-gvisor-ttl-registry.ts"

const LIFECYCLE_FILE = /^([0-9a-f]{64})\.(lock|claim|lease|arm|terminal)$/
const LIFECYCLE_SUFFIX = /\.(?:lock|claim|lease|arm|terminal)$/
const MAX_PATH_BYTES = 4_096
const MAX_RECORD_BYTES = 16_384n
const MAX_REGISTRY_ENTRIES = 4_096

type RegistryKind = "lock" | "claim" | "lease" | "arm" | "terminal"
type Fingerprint = Readonly<{ dev: bigint; ino: bigint; size: bigint; mtimeNs: bigint; ctimeNs: bigint }>
type PinnedLeaf = Readonly<{ name: string; text: string | null; fingerprint: Fingerprint }>

export interface GvisorTtlPhysicalRecoverySnapshot {
  readonly armOperationIdentity: string
  readonly clockContinuity: GvisorTtlPhysicalClockContinuity
  readonly claim: GvisorTtlPhysicalOwnerClaim
  readonly lease: GvisorTtlPhysicalLeaseRecord
  readonly terminal: GvisorTtlPhysicalTerminalRecord | null
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

function sameNames(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((name, index) => name === right[index])
}

async function currentLinuxBootId(): Promise<string> {
  const value = (await readFile("/proc/sys/kernel/random/boot_id", "utf8")).trim()
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value)) throw new TypeError("R3G-D Linux boot id is not canonical")
  return value
}

async function listRegistryNames(procRoot: string): Promise<readonly string[]> {
  const names = await readdir(procRoot, { encoding: "utf8" })
  if (names.length > MAX_REGISTRY_ENTRIES) throw new TypeError("R3G-D recovery registry enumeration exceeds the internal recovery bound")
  for (const name of names) {
    if (LIFECYCLE_SUFFIX.test(name) && !LIFECYCLE_FILE.test(name)) throw new TypeError(`R3G-D recovery registry contains malformed lifecycle entry ${name}`)
  }
  return Object.freeze([...names].sort())
}

async function readPinnedLeaf(procRoot: string, name: string, euid: number, allowEmpty: boolean): Promise<PinnedLeaf> {
  let handle: FileHandle | undefined
  try {
    handle = await open(`${procRoot}/${name}`, constants.O_RDONLY | constants.O_NOFOLLOW)
    const before = await handle.stat({ bigint: true })
    if (!before.isFile() || before.uid !== BigInt(euid) || before.nlink !== 1n || (before.mode & 0o077n) !== 0n || before.size > MAX_RECORD_BYTES || (!allowEmpty && before.size === 0n)) {
      throw new TypeError(`R3G-D recovery registry leaf ${name} metadata is unsafe`)
    }
    const text = allowEmpty ? null : await handle.readFile({ encoding: "utf8" })
    const after = await handle.stat({ bigint: true })
    const beforeFingerprint = fingerprint(before as never)
    const afterFingerprint = fingerprint(after as never)
    if (!sameFingerprint(beforeFingerprint, afterFingerprint)) throw new TypeError(`R3G-D recovery registry leaf ${name} changed during read`)
    return Object.freeze({ name, text, fingerprint: afterFingerprint })
  } catch (error) {
    if (error instanceof TypeError) throw error
    throw new TypeError(`R3G-D recovery registry leaf ${name} is unavailable or unsafe`)
  } finally {
    await handle?.close().catch(() => {})
  }
}

async function assertPinnedLeafUnchanged(procRoot: string, leaf: PinnedLeaf, euid: number, allowEmpty: boolean): Promise<void> {
  const reread = await readPinnedLeaf(procRoot, leaf.name, euid, allowEmpty)
  if (!sameFingerprint(leaf.fingerprint, reread.fingerprint)) throw new TypeError(`R3G-D recovery registry leaf ${leaf.name} changed across snapshot`)
}

export async function inspectGvisorTtlPhysicalRecoveryRegistry(registryRootValue: string): Promise<readonly GvisorTtlPhysicalRecoverySnapshot[]> {
  if (process.platform !== "linux") throw new TypeError("R3G-D physical recovery registry inspection is Linux-only")
  const geteuid = process.geteuid
  if (typeof geteuid !== "function") throw new TypeError("R3G-D physical recovery registry inspection requires Linux effective uid")
  const euid = geteuid()
  const registryRoot = canonicalRegistryRoot(registryRootValue)
  let root: FileHandle | undefined
  try {
    // One retained root descriptor owns the entire recovery snapshot.  After
    // this open succeeds, the original registryRoot pathname is never resolved
    // again, so a rename/replacement cannot splice two registry generations.
    root = await open(registryRoot, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW)
    const rootBefore = await root.stat({ bigint: true })
    if (!rootBefore.isDirectory() || rootBefore.uid !== BigInt(euid) || (rootBefore.mode & 0o022n) !== 0n) throw new TypeError("R3G-D recovery registry root metadata is unsafe")
    const procRoot = `/proc/self/fd/${root.fd}`
    const beforeNames = await listRegistryNames(procRoot)
    const grouped = new Map<string, Set<RegistryKind>>()
    for (const name of beforeNames) {
      const match = LIFECYCLE_FILE.exec(name)
      if (match === null) continue
      const operation = match[1]
      const kind = match[2] as RegistryKind
      let kinds = grouped.get(operation)
      if (kinds === undefined) { kinds = new Set<RegistryKind>(); grouped.set(operation, kinds) }
      kinds.add(kind)
    }

    const boot = await currentLinuxBootId()
    const snapshots: GvisorTtlPhysicalRecoverySnapshot[] = []
    const retainedLeaves: Array<{ leaf: PinnedLeaf; allowEmpty: boolean }> = []
    for (const armOperationIdentity of [...grouped.keys()].sort()) {
      const kinds = grouped.get(armOperationIdentity) as Set<RegistryKind>
      if (kinds.has("lock")) retainedLeaves.push({ leaf: await readPinnedLeaf(procRoot, `${armOperationIdentity}.lock`, euid, true), allowEmpty: true })
      const hasDurableState = kinds.has("claim") || kinds.has("lease") || kinds.has("arm") || kinds.has("terminal")
      if (!hasDurableState) continue
      if (!kinds.has("lock") || !kinds.has("claim") || !kinds.has("lease")) throw new TypeError(`R3G-D recovery registry operation ${armOperationIdentity} has incomplete durable state`)

      const claimLeaf = await readPinnedLeaf(procRoot, `${armOperationIdentity}.claim`, euid, false)
      const leaseLeaf = await readPinnedLeaf(procRoot, `${armOperationIdentity}.lease`, euid, false)
      retainedLeaves.push({ leaf: claimLeaf, allowEmpty: false }, { leaf: leaseLeaf, allowEmpty: false })
      const claim = parseGvisorTtlPhysicalOwnerClaimRecord(claimLeaf.text as string)
      const lease = parseGvisorTtlPhysicalLeaseRecord(leaseLeaf.text as string, claim)
      if (claim.armOperationIdentity !== armOperationIdentity || lease.armOperationIdentity !== armOperationIdentity) throw new TypeError("R3G-D recovery registry filename does not match embedded arm operation identity")

      let armReplay: GvisorTtlPhysicalArmReplayRecord | null = null
      if (kinds.has("arm")) {
        const armLeaf = await readPinnedLeaf(procRoot, `${armOperationIdentity}.arm`, euid, false)
        retainedLeaves.push({ leaf: armLeaf, allowEmpty: false })
        armReplay = parseGvisorTtlPhysicalArmReplayRecord(armLeaf.text as string, lease)
        if (armReplay.armOperationIdentity !== armOperationIdentity) throw new TypeError("R3G-D recovery arm filename does not match embedded arm operation identity")
      }

      let terminal: GvisorTtlPhysicalTerminalRecord | null = null
      if (kinds.has("terminal")) {
        if (armReplay === null) throw new TypeError(`R3G-D terminal registry state ${armOperationIdentity} is missing durable physical arm replay`)
        const terminalLeaf = await readPinnedLeaf(procRoot, `${armOperationIdentity}.terminal`, euid, false)
        retainedLeaves.push({ leaf: terminalLeaf, allowEmpty: false })
        terminal = parseGvisorTtlPhysicalTerminalRecord(terminalLeaf.text as string, lease)
      }

      snapshots.push(Object.freeze({
        armOperationIdentity,
        clockContinuity: lease.linuxBootId === boot ? "SAME_BOOT" : "UNRECOVERABLE_CLOCK_DOMAIN",
        claim,
        lease,
        terminal,
        armReplay,
      }))
    }

    const afterNames = await listRegistryNames(procRoot)
    if (!sameNames(beforeNames, afterNames)) throw new TypeError("R3G-D physical recovery registry changed during snapshot")
    for (const entry of retainedLeaves) await assertPinnedLeafUnchanged(procRoot, entry.leaf, euid, entry.allowEmpty)
    const rootAfter = await root.stat({ bigint: true })
    if (rootBefore.dev !== rootAfter.dev || rootBefore.ino !== rootAfter.ino) throw new TypeError("R3G-D retained recovery registry root identity changed during snapshot")
    return Object.freeze(snapshots)
  } catch (error) {
    if (error instanceof TypeError) throw error
    throw new TypeError("R3G-D physical recovery registry inspection failed closed")
  } finally {
    await root?.close().catch(() => {})
  }
}
