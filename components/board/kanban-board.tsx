"use client"

import { useState, useCallback } from "react"
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd"
import type { TicketListItem } from "@/types"
import { KanbanColumn } from "./kanban-column"
import { toast } from "sonner"

const COLUMNS = [
  { id: "NEW", label: "New" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "REVIEW", label: "Review" },
  { id: "DONE", label: "Done" },
] as const

type ColumnId = (typeof COLUMNS)[number]["id"]

export function KanbanBoard({
  initialTickets,
  departmentSlug,
}: {
  initialTickets: TicketListItem[]
  departmentSlug: string
}) {
  const [tickets, setTickets] = useState(initialTickets)

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

      // Optimistic update
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
        // Revert on failure
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

  // Listen for SSE updates
  const updateTicket = useCallback((updated: TicketListItem) => {
    setTickets((prev) => {
      const exists = prev.find((t) => t.id === updated.id)
      if (exists) {
        return prev.map((t) => (t.id === updated.id ? { ...updated } : t))
      }
      return [updated, ...prev]
    })
  }, [])

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-8rem)]">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            label={col.label}
            tickets={columnTickets(col.id)}
          />
        ))}
      </div>
    </DragDropContext>
  )
}
