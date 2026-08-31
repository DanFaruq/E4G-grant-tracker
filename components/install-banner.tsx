"use client"

import { useEffect, useState } from "react"
import { Download, X, MonitorSmartphone } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

type Mode = "hidden" | "native" | "manual" | "instructions" | "installed" | "ios-other-browser"

function isIos() {
  const ua = navigator.userAgent
  // iPadOS 13+ reports as desktop Safari; detect via touch + Mac platform.
  return /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
}

// "Add to Home Screen" only exists in iOS Safari — not Chrome/Firefox/in-app browsers on iOS.
function isIosSafari() {
  if (!isIos()) return false
  const ua = navigator.userAgent
  return !/crios|fxios|edgios|opt\//i.test(ua)
}

export function InstallBanner() {
  const [mode, setMode] = useState<Mode>("hidden")
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Already running as installed PWA (matchMedia covers Android/desktop,
    // navigator.standalone covers iOS Safari home-screen apps).
    if (window.matchMedia("(display-mode: standalone)").matches) return
    if ((navigator as Navigator & { standalone?: boolean }).standalone) return
    // User permanently dismissed
    if (localStorage.getItem("pwa-install-dismissed") === "1") return

    // iOS: no beforeinstallprompt event exists. Only Safari can Add to Home Screen —
    // show the manual instructions there, and a "use Safari" nudge in other iOS browsers
    // (Chrome/Firefox/Edge on iOS are all WebKit under the hood but Apple denies them
    // the install API, so there's nothing to prompt other than "open this in Safari").
    if (isIos()) {
      setMode(isIosSafari() ? "manual" : "ios-other-browser")
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setMode("native")
    }
    window.addEventListener("beforeinstallprompt", handler)
    window.addEventListener("appinstalled", () => setMode("installed"))

    // After 2s, if Chrome never fired the prompt, fall back to manual guide
    const timer = setTimeout(() => {
      setMode((prev) => (prev === "hidden" ? "manual" : prev))
    }, 2000)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
      clearTimeout(timer)
    }
  }, [])

  async function handleInstall() {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") setMode("installed")
      setDeferredPrompt(null)
    } else {
      setMode("instructions")
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable (e.g. no permission) — link stays visible in the address bar.
    }
  }

  function handleDismiss() {
    localStorage.setItem("pwa-install-dismissed", "1")
    setMode("installed") // hides banner
  }

  if (mode === "hidden" || mode === "installed") return null

  if (mode === "instructions") {
    const ios = isIos()
    return (
      <div className="mx-3 mt-3 rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold">How to install</p>
          <button onClick={() => setMode("manual")} className="text-muted-foreground hover:text-foreground mt-0.5">
            <X className="size-4" />
          </button>
        </div>
        {ios ? (
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Tap the <strong>Share</strong> button at the bottom of Safari</li>
            <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
            <li>Tap <strong>Add</strong> in the top-right corner</li>
          </ol>
        ) : (
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Tap the <strong>three-dot menu ⋮</strong> in Chrome</li>
            <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong></li>
            <li>Tap <strong>Install</strong> to confirm</li>
          </ol>
        )}
      </div>
    )
  }

  return (
    <div className="mx-3 mt-3 flex items-center gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 md:mx-4">
      <div className="size-8 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
        {mode === "native"
          ? <Download className="size-4 text-primary" />
          : <MonitorSmartphone className="size-4 text-primary" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold leading-tight">Install E4G Team</p>
        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
          {mode === "native"
            ? "Add to home screen for quick access"
            : mode === "ios-other-browser"
              ? "Only Safari can install on iOS — copy this link and open it there"
              : "Tap to see how to install"}
        </p>
      </div>
      {mode === "ios-other-browser" ? (
        <Button size="sm" variant="outline" className="h-7 px-3 text-xs shrink-0" onClick={handleCopyLink}>
          {copied ? "Copied!" : "Copy Link"}
        </Button>
      ) : (
        <Button size="sm" className="h-7 px-3 text-xs shrink-0" onClick={handleInstall}>
          Install
        </Button>
      )}
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
