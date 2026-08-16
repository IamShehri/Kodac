import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import test from "node:test"

import { createConfinementRequest } from "../src/trust/confinement.ts"
import {
  createSandboxExecutionRequirement,
  type SandboxExecutionRequirement,
} from "../src/trust/sandbox-backend-evidence.ts"
import {
  KDO_H4_R3A_NETWORK_MODE,
  createSandboxEntrypoint,
  createSandboxNetworkPolicy,
  createSandboxOciImageSource,
  createSandboxResourcePolicy,
  createSandboxWorkloadRequest,
} from "../src/trust/sandbox-workload.ts"
import {
  KDO_H4_R3G_A_CAPABILITY,
  KDO_H4_R3G_A_CGROUP_ROOT,
  KDO_H4_R3G_A_EVIDENCE_CLASS,
  KDO_H4_R3G_A_LIMITS,
  KDO_H4_R3G_A_RUNTIME_CONFIG_VERSION,
  KDO_H4_R3G_A_VERSION,
  cgroupV2FilesystemPath,
  cgroupV2HierarchyPaths,
  createGvisorCgroupNamespaceObservation,
  createGvisorCgroupV2PhysicalResourceSnapshot,
  createGvisorCgroupV2ObserverProtocolIdentity,
  parseGvisorCgroupV2MembershipPath,
  validateGvisorCgroupV2PhysicalResourceSnapshot,
  validateGvisorCgroupV2RuntimeConfig,
  type GvisorCgroupV2RawSnapshot,
} from "../src/trust/sandbox-observer-gvisor-cgroup-v2.ts"

const PID = 4321
const START_TICKS = "123456"
const CONTAINER_ID = "c".repeat(64)
const SOURCE_DIGEST = `sha256:${"2".repeat(64)}`
const WORKSPACE_IDENTITY = "a".repeat(64)
const EXECUTION_INTENT_IDENTITY = "b".repeat(64)
const CGROUP_NAMESPACE = createGvisorCgroupNamespaceObservation({ device: "7", inode: "4026531835" })
const source = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8")
function gitBlobSha1(text: string): string { const body = Buffer.from(text.replace(/\r\n/g, "\n"), "utf8"); return createHash("sha1").update(`blob ${body.byteLength}\0`).update(body).digest("hex") }

function fixtureRequirement(input: { cpuMillis?: number; memoryBytes?: number } = {}): SandboxExecutionRequirement {
  const confinement = createConfinementRequest({ mode: "read-only", workspaceIdentity: WORKSPACE_IDENTITY, executionIntentIdentity: EXECUTION_INTENT_IDENTITY, scope: { readPaths: ["src"], writePaths: [] } })
  const workload = createSandboxWorkloadRequest({
    source: createSandboxOciImageSource({ repository: "ghcr.io/acme/r3g-a-fixture", digest: SOURCE_DIGEST }),
    entrypoint: createSandboxEntrypoint({ executable: "/usr/bin/node", args: ["--version"] }),
    resourcePolicy: createSandboxResourcePolicy({ cpuMillis: input.cpuMillis ?? 1500, memoryBytes: input.memoryBytes ?? 536_870_912, ttlMs: 60_000, maxOutputBytes: 1_048_576 }),
    networkPolicy: createSandboxNetworkPolicy({ mode: KDO_H4_R3A_NETWORK_MODE }), confinement, credentialBindingIdentity: null,
  })
  return createSandboxExecutionRequirement({ workload, requiredSemanticRuntimeClass: "gvisor" })
}

function procStat(input: { policy?: number; rtPriority?: number; startTicks?: string } = {}): string {
  const fields = Array.from({ length: 38 }, () => "0"); fields[18] = input.startTicks ?? START_TICKS; fields[36] = String(input.rtPriority ?? 0); fields[37] = String(input.policy ?? 0)
  return `${PID} (runsc:sandbox) S ${fields.join(" ")}\n`
}

