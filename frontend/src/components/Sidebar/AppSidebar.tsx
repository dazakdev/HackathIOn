import { Home, Plus, Trophy, Users } from "lucide-react"

import { Logo } from "@/components/Common/Logo"
import { Sidebar, SidebarContent, SidebarHeader } from "@/components/ui/sidebar"
import useAuth from "@/hooks/useAuth"
import { type Item, Main } from "./Main"

const baseItems: Item[] = [
  { icon: Home, title: "Panel główny", path: "/" },
  { icon: Plus, title: "Rozpocznij nową przygodę", path: "/games/new" },
  { icon: Trophy, title: "Ranking", path: "/leaderboard" },
]

export function AppSidebar() {
  const { user: currentUser } = useAuth()

  const items = currentUser?.is_superuser
    ? [...baseItems, { icon: Users, title: "Admin", path: "/admin" }]
    : baseItems

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/60">
      <SidebarHeader className="px-6 py-6 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center">
        <div className="flex flex-col gap-2">
          <Logo variant="responsive" />
          <p className="text-xs text-muted-foreground font-medium tracking-wide">
            Stocz swoją walkę
          </p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <Main items={items} />
      </SidebarContent>
    </Sidebar>
  )
}

export default AppSidebar
