import { execFile, spawn, type ChildProcess } from "node:child_process"
import { createHash, randomUUID } from "node:crypto"
import { open, type FileHandle } from "node:fs/promises"
import { isAbsolute, relative, resolve, sep } from "node:path"
import type { Readable, Writable } from "node:stream"
import type { WorkspaceFileSystem } from "../edit/filesystem.ts"
import { applyHunks, parsePatch, type AffectedPaths } from "../edit/patch.ts"
import { createReceipt, type ApprovalReceiptBinding, type ExecutionReceipt } from "../evidence/receipt.ts"
import { isFullGitObjectId } from "../repository/contracts.ts"
import {
  KDO_H4_R1_APPROVAL_VERSION,
  createApprovalEvidence,
  createApprovalRequest,
  validateApprovalDecision,
  validateApprovalEvidenceCommit,
  type ApprovalOutcome,
  type ApprovalRuntime,
} from "../trust/approval.ts"
import {
  createConfinementEnforcementEvidence,
  createConfinementRequest,
} from "../trust/confinement.ts"
import {
  KDO_H4_R2B_LINUX_LANDLOCK_CLAIM_SET,
  createLinuxLandlockBackendDescriptor,
  createLinuxLandlockLaunchPlan,
} from "../trust/confinement-linux-landlock.ts"
import {
  KDO_H4_R2C_BOOTSTRAP_ENVIRONMENT_POLICY,
  KDO_H4_R2C_CONTROL_FLAG,
  KDO_H4_R2C_LAUNCHER_FD,
  KDO_H4_R2C_LAUNCHER_WRITE_PROTECTION,
  KDO_H4_R2C_MAX_LAUNCHER_BYTES,
  KDO_H4_R2C_PERMIT_FD,
  KDO_H4_R2C_READY_FD,
  KDO_H4_R2C_READY_MAX_BYTES,
  KDO_H4_R2C_RUNTIME_VERSION,
  createConfinementExecutionAttempt,
  createConfinementReceiptBinding,
  createDurableConfinementEvidenceRecord,
  createLauncherArtifactObservation,
  createLauncherArtifactWriteProtection,
  createLocalWorkspaceRootIdentity,
  linuxLandlockReadyReason,
  parseLinuxLandlockReadyRecord,
  validateDurableConfinementEvidenceCommit,
  validateLinuxLandlockRuntimeConfig,
  type ConfinementReceiptBinding,
  type LauncherArtifactObservation,
  type LinuxLandlockRuntimeConfig,
} from "../trust/confinement-runtime.ts"
import type { ExecutionIntent, PolicyEngine, PolicyResult } from "../trust/policy.ts"

export interface ExecutionObserver {
  onIntent?(intent: ExecutionIntent): Promise<void> | void
  onPolicy?(intent: ExecutionIntent, policy: PolicyResult): Promise<void> | void
  onReceipt?(receipt: ExecutionReceipt): Promise<void> | void
}

export class ExecutionBlockedError extends Error {
  readonly receipt: ExecutionReceipt

  constructor(message: string, receipt: ExecutionReceipt) {
    super(message)
    this.name = "ExecutionBlockedError"
    this.receipt = receipt
  }
}

export class ExecutionFailedError extends Error {
  readonly receipt: ExecutionReceipt

  constructor(message: string, receipt: ExecutionReceipt, options?: ErrorOptions) {
    super(message, options)
    this.name = "ExecutionFailedError"
    this.receipt = receipt
  }
}

export class ExecutionUnprovenError extends Error {
  readonly receipt: ExecutionReceipt

  constructor(message: string, receipt: ExecutionReceipt, options?: ErrorOptions) {
    super(message, options)
    this.name = "ExecutionUnprovenError"
    this.receipt = receipt
  }
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

function sha256Bytes(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex")
}

function uniquePaths(paths: string[]): string[] {
  return [...new Set(paths)].sort()
}

function immutableExecutionIntent(intent: ExecutionIntent): ExecutionIntent {
  const paths = Object.freeze([...intent.paths]) as unknown as string[]
  return Object.freeze({
    capability: intent.capability,
    paths,
    inputDigest: intent.inputDigest,
  })
}

function immutablePolicyResult(value: PolicyResult): PolicyResult {
  const decision = value.decision
  const reason = value.reason
  if (decision !== "allow" && decision !== "ask" && decision !== "deny") {
    throw new TypeError("policy decision is invalid")
  }
  if (typeof reason !== "string") throw new TypeError("policy reason must be a string")
  return Object.freeze({ decision, reason })
}

function portablePath(path: string): string {
  return path.split(sep).join("/")
}

function canonicalWorkspaceRelativePath(root: string, path: string): string {
  const absoluteRoot = resolve(root)
  const absoluteTarget = resolve(absoluteRoot, path)
  const rel = relative(absoluteRoot, absoluteTarget)
  if (!rel || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new Error(`Workspace path must resolve to a regular relative file: ${path}`)
  }
  return rel.split(sep).join("/")
}

function canonicalParent(path: string): string {
  const separator = path.lastIndexOf("/")
  return separator < 0 ? "." : path.slice(0, separator)
}

function canonicalEnvironment(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  return Object.fromEntries(
    Object.entries(env)
      .filter((entry): entry is [string, string] => typeof entry[1] === "string")
      .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0),
  )
}

