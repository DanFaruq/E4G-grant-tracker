"use client"

import { useState, useEffect } from "react"
import { Bell, BellOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { subscribeToPush, unsubscribeFromPush } from "@/lib/actions/notifications"
import { toast } from "sonner"

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function PushSubscribeButton() {
  const [state, setState] = useState<"loading" | "subscribed" | "unsubscribed" | "unsupported">("loading")
  const [endpoint, setEndpoint] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported")
      return
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        setState("subscribed")
        setEndpoint(sub.endpoint)
      } else {
        setState("unsubscribed")
      }
    })
  }, [])

  async function handleSubscribe() {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      const json = sub.toJSON()
      await subscribeToPush({
        endpoint: json.endpoint!,
        keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
      })
      setEndpoint(json.endpoint!)
      setState("subscribed")
      toast.success("Push notifications enabled")
    } catch {
      toast.error("Could not enable notifications — check browser permissions")
    } finally {
      setBusy(false)
    }
  }

  async function handleUnsubscribe() {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      await sub?.unsubscribe()
      if (endpoint) await unsubscribeFromPush(endpoint)
      setEndpoint(null)
      setState("unsubscribed")
      toast.success("Push notifications disabled")
    } catch {
      toast.error("Failed to unsubscribe")
    } finally {
      setBusy(false)
    }
  }

  if (state === "loading") return null
  if (state === "unsupported") return (
    <p className="text-sm text-muted-foreground">Push notifications are not supported in this browser.</p>
  )

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium">Push notifications</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {state === "subscribed"
            ? "You'll receive push alerts when assigned to tasks or events."
            : "Get notified on this device when you're assigned to a task or event."}
        </p>
      </div>
      <Button
        variant={state === "subscribed" ? "outline" : "default"}
        size="sm"
        className="shrink-0 gap-1.5"
        disabled={busy}
        onClick={state === "subscribed" ? handleUnsubscribe : handleSubscribe}
      >
        {busy
          ? <Loader2 className="size-3.5 animate-spin" />
          : state === "subscribed"
            ? <BellOff className="size-3.5" />
            : <Bell className="size-3.5" />
        }
        {state === "subscribed" ? "Disable" : "Enable"}
      </Button>
    </div>
  )
}
