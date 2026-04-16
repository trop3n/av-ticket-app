"use client"

import { useEffect, useRef, useState } from "react"
import type { TicketEvent } from "@/lib/events"

export function useTicketEvents(
  onEvent: (event: TicketEvent) => void,
  departmentSlug?: string
): { connected: boolean } {
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    let eventSource: EventSource | null = null
    let retryTimeout: NodeJS.Timeout | undefined
    let cancelled = false

    function connect() {
      eventSource = new EventSource("/api/events")

      eventSource.onopen = () => {
        if (!cancelled) setConnected(true)
      }

      eventSource.onmessage = (e) => {
        try {
          const event: TicketEvent = JSON.parse(e.data)
          if (departmentSlug && event.departmentSlug !== departmentSlug) return
          onEventRef.current(event)
        } catch {
          // Ignore parse errors (keepalive comments)
        }
      }

      eventSource.onerror = () => {
        if (!cancelled) setConnected(false)
        eventSource?.close()
        retryTimeout = setTimeout(connect, 5000)
      }
    }

    connect()

    return () => {
      cancelled = true
      if (retryTimeout) clearTimeout(retryTimeout)
      eventSource?.close()
      setConnected(false)
    }
  }, [departmentSlug])

  return { connected }
}