const R2C_UNSAFE_BOOTSTRAP_ENVIRONMENT_KEYS = new Set(["GCONV_PATH", "GLIBC_TUNABLES"])

function unsafeLinuxLoaderEnvironmentKey(env: NodeJS.ProcessEnv): string | undefined {
  return Object.keys(env).find((key) => key.startsWith("LD_") || R2C_UNSAFE_BOOTSTRAP_ENVIRONMENT_KEYS.has(key))
}

function blockedReceipt(
  intent: ExecutionIntent,
  policy: PolicyResult,
  startedAt: string,
  reason = policy.reason,
): ExecutionReceipt {
  return createReceipt({
    capability: intent.capability,
    inputDigest: intent.inputDigest,
    paths: intent.paths,
    policy,
    startedAt,
    completedAt: new Date().toISOString(),
    result: { status: "blocked", reason },
  })
}

async function persistReceipt(observer: ExecutionObserver | undefined, receipt: ExecutionReceipt): Promise<void> {
  try {
    await observer?.onReceipt?.(receipt)
  } catch (error) {
    throw new ExecutionUnprovenError("Execution evidence could not be persisted.", receipt, { cause: error })
  }
}

function normalizedAllowedExitCodes(values: number[] | undefined): number[] {
  const resolved = values ?? [0]
  if (resolved.length === 0) throw new Error("allowedExitCodes must contain at least one exit code")
  const unique = [...new Set(resolved)]
  for (const value of unique) {
    if (!Number.isInteger(value) || value < 0 || value > 255) throw new Error("allowedExitCodes must contain integers from 0 through 255")
  }
  return unique.sort((left, right) => left - right)
}

interface ProcessOptions {
  signal?: AbortSignal
  maxOutputBytes: number
  timeoutMs: number
  env: NodeJS.ProcessEnv
  allowedExitCodes: number[]
}

function runProcess(
  executable: string,
  args: string[],
  cwd: string,
  options: ProcessOptions,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolvePromise, rejectPromise) => {
    execFile(
      executable,
      args,
      {
        cwd,
        encoding: "utf8",
        windowsHide: true,
        timeout: options.timeoutMs,
        maxBuffer: options.maxOutputBytes,
        signal: options.signal,
        env: options.env,
      },
      (error, stdout, stderr) => {
        if (error) {
          const code = (error as { code?: unknown }).code
          if (typeof code === "number" && options.allowedExitCodes.includes(code)) {
            resolvePromise({ stdout, stderr, exitCode: code })
            return
          }
          rejectPromise(error)
          return
        }
        resolvePromise({ stdout, stderr, exitCode: 0 })
      },
    )
  })
}

function parseGitHeadOutput(stdout: string): string {
  const head = stdout.trim()
  if (!isFullGitObjectId(head)) throw new Error("git rev-parse HEAD did not return a full object id")
  return head.toLowerCase()
}

function parseGitHashObjectOutput(stdout: string, expectedCount: number): string[] {
  const objectIds = stdout.split(/\r?\n/).filter(Boolean)
  if (objectIds.length !== expectedCount) throw new Error("git hash-object result count does not match requested path count")
  return objectIds.map((gitObjectId) => {
    if (!isFullGitObjectId(gitObjectId)) throw new Error("git hash-object returned an invalid object id")
    return gitObjectId.toLowerCase()
  })
}

async function digestAffectedState(fs: WorkspaceFileSystem, affected: AffectedPaths): Promise<string> {
  const rows: string[] = []
  for (const path of [...affected.added, ...affected.modified].sort()) {
    rows.push(`${path}\0${sha256(await fs.readText(path))}`)
  }
  for (const path of [...affected.deleted].sort()) rows.push(`${path}\0<deleted>`)
  return sha256(rows.join("\n"))
}

async function readBoundedStream(
  stream: Readable,
  maxBytes: number,
  label: string,
  onOverflow?: () => void,
): Promise<Buffer> {
  return new Promise((resolvePromise, rejectPromise) => {
    const chunks: Buffer[] = []
    let total = 0
    let settled = false
    const reject = (error: Error) => {
      if (settled) return
      settled = true
      rejectPromise(error)
    }
    stream.on("data", (chunk: Buffer | string) => {
      if (settled) return
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      if (total + bytes.byteLength > maxBytes) {
        onOverflow?.()
        reject(new Error(`${label} exceeds ${maxBytes} bytes`))
        return
      }
      total += bytes.byteLength
      chunks.push(Buffer.from(bytes))
    })
    stream.once("error", (error) => reject(error instanceof Error ? error : new Error(String(error))))
    stream.once("end", () => {
      if (settled) return
      settled = true
      resolvePromise(Buffer.concat(chunks, total))
    })
  })
}

