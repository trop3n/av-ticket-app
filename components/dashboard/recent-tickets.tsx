"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import type { TicketListItem } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const statusColors: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  REVIEW: "bg-purple-100 text-purple-800",
  DONE: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-800",
}

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-800",
  MEDIUM: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
}

export function RecentTickets({ tickets }: { tickets: TicketListItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Tickets</CardTitle>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No tickets yet
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-mono text-sm">
                    {ticket.number}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/tickets/${ticket.id}`}
                      className="font-medium hover:underline"
                    >
                      {ticket.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">
                    {ticket.department.name}
                  </TableCell>
                  <TableCell>
                    <Badge className={priorityColors[ticket.priority]}>
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[ticket.status]}>
                      {ticket.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(ticket.createdAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
