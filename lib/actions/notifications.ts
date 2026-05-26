"use server"

import webpush from "web-push"
import { createServiceClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any

function initVapid() {
  const pub  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const subj = process.env.VAPID_SUBJECT ?? "admin@example.com"
  if (!pub || !priv) throw new Error("VAPID keys not configured")
  webpush.setVapidDetails(`mailto:${subj}`, pub, priv)
}

// ── Push subscription management ───────────────────────────────────────────

export async function subscribeToPush(subscription: {
  endpoint: string
  keys: { p256dh: string; auth: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const service = await createServiceClient()
  await (service.from("web_push_subscriptions") as AnyTable)
    .upsert(
      {
        user_id:  user.id,
        endpoint: subscription.endpoint,
        p256dh:   subscription.keys.p256dh,
        auth:     subscription.keys.auth,
      },
      { onConflict: "endpoint" }
    )

  revalidatePath("/settings")
}

export async function unsubscribeFromPush(endpoint: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const service = await createServiceClient()
  await (service.from("web_push_subscriptions") as AnyTable)
    .delete()
    .eq("endpoint", endpoint)
    .eq("user_id", user.id)

  revalidatePath("/settings")
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
  type:     "task_assigned" | "event_invited" | "comment_added"
  title:    string
  body:     string
  link:     string
  taskId?:  string
  eventId?: string
}) {
  const service = await createServiceClient()

  const { error } = await (service.from("notifications") as AnyTable).insert({
    user_id:  params.userId,
    type:     params.type,
    title:    params.title,
    body:     params.body,
    link:     params.link,
    task_id:  params.taskId  ?? null,
    event_id: params.eventId ?? null,
  })

  if (error) {
    console.error("[notifyUser] DB insert failed:", error.message)
    return
  }

  await sendPushToUser(params.userId, {
    title: params.title,
    body:  params.body,
    url:   params.link,
    tag:   params.type,
  })
}