function waitForChild(child: ChildProcess): Promise<{ exitCode: number | null; signal: NodeJS.Signals | null }> {
  return new Promise((resolvePromise, rejectPromise) => {
    child.once("error", rejectPromise)
    child.once("close", (exitCode, signal) => resolvePromise({ exitCode, signal }))
  })
}

function awaitEvidenceCommit<T>(
  commit: () => Promise<T> | T,
  exitPromise: Promise<{ exitCode: number | null; signal: NodeJS.Signals | null }>,
): Promise<T> {
  const commitPromise = Promise.resolve().then(commit)
  const exitBeforeCommit = exitPromise.then(({ exitCode, signal }) => {
    throw new Error(
      `controlled Landlock launcher exited before durable confinement evidence committed: code=${String(exitCode)} signal=${String(signal)}`,
    )
  })
  void exitBeforeCommit.catch(() => {})
  return Promise.race([commitPromise, exitBeforeCommit])
}

function endWritable(stream: Writable | undefined): void {
  if (!stream || stream.destroyed || stream.writableEnded) return
  try {
    stream.end()
  } catch {
    // Closing a permit channel is best-effort cleanup; no target can be released
    // because no GO bytes are written here.
  }
}

function releaseGo(stream: Writable): Promise<void> {
  return new Promise((resolvePromise, rejectPromise) => {
    const onError = (error: Error) => rejectPromise(error)
    stream.once("error", onError)
    stream.end("GO\n", "ascii", () => {
      stream.off("error", onError)
      resolvePromise()
    })
  })
}

function sameLauncherStat(
  before: Awaited<ReturnType<FileHandle["stat"]>>,
  after: Awaited<ReturnType<FileHandle["stat"]>>,
): boolean {
  return before.dev === after.dev &&
    before.ino === after.ino &&
    before.size === after.size &&
    before.mode === after.mode &&
    before.uid === after.uid &&
    before.gid === after.gid &&
    before.nlink === after.nlink &&
    before.mtimeMs === after.mtimeMs &&
    before.ctimeMs === after.ctimeMs
}

async function observeLauncherArtifact(config: LinuxLandlockRuntimeConfig): Promise<{
  handle: FileHandle
  observation: LauncherArtifactObservation
}> {
  if (typeof process.geteuid !== "function" || process.geteuid() === 0) {
    throw new Error("R2C launcher write protection requires a non-root K2 host process")
  }

  const handle = await open(config.launcherPath, "r")
  try {
    const stat = await handle.stat()
    if (!stat.isFile()) throw new Error("configured Landlock launcher must be a regular file")
    if (!Number.isSafeInteger(stat.size) || stat.size <= 0 || stat.size > KDO_H4_R2C_MAX_LAUNCHER_BYTES) {
      throw new Error(`configured Landlock launcher must contain 1..${KDO_H4_R2C_MAX_LAUNCHER_BYTES} bytes`)
    }
    const writeProtection = createLauncherArtifactWriteProtection({
      ownerUid: stat.uid,
      ownerGid: stat.gid,
      permissions: stat.mode & 0o777,
      linkCount: stat.nlink,
    })
    const bytes = Buffer.allocUnsafe(stat.size)
    let offset = 0
    while (offset < bytes.byteLength) {
      const { bytesRead } = await handle.read(bytes, offset, bytes.byteLength - offset, offset)
      if (bytesRead <= 0) throw new Error("configured Landlock launcher changed while its verified descriptor was read")
      offset += bytesRead
    }
    const stableStat = await handle.stat()
    if (!sameLauncherStat(stat, stableStat)) {
      throw new Error("configured Landlock launcher metadata changed during same-FD verification")
    }
    const digest = sha256Bytes(bytes)
    const observation = createLauncherArtifactObservation({
      launcherPath: config.launcherPath,
      sha256: digest,
      sizeBytes: bytes.byteLength,
      writeProtection,
    })
    if (observation.sha256 !== config.expectedLauncherSha256) {
      throw new Error("configured Landlock launcher SHA-256 does not match trusted runtime identity")
    }
    return { handle, observation }
  } catch (error) {
    await handle.close().catch(() => {})
    throw error
  }
}

export class ExecutionGateway {
  private readonly fs: WorkspaceFileSystem
  private readonly policy: PolicyEngine
  private readonly approval?: ApprovalRuntime
  private readonly confinement?: LinuxLandlockRuntimeConfig

  constructor(
    fs: WorkspaceFileSystem,
    policy: PolicyEngine,
    approval?: ApprovalRuntime,
    confinement?: LinuxLandlockRuntimeConfig,
  ) {
    this.fs = fs
    this.policy = policy
    this.approval = approval
    this.confinement = confinement === undefined ? undefined : validateLinuxLandlockRuntimeConfig(confinement)
  }

