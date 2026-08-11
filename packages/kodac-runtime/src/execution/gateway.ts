import { execFile } from "node:child_process"
import { createHash } from "node:crypto"
import { dirname } from "node:path"
import type { WorkspaceFileSystem } from "../edit/filesystem.ts"
import { applyHunks, parsePatch, type AffectedPaths } from "../edit/patch.ts"
import { createReceipt, type ExecutionReceipt } from "../evidence/receipt.ts"
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
  return path.replace(/\\/g, "/")
}

function blockedReceipt(intent: ExecutionIntent, policy: PolicyResult, startedAt: string): ExecutionReceipt {
  return createReceipt({
    capability: intent.capability,
    inputDigest: intent.inputDigest,
    paths: intent.paths,
    policy,
    startedAt,
    completedAt: new Date().toISOString(),
    result: { status: "blocked", reason: policy.reason },
  })
}

async function persistReceipt(observer: ExecutionObserver | undefined, receipt: ExecutionReceipt): Promise<void> {
  try {
    await observer?.onReceipt?.(receipt)
  } catch (error) {
    throw new ExecutionUnprovenError("Execution evidence could not be persisted.", receipt, { cause: error })
  }
}

interface ProcessOptions {
  signal?: AbortSignal
  maxOutputBytes: number
  timeoutMs: number
  env?: NodeJS.ProcessEnv
}

type ProcessRunner = (
  executable: string,
  args: string[],
  cwd: string,
  options: ProcessOptions,
) => Promise<{ stdout: string; stderr: string }>

function runProcess(
  executable: string,
  args: string[],
  cwd: string,
  options: ProcessOptions,
): Promise<{ stdout: string; stderr: string }> {
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
          rejectPromise(error)
          return
        }
        resolvePromise({ stdout, stderr })
      },
    )
  })
}

function parseGitHeadOutput(stdout: string): string {
  const head = stdout.trim()
  if (!/^[0-9a-f]{40,64}$/i.test(head)) throw new Error("git rev-parse HEAD did not return a full object id")
  return head.toLowerCase()
}

function parseGitHashObjectOutput(stdout: string, expectedCount: number): string[] {
  const objectIds = stdout.split(/\r?\n/).filter(Boolean)
  if (objectIds.length !== expectedCount) throw new Error("git hash-object result count does not match requested path count")
  return objectIds.map((gitObjectId) => {
    if (!/^[0-9a-f]+$/i.test(gitObjectId)) throw new Error("git hash-object returned an invalid object id")
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
  private readonly processRunner: ProcessRunner = runProcess

  constructor(fs: WorkspaceFileSystem, policy: PolicyEngine) {
    this.fs = fs
    this.policy = policy
  }

  async applyPatch(
    patchText: string,
    observer?: ExecutionObserver,
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

    if (policy.decision !== "allow") {
      const receipt = blockedReceipt(intent, policy, startedAt)
      await persistReceipt(observer, receipt)
      throw new ExecutionBlockedError(
        policy.decision === "ask" ? `Approval required: ${policy.reason}` : `Execution denied: ${policy.reason}`,
        receipt,
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
    for (const path of paths) {
      await this.fs.validatePath(path)
      const portable = portablePath(path)
      const parent = portablePath(dirname(path))
      const entries = await this.fs.list(parent === "." ? "." : parent, { recursive: false, maxEntries: 20_000, maxDepth: 1 })
      const entry = entries.find((candidate) => candidate.path === portable)
      if (!entry || entry.type !== "file") throw new Error(`git.hash-object path is not a regular workspace file: ${path}`)
    }
    const result = await this.runReadOnlyCommand(
      "git.hash-object",
      "git",
      ["hash-object", "--no-filters", "--", ...paths],
      paths,
      observer,
      { ...options, maxOutputBytes: options.maxOutputBytes ?? 64 * 1024, timeoutMs: options.timeoutMs ?? 10_000 },
      "git hash-object",
      (stdout) => {
        parseGitHashObjectOutput(stdout, paths.length)
      },
    )
    const objectIds = parseGitHashObjectOutput(result.stdout, paths.length)
    const objects = paths.map((path, index) => ({
      path: portablePath(path),
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
    } = {},
  ): Promise<{ stdout: string; stderr: string; receipt: ExecutionReceipt }> {
    if (capability.startsWith("git.") || capability.startsWith("repo.")) {
      throw new Error(`Generic runCommand cannot use reserved capability: ${capability}`)
    }
    return this.runReadOnlyCommand(capability, executable, args, [], observer, options, capability)
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
    },
    label: string,
    validateOutput?: (stdout: string, stderr: string) => void,
  ): Promise<{ stdout: string; stderr: string; receipt: ExecutionReceipt }> {
    const startedAt = new Date().toISOString()
    const maxOutputBytes = options.maxOutputBytes ?? 256 * 1024
    const timeoutMs = options.timeoutMs ?? 5_000
    if (!Number.isInteger(maxOutputBytes) || maxOutputBytes <= 0) throw new Error("maxOutputBytes must be a positive integer")
    if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) throw new Error("timeoutMs must be a positive integer")

    const intent: ExecutionIntent = {
      capability,
      paths,
      inputDigest: sha256(JSON.stringify({ executable, args })),
    }
    await observer?.onIntent?.(intent)
    const policy = await this.policy.evaluate(intent)
    await observer?.onPolicy?.(intent, policy)

    if (policy.decision !== "allow") {
      const receipt = blockedReceipt(intent, policy, startedAt)
      await persistReceipt(observer, receipt)
      throw new ExecutionBlockedError(
        policy.decision === "ask" ? `Approval required: ${policy.reason}` : `Execution denied: ${policy.reason}`,
        receipt,
      )
    }

    try {
      for (const path of paths) await this.fs.validatePath(path)
      const { stdout, stderr } = await this.processRunner(executable, args, this.fs.root, {
        signal: options.signal,
        maxOutputBytes,
        timeoutMs,
        env: options.env,
      })
      validateOutput?.(stdout, stderr)
      const combined = `${stdout}\0${stderr}`
      const receipt = createReceipt({
        capability: intent.capability,
        inputDigest: intent.inputDigest,
        paths: intent.paths,
        policy,
        startedAt,
        completedAt: new Date().toISOString(),
        result: {
          status: "success",
          outputDigest: sha256(combined),
          outputBytes: Buffer.byteLength(combined, "utf8"),
          exitCode: 0,
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
        startedAt,
        completedAt: new Date().toISOString(),
        result: { status: "failure", error: message },
      })
      await persistReceipt(observer, receipt)
      throw new ExecutionFailedError(`${label} failed: ${message}`, receipt, { cause: error })
    }
  }
}
