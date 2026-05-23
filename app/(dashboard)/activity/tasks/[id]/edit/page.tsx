import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { notFound } from "next/navigation"
import { TaskForm } from "@/components/activity/task-form"
import type { TaskStatus, TaskPriority } from "@/types/database"

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const [taskResult, profilesResult, grantsResult, stakeholdersResult] = await Promise.all([
    db
      .from("team_tasks")
      .select(`
        id, title, body, status, priority, due_date, grant_id, stakeholder_id,
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
          }}
        />
      </div>
    </div>
  )
}
