"use client"

import { useEffect, useState } from "react"
import { Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true)
      return
    }
    if (sessionStorage.getItem("pwa-install-dismissed")) {
      setDismissed(true)
      return
    }
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener("beforeinstallprompt", handler)
    window.addEventListener("appinstalled", () => setInstalled(true))
    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
    }
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") setInstalled(true)
    setDeferredPrompt(null)
  }

  function handleDismiss() {
    setDismissed(true)
    sessionStorage.setItem("pwa-install-dismissed", "1")
  }

  if (!deferredPrompt || dismissed || installed) return null

  return (
    <div className="mx-3 mt-3 flex items-center gap-2.5 rounded-lg border border-primary/25 bg-primary/8 px-3 py-2.5 md:mx-4">
      <div className="size-8 shrink-0 rounded-lg bg-primary/15 flex items-center justify-center">
        <Download className="size-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold leading-tight">Install E4G Grants</p>
        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">Add to home screen for quick access</p>
      </div>
      <Button size="sm" className="h-7 px-3 text-xs shrink-0" onClick={handleInstall}>
        Install
      </Button>
      <button
        onClick={handleDismiss}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
