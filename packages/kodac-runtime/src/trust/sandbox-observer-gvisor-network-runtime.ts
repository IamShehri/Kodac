import { createHash, randomUUID } from "node:crypto"
import { open, type FileHandle } from "node:fs/promises"
import { spawn, type ChildProcess } from "node:child_process"
import type { Readable } from "node:stream"

import {
  KDO_H4_R3F_PROVIDER_ID,
  validateDockerControlPlaneObservation,
  validateDockerSocketEndpointIdentity,
  type DockerControlPlaneBindingProvider,
  type DockerControlPlaneObservation,
} from "./sandbox-observer-docker-control-plane.ts"
import {
  createGvisorObserverPlan,
  createGvisorRuntimeObservationCandidate,
  materializeGvisorStateCommand,
  materializeGvisorStatsCommand,
  parseGvisorProcessObservation,
  parseGvisorStateOutput,
  parseGvisorStatsOutput,
} from "./sandbox-observer-gvisor.ts"
import {
  KDO_H4_R3E_HELPER_FD,
  KDO_H4_R3E_LIMITS,
  KDO_H4_R3E_RUNSC_FD,
  createGvisorContainerBindingRequest,
  createGvisorExecutionAttemptIdentity,
  createGvisorObserverArtifact,
  createGvisorRuntimeLineageRecord,
  validateGvisorContainerBinding,
  validateGvisorObserverRuntimeConfig,
  validateGvisorRuntimeLineageCommit,
  type GvisorContainerBinding,
  type GvisorObserverArtifact,
  type GvisorObserverRuntimeConfig,
  type GvisorRuntimeLineageRecord,
} from "./sandbox-observer-gvisor-runtime.ts"
import {
  KDO_H4_R3G_C_LIMITS,
  createGvisorPhysicalNetworkRecord,
  observeGvisorNetworkTopologyOnce,
  validateGvisorNetworkObserverRuntimeConfig,
  validateGvisorPhysicalNetworkCommit,
  type GvisorNetworkObserverRuntimeConfig,
  type GvisorPhysicalNetworkRecord,
} from "./sandbox-observer-gvisor-network.ts"
import {
  validateSandboxExecutionRequirement,
  type SandboxExecutionRequirement,
} from "./sandbox-backend-evidence.ts"

export const KDO_H4_R3G_C_ORCHESTRATOR_VERSION = "kodac-h4-r3g-c-orchestrator-v1" as const

export interface GvisorPhysicalNetworkRuntimeDependencies {
  readonly gvisor: GvisorObserverRuntimeConfig
  readonly docker: DockerControlPlaneBindingProvider
  readonly network: GvisorNetworkObserverRuntimeConfig
}

interface TrustedArtifact {
  readonly handle: FileHandle
  readonly initialStat: Awaited<ReturnType<FileHandle["stat"]>>
  readonly artifact: GvisorObserverArtifact
}