  private async block(
    intent: ExecutionIntent,
    policy: PolicyResult,
    startedAt: string,
    observer: ExecutionObserver | undefined,
    reason: string,
    message: string,
  ): Promise<never> {
    const receipt = blockedReceipt(intent, policy, startedAt, reason)
    await persistReceipt(observer, receipt)
    throw new ExecutionBlockedError(message, receipt)
  }

  private async authorize(
    intent: ExecutionIntent,
    policy: PolicyResult,
    startedAt: string,
    observer: ExecutionObserver | undefined,
    signal?: AbortSignal,
  ): Promise<ApprovalReceiptBinding | undefined> {
    if (policy.decision === "allow") return undefined
    if (policy.decision === "deny") {
      return this.block(intent, policy, startedAt, observer, policy.reason, `Execution denied: ${policy.reason}`)
    }

    const runtime = this.approval
    if (!runtime) {
      return this.block(intent, policy, startedAt, observer, policy.reason, `Approval required: ${policy.reason}`)
    }

    const request = createApprovalRequest(intent)
    const askedEvidence = createApprovalEvidence(request, "asked")
    try {
      const commit = await runtime.evidence.commit(askedEvidence)
      validateApprovalEvidenceCommit(commit, askedEvidence)
    } catch {
      return this.block(
        intent,
        policy,
        startedAt,
        observer,
        "approval asked evidence could not be durably committed",
        "Approval unavailable: asked evidence could not be durably committed",
      )
    }

    let outcome: ApprovalOutcome
    try {
      if (signal?.aborted) {
        outcome = "cancelled"
      } else {
        const rawDecision = await runtime.service.decide(request, { signal })
        outcome = signal?.aborted ? "cancelled" : validateApprovalDecision(rawDecision, request).outcome
      }
    } catch {
      outcome = signal?.aborted ? "cancelled" : "unavailable"
    }

    const decisionEvidence = createApprovalEvidence(request, "decided", outcome)
    try {
      const commit = await runtime.evidence.commit(decisionEvidence)
      validateApprovalEvidenceCommit(commit, decisionEvidence)
    } catch {
      return this.block(
        intent,
        policy,
        startedAt,
        observer,
        "approval decision evidence could not be durably committed",
        "Approval unavailable: decision evidence could not be durably committed",
      )
    }

    if (outcome !== "allowed-once") {
      return this.block(
        intent,
        policy,
        startedAt,
        observer,
        `one-shot approval outcome: ${outcome}`,
        `Execution blocked by one-shot approval outcome: ${outcome}`,
      )
    }

    if (signal?.aborted) {
      return this.block(
        intent,
        policy,
        startedAt,
        observer,
        "operation aborted after one-shot approval",
        "Execution blocked: operation aborted after one-shot approval",
      )
    }

    return Object.freeze({
      version: KDO_H4_R1_APPROVAL_VERSION,
      requestIdentity: request.requestIdentity,
      requestInstanceId: request.requestInstanceId,
      decisionEvidenceIdentity: decisionEvidence.evidenceIdentity,
      outcome: "allowed-once",
    })
  }

  async applyPatch(
    patchText: string,
    observer?: ExecutionObserver,
    options: { signal?: AbortSignal } = {},
  ): Promise<{ affected: Awaited<ReturnType<typeof applyHunks>>; receipt: ExecutionReceipt }> {
    const startedAt = new Date().toISOString()
    const parsed = parsePatch(patchText)
    const paths = uniquePaths(
      parsed.hunks.flatMap((hunk) =>
        hunk.type === "update" && hunk.movePath ? [hunk.path, hunk.movePath] : [hunk.path],
      ),
    )
    const intent = immutableExecutionIntent({
      capability: "repo.apply_patch",
      paths,
      inputDigest: sha256(patchText),
    })
    await observer?.onIntent?.(intent)

    const policy = immutablePolicyResult(await this.policy.evaluate(intent))
    await observer?.onPolicy?.(intent, policy)
    const approval = await this.authorize(intent, policy, startedAt, observer, options.signal)
    if (options.signal?.aborted) {
      return this.block(
        intent,
        policy,
        startedAt,
        observer,
        "operation aborted before patch execution",
        "Execution blocked: operation aborted before patch execution",
      )
    }

    let affected: Awaited<ReturnType<typeof applyHunks>>
    try {
      affected = await applyHunks(this.fs, parsed.hunks)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const receipt = createReceipt({
        capability: intent.capability,
        inputDigest: intent.inputDigest,
        paths: intent.paths,
        policy,
        ...(approval === undefined ? {} : { approval }),
        startedAt,
        completedAt: new Date().toISOString(),
        result: { status: "failure", error: message },
      })
      await persistReceipt(observer, receipt)
      throw new ExecutionFailedError(`Patch execution failed: ${message}`, receipt, { cause: error })
    }

    const receipt = createReceipt({
      capability: intent.capability,
      inputDigest: intent.inputDigest,
      paths: intent.paths,
      policy,
      ...(approval === undefined ? {} : { approval }),
      startedAt,
      completedAt: new Date().toISOString(),
      result: { status: "success", affected, postStateDigest: await digestAffectedState(this.fs, affected) },
    })
    await persistReceipt(observer, receipt)
    return { affected, receipt }
  }