function rawSnapshot(requirement: SandboxExecutionRequirement, mutate?: (raw: any) => void): GvisorCgroupV2RawSnapshot {
  const target = `/docker/${CONTAINER_ID}`
  const raw: any = {
    mountInfo: "29 23 0:26 / /sys/fs/cgroup rw,nosuid,nodev,noexec,relatime - cgroup2 cgroup rw\n",
    procStat: procStat(), procStatus: "Name:\trunsc\nCpus_allowed_list:\t0-3\n", procCgroup: `0::${target}\n`, targetCgroupProcs: `${PID}\n`,
    levels: [
      { path: target, cgroupType: "domain\n", cpuMax: "150000 100000\n", cpuMaxBurst: "0\n", cpusetCpusEffective: "0-3\n", memoryMax: `${requirement.workload.resourcePolicy.memoryBytes}\n`, memorySwapMax: "0\n" },
      { path: "/docker", cgroupType: "domain\n", cpuMax: "max 100000\n", cpuMaxBurst: "0\n", cpusetCpusEffective: "0-3\n", memoryMax: "max\n", memorySwapMax: "max\n" },
    ],
  }
  mutate?.(raw); return raw
}

function createSnapshot(requirement = fixtureRequirement(), mutate?: (raw: any) => void) {
  return createGvisorCgroupV2PhysicalResourceSnapshot({ requirement, expectedPid: PID, expectedStartTicks: START_TICKS, cgroupNamespace: CGROUP_NAMESPACE, raw: rawSnapshot(requirement, mutate) })
}

test("H4-R3G-A constants namespace trust root and non-root hierarchy are exact", () => {
  assert.equal(KDO_H4_R3G_A_VERSION, "kodac-h4-r3g-a-cgroup-v2-resource-v1")
  assert.equal(KDO_H4_R3G_A_EVIDENCE_CLASS, "e3-physical-resource-candidate")
  assert.equal(KDO_H4_R3G_A_CAPABILITY, "runtime.observe.gvisor.cgroup-v2")
  assert.equal(KDO_H4_R3G_A_CGROUP_ROOT, "/sys/fs/cgroup")
  assert.deepEqual(CGROUP_NAMESPACE, { device: "7", inode: "4026531835", namespaceIdentity: CGROUP_NAMESPACE.namespaceIdentity })
  assert.match(CGROUP_NAMESPACE.namespaceIdentity, /^[0-9a-f]{64}$/)
  assert.throws(() => createGvisorCgroupNamespaceObservation({ device: 7, inode: "4026531835" }))
  assert.throws(() => createGvisorCgroupNamespaceObservation({ device: "07", inode: "4026531835" }))
  assert.deepEqual(cgroupV2HierarchyPaths(`/docker/${CONTAINER_ID}`), [`/docker/${CONTAINER_ID}`, "/docker"])
  assert.deepEqual(cgroupV2HierarchyPaths("/leaf"), ["/leaf"])
  assert.throws(() => cgroupV2HierarchyPaths("/"), /non-root/)
  assert.equal(cgroupV2FilesystemPath("/leaf"), "/sys/fs/cgroup/leaf")
  assert.equal(parseGvisorCgroupV2MembershipPath("0::/leaf\n"), "/leaf")
  assert.throws(() => parseGvisorCgroupV2MembershipPath("0::/\n"), /non-root/)
})

