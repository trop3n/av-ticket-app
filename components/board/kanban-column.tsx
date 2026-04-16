"use client"

import { Droppable, Draggable } from "@hello-pangea/dnd"
import type { TicketListItem } from "@/types"
import { KanbanCard } from "./kanban-card"

const statusStripe: Record<string, string> = {
  NEW: "bg-status-new",
  IN_PROGRESS: "bg-status-in-progress",
  REVIEW: "bg-status-review",
  DONE: "bg-status-done",
}

export function KanbanColumn({
  id,
  label,
  tickets,
  canDrag = true,
  freshlyUpdated,
}: {
  id: string
  label: string
  tickets: TicketListItem[]
  canDrag?: boolean
  freshlyUpdated?: Set<string>
}) {
  const stripe = statusStripe[id] ?? "bg-muted-foreground"

  return (
    <div className="flex-shrink-0 w-72 flex flex-col rounded-lg border bg-card/60 shadow-sm">
      <div className={`h-1 rounded-t-lg ${stripe}`} />
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${stripe}`} aria-hidden />
          <h3 className="font-semibold text-sm tracking-tight">{label}</h3>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          {tickets.length}
        </span>
      </div>
      {canDrag ? (
        <Droppable droppableId={id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`flex-1 space-y-2 min-h-[240px] p-2 transition-colors ${
                snapshot.isDraggingOver ? "bg-accent/40" : ""
              }`}
            >
              {tickets.map((ticket, index) => (
                <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <KanbanCard
                        ticket={ticket}
                        isDragging={snapshot.isDragging}
                        isFresh={freshlyUpdated?.has(ticket.id)}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              {tickets.length === 0 && (
                <div className="flex items-center justify-center h-full min-h-[200px] text-xs text-muted-foreground/60 italic">
                  No tickets
                </div>
              )}
            </div>
          )}
        </Droppable>
      ) : (
        <div className="flex-1 space-y-2 min-h-[240px] p-2">
          {tickets.map((ticket) => (
            <KanbanCard
              key={ticket.id}
              ticket={ticket}
              isDragging={false}
              isFresh={freshlyUpdated?.has(ticket.id)}
            />
          ))}
          {tickets.length === 0 && (
            <div className="flex items-center justify-center h-full min-h-[200px] text-xs text-muted-foreground/60 italic">
              No tickets
            </div>
          )}
        </div>
      )}
    </div>
  )
}