  async gitDiff(
    requestedPaths: string[] = [],
    observer?: ExecutionObserver,
    options: { signal?: AbortSignal; maxOutputBytes?: number; timeoutMs?: number } = {},
  ): Promise<{ diff: string; receipt: ExecutionReceipt }> {
    const paths = uniquePaths(requestedPaths)
    return this.runReadOnlyCommand(
      "git.diff",
      "git",
      ["diff", "--no-ext-diff", "--no-color", "--", ...paths],
      paths,
      observer,
      options,
      "git diff",
    ).then(({ stdout, receipt }) => ({ diff: stdout, receipt }))
  }

  async gitHead(
    observer?: ExecutionObserver,
    options: { signal?: AbortSignal; maxOutputBytes?: number; timeoutMs?: number } = {},
  ): Promise<{ head: string; receipt: ExecutionReceipt }> {
    const result = await this.runReadOnlyCommand(
      "git.head",
      "git",
      ["rev-parse", "--verify", "HEAD"],
      [],
      observer,
      { ...options, maxOutputBytes: options.maxOutputBytes ?? 4096, timeoutMs: options.timeoutMs ?? 5_000 },
      "git rev-parse HEAD",
      (stdout) => {
        parseGitHeadOutput(stdout)
      },
    )
    return { head: parseGitHeadOutput(result.stdout), receipt: result.receipt }
  }

  async gitStatus(
    observer?: ExecutionObserver,
    options: { signal?: AbortSignal; maxOutputBytes?: number; timeoutMs?: number } = {},
  ): Promise<{ status: string; receipt: ExecutionReceipt }> {
    return this.runReadOnlyCommand(
      "git.status",
      "git",
      ["status", "--porcelain=v1", "-z", "--untracked-files=all"],
      [],
      observer,
      options,
      "git status",
    ).then(({ stdout, receipt }) => ({ status: stdout, receipt }))
  }

  async gitHashObjects(
    paths: string[],
    observer?: ExecutionObserver,
    options: { signal?: AbortSignal; maxOutputBytes?: number; timeoutMs?: number } = {},
  ): Promise<{ objects: { path: string; gitObjectId: string }[]; receipt: ExecutionReceipt }> {
    if (!Array.isArray(paths) || paths.length === 0 || paths.length > 128) throw new Error("git.hash-object paths must contain 1..128 entries")

    const canonicalPaths: string[] = []
    for (const path of paths) {
      await this.fs.validatePath(path)
      canonicalPaths.push(canonicalWorkspaceRelativePath(this.fs.root, path))
    }

    const pathsByParent = new Map<string, string[]>()
    for (const path of canonicalPaths) {
      const parent = canonicalParent(path)
      const siblings = pathsByParent.get(parent)
      if (siblings) siblings.push(path)
      else pathsByParent.set(parent, [path])
    }

    for (const [parent, parentPaths] of pathsByParent) {
      const entries = await this.fs.list(parent, { recursive: false, maxEntries: 20_000, maxDepth: 1 })
      const regularFiles = new Set(
        entries
          .filter((entry) => entry.type === "file")
          .map((entry) => portablePath(entry.path)),
      )
      for (const path of parentPaths) {
        if (!regularFiles.has(path)) throw new Error(`git.hash-object path is not a regular workspace file: ${path}`)
      }
    }

    const result = await this.runReadOnlyCommand(
      "git.hash-object",
      "git",
      ["hash-object", "--no-filters", "--", ...canonicalPaths],
      canonicalPaths,
      observer,
      { ...options, maxOutputBytes: options.maxOutputBytes ?? 64 * 1024, timeoutMs: options.timeoutMs ?? 10_000 },
      "git hash-object",
      (stdout) => {
        parseGitHashObjectOutput(stdout, canonicalPaths.length)
      },
    )
    const objectIds = parseGitHashObjectOutput(result.stdout, canonicalPaths.length)
    const objects = canonicalPaths.map((path, index) => ({
      path,
      gitObjectId: objectIds[index],
    }))
    return { objects, receipt: result.receipt }
  }

  async runCommand(
    capability: string,
    executable: string,
    args: string[],
    observer?: ExecutionObserver,
    options: {
      signal?: AbortSignal
      maxOutputBytes?: number
      timeoutMs?: number
      env?: NodeJS.ProcessEnv
      paths?: string[]
      allowedExitCodes?: number[]
    } = {},
  ): Promise<{ stdout: string; stderr: string; receipt: ExecutionReceipt }> {
    if (capability.startsWith("git.") || capability.startsWith("repo.")) {
      throw new Error(`Generic runCommand cannot use reserved capability: ${capability}`)
    }
    const paths = uniquePaths(options.paths ?? [])
    return this.runReadOnlyCommand(capability, executable, args, paths, observer, options, capability)
  }

