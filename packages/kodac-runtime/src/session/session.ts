import { randomUUID } from "node:crypto"
import { createEvent, type EventSink, type KodacEvent, type KodacEventType } from "../protocol/event.ts"

export class RuntimeSession {
  readonly sessionId: string
  private readonly sink: EventSink
  private sequence = 0

  constructor(sink: EventSink, sessionId: string = randomUUID()) {
    this.sink = sink
    this.sessionId = sessionId
  }

  async emit<TPayload>(type: KodacEventType, payload: TPayload): Promise<KodacEvent<TPayload>> {
    const nextSequence = this.sequence + 1
    const event = createEvent({
      sessionId: this.sessionId,
      sequence: nextSequence,
      type,
      payload,
    })
    await this.sink.append(event)
    this.sequence = nextSequence
    return event
  }

  async start(input: { workspace: string; command: string; runtimeSlice?: string }): Promise<void> {
    await this.emit("session.started", {
      workspace: input.workspace,
      command: input.command,
      runtimeSlice: input.runtimeSlice ?? "k2-s2",
    })
  }

  async complete(input: {
    receiptId?: string
    tool?: string
    mode?: "tool" | "model_turn"
    provider?: string
    model?: string
  } = {}): Promise<void> {
    await this.emit("session.completed", {
      status: input.receiptId ? "proven_ready" : "complete",
      ...input,
    })
  }

  async fail(error: unknown): Promise<void> {
    const message = error instanceof Error ? error.message : String(error)
    await this.emit("session.failed", {
      status: "failed",
      error: message,
    })
  }
}