function sha256Bytes(value: Uint8Array): string { return createHash("sha256").update(value).digest("hex") }
function identity(value: unknown, label: string): string {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/.test(value)) throw new TypeError(`${label} must be a lowercase SHA-256 identity`)
  return value
}
function sameStat(left: Awaited<ReturnType<FileHandle["stat"]>>, right: Awaited<ReturnType<FileHandle["stat"]>>): boolean {
  return left.dev === right.dev && left.ino === right.ino && left.size === right.size && left.mode === right.mode && left.uid === right.uid && left.gid === right.gid && left.nlink === right.nlink && left.mtimeMs === right.mtimeMs && left.ctimeMs === right.ctimeMs
}
async function hashFile(handle: FileHandle, sizeBytes: number, signal: AbortSignal, label: string): Promise<string> {
  const hash = createHash("sha256"); const buffer = Buffer.allocUnsafe(Math.min(64 * 1024, sizeBytes)); let offset = 0
  while (offset < sizeBytes) {
    if (signal.aborted) throw abortReason(signal, `${label} hash aborted`)
    const wanted = Math.min(buffer.byteLength, sizeBytes - offset); const { bytesRead } = await handle.read(buffer, 0, wanted, offset)
    if (bytesRead <= 0) throw new Error(`${label} changed while its retained descriptor was hashed`)
    hash.update(buffer.subarray(0, bytesRead)); offset += bytesRead
  }
  if (signal.aborted) throw abortReason(signal, `${label} hash aborted`)
  return hash.digest("hex")
}
async function observeTrustedArtifact(path: string, expectedSha256: string, role: "runsc" | "observer-helper", maximumBytes: number, signal: AbortSignal): Promise<TrustedArtifact> {
  if (signal.aborted) throw abortReason(signal, `R3G-C ${role} observation aborted before open`)
  const handle = await open(path, "r")
  try {
    const stat = await handle.stat()
    if (!stat.isFile()) throw new Error(`configured ${role} artifact must be a regular file`)
    if (!Number.isSafeInteger(stat.size) || stat.size <= 0 || stat.size > maximumBytes) throw new Error(`configured ${role} artifact size is outside the authorized bound`)
    const observedSha256 = await hashFile(handle, stat.size, signal, `R3G-C ${role}`); const stable = await handle.stat()
    if (!sameStat(stat, stable)) throw new Error(`configured ${role} artifact metadata changed during same-FD verification`)
    if (observedSha256 !== expectedSha256) throw new Error(`configured ${role} artifact SHA-256 does not match trusted runtime identity`)
    return Object.freeze({ handle, initialStat: stable, artifact: createGvisorObserverArtifact({ role, sha256: observedSha256, sizeBytes: stat.size }) })
  } catch (error) { await handle.close().catch(() => {}); throw error }
}
async function reverifyArtifact(value: TrustedArtifact, signal: AbortSignal): Promise<void> {
  if (signal.aborted) throw abortReason(signal, `R3G-C ${value.artifact.role} revalidation aborted`)
  const before = await value.handle.stat(); if (!sameStat(value.initialStat, before)) throw new Error(`R3G-C ${value.artifact.role} artifact metadata changed`)
  const digest = await hashFile(value.handle, value.artifact.sizeBytes, signal, `R3G-C ${value.artifact.role} final`); const after = await value.handle.stat()
  if (!sameStat(value.initialStat, after) || digest !== value.artifact.sha256) throw new Error(`R3G-C ${value.artifact.role} artifact changed during observation`)
}
function readBoundedStream(stream: Readable, maximum: number, label: string, onOverflow: () => void): Promise<Buffer> {
  return new Promise((resolvePromise, rejectPromise) => {
    const chunks: Buffer[] = []; let total = 0; let settled = false
    const reject = (error: Error) => { if (settled) return; settled = true; rejectPromise(error) }
    stream.on("data", (chunk: Buffer | string) => {
      if (settled) return
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      if (total + bytes.byteLength > maximum) { onOverflow(); reject(new Error(`${label} exceeds ${maximum} bytes`)); return }
      total += bytes.byteLength; chunks.push(Buffer.from(bytes))
    })
    stream.once("error", (error) => reject(error instanceof Error ? error : new Error(String(error))))
    stream.once("end", () => { if (settled) return; settled = true; resolvePromise(Buffer.concat(chunks, total)) })
  })
}
function waitForChild(child: ChildProcess): Promise<{ exitCode: number | null; signal: NodeJS.Signals | null }> {
  return new Promise((resolvePromise, rejectPromise) => { child.once("error", rejectPromise); child.once("exit", (exitCode, signal) => resolvePromise({ exitCode, signal })) })
}
async function runRetainedCommand(options: {
  executableFd: typeof KDO_H4_R3E_RUNSC_FD | typeof KDO_H4_R3E_HELPER_FD
  runscParentFd: number
  helperParentFd?: number
  args: readonly string[]
  maxStdoutBytes: number
  timeoutMs: number
  label: string
  signal: AbortSignal
}): Promise<string> {
  if (options.signal.aborted) throw abortReason(options.signal, `${options.label} aborted before spawn`)
  const child = options.helperParentFd === undefined
    ? spawn(`/proc/self/fd/${options.executableFd}`, [...options.args], { cwd: "/", env: { LANG: "C", LC_ALL: "C" }, windowsHide: true, shell: false, timeout: options.timeoutMs, signal: options.signal, killSignal: "SIGKILL", stdio: ["ignore", "pipe", "pipe", options.runscParentFd] })
    : spawn(`/proc/self/fd/${options.executableFd}`, [...options.args], { cwd: "/", env: { LANG: "C", LC_ALL: "C" }, windowsHide: true, shell: false, timeout: options.timeoutMs, signal: options.signal, killSignal: "SIGKILL", stdio: ["ignore", "pipe", "pipe", options.runscParentFd, options.helperParentFd] })
  const stdout = child.stdout; const stderr = child.stderr
  if (!stdout || !stderr) { child.kill("SIGKILL"); throw new Error(`${options.label} did not expose bounded stdout/stderr`) }
  const kill = () => child.kill("SIGKILL")
  const stdoutPromise = readBoundedStream(stdout, options.maxStdoutBytes, `${options.label} stdout`, kill)
  const stderrPromise = readBoundedStream(stderr, KDO_H4_R3E_LIMITS.maxStderrBytes, `${options.label} stderr`, kill)
  void stdoutPromise.catch(() => {}); void stderrPromise.catch(() => {})
  const exit = await waitForChild(child); const [stdoutBytes, stderrBytes] = await Promise.all([stdoutPromise, stderrPromise])
  if (exit.exitCode !== 0) throw new Error(`${options.label} failed: code=${String(exit.exitCode)} signal=${String(exit.signal)} stderr=${stderrBytes.toString("utf8")}`)
  return stdoutBytes.toString("utf8")
}

