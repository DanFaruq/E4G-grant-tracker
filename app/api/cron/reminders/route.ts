import { timingSafeEqual } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { sendDigestEmail, sendUrgentEmail } from "@/lib/notifications/email"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any

type GrantWithAssignees = {
  id: string
  name: string
  grant_assignees: { user_id: string }[] | null
}

type ProfileRow = {
  id: string
  full_name: string
  email: string
  email_mode: string
}

type NotificationRow = {
  title: string
  body: string | null
  link: string | null
}

function validateCronSecret(header: string | null): boolean {
  const expected = process.env.CRON_SECRET
  if (!header || !expected) return false
  try {
    return timingSafeEqual(Buffer.from(header), Buffer.from(expected))
  } catch {
    return false
  }
}

// Deadline reminder cron job — runs daily at 07:00 UTC via vercel.json
export async function GET(request: NextRequest) {
  if (!validateCronSecret(request.headers.get("x-cron-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startedAt = Date.now()
  console.log("[cron/reminders] starting")

  const service = await createServiceClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const REMINDER_DAYS = [30, 14, 7, 3, 1]
  let notificationsCreated = 0

  // Fetch admins once — used for every grant across all reminder windows
  const { data: allAdmins } = await service
    .from("profiles")
    .select("id")
    .eq("role", "admin") as { data: { id: string }[] | null }
  const adminIds = allAdmins?.map((p) => p.id) ?? []

  for (const days of REMINDER_DAYS) {
    const target = new Date(today)
    target.setDate(target.getDate() + days)
    const targetDate = target.toISOString().split("T")[0]

    const { data: grants } = await service
      .from("grants")
      .select("id, name, grant_assignees(user_id)")
      .eq("deadline", targetDate)
      .eq("archived", false)
      .not("stage", "in", '("awarded","rejected")') as { data: GrantWithAssignees[] | null }

    if (!grants) continue

    for (const grant of grants) {
      const assignees = grant.grant_assignees ?? []

      const recipientIds = new Set([
        ...assignees.map((a) => a.user_id),
        ...adminIds,
      ])

      for (const userId of recipientIds) {
        const { count } = await service
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("grant_id", grant.id)
          .eq("type", "deadline_reminder")
          .gte("created_at", new Date(Date.now() - 86400000).toISOString())

        if ((count ?? 0) > 0) continue

        await (service.from("notifications") as AnyTable).insert({
          user_id: userId,
          type: "deadline_reminder",
          title: `Deadline in ${days} day${days === 1 ? "" : "s"}: ${grant.name}`,
          body: `The deadline for "${grant.name}" is ${days === 1 ? "tomorrow" : `in ${days} days`}.`,
          link: `/grants/${grant.id}`,
          grant_id: grant.id,
        })
        notificationsCreated++
      }
    }
  }

  // Send digest emails for users with email_mode = 'digest'
  await sendDigests(service)

  const elapsed = Date.now() - startedAt
  console.log(`[cron/reminders] done — notificationsCreated=${notificationsCreated} elapsed=${elapsed}ms`)
  return NextResponse.json({ ok: true, notificationsCreated, elapsedMs: elapsed })
}

async function sendDigests(service: Awaited<ReturnType<typeof createServiceClient>>) {
  const since = new Date(Date.now() - 86400000).toISOString()

  const { data: users } = await service
    .from("profiles")
    .select("id, full_name")
    .order("full_name") as { data: { id: string; full_name: string }[] | null }

  if (!users) return

  for (const user of users) {
    // Check preference
    const { data: pref } = await service
      .from("notification_preferences")
      .select("email_mode")
      .eq("user_id", user.id)
      .single() as { data: { email_mode: string } | null }

    const emailMode = pref?.email_mode ?? "digest"
    if (emailMode === "off") continue

    // Get unread notifications from past 24h
    const { data: notifs } = await service
      .from("notifications")
      .select("title, body, link")
      .eq("user_id", user.id)
      .eq("read", false)
      .gte("created_at", since) as { data: NotificationRow[] | null }

    if (!notifs || notifs.length === 0) continue

    // Get user's actual email from auth
    const { data: authUser } = await service.auth.admin.getUserById(user.id)
    if (!authUser.user?.email) continue

    if (emailMode === "digest") {
      await sendDigestEmail(authUser.user.email, user.full_name || "Team member", notifs)
    } else if (emailMode === "urgent") {
      for (const notif of notifs) {
        await sendUrgentEmail(authUser.user.email, user.full_name || "Team member", notif)
      }
    }
  }
}
