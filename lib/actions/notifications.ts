"use server"

import { createServiceClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any

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
