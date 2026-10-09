import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { notFound } from "next/navigation"
import { TaskForm } from "@/components/activity/task-form"
import { getViewer } from "@/lib/viewer"
import { isTaskPrivileged } from "@/lib/job-levels"
import type { JobLevel, TaskStatus, TaskPriority, TaskVisibility } from "@/types/database"

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const viewer = await getViewer(supabase)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const [taskResult, profilesResult, grantsResult, stakeholdersResult] = await Promise.all([
    db
      .from("team_tasks")
      .select(`
        id, title, body, status, priority, due_date, grant_id, stakeholder_id,
        visibility, min_level, allowed_levels, allowed_profile_ids,
        assignees:task_assignments(profile_id)
      `)
      .eq("id", id)
      .single(),
    supabase.from("profiles").select("id, full_name").order("full_name"),
    supabase.from("grants").select("id, name").eq("archived", false).order("name"),
    supabase.from("stakeholders").select("id, name").order("name"),
  ])

  if (!taskResult.data) notFound()

  const task = taskResult.data as {
    id: string
    title: string
    body: string | null
    status: TaskStatus
    priority: TaskPriority
    due_date: string | null
    grant_id: string | null
    stakeholder_id: string | null
    visibility: TaskVisibility
    min_level: JobLevel | null
    allowed_levels: JobLevel[]
    allowed_profile_ids: string[]
    assignees: { profile_id: string }[]
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Edit Task" />
      <div className="flex-1 max-w-2xl mx-auto w-full p-4 md:p-6 animate-fade-up">
        <TaskForm
          profiles={profilesResult.data ?? []}
          grants={grantsResult.data ?? []}
          stakeholders={stakeholdersResult.data ?? []}
          canRestrict={!!viewer && isTaskPrivileged(viewer)}
          defaultValues={{
            id: task.id,
            title: task.title,
            body: task.body,
            status: task.status,
            priority: task.priority,
            due_date: task.due_date,
            grant_id: task.grant_id,
            stakeholder_id: task.stakeholder_id,
            assignee_ids: task.assignees.map((a) => a.profile_id),
            visibility: {
              visibility: task.visibility,
              min_level: task.min_level,
              allowed_levels: task.allowed_levels,
              allowed_profile_ids: task.allowed_profile_ids,
            },
          }}
        />
      </div>
    </div>
  )
}
