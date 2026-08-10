import { execFile } from "node:child_process"
import { createHash } from "node:crypto"
import type { WorkspaceFileSystem } from "../edit/filesystem.ts"
import { applyHunks, parsePatch } from "../edit/patch.ts"
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

function runGitDiffProcess(
  cwd: string,
  paths: string[],
  options: { signal?: AbortSignal; maxOutputBytes: number; timeoutMs: number },
): Promise<string> {
  const args = ["diff", "--no-ext-diff", "--no-color", "--", ...paths]
  return new Promise((resolvePromise, rejectPromise) => {
    execFile(
      "git",
      args,
      {
        cwd,
        encoding: "utf8",
        windowsHide: true,
        timeout: options.timeoutMs,
        maxBuffer: options.maxOutputBytes,
        signal: options.signal,
      },
      (error, stdout) => {
        if (error) {
          rejectPromise(error)
          return
        }
        resolvePromise(stdout)
      },
    )
  })
}

export class ExecutionGateway {
  private readonly fs: WorkspaceFileSystem
  private readonly policy: PolicyEngine

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
      result: { status: "success", affected },
    })
    await persistReceipt(observer, receipt)
    return { affected, receipt }
  }

  async gitDiff(
    requestedPaths: string[] = [],
    observer?: ExecutionObserver,
    options: { signal?: AbortSignal; maxOutputBytes?: number; timeoutMs?: number } = {},
  ): Promise<{ diff: string; receipt: ExecutionReceipt }> {
    const startedAt = new Date().toISOString()
    const paths = uniquePaths(requestedPaths)
    const maxOutputBytes = options.maxOutputBytes ?? 256 * 1024
    const timeoutMs = options.timeoutMs ?? 5_000
    if (!Number.isInteger(maxOutputBytes) || maxOutputBytes <= 0) throw new Error("maxOutputBytes must be a positive integer")
    if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) throw new Error("timeoutMs must be a positive integer")

    const intent: ExecutionIntent = {
      capability: "git.diff",
      paths,
      inputDigest: sha256(JSON.stringify({ command: "git", args: ["diff", "--no-ext-diff", "--no-color", "--", ...paths] })),
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
      const diff = await runGitDiffProcess(this.fs.root, paths, {
        signal: options.signal,
        maxOutputBytes,
        timeoutMs,
      })
      const receipt = createReceipt({
        capability: intent.capability,
        inputDigest: intent.inputDigest,
        paths: intent.paths,
        policy,
        startedAt,
        completedAt: new Date().toISOString(),
        result: {
          status: "success",
          outputDigest: sha256(diff),
          outputBytes: Buffer.byteLength(diff, "utf8"),
          exitCode: 0,
        },
      })
      await persistReceipt(observer, receipt)
      return { diff, receipt }
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
      throw new ExecutionFailedError(`git diff failed: ${message}`, receipt, { cause: error })
    }
  }
}
