import { render, screen } from '@testing-library/react'
import { StakeholderCard } from '@/components/stakeholders/stakeholder-card'
import type { Database } from '@/types/database'

type StakeholderRow = Database['public']['Tables']['stakeholders']['Row']

const base: StakeholderRow = {
  id: 'abc-123',
  name: 'Jane Smith',
  title: 'Program Director',
  email: 'jane@foundation.org',
  phone: '+1 555 0123',
  organization: 'Smith Foundation',
  notes: null,
  archetype: 'funding',
  organization_type: 'foundation',
  linkedin_url: null,
  created_by: null,
  created_at: '2026-05-01T00:00:00Z',
  updated_at: '2026-05-01T00:00:00Z',
}

describe('StakeholderCard', () => {
  it('renders the stakeholder name', () => {
    render(<StakeholderCard stakeholder={base} href="/stakeholders/abc-123" />)
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })

  it('renders the organization', () => {
    render(<StakeholderCard stakeholder={base} href="/stakeholders/abc-123" />)
    expect(screen.getByText('Smith Foundation')).toBeInTheDocument()
  })

  it('renders the archetype badge', () => {
    render(<StakeholderCard stakeholder={base} href="/stakeholders/abc-123" />)
    expect(screen.getByText('Funding')).toBeInTheDocument()
  })

  it('renders the email when present', () => {
    render(<StakeholderCard stakeholder={base} href="/stakeholders/abc-123" />)
    expect(screen.getByText('jane@foundation.org')).toBeInTheDocument()
  })

  it('does not render email when null', () => {
    render(
      <StakeholderCard
        stakeholder={{ ...base, email: null }}
        href="/stakeholders/abc-123"
      />
    )
    expect(screen.queryByText('jane@foundation.org')).not.toBeInTheDocument()
  })
})
