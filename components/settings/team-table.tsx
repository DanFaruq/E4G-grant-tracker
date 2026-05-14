"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { inviteUser, updateUserRole } from "@/lib/actions/settings"
import { toast } from "sonner"
import type { UserRole } from "@/types/database"

interface TeamMember {
  id: string
  full_name: string
  role: UserRole
  created_at: string
}

const ROLES: UserRole[] = ["admin", "team_member", "viewer"]
const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  team_member: "Team member",
  viewer: "Viewer",
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

  return (
    <div className="space-y-4">
      {/* Invite form */}
      <div className="rounded-lg border p-4 space-y-3">
        <p className="text-sm font-medium">Invite team member</p>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <Button size="sm" onClick={handleInvite} disabled={isPending || !email}>
            {isPending ? "Sending…" : "Invite"}
          </Button>
        </div>
      </div>

      {/* Team list */}
      <div className="rounded-lg border bg-card divide-y">
        {team.map((member) => (
          <div key={member.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium">{member.full_name || <span className="text-muted-foreground italic">Pending signup</span>}</p>
            </div>
            <select
              value={member.role}
              onChange={(e) => handleRoleChange(member.id, e.target.value)}
              disabled={isPending}
              className="rounded-md border border-input bg-background px-2 py-1 text-xs"
            >
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}
