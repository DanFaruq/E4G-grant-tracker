"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <AlertTriangle className="size-10 text-destructive" />
      <div className="text-center max-w-sm">
        <p className="text-base font-semibold mb-1">Something went wrong</p>
        <p className="text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
      </div>
      <Button onClick={reset} variant="outline" size="sm">
        Try again
      </Button>
    </div>
  )
}
