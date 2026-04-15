"use client"

import { useEffect, useRef, useCallback } from "react"
import type { TicketEvent } from "@/lib/events"

export function useTicketEvents(
  onEvent: (event: TicketEvent) => void,
  departmentSlug?: string
) {
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    let eventSource: EventSource | null = null
    let retryTimeout: NodeJS.Timeout

    function connect() {
      eventSource = new EventSource("/api/events")

      eventSource.onmessage = (e) => {
        try {
          const event: TicketEvent = JSON.parse(e.data)
          // Filter by department if specified
          if (departmentSlug && event.departmentSlug !== departmentSlug) return
          onEventRef.current(event)
        } catch {
          // Ignore parse errors (keepalive comments)
        }
      }

      eventSource.onerror = () => {
        eventSource?.close()
        // Reconnect after 5 seconds
        retryTimeout = setTimeout(connect, 5000)
      }
    }

    connect()

    return () => {
      clearTimeout(retryTimeout)
      eventSource?.close()
    }
  }, [departmentSlug])
}