function abortReason(signal: AbortSignal, fallback: string): Error {
  const reason = signal.reason
  return reason instanceof Error ? reason : new Error(fallback)
}
function validateDockerProvider(value: DockerControlPlaneBindingProvider, gvisor: GvisorObserverRuntimeConfig, requirement: SandboxExecutionRequirement): DockerControlPlaneBindingProvider {
  if (value === null || typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) throw new TypeError("R3G-C Docker provider must be the trusted plain R3F provider object")
  if (value.providerId !== KDO_H4_R3F_PROVIDER_ID) throw new TypeError("R3G-C Docker provider must be docker-engine")
  identity(value.providerIdentity, "R3G-C Docker providerIdentity")
  validateDockerSocketEndpointIdentity(value.socketEndpoint)
  if (value.requirementIdentity !== requirement.requirementIdentity || value.workloadIdentity !== requirement.workload.workloadIdentity) throw new TypeError("R3G-C Docker provider is bound to a different requirement/workload")
  if (typeof value.resolveDockerControlPlaneBinding !== "function" || typeof value.resolveContainerBinding !== "function") throw new TypeError("R3G-C Docker provider does not expose canonical R3F resolution methods")
  if (value.resolveContainerBinding !== gvisor.resolveContainerBinding) throw new TypeError("R3G-C Docker provider is not the exact resolver configured for R3E")
  return value
}

