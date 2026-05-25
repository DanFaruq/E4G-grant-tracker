"use client"

import { useEffect, useState } from "react"
import { Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PWAInstallBanner() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Don't show if already running as installed PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return

    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  if (!installPrompt || dismissed) return null

  async function handleInstall() {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === "accepted" || outcome === "dismissed") {
      setInstallPrompt(null)
      setDismissed(true)
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 mx-4 md:mx-6 mt-4 bg-primary/10 border border-primary/20 rounded-xl text-sm">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/20">
        <Download className="size-4 text-primary" />
      </div>
      <p className="flex-1 text-foreground font-medium leading-snug">
        Install E4G Team for quick access
      </p>
      <Button size="sm" onClick={handleInstall} className="shrink-0 h-7 text-xs px-3">
        Install
      </Button>
      <button
        onClick={() => setDismissed(true)}
        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
