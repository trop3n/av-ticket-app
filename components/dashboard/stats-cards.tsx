"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Ticket, Clock, CheckCircle, AlertTriangle } from "lucide-react"

export type DashboardStats = {
  total: number
  open: number
  done: number
  urgent: number
}

export function StatsCards({ stats }: { stats: DashboardStats }) {
  const cards = [
    {
      title: "Total Tickets",
      value: stats.total,
      icon: Ticket,
      color: "text-blue-600",
    },
    {
      title: "Open",
      value: stats.open,
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      title: "Completed",
      value: stats.done,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Urgent",
      value: stats.urgent,
      icon: AlertTriangle,
      color: "text-red-600",
    },
  ]

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