interface Deadline {
  readonly signal: AbortSignal
  readonly check: (label: string) => void
  readonly bounded: <T>(label: string, maximumMs: number, operation: () => Promise<T> | T) => Promise<T>
  readonly cleanup: () => void
}
function createDeadline(callerSignal?: AbortSignal): Deadline {
  const controller = new AbortController(); const startedNs = process.hrtime.bigint(); const deadlineNs = startedNs + BigInt(KDO_H4_R3G_C_LIMITS.totalObservationTimeoutMs) * 1_000_000n
  let callerAbortHandler: (() => void) | undefined
  const abort = (reason: Error) => { if (!controller.signal.aborted) controller.abort(reason) }
  const timer = setTimeout(() => abort(new Error("R3G-C total monotonic observation deadline expired")), KDO_H4_R3G_C_LIMITS.totalObservationTimeoutMs)
  if (callerSignal !== undefined) {
    callerAbortHandler = () => abort(new Error("R3G-C observation aborted by caller")); callerSignal.addEventListener("abort", callerAbortHandler, { once: true }); if (callerSignal.aborted) callerAbortHandler()
  }
  const check = (label: string) => {
    if (process.hrtime.bigint() >= deadlineNs) abort(new Error("R3G-C total monotonic observation deadline expired"))
    if (controller.signal.aborted) throw new Error(`${label}: ${abortReason(controller.signal, "R3G-C observation aborted").message}`, { cause: abortReason(controller.signal, "R3G-C observation aborted") })
  }
  const bounded = async <T>(label: string, maximumMs: number, operation: () => Promise<T> | T): Promise<T> => {
    check(label)
    const remainingNs = deadlineNs - process.hrtime.bigint(); if (remainingNs <= 0n) { abort(new Error("R3G-C total monotonic observation deadline expired")); check(label) }
    const remainingMs = Math.max(1, Number((remainingNs + 999_999n) / 1_000_000n)); const timeoutMs = Math.min(maximumMs, remainingMs)
    let timeout: NodeJS.Timeout | undefined; let abortHandler: (() => void) | undefined
    const timeoutPromise = new Promise<never>((_, rejectPromise) => { timeout = setTimeout(() => rejectPromise(new Error(`${label} timed out`)), timeoutMs) })
    const abortPromise = new Promise<never>((_, rejectPromise) => { abortHandler = () => rejectPromise(abortReason(controller.signal, `${label} aborted`)); controller.signal.addEventListener("abort", abortHandler, { once: true }); if (controller.signal.aborted) abortHandler() })
    try { const result = await Promise.race([Promise.resolve().then(operation), timeoutPromise, abortPromise]); check(label); return result }
    finally { if (timeout !== undefined) clearTimeout(timeout); if (abortHandler !== undefined) controller.signal.removeEventListener("abort", abortHandler) }
  }
  return Object.freeze({ signal: controller.signal, check, bounded, cleanup: () => { clearTimeout(timer); if (callerAbortHandler !== undefined) callerSignal?.removeEventListener("abort", callerAbortHandler) } })
}

