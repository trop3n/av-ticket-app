"use client"

import { useState } from "react"
import type { Department } from "@prisma/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

type UserRow = {
  id: string
  name: string | null
  email: string
  image: string | null
  role: string
  departmentId: string | null
  department: Department | null
  createdAt: string
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-800",
  TECHNICIAN: "bg-blue-100 text-blue-800",
  REQUESTER: "bg-gray-100 text-gray-800",
}

export function UserManagement({
  initialUsers,
  departments,
}: {
  initialUsers: UserRow[]
  departments: Department[]
}) {
  const [users, setUsers] = useState(initialUsers)

  async function updateUser(userId: string, data: Record<string, unknown>) {
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...data }),
    })
    if (res.ok) {
      const updated = await res.json()
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...updated } : u))
      )
      toast.success("User updated")
    } else {
      toast.error("Failed to update user")
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Department</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.image || undefined} />
                  <AvatarFallback>
                    {user.name?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{user.name || "—"}</span>
              </div>
            </TableCell>
            <TableCell className="text-sm">{user.email}</TableCell>
            <TableCell>
              <Select
                value={user.role}
                onValueChange={(role) => updateUser(user.id, { role })}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="TECHNICIAN">Technician</SelectItem>
                  <SelectItem value="REQUESTER">Requester</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Select
                value={user.departmentId || "none"}
                onValueChange={(v) =>
                  updateUser(user.id, {
                    departmentId: v === "none" ? null : v,
                  })
                }
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No department</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
