"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Trash2, MessageSquare } from "lucide-react"
import { toast } from "sonner"
import { addComment, deleteComment } from "@/lib/actions/tasks"

type Comment = {
  id: string
  body: string
  created_at: string
  author: { id: string; full_name: string } | null
}

function avatarColor(id: string) {
  const colors = ["oklch(0.55 0.175 38)", "oklch(0.55 0.18 270)", "oklch(0.55 0.18 160)", "oklch(0.55 0.18 330)", "oklch(0.55 0.18 200)"]
  let h = 0
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h)
  return colors[Math.abs(h) % colors.length]
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function CommentSection({
  taskId,
  comments,
  currentUserId,
  isAdmin,
}: {
  taskId: string
  comments: Comment[]
  currentUserId: string
  isAdmin: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData(formRef.current!)
      await addComment(taskId, fd)
      formRef.current?.reset()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add comment")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(commentId: string) {
    setDeletingId(commentId)
    try {
      await deleteComment(commentId, taskId)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete comment")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">
          {comments.length} comment{comments.length !== 1 ? "s" : ""}
        </h3>
      </div>

      {comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((c) => {
            const authorId = (c.author as { id?: string } | null)?.id ?? ""
            const authorName = (c.author as { full_name?: string } | null)?.full_name ?? "Unknown"
            const initials = authorName.trim().split(/\s+/).map((n) => n[0]).slice(0, 2).join("").toUpperCase()
            const canDelete = authorId === currentUserId || isAdmin

            return (
              <div key={c.id} className="flex gap-3">
                <div
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-white text-[11px] font-bold mt-0.5"
                  style={{ backgroundColor: avatarColor(authorId) }}
                >
                  {initials}
                </div>
                <div className="flex-1 rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{authorName}</span>
                      <span className="text-[11px] text-muted-foreground">{relativeTime(c.created_at)}</span>
                    </div>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deletingId === c.id}
                        className="text-muted-foreground/50 hover:text-destructive transition-colors"
                      >
                        {deletingId === c.id
                          ? <Loader2 className="size-3.5 animate-spin" />
                          : <Trash2 className="size-3.5" />
                        }
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{c.body}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Comment form */}
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          name="body"
          rows={3}
          placeholder="Leave a comment…"
          required
          className="resize-none"
        />
        <Button type="submit" size="sm" disabled={loading} className="gap-2">
          {loading && <Loader2 className="size-3.5 animate-spin" />}
          Comment
        </Button>
      </form>
    </div>
  )
}
