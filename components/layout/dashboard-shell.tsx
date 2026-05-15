"use client"

import { SidebarProvider, useSidebar } from "./sidebar-context"
import { Sidebar } from "./sidebar"
import { MobileTabBar } from "./mobile-tab-bar"
import type { UserRole } from "@/types/database"

type Props = {
  children: React.ReactNode
  userName?: string | null
  userRole?: UserRole | null
  unreadCount?: number
}

function ShellInner({ children, userName, userRole, unreadCount = 0 }: Props) {
  const { open, close } = useSidebar()
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile-only backdrop — desktop collapse has no overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={close}
        />
      )}
      <Sidebar userName={userName} userRole={userRole} unreadCount={unreadCount} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {children}
      </div>
      <MobileTabBar unreadCount={unreadCount} />
    </div>
  )
}

export function DashboardShell(props: Props) {
  return (
    <SidebarProvider>
      <ShellInner {...props} />
    </SidebarProvider>
  )
}
