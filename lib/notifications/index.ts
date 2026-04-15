import { prisma } from "@/lib/prisma"
import { sendEmail } from "./email"
import { sendTeamsNotification } from "./teams"
import type { TicketPriority } from "@prisma/client"

export async function notifyTicketCreated(ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      department: true,
      submitter: { select: { name: true, email: true } },
    },
  })
  if (!ticket) return

  const technicians = await prisma.user.findMany({
    where: { departmentId: ticket.departmentId, role: "TECHNICIAN" },
    select: { email: true },
  })

  const emails = technicians.map((t) => t.email).filter(Boolean)
  if (emails.length > 0) {
    sendEmail({
      to: emails,
      subject: `[Ticket #${ticket.number}] ${ticket.title}`,
      html: `
        <h2>New Ticket: ${ticket.title}</h2>
        <p><strong>Department:</strong> ${ticket.department.name}</p>
        <p><strong>Priority:</strong> ${ticket.priority}</p>
        <p><strong>Submitted by:</strong> ${ticket.submitter.name || ticket.submitter.email}</p>
        <p>${ticket.description}</p>
      `,
    })
  }

  const themeColor = ticket.priority === "URGENT" ? "FF0000" : "0076D7"
  sendTeamsNotification({
    title: `New Ticket #${ticket.number}: ${ticket.title}`,
    text: `Submitted by ${ticket.submitter.name || ticket.submitter.email}`,
    themeColor,
    sections: [
      {
        facts: [
          { name: "Department", value: ticket.department.name },
          { name: "Priority", value: ticket.priority },
          { name: "Status", value: ticket.status },
        ],
      },
    ],
  })
}

export async function notifyTicketAssigned(ticketId: string, assigneeId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { number: true, title: true },
  })
  const assignee = await prisma.user.findUnique({
    where: { id: assigneeId },
    select: { email: true, name: true },
  })
  if (!ticket || !assignee) return

  sendEmail({
    to: assignee.email,
    subject: `[Ticket #${ticket.number}] You've been assigned: ${ticket.title}`,
    html: `<p>You have been assigned to <strong>Ticket #${ticket.number}: ${ticket.title}</strong>.</p>`,
  })
}

export async function notifyStatusChanged(
  ticketId: string,
  oldStatus: string,
  newStatus: string
) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      submitter: { select: { email: true } },
      assignments: { include: { user: { select: { email: true } } } },
    },
  })
  if (!ticket) return

  const emails = [
    ticket.submitter.email,
    ...ticket.assignments.map((a) => a.user.email),
  ].filter(Boolean)

  sendEmail({
    to: [...new Set(emails)],
    subject: `[Ticket #${ticket.number}] Status changed: ${oldStatus} → ${newStatus}`,
    html: `<p>Ticket <strong>#${ticket.number}: ${ticket.title}</strong> status changed from <strong>${oldStatus}</strong> to <strong>${newStatus}</strong>.</p>`,
  })
}

export async function notifyCommentAdded(ticketId: string, commentAuthorName: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      submitter: { select: { email: true } },
      assignments: { include: { user: { select: { email: true } } } },
    },
  })
  if (!ticket) return

  const emails = [
    ticket.submitter.email,
    ...ticket.assignments.map((a) => a.user.email),
  ].filter(Boolean)

  sendEmail({
    to: [...new Set(emails)],
    subject: `[Ticket #${ticket.number}] New comment by ${commentAuthorName}`,
    html: `<p><strong>${commentAuthorName}</strong> commented on Ticket <strong>#${ticket.number}: ${ticket.title}</strong>.</p>`,
  })
}

export async function notifyPriorityUrgent(ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { department: true },
  })
  if (!ticket) return

  sendTeamsNotification({
    title: `🚨 URGENT: Ticket #${ticket.number} — ${ticket.title}`,
    text: `Priority escalated to URGENT`,
    themeColor: "FF0000",
    sections: [
      {
        facts: [
          { name: "Department", value: ticket.department.name },
          { name: "Status", value: ticket.status },
        ],
      },
    ],
  })
}
