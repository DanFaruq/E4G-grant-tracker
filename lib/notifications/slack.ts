type SlackField = { title: string; value: string }

export async function sendSlackMessage(
  webhookUrl: string,
  title: string,
  body: string,
  fields?: SlackField[],
  link?: string
) {
  if (!webhookUrl) return

  const blocks: unknown[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${title}*\n${body}`,
      },
      ...(link
        ? {
            accessory: {
              type: "button",
              text: { type: "plain_text", text: "View →" },
              url: link,
            },
          }
        : {}),
    },
  ]

  if (fields && fields.length > 0) {
    blocks.push({
      type: "section",
      fields: fields.map((f) => ({
        type: "mrkdwn",
        text: `*${f.title}*\n${f.value}`,
      })),
    })
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    // Slack failures must not break the cron
  }
}