async function observeR3eLineage(input: {
  requirement: SandboxExecutionRequirement
  executionAttemptIdentity: string
  binding: GvisorContainerBinding
  runtime: GvisorObserverRuntimeConfig
  runsc: TrustedArtifact
  helper: TrustedArtifact
  signal: AbortSignal
  label: string
}): Promise<GvisorRuntimeLineageRecord> {
  const plan = createGvisorObserverPlan({ runscPath: input.runtime.runscPath, expectedRunscSha256: input.runtime.expectedRunscSha256, runtimeRoot: input.runtime.runtimeRoot, containerId: input.binding.containerId })
  const stateCommand = materializeGvisorStateCommand(plan); const statsCommand = materializeGvisorStatsCommand(plan)
  const state1 = parseGvisorStateOutput(await runRetainedCommand({ executableFd: KDO_H4_R3E_RUNSC_FD, runscParentFd: input.runsc.handle.fd, args: stateCommand.args, maxStdoutBytes: KDO_H4_R3E_LIMITS.maxStateStdoutBytes, timeoutMs: KDO_H4_R3E_LIMITS.stateTimeoutMs, label: `${input.label} state #1`, signal: input.signal }), plan)
  const process1 = parseGvisorProcessObservation(await runRetainedCommand({ executableFd: KDO_H4_R3E_HELPER_FD, runscParentFd: input.runsc.handle.fd, helperParentFd: input.helper.handle.fd, args: ["--pid", String(state1.pid)], maxStdoutBytes: KDO_H4_R3E_LIMITS.maxHelperStdoutBytes, timeoutMs: KDO_H4_R3E_LIMITS.helperTimeoutMs, label: `${input.label} process #1`, signal: input.signal }))
  if (process1.pid !== state1.pid) throw new Error(`${input.label} process #1 PID mismatch`)
  const stats = parseGvisorStatsOutput(await runRetainedCommand({ executableFd: KDO_H4_R3E_RUNSC_FD, runscParentFd: input.runsc.handle.fd, args: statsCommand.args, maxStdoutBytes: KDO_H4_R3E_LIMITS.maxStatsStdoutBytes, timeoutMs: KDO_H4_R3E_LIMITS.statsTimeoutMs, label: `${input.label} stats`, signal: input.signal }), plan)
  const state2 = parseGvisorStateOutput(await runRetainedCommand({ executableFd: KDO_H4_R3E_RUNSC_FD, runscParentFd: input.runsc.handle.fd, args: stateCommand.args, maxStdoutBytes: KDO_H4_R3E_LIMITS.maxStateStdoutBytes, timeoutMs: KDO_H4_R3E_LIMITS.stateTimeoutMs, label: `${input.label} state #2`, signal: input.signal }), plan)
  const process2 = parseGvisorProcessObservation(await runRetainedCommand({ executableFd: KDO_H4_R3E_HELPER_FD, runscParentFd: input.runsc.handle.fd, helperParentFd: input.helper.handle.fd, args: ["--pid", String(state2.pid)], maxStdoutBytes: KDO_H4_R3E_LIMITS.maxHelperStdoutBytes, timeoutMs: KDO_H4_R3E_LIMITS.helperTimeoutMs, label: `${input.label} process #2`, signal: input.signal }))
  if (process2.pid !== state2.pid || state1.stateIdentity !== state2.stateIdentity || process1.processIdentity !== process2.processIdentity) throw new Error(`${input.label} exact-instance bracket changed`)
  await reverifyArtifact(input.runsc, input.signal); await reverifyArtifact(input.helper, input.signal)
  const candidate = createGvisorRuntimeObservationCandidate({ plan, state: state1, stats, process: process1 })
  return createGvisorRuntimeLineageRecord({ executionAttemptIdentity: input.executionAttemptIdentity, requirement: input.requirement, binding: input.binding, runsc: input.runsc.artifact, helper: input.helper.artifact, plan, state: state1, stats, process: process1, candidate })
}

