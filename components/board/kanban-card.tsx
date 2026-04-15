"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import type { TicketListItem } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Paperclip } from "lucide-react"

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
}

export function KanbanCard({
  ticket,
  isDragging,
}: {
  ticket: TicketListItem
  isDragging: boolean
}) {
  return (
    <Link href={`/tickets/${ticket.id}`}>
      <Card
        className={`cursor-pointer hover:shadow-md transition-shadow ${
          isDragging ? "shadow-lg rotate-2" : ""
        }`}
      >
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">
                #{ticket.number}
              </span>
              {ticket.department && (
                <span className="text-[10px] text-muted-foreground font-medium">
                  {ticket.department.name}
                </span>
              )}
            </div>
            <Badge className={`text-[10px] px-1.5 py-0 ${priorityColors[ticket.priority]}`}>
              {ticket.priority}
            </Badge>
          </div>

          <p className="font-medium text-sm leading-tight line-clamp-2">
            {ticket.title}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {ticket._count.comments > 0 && (
                <span className="flex items-center gap-0.5">
                  <MessageSquare className="h-3 w-3" />
                  {ticket._count.comments}
                </span>
              )}
              {ticket._count.attachments > 0 && (
                <span className="flex items-center gap-0.5">
                  <Paperclip className="h-3 w-3" />
                  {ticket._count.attachments}
                </span>
              )}
            </div>

            <div className="flex -space-x-1">
              {ticket.assignments.slice(0, 3).map((a) => (
                <Avatar key={a.id} className="h-5 w-5 border-2 border-background">
                  <AvatarImage src={a.user.image || undefined} />
                  <AvatarFallback className="text-[8px]">
                    {a.user.name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(ticket.createdAt), {
              addSuffix: true,
            })}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
