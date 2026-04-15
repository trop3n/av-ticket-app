import { z } from "zod"
import type {
  Ticket,
  User,
  Comment,
  Department,
  TicketAssignment,
  Attachment,
  ActivityLog,
} from "@prisma/client"

// Zod schemas for validation
export const createTicketSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  departmentId: z.string().min(1, "Department is required"),
})

export const updateTicketSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  status: z.enum(["NEW", "IN_PROGRESS", "REVIEW", "DONE", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
})

export const createCommentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty"),
})

export const updateUserSchema = z.object({
  role: z.enum(["ADMIN", "TECHNICIAN", "REQUESTER"]).optional(),
  departmentId: z.string().nullable().optional(),
})

// Composite types for API responses
export type TicketWithRelations = Ticket & {
  submitter: Pick<User, "id" | "name" | "email" | "image">
  department: Department
  assignments: (TicketAssignment & {
    user: Pick<User, "id" | "name" | "email" | "image">
  })[]
  comments: (Comment & {
    author: Pick<User, "id" | "name" | "email" | "image">
  })[]
  attachments: Attachment[]
  activityLog: (ActivityLog & {
    user: Pick<User, "id" | "name" | "email" | "image">
  })[]
  _count?: {
    comments: number
    attachments: number
  }
}

export type TicketListItem = Ticket & {
  submitter: Pick<User, "id" | "name" | "email" | "image">
  department: Department
  assignments: (TicketAssignment & {
    user: Pick<User, "id" | "name" | "email" | "image">
  })[]
  _count: {
    comments: number
    attachments: number
  }
}

export type CreateTicketInput = z.infer<typeof createTicketSchema>
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>
export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
