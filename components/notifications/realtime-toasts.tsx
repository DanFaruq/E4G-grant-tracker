"use client"

import { useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function RealtimeToasts({ userId }: { userId: string }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const n = payload.new as {
            title: string
            body: string | null
            link: string | null
          }
          toast(n.title, {
            description: n.body ?? undefined,
            action: n.link
              ? {
                  label: "View",
                  onClick: () => router.push(n.link!),
                }
              : undefined,
          })
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, router])

  return null
}
