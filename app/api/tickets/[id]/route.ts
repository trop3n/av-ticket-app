import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { updateTicketSchema } from "@/types"
import { emitTicketEvent } from "@/lib/events"
import {
  notifyStatusChanged,
  notifyPriorityUrgent,
} from "@/lib/notifications"

const ticketInclude = {
  submitter: { select: { id: true, name: true, email: true, image: true } },
  department: true,
  assignments: {
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  },
  comments: {
    include: { author: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { createdAt: "asc" as const },
  },
  attachments: true,
  activityLog: {
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { createdAt: "desc" as const },
  },
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: ticketInclude,
  })

  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Requesters can only see their own tickets
  if (session.user.role === "REQUESTER" && ticket.submitterId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json(ticket)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = updateTicketSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const existing = await prisma.ticket.findUnique({
    where: { id },
    include: { department: true },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Only admins, department technicians, or the submitter can update
  if (
    session.user.role === "REQUESTER" &&
    existing.submitterId !== session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const ticket = await prisma.ticket.update({
    where: { id },
    data: parsed.data,
    include: ticketInclude,
  })

  // Activity log
  const changes: Record<string, string> = {}
  if (parsed.data.status && parsed.data.status !== existing.status) {
    changes.statusFrom = existing.status
    changes.statusTo = parsed.data.status
  }
  if (parsed.data.priority && parsed.data.priority !== existing.priority) {
    changes.priorityFrom = existing.priority
    changes.priorityTo = parsed.data.priority
  }

  await prisma.activityLog.create({
    data: {
      action: "TICKET_UPDATED",
      ticketId: id,
      userId: session.user.id,
      details: changes,
    },
  })

  emitTicketEvent({
    type: "TICKET_UPDATED",
    ticketId: id,
    departmentSlug: existing.department.slug,
    data: { ticket, changes },
  })

  // Fire-and-forget notifications
  if (parsed.data.status && parsed.data.status !== existing.status) {
    notifyStatusChanged(id, existing.status, parsed.data.status).catch(() => {})
  }
  if (parsed.data.priority === "URGENT" && existing.priority !== "URGENT") {
    notifyPriorityUrgent(id).catch(() => {})
  }

  return NextResponse.json(ticket)
}
