"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import type { TicketListItem } from "@/types"
import type { TicketPriority, TicketStatus } from "@prisma/client"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Paperclip, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

const priorityStripe: Record<TicketPriority, string> = {
  LOW: "bg-priority-low/40",
  MEDIUM: "bg-priority-medium",
  HIGH: "bg-priority-high",
  URGENT: "bg-priority-urgent",
}

const priorityBadge: Record<TicketPriority, string> = {
  LOW: "border border-muted-foreground/30 text-muted-foreground",
  MEDIUM: "bg-priority-medium/15 text-priority-medium",
  HIGH: "bg-priority-high/20 text-priority-high",
  URGENT: "bg-priority-urgent text-priority-urgent-foreground",
}

const statusDot: Record<TicketStatus, string> = {
  NEW: "bg-status-new",
  IN_PROGRESS: "bg-status-in-progress",
  REVIEW: "bg-status-review",
  DONE: "bg-status-done",
  CANCELLED: "bg-status-cancelled",
}

export function KanbanCard({
  ticket,
  isDragging,
  isFresh,
}: {
  ticket: TicketListItem
  isDragging: boolean
  isFresh?: boolean
}) {
  const isUrgent = ticket.priority === "URGENT"

  return (
    <Link href={`/tickets/${ticket.id}`} className="block">
      <Card
        className={cn(
          "group/card relative overflow-hidden cursor-pointer border-border/70",
          "transition-shadow duration-200",
          "shadow-sm hover:shadow-md hover:border-border",
          isDragging && "shadow-lg rotate-1 ring-2 ring-ring/40",
          isFresh && "ring-2 ring-accent-cta/60 animate-[pulse_1s_ease-in-out_1]",
          isUrgent && "border-priority-urgent/40"
        )}
      >
        <span
          className={cn("absolute left-0 top-0 bottom-0 w-[3px]", priorityStripe[ticket.priority])}
          aria-hidden
        />
        <CardContent className="pl-3.5 pr-2.5 py-2 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", statusDot[ticket.status])} aria-hidden />
              <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                #{ticket.number}
              </span>
              {ticket.department && (
                <span className="text-[10px] text-muted-foreground/80 truncate uppercase tracking-wider">
                  {ticket.department.name}
                </span>
              )}
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0",
                priorityBadge[ticket.priority]
              )}
            >
              {isUrgent && <AlertTriangle className="h-2.5 w-2.5" aria-hidden />}
              {ticket.priority}
            </span>
          </div>

          <p className="font-medium text-[13px] leading-snug line-clamp-2 text-foreground">
            {ticket.title}
          </p>

          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="tabular-nums">
                {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
              </span>
              {ticket._count.comments > 0 && (
                <span className="flex items-center gap-0.5">
                  <MessageSquare className="h-3 w-3" aria-hidden />
                  <span className="tabular-nums">{ticket._count.comments}</span>
                </span>
              )}
              {ticket._count.attachments > 0 && (
                <span className="flex items-center gap-0.5">
                  <Paperclip className="h-3 w-3" aria-hidden />
                  <span className="tabular-nums">{ticket._count.attachments}</span>
                </span>
              )}
            </div>

            <div className="flex -space-x-1.5">
              {ticket.assignments.slice(0, 3).map((a) => (
                <Avatar key={a.id} className="h-5 w-5 ring-2 ring-card">
                  <AvatarImage src={a.user.image || undefined} alt={a.user.name || ""} />
                  <AvatarFallback className="text-[9px]">
                    {a.user.name?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
