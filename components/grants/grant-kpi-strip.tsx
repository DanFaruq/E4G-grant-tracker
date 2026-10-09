import { cn } from "@/lib/utils"
import type { GrantKpis } from "@/lib/grant-categories"

function compactCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount)
}

export function GrantKpiStrip({ kpis }: { kpis: GrantKpis }) {
  const items = [
    { label: "Open pipeline", value: compactCurrency(kpis.pipelineValue), accent: false },
    { label: "Active grants", value: String(kpis.activeCount), accent: false },
    { label: "Due in 30 days", value: String(kpis.dueSoonCount), accent: kpis.dueSoonCount > 0 },
    { label: "Awarded", value: compactCurrency(kpis.awardedValue), accent: false },
  ]

  return (
    <dl
      className="grid grid-cols-2 overflow-hidden rounded-xl text-white sm:grid-cols-4"
      style={{ backgroundColor: "oklch(0.225 0.09 243)" }}
    >
      {items.map((item) => (
        <div key={item.label} className="border-white/10 px-4 py-3 odd:border-r sm:border-r sm:last:border-r-0 [&:nth-child(-n+2)]:border-b sm:[&:nth-child(-n+2)]:border-b-0">
          <dt className="text-xs text-white/70">{item.label}</dt>
          <dd className={cn("mt-1 text-2xl font-bold tracking-tight", item.accent && "text-orange-300")}>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
