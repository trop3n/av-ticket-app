import nodemailer from "nodemailer"

const transporter =
  process.env.SMTP_HOST
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    : null

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  if (!transporter) {
    console.log(`[Email] SMTP not configured. Would send to ${to}: ${subject}`)
    return
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@example.com",
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html,
    })
  } catch (error) {
    console.error("[Email] Failed to send:", error)
  }
}
