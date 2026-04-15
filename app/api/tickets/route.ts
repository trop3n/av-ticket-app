import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createTicketSchema } from "@/types"
import { emitTicketEvent } from "@/lib/events"
import { notifyTicketCreated } from "@/lib/notifications"

const ticketInclude = {
  submitter: { select: { id: true, name: true, email: true, image: true } },
  department: true,
  assignments: {
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  },
  _count: { select: { comments: true, attachments: true } },
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const searchParams = req.nextUrl.searchParams
  const departmentSlug = searchParams.get("department")
  const status = searchParams.get("status")
  const submitterId = searchParams.get("submitterId")

  const where: Record<string, unknown> = {}

  if (departmentSlug) {
    where.department = { slug: departmentSlug }
  }
  if (status) {
    where.status = status
  }

  // Requesters can only see their own tickets
  if (session.user.role === "REQUESTER") {
    where.submitterId = session.user.id
  } else if (submitterId) {
    where.submitterId = submitterId
  }

  const tickets = await prisma.ticket.findMany({
    where,
    include: ticketInclude,
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(tickets)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = createTicketSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const ticket = await prisma.ticket.create({
    data: {
      ...parsed.data,
      submitterId: session.user.id,
    },
    include: ticketInclude,
  })

  // Activity log
  await prisma.activityLog.create({
    data: {
      action: "TICKET_CREATED",
      ticketId: ticket.id,
      userId: session.user.id,
      details: { title: ticket.title, priority: ticket.priority },
    },
  })

  // Get department slug for SSE
  const dept = await prisma.department.findUnique({ where: { id: ticket.departmentId } })

  emitTicketEvent({
    type: "TICKET_CREATED",
    ticketId: ticket.id,
    departmentSlug: dept?.slug || "",
    data: { ticket },
  })

  // Fire-and-forget notifications
  notifyTicketCreated(ticket.id).catch(() => {})

  return NextResponse.json(ticket, { status: 201 })
}
