"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { useSidebar } from "./sidebar-provider"
import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { Outlet } from "react-router-dom"
import { Toaster } from "@/components/ui/toaster"
interface AppLayoutProps {
  children?: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isCollapsed, isMobile } = useSidebar()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex flex-1 h-[calc(100vh-4rem)]">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside
            className={cn(
              "border-r bg-white transition-all duration-300 ease-in-out flex-shrink-0",
              isCollapsed ? "w-16" : "w-72",
            )}
          >
            <Sidebar />
          </aside>
        )}

        {/* Main Content */}
        <main className="flex flex-1 overflow-hidden  bg-gray-50">
          <div className="h-full overflow-auto w-full">
            <div className="p-6 h-full"><Outlet/></div>
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  )
}
