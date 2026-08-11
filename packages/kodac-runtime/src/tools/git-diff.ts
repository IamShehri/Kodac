import type { ReceiptLedger } from "../evidence/ledger.ts"
import type { ExecutionGateway } from "../execution/gateway.ts"
import type { RuntimeTool } from "./registry.ts"

export interface GitDiffInput {
  paths?: string[]
  maxOutputBytes?: number
  timeoutMs?: number
}

export type GitDiffOutput = Awaited<ReturnType<ExecutionGateway["gitDiff"]>>

function boundedInteger(name: string, value: number | undefined, fallback: number, maximum: number): number {
  if (value === undefined) return fallback
  if (!Number.isInteger(value) || value <= 0 || value > maximum) {
    throw new Error(`${name} must be a positive integer <= ${maximum}`)
  }
  return value
}

export function createGitDiffTool(gateway: ExecutionGateway, ledger: ReceiptLedger): RuntimeTool<GitDiffInput, GitDiffOutput> {
  return {
    name: "git.diff",
    capability: "git.diff",
    model: {
      description: "Read the current Git diff for the workspace or a bounded set of workspace-relative paths.",
      inputSchema: {
        type: "object",
        properties: {
          paths: { type: "array", items: { type: "string" }, maxItems: 64 },
          maxOutputBytes: { type: "integer", minimum: 1, maximum: 1048576 },
          timeoutMs: { type: "integer", minimum: 1, maximum: 10000 },
        },
        additionalProperties: false,
      },
    },
    async execute(input, context) {
      return gateway.gitDiff(
        input.paths ?? [],
        {
          async onIntent(intent) {
            await context.session.emit("intent.created", { intent })
          },
          async onPolicy(intent, policy) {
            await context.session.emit("policy.evaluated", { intent, policy })
          },
          async onReceipt(receipt) {
            await ledger.append(receipt)
            await context.session.emit("receipt.recorded", {
              receiptId: receipt.receiptId,
              result: receipt.result.status,
            })
          },
        },
        {
          signal: context.signal,
          maxOutputBytes: boundedInteger("maxOutputBytes", input.maxOutputBytes, 256 * 1024, 1024 * 1024),
          timeoutMs: boundedInteger("timeoutMs", input.timeoutMs, 5_000, 10_000),
        },
      )
    },
  }
}
