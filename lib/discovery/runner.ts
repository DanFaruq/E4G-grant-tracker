import type { SupabaseClient } from "@supabase/supabase-js"
import { grantsGovAdapter } from "./adapters/grants-gov"
import { rssAdapter } from "./adapters/rss"
import { dedup } from "./dedup"
import type { RawOpportunity } from "./adapters/base"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any

type SourceRow = {
  id: string
  name: string
  type: string
  url: string | null
  config: Record<string, unknown> | null
  enabled: boolean
}

const ADAPTERS = {
  grants_gov: grantsGovAdapter,
  rss: rssAdapter,
}

export async function runDiscovery(
  service: SupabaseClient,
  orgSettings: { grants_gov_query: string | null }
): Promise<number> {
  const { data: sources } = await service
    .from("opportunity_sources")
    .select("id, name, type, url, config, enabled")
    .eq("enabled", true)

  const rows = (sources ?? []) as SourceRow[]

  // Always run grants_gov if configured, even without a DB row
  const hasGrantsGovRow = rows.some((r) => r.type === "grants_gov")
  if (!hasGrantsGovRow && orgSettings.grants_gov_query) {
    rows.unshift({
      id: "builtin-grants-gov",
      name: "Grants.gov",
      type: "grants_gov",
      url: null,
      config: { keyword: orgSettings.grants_gov_query },
      enabled: true,
    })
  }

  let totalInserted = 0

  for (const source of rows) {
    const adapter = ADAPTERS[source.type as keyof typeof ADAPTERS]
    if (!adapter) continue

    const config: Record<string, unknown> = {
      ...(source.config ?? {}),
      url: source.url,
    }

    if (source.type === "grants_gov" && !config.keyword) {
      config.keyword = orgSettings.grants_gov_query ?? ""
    }

    let items: RawOpportunity[]
    try {
      items = await adapter.fetch(config)
    } catch {
      // Per-source failure doesn't block other sources
      await (service.from("opportunity_sources") as AnyTable)
        .update({ last_fetched_at: new Date().toISOString() })
        .eq("id", source.id)
      continue
    }

    const newItems = await dedup(service, adapter.sourceKey, items)

    for (const item of newItems) {
      await (service.from("opportunities") as AnyTable).insert({
        source: adapter.sourceKey,
        external_id: item.externalId,
        title: item.title,
        funder: item.funder ?? null,
        description: item.description ?? null,
        amount_text: item.amountText ?? null,
        deadline_text: item.deadlineText ?? null,
        deadline: item.deadline ? item.deadline.toISOString().split("T")[0] : null,
        url: item.url,
        raw_data: item.rawData,
        status: "pending_review",
      })
      totalInserted++
    }

    if (source.id !== "builtin-grants-gov") {
      await (service.from("opportunity_sources") as AnyTable)
        .update({ last_fetched_at: new Date().toISOString() })
        .eq("id", source.id)
    }
  }

  return totalInserted
}
