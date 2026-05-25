import { render, screen } from '@testing-library/react'
import { ArchetypeBadge } from '@/components/stakeholders/archetype-badge'

describe('ArchetypeBadge', () => {
  it('renders the label for partnership', () => {
    render(<ArchetypeBadge archetype="partnership" />)
    expect(screen.getByText('Partnership')).toBeInTheDocument()
  })

  it('renders the label for funding', () => {
    render(<ArchetypeBadge archetype="funding" />)
    expect(screen.getByText('Funding')).toBeInTheDocument()
  })

  it('renders the label for technical_partner', () => {
    render(<ArchetypeBadge archetype="technical_partner" />)
    expect(screen.getByText('Technical Partner')).toBeInTheDocument()
  })

  it('renders the label for implementing_partner', () => {
    render(<ArchetypeBadge archetype="implementing_partner" />)
    expect(screen.getByText('Implementing Partner')).toBeInTheDocument()
  })

  it('renders the label for government_partner', () => {
    render(<ArchetypeBadge archetype="government_partner" />)
    expect(screen.getByText('Government Partner')).toBeInTheDocument()
  })

  it('applies sm size class when size="sm"', () => {
    const { container } = render(<ArchetypeBadge archetype="funding" size="sm" />)
    expect(container.firstChild).toHaveClass('text-xs')
  })
})
