import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router"

import AppSidebar from "@/components/Sidebar/AppSidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { isLoggedIn } from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout")({
  component: Layout,
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/login",
      })
    }
  },
})

function Layout() {
  const router = useRouterState()
  const path = router.location.pathname
  const isFullScreen = path === "/games/new" || path.endsWith("/quiz")

  if (isFullScreen) {
    return (
      <main className="min-h-svh bg-background">
        <Outlet />
      </main>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background min-h-svh">
        <main className="flex-1 px-10 py-8">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default Layout
