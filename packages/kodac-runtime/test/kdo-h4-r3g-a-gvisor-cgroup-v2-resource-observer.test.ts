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
  createGvisorObserverPlan,
  createGvisorRuntimeObservationCandidate,
  parseGvisorProcessObservation,
  parseGvisorStateOutput,
  parseGvisorStatsOutput,
} from "../src/trust/sandbox-observer-gvisor.ts"
import {
  createGvisorContainerBinding,
  createGvisorExecutionAttemptIdentity,
  createGvisorObserverArtifact,
  createGvisorRuntimeLineageCommit,
  createGvisorRuntimeLineageRecord,
} from "../src/trust/sandbox-observer-gvisor-runtime.ts"
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
  createGvisorCgroupV2ResourceCommit,
  createGvisorCgroupV2ResourceRecord,
  parseGvisorCgroupV2MembershipPath,
  validateGvisorCgroupV2PhysicalResourceSnapshot,
  validateGvisorCgroupV2ResourceCommit,
  validateGvisorCgroupV2ResourceRecord,
  validateGvisorCgroupV2RuntimeConfig,
  type GvisorCgroupV2RawSnapshot,
  type GvisorCgroupV2ResourceRecord,
} from "../src/trust/sandbox-observer-gvisor-cgroup-v2.ts"

const PID = 4321
const START_TICKS = "123456"
const CONTAINER_ID = "c".repeat(64)
const SOURCE_DIGEST = `sha256:${"2".repeat(64)}`
const WORKSPACE_IDENTITY = "a".repeat(64)
const EXECUTION_INTENT_IDENTITY = "b".repeat(64)
const RUNSC_SHA = "d".repeat(64)
const HELPER_SHA = "e".repeat(64)
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

function fixtureR3eLineage(requirement = fixtureRequirement()) {
  const executionAttemptIdentity = createGvisorExecutionAttemptIdentity({ requirementIdentity: requirement.requirementIdentity, workloadIdentity: requirement.workload.workloadIdentity, nonce: "123e4567-e89b-42d3-a456-426614174000" })
  const binding = createGvisorContainerBinding({ providerId: "fixture", executionAttemptIdentity, requirementIdentity: requirement.requirementIdentity, workloadIdentity: requirement.workload.workloadIdentity, containerId: CONTAINER_ID })
  const runsc = createGvisorObserverArtifact({ role: "runsc", sha256: RUNSC_SHA, sizeBytes: 1024 })
  const helper = createGvisorObserverArtifact({ role: "observer-helper", sha256: HELPER_SHA, sizeBytes: 1024 })
  const plan = createGvisorObserverPlan({ runscPath: "/usr/local/bin/runsc", expectedRunscSha256: RUNSC_SHA, runtimeRoot: "/var/run/runsc", containerId: CONTAINER_ID })
  const state = parseGvisorStateOutput(JSON.stringify({ ociVersion: "1.2.0", id: CONTAINER_ID, status: "running", pid: PID, bundle: `/run/containerd/io.containerd.runtime.v2.task/moby/${CONTAINER_ID}` }), plan)
  const stats = parseGvisorStatsOutput(JSON.stringify({ type: "stats", id: CONTAINER_ID, data: { cpu: {}, memory: {}, pids: {}, network_interfaces: [] } }), plan)
  const process = parseGvisorProcessObservation(`kodac-gvisor-proc-v1 pid=${PID} start-ticks=${START_TICKS} exe-dev=2049 exe-ino=987654321 exe-size=12345678\n`)
  const candidate = createGvisorRuntimeObservationCandidate({ plan, state, stats, process })
  const lineage = createGvisorRuntimeLineageRecord({ executionAttemptIdentity, requirement, binding, runsc, helper, plan, state, stats, process, candidate })
  const lineageCommit = createGvisorRuntimeLineageCommit(lineage)
  return { process, lineage, lineageCommit }
}

function fixtureResourceRecord(requirement = fixtureRequirement()) {
  const snapshot = createSnapshot(requirement)
  const { process, lineage, lineageCommit } = fixtureR3eLineage(requirement)
  const record = createGvisorCgroupV2ResourceRecord({ requirement, lineage, lineageCommit, process, preSnapshot: snapshot, postSnapshot: snapshot })
  const commit = createGvisorCgroupV2ResourceCommit(record)
  return { requirement, snapshot, process, lineage, lineageCommit, record, commit }
}

