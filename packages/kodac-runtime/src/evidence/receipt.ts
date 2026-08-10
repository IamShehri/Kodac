import { randomUUID } from "node:crypto"
import type { PolicyResult } from "../trust/policy.ts"
import type { AffectedPaths } from "../edit/patch.ts"

export type ReceiptResult =
  | { status: "success"; affected: AffectedPaths }
  | { status: "blocked"; reason: string }
  | { status: "failure"; error: string }

export interface ExecutionReceipt {
  receiptId: string
  capability: string
  inputDigest: string
  paths: string[]
  policy: PolicyResult
  startedAt: string
  completedAt: string
  result: ReceiptResult
}

export function createReceipt(input: Omit<ExecutionReceipt, "receiptId">): ExecutionReceipt {
  return { receiptId: randomUUID(), ...input }
}
