import Anthropic from "@anthropic-ai/sdk"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any

export type ScorerResult = {
  score: number
  rationale: string
}

type OppInput = {
  title: string
  funder?: string | null
  description?: string | null
  amount_text?: string | null
  deadline_text?: string | null
}

type OrgContext = {
  org_name: string
  mission_statement: string | null
  focus_areas: string[]
}

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null
  return new Anthropic()
}

export async function scoreOpportunity(
  opp: OppInput,
  org: OrgContext
): Promise<ScorerResult | null> {
  const client = getClient()
  if (!client) return null

  const system = `You are a grant opportunity evaluator for ${org.org_name}.

Mission: ${org.mission_statement ?? "Not specified"}
Focus areas: ${org.focus_areas.length ? org.focus_areas.join(", ") : "Not specified"}

Score 0–100: 0 = irrelevant, 50 = tangential, 70 = good fit, 90+ = excellent match.
Return ONLY valid JSON with no markdown or extra text.`

  const user = `Evaluate this grant opportunity:

Title: ${opp.title}
Funder: ${opp.funder ?? "Unknown"}
Description: ${opp.description ?? "Not provided"}
Amount: ${opp.amount_text ?? "Not specified"}
Deadline: ${opp.deadline_text ?? "Not specified"}

Return exactly this JSON shape:
{"score":<integer 0-100>,"rationale":"<2-3 sentence explanation of the score>"}`

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 256,
        system,
        messages: [{ role: "user", content: user }],
      })

      const text = msg.content[0]?.type === "text" ? msg.content[0].text.trim() : ""
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) continue

      const parsed = JSON.parse(jsonMatch[0]) as { score: number; rationale: string }
      return {
        score: Math.max(0, Math.min(100, Math.round(Number(parsed.score)))),
        rationale: String(parsed.rationale),
      }
    } catch {
      if (attempt === 0) await new Promise((r) => setTimeout(r, 5000))
    }
  }

  return null
}

export async function scoreNewOpportunities(
  service: Awaited<ReturnType<typeof import("@/lib/supabase/server").createServiceClient>>,
  org: OrgContext
): Promise<{ id: string; score: number }[]> {
  type UnscoredRow = {
    id: string; title: string; funder: string | null
    description: string | null; amount_text: string | null; deadline_text: string | null
  }

  const { data: unscoredRaw } = await service
    .from("opportunities")
    .select("id, title, funder, description, amount_text, deadline_text")
    .eq("status", "pending_review")
    .is("ai_score", null)
    .order("created_at", { ascending: false })
    .limit(50)

  const unscored = (unscoredRaw ?? []) as UnscoredRow[]
  if (unscored.length === 0) return []

  const scored: { id: string; score: number }[] = []

  for (const opp of unscored) {
    const result = await scoreOpportunity(opp as OppInput, org)
    if (result) {
      await (service.from("opportunities") as AnyTable)
        .update({
          ai_score: result.score,
          ai_rationale: result.rationale,
          ai_scored_at: new Date().toISOString(),
        })
        .eq("id", opp.id)

      scored.push({ id: opp.id, score: result.score })
    }
    // Polite rate limit: 1 req/sec
    await new Promise((r) => setTimeout(r, 1100))
  }

  return scored
}
