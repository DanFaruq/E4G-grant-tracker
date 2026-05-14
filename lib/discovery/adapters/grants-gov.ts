import type { GrantSourceAdapter, RawOpportunity } from "./base"

type GrantsGovHit = {
  id: string
  number: string
  title: string
  agency: string
  agencyCode: string
  openDate: string
  closeDate: string
  oppStatus: string
  docType: string
}

type SearchResponse = {
  hitCount?: number
  startRecord?: number
  oppHits?: GrantsGovHit[]
}

const BASE_URL = "https://apply07.grants.gov/grantsws/rest/opportunities/search/"
const PAGE_SIZE = 25
const MAX_PAGES = 4 // up to 100 per run

function parseDate(raw: string | undefined): Date | undefined {
  if (!raw) return undefined
  // Format is MM/DD/YYYY
  const iso = raw.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$1-$2")
  const d = new Date(iso)
  return isNaN(d.getTime()) ? undefined : d
}

export const grantsGovAdapter: GrantSourceAdapter = {
  sourceKey: "grants_gov",

  async fetch(config) {
    const keyword = (config.keyword as string) || ""
    if (!keyword.trim()) return []

    const results: RawOpportunity[] = []

    for (let page = 0; page < MAX_PAGES; page++) {
      let res: Response
      try {
        res = await fetch(BASE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keyword,
            oppStatuses: "posted",
            sortBy: "openDate|desc",
            rows: PAGE_SIZE,
            startRecordNum: page * PAGE_SIZE,
          }),
          signal: AbortSignal.timeout(15_000),
        })
      } catch {
        break
      }

      if (!res.ok) break

      const json = (await res.json()) as SearchResponse
      const hits = json.oppHits ?? []
      if (hits.length === 0) break

      for (const hit of hits) {
        results.push({
          externalId: hit.id,
          title: hit.title,
          funder: hit.agency,
          deadlineText: hit.closeDate,
          deadline: parseDate(hit.closeDate),
          url: `https://www.grants.gov/search-results-detail/${hit.id}`,
          rawData: hit,
        })
      }

      const total = json.hitCount ?? 0
      if ((page + 1) * PAGE_SIZE >= total) break
    }

    return results
  },
}