async function testOnlyBoundedCommit(
  record: GvisorCgroupV2ResourceRecord,
  callback: (value: GvisorCgroupV2ResourceRecord) => Promise<unknown> | unknown,
  signal?: AbortSignal,
): Promise<unknown> {
  if (signal?.aborted) throw new Error("R3G-A test harness aborted before commit")
  let removeAbort: (() => void) | undefined
  const aborted = new Promise<never>((_, reject) => {
    if (signal === undefined) return
    const onAbort = () => reject(new Error("R3G-A test harness aborted during commit"))
    signal.addEventListener("abort", onAbort, { once: true })
    removeAbort = () => signal.removeEventListener("abort", onAbort)
  })
  try {
    const value = await Promise.race([Promise.resolve().then(() => callback(record)), aborted])
    if (signal?.aborted) throw new Error("R3G-A test harness aborted after commit")
    return value
  } finally { removeAbort?.() }
}

test("H4-R3G-A constants namespace trust root and non-root hierarchy are exact", () => {
  assert.equal(KDO_H4_R3G_A_VERSION, "kodac-h4-r3g-a-cgroup-v2-resource-v1")
  assert.equal(KDO_H4_R3G_A_EVIDENCE_CLASS, "e3-physical-resource-candidate")
  assert.equal(KDO_H4_R3G_A_CAPABILITY, "runtime.observe.gvisor.cgroup-v2")
  assert.equal(KDO_H4_R3G_A_CGROUP_ROOT, "/sys/fs/cgroup")
  assert.equal(KDO_H4_R3G_A_LIMITS.maxRecordSerializedBytes, 64 * 1024)
  assert.deepEqual(CGROUP_NAMESPACE, { device: "7", inode: "4026531835", namespaceIdentity: CGROUP_NAMESPACE.namespaceIdentity })
  assert.match(CGROUP_NAMESPACE.namespaceIdentity, /^[0-9a-f]{64}$/)
  assert.throws(() => createGvisorCgroupNamespaceObservation({ device: 7, inode: "4026531835" }))
  assert.throws(() => createGvisorCgroupNamespaceObservation({ device: "07", inode: "4026531835" }))
  assert.deepEqual(cgroupV2HierarchyPaths(`/docker/${CONTAINER_ID}`), [`/docker/${CONTAINER_ID}`, "/docker"])
  assert.deepEqual(cgroupV2HierarchyPaths("/leaf"), ["/leaf"])
  assert.throws(() => cgroupV2HierarchyPaths("/"), /non-root/)
  const overDepth = `/${Array.from({ length: KDO_H4_R3G_A_LIMITS.maxHierarchyDepth + 1 }, (_, index) => `d${index}`).join("/")}`
  assert.throws(() => cgroupV2HierarchyPaths(overDepth), /depth/)
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

test("H4-R3G-A rejects root fabrication malformed hierarchy and wrong cgroup2 mount", () => {
  const requirement = fixtureRequirement()
  assert.throws(() => createSnapshot(requirement, (raw) => { raw.levels.push({ path: "/", cgroupType: "domain\n", cpuMax: "max 100000\n", cpuMaxBurst: "0\n", cpusetCpusEffective: "0-3\n", memoryMax: "max\n", memorySwapMax: "max\n" }) }), /non-root|levels/)
  assert.throws(() => createSnapshot(requirement, (raw) => { raw.levels.pop() }), /levels/)
  assert.throws(() => createSnapshot(requirement, (raw) => { raw.levels.reverse() }), /expected non-root hierarchy path/)
  assert.throws(() => createSnapshot(requirement, (raw) => { raw.procCgroup = "0::/\n" }), /non-root/)
  assert.throws(() => createSnapshot(requirement, (raw) => { raw.levels[1].cgroupType = "threaded\n" }), /cgroup.type=domain/)
  assert.throws(() => createSnapshot(requirement, (raw) => { raw.levels[1].cgroupType = "domain threaded\n" }), /cgroup.type=domain/)
  assert.throws(() => createSnapshot(requirement, (raw) => { raw.mountInfo = "29 23 0:26 / /tmp/cgroup rw - cgroup2 cgroup rw\n" }), /\/sys\/fs\/cgroup/)
})

test("H4-R3G-A rejects CPU mismatches burst scheduler affinity narrowing and malformed controls", () => {
  const requirement = fixtureRequirement()
  const cases: Array<{ name: string; mutate: (raw: any) => void; pattern: RegExp }> = [
    { name: "cpu-wider", mutate: (raw) => { raw.levels[0].cpuMax = "200000 100000\n" }, pattern: /CPU ceiling/ },
    { name: "cpu-stricter", mutate: (raw) => { raw.levels[1].cpuMax = "100000 100000\n" }, pattern: /CPU ceiling/ },
    { name: "cpu-unlimited", mutate: (raw) => { raw.levels[0].cpuMax = "max 100000\n" }, pattern: /no finite/ },
    { name: "cpu-malformed", mutate: (raw) => { raw.levels[0].cpuMax = "150000\n" }, pattern: /grammar/ },
    { name: "cpu-missing", mutate: (raw) => { delete raw.levels[0].cpuMax }, pattern: /exactly/ },
    { name: "burst", mutate: (raw) => { raw.levels[0].cpuMaxBurst = "1\n" }, pattern: /exactly 0/ },
    { name: "policy", mutate: (raw) => { raw.procStat = procStat({ policy: 1 }) }, pattern: /SCHED_OTHER/ },
    { name: "rt", mutate: (raw) => { raw.procStat = procStat({ rtPriority: 1 }) }, pattern: /SCHED_OTHER/ },
    { name: "stat-malformed", mutate: (raw) => { raw.procStat = `${PID} broken\n` }, pattern: /command field/ },
    { name: "affinity", mutate: (raw) => { raw.procStatus = "Cpus_allowed_list:\t0\n" }, pattern: /affinity/ },
    { name: "affinity-missing", mutate: (raw) => { raw.procStatus = "Name:\trunsc\n" }, pattern: /exactly one/ },
    { name: "cpuset", mutate: (raw) => { raw.levels[0].cpusetCpusEffective = "0\n" }, pattern: /affinity/ },
    { name: "inconsistent-effective", mutate: (raw) => { raw.levels[0].cpusetCpusEffective = "0-3\n"; raw.levels[1].cpusetCpusEffective = "0-1\n" }, pattern: /inconsistent|affinity/ },
  ]
  for (const item of cases) assert.throws(() => createSnapshot(requirement, item.mutate), item.pattern, item.name)
})

test("H4-R3G-A rejects memory swap subject membership and malformed memory controls", () => {
  const requirement = fixtureRequirement()
  const cases: Array<{ name: string; mutate: (raw: any) => void; pattern: RegExp }> = [
    { name: "memory-wider", mutate: (raw) => { raw.levels[0].memoryMax = `${requirement.workload.resourcePolicy.memoryBytes + 1}\n` }, pattern: /memory ceiling/ },
    { name: "memory-stricter", mutate: (raw) => { raw.levels[1].memoryMax = "1\n" }, pattern: /memory ceiling/ },
    { name: "memory-unlimited", mutate: (raw) => { raw.levels[0].memoryMax = "max\n" }, pattern: /no finite/ },
    { name: "memory-malformed", mutate: (raw) => { raw.levels[0].memoryMax = "12x\n" }, pattern: /decimal/ },
    { name: "memory-missing", mutate: (raw) => { delete raw.levels[0].memoryMax }, pattern: /exactly/ },
    { name: "swap-positive", mutate: (raw) => { raw.levels[0].memorySwapMax = "1\n" }, pattern: /swap ceiling/ },
    { name: "swap-unlimited", mutate: (raw) => { raw.levels[0].memorySwapMax = "max\n" }, pattern: /no finite|swap ceiling/ },
    { name: "swap-malformed", mutate: (raw) => { raw.levels[0].memorySwapMax = "-1\n" }, pattern: /decimal/ },
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
  assert.throws(() => createSnapshot(requirement, (raw) => { raw.procCgroup = "2:cpu:/legacy\n" }), /unified v2/)
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

test("H4-R3G-A resource record binds R3E lineage stable bracket serialized bound and durable commit identity", () => {
  const fixture = fixtureResourceRecord()
  assert.deepEqual(validateGvisorCgroupV2ResourceRecord(fixture.record), fixture.record)
  assert.deepEqual(validateGvisorCgroupV2ResourceCommit(fixture.commit, fixture.record), fixture.commit)
  assert.ok(Buffer.byteLength(JSON.stringify(fixture.record), "utf8") <= KDO_H4_R3G_A_LIMITS.maxRecordSerializedBytes)
  assert.equal(fixture.record.r3eRecordIdentity, fixture.lineage.recordIdentity)
  assert.equal(fixture.record.r3eCommitIdentity, fixture.lineageCommit.commitIdentity)
  assert.equal(fixture.record.processIdentity, fixture.process.processIdentity)
  assert.equal(fixture.record.prePhysicalSnapshotIdentity, fixture.record.postPhysicalSnapshotIdentity)

  const wrongR3eCommit = { ...fixture.lineageCommit, commitIdentity: "f".repeat(64) }
  assert.throws(() => createGvisorCgroupV2ResourceRecord({ requirement: fixture.requirement, lineage: fixture.lineage, lineageCommit: wrongR3eCommit, process: fixture.process, preSnapshot: fixture.snapshot, postSnapshot: fixture.snapshot }), /commit identity mismatch/)

  const alternate = createSnapshot(fixture.requirement, (raw) => {
    const target = `/scope/${CONTAINER_ID}`
    raw.procCgroup = `0::${target}\n`
    raw.levels[0].path = target
    raw.levels[1].path = "/scope"
  })
  assert.throws(() => createGvisorCgroupV2ResourceRecord({ requirement: fixture.requirement, lineage: fixture.lineage, lineageCommit: fixture.lineageCommit, process: fixture.process, preSnapshot: fixture.snapshot, postSnapshot: alternate }), /not stable/)

  const wrongResourceCommit = { ...fixture.commit, commitIdentity: "f".repeat(64) }
  assert.throws(() => validateGvisorCgroupV2ResourceCommit(wrongResourceCommit, fixture.record), /commit identity mismatch/)
})

test("H4-R3G-A test-only trusted commit harness rejects failed wrong and cancelled acknowledgments including late completion", async () => {
  const { record, commit } = fixtureResourceRecord()
  assert.deepEqual(validateGvisorCgroupV2ResourceCommit(await testOnlyBoundedCommit(record, () => commit), record), commit)
  await assert.rejects(testOnlyBoundedCommit(record, async () => { throw new Error("durable store failed") }), /durable store failed/)
  const wrong = { ...commit, recordIdentity: "f".repeat(64) }
  await assert.rejects(async () => validateGvisorCgroupV2ResourceCommit(await testOnlyBoundedCommit(record, () => wrong), record), /commit identity mismatch/)

  const before = new AbortController(); before.abort()
  await assert.rejects(testOnlyBoundedCommit(record, () => commit, before.signal), /aborted before/)

  const during = new AbortController()
  let release!: (value: unknown) => void
  const delayed = new Promise<unknown>((resolve) => { release = resolve })
  let successfulReturn = false
  const pending = testOnlyBoundedCommit(record, () => delayed, during.signal).then((value) => { successfulReturn = true; return value })
  during.abort()
  await assert.rejects(pending, /aborted during/)
  release(commit)
  await new Promise<void>((resolve) => setImmediate(resolve))
  assert.equal(successfulReturn, false)
})

test("H4-R3G-A runtime config requires trusted namespace identity and exposes no reader authority", () => {
  const commitResourceEvidence = () => ({})
  const config = validateGvisorCgroupV2RuntimeConfig({ version: KDO_H4_R3G_A_RUNTIME_CONFIG_VERSION, initialCgroupNamespaceIdentity: { device: "7", inode: "4026531835" }, commitResourceEvidence })
  assert.deepEqual(config.initialCgroupNamespaceIdentity, { device: "7", inode: "4026531835" }); assert.equal(config.commitResourceEvidence, commitResourceEvidence)
  assert.throws(() => validateGvisorCgroupV2RuntimeConfig({ version: KDO_H4_R3G_A_RUNTIME_CONFIG_VERSION, commitResourceEvidence }))
  assert.throws(() => validateGvisorCgroupV2RuntimeConfig({ version: KDO_H4_R3G_A_RUNTIME_CONFIG_VERSION, initialCgroupNamespaceIdentity: { device: 7, inode: "4026531835" }, commitResourceEvidence }))
  assert.throws(() => validateGvisorCgroupV2RuntimeConfig({ version: KDO_H4_R3G_A_RUNTIME_CONFIG_VERSION, initialCgroupNamespaceIdentity: { device: "7", inode: "4026531835" }, commitResourceEvidence, cgroupRoot: "/tmp/fake" }))
  assert.throws(() => validateGvisorCgroupV2RuntimeConfig({ version: KDO_H4_R3G_A_RUNTIME_CONFIG_VERSION, initialCgroupNamespaceIdentity: { device: "7", inode: "4026531835" }, commitResourceEvidence, readFile() {} }))
  assert.throws(() => validateGvisorCgroupV2RuntimeConfig({ version: KDO_H4_R3G_A_RUNTIME_CONFIG_VERSION, initialCgroupNamespaceIdentity: { device: "7", inode: "4026531835" }, commitResourceEvidence, pid: PID }))
  assert.throws(() => validateGvisorCgroupV2RuntimeConfig({ version: KDO_H4_R3G_A_RUNTIME_CONFIG_VERSION, initialCgroupNamespaceIdentity: { device: "7", inode: "4026531835" }, commitResourceEvidence, helperPath: "/tmp/helper" }))
})

test("H4-R3G-A gateway integration remains fixed-surface E3-only fail-closed authority", () => {
  const gatewaySource = source("../src/execution/gateway.ts")
  assert.doesNotMatch(gatewaySource, /createSandboxBackendObservation|createSandboxExecutionEvidence/)
  assert.match(gatewaySource, /async observeGvisorCgroupV2Resources\(/)
  assert.match(gatewaySource, /readGvisorCgroupV2RawSnapshot/)
  assert.match(gatewaySource, /readBoundedVirtualText/)
  assert.doesNotMatch(gatewaySource, /\brealpath\s*\(/)
  assert.match(gatewaySource, /\/proc\/self\/mountinfo/)
  assert.match(gatewaySource, /boundedR3GACallback/)
  assert.match(gatewaySource, /commitLineageEvidence/)
  assert.match(gatewaySource, /commitResourceEvidence/)
  const methodStart = gatewaySource.indexOf("async observeGvisorCgroupV2Resources(")
  assert.ok(methodStart >= 0)
  const methodSource = gatewaySource.slice(methodStart)
  assert.match(methodSource, /process\.platform !== "linux"/)
  assert.match(methodSource, /options\.signal\?\.aborted/)
  assert.doesNotMatch(methodSource, /options\.(?:pid|path|reader|helper)/)
})

test("H4-R3G-A production module is pure E3-only and protected R3B/R3E/R3F surfaces remain unchanged", () => {
  const moduleSource = source("../src/trust/sandbox-observer-gvisor-cgroup-v2.ts")
  assert.doesNotMatch(moduleSource, /createSandboxBackendObservation|createSandboxExecutionEvidence/)
  assert.doesNotMatch(moduleSource, /node:child_process|node:fs(?:\/promises)?|node:http|node:https|node:net|dockerode|containerd/)
  assert.match(moduleSource, /derivedHierarchy/); assert.match(moduleSource, /finiteRatio/); assert.match(moduleSource, /finiteLimit/); assert.match(moduleSource, /prePhysicalSnapshotIdentity/); assert.match(moduleSource, /CGROUP_NAMESPACE/); assert.match(moduleSource, /maxRecordSerializedBytes/)
  assert.equal(gitBlobSha1(source("../src/trust/sandbox-backend-evidence.ts")), "b9242c5cecc18fd43b2b80aeffd974ef5311fded")
  assert.equal(gitBlobSha1(source("../src/trust/sandbox-observer-gvisor.ts")), "47c792ba01c9ba4b2db94d7558f282cdbd218660")
  assert.equal(gitBlobSha1(source("../src/trust/sandbox-observer-gvisor-runtime.ts")), "1d02a5dbc1dc4071636c24327e7faf9906370ef5")
  assert.equal(gitBlobSha1(source("../src/trust/sandbox-observer-docker-control-plane.ts")), "452bd955cb0ef84f2090aa646dfdc70ad610a8d9")
})