test("H4-R3G-A synthetic success binds initial cgroup namespace and exact CPU memory no-swap", () => {
  const requirement = fixtureRequirement(); const snapshot = createSnapshot(requirement)
  assert.equal(snapshot.requirementIdentity, requirement.requirementIdentity)
  assert.equal(snapshot.pid, PID); assert.equal(snapshot.startTicks, START_TICKS)
  assert.equal(snapshot.cgroupNamespaceDevice, CGROUP_NAMESPACE.device); assert.equal(snapshot.cgroupNamespaceInode, CGROUP_NAMESPACE.inode); assert.equal(snapshot.cgroupNamespaceIdentity, CGROUP_NAMESPACE.namespaceIdentity)
  assert.equal(snapshot.cgroupPath, `/docker/${CONTAINER_ID}`)
  assert.deepEqual(snapshot.levels.map((level) => level.path), [`/docker/${CONTAINER_ID}`, "/docker"])
  assert.equal(snapshot.levels.some((level) => level.path === "/"), false)
  assert.equal(snapshot.effectiveCpuNumerator, "3"); assert.equal(snapshot.effectiveCpuDenominator, "2"); assert.equal(snapshot.availableCpuCount, 4)
  assert.equal(snapshot.effectiveMemoryBytes, String(requirement.workload.resourcePolicy.memoryBytes)); assert.equal(snapshot.effectiveSwapBytes, "0")
  assert.equal(snapshot.schedulerPolicy, 0); assert.equal(snapshot.rtPriority, 0); assert.equal(snapshot.processCpusAllowed, "0-3")
  assert.deepEqual(validateGvisorCgroupV2PhysicalResourceSnapshot(snapshot), snapshot)
  assert.equal(Object.isFrozen(snapshot), true); assert.equal(Object.isFrozen(snapshot.levels), true); assert.match(createGvisorCgroupV2ObserverProtocolIdentity(), /^[0-9a-f]{64}$/)
})

test("H4-R3G-A rejects root fabrication and malformed hierarchy", () => {
  const requirement = fixtureRequirement()
  assert.throws(() => createSnapshot(requirement, (raw) => { raw.levels.push({ path: "/", cgroupType: "domain\n", cpuMax: "max 100000\n", cpuMaxBurst: "0\n", cpusetCpusEffective: "0-3\n", memoryMax: "max\n", memorySwapMax: "max\n" }) }), /non-root|levels/)
  assert.throws(() => createSnapshot(requirement, (raw) => { raw.levels.pop() }), /levels/)
  assert.throws(() => createSnapshot(requirement, (raw) => { raw.levels.reverse() }), /expected non-root hierarchy path/)
  assert.throws(() => createSnapshot(requirement, (raw) => { raw.procCgroup = "0::/\n" }), /non-root/)
  assert.throws(() => createSnapshot(requirement, (raw) => { raw.levels[1].cgroupType = "threaded\n" }), /cgroup.type=domain/)
  assert.throws(() => createSnapshot(requirement, (raw) => { raw.levels[1].cgroupType = "domain threaded\n" }), /cgroup.type=domain/)
})

test("H4-R3G-A rejects CPU mismatches burst scheduler and affinity narrowing", () => {
  const requirement = fixtureRequirement()
  const cases: Array<{ name: string; mutate: (raw: any) => void; pattern: RegExp }> = [
    { name: "cpu-wider", mutate: (raw) => { raw.levels[0].cpuMax = "200000 100000\n" }, pattern: /CPU ceiling/ },
    { name: "cpu-stricter", mutate: (raw) => { raw.levels[1].cpuMax = "100000 100000\n" }, pattern: /CPU ceiling/ },
    { name: "cpu-unlimited", mutate: (raw) => { raw.levels[0].cpuMax = "max 100000\n" }, pattern: /no finite/ },
    { name: "burst", mutate: (raw) => { raw.levels[0].cpuMaxBurst = "1\n" }, pattern: /exactly 0/ },
    { name: "policy", mutate: (raw) => { raw.procStat = procStat({ policy: 1 }) }, pattern: /SCHED_OTHER/ },
    { name: "rt", mutate: (raw) => { raw.procStat = procStat({ rtPriority: 1 }) }, pattern: /SCHED_OTHER/ },
    { name: "affinity", mutate: (raw) => { raw.procStatus = "Cpus_allowed_list:\t0\n" }, pattern: /affinity/ },
    { name: "cpuset", mutate: (raw) => { raw.levels[0].cpusetCpusEffective = "0\n" }, pattern: /affinity/ },
    { name: "inconsistent-effective", mutate: (raw) => { raw.levels[0].cpusetCpusEffective = "0-3\n"; raw.levels[1].cpusetCpusEffective = "0-1\n" }, pattern: /inconsistent|affinity/ },
  ]
  for (const item of cases) assert.throws(() => createSnapshot(requirement, item.mutate), item.pattern, item.name)
})

