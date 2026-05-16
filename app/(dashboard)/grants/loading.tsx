import { Header } from "@/components/layout/header"

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />
}

export default function GrantsLoading() {
  return (
    <div className="flex flex-col min-h-full">
      <Header title="Grants" />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 flex-1 max-w-xs" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28 ml-auto" />
        </div>

        <div className="rounded-xl border bg-card divide-y overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-36" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
