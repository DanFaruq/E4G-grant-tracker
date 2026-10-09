import webpush from "web-push"
import { createServiceClient } from "@/lib/supabase/server"
import { sendTagEmail } from "@/lib/notifications/email"

// Server-only helpers. These live outside the "use server" actions file on
// purpose: anything exported from there is callable from the browser, and
// these send email and push to arbitrary users.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any

function initVapid() {
  const pub  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const subj = process.env.VAPID_SUBJECT ?? "admin@example.com"
  if (!pub || !priv) throw new Error("VAPID keys not configured")
  webpush.setVapidDetails(`mailto:${subj}`, pub, priv)
}

// ── Internal: send push to all devices for a user ─────────────────────────

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url: string; tag?: string }
) {
  try {
    initVapid()
  } catch (err) {
    console.error("[sendPushToUser] VAPID init failed:", err)
    return
  }

  const service = await createServiceClient()
  const { data: subs } = await (service.from("web_push_subscriptions") as AnyTable)
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId)

  if (!subs?.length) return

  await Promise.allSettled(
    subs.map((sub: { endpoint: string; p256dh: string; auth: string }) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      ).catch(async (err: { statusCode?: number }) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await (service.from("web_push_subscriptions") as AnyTable)
            .delete()
            .eq("endpoint", sub.endpoint)
        }
      })
    )
  )
}

// ── Internal: create in-app notification + push ────────────────────────────

export async function notifyUser(params: {
  userId:   string
  type:     "task_assigned" | "task_updated" | "event_invited" | "comment_added" | "grant_assigned"
  title:    string
  body:     string
  link:     string
  taskId?:  string
  eventId?: string
  grantId?: string
}) {
  const service = await createServiceClient()

  const { data: created, error } = await (service.from("notifications") as AnyTable)
    .insert({
      user_id:  params.userId,
      type:     params.type,
      title:    params.title,
      body:     params.body,
      link:     params.link,
      task_id:  params.taskId  ?? null,
      event_id: params.eventId ?? null,
      grant_id: params.grantId ?? null,
    })
    .select("id")
    .single()

  if (error || !created) {
    console.error("[notifyUser] DB insert failed:", error?.message)
    return
  }

  // Push and email are independent: one failing must not block the other.
  await Promise.allSettled([
    emailTaggedUser(created.id as string, params),
    sendPushToUser(params.userId, {
      title: params.title,
      body:  params.body,
      url:   params.link,
      tag:   params.type,
    }),
  ])
}

/**
 * Instant email for a tag notification. Skipped only if the user turned
 * email off in settings; otherwise sent immediately regardless of digest mode.
 * Marks the notification emailed so the daily digest doesn't repeat it.
 */
async function emailTaggedUser(
  notificationId: string,
  params: { userId: string; title: string; body: string; link: string }
) {
  try {
    const service = await createServiceClient()

    const { data: pref } = await (service.from("notification_preferences") as AnyTable)
      .select("email_mode")
      .eq("user_id", params.userId)
      .maybeSingle()
    if (pref?.email_mode === "off") return

    const [{ data: profile }, { data: authUser }] = await Promise.all([
      (service.from("profiles") as AnyTable).select("full_name").eq("id", params.userId).single(),
      service.auth.admin.getUserById(params.userId),
    ])
    const email = authUser?.user?.email
    if (!email) return

    const sent = await sendTagEmail(email, profile?.full_name ?? "", {
      title: params.title,
      body:  params.body,
      link:  params.link,
    })
    if (sent) {
      await (service.from("notifications") as AnyTable)
        .update({ emailed_at: new Date().toISOString() })
        .eq("id", notificationId)
    }
  } catch (err) {
    console.error("[emailTaggedUser] failed:", err)
  }
}
