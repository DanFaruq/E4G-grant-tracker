import type { SupabaseClient } from "@supabase/supabase-js"
import type { RawOpportunity } from "./adapters/base"

export async function dedup(
  supabase: SupabaseClient,
  source: string,
  items: RawOpportunity[]
): Promise<RawOpportunity[]> {
  if (items.length === 0) return []

  const ids = items.map((i) => i.externalId)

  const { data } = await supabase
    .from("opportunities")
    .select("external_id")
    .eq("source", source)
    .in("external_id", ids)

  const seen = new Set((data ?? []).map((r: { external_id: string }) => r.external_id))
  return items.filter((i) => !seen.has(i.externalId))
}
