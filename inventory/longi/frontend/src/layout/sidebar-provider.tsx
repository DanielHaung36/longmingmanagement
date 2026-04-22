"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface SidebarContextType {
  isCollapsed: boolean
  isMobile: boolean
  isOpen: boolean
  toggle: () => void
  collapse: () => void
  expand: () => void
  expandForNavigation: () => void
  setOpen: (open: boolean) => void
  navigateToFirstChild: (item: any) => void // 添加这个新方法
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) {
        setIsOpen(false)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved) {
      setIsCollapsed(JSON.parse(saved))
    }
  }, [])

  const toggle = () => {
    if (isMobile) {
      setIsOpen(!isOpen)
    } else {
      const newState = !isCollapsed
      setIsCollapsed(newState)
      localStorage.setItem("sidebar-collapsed", JSON.stringify(newState))
    }
  }

  const collapse = () => {
    if (!isMobile) {
      setIsCollapsed(true)
      localStorage.setItem("sidebar-collapsed", "true")
    }
  }

  const expand = () => {
    if (!isMobile) {
      setIsCollapsed(false)
      localStorage.setItem("sidebar-collapsed", "false")
    }
  }

  const expandForNavigation = () => {
    if (isCollapsed && !isMobile) {
      setIsCollapsed(false)
      localStorage.setItem("sidebar-collapsed", "false")
    }
  }

  const setOpen = (open: boolean) => {
    if (isMobile) {
      setIsOpen(open)
    }
  }

  const navigateToFirstChild = (item: any) => {
    const firstChild = item.children?.[0]
    if (firstChild?.href) {
      // Use Next.js router for better navigation
      window.location.href = firstChild.href
    }
  }

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        isMobile,
        isOpen,
        toggle,
        collapse,
        expand,
        expandForNavigation,
        setOpen,
        navigateToFirstChild, // 添加这个新方法
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}
