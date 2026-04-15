import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { updateUserSchema } from "@/types"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const searchParams = req.nextUrl.searchParams
  const departmentId = searchParams.get("departmentId")
  const role = searchParams.get("role")

  const where: Record<string, unknown> = {}
  if (departmentId) where.departmentId = departmentId
  if (role) where.role = role

  const users = await prisma.user.findMany({
    where,
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
  })

  return NextResponse.json(users)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const { userId, ...data } = body

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 })
  }

  const parsed = updateUserSchema.safeParse(data)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: parsed.data,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      departmentId: true,
      department: true,
    },
  })

  return NextResponse.json(user)
}
