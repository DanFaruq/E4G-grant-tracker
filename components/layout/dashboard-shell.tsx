import { TopNavbar } from "./top-navbar"
import { MobileTabBar } from "./mobile-tab-bar"
import { Sidebar } from "./sidebar"
import { SidebarProvider } from "./sidebar-context"
import type { UserRole } from "@/types/database"

type Props = {
  children: React.ReactNode
  userName?: string | null
  userEmail?: string | null
  userRole?: UserRole | null
  unreadCount?: number
}

export function DashboardShell({ children, userName, userEmail, userRole, unreadCount = 0 }: Props) {
  return (
    <SidebarProvider>
      <div className="flex flex-col h-dvh overflow-hidden bg-background">
        <TopNavbar
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          unreadCount={unreadCount}
        />
        {/* Mobile sidebar drawer — hidden on desktop */}
        <Sidebar userName={userName} userRole={userRole} unreadCount={unreadCount} />
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
          {children}
        </div>
        <MobileTabBar />
      </div>
    </SidebarProvider>
  )
}
