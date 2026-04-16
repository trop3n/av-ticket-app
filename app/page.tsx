import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { StatsBento, type DashboardStats, type SparkPoint, type ActivityItem } from "@/components/dashboard/stats-cards"
import { KanbanBoard } from "@/components/board/kanban-board"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

const DAYS = 7

function bucketByDay(createdAts: Date[]): SparkPoint[] {
  const now = new Date()
  const buckets: SparkPoint[] = []
  for (let i = DAYS - 1; i >= 0; i--) {
    const day = new Date(now)
    day.setHours(0, 0, 0, 0)
    day.setDate(day.getDate() - i)
    const next = new Date(day)
    next.setDate(next.getDate() + 1)
    const count = createdAts.filter((d) => d >= day && d < next).length
    buckets.push({ day: day.toISOString().slice(5, 10), count })
  }
  return buckets
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session) return redirect("/auth/signin")

  const isRequester = session.user.role === "REQUESTER"
  const ticketWhere = isRequester ? { submitterId: session.user.id } : {}

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - DAYS)

  const [total, open, done, urgent, recentCreated, activity, tickets] = await Promise.all([
    prisma.ticket.count({ where: ticketWhere }),
    prisma.ticket.count({
      where: { ...ticketWhere, status: { in: ["NEW", "IN_PROGRESS", "REVIEW"] } },
    }),
    prisma.ticket.count({ where: { ...ticketWhere, status: "DONE" } }),
    prisma.ticket.count({
      where: { ...ticketWhere, priority: "URGENT", status: { not: "DONE" } },
    }),
    prisma.ticket.findMany({
      where: { ...ticketWhere, createdAt: { gte: weekAgo } },
      select: { createdAt: true },
    }),
    prisma.activityLog.findMany({
      where: isRequester
        ? { ticket: { submitterId: session.user.id } }
        : {},
      include: {
        user: { select: { name: true, email: true, image: true } },
        ticket: { select: { number: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.ticket.findMany({
      where: {
        ...ticketWhere,
        status: { not: "CANCELLED" },
      },
      include: {
        submitter: { select: { id: true, name: true, email: true, image: true } },
        department: true,
        assignments: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
        _count: { select: { comments: true, attachments: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const spark = bucketByDay(recentCreated.map((r) => r.createdAt))
  const lastWeekCount = recentCreated.length

  const stats: DashboardStats = { total, open, done, urgent, lastWeekCount }
  const activityItems: ActivityItem[] = activity.map((a) => ({
    id: a.id,
    action: a.action,
    userName: a.user.name || a.user.email,
    userImage: a.user.image,
    ticketNumber: a.ticket.number,
    ticketTitle: a.ticket.title,
    createdAt: a.createdAt.toISOString(),
  }))

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {isRequester ? "Your ticket overview" : "IT Service Desk overview"}
          </p>
        </div>
        <Link href="/tickets/new">
          <Button variant="cta">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        </Link>
      </div>

      <StatsBento stats={stats} spark={spark} activity={activityItems} />

      <div>
        <h2 className="text-lg font-semibold tracking-tight mb-3">Active tickets</h2>
        <KanbanBoard initialTickets={tickets} canDrag={!isRequester} />
      </div>
    </div>
  )
}
