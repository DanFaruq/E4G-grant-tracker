import Parser from "rss-parser"
import type { GrantSourceAdapter, RawOpportunity } from "./base"

const parser = new Parser({
  timeout: 15_000,
  customFields: { item: ["summary", "content:encoded"] },
})

function hashUrl(url: string): string {
  // Simple deterministic ID from URL
  let h = 0
  for (let i = 0; i < url.length; i++) {
    h = (Math.imul(31, h) + url.charCodeAt(i)) | 0
  }
  return Math.abs(h).toString(36)
}

export const rssAdapter: GrantSourceAdapter = {
  sourceKey: "rss",

  async fetch(config) {
    const url = config.url as string
    if (!url) return []

    let feed: Awaited<ReturnType<typeof parser.parseURL>>
    try {
      feed = await parser.parseURL(url)
    } catch {
      return []
    }

    const results: RawOpportunity[] = []

    for (const item of feed.items ?? []) {
      const link = item.link ?? item.guid ?? ""
      const externalId = link ? hashUrl(link) : hashUrl(item.title ?? Math.random().toString())

      let deadline: Date | undefined
      if (item.pubDate) {
        const d = new Date(item.pubDate)
        if (!isNaN(d.getTime())) deadline = d
      }

      results.push({
        externalId,
        title: item.title ?? "Untitled",
        description:
          item.contentSnippet ??
          (item as unknown as Record<string, string>)["content:encoded"] ??
          item.summary ??
          undefined,
        url: link,
        deadlineText: item.pubDate,
        deadline,
        rawData: item,
      })
    }

    return results
  },
}
