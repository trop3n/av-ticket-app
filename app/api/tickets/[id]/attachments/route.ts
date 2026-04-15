import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const ticket = await prisma.ticket.findUnique({ where: { id } })
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

  // Ensure upload directory exists
  const ticketDir = path.join(UPLOAD_DIR, id)
  await mkdir(ticketDir, { recursive: true })

  const ext = path.extname(file.name)
  const filename = `${randomUUID()}${ext}`
  const filePath = path.join(ticketDir, filename)

  const bytes = await file.arrayBuffer()
  await writeFile(filePath, Buffer.from(bytes))

  const attachment = await prisma.attachment.create({
    data: {
      filename: file.name,
      path: filePath,
      mimetype: file.type,
      size: file.size,
      ticketId: id,
    },
  })

  return NextResponse.json(attachment, { status: 201 })
}
