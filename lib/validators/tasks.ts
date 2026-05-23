import { z } from "zod"

export const taskSchema = z.object({
  title:          z.string().min(1, "Title is required").max(200),
  body:           z.string().optional(),
  status:         z.enum(["open", "in_progress", "done", "cancelled"]).default("open"),
  priority:       z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  due_date:       z.string().optional().nullable(),
  assignee_ids:   z.array(z.string().uuid()).default([]),
  grant_id:       z.string().uuid().optional().nullable(),
  stakeholder_id: z.string().uuid().optional().nullable(),
})

export const commentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty").max(5000),
})