test("H4-R3G-A rejects memory swap and subject membership mismatches", () => {
  const requirement = fixtureRequirement()
  const cases: Array<{ name: string; mutate: (raw: any) => void; pattern: RegExp }> = [
    { name: "memory-wider", mutate: (raw) => { raw.levels[0].memoryMax = `${requirement.workload.resourcePolicy.memoryBytes + 1}\n` }, pattern: /memory ceiling/ },
    { name: "memory-stricter", mutate: (raw) => { raw.levels[1].memoryMax = "1\n" }, pattern: /memory ceiling/ },
    { name: "memory-unlimited", mutate: (raw) => { raw.levels[0].memoryMax = "max\n" }, pattern: /no finite/ },
    { name: "swap-positive", mutate: (raw) => { raw.levels[0].memorySwapMax = "1\n" }, pattern: /swap ceiling/ },
    { name: "swap-unlimited", mutate: (raw) => { raw.levels[0].memorySwapMax = "max\n" }, pattern: /no finite|swap ceiling/ },
    { name: "pid-missing", mutate: (raw) => { raw.targetCgroupProcs = "9999\n" }, pattern: /not a member/ },
    { name: "start-time", mutate: (raw) => { raw.procStat = procStat({ startTicks: "999" }) }, pattern: /PID\/startTicks/ },
  ]
  for (const item of cases) assert.throws(() => createSnapshot(requirement, item.mutate), item.pattern, item.name)
})

