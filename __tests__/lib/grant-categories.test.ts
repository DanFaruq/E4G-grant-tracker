import {
  UNCATEGORIZED,
  categoryLabel,
  categoryTone,
  computeGrantKpis,
  grantAmount,
  groupGrantsByCategory,
  type CategorizableGrant,
} from '@/lib/grant-categories'

const NOW = new Date('2026-10-09T12:00:00Z').getTime()

function grant(over: Partial<CategorizableGrant> & { id: string }): CategorizableGrant {
  return {
    stage: 'researching',
    category: null,
    deadline: null,
    amount_min: null,
    amount_max: null,
    amount_exact: null,
    ...over,
  }
}

describe('grantAmount', () => {
  it('prefers exact, then max, then min, else 0', () => {
    expect(grantAmount({ amount_exact: 5, amount_max: 9, amount_min: 1 })).toBe(5)
    expect(grantAmount({ amount_exact: null, amount_max: 9, amount_min: 1 })).toBe(9)
    expect(grantAmount({ amount_exact: null, amount_max: null, amount_min: 1 })).toBe(1)
    expect(grantAmount({ amount_exact: null, amount_max: null, amount_min: null })).toBe(0)
  })
})

describe('categoryLabel', () => {
  it('trims and falls back to Uncategorized', () => {
    expect(categoryLabel('  Health ')).toBe('Health')
    expect(categoryLabel('   ')).toBe(UNCATEGORIZED)
    expect(categoryLabel(null)).toBe(UNCATEGORIZED)
  })
})

describe('groupGrantsByCategory', () => {
  it('groups case-insensitively, sorts by size, puts Uncategorized last', () => {
    const groups = groupGrantsByCategory(
      [
        grant({ id: '1', category: 'Health', amount_exact: 100 }),
        grant({ id: '2', category: 'health', amount_exact: 50 }),
        grant({ id: '3', category: null }),
        grant({ id: '4', category: null }),
        grant({ id: '5', category: null }),
        grant({ id: '6', category: 'Education' }),
      ],
      NOW
    )
    expect(groups.map((g) => g.name)).toEqual(['Health', 'Education', UNCATEGORIZED])
    expect(groups[0].grants).toHaveLength(2)
    expect(groups[0].total).toBe(150)
  })

  it('tracks the earliest upcoming deadline of open grants only', () => {
    const groups = groupGrantsByCategory(
      [
        grant({ id: '1', category: 'Health', deadline: '2026-12-01T00:00:00Z' }),
        grant({ id: '2', category: 'Health', deadline: '2026-11-01T00:00:00Z' }),
        grant({ id: '3', category: 'Health', deadline: '2026-10-15T00:00:00Z', stage: 'awarded' }),
        grant({ id: '4', category: 'Health', deadline: '2026-01-01T00:00:00Z' }),
      ],
      NOW
    )
    expect(groups[0].nextDeadline).toBe('2026-11-01T00:00:00Z')
  })

  it('returns an empty list for no grants', () => {
    expect(groupGrantsByCategory([], NOW)).toEqual([])
  })
})

describe('computeGrantKpis', () => {
  it('splits open pipeline from awarded value and counts deadlines within 30 days', () => {
    const kpis = computeGrantKpis(
      [
        grant({ id: '1', amount_exact: 100, deadline: '2026-10-20T00:00:00Z' }),
        grant({ id: '2', amount_max: 200, deadline: '2026-12-31T00:00:00Z' }),
        grant({ id: '3', stage: 'awarded', amount_exact: 500, deadline: '2026-10-12T00:00:00Z' }),
        grant({ id: '4', stage: 'rejected', amount_exact: 999 }),
      ],
      NOW
    )
    expect(kpis).toEqual({ pipelineValue: 300, activeCount: 2, dueSoonCount: 1, awardedValue: 500 })
  })
})

describe('categoryTone', () => {
  it('is stable per name regardless of case, and neutral for Uncategorized', () => {
    expect(categoryTone('Health')).toBe(categoryTone('health'))
    expect(categoryTone(UNCATEGORIZED).chip).toContain('slate')
  })
})
