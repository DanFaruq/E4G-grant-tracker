"use client"

import { useTransition, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { updateProfile } from "@/lib/actions/settings"

export function ProfileForm({
  currentName,
  email,
}: {
  currentName: string | null
  email: string | null
}) {
  const [isPending, startTransition] = useTransition()
  const realName = currentName && !currentName.includes("@") ? currentName : ""
  const [name, setName] = useState(realName)

  function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) return
    const fd = new FormData()
    fd.append("full_name", trimmed)
    startTransition(async () => {
      try {
        await updateProfile(fd)
        toast.success("Name updated")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to save")
      }
    })
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="display-name">Your name</Label>
        <div className="flex gap-2">
          <Input
            id="display-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending || !name.trim() || name.trim() === realName}
            className="shrink-0"
          >
            {isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
      {email && (
        <p className="text-xs text-muted-foreground">{email}</p>
      )}
    </div>
  )
}
