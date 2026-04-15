import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createCommentSchema } from "@/types"
import { emitTicketEvent } from "@/lib/events"
import { notifyCommentAdded } from "@/lib/notifications"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const comments = await prisma.comment.findMany({
    where: { ticketId: id },
    include: {
      author: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(comments)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = createCommentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { department: true },
  })
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 })

  const comment = await prisma.comment.create({
    data: {
      body: parsed.data.body,
      ticketId: id,
      authorId: session.user.id,
    },
    include: {
      author: { select: { id: true, name: true, email: true, image: true } },
    },
  })

  await prisma.activityLog.create({
    data: {
      action: "COMMENT_ADDED",
      ticketId: id,
      userId: session.user.id,
    },
  })

  emitTicketEvent({
    type: "COMMENT_ADDED",
    ticketId: id,
    departmentSlug: ticket.department.slug,
    data: { comment },
  })

  notifyCommentAdded(id, session.user.name || session.user.email || "Someone").catch(
    () => {}
  )

  return NextResponse.json(comment, { status: 201 })
}
