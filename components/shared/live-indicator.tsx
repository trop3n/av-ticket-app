"use client"

import { useTicketEvents } from "@/lib/hooks/use-ticket-events"
import { cn } from "@/lib/utils"

export function LiveIndicator() {
  const { connected } = useTicketEvents(() => {})

  return (
    <div
      className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider uppercase text-muted-foreground select-none"
      role="status"
      aria-live="polite"
      aria-label={connected ? "Live updates connected" : "Live updates disconnected"}
    >
      <span className="relative flex h-2 w-2">
        {connected && (
          <span
            className="absolute inline-flex h-full w-full rounded-full bg-status-done opacity-70 animate-ping"
            aria-hidden
          />
        )}
        <span
          className={cn(
            "relative inline-flex h-2 w-2 rounded-full",
            connected ? "bg-status-done" : "bg-muted-foreground/40"
          )}
          aria-hidden
        />
      </span>
      <span className={cn("hidden sm:inline", !connected && "opacity-60")}>
        {connected ? "Live" : "Offline"}
      </span>
    </div>
  )
}
