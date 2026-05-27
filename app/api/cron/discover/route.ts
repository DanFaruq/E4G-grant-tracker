import { timingSafeEqual } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { runDiscovery } from "@/lib/discovery/runner"
import { scoreNewOpportunities } from "@/lib/ai/scorer"
import { sendSlackMessage } from "@/lib/notifications/slack"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any

type OrgSettings = {
  org_name: string
  mission_statement: string | null
  focus_areas: string[]
  ai_threshold: number
  grants_gov_query: string | null
  slack_webhook_url: string | null
}

type OppRow = {
  id: string
  title: string
  funder: string | null
  ai_score: number | null
  url: string | null
}

type ProfileRow = { id: string }

function validateCronSecret(header: string | null): boolean {
  const expected = process.env.CRON_SECRET
  if (!header || !expected) return false
  try {
    return timingSafeEqual(Buffer.from(header), Buffer.from(expected))
  } catch {
    return false
  }
}

// Discovery cron job — runs daily at 06:00 UTC via vercel.json
export async function GET(request: NextRequest) {
  if (!validateCronSecret(request.headers.get("x-cron-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startedAt = Date.now()
  console.log("[cron/discover] starting")

  const service = await createServiceClient()

  const { data: settings } = await service
    .from("organization_settings")
    .select("org_name, mission_statement, focus_areas, ai_threshold, grants_gov_query, slack_webhook_url")
    .single() as { data: OrgSettings | null }

  const org = {
    org_name: settings?.org_name ?? "E4G",
    mission_statement: settings?.mission_statement ?? null,
    focus_areas: settings?.focus_areas ?? [],
    ai_threshold: settings?.ai_threshold ?? 70,
    grants_gov_query: settings?.grants_gov_query ?? null,
    slack_webhook_url: settings?.slack_webhook_url ?? null,
  }

  // Step 1: Run discovery adapters and insert new opportunities
  const inserted = await runDiscovery(service, org)

  // Step 2: Score all unscored opportunities with Claude
  const scored = await scoreNewOpportunities(service, org)

  // Step 3: Notify for high-scoring opportunities
  const highScorers = scored.filter((s) => s.score >= org.ai_threshold)

  if (highScorers.length > 0) {
    // Get recipient list: all admins + team_members
    const { data: recipients } = await service
      .from("profiles")
      .select("id")
      .in("role", ["admin", "team_member"]) as { data: ProfileRow[] | null }

    const recipientIds = (recipients ?? []).map((r) => r.id)

    for (const { id: oppId, score } of highScorers) {
      const { data: opp } = await service
        .from("opportunities")
        .select("id, title, funder, ai_score, url")
        .eq("id", oppId)
        .single() as { data: OppRow | null }

      if (!opp) continue

      // In-app notification for each recipient
      for (const userId of recipientIds) {
        const { count } = await service
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("opportunity_id", oppId)
          .eq("type", "new_opportunity")

        if ((count ?? 0) > 0) continue

        await (service.from("notifications") as AnyTable).insert({
          user_id: userId,
          type: "new_opportunity",
          title: `New opportunity (${score}/100): ${opp.title}`,
          body: opp.funder ? `From ${opp.funder}` : null,
          link: "/opportunities",
          opportunity_id: oppId,
        })
      }

      // Slack notification
      if (org.slack_webhook_url) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
        await sendSlackMessage(
          org.slack_webhook_url,
          `New grant opportunity — ${score}/100 match`,
          opp.title,
          [
            { title: "Funder", value: opp.funder ?? "Unknown" },
            { title: "AI Score", value: `${score}/100` },
          ],
          opp.url ?? `${appUrl}/opportunities`
        )
      }
    }
  }

  const elapsed = Date.now() - startedAt
  console.log(
    `[cron/discover] done — inserted=${inserted} scored=${scored.length} alerts=${highScorers.length} elapsed=${elapsed}ms`
  )

  return NextResponse.json({
    ok: true,
    opportunitiesInserted: inserted,
    opportunitiesScored: scored.length,
    highScoringAlerts: highScorers.length,
    elapsedMs: elapsed,
    debug: {
      anthropicKeyLoaded: !!process.env.ANTHROPIC_API_KEY,
    },
  })
}
