import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { chmod, mkdir, readdir, rename, rm, stat, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"

import { KDO_H4_R3G_D_PHYSICAL_ARM_REGISTRY_VERSION } from "../src/execution/gateway-gvisor-ttl-arm-replay.ts"
import { inspectGvisorTtlPhysicalRecoveryRegistry } from "../src/execution/gateway-gvisor-ttl-recovery-registry.ts"
import { createGvisorTtlWatchdogProtocolIdentity } from "../src/execution/gateway-gvisor-ttl.ts"

const SHA = (character: string) => character.repeat(64)
const LEASE_VERSION = "kodac-h4-r3g-d-watchdog-lease-v1"

async function writeRecord(path: string, text: string): Promise<void> {
  await writeFile(path, text, { encoding: "utf8", mode: 0o600 })
}

async function writeBaseRegistry(root: string, boot: string) {
  const armOperationIdentity = SHA("1")
  const canonicalArmPayloadDigest = SHA("2")
  const executionAttemptIdentity = SHA("3")
  const requirementIdentity = SHA("4")
  const workloadIdentity = SHA("5")
  const containerBindingIdentity = SHA("6")
  const containerId = SHA("7")
  const runtimeInstanceIdentity = SHA("8")
  const watchdogImplementationIdentity = SHA("9")
  const ownerInstanceIdentity = SHA("a")
  const terminalFenceToken = "1"
  const ttlMs = "60000"
  const leaseStartBoottimeNs = "1"
  const ownerUpdatedBoottimeNs = "2"
  const deadlineBoottimeNs = "60000000001"
  const clockDomainIdentity = createGvisorTtlWatchdogProtocolIdentity("CLOCK_DOMAIN", [boot, "CLOCK_BOOTTIME"])
  const leaseIdentity = createGvisorTtlWatchdogProtocolIdentity("LEASE", [armOperationIdentity, canonicalArmPayloadDigest, runtimeInstanceIdentity, boot, leaseStartBoottimeNs, deadlineBoottimeNs, watchdogImplementationIdentity])
  const claimRecordIdentity = createGvisorTtlWatchdogProtocolIdentity("OWNER_CLAIM", ["kodac-h4-r3g-d-owner-claim-v1", leaseIdentity, armOperationIdentity, ownerInstanceIdentity, terminalFenceToken, "ACTIVE", ownerUpdatedBoottimeNs, boot])
  const registryRecordIdentity = createGvisorTtlWatchdogProtocolIdentity("LEASE_REGISTRY", [
    LEASE_VERSION, armOperationIdentity, canonicalArmPayloadDigest, leaseIdentity, executionAttemptIdentity, requirementIdentity, workloadIdentity, containerBindingIdentity, containerId, runtimeInstanceIdentity, ttlMs, boot, clockDomainIdentity, leaseStartBoottimeNs, deadlineBoottimeNs, watchdogImplementationIdentity, ownerInstanceIdentity, terminalFenceToken, claimRecordIdentity,
  ])

  await writeRecord(join(root, `${armOperationIdentity}.lock`), "")
  await writeRecord(join(root, `${armOperationIdentity}.claim`), [
    "version=kodac-h4-r3g-d-owner-claim-v1",
    `leaseIdentity=${leaseIdentity}`,
    `armOperationIdentity=${armOperationIdentity}`,
    `ownerInstanceIdentity=${ownerInstanceIdentity}`,
    `terminalFenceToken=${terminalFenceToken}`,
    "ownerState=ACTIVE",
    `updatedBoottimeNs=${ownerUpdatedBoottimeNs}`,
    `linuxBootId=${boot}`,
    `claimRecordIdentity=${claimRecordIdentity}`,
    "",
  ].join("\n"))
  await writeRecord(join(root, `${armOperationIdentity}.lease`), [
    `version=${LEASE_VERSION}`,
    `armOperationIdentity=${armOperationIdentity}`,
    `canonicalArmPayloadDigest=${canonicalArmPayloadDigest}`,
    `leaseIdentity=${leaseIdentity}`,
    `executionAttemptIdentity=${executionAttemptIdentity}`,
    `requirementIdentity=${requirementIdentity}`,
    `workloadIdentity=${workloadIdentity}`,
    `containerBindingIdentity=${containerBindingIdentity}`,
    `containerId=${containerId}`,
    `runtimeInstanceIdentity=${runtimeInstanceIdentity}`,
    `ttlMs=${ttlMs}`,
    `linuxBootId=${boot}`,
    `clockDomainIdentity=${clockDomainIdentity}`,
    `leaseStartBoottimeNs=${leaseStartBoottimeNs}`,
    `deadlineBoottimeNs=${deadlineBoottimeNs}`,
    `watchdogImplementationIdentity=${watchdogImplementationIdentity}`,
    "physicalArmState=ARMED",
    `ownerInstanceIdentity=${ownerInstanceIdentity}`,
    `terminalFenceToken=${terminalFenceToken}`,
    `claimRecordIdentity=${claimRecordIdentity}`,
    `registryRecordIdentity=${registryRecordIdentity}`,
    "",
  ].join("\n"))

  return Object.freeze({
    armOperationIdentity,
    canonicalArmPayloadDigest,
    containerId,
    runtimeInstanceIdentity,
    ownerInstanceIdentity,
    terminalFenceToken,
    leaseStartBoottimeNs,
    deadlineBoottimeNs,
    clockDomainIdentity,
    claimRecordIdentity,
    leaseIdentity,
    registryRecordIdentity,
  })
}

async function writeForgedArm(root: string, base: Awaited<ReturnType<typeof writeBaseRegistry>>, boot: string): Promise<void> {
  const socketDevice = "10"
  const socketInode = "11"
  const peerPid = "4242"
  const peerUid = "1000"
  const peerGid = "1000"
  const processStartTicks = "12"
  const executableDevice = "13"
  const executableInode = "14"
  const executableSize = "15"
  const runscArtifactIdentity = SHA("b")
  const verifiedRunscSha256 = SHA("c")
  const controlPeerBindingIdentity = createGvisorTtlWatchdogProtocolIdentity("CONTROL_PEER", [base.runtimeInstanceIdentity, base.containerId, socketDevice, socketInode, peerPid, peerUid, peerGid, processStartTicks, executableDevice, executableInode, executableSize, verifiedRunscSha256])
  const retainedPidfdProcessIdentity = createGvisorTtlWatchdogProtocolIdentity("PIDFD_PROCESS", [peerPid, processStartTicks, executableDevice, executableInode, executableSize, base.runtimeInstanceIdentity])
  const retainedRunscExecutableIdentity = createGvisorTtlWatchdogProtocolIdentity("RUNSC_EXECUTABLE", [verifiedRunscSha256, executableDevice, executableInode, executableSize, runscArtifactIdentity])
  const physicalArmAcknowledgementIdentity = createGvisorTtlWatchdogProtocolIdentity("PHYSICAL_ARM_ACK", [base.leaseIdentity, base.armOperationIdentity, base.runtimeInstanceIdentity, controlPeerBindingIdentity, runscArtifactIdentity, verifiedRunscSha256, base.registryRecordIdentity, base.clockDomainIdentity, boot, base.ownerInstanceIdentity, base.claimRecordIdentity])
  const version = KDO_H4_R3G_D_PHYSICAL_ARM_REGISTRY_VERSION
  const armRegistryRecordIdentity = createGvisorTtlWatchdogProtocolIdentity("ARM_REGISTRY", [
    version, base.armOperationIdentity, base.canonicalArmPayloadDigest, base.leaseIdentity, base.runtimeInstanceIdentity, controlPeerBindingIdentity, socketDevice, socketInode, peerPid, peerUid, peerGid, processStartTicks, executableDevice, executableInode, executableSize, retainedPidfdProcessIdentity, runscArtifactIdentity, verifiedRunscSha256, retainedRunscExecutableIdentity, base.registryRecordIdentity, base.clockDomainIdentity, boot, base.leaseStartBoottimeNs, base.deadlineBoottimeNs, base.ownerInstanceIdentity, base.terminalFenceToken, base.claimRecordIdentity, physicalArmAcknowledgementIdentity,
  ])
  await writeRecord(join(root, `${base.armOperationIdentity}.arm`), [
    `version=${version}`,
    `armOperationIdentity=${base.armOperationIdentity}`,
    `canonicalArmPayloadDigest=${base.canonicalArmPayloadDigest}`,
    `leaseIdentity=${base.leaseIdentity}`,
    `runtimeInstanceIdentity=${base.runtimeInstanceIdentity}`,
    `controlPeerBindingIdentity=${controlPeerBindingIdentity}`,
    `socketDevice=${socketDevice}`,
    `socketInode=${socketInode}`,
    `peerPid=${peerPid}`,
    `peerUid=${peerUid}`,
    `peerGid=${peerGid}`,
    `processStartTicks=${processStartTicks}`,
    `executableDevice=${executableDevice}`,
    `executableInode=${executableInode}`,
    `executableSize=${executableSize}`,
    `retainedPidfdProcessIdentity=${retainedPidfdProcessIdentity}`,
    `runscArtifactIdentity=${runscArtifactIdentity}`,
    `verifiedRunscSha256=${verifiedRunscSha256}`,
    `retainedRunscExecutableIdentity=${retainedRunscExecutableIdentity}`,
    `watchdogRegistryRecordIdentity=${base.registryRecordIdentity}`,
    `clockDomainIdentity=${base.clockDomainIdentity}`,
    `linuxBootId=${boot}`,
    `leaseStartBoottimeNs=${base.leaseStartBoottimeNs}`,
    `deadlineBoottimeNs=${base.deadlineBoottimeNs}`,
    `ownerInstanceIdentity=${base.ownerInstanceIdentity}`,
    `terminalFenceToken=${base.terminalFenceToken}`,
    `claimRecordIdentity=${base.claimRecordIdentity}`,
    `physicalArmAcknowledgementIdentity=${physicalArmAcknowledgementIdentity}`,
    `armRegistryRecordIdentity=${armRegistryRecordIdentity}`,
    "",
  ].join("\n"))
}

async function waitForPinnedDirectory(dev: bigint, ino: bigint): Promise<void> {
  for (let attempt = 0; attempt < 2_000; attempt += 1) {
    for (const fd of await readdir("/proc/self/fd")) {
      try {
        const observed = await stat(`/proc/self/fd/${fd}`, { bigint: true })
        if (observed.isDirectory() && observed.dev === dev && observed.ino === ino) return
      } catch {}
    }
    await new Promise<void>((resolvePromise) => setImmediate(resolvePromise))
  }
  throw new Error("R3G-D test could not observe the retained registry root descriptor")
}

test("H4-R3G-D recovery snapshot cannot splice ARM replay from a replaced registry-root pathname", { skip: process.platform !== "linux", timeout: 30_000 }, async () => {
  const parent = join(tmpdir(), `kodac-r3gd-root-pin-${process.pid}-${Date.now()}`)
  const root = join(parent, "registry")
  const replacement = join(parent, "replacement")
  const oldRoot = join(parent, "registry-old")
  await mkdir(root, { recursive: true, mode: 0o700 })
  await mkdir(replacement, { mode: 0o700 })
  await chmod(root, 0o700)
  await chmod(replacement, 0o700)
  try {
    const boot = (await import("node:fs/promises")).readFile("/proc/sys/kernel/random/boot_id", "utf8").then((value) => value.trim())
    const bootId = await boot
    const originalBase = await writeBaseRegistry(root, bootId)
    const replacementBase = await writeBaseRegistry(replacement, bootId)
    assert.equal(replacementBase.registryRecordIdentity, originalBase.registryRecordIdentity)
    await writeForgedArm(replacement, replacementBase, bootId)

    for (let index = 0; index < 256; index += 1) {
      const identity = createHash("sha256").update(`padding-${index}`).digest("hex")
      await writeRecord(join(root, `${identity}.lock`), "")
    }

    const originalStat = await stat(root, { bigint: true })
    const pending = inspectGvisorTtlPhysicalRecoveryRegistry(root)
    await waitForPinnedDirectory(originalStat.dev, originalStat.ino)
    await rename(root, oldRoot)
    await rename(replacement, root)

    const snapshots = await pending
    assert.equal(snapshots.length, 1)
    assert.equal(snapshots[0].armOperationIdentity, originalBase.armOperationIdentity)
    assert.equal(snapshots[0].armReplay, null, "recovery must remain on the retained original root FD after pathname replacement")
    assert.ok((await readdir(root)).includes(`${originalBase.armOperationIdentity}.arm`), "replacement registry must actually contain the forged ARM replay")
  } finally {
    await rm(parent, { recursive: true, force: true })
  }
})
