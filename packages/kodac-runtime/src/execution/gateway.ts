import { createHash } from "node:crypto"
import type { WorkspaceFileSystem } from "../edit/filesystem.ts"
import { applyHunks, parsePatch } from "../edit/patch.ts"
import { createReceipt, type ExecutionReceipt } from "../evidence/receipt.ts"
import type { ExecutionIntent, PolicyEngine, PolicyResult } from "../trust/policy.ts"

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

export class ExecutionGateway {
  private readonly fs: WorkspaceFileSystem
  private readonly policy: PolicyEngine

  constructor(fs: WorkspaceFileSystem, policy: PolicyEngine) {
    this.fs = fs
    this.policy = policy
  }

  async applyPatch(patchText: string): Promise<{ affected: Awaited<ReturnType<typeof applyHunks>>; receipt: ExecutionReceipt }> {
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
    const policy = await this.policy.evaluate(intent)

    if (policy.decision !== "allow") {
      const receipt = blockedReceipt(intent, policy, startedAt)
      throw new ExecutionBlockedError(
        policy.decision === "ask" ? `Approval required: ${policy.reason}` : `Execution denied: ${policy.reason}`,
        receipt,
      )
    }

    try {
      const affected = await applyHunks(this.fs, parsed.hunks)
      const receipt = createReceipt({
        capability: intent.capability,
        inputDigest: intent.inputDigest,
        paths: intent.paths,
        policy,
        startedAt,
        completedAt: new Date().toISOString(),
        result: { status: "success", affected },
      })
      return { affected, receipt }
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
      throw new ExecutionFailedError(`Patch execution failed: ${message}`, receipt, { cause: error })
    }
  }
}
