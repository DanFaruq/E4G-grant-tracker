"use client"

import { Menu } from "lucide-react"
import { useSidebar } from "./sidebar-context"

export function MobileMenuButton() {
  const { toggle } = useSidebar()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Open menu"
      className="md:hidden flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
    >
      <Menu className="size-5" />
    </button>
  )
}
