import fs from 'node:fs'
import path from 'node:path'
import {
  JOB_LEVELS,
  canViewTask,
  isTaskPrivileged,
  levelAtLeast,
  visibilityLabel,
  type TaskAccessFields,
  type Viewer,
} from '@/lib/job-levels'

const task = (over: Partial<TaskAccessFields> = {}): TaskAccessFields => ({
  created_by: 'creator',
  visibility: 'team',
  min_level: null,
  allowed_levels: [],
  allowed_profile_ids: [],
  ...over,
})
const viewer = (over: Partial<Viewer> = {}): Viewer => ({ id: 'me', role: 'team_member', job_level: 'intern', ...over })

describe('ladder order matches the database enum', () => {
  it('lists levels in the same order as the job_level enum in migration 0008', () => {
    const sql = fs.readFileSync(path.join(__dirname, '../../supabase/migrations/0008_task_visibility.sql'), 'utf8')
    const body = sql.match(/CREATE TYPE job_level AS ENUM \(([\s\S]*?)\);/)![1]
    const sqlLevels = [...body.matchAll(/'([a-z_0-9]+)'/g)].map((m) => m[1])
    expect(JOB_LEVELS.map((l) => l.value)).toEqual(sqlLevels)
  })
})

describe('levelAtLeast', () => {
  it('compares seniority and rejects a missing level', () => {
    expect(levelAtLeast('associate', 'associate')).toBe(true)
    expect(levelAtLeast('senior_associate_2', 'associate')).toBe(true)
    expect(levelAtLeast('senior_analyst_2', 'associate')).toBe(false)
    expect(levelAtLeast(null, 'intern')).toBe(false)
  })
})

describe('isTaskPrivileged', () => {
  it('is true for admins and directors only', () => {
    expect(isTaskPrivileged({ role: 'admin', job_level: null })).toBe(true)
    expect(isTaskPrivileged({ role: 'team_member', job_level: 'director' })).toBe(true)
    expect(isTaskPrivileged({ role: 'team_member', job_level: 'senior_associate_2' })).toBe(false)
  })
})

describe('canViewTask', () => {
  it('team tasks are visible to everyone', () => {
    expect(canViewTask(viewer(), task(), [])).toBe(true)
  })

  it('directors-only tasks hide from everyone except directors, admins, creator and assignees', () => {
    const t = task({ visibility: 'directors' })
    expect(canViewTask(viewer({ job_level: 'senior_associate_2' }), t, [])).toBe(false)
    expect(canViewTask(viewer({ job_level: 'director' }), t, [])).toBe(true)
    expect(canViewTask(viewer({ role: 'admin', job_level: null }), t, [])).toBe(true)
    expect(canViewTask(viewer({ id: 'creator' }), t, [])).toBe(true)
    expect(canViewTask(viewer(), t, ['me'])).toBe(true)
  })

  it('min_level tasks need that level or higher', () => {
    const t = task({ visibility: 'min_level', min_level: 'associate' })
    expect(canViewTask(viewer({ job_level: 'senior_analyst_2' }), t, [])).toBe(false)
    expect(canViewTask(viewer({ job_level: 'associate' }), t, [])).toBe(true)
    expect(canViewTask(viewer({ job_level: null }), t, [])).toBe(false)
  })

  it('custom tasks match listed levels or people', () => {
    const t = task({ visibility: 'custom', allowed_levels: ['intern'], allowed_profile_ids: ['pat'] })
    expect(canViewTask(viewer({ job_level: 'intern' }), t, [])).toBe(true)
    expect(canViewTask(viewer({ id: 'pat', job_level: 'associate' }), t, [])).toBe(true)
    expect(canViewTask(viewer({ job_level: 'associate' }), t, [])).toBe(false)
  })
})

describe('visibilityLabel', () => {
  it('describes each mode', () => {
    expect(visibilityLabel(task())).toBe('Whole team')
    expect(visibilityLabel(task({ visibility: 'directors' }))).toBe('Directors only')
    expect(visibilityLabel(task({ visibility: 'min_level', min_level: 'associate' }))).toBe('Associate and above')
    expect(visibilityLabel(task({ visibility: 'custom', allowed_levels: ['intern', 'associate'], allowed_profile_ids: ['a'] }))).toBe('Intern, Associate + 1 person')
    expect(visibilityLabel(task({ visibility: 'custom' }))).toBe('Only people on the task')
  })
})
