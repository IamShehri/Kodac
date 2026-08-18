import assert from "node:assert/strict"
import { chmod, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"

import { createGvisorTtlWatchdogProtocolIdentity } from "../src/execution/gateway-gvisor-ttl.ts"
import {
  inspectGvisorTtlPhysicalRegistry,
  parseGvisorTtlPhysicalLeaseRecord,
  parseGvisorTtlPhysicalOwnerClaimRecord,
  parseGvisorTtlPhysicalTerminalRecord,
} from "../src/execution/gateway-gvisor-ttl-registry.ts"

const ID = Object.freeze({
  arm: "1".repeat(64),
  payload: "2".repeat(64),
  execution: "3".repeat(64),
  requirement: "4".repeat(64),
  workload: "5".repeat(64),
  binding: "6".repeat(64),
  container: "7".repeat(64),
  runtime: "8".repeat(64),
  watchdog: "9".repeat(64),
  owner: "a".repeat(64),
  controlPeer: "b".repeat(64),
  pidfd: "c".repeat(64),
  runscArtifact: "d".repeat(64),
  runscSha: "e".repeat(64),
  retainedRunsc: "f".repeat(64),
  liveProbe: "1".repeat(64),
  processSet: "2".repeat(64),
  signal: "3".repeat(64),
  termination: "4".repeat(64),
})
const BOOT = "123e4567-e89b-42d3-a456-426614174000"
const TTL = "1000"
const START = "1000000000"
const DEADLINE = "2000000000"

function serialize(entries: readonly (readonly [string, string])[]): string {
  return `${entries.map(([key, value]) => `${key}=${value}`).join("\n")}\n`
}

function fixture(boot = BOOT) {
  const fence = "1"
  const claimIdentity = createGvisorTtlWatchdogProtocolIdentity("OWNER_CLAIM", [ID.arm, ID.owner, fence, boot])
  const claimText = serialize([
    ["version", "kodac-h4-r3g-d-owner-claim-v1"],
    ["armOperationIdentity", ID.arm],
    ["ownerInstanceIdentity", ID.owner],
    ["terminalFenceToken", fence],
    ["linuxBootId", boot],
    ["claimRecordIdentity", claimIdentity],
  ])
  const clock = createGvisorTtlWatchdogProtocolIdentity("CLOCK_DOMAIN", [boot, "CLOCK_BOOTTIME"])
  const leaseIdentity = createGvisorTtlWatchdogProtocolIdentity("LEASE", [ID.arm, ID.payload, ID.runtime, boot, START, DEADLINE, ID.watchdog])
  const registryIdentity = createGvisorTtlWatchdogProtocolIdentity("LEASE_REGISTRY", [
    "kodac-h4-r3g-d-watchdog-lease-v1", ID.arm, ID.payload, leaseIdentity, ID.execution, ID.requirement, ID.workload, ID.binding, ID.container, ID.runtime, TTL, boot, clock, START, DEADLINE, ID.watchdog, ID.owner, fence, claimIdentity,
  ])
  const leaseText = serialize([
    ["version", "kodac-h4-r3g-d-watchdog-lease-v1"],
    ["armOperationIdentity", ID.arm],
    ["canonicalArmPayloadDigest", ID.payload],
    ["leaseIdentity", leaseIdentity],
    ["executionAttemptIdentity", ID.execution],
    ["requirementIdentity", ID.requirement],
    ["workloadIdentity", ID.workload],
    ["containerBindingIdentity", ID.binding],
    ["containerId", ID.container],
    ["runtimeInstanceIdentity", ID.runtime],
    ["ttlMs", TTL],
    ["linuxBootId", boot],
    ["clockDomainIdentity", clock],
    ["leaseStartBoottimeNs", START],
    ["deadlineBoottimeNs", DEADLINE],
    ["watchdogImplementationIdentity", ID.watchdog],
    ["physicalArmState", "ARMED"],
    ["ownerInstanceIdentity", ID.owner],
    ["terminalFenceToken", fence],
    ["claimRecordIdentity", claimIdentity],
    ["registryRecordIdentity", registryIdentity],
  ])
  const terminalIdentity = createGvisorTtlWatchdogProtocolIdentity("TERMINAL_REGISTRY", [
    ID.arm, leaseIdentity, ID.runtime, "ttl-expired", ID.owner, fence, claimIdentity, ID.controlPeer, ID.pidfd, ID.runscArtifact, ID.runscSha, ID.retainedRunsc, clock, boot, "-", DEADLINE, ID.liveProbe, ID.processSet, ID.signal, ID.termination,
  ])
  const terminalText = serialize([
    ["version", "kodac-h4-r3g-d-terminal-registry-v1"],
    ["armOperationIdentity", ID.arm],
    ["leaseIdentity", leaseIdentity],
    ["runtimeInstanceIdentity", ID.runtime],
    ["terminalOutcome", "ttl-expired"],
    ["ownerInstanceIdentity", ID.owner],
    ["terminalFenceToken", fence],
    ["claimRecordIdentity", claimIdentity],
    ["controlPeerBindingIdentity", ID.controlPeer],
    ["retainedPidfdProcessIdentity", ID.pidfd],
    ["runscArtifactIdentity", ID.runscArtifact],
    ["verifiedRunscSha256", ID.runscSha],
    ["retainedRunscExecutableIdentity", ID.retainedRunsc],
    ["clockDomainIdentity", clock],
    ["linuxBootId", boot],
    ["exitEventObservedBoottimeNs", "-"],
    ["liveAtExpiryObservedBoottimeNs", DEADLINE],
    ["liveAtExpiryProbeIdentity", ID.liveProbe],
    ["liveAtExpiryProcessSetIdentity", ID.processSet],
    ["signalAcknowledgementIdentity", ID.signal],
    ["terminationAcknowledgementIdentity", ID.termination],
    ["registryTerminalRecordIdentity", terminalIdentity],
  ])
  return { claimText, leaseText, terminalText, claimIdentity, leaseIdentity, registryIdentity, terminalIdentity }
}

test("H4-R3G-D physical registry parsers rederive native claim lease and terminal identities", () => {
  const value = fixture()
  const claim = parseGvisorTtlPhysicalOwnerClaimRecord(value.claimText)
  const lease = parseGvisorTtlPhysicalLeaseRecord(value.leaseText, claim)
  const terminal = parseGvisorTtlPhysicalTerminalRecord(value.terminalText, lease)
  assert.equal(claim.claimRecordIdentity, value.claimIdentity)
  assert.equal(lease.leaseIdentity, value.leaseIdentity)
  assert.equal(lease.registryRecordIdentity, value.registryIdentity)
  assert.equal(terminal.registryTerminalRecordIdentity, value.terminalIdentity)
  assert.equal(terminal.terminalOutcome, "ttl-expired")
})

test("H4-R3G-D physical registry rejects tampered native hashes and immutable deadline renewal", () => {
  const value = fixture()
  const claim = parseGvisorTtlPhysicalOwnerClaimRecord(value.claimText)
  assert.throws(() => parseGvisorTtlPhysicalOwnerClaimRecord(value.claimText.replace(value.claimIdentity, "0".repeat(64))), /claim identity mismatch/)
  assert.throws(() => parseGvisorTtlPhysicalLeaseRecord(value.leaseText.replace(`deadlineBoottimeNs=${DEADLINE}`, "deadlineBoottimeNs=3000000000"), claim), /immutable start\+ttl deadline/)
  assert.throws(() => parseGvisorTtlPhysicalLeaseRecord(value.leaseText.replace(value.registryIdentity, "0".repeat(64)), claim), /lease registry identity mismatch/)
  const lease = parseGvisorTtlPhysicalLeaseRecord(value.leaseText, claim)
  assert.throws(() => parseGvisorTtlPhysicalTerminalRecord(value.terminalText.replace(value.terminalIdentity, "0".repeat(64)), lease), /terminal registry identity mismatch/)
})

test("H4-R3G-D physical registry parser rejects cross-generation owner substitution", () => {
  const value = fixture()
  const claim = parseGvisorTtlPhysicalOwnerClaimRecord(value.claimText)
  const forgedOwner = "0".repeat(64)
  const forgedClaimIdentity = createGvisorTtlWatchdogProtocolIdentity("OWNER_CLAIM", [ID.arm, forgedOwner, "1", BOOT])
  const forgedClaim = parseGvisorTtlPhysicalOwnerClaimRecord(value.claimText.replace(ID.owner, forgedOwner).replace(value.claimIdentity, forgedClaimIdentity))
  assert.throws(() => parseGvisorTtlPhysicalLeaseRecord(value.leaseText, forgedClaim), /authoritative owner claim/)
  assert.equal(claim.ownerInstanceIdentity, ID.owner)
})

test("H4-R3G-D Linux registry inspection pins the trusted directory and classifies current boot", { skip: process.platform !== "linux" }, async () => {
  const root = await mkdtemp(join(tmpdir(), "kodac-r3gd-registry-read-")); await chmod(root, 0o700)
  try {
    const boot = (await readFile("/proc/sys/kernel/random/boot_id", "utf8")).trim()
    const value = fixture(boot)
    await writeFile(join(root, `${ID.arm}.lock`), "", { mode: 0o600 })
    await writeFile(join(root, `${ID.arm}.claim`), value.claimText, { mode: 0o600 })
    await writeFile(join(root, `${ID.arm}.lease`), value.leaseText, { mode: 0o600 })
    await writeFile(join(root, `${ID.arm}.terminal`), value.terminalText, { mode: 0o600 })
    await writeFile(join(root, "unrelated-trusted-artifact"), "ignored", { mode: 0o600 })
    const snapshots = await inspectGvisorTtlPhysicalRegistry(root)
    assert.equal(snapshots.length, 1)
    assert.equal(snapshots[0].armOperationIdentity, ID.arm)
    assert.equal(snapshots[0].clockContinuity, "SAME_BOOT")
    assert.equal(snapshots[0].terminal?.terminalOutcome, "ttl-expired")
  } finally { await rm(root, { recursive: true, force: true }) }
})

test("H4-R3G-D Linux registry inspection marks changed boot unrecoverable without minting a new deadline", { skip: process.platform !== "linux" }, async () => {
  const root = await mkdtemp(join(tmpdir(), "kodac-r3gd-registry-old-boot-")); await chmod(root, 0o700)
  try {
    const actualBoot = (await readFile("/proc/sys/kernel/random/boot_id", "utf8")).trim()
    const oldBoot = actualBoot === BOOT ? "00000000-0000-4000-8000-000000000001" : BOOT
    const value = fixture(oldBoot)
    await writeFile(join(root, `${ID.arm}.lock`), "", { mode: 0o600 })
    await writeFile(join(root, `${ID.arm}.claim`), value.claimText, { mode: 0o600 })
    await writeFile(join(root, `${ID.arm}.lease`), value.leaseText, { mode: 0o600 })
    const snapshots = await inspectGvisorTtlPhysicalRegistry(root)
    assert.equal(snapshots.length, 1)
    assert.equal(snapshots[0].clockContinuity, "UNRECOVERABLE_CLOCK_DOMAIN")
    assert.equal(snapshots[0].lease.deadlineBoottimeNs, DEADLINE)
    assert.equal(snapshots[0].terminal, null)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test("H4-R3G-D Linux registry inspection rejects incomplete state and leaf symlink substitution", { skip: process.platform !== "linux" }, async () => {
  const root = await mkdtemp(join(tmpdir(), "kodac-r3gd-registry-hostile-")); await chmod(root, 0o700)
  try {
    const boot = (await readFile("/proc/sys/kernel/random/boot_id", "utf8")).trim()
    const value = fixture(boot)
    await writeFile(join(root, `${ID.arm}.lock`), "", { mode: 0o600 })
    await writeFile(join(root, `${ID.arm}.claim`), value.claimText, { mode: 0o600 })
    await assert.rejects(inspectGvisorTtlPhysicalRegistry(root), /incomplete durable state/)

    const external = join(root, "external-lease")
    await writeFile(external, value.leaseText, { mode: 0o600 })
    await symlink(external, join(root, `${ID.arm}.lease`))
    await assert.rejects(inspectGvisorTtlPhysicalRegistry(root), /unavailable or unsafe/)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test("H4-R3G-D Linux registry inspection rejects malformed lifecycle filenames but ignores lock-only aborted attempts", { skip: process.platform !== "linux" }, async () => {
  const root = await mkdtemp(join(tmpdir(), "kodac-r3gd-registry-names-")); await chmod(root, 0o700)
  try {
    await writeFile(join(root, `${ID.arm}.lock`), "", { mode: 0o600 })
    assert.deepEqual(await inspectGvisorTtlPhysicalRegistry(root), [])
    await writeFile(join(root, "not-an-operation.lease"), "x", { mode: 0o600 })
    await assert.rejects(inspectGvisorTtlPhysicalRegistry(root), /malformed lifecycle entry/)
  } finally { await rm(root, { recursive: true, force: true }) }
})
