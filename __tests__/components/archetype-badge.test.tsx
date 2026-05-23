import { render, screen } from '@testing-library/react'
import { ArchetypeBadge } from '@/components/stakeholders/archetype-badge'

describe('ArchetypeBadge', () => {
  it('renders the label for government', () => {
    render(<ArchetypeBadge archetype="government" />)
    expect(screen.getByText('Government')).toBeInTheDocument()
  })

  it('renders the label for foundation', () => {
    render(<ArchetypeBadge archetype="foundation" />)
    expect(screen.getByText('Foundation')).toBeInTheDocument()
  })

  it('renders the label for corporate', () => {
    render(<ArchetypeBadge archetype="corporate" />)
    expect(screen.getByText('Corporate')).toBeInTheDocument()
  })

  it('renders the label for individual', () => {
    render(<ArchetypeBadge archetype="individual" />)
    expect(screen.getByText('Individual')).toBeInTheDocument()
  })

  it('renders the label for other', () => {
    render(<ArchetypeBadge archetype="other" />)
    expect(screen.getByText('Other')).toBeInTheDocument()
  })

  it('applies sm size class when size="sm"', () => {
    const { container } = render(<ArchetypeBadge archetype="foundation" size="sm" />)
    expect(container.firstChild).toHaveClass('text-xs')
  })
})
