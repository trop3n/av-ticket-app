import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { KanbanBoard } from "@/components/board/kanban-board"
import type { DepartmentSlug } from "@prisma/client"

const slugMap: Record<string, DepartmentSlug> = {
  av: "AV",
  engineering: "ENGINEERING",
  "tech-support": "TECH_SUPPORT",
}

export default async function BoardPage({
  params,
}: {
  params: Promise<{ department: string }>
}) {
  const session = await auth()
  if (!session) return redirect("/auth/signin")

  if (session.user.role === "REQUESTER") {
    return redirect("/")
  }

  const { department } = await params
  const slug = slugMap[department]
  if (!slug) return notFound()

  const dept = await prisma.department.findUnique({ where: { slug } })
  if (!dept) return notFound()

  const tickets = await prisma.ticket.findMany({
    where: {
      departmentId: dept.id,
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
  })

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{dept.name} Board</h1>
        <p className="text-sm text-muted-foreground">
          Drag tickets between columns to update their status
        </p>
      </div>
      <KanbanBoard initialTickets={tickets} departmentSlug={slug} />
    </div>
  )
}
