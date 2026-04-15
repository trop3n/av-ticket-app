import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserManagement } from "@/components/admin/user-management"

export default async function AdminPage() {
  const session = await auth()
  if (!session) return redirect("/auth/signin")
  if (session.user.role !== "ADMIN") return redirect("/")

  const [users, departments] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        departmentId: true,
        department: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
  ])

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">Manage users, roles, and departments</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <UserManagement
            initialUsers={JSON.parse(JSON.stringify(users))}
            departments={JSON.parse(JSON.stringify(departments))}
          />
        </CardContent>
      </Card>
    </div>
  )
}
