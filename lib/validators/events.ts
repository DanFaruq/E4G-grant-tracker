import { z } from "zod"

export const eventSchema = z.object({
  title:          z.string().min(1, "Title is required").max(200),
  description:    z.string().optional(),
  event_type:     z.enum(["meeting", "deadline", "review", "call", "workshop", "other"]).default("meeting"),
  start_at:       z.string().min(1, "Start date/time is required"),
  end_at:         z.string().optional().nullable(),
  all_day:        z.boolean().default(false),
  recurrence:     z.enum(["none", "daily", "weekly", "monthly"]).default("none"),
  recurrence_end: z.string().optional().nullable(),
  attendee_ids:   z.array(z.string().uuid()).default([]),
  grant_id:       z.string().uuid().optional().nullable(),
  stakeholder_id: z.string().uuid().optional().nullable(),
})
