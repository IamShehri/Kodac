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
    model: {
      description: "Apply one bounded Kodac patch inside the workspace. This is a state-changing capability and remains policy-gated.",
      inputSchema: {
        type: "object",
        properties: {
          patchText: { type: "string", minLength: 1, description: "Kodac patch text using *** Begin Patch / *** End Patch format." },
        },
        required: ["patchText"],
        additionalProperties: false,
      },
    },
    async execute(input, context) {
      if (context.signal?.aborted) {
        throw context.signal.reason instanceof Error ? context.signal.reason : new Error("Operation aborted")
      }
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
