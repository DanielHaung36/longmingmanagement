"use client"

import React, { useEffect, useRef } from "react"
import {
  useGetUserNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useClearReadNotificationsMutation,
} from "@/state/api"
import type { Notification } from "@/state/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCheck, Trash2, Bell, AtSign, MessageSquare, FileText, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface NotificationDropdownProps {
  userId: number
  onClose: () => void
}

export default function NotificationDropdown({ userId, onClose }: NotificationDropdownProps) {
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: notificationsData, isLoading, refetch } = useGetUserNotificationsQuery({ userId })
  const [markAsRead] = useMarkNotificationAsReadMutation()
  const [markAllAsRead] = useMarkAllNotificationsAsReadMutation()
  const [clearRead] = useClearReadNotificationsMutation()

  const notifications = notificationsData?.data || []
  const unreadCount = notifications.filter((n) => !n.isRead).length

  useEffect(() => {
    console.debug("[NotificationDropdown] active userId", userId, {
      notificationCount: notifications.length,
      response: notificationsData,
    })
  }, [userId, notifications.length, notificationsData])

  // Refetch notifications when dropdown opens
  useEffect(() => {
    refetch()
  }, [refetch])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      try {
        await markAsRead(notification.id).unwrap()
      } catch (error) {
        console.error("Failed to mark notification as read:", error)
      }
    }

    // Navigate to entity if applicable
    const targetType = notification.relatedType || notification.metadata?.entityType
    const targetId = notification.relatedId || notification.metadata?.entityId

    if (targetType && targetId) {
      let path: string | null = null

      switch (targetType) {
        case "project":
          path = `/projects/${targetId}`
          break
        case "task":
          path = `/tasks/${targetId}`
          break
        default:
          path = `/${targetType}s/${targetId}`
      }

      if (path) {
        router.push(path)
        onClose()
      }
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead(userId).unwrap()
    } catch (error) {
      console.error("Failed to mark all as read:", error)
    }
  }

  const handleClearRead = async () => {
    try {
      await clearRead(userId).unwrap()
    } catch (error) {
      console.error("Failed to clear read notifications:", error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "COMMENT_MENTION":
      case "CHAT_MENTION":
      case "MENTION":
        return <AtSign className="h-4 w-4 text-blue-500" />
      case "COMMENT_REPLY":
      case "COMMENT":
        return <MessageSquare className="h-4 w-4 text-green-500" />
      case "APPROVAL_PENDING":
      case "APPROVAL_APPROVED":
      case "APPROVAL_REJECTED":
      case "APPROVAL":
        return <FileText className="h-4 w-4 text-purple-500" />
      case "PROJECT_STATUS_CHANGE":
      case "TASK_STATUS_CHANGE":
      case "STATUS_CHANGE":
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case "PROJECT_CREATED":
      case "TASK_ASSIGNED":
      case "TASK_DEADLINE":
      case "TASK_OVERDUE":
        return <Bell className="h-4 w-4 text-amber-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return d.toLocaleDateString("en-AU", { month: "short", day: "numeric" })
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full mt-2 w-[95vw] sm:w-96 max-w-md max-h-[600px] overflow-hidden rounded-lg border bg-white shadow-xl z-50 dark:bg-gray-800 dark:border-gray-700 left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0"
    >
      <Card className="border-none shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="rounded-full px-2 py-0">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="h-7 px-2 text-xs"
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
              {notifications.some((n) => n.isRead) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearRead}
                  className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="p-0 max-h-[500px] overflow-y-auto">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-gray-500">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              No notifications yet
            </div>
          ) : (
            <div className="divide-y dark:divide-gray-700">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                    !notification.isRead && "bg-blue-50 dark:bg-blue-900/20"
                  )}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-sm",
                            !notification.isRead ? "font-semibold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
                          )}
                        >
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <div className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-500 mt-1.5"></div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {notification.content}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
