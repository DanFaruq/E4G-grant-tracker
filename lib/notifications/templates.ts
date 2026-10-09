export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export type TagEmailInput = {
  toName: string
  title: string
  body: string | null
  /** Absolute URL to the item, or null. */
  url: string | null
  settingsUrl: string
}

/** Subject + HTML for an instant "you were tagged" email. All user text is escaped. */
export function renderTagEmail(input: TagEmailInput): { subject: string; html: string } {
  const name = escapeHtml(input.toName || "there")
  const title = escapeHtml(input.title)
  const body = input.body ? escapeHtml(input.body) : null
  const url = input.url ? escapeHtml(input.url) : null

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="margin-bottom:4px">E4G Team</h2>
      <p style="color:#666;margin-bottom:16px">Hi ${name},</p>
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px">
        <strong>${title}</strong>
        ${body ? `<p style="color:#444;margin:8px 0 0">${body}</p>` : ""}
        ${url ? `<a href="${url}" style="display:inline-block;margin-top:12px;padding:10px 16px;background:#1d5a8f;color:#ffffff;border-radius:8px;text-decoration:none">Open in E4G Team</a>` : ""}
      </div>
      <p style="color:#999;font-size:12px;margin-top:24px">
        You're receiving this because you were tagged. <a href="${escapeHtml(input.settingsUrl)}">Manage notification preferences</a>
      </p>
    </div>
  `

  return { subject: input.title, html }
}
