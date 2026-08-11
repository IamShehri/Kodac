import type { RuntimeSession } from "../session/session.ts"
import type { ToolRegistry } from "../tools/registry.ts"

function errorReceiptId(error: unknown): string | undefined {
  if (!error || typeof error !== "object" || !("receipt" in error)) return undefined
  const receipt = (error as { receipt?: { receiptId?: unknown } }).receipt
  return typeof receipt?.receiptId === "string" ? receipt.receiptId : undefined
}

function throwIfAborted(signal?: AbortSignal): void {
  if (!signal?.aborted) return
  throw signal.reason instanceof Error ? signal.reason : new Error("Operation aborted")
}

export class RuntimeOrchestrator {
  private readonly registry: ToolRegistry
  private readonly session: RuntimeSession

  constructor(registry: ToolRegistry, session: RuntimeSession) {
    this.registry = registry
    this.session = session
  }

  async invoke<TInput, TOutput>(
    toolName: string,
    input: TInput,
    options: { signal?: AbortSignal } = {},
  ): Promise<TOutput> {
    throwIfAborted(options.signal)
    const tool = this.registry.get<TInput, TOutput>(toolName)
    await this.session.emit("tool.started", {
      tool: tool.name,
      capability: tool.capability,
    })

    try {
      throwIfAborted(options.signal)
      const output = await tool.execute(input, { session: this.session, signal: options.signal })
      await this.session.emit("tool.completed", {
        tool: tool.name,
        capability: tool.capability,
      })
      return output
    } catch (error) {
      await this.session.emit("tool.failed", {
        tool: tool.name,
        capability: tool.capability,
        error: error instanceof Error ? error.message : String(error),
        receiptId: errorReceiptId(error),
      })
      throw error
    }
  }
}
