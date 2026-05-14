export interface RawOpportunity {
  externalId: string
  title: string
  funder?: string
  description?: string
  amountText?: string
  deadlineText?: string
  deadline?: Date
  url: string
  rawData: unknown
}

export interface GrantSourceAdapter {
  readonly sourceKey: string
  fetch(config: Record<string, unknown>): Promise<RawOpportunity[]>
}