export async function observeGvisorPhysicalNetworkRuntime(input: {
  requirement: SandboxExecutionRequirement
  dependencies: GvisorPhysicalNetworkRuntimeDependencies
  signal?: AbortSignal
}): Promise<GvisorPhysicalNetworkRecord> {
  if (process.platform !== "linux") throw new Error("R3G-C physical network runtime requires Linux")
  const requirement = validateSandboxExecutionRequirement(input.requirement)
  if (requirement.requiredSemanticRuntimeClass !== "gvisor") throw new TypeError("R3G-C requires requiredSemanticRuntimeClass=gvisor")
  const gvisor = validateGvisorObserverRuntimeConfig(input.dependencies.gvisor)
  const network = validateGvisorNetworkObserverRuntimeConfig(input.dependencies.network)
  const docker = validateDockerProvider(input.dependencies.docker, gvisor, requirement)
  const deadline = createDeadline(input.signal)
  let runsc: TrustedArtifact | undefined; let helper: TrustedArtifact | undefined
  try {
    deadline.check("R3G-C preflight")
    const executionAttemptIdentity = createGvisorExecutionAttemptIdentity({ requirementIdentity: requirement.requirementIdentity, workloadIdentity: requirement.workload.workloadIdentity, nonce: randomUUID() })
    const bindingRequest = createGvisorContainerBindingRequest({ executionAttemptIdentity, requirement })
    const resolution = await deadline.bounded("R3G-C fresh R3F Docker observation", KDO_H4_R3G_C_LIMITS.totalObservationTimeoutMs, () => docker.resolveDockerControlPlaneBinding(bindingRequest, { signal: deadline.signal }))
    const binding = validateGvisorContainerBinding(resolution.binding, bindingRequest)
    const dockerObservation: DockerControlPlaneObservation = validateDockerControlPlaneObservation(resolution.observation)
    if (dockerObservation.executionAttemptIdentity !== executionAttemptIdentity || dockerObservation.bindingIdentity !== binding.bindingIdentity || dockerObservation.containerId !== binding.containerId) throw new Error("R3G-C R3F observation does not bind the exact resolved subject")
    runsc = await observeTrustedArtifact(gvisor.runscPath, gvisor.expectedRunscSha256, "runsc", KDO_H4_R3E_LIMITS.maxRunscBytes, deadline.signal)
    helper = await observeTrustedArtifact(gvisor.observerHelperPath, gvisor.expectedObserverHelperSha256, "observer-helper", KDO_H4_R3E_LIMITS.maxHelperBytes, deadline.signal)
    if (runsc.initialStat.dev === helper.initialStat.dev && runsc.initialStat.ino === helper.initialStat.ino) throw new Error("R3G-C runsc and observer helper must be distinct retained files")

    const r3eBefore = await observeR3eLineage({ requirement, executionAttemptIdentity, binding, runtime: gvisor, runsc, helper, signal: deadline.signal, label: "R3G-C R3E-before" })
    const rawBeforeCommit = await deadline.bounded("R3G-C R3E-before durable commit", KDO_H4_R3G_C_LIMITS.commitTimeoutMs, () => gvisor.commitLineageEvidence(r3eBefore)); validateGvisorRuntimeLineageCommit(rawBeforeCommit, r3eBefore)

    const firstRead = await observeGvisorNetworkTopologyOnce({ runtimeRoot: gvisor.runtimeRoot, trustedHostUid: network.trustedHostUid, runtimeLineage: r3eBefore, signal: deadline.signal })
    const secondRead = await observeGvisorNetworkTopologyOnce({ runtimeRoot: gvisor.runtimeRoot, trustedHostUid: network.trustedHostUid, runtimeLineage: r3eBefore, signal: deadline.signal })

    const r3eAfter = await observeR3eLineage({ requirement, executionAttemptIdentity, binding, runtime: gvisor, runsc, helper, signal: deadline.signal, label: "R3G-C R3E-after" })
    const rawAfterCommit = await deadline.bounded("R3G-C R3E-after durable commit", KDO_H4_R3G_C_LIMITS.commitTimeoutMs, () => gvisor.commitLineageEvidence(r3eAfter)); validateGvisorRuntimeLineageCommit(rawAfterCommit, r3eAfter)

    const record = createGvisorPhysicalNetworkRecord({ r3eBefore, r3eAfter, dockerControlPlane: dockerObservation, firstRead, secondRead, trustedHostSerializationTheoremVersion: network.trustedHostSerializationTheoremVersion })
    deadline.check("R3G-C before durable physical-network commit")
    const rawCommit = await deadline.bounded("R3G-C durable physical-network commit", KDO_H4_R3G_C_LIMITS.commitTimeoutMs, () => network.commitNetworkEvidence(record))
    validateGvisorPhysicalNetworkCommit(rawCommit, record)
    deadline.check("R3G-C after durable physical-network acknowledgment")
    return record
  } finally {
    deadline.cleanup(); await helper?.handle.close().catch(() => {}); await runsc?.handle.close().catch(() => {})
  }
}
