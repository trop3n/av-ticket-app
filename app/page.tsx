import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { StatsCards, type DashboardStats } from "@/components/dashboard/stats-cards"
import { RecentTickets } from "@/components/dashboard/recent-tickets"
import { DepartmentSummary } from "@/components/dashboard/department-summary"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) return redirect("/auth/signin")

  const isRequester = session.user.role === "REQUESTER"
  const ticketWhere = isRequester ? { submitterId: session.user.id } : {}

  // Stats aggregation
  const [total, open, done, urgent] = await Promise.all([
    prisma.ticket.count({ where: ticketWhere }),
    prisma.ticket.count({
      where: { ...ticketWhere, status: { in: ["NEW", "IN_PROGRESS", "REVIEW"] } },
    }),
    prisma.ticket.count({ where: { ...ticketWhere, status: "DONE" } }),
    prisma.ticket.count({ where: { ...ticketWhere, priority: "URGENT", status: { not: "DONE" } } }),
  ])

  const stats: DashboardStats = { total, open, done, urgent }

  // Recent tickets
  const recentTickets = await prisma.ticket.findMany({
    where: ticketWhere,
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
    take: 10,
  })

  // Department summary (for technicians/admins)
  let departmentSummaries: { name: string; slug: string; total: number; open: number; done: number }[] = []
  if (!isRequester) {
    const departments = await prisma.department.findMany()
    departmentSummaries = await Promise.all(
      departments.map(async (dept) => {
        const [deptTotal, deptOpen, deptDone] = await Promise.all([
          prisma.ticket.count({ where: { departmentId: dept.id } }),
          prisma.ticket.count({
            where: { departmentId: dept.id, status: { in: ["NEW", "IN_PROGRESS", "REVIEW"] } },
          }),
          prisma.ticket.count({ where: { departmentId: dept.id, status: "DONE" } }),
        ])
        return {
          name: dept.name,
          slug: dept.slug,
          total: deptTotal,
          open: deptOpen,
          done: deptDone,
        }
      })
    )
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {isRequester ? "Your ticket overview" : "IT Service Desk overview"}
          </p>
        </div>
        <Link href="/tickets/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        </Link>
      </div>

      <StatsCards stats={stats} />

      {!isRequester && departmentSummaries.length > 0 && (
        <DepartmentSummary departments={departmentSummaries} />
      )}

      <RecentTickets tickets={recentTickets} />
    </div>
  )
}
