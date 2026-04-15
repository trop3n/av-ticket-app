import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { TicketDetail } from "@/components/tickets/ticket-detail"

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session) return notFound()

  const { id } = await params

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      submitter: { select: { id: true, name: true, email: true, image: true } },
      department: true,
      assignments: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      comments: {
        include: {
          author: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      attachments: true,
      activityLog: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!ticket) return notFound()

  // Requesters can only see their own tickets
  if (session.user.role === "REQUESTER" && ticket.submitterId !== session.user.id) {
    return notFound()
  }

  return <TicketDetail ticket={ticket} session={session} />
}
