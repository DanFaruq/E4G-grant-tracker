import { z } from "zod"

const jobLevel = z.enum([
  "intern", "junior_analyst_1", "junior_analyst_2", "senior_analyst_1", "senior_analyst_2",
  "associate", "senior_associate_1", "senior_associate_2", "director",
])

export const taskSchema = z.object({
  title:          z.string().min(1, "Title is required").max(200),
  body:           z.string().optional(),
  status:         z.enum(["open", "in_progress", "done", "cancelled"]).default("open"),
  priority:       z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  due_date:       z.string().optional().nullable(),
  assignee_ids:   z.array(z.string().uuid()).default([]),
  grant_id:       z.string().uuid().optional().nullable(),
  stakeholder_id: z.string().uuid().optional().nullable(),
  // Visibility is only honoured for admins and directors (enforced in the action and by RLS).
  visibility:          z.enum(["team", "directors", "min_level", "custom"]).default("team"),
  min_level:           jobLevel.optional().nullable(),
  allowed_levels:      z.array(jobLevel).default([]),
  allowed_profile_ids: z.array(z.string().uuid()).default([]),
}).refine((t) => t.visibility !== "min_level" || !!t.min_level, {
  message: "Choose the lowest level that can see this task",
  path: ["min_level"],
})

export const commentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty").max(5000),
})