  async runConfinedReadOnlyCommand(
    capability: string,
    executable: string,
    args: string[],
    observer?: ExecutionObserver,
    options: {
      signal?: AbortSignal
      maxOutputBytes?: number
      timeoutMs?: number
      env?: NodeJS.ProcessEnv
      paths?: string[]
      allowedExitCodes?: number[]
    } = {},
  ): Promise<{ stdout: string; stderr: string; receipt: ExecutionReceipt }> {
    if (capability.startsWith("git.") || capability.startsWith("repo.")) {
      throw new Error(`Confined runCommand cannot use reserved capability: ${capability}`)
    }
    if (!executable.startsWith("/")) throw new Error("Confined execution requires an absolute Linux target executable path")

    const startedAt = new Date().toISOString()
    const executionArgs = [...args]
    const maxOutputBytes = options.maxOutputBytes ?? 256 * 1024
    const timeoutMs = options.timeoutMs ?? 5_000
    const allowedExitCodes = normalizedAllowedExitCodes(options.allowedExitCodes)
    const environment = canonicalEnvironment(options.env ?? process.env)
    const paths = uniquePaths((options.paths ?? []).map((path) => canonicalWorkspaceRelativePath(this.fs.root, path)))
    if (!Number.isInteger(maxOutputBytes) || maxOutputBytes <= 0) throw new Error("maxOutputBytes must be a positive integer")
    if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) throw new Error("timeoutMs must be a positive integer")

    const intent = immutableExecutionIntent({
      capability,
      paths,
      inputDigest: sha256(JSON.stringify({
        executable,
        args: executionArgs,
        allowedExitCodes,
        maxOutputBytes,
        timeoutMs,
        env: environment,
        confinement: {
          version: KDO_H4_R2C_RUNTIME_VERSION,
          mode: "read-only",
          claimSet: KDO_H4_R2B_LINUX_LANDLOCK_CLAIM_SET,
          requiredEnforcement: "full",
          launcherFd: KDO_H4_R2C_LAUNCHER_FD,
          readyFd: KDO_H4_R2C_READY_FD,
          permitFd: KDO_H4_R2C_PERMIT_FD,
          bootstrapEnvironmentPolicy: KDO_H4_R2C_BOOTSTRAP_ENVIRONMENT_POLICY,
          launcherWriteProtection: KDO_H4_R2C_LAUNCHER_WRITE_PROTECTION,
        },
      })),
    })
    await observer?.onIntent?.(intent)
    const policy = immutablePolicyResult(await this.policy.evaluate(intent))
    await observer?.onPolicy?.(intent, policy)

    if (policy.decision === "deny") {
      return this.block(intent, policy, startedAt, observer, policy.reason, `Execution denied: ${policy.reason}`)
    }

    // R2C pins the launcher, not the target executable bytes. External-process
    // one-shot approval therefore remains fail-closed in this slice.
    if (policy.decision === "ask") {
      return this.block(
        intent,
        policy,
        startedAt,
        observer,
        "external executable identity requires H4-R2 confinement",
        "Approval unavailable: external executable identity requires H4-R2 confinement",
      )
    }

    if (process.platform !== "linux") {
      return this.block(
        intent,
        policy,
        startedAt,
        observer,
        "Linux Landlock confinement is unavailable on this platform",
        "Confined execution unavailable: Linux Landlock requires Linux",
      )
    }

    const unsafeBootstrapKey = unsafeLinuxLoaderEnvironmentKey(environment)
    if (unsafeBootstrapKey !== undefined) {
      return this.block(
        intent,
        policy,
        startedAt,
        observer,
        `unsafe pre-Landlock loader environment: ${unsafeBootstrapKey}`,
        `Confined execution unavailable: ${unsafeBootstrapKey} is forbidden before Landlock activation`,
      )
    }

    const confinementRuntime = this.confinement
    if (!confinementRuntime) {
      return this.block(
        intent,
        policy,
        startedAt,
        observer,
        "trusted Linux Landlock runtime is not configured",
        "Confined execution unavailable: trusted Linux Landlock runtime is not configured",
      )
    }
    if (options.signal?.aborted) {
      return this.block(
        intent,
        policy,
        startedAt,
        observer,
        "operation aborted before confined execution",
        "Execution blocked: operation aborted before confined execution",
      )
    }

    let child: ChildProcess | undefined
    let permitStream: Writable | undefined
    let exitPromise: Promise<{ exitCode: number | null; signal: NodeJS.Signals | null }> | undefined
    let confinementBinding: ConfinementReceiptBinding | undefined
    let goReleased = false

