"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import {
  Ticket,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

export type DashboardStats = {
  total: number
  open: number
  done: number
  urgent: number
  lastWeekCount: number
}

export type SparkPoint = {
  day: string
  count: number
}

export type ActivityItem = {
  id: string
  action: string
  userName: string | null
  userImage: string | null
  ticketNumber: number
  ticketTitle: string
  createdAt: string
}

function useCountUp(target: number, durationMs = 600) {
  const [value, setValue] = useState(0)
  const frameRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) {
      setValue(target)
      return
    }

    const start = performance.now()
    const from = 0
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(from + (target - from) * eased))
      if (t < 1) frameRef.current = requestAnimationFrame(step)
    }
    frameRef.current = requestAnimationFrame(step)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [target, durationMs])

  return value
}

function humanizeAction(action: string): string {
  switch (action) {
    case "TICKET_CREATED":
      return "opened"
    case "TICKET_UPDATED":
      return "updated"
    case "COMMENT_ADDED":
      return "commented on"
    case "ASSIGNMENT_CHANGED":
      return "reassigned"
    default:
      return action.toLowerCase().replace(/_/g, " ")
  }
}

function OpenWithSpark({
  open,
  spark,
  lastWeekCount,
}: {
  open: number
  spark: SparkPoint[]
  lastWeekCount: number
}) {
  const count = useCountUp(open)
  const firstHalf = spark.slice(0, Math.floor(spark.length / 2)).reduce((a, b) => a + b.count, 0)
  const secondHalf = spark.slice(Math.floor(spark.length / 2)).reduce((a, b) => a + b.count, 0)
  const trendUp = secondHalf > firstHalf
  const trendFlat = secondHalf === firstHalf
  const TrendIcon = trendFlat ? Minus : trendUp ? TrendingUp : TrendingDown
  const trendClass = trendFlat
    ? "text-muted-foreground"
    : trendUp
      ? "text-status-done"
      : "text-priority-urgent"

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5 flex flex-col h-full gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Open tickets
            </p>
            <p className="text-4xl font-semibold tracking-tight tabular-nums">{count}</p>
          </div>
          <div className="flex items-center gap-1 text-xs font-mono">
            <TrendIcon className={cn("h-3.5 w-3.5", trendClass)} aria-hidden />
            <span className={trendClass}>
              {lastWeekCount} / {spark.length}d
            </span>
          </div>
        </div>
        <div className="flex-1 min-h-[56px] -mx-2 -mb-2">
          <ResponsiveContainer width="100%" height={64}>
            <AreaChart data={spark} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent-cta)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-accent-cta)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" hide />
              <YAxis hide domain={[0, "dataMax + 1"]} />
              <Tooltip
                cursor={{ stroke: "var(--color-border)" }}
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                  padding: "4px 8px",
                }}
                labelStyle={{ color: "var(--color-muted-foreground)" }}
                itemStyle={{ color: "var(--color-foreground)" }}
                formatter={(v) => [String(v), "opened"]}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--color-accent-cta)"
                strokeWidth={1.75}
                fill="url(#sparkFill)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: number
  icon: typeof Ticket
  tone: "neutral" | "done" | "urgent"
}) {
  const count = useCountUp(value)
  const toneClass =
    tone === "done"
      ? "text-status-done"
      : tone === "urgent"
        ? "text-priority-urgent"
        : "text-muted-foreground"

  return (
    <Card>
      <CardContent className="p-4 space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <Icon className={cn("h-3.5 w-3.5", toneClass)} aria-hidden />
        </div>
        <p className="text-2xl font-semibold tracking-tight tabular-nums">{count}</p>
      </CardContent>
    </Card>
  )
}

function ActivityCard({ activity }: { activity: ActivityItem[] }) {
  return (
    <Card className="h-full">
      <CardContent className="p-4 flex flex-col h-full gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Recent activity
          </p>
        </div>
        {activity.length === 0 ? (
          <p className="text-xs text-muted-foreground/70 italic">No recent activity</p>
        ) : (
          <ul className="space-y-2 flex-1">
            {activity.map((a) => (
              <li key={a.id} className="flex items-start gap-2 text-xs">
                <Avatar className="h-5 w-5 shrink-0">
                  <AvatarImage src={a.userImage || undefined} alt={a.userName || ""} />
                  <AvatarFallback className="text-[9px]">
                    {a.userName?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate leading-snug">
                    <span className="font-medium">{a.userName || "Someone"}</span>{" "}
                    <span className="text-muted-foreground">{humanizeAction(a.action)}</span>{" "}
                    <span className="font-mono text-[11px] text-muted-foreground">
                      #{a.ticketNumber}
                    </span>{" "}
                    <span className="text-muted-foreground truncate">{a.ticketTitle}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 tabular-nums">
                    {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function StatsBento({
  stats,
  spark,
  activity,
}: {
  stats: DashboardStats
  spark: SparkPoint[]
  activity: ActivityItem[]
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[minmax(120px,auto)]">
      <div className="col-span-2 md:row-span-2">
        <OpenWithSpark open={stats.open} spark={spark} lastWeekCount={stats.lastWeekCount} />
      </div>
      <MetricCard label="Total" value={stats.total} icon={Ticket} tone="neutral" />
      <MetricCard label="Completed" value={stats.done} icon={CheckCircle2} tone="done" />
      <div className="col-span-2">
        <ActivityCard activity={activity} />
      </div>
    </div>
  )
}

// Kept for external compatibility: small single-metric "urgent" card if needed elsewhere
export function UrgentMetric({ value }: { value: number }) {
  return <MetricCard label="Urgent" value={value} icon={AlertTriangle} tone="urgent" />
}
