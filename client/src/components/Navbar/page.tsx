'use client'
import { useAppDispatch, useAppSelector } from '@/redux'
import { setIsDarkMode, setIsSidebarCollapsed } from '@/state'
import { logout } from '@/state/authSlice'
import { Search, Settings, Menu, Sun, Moon, Bell, LogOut, User, ChevronDown, LayoutGrid } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { api, useGetUnreadCountQuery } from '@/state/api'
import NotificationDropdown from './NotificationDropdown'
import { GlobalSearch } from '@/components/GlobalSearch'
import { useEffect, useRef } from 'react'

type Props = {
  children?: React.ReactNode
}

const Navbar = ({}: Props) => {
  const dispatch = useAppDispatch()

  const isSidebarCollapsed = useAppSelector((state) => state.global.isSidebarCollapsed)
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode)
  const currentUser = useAppSelector((state) => state.auth.user)
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  // Refs for click outside detection
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Current user ID
  const currentUserId = currentUser?.id || 11 // Fallback to dev mode user
  useEffect(() => {
    console.debug("[Navbar] current user", {
      id: currentUser?.id,
      username: currentUser?.username,
      fallbackUsed: !currentUser,
    })
  }, [currentUser])
  const { data: unreadCountData } = useGetUnreadCountQuery(currentUserId)
  const unreadBadgeCount = unreadCountData?.data?.count ?? 0

  /**
   * Handle logout
   */
  const handleLogout = () => {
    // Clear local storage
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    sessionStorage.clear()

    // Clear Redux state
    dispatch(logout())
    dispatch(api.util.resetApiState())

    // Redirect to backend SSO logout (clears cookie + redirects to Keycloak logout)
    window.location.href = '/api/auth/sso/logout'
  }

  return (
    <>
      <div className="flex items-center justify-between bg-white px-4 py-3 dark:bg-black dark:px-4 dark:py-3">
        {/* Search Bar */}
        <div className="flex items-center gap-8">
          {!isSidebarCollapsed ? null : (
            <button onClick={() => dispatch(setIsSidebarCollapsed(!isSidebarCollapsed))}>
              <Menu className="h-8 w-8 cursor-pointer dark:text-white"></Menu>
            </button>
          )}

          {/* Global Search Trigger */}
          <button
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <Search className="h-4 w-4" />
            <span className="hidden md:inline">Search...</span>
            <kbd className="ml-auto hidden rounded border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-600 md:inline-block dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
              ⌘K
            </kbd>
          </button>
        </div>
      <div className="flex items-center gap-2">
        {/* Portal / Workspace link */}
        <a
          href="https://portal.easytool.page"
          className={`flex items-center gap-1.5 rounded p-2 text-sm font-medium transition-colors ${
            isDarkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-blue-400' : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'
          }`}
        >
          <LayoutGrid className="h-5 w-5" />
          <span className="hidden md:inline">Workspace</span>
        </a>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={
              isDarkMode ? `rounded p-2 dark:hover:bg-gray-700` : `rounded p-2 hover:bg-gray-100`
            }
          >
            <Bell className="h-6 w-6 cursor-pointer dark:text-white" />
            {unreadBadgeCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {unreadBadgeCount > 9 ? '9+' : unreadBadgeCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <NotificationDropdown
              userId={currentUserId}
              onClose={() => setShowNotifications(false)}
            />
          )}
        </div>

        <button
          onClick={() => dispatch(setIsDarkMode(!isDarkMode))}
          className={
            isDarkMode ? `rounded p-2 dark:hover:bg-gray-700` : `rounded p-2 hover:bg-gray-100`
          }
        >
          {isDarkMode ? (
            <Sun className="h-6 w-6 cursor-pointer dark:text-white" />
          ) : (
            <Moon className="h-6 w-6 cursor-pointer dark:text-white" />
          )}
        </button>
        <Link
          href="/settings"
          className={
            isDarkMode ? `rounded p-2 dark:hover:bg-gray-700` : `rounded p-2 hover:bg-gray-100`
          }
        >
          <Settings className="h-6 w-6 cursor-pointer dark:text-white"></Settings>
        </Link>

        {/* Divider */}
        <div className="m-h-[2em] mr-3 ml-2 hidden w-[0.1rem] bg-gray-200 md:inline-block"></div>

        {/* User Menu */}
        {isAuthenticated && currentUser ? (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 rounded px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {/* Avatar */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-sm font-semibold text-white">
                {currentUser.realName ? currentUser.realName.charAt(0).toUpperCase() : currentUser.username.charAt(0).toUpperCase()}
              </div>
              {/* Username */}
              <span className="hidden text-sm font-medium dark:text-white md:inline-block">
                {currentUser.realName || currentUser.username}
              </span>
              <ChevronDown className="h-4 w-4 dark:text-white" />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute top-full right-0 z-50 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-semibold dark:text-white">
                    {currentUser.realName || currentUser.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser.email}</p>
                </div>

                <div className="py-1">
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </div>

                <div className="border-t border-gray-200 py-1 dark:border-gray-700">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600">
            Login
          </Link>
        )}
      </div>
    </div>

      {/* Global Search Dialog */}
      <GlobalSearch open={showSearch} onOpenChange={setShowSearch} />
    </>
  )
}

export default Navbar
