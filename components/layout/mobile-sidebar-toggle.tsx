"use client"

import { Menu } from "lucide-react"
import { useSidebar } from "./sidebar-context"

export function MobileSidebarToggle() {
  const { toggle } = useSidebar()
  return (
    <button
      onClick={toggle}
      className="md:hidden -ml-1 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors shrink-0"
      aria-label="Toggle sidebar"
    >
      <Menu className="size-5" />
    </button>
  )
}
