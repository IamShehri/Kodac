import { randomUUID } from "node:crypto"
import { appendFile, mkdir } from "node:fs/promises"
import { dirname } from "node:path"

export const KODAC_EVENT_PROTOCOL = "kodac.event" as const
export const KODAC_EVENT_VERSION = 1 as const

export type KodacEventType =
  | "session.started"
  | "intent.created"
  | "policy.evaluated"
  | "tool.started"
  | "tool.completed"
  | "tool.failed"
  | "receipt.recorded"
  | "model.requested"
  | "model.responded"
  | "model.failed"
  | "model.tool_call.requested"
  | "assistant.message"
  | "agent.loop.started"
  | "agent.turn.started"
  | "agent.turn.completed"
  | "agent.turn.failed"
  | "agent.loop.completed"
  | "agent.loop.stopped"
  | "session.completed"
  | "session.failed"

export interface KodacEvent<TPayload = unknown> {
  protocol: typeof KODAC_EVENT_PROTOCOL
  version: typeof KODAC_EVENT_VERSION
  eventId: string
  sessionId: string
  sequence: number
  emittedAt: string
  type: KodacEventType
  payload: TPayload
}

export interface EventSink {
  append(event: KodacEvent): Promise<void> | void
}

export class InMemoryEventSink implements EventSink {
  readonly events: KodacEvent[] = []

  append(event: KodacEvent): void {
    this.events.push(event)
  }
}

export class JsonlEventSink implements EventSink {
  readonly filePath: string

  constructor(filePath: string) {
    this.filePath = filePath
  }

  async append(event: KodacEvent): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true })
    await appendFile(this.filePath, `${JSON.stringify(event)}\n`, "utf8")
  }
}

export function createEvent<TPayload>(input: {
  sessionId: string
  sequence: number
  type: KodacEventType
  payload: TPayload
  emittedAt?: string
}): KodacEvent<TPayload> {
  return {
    protocol: KODAC_EVENT_PROTOCOL,
    version: KODAC_EVENT_VERSION,
    eventId: randomUUID(),
    sessionId: input.sessionId,
    sequence: input.sequence,
    emittedAt: input.emittedAt ?? new Date().toISOString(),
    type: input.type,
    payload: input.payload,
  }
}
