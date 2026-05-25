import {
  stakeholderSchema,
  activitySchema,
  type StakeholderFormValues,
  type ActivityFormValues,
} from '@/lib/validators/stakeholders'

describe('stakeholderSchema', () => {
  it('accepts a valid full stakeholder', () => {
    const input: StakeholderFormValues = {
      name: 'Jane Smith',
      title: 'Program Director',
      email: 'jane@foundation.org',
      phone: '+1 555 0123',
      organization: 'Smith Foundation',
      archetype: 'funding',
      organization_type: 'foundation',
      linkedin_url: 'https://linkedin.com/in/janesmith',
      notes: 'Met at conference',
    }
    expect(() => stakeholderSchema.parse(input)).not.toThrow()
  })

  it('accepts a minimal stakeholder (name only)', () => {
    expect(() =>
      stakeholderSchema.parse({ name: 'Bob', archetype: 'partnership' })
    ).not.toThrow()
  })

  it('rejects when name is empty', () => {
    const result = stakeholderSchema.safeParse({ name: '', archetype: 'partnership' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('name')
    }
  })

  it('rejects an invalid email', () => {
    const result = stakeholderSchema.safeParse({
      name: 'Test',
      archetype: 'technical_partner',
      email: 'not-an-email',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('email')
    }
  })

  it('accepts an empty string email (optional field)', () => {
    expect(() =>
      stakeholderSchema.parse({ name: 'Test', archetype: 'government_partner', email: '' })
    ).not.toThrow()
  })

  it('rejects an invalid linkedin_url', () => {
    const result = stakeholderSchema.safeParse({
      name: 'Test',
      archetype: 'implementing_partner',
      linkedin_url: 'not-a-url',
    })
    expect(result.success).toBe(false)
  })

  it('accepts an empty string linkedin_url', () => {
    expect(() =>
      stakeholderSchema.parse({ name: 'Test', archetype: 'funding', linkedin_url: '' })
    ).not.toThrow()
  })

  it('rejects an invalid archetype', () => {
    const result = stakeholderSchema.safeParse({ name: 'Test', archetype: 'alien' })
    expect(result.success).toBe(false)
  })
})

describe('activitySchema', () => {
  it('accepts a valid activity', () => {
    const input: ActivityFormValues = {
      activity_type: 'meeting',
      notes: 'Discussed Q3 grant cycle',
      occurred_at: '2026-05-23T10:00:00Z',
    }
    expect(() => activitySchema.parse(input)).not.toThrow()
  })

  it('rejects when notes is empty', () => {
    const result = activitySchema.safeParse({ activity_type: 'call', notes: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('notes')
    }
  })

  it('rejects an invalid activity_type', () => {
    const result = activitySchema.safeParse({ activity_type: 'text', notes: 'hi' })
    expect(result.success).toBe(false)
  })

  it('defaults occurred_at to a valid ISO string when omitted', () => {
    const result = activitySchema.safeParse({ activity_type: 'email', notes: 'Sent intro' })
    expect(result.success).toBe(true)
  })
})
