"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2 } from "lucide-react"
import { inviteUser, updateUserRole, removeTeamMember } from "@/lib/actions/settings"
import { toast } from "sonner"
import type { UserRole } from "@/types/database"

interface TeamMember {
  id: string
  full_name: string | null
  email: string | null
  role: UserRole
  created_at: string
}

const ROLES: UserRole[] = ["admin", "team_member", "viewer"]
const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  team_member: "Member",
  viewer: "Viewer",
}
const ROLE_COLORS: Record<UserRole, string> = {
  admin: "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
  team_member: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  viewer: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
}

function Initials({ name, email }: { name: string | null; email: string | null }) {
  const source = name && !name.includes("@") ? name : email ?? "?"
  const letters = source
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("")
  return (
    <div className="size-9 shrink-0 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold select-none">
      {letters}
    </div>
  )
}

export function TeamTable({ team }: { team: TeamMember[] }) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<UserRole>("team_member")
  const [isPending, startTransition] = useTransition()

  function handleInvite() {
    if (!email) return
    const form = new FormData()
    form.append("email", email)
    form.append("role", role)
    startTransition(async () => {
      try {
        await inviteUser(form)
        setEmail("")
        toast.success("Invitation sent")
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Invite failed")
      }
    })
  }

  function handleRoleChange(userId: string, newRole: string) {
    startTransition(async () => {
      try {
        await updateUserRole(userId, newRole)
        toast.success("Role updated")
      } catch {
        toast.error("Failed to update role")
      }
    })
  }

  function handleRemove(userId: string, label: string) {
    if (!confirm(`Remove "${label}" from the team? This cannot be undone.`)) return
    startTransition(async () => {
      try {
        await removeTeamMember(userId)
        toast.success("Member removed")
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed to remove member")
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Invite form */}
      <div className="rounded-lg border p-4 space-y-3 bg-card">
        <p className="text-sm font-medium">Invite team member</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="email"
            placeholder="colleague@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
            className="flex-1"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <Button size="sm" onClick={handleInvite} disabled={isPending || !email} className="shrink-0">
            {isPending ? "Sending…" : "Send invite"}
          </Button>
        </div>
      </div>

      {/* Team list */}
      <div className="rounded-lg border bg-card divide-y">
        {team.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No team members yet.
          </div>
        )}
        {team.map((member) => {
          const name = member.full_name?.trim()
          const hasRealName = name && !name.includes("@")
          const displayName = hasRealName ? name : null
          const displayEmail = member.email ?? null
          // For users without a real name, derive a label from their email
          const pendingLabel = displayEmail ?? (name ? name.split("@")[0] : "Unknown")

          return (
            <div key={member.id} className="flex items-center gap-3 px-4 py-3">
              <Initials name={displayName} email={displayEmail} />
              <div className="flex-1 min-w-0">
                {displayName ? (
                  <>
                    <p className="text-sm font-medium truncate">{displayName}</p>
                    {displayEmail && (
                      <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm truncate">{pendingLabel}</p>
                    <p className="text-xs text-muted-foreground italic">Pending signup</p>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${ROLE_COLORS[member.role]}`}>
                  {ROLE_LABELS[member.role]}
                </span>
                <select
                  value={member.role}
                  onChange={(e) => handleRoleChange(member.id, e.target.value)}
                  disabled={isPending}
                  className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  disabled={isPending}
                  onClick={() => handleRemove(member.id, displayName ?? displayEmail ?? "this member")}
                  title={hasRealName ? "Remove member" : "Cancel invite"}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
