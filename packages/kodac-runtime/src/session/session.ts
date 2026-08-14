import { randomUUID } from "node:crypto"
import { createEvent, type EventSink, type KodacEvent, type KodacEventType } from "../protocol/event.ts"

export const KODAC_RUNTIME_SESSION_JOURNAL_MAX_EVENTS = 4096 as const

export class RuntimeSession {
  readonly sessionId: string
  private readonly sink: EventSink
  private sequence = 0
  private readonly journal: KodacEvent[] = []
  private journalEvictedThroughSequence = 0
  private emitTail: Promise<void> = Promise.resolve()

  constructor(sink: EventSink, sessionId: string = randomUUID()) {
    this.sink = sink
    this.sessionId = sessionId
  }

  async emit<TPayload>(type: KodacEventType, payload: TPayload): Promise<KodacEvent<TPayload>> {
    const previous = this.emitTail.catch(() => undefined)
    let release!: () => void
    const slot = new Promise<void>((resolve) => { release = resolve })
    this.emitTail = previous.then(() => slot)
    await previous
    try {
      const nextSequence = this.sequence + 1
      const event = createEvent({
        sessionId: this.sessionId,
        sequence: nextSequence,
        type,
        payload,
      })
      await this.sink.append(event)
      this.journal.push(event)
      if (this.journal.length > KODAC_RUNTIME_SESSION_JOURNAL_MAX_EVENTS) {
        const overflow = this.journal.length - KODAC_RUNTIME_SESSION_JOURNAL_MAX_EVENTS
        const removed = this.journal.splice(0, overflow)
        const lastRemoved = removed.at(-1)
        if (lastRemoved !== undefined) this.journalEvictedThroughSequence = lastRemoved.sequence
      }
      this.sequence = nextSequence
      return event
    } finally {
      release()
    }
  }

  eventsSnapshot(afterSequence?: number): readonly KodacEvent[] {
    if (afterSequence !== undefined) {
      if (!Number.isSafeInteger(afterSequence) || afterSequence < 0) {
        throw new TypeError("RuntimeSession event cursor must be a non-negative safe integer")
      }
      if (afterSequence > this.sequence) {
        throw new RangeError("RuntimeSession event cursor is ahead of the committed session sequence")
      }
      if (afterSequence < this.journalEvictedThroughSequence) {
        throw new RangeError(
          `RuntimeSession event cursor precedes retained journal history through sequence ${this.journalEvictedThroughSequence}`,
        )
      }
    }
    const events = afterSequence === undefined
      ? this.journal
      : this.journal.filter((event) => event.sequence > afterSequence)
    return Object.freeze(events.map((event) => Object.freeze({ ...event })))
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
    mode?: "tool" | "model_turn" | "agent_loop"
    provider?: string
    model?: string
    verified?: boolean
    doneGate?: "PROVEN_READY" | "NOT_READY"
    proof?: string
  } = {}): Promise<void> {
    await this.emit("session.completed", {
      status: input.doneGate === "PROVEN_READY" ? "proven_ready" : "complete",
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
