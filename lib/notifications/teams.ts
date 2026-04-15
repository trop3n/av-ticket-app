interface TeamsCard {
  title: string
  text: string
  themeColor?: string
  sections?: Array<{
    facts: Array<{ name: string; value: string }>
  }>
}

export async function sendTeamsNotification(card: TeamsCard) {
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL
  if (!webhookUrl) {
    console.log(`[Teams] Webhook not configured. Would send: ${card.title}`)
    return
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        themeColor: card.themeColor || "0076D7",
        summary: card.title,
        sections: [
          {
            activityTitle: card.title,
            activitySubtitle: card.text,
            facts: card.sections?.[0]?.facts || [],
            markdown: true,
          },
        ],
      }),
    })
  } catch (error) {
    console.error("[Teams] Failed to send:", error)
  }
}
