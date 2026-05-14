import { Header } from "@/components/layout/header"

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />
}

export default function OpportunitiesLoading() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Opportunities" />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 flex-1 max-w-sm" />
          <Skeleton className="h-9 w-28" />
        </div>

        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-72" />
                  <Skeleton className="h-3 w-44" />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Skeleton className="h-7 w-14 rounded-full" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
