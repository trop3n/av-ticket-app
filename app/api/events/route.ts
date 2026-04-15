import { auth } from "@/lib/auth"
import { ticketEvents, type TicketEvent } from "@/lib/events"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      const handler = (event: TicketEvent) => {
        const data = `data: ${JSON.stringify(event)}\n\n`
        try {
          controller.enqueue(encoder.encode(data))
        } catch {
          // Stream closed
          ticketEvents.off("ticket", handler)
        }
      }

      // Send initial keepalive
      controller.enqueue(encoder.encode(": keepalive\n\n"))

      ticketEvents.on("ticket", handler)

      // Keepalive every 30s
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"))
        } catch {
          clearInterval(interval)
          ticketEvents.off("ticket", handler)
        }
      }, 30000)

      // Cleanup when client disconnects
      const cleanup = () => {
        clearInterval(interval)
        ticketEvents.off("ticket", handler)
      }

      // The stream will be closed by the client disconnecting
      controller.enqueue(encoder.encode(": connected\n\n"))
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
