"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { formatDate } from "@/lib/utils"
import { addNote, deleteNote } from "@/lib/actions/grants"
import { Trash2, Pin } from "lucide-react"
import { toast } from "sonner"

interface Note {
  id: string
  body: string
  pinned: boolean
  created_at: string
  profiles: { id: string; full_name: string } | null
}

export function NotesList({
  grantId,
  notes,
  canEdit,
  currentUserId,
}: {
  grantId: string
  notes: Note[]
  canEdit: boolean
  currentUserId: string
}) {
  const [body, setBody] = useState("")
  const [isPending, startTransition] = useTransition()

  const sorted = [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  function handleAdd() {
    if (!body.trim()) return
    startTransition(async () => {
      try {
        await addNote(grantId, body.trim())
        setBody("")
        toast.success("Note added")
      } catch {
        toast.error("Failed to add note")
      }
    })
  }

  function handleDelete(noteId: string) {
    startTransition(async () => {
      try {
        await deleteNote(noteId, grantId)
        toast.success("Note deleted")
      } catch {
        toast.error("Failed to delete note")
      }
    })
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="space-y-2">
          <Textarea
            placeholder="Add a progress note…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
          />
          <Button size="sm" onClick={handleAdd} disabled={isPending || !body.trim()}>
            {isPending ? "Posting…" : "Add note"}
          </Button>
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes yet.</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((note) => (
            <div
              key={note.id}
              className={`rounded-lg border p-4 ${note.pinned ? "border-amber-300 bg-amber-50" : "bg-card"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  {note.pinned && <Pin className="size-3 text-amber-500" />}
                  <span className="font-medium">{note.profiles?.full_name ?? "Unknown"}</span>
                  <span>·</span>
                  <span>{formatDate(note.created_at)}</span>
                </div>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleDelete(note.id)}
                    disabled={isPending}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap">{note.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
