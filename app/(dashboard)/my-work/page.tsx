import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Header } from "@/components/layout/header"
import { MyWorkClient } from "./my-work-client"
import type { TaskStatus, TaskPriority, EventType, RecurrenceType, GrantStage, UserRole } from "@/types/database"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any

export type MyWorkTask = {
  id: string
  number: number
  title: string
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  created_by: string
  creator: { full_name: string } | null
  grant: { id: string; name: string } | null
  stakeholder: { name: string } | null
  assignees: { profile: { id: string; full_name: string } | null }[]
}

export type MyWorkEvent = {
  id: string
  title: string
  event_type: EventType
  start_at: string
  end_at: string | null
  all_day: boolean
  recurrence: RecurrenceType
  grant: { name: string } | null
  attendees: { profile: { id: string; full_name: string } | null }[]
}

export type MyWorkGrant = {
  id: string
  name: string
  funder: string
  stage: GrantStage
  deadline: string | null
}

export type ProfileOption = { id: string; full_name: string }

export default async function MyWorkPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const db = supabase as AnyTable

  const [myProfileResult, params] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role").eq("id", user.id).single(),
    searchParams,
  ])

  const myProfile = myProfileResult.data as { id: string; full_name: string; role: UserRole } | null
  const isAdmin = myProfile?.role === "admin"

  let targetUserId = user.id
  if (isAdmin && params.userId && params.userId !== user.id) {
    targetUserId = params.userId
  }

  const allProfiles = isAdmin
    ? ((await supabase.from("profiles").select("id, full_name").order("full_name")).data ?? []) as ProfileOption[]
    : [] as ProfileOption[]

  // Fetch junction table IDs for this user
  const [taskAssignmentsResult, eventAttendeesResult, grantAssigneesResult] = await Promise.all([
    db.from("task_assignments").select("task_id").eq("profile_id", targetUserId),
    db.from("event_attendees").select("event_id").eq("profile_id", targetUserId),
    db.from("grant_assignees").select("grant_id").eq("user_id", targetUserId),
  ])

  const taskIds = ((taskAssignmentsResult.data ?? []) as { task_id: string }[]).map((a) => a.task_id)
  const eventIds = ((eventAttendeesResult.data ?? []) as { event_id: string }[]).map((a) => a.event_id)
  const grantIds = ((grantAssigneesResult.data ?? []) as { grant_id: string }[]).map((a) => a.grant_id)

  const [tasksResult, eventsResult, grantsResult] = await Promise.all([
    taskIds.length > 0
      ? db.from("team_tasks")
          .select(`
            id, number, title, status, priority, due_date, created_by,
            creator:profiles!created_by(full_name),
            grant:grants(id, name),
            stakeholder:stakeholders(name),
            assignees:task_assignments(profile:profiles(id, full_name))
          `)
          .in("id", taskIds)
          .order("updated_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    eventIds.length > 0
      ? db.from("team_events")
          .select(`
            id, title, event_type, start_at, end_at, all_day, recurrence,
            grant:grants(name),
            attendees:event_attendees(profile:profiles(id, full_name))
          `)
          .in("id", eventIds)
          .order("start_at", { ascending: true })
      : Promise.resolve({ data: [] }),
    grantIds.length > 0
      ? supabase.from("grants")
          .select("id, name, funder, stage, deadline")
          .in("id", grantIds)
          .eq("archived", false)
          .order("deadline", { ascending: true, nullsFirst: false })
      : Promise.resolve({ data: [] }),
  ])

  const targetProfile = allProfiles.find((p) => p.id === targetUserId) ?? null
  const viewingName = targetUserId === user.id
    ? (myProfile?.full_name ?? "My Work")
    : (targetProfile?.full_name ?? "Unknown")

  return (
    <div className="flex flex-col min-h-full">
      <Header title="My Work" />
      <MyWorkClient
        tasks={(tasksResult.data ?? []) as MyWorkTask[]}
        events={(eventsResult.data ?? []) as MyWorkEvent[]}
        grants={(grantsResult.data ?? []) as MyWorkGrant[]}
        currentUserId={user.id}
        isAdmin={isAdmin}
        allProfiles={allProfiles}
        targetUserId={targetUserId}
        viewingName={viewingName}
      />
    </div>
  )
}
