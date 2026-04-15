"use client"

import { Droppable, Draggable } from "@hello-pangea/dnd"
import type { TicketListItem } from "@/types"
import { KanbanCard } from "./kanban-card"

export function KanbanColumn({
  id,
  label,
  tickets,
}: {
  id: string
  label: string
  tickets: TicketListItem[]
}) {
  return (
    <div className="flex-shrink-0 w-72">
      <div className="flex items-center justify-between mb-3 px-2">
        <h3 className="font-semibold text-sm">{label}</h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {tickets.length}
        </span>
      </div>
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-2 min-h-[200px] p-2 rounded-lg transition-colors ${
              snapshot.isDraggingOver ? "bg-accent/50" : "bg-muted/30"
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
                    <KanbanCard ticket={ticket} isDragging={snapshot.isDragging} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
