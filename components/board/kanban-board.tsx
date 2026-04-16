"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { DragDropContext, type DropResult } from "@hello-pangea/dnd"
import type { TicketListItem } from "@/types"
import { KanbanColumn } from "./kanban-column"
import { toast } from "sonner"
import { useTicketEvents } from "@/lib/hooks/use-ticket-events"

const COLUMNS = [
  { id: "NEW", label: "New" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "REVIEW", label: "Review" },
  { id: "DONE", label: "Done" },
] as const

type ColumnId = (typeof COLUMNS)[number]["id"]

const FRESH_HIGHLIGHT_MS = 800

function normalizeToListItem(raw: unknown): TicketListItem | null {
  if (!raw || typeof raw !== "object") return null
  const t = raw as Record<string, unknown> & Partial<TicketListItem>
  if (!t.id || !t.department || !t.submitter) return null
  const existingCount = t._count as { comments?: number; attachments?: number } | undefined
  const comments = Array.isArray(t.comments) ? t.comments.length : existingCount?.comments ?? 0
  const attachments = Array.isArray(t.attachments)
    ? t.attachments.length
    : existingCount?.attachments ?? 0
  return {
    ...(t as TicketListItem),
    _count: { comments, attachments },
  }
}

export function KanbanBoard({
  initialTickets,
  departmentSlug,
  canDrag = true,
}: {
  initialTickets: TicketListItem[]
  departmentSlug?: string
  canDrag?: boolean
}) {
  const [tickets, setTickets] = useState(initialTickets)
  const [freshlyUpdated, setFreshlyUpdated] = useState<Set<string>>(new Set())
  const timers = useRef<Map<string, NodeJS.Timeout>>(new Map())

  useEffect(() => {
    const map = timers.current
    return () => {
      map.forEach((t) => clearTimeout(t))
      map.clear()
    }
  }, [])

  const markFresh = useCallback((id: string) => {
    setFreshlyUpdated((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
    const existing = timers.current.get(id)
    if (existing) clearTimeout(existing)
    const handle = setTimeout(() => {
      setFreshlyUpdated((prev) => {
        if (!prev.has(id)) return prev
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      timers.current.delete(id)
    }, FRESH_HIGHLIGHT_MS)
    timers.current.set(id, handle)
  }, [])

  useTicketEvents((event) => {
    if (event.type !== "TICKET_CREATED" && event.type !== "TICKET_UPDATED") {
      markFresh(event.ticketId)
      return
    }
    const incoming = normalizeToListItem(
      (event.data as { ticket?: unknown })?.ticket
    )
    if (!incoming) return
    setTickets((prev) => {
      const idx = prev.findIndex((t) => t.id === incoming.id)
      if (idx === -1) return [incoming, ...prev]
      const next = prev.slice()
      next[idx] = incoming
      return next
    })
    markFresh(incoming.id)
  }, departmentSlug)

  const columnTickets = (status: ColumnId) =>
    tickets
      .filter((t) => t.status === status)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

  const onDragEnd = useCallback(
    async (result: DropResult) => {
      const { destination, source, draggableId } = result
      if (!destination) return
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      )
        return

      const newStatus = destination.droppableId as ColumnId

      setTickets((prev) =>
        prev.map((t) =>
          t.id === draggableId ? { ...t, status: newStatus } : t
        )
      )

      try {
        const res = await fetch(`/api/tickets/${draggableId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        })
        if (!res.ok) throw new Error("Failed to update status")
      } catch {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === draggableId
              ? { ...t, status: source.droppableId as ColumnId }
              : t
          )
        )
        toast.error("Failed to update ticket status")
      }
    },
    []
  )

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-8rem)]">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            label={col.label}
            tickets={columnTickets(col.id)}
            canDrag={canDrag}
            freshlyUpdated={freshlyUpdated}
          />
        ))}
      </div>
    </DragDropContext>
  )
}
