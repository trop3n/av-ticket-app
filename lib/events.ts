import { EventEmitter } from "events"

const globalForEvents = globalThis as unknown as {
  ticketEvents: EventEmitter | undefined
}

export const ticketEvents =
  globalForEvents.ticketEvents ?? new EventEmitter()

ticketEvents.setMaxListeners(100)

if (process.env.NODE_ENV !== "production")
  globalForEvents.ticketEvents = ticketEvents

export type TicketEvent = {
  type: "TICKET_CREATED" | "TICKET_UPDATED" | "COMMENT_ADDED" | "ASSIGNMENT_CHANGED"
  ticketId: string
  departmentSlug: string
  data: Record<string, unknown>
}

export function emitTicketEvent(event: TicketEvent) {
  ticketEvents.emit("ticket", event)
}