    try {
      for (const path of paths) await this.fs.validatePath(path)

      const workspaceRoot = resolve(this.fs.root).split(sep).join("/")
      const executionAttempt = createConfinementExecutionAttempt({
        executionIntentIdentity: intent.inputDigest,
        nonce: randomUUID(),
      })
      const request = createConfinementRequest({
        mode: "read-only",
        workspaceIdentity: createLocalWorkspaceRootIdentity(workspaceRoot),
        executionIntentIdentity: intent.inputDigest,
        scope: { readPaths: paths, writePaths: [] },
      })
      const launchPlan = createLinuxLandlockLaunchPlan({
        launcherPath: confinementRuntime.launcherPath,
        mode: "read-only",
        readOnlyRoots: ["/"],
        readWriteRoots: ["/dev/null"],
        targetArgv: [executable, ...executionArgs],
      })
      const backend = createLinuxLandlockBackendDescriptor()

      const artifact = await observeLauncherArtifact(confinementRuntime)
      let launcherHandleOpen = true
      try {
        child = spawn(
          `/proc/self/fd/${KDO_H4_R2C_LAUNCHER_FD}`,
          [KDO_H4_R2C_CONTROL_FLAG, ...launchPlan.launcherArgv],
          {
            cwd: this.fs.root,
            env: environment,
            windowsHide: true,
            shell: false,
            timeout: timeoutMs,
            signal: options.signal,
            stdio: ["ignore", "pipe", "pipe", artifact.handle.fd, "pipe", "pipe"],
          },
        )
        await artifact.handle.close()
        launcherHandleOpen = false
      } finally {
        if (launcherHandleOpen) await artifact.handle.close().catch(() => {})
      }

      const stdoutStream = child.stdout
      const stderrStream = child.stderr
      const readyStream = child.stdio[KDO_H4_R2C_READY_FD] as Readable | null
      permitStream = child.stdio[KDO_H4_R2C_PERMIT_FD] as Writable | null ?? undefined
      if (!stdoutStream || !stderrStream || !readyStream || !permitStream) {
        throw new Error("controlled Landlock launcher did not expose the required K2 streams")
      }

      const killOnOverflow = () => child?.kill()
      const stdoutPromise = readBoundedStream(stdoutStream, maxOutputBytes, "confined stdout", killOnOverflow)
      const stderrPromise = readBoundedStream(stderrStream, maxOutputBytes, "confined stderr", killOnOverflow)
      const readyPromise = readBoundedStream(readyStream, KDO_H4_R2C_READY_MAX_BYTES, "Landlock readiness record", killOnOverflow)
      void stdoutPromise.catch(() => {})
      void stderrPromise.catch(() => {})
      void readyPromise.catch(() => {})

      exitPromise = waitForChild(child)
      void exitPromise.catch(() => {})
      const exitBeforeReady = exitPromise.then(({ exitCode, signal }) => {
        throw new Error(`controlled Landlock launcher exited before READY: code=${String(exitCode)} signal=${String(signal)}`)
      })
      void exitBeforeReady.catch(() => {})

      const readyBytes = await Promise.race([readyPromise, exitBeforeReady])
      const ready = parseLinuxLandlockReadyRecord(readyBytes)
      const enforcementEvidence = createConfinementEnforcementEvidence({
        request,
        executionAttemptIdentity: executionAttempt.executionAttemptIdentity,
        backend,
        enforcement: ready.enforcement,
        reason: linuxLandlockReadyReason(ready),
      })
      const evidenceRecord = createDurableConfinementEvidenceRecord({
        executionAttempt,
        request,
        enforcementEvidence,
        launcherArtifact: artifact.observation,
      })
      const rawCommit = await awaitEvidenceCommit(
        () => confinementRuntime.evidence.commit(evidenceRecord),
        exitPromise,
      )
      const durableCommit = validateDurableConfinementEvidenceCommit(rawCommit, evidenceRecord)
      confinementBinding = createConfinementReceiptBinding({ record: evidenceRecord, commit: durableCommit })

      if (ready.enforcement !== confinementRuntime.requiredEnforcement) {
        endWritable(permitStream)
        const exit = await exitPromise
        await Promise.all([stdoutPromise, stderrPromise])
        throw new Error(`Landlock enforcement is ${ready.enforcement}; R2C requires full (launcher code=${String(exit.exitCode)})`)
      }

      if (options.signal?.aborted || child.killed || child.exitCode !== null || child.signalCode !== null) {
        endWritable(permitStream)
        throw new Error("confined execution terminated before GO could be released")
      }

      await releaseGo(permitStream)
      goReleased = true

      const exit = await exitPromise
      const [stdoutBytes, stderrBytes] = await Promise.all([stdoutPromise, stderrPromise])
      const stdout = stdoutBytes.toString("utf8")
      const stderr = stderrBytes.toString("utf8")
      if (exit.exitCode === null) {
        throw new Error(`confined target terminated by signal: ${String(exit.signal)}`)
      }
      if (!allowedExitCodes.includes(exit.exitCode)) {
        throw new Error(`confined target exited with code ${exit.exitCode}`)
      }

      const combined = `${stdout}\0${stderr}`
      const receipt = createReceipt({
        capability: intent.capability,
        inputDigest: intent.inputDigest,
        paths: intent.paths,
        policy,
        confinement: confinementBinding,
        startedAt,
        completedAt: new Date().toISOString(),
        result: {
          status: "success",
          outputDigest: sha256(combined),
          outputBytes: Buffer.byteLength(combined, "utf8"),
          exitCode: exit.exitCode,
        },
      })
      await persistReceipt(observer, receipt)
      return { stdout, stderr, receipt }
    } catch (error) {
      if (error instanceof ExecutionUnprovenError) throw error
      if (!goReleased) endWritable(permitStream)
      if (child && child.exitCode === null && child.signalCode === null) child.kill()
      if (exitPromise) await exitPromise.catch(() => undefined)
      const message = error instanceof Error ? error.message : String(error)
      const receipt = createReceipt({
        capability: intent.capability,
        inputDigest: intent.inputDigest,
        paths: intent.paths,
        policy,
        ...(confinementBinding === undefined ? {} : { confinement: confinementBinding }),
        startedAt,
        completedAt: new Date().toISOString(),
        result: { status: "failure", error: message },
      })
      await persistReceipt(observer, receipt)
      throw new ExecutionFailedError(`${capability} failed: ${message}`, receipt, { cause: error })
    }
  }

  private async runReadOnlyCommand(
    capability: string,
    executable: string,
    args: string[],
    paths: string[],
    observer: ExecutionObserver | undefined,
    options: {
      signal?: AbortSignal
      maxOutputBytes?: number
      timeoutMs?: number
      env?: NodeJS.ProcessEnv
      allowedExitCodes?: number[]
    },
    label: string,
    validateOutput?: (stdout: string, stderr: string) => void,
  ): Promise<{ stdout: string; stderr: string; receipt: ExecutionReceipt }> {
    const startedAt = new Date().toISOString()
    const executionArgs = [...args]
    const maxOutputBytes = options.maxOutputBytes ?? 256 * 1024
    const timeoutMs = options.timeoutMs ?? 5_000
    const allowedExitCodes = normalizedAllowedExitCodes(options.allowedExitCodes)
    const environment = canonicalEnvironment(options.env ?? process.env)
    if (!Number.isInteger(maxOutputBytes) || maxOutputBytes <= 0) throw new Error("maxOutputBytes must be a positive integer")
    if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) throw new Error("timeoutMs must be a positive integer")

    const intent = immutableExecutionIntent({
      capability,
      paths,
      inputDigest: sha256(JSON.stringify({
        executable,
        args: executionArgs,
        allowedExitCodes,
        maxOutputBytes,
        timeoutMs,
        env: environment,
      })),
    })
    await observer?.onIntent?.(intent)
    const policy = immutablePolicyResult(await this.policy.evaluate(intent))
    await observer?.onPolicy?.(intent, policy)

    // H4-R1 cannot prove executable-byte identity through path-based execFile.
    // External-process one-shot approval remains fail-closed until H4-R2 confinement.
    if (policy.decision === "ask") {
      return this.block(
        intent,
        policy,
        startedAt,
        observer,
        "external executable identity requires H4-R2 confinement",
        "Approval unavailable: external executable identity requires H4-R2 confinement",
      )
    }

    const approval = await this.authorize(intent, policy, startedAt, observer, options.signal)

    try {
      for (const path of paths) await this.fs.validatePath(path)
      const { stdout, stderr, exitCode } = await runProcess(executable, executionArgs, this.fs.root, {
        signal: options.signal,
        maxOutputBytes,
        timeoutMs,
        env: environment,
        allowedExitCodes,
      })
      validateOutput?.(stdout, stderr)
      const combined = `${stdout}\0${stderr}`
      const receipt = createReceipt({
        capability: intent.capability,
        inputDigest: intent.inputDigest,
        paths: intent.paths,
        policy,
        ...(approval === undefined ? {} : { approval }),
        startedAt,
        completedAt: new Date().toISOString(),
        result: {
          status: "success",
          outputDigest: sha256(combined),
          outputBytes: Buffer.byteLength(combined, "utf8"),
          exitCode,
        },
      })
      await persistReceipt(observer, receipt)
      return { stdout, stderr, receipt }
    } catch (error) {
      if (error instanceof ExecutionUnprovenError) throw error
      const message = error instanceof Error ? error.message : String(error)
      const receipt = createReceipt({
        capability: intent.capability,
        inputDigest: intent.inputDigest,
        paths: intent.paths,
        policy,
        ...(approval === undefined ? {} : { approval }),
        startedAt,
        completedAt: new Date().toISOString(),
        result: { status: "failure", error: message },
      })
      await persistReceipt(observer, receipt)
      throw new ExecutionFailedError(`${label} failed: ${message}`, receipt, { cause: error })
    }
  }
}
