import type { ReceiptLedger } from "../evidence/ledger.ts"
import type { ExecutionGateway } from "../execution/gateway.ts"
import type { RuntimeTool } from "./registry.ts"

export interface ApplyPatchToolInput {
  patchText: string
}

export type ApplyPatchToolOutput = Awaited<ReturnType<ExecutionGateway["applyPatch"]>>

export function createApplyPatchTool(gateway: ExecutionGateway, ledger: ReceiptLedger): RuntimeTool<ApplyPatchToolInput, ApplyPatchToolOutput> {
  return {
    name: "repo.apply_patch",
    capability: "repo.apply_patch",
    async execute(input, context) {
      return gateway.applyPatch(input.patchText, {
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
      })
    },
  }
}
