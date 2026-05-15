"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"

type SidebarCtx = {
  // Works for mobile overlay AND desktop collapse — same state, same toggle
  open: boolean
  toggle: () => void
  close: () => void
}

const SidebarContext = createContext<SidebarCtx>({
  open: false,
  toggle: () => {},
  close: () => {},
})

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Start true (desktop default). useEffect corrects for mobile and localStorage.
  const [open, setOpen] = useState(true)

  useEffect(() => {
    const isMobile = window.innerWidth < 768
    if (isMobile) {
      setOpen(false)
    } else {
      // Restore desktop preference
      const saved = localStorage.getItem("sidebar-open")
      if (saved === "false") setOpen(false)
    }
  }, [])

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev
      if (window.innerWidth >= 768) {
        localStorage.setItem("sidebar-open", String(next))
      }
      return next
    })
  }, [])

  const close = useCallback(() => setOpen(false), [])

  return (
    <SidebarContext.Provider value={{ open, toggle, close }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  return useContext(SidebarContext)
}
