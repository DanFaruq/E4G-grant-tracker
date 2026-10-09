import type { JobLevel, TaskVisibility, UserRole } from "@/types/database"

/** The ladder, lowest to highest. Order here must match the job_level enum in the database. */
export const JOB_LEVELS: { value: JobLevel; label: string; summary: string }[] = [
  { value: "intern",             label: "Intern",              summary: "Learns quickly, executes assigned work well, asks good questions." },
  { value: "junior_analyst_1",   label: "Junior Analyst I",    summary: "Delivers clearly defined tasks with limited supervision." },
  { value: "junior_analyst_2",   label: "Junior Analyst II",   summary: "Owns defined pieces of work end to end." },
  { value: "senior_analyst_1",   label: "Senior Analyst I",    summary: "Independently solves substantial parts of a project." },
  { value: "senior_analyst_2",   label: "Senior Analyst II",   summary: "Owns major workstreams and manages junior colleagues." },
  { value: "associate",          label: "Associate",           summary: "Leads workstreams from problem definition through delivery." },
  { value: "senior_associate_1", label: "Senior Associate I",  summary: "Leads complex projects with limited oversight." },
  { value: "senior_associate_2", label: "Senior Associate II", summary: "Operates close to organizational leadership level." },
  { value: "director",           label: "Director",            summary: "Top of the ladder. Sees all tasks." },
]

export const JOB_LEVEL_LABELS = Object.fromEntries(JOB_LEVELS.map((l) => [l.value, l.label])) as Record<JobLevel, string>

const RANK = Object.fromEntries(JOB_LEVELS.map((l, i) => [l.value, i])) as Record<JobLevel, number>

export function isJobLevel(value: unknown): value is JobLevel {
  return typeof value === "string" && value in RANK
}

/** True if `level` is at or above `min` on the ladder. A missing level never qualifies. */
export function levelAtLeast(level: JobLevel | null | undefined, min: JobLevel): boolean {
  return !!level && RANK[level] >= RANK[min]
}

export type Viewer = { id: string; role: UserRole; job_level: JobLevel | null }

/** Admins and Directors see every task and are the only ones who may restrict a task. */
export function isTaskPrivileged(viewer: Pick<Viewer, "role" | "job_level">): boolean {
  return viewer.role === "admin" || viewer.job_level === "director"
}

export type TaskAccessFields = {
  created_by: string
  visibility: TaskVisibility
  min_level: JobLevel | null
  allowed_levels: JobLevel[]
  allowed_profile_ids: string[]
}

/**
 * Mirror of the database function can_view_task(). The database is the real
 * gate; use this only where a decision is needed in app code (for example
 * before a service-role write, which bypasses RLS).
 */
export function canViewTask(viewer: Viewer, task: TaskAccessFields, assigneeIds: string[]): boolean {
  if (task.created_by === viewer.id) return true
  if (isTaskPrivileged(viewer)) return true
  if (assigneeIds.includes(viewer.id)) return true

  switch (task.visibility) {
    case "team":
      return true
    case "directors":
      return false
    case "min_level":
      return !!task.min_level && levelAtLeast(viewer.job_level, task.min_level)
    case "custom":
      return (
        task.allowed_profile_ids.includes(viewer.id) ||
        (!!viewer.job_level && task.allowed_levels.includes(viewer.job_level))
      )
  }
}

/** Short description of who can see a task, for badges and the form. */
export function visibilityLabel(task: Pick<TaskAccessFields, "visibility" | "min_level" | "allowed_levels" | "allowed_profile_ids">): string {
  switch (task.visibility) {
    case "team":
      return "Whole team"
    case "directors":
      return "Directors only"
    case "min_level":
      return task.min_level ? `${JOB_LEVEL_LABELS[task.min_level]} and above` : "Level and above"
    case "custom": {
      const parts: string[] = []
      if (task.allowed_levels.length) parts.push(task.allowed_levels.map((l) => JOB_LEVEL_LABELS[l]).join(", "))
      if (task.allowed_profile_ids.length) {
        const n = task.allowed_profile_ids.length
        parts.push(`${n} ${n === 1 ? "person" : "people"}`)
      }
      return parts.length ? parts.join(" + ") : "Only people on the task"
    }
  }
}
