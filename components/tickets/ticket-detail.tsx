"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import type { TicketWithRelations } from "@/types"
import type { Session } from "next-auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Loader2, Paperclip, Send } from "lucide-react"

const statusColors: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  REVIEW: "bg-purple-100 text-purple-800",
  DONE: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-800",
}

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-800",
  MEDIUM: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
}

function initials(name: string | null | undefined) {
  return name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "?"
}

export function TicketDetail({
  ticket: initialTicket,
  session,
}: {
  ticket: TicketWithRelations
  session: Session
}) {
  const router = useRouter()
  const [ticket, setTicket] = useState(initialTicket)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const canManage = session.user.role === "ADMIN" || session.user.role === "TECHNICIAN"

  async function updateStatus(status: string | null) {
    if (!status) return
    const res = await fetch(`/api/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const updated = await res.json()
      setTicket(updated)
      toast.success(`Status changed to ${status}`)
    }
  }

  async function updatePriority(priority: string | null) {
    if (!priority) return
    const res = await fetch(`/api/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority }),
    })
    if (res.ok) {
      const updated = await res.json()
      setTicket(updated)
      toast.success(`Priority changed to ${priority}`)
    }
  }

  async function addComment() {
    if (!comment.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: comment }),
      })
      if (res.ok) {
        const newComment = await res.json()
        setTicket((prev) => ({
          ...prev,
          comments: [...prev.comments, newComment],
        }))
        setComment("")
        toast.success("Comment added")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container py-8 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">
            Ticket #{ticket.number}
          </p>
          <h1 className="text-2xl font-bold">{ticket.title}</h1>
        </div>
        <div className="flex gap-2">
          <Badge className={priorityColors[ticket.priority]}>
            {ticket.priority}
          </Badge>
          <Badge className={statusColors[ticket.status]}>
            {ticket.status.replace("_", " ")}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          {/* Attachments */}
          {ticket.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attachments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {ticket.attachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-2 text-sm">
                    <Paperclip className="h-4 w-4" />
                    <span>{att.filename}</span>
                    <span className="text-muted-foreground">
                      ({(att.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Comments ({ticket.comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ticket.comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={c.author.image || undefined} />
                    <AvatarFallback>{initials(c.author.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {c.author.name || c.author.email}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(c.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{c.body}</p>
                  </div>
                </div>
              ))}

              <Separator />

              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="flex-1"
                />
                <Button
                  onClick={addComment}
                  disabled={submitting || !comment.trim()}
                  size="icon"
                  className="self-end"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Department</p>
                <p className="text-sm">{ticket.department.name}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Submitted by</p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={ticket.submitter.image || undefined} />
                    <AvatarFallback>
                      {initials(ticket.submitter.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">
                    {ticket.submitter.name || ticket.submitter.email}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Created</p>
                <p className="text-sm">
                  {formatDistanceToNow(new Date(ticket.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>

              {canManage && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Status</p>
                    <Select
                      value={ticket.status}
                      onValueChange={updateStatus}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEW">New</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="REVIEW">Review</SelectItem>
                        <SelectItem value="DONE">Done</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Priority</p>
                    <Select
                      value={ticket.priority}
                      onValueChange={updatePriority}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Assigned to</p>
                {ticket.assignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Unassigned</p>
                ) : (
                  <div className="space-y-2">
                    {ticket.assignments.map((a) => (
                      <div key={a.id} className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={a.user.image || undefined} />
                          <AvatarFallback>
                            {initials(a.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {a.user.name || a.user.email}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticket.activityLog.map((log) => (
                <div key={log.id} className="text-xs">
                  <span className="font-medium">
                    {log.user.name || log.user.email}
                  </span>{" "}
                  <span className="text-muted-foreground">
                    {log.action.toLowerCase().replace(/_/g, " ")}
                  </span>
                  <p className="text-muted-foreground">
                    {formatDistanceToNow(new Date(log.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
