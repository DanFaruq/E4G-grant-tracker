import { z } from 'zod'

export const STAKEHOLDER_ARCHETYPES = [
  'partnership', 'funding', 'technical_partner', 'implementing_partner', 'government_partner',
] as const

export const ORGANIZATION_TYPES = [
  'government', 'foundation', 'corporate', 'individual', 'other',
] as const

export const ACTIVITY_TYPES = [
  'meeting', 'email', 'call', 'follow_up', 'note',
] as const

export const stakeholderSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  title: z.string().max(100).optional(),
  email: z
    .string()
    .refine((v) => v === '' || z.string().email().safeParse(v).success, {
      message: 'Must be a valid email address',
      path: ['email'],
    })
    .optional(),
  phone: z.string().max(30).optional(),
  organization: z.string().max(150).optional(),
  archetype: z.enum(STAKEHOLDER_ARCHETYPES),
  organization_type: z.enum(ORGANIZATION_TYPES),
  linkedin_url: z
    .string()
    .refine((v) => v === '' || z.string().url().safeParse(v).success, {
      message: 'Must be a valid URL',
      path: ['linkedin_url'],
    })
    .optional(),
  notes: z.string().optional(),
})

export const activitySchema = z.object({
  activity_type: z.enum(ACTIVITY_TYPES),
  notes: z.string().min(1, 'Notes are required'),
  occurred_at: z.string().optional(),
})

export type StakeholderFormValues = z.infer<typeof stakeholderSchema>
export type ActivityFormValues = z.infer<typeof activitySchema>