test("H4-R3G-A rejects ambiguous mount cgroup and CPU-list grammars", () => {
  const requirement = fixtureRequirement()
  assert.throws(() => createSnapshot(requirement, (raw) => { raw.mountInfo += "30 23 0:27 / /other rw - cgroup2 cgroup rw\n" }), /exactly one cgroup2/)
  assert.throws(() => createSnapshot(requirement, (raw) => { raw.mountInfo = "29 23 0:26 /nested /sys/fs/cgroup rw - cgroup2 cgroup rw\n" }), /root=\//)
  assert.throws(() => createSnapshot(requirement, (raw) => { raw.procCgroup = "2:cpu:/legacy\n0::/leaf\n" }), /exactly one unified/)
  assert.throws(() => createSnapshot(requirement, (raw) => { raw.procCgroup = "0::/docker/../escape\n" }), /canonical/)
  assert.throws(() => createSnapshot(requirement, (raw) => { raw.procStatus = "Cpus_allowed_list:\t0-2,2-3\n" }), /sorted and non-overlapping/)
})

test("H4-R3G-A validator re-derives namespace normalized evidence and rejects proxy arrays", () => {
  const cpu: any = JSON.parse(JSON.stringify(createSnapshot())); cpu.effectiveCpuNumerator = "999"; assert.throws(() => validateGvisorCgroupV2PhysicalResourceSnapshot(cpu), /effective CPU ratio/)
  const memory: any = JSON.parse(JSON.stringify(createSnapshot())); memory.effectiveMemoryBytes = "1"; assert.throws(() => validateGvisorCgroupV2PhysicalResourceSnapshot(memory), /effective memory/)
  const hierarchy: any = JSON.parse(JSON.stringify(createSnapshot())); hierarchy.hierarchyIdentity = "f".repeat(64); assert.throws(() => validateGvisorCgroupV2PhysicalResourceSnapshot(hierarchy), /hierarchy identity/)
  const count: any = JSON.parse(JSON.stringify(createSnapshot())); count.availableCpuCount = KDO_H4_R3G_A_LIMITS.maxCpuId + 2; assert.throws(() => validateGvisorCgroupV2PhysicalResourceSnapshot(count), /availableCpuCount/)
  const namespace: any = JSON.parse(JSON.stringify(createSnapshot())); namespace.cgroupNamespaceInode = "1"; assert.throws(() => validateGvisorCgroupV2PhysicalResourceSnapshot(namespace), /namespace identity/)
  let trapCount = 0; const proxyLevels = new Proxy([] as unknown[], { get() { trapCount += 1; throw new Error("trap") } }); const hostile: any = { ...createSnapshot(), levels: proxyLevels }
  assert.throws(() => validateGvisorCgroupV2PhysicalResourceSnapshot(hostile), /non-proxy array/); assert.equal(trapCount, 0)
})

test("H4-R3G-A runtime config requires trusted namespace identity and exposes no reader authority", () => {
  const commitResourceEvidence = () => ({})
  const config = validateGvisorCgroupV2RuntimeConfig({ version: KDO_H4_R3G_A_RUNTIME_CONFIG_VERSION, initialCgroupNamespaceIdentity: { device: "7", inode: "4026531835" }, commitResourceEvidence })
  assert.deepEqual(config.initialCgroupNamespaceIdentity, { device: "7", inode: "4026531835" }); assert.equal(config.commitResourceEvidence, commitResourceEvidence)
  assert.throws(() => validateGvisorCgroupV2RuntimeConfig({ version: KDO_H4_R3G_A_RUNTIME_CONFIG_VERSION, commitResourceEvidence }))
  assert.throws(() => validateGvisorCgroupV2RuntimeConfig({ version: KDO_H4_R3G_A_RUNTIME_CONFIG_VERSION, initialCgroupNamespaceIdentity: { device: 7, inode: "4026531835" }, commitResourceEvidence }))
  assert.throws(() => validateGvisorCgroupV2RuntimeConfig({ version: KDO_H4_R3G_A_RUNTIME_CONFIG_VERSION, initialCgroupNamespaceIdentity: { device: "7", inode: "4026531835" }, commitResourceEvidence, cgroupRoot: "/tmp/fake" }))
  assert.throws(() => validateGvisorCgroupV2RuntimeConfig({ version: KDO_H4_R3G_A_RUNTIME_CONFIG_VERSION, initialCgroupNamespaceIdentity: { device: "7", inode: "4026531835" }, commitResourceEvidence, readFile() {} }))
})

test("H4-R3G-A production module is pure E3-only and protected R3B/R3E/R3F surfaces remain unchanged", () => {
  const moduleSource = source("../src/trust/sandbox-observer-gvisor-cgroup-v2.ts")
  assert.doesNotMatch(moduleSource, /createSandboxBackendObservation|createSandboxExecutionEvidence/)
  assert.doesNotMatch(moduleSource, /node:child_process|node:fs(?:\/promises)?|node:http|node:https|node:net|dockerode|containerd/)
  assert.match(moduleSource, /derivedHierarchy/); assert.match(moduleSource, /finiteRatio/); assert.match(moduleSource, /finiteLimit/); assert.match(moduleSource, /prePhysicalSnapshotIdentity/); assert.match(moduleSource, /CGROUP_NAMESPACE/)
  assert.equal(gitBlobSha1(source("../src/trust/sandbox-backend-evidence.ts")), "b9242c5cecc18fd43b2b80aeffd974ef5311fded")
  assert.equal(gitBlobSha1(source("../src/trust/sandbox-observer-gvisor.ts")), "47c792ba01c9ba4b2db94d7558f282cdbd218660")
  assert.equal(gitBlobSha1(source("../src/trust/sandbox-observer-gvisor-runtime.ts")), "1d02a5dbc1dc4071636c24327e7faf9906370ef5")
  assert.equal(gitBlobSha1(source("../src/trust/sandbox-observer-docker-control-plane.ts")), "452bd955cb0ef84f2090aa646dfdc70ad610a8d9")
})
