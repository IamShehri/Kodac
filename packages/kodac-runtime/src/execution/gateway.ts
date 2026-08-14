import { execFile } from "node:child_process"
import { createHash } from "node:crypto"
import { isAbsolute, relative, resolve, sep } from "node:path"
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

function uniquePaths(paths: string[]): string[] {
  return [...new Set(paths)].sort()
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

export class ExecutionGateway {
  private readonly fs: WorkspaceFileSystem
  private readonly policy: PolicyEngine
  private readonly approval?: ApprovalRuntime

  constructor(fs: WorkspaceFileSystem, policy: PolicyEngine, approval?: ApprovalRuntime) {
    this.fs = fs
    this.policy = policy
    this.approval = approval
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
    const intent: ExecutionIntent = {
      capability: "repo.apply_patch",
      paths,
      inputDigest: sha256(patchText),
    }
    await observer?.onIntent?.(intent)

    const policy = await this.policy.evaluate(intent)
    await observer?.onPolicy?.(intent, policy)
    const approval = await this.authorize(intent, policy, startedAt, observer, options.signal)

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
    const maxOutputBytes = options.maxOutputBytes ?? 256 * 1024
    const timeoutMs = options.timeoutMs ?? 5_000
    const allowedExitCodes = normalizedAllowedExitCodes(options.allowedExitCodes)
    const environment = canonicalEnvironment(options.env ?? process.env)
    if (!Number.isInteger(maxOutputBytes) || maxOutputBytes <= 0) throw new Error("maxOutputBytes must be a positive integer")
    if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) throw new Error("timeoutMs must be a positive integer")

    const intent: ExecutionIntent = {
      capability,
      paths,
      inputDigest: sha256(JSON.stringify({
        executable,
        args,
        allowedExitCodes,
        maxOutputBytes,
        timeoutMs,
        env: environment,
      })),
    }
    await observer?.onIntent?.(intent)
    const policy = await this.policy.evaluate(intent)
    await observer?.onPolicy?.(intent, policy)
    const approval = await this.authorize(intent, policy, startedAt, observer, options.signal)

    try {
      for (const path of paths) await this.fs.validatePath(path)
      const { stdout, stderr, exitCode } = await runProcess(executable, args, this.fs.root, {
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
