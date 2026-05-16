"use client"

import { useTransition, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, RefreshCw, Download, Sparkles, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import {
  addOpportunitySource,
  toggleOpportunitySource,
  deleteOpportunitySource,
  fetchOpportunitiesNow,
  scoreOpportunitiesBatch,
} from "@/lib/actions/settings"

type Source = {
  id: string
  name: string
  type: string
  url: string | null
  enabled: boolean
  last_fetched_at: string | null
}

export function SourcesTable({ sources }: { sources: Source[] }) {
  const [isPending, startTransition] = useTransition()
  const [showAdd, setShowAdd] = useState(false)
  const [fetchMsg, setFetchMsg] = useState("")
  const [scoreMsg, setScoreMsg] = useState("")

  function handleFetch() {
    setFetchMsg("")
    startTransition(async () => {
      try {
        const r = await fetchOpportunitiesNow()
        if (r.error) {
          setFetchMsg(`Error: ${r.error}`)
          toast.error(r.error)
        } else {
          setFetchMsg(`${r.inserted} new found`)
          toast.success(`Fetched — ${r.inserted} new opportunities added`)
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed"
        setFetchMsg(`Error: ${msg}`)
        toast.error(msg)
      }
    })
  }

  function handleScore() {
    setScoreMsg("")
    startTransition(async () => {
      try {
        const r = await scoreOpportunitiesBatch()
        if (!r.anthropicKeyLoaded) {
          setScoreMsg("No Anthropic key")
          toast.error("ANTHROPIC_API_KEY is not set in Netlify env vars")
        } else if (r.error) {
          setScoreMsg(`Error: ${r.error}`)
          toast.error(r.error)
        } else if (r.scored === 0 && r.remaining === 0) {
          setScoreMsg("All scored!")
          toast.success("All opportunities are already scored")
        } else {
          setScoreMsg(`${r.scored} scored, ${r.remaining} left`)
          toast.success(`Scored ${r.scored} opportunities — ${r.remaining} still pending`)
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed"
        setScoreMsg(`Error: ${msg}`)
        toast.error(msg)
      }
    })
  }

  function handleToggle(id: string, enabled: boolean) {
    startTransition(async () => {
      try { await toggleOpportunitySource(id, !enabled) } catch { /* revalidation restores state */ }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try { await deleteOpportunitySource(id) } catch { /* revalidation restores state */ }
    })
  }

  return (
    <div className="space-y-4">
      {/* Manual triggers */}
      <div className="rounded-lg border bg-card p-3 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Run manually</p>
        <div className="flex flex-wrap gap-2">
          <div className="flex flex-col gap-1">
            <Button size="sm" variant="secondary" onClick={handleFetch} disabled={isPending} className="gap-1.5">
              <Download className={`size-3.5 ${isPending ? "animate-pulse" : ""}`} />
              {isPending ? "Working..." : "Fetch opportunities"}
            </Button>
            {fetchMsg && (
              <span className={`text-xs flex items-center gap-1 ${fetchMsg.startsWith("Error") ? "text-destructive" : "text-muted-foreground"}`}>
                {fetchMsg.startsWith("Error") ? <AlertCircle className="size-3" /> : <CheckCircle2 className="size-3 text-green-500" />}
                {fetchMsg}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Button size="sm" variant="secondary" onClick={handleScore} disabled={isPending} className="gap-1.5">
              <Sparkles className={`size-3.5 ${isPending ? "animate-pulse" : ""}`} />
              {isPending ? "Working..." : "Score 3 with AI"}
            </Button>
            {scoreMsg && (
              <span className={`text-xs flex items-center gap-1 ${scoreMsg.startsWith("Error") || scoreMsg === "No Anthropic key" ? "text-destructive" : "text-muted-foreground"}`}>
                {scoreMsg.startsWith("Error") || scoreMsg === "No Anthropic key" ? <AlertCircle className="size-3" /> : <CheckCircle2 className="size-3 text-green-500" />}
                {scoreMsg}
              </span>
            )}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Fetch pulls from all enabled sources. Score AI-ranks the next 3 unscored opportunities &mdash; click multiple times to score all.
        </p>
      </div>

      <div className="rounded-lg border bg-card divide-y">
        {sources.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No discovery sources configured. Add an RSS feed below.
          </div>
        )}
        {sources.map((source) => (
          <div key={source.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{source.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="text-xs">{source.type}</Badge>
                {source.url && (
                  <span className="text-xs text-muted-foreground truncate max-w-[240px]">
                    {source.url}
                  </span>
                )}
                {source.last_fetched_at && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <RefreshCw className="size-3" />
                    {new Date(source.last_fetched_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggle(source.id, source.enabled)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  source.enabled ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              >
                <span
                  className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${
                    source.enabled ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(source.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {showAdd ? (
        <form
          action={async (fd) => {
            await addOpportunitySource(fd)
            setShowAdd(false)
          }}
          className="rounded-lg border bg-card p-4 space-y-3"
        >
          <p className="text-sm font-medium">Add RSS feed</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="src-name">Name</Label>
              <Input id="src-name" name="name" placeholder="Gates Foundation Blog" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="src-url">Feed URL</Label>
              <Input id="src-url" name="url" type="url" placeholder="https://example.com/feed.xml" required />
            </div>
          </div>
          <input type="hidden" name="type" value="rss" />
          <div className="flex gap-2">
            <Button type="submit" size="sm">Add source</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="size-4" /> Add RSS feed
        </Button>
      )}
    </div>
  )
}
