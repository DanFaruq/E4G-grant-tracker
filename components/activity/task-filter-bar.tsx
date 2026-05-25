"use client"

import { useRouter, useSearchParams } from "next/navigation"

type Profile = { id: string; full_name: string }

type Props = {
  profiles: Profile[]
  filterPriority: string
  filterAssignee: string
  activeTab: string
}

export function TaskFilterBar({ profiles, filterPriority, filterAssignee, activeTab }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function navigate(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/activity?${params.toString()}`)
  }

  const hasFilters = !!(filterPriority || filterAssignee)

  return (
    <div className="flex items-center gap-2 px-4 md:px-6 py-2.5 border-b border-border flex-wrap">
      <span className="text-xs text-muted-foreground font-medium mr-1">Filter:</span>

      <select
        title="Filter by priority"
        className="h-7 rounded-md border border-border bg-background text-xs px-2 text-muted-foreground"
        value={filterPriority}
        onChange={(e) => navigate("priority", e.target.value)}
      >
        <option value="">Priority</option>
        <option value="urgent">Urgent</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      {profiles.length > 0 && (
        <select
          title="Filter by assignee"
          className="h-7 rounded-md border border-border bg-background text-xs px-2 text-muted-foreground"
          value={filterAssignee}
          onChange={(e) => navigate("assignee", e.target.value)}
        >
          <option value="">Assignee</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{p.full_name}</option>
          ))}
        </select>
      )}

      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            const params = new URLSearchParams()
            if (activeTab !== "open") params.set("tab", activeTab)
            router.push(`/activity${params.toString() ? `?${params.toString()}` : ""}`)
          }}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
