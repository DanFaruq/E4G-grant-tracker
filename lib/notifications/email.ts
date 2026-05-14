import { Resend } from "resend"

const FROM = process.env.RESEND_FROM_EMAIL ?? "grants@yourdomain.com"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

type DigestNotification = {
  title: string
  body: string | null
  link: string | null
}

export async function sendDigestEmail(
  toEmail: string,
  toName: string,
  notifications: DigestNotification[]
) {
  const resend = getResend()
  if (!resend || notifications.length === 0) return

  const lines = notifications
    .map((n) => {
      const link = n.link ? `${APP_URL}${n.link}` : null
      return `<li style="margin-bottom:12px">
        <strong>${n.title}</strong>
        ${n.body ? `<br/><span style="color:#666">${n.body}</span>` : ""}
        ${link ? `<br/><a href="${link}" style="color:#2563eb">View →</a>` : ""}
      </li>`
    })
    .join("")

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `E4G Grants — ${notifications.length} update${notifications.length !== 1 ? "s" : ""}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="margin-bottom:4px">E4G Grant Tracker</h2>
        <p style="color:#666;margin-bottom:24px">Hi ${toName}, here's your daily summary:</p>
        <ul style="padding-left:20px">${lines}</ul>
        <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb"/>
        <p style="color:#999;font-size:12px">
          You're receiving this because you have digest emails enabled.
          <a href="${APP_URL}/settings">Manage preferences</a>
        </p>
      </div>
    `,
  })
}

export async function sendUrgentEmail(
  toEmail: string,
  toName: string,
  notification: DigestNotification
) {
  const resend = getResend()
  if (!resend) return

  const link = notification.link ? `${APP_URL}${notification.link}` : null

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: notification.title,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="margin-bottom:4px">E4G Grant Tracker</h2>
        <p style="color:#666;margin-bottom:16px">Hi ${toName},</p>
        <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px">
          <strong>${notification.title}</strong>
          ${notification.body ? `<p style="color:#666;margin:8px 0 0">${notification.body}</p>` : ""}
          ${link ? `<a href="${link}" style="display:inline-block;margin-top:12px;color:#2563eb">View →</a>` : ""}
        </div>
        <p style="color:#999;font-size:12px;margin-top:24px">
          <a href="${APP_URL}/settings">Manage notification preferences</a>
        </p>
      </div>
    `,
  })
}
