import { Header } from "@/components/layout/header"

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />
}

export default function DashboardLoading() {
  return (
    <div className="flex flex-col min-h-full">
      <Header title="Dashboard" />
      <div className="flex-1 p-6 space-y-7 max-w-5xl">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>

        <div>
          <Skeleton className="h-3 w-16 mb-3" />
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-1.5 w-full mt-3 rounded-full" />
        </div>

        <div>
          <Skeleton className="h-3 w-48 mb-3" />
          <div className="rounded-xl border bg-card divide-y overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
