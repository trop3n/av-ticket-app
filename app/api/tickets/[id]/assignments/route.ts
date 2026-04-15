import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { emitTicketEvent } from "@/lib/events"
import { notifyTicketAssigned } from "@/lib/notifications"

const assignSchema = z.object({ userId: z.string().min(1) })

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role === "REQUESTER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = assignSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { department: true },
  })
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 })

  const assignment = await prisma.ticketAssignment.create({
    data: { ticketId: id, userId: parsed.data.userId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  })

  await prisma.activityLog.create({
    data: {
      action: "TECHNICIAN_ASSIGNED",
      ticketId: id,
      userId: session.user.id,
      details: { assignedUserId: parsed.data.userId },
    },
  })

  emitTicketEvent({
    type: "ASSIGNMENT_CHANGED",
    ticketId: id,
    departmentSlug: ticket.department.slug,
    data: { assignment, action: "assigned" },
  })

  notifyTicketAssigned(id, parsed.data.userId).catch(() => {})

  return NextResponse.json(assignment, { status: 201 })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role === "REQUESTER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = assignSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { department: true },
  })
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 })

  await prisma.ticketAssignment.delete({
    where: { ticketId_userId: { ticketId: id, userId: parsed.data.userId } },
  })

  await prisma.activityLog.create({
    data: {
      action: "TECHNICIAN_UNASSIGNED",
      ticketId: id,
      userId: session.user.id,
      details: { unassignedUserId: parsed.data.userId },
    },
  })

  emitTicketEvent({
    type: "ASSIGNMENT_CHANGED",
    ticketId: id,
    departmentSlug: ticket.department.slug,
    data: { userId: parsed.data.userId, action: "unassigned" },
  })

  return NextResponse.json({ success: true })
}
