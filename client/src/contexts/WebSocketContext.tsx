'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { websocketService } from '@/services/websocket'
import type {
  CommentNotification,
  TaskStatusChange,
  UploadProgress,
  FileDeleted,
} from '@/services/websocket'
import { useAppSelector } from '@/redux'
import { message } from '@/lib/message'

interface WebSocketContextType {
  isConnected: boolean
  joinTaskRoom: (taskId: number) => void
  leaveTaskRoom: (taskId: number) => void
  joinProjectRoom: (projectId: number) => void
  leaveProjectRoom: (projectId: number) => void
  on: <T = any>(event: string, callback: (data: T) => void) => void
  off: <T = any>(event: string, callback: (data: T) => void) => void
}

const WebSocketContext = createContext<WebSocketContextType | null>(null)

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const currentUser = useAppSelector((state) => state.auth.user)
  const [connectionAttempted, setConnectionAttempted] = useState(false)

  // 连接WebSocket
  useEffect(() => {
    if (!currentUser?.id) {
      console.log('[WebSocketProvider] No user, skipping connection')
      return
    }

    // 避免重复连接（处理 React Strict Mode 双重挂载）
    if (connectionAttempted && websocketService.isConnected()) {
      console.log('[WebSocketProvider] Already connected, reusing connection')
      setIsConnected(true)
      return
    }

    console.log('[WebSocketProvider] Connecting WebSocket for user:', currentUser.id)
    setConnectionAttempted(true)

    // 如果已经有连接但未认证，先断开
    if (websocketService.isConnected()) {
      console.log('[WebSocketProvider] Disconnecting existing connection before reconnecting')
      websocketService.disconnect()
    }

    websocketService.connect(currentUser.id)

    // 监听连接状态
    const handleAuthenticated = () => {
      console.log('[WebSocketProvider] ✅ Authenticated successfully')
      setIsConnected(true)
    }

    const handleDisconnected = () => {
      console.log('[WebSocketProvider] ⚠️ Disconnected')
      setIsConnected(false)
    }

    const handleReconnected = () => {
      console.log('[WebSocketProvider] 🔄 Reconnected')
      setIsConnected(true)
      message.success('实时连接已恢复')
    }

    const handleConnectionFailed = () => {
      console.log('[WebSocketProvider] ❌ Connection failed')
      setIsConnected(false)
      // 只在真正失败时显示错误，不在开发模式重新挂载时显示
      // message.error('实时连接失败，部分功能可能受限')
    }

    websocketService.on('authenticated', handleAuthenticated)
    websocketService.on('disconnected', handleDisconnected)
    websocketService.on('reconnected', handleReconnected)
    websocketService.on('connection_failed', handleConnectionFailed)

    return () => {
      console.log('[WebSocketProvider] Cleanup: Removing event listeners')
      websocketService.off('authenticated', handleAuthenticated)
      websocketService.off('disconnected', handleDisconnected)
      websocketService.off('reconnected', handleReconnected)
      websocketService.off('connection_failed', handleConnectionFailed)
      // 不在这里 disconnect，让连接保持活跃以处理 Strict Mode 重新挂载
      // websocketService.disconnect()
    }
  }, [currentUser?.id, connectionAttempted])

  // 全局通知处理
  useEffect(() => {
    if (!isConnected) return

    // @提及通知
    const handleMention = (data: CommentNotification) => {
      const authorName = data.author.realName || data.author.username || 'Someone'
      const entityName = data.entityType === 'task' ? 'Task' : 'Project'

      message.info({
        content: `${authorName} mentioned you in a ${entityName}`,
        duration: 5,
      })
    }

    // Task状态变更通知
    const handleTaskStatusChange = (data: TaskStatusChange) => {
      // 可以选择性地显示通知，避免过多干扰
      console.log('[WebSocket] Task status changed:', data)
    }

    websocketService.on<CommentNotification>('comment:mention', handleMention)
    websocketService.on<TaskStatusChange>('task:status:change', handleTaskStatusChange)

    return () => {
      websocketService.off<CommentNotification>('comment:mention', handleMention)
      websocketService.off<TaskStatusChange>('task:status:change', handleTaskStatusChange)
    }
  }, [isConnected])

  const joinTaskRoom = useCallback((taskId: number) => {
    websocketService.joinTaskRoom(taskId)
  }, [])

  const leaveTaskRoom = useCallback((taskId: number) => {
    websocketService.leaveTaskRoom(taskId)
  }, [])

  const joinProjectRoom = useCallback((projectId: number) => {
    websocketService.joinProjectRoom(projectId)
  }, [])

  const leaveProjectRoom = useCallback((projectId: number) => {
    websocketService.leaveProjectRoom(projectId)
  }, [])

  const on = useCallback(<T = any,>(event: string, callback: (data: T) => void) => {
    websocketService.on<T>(event, callback)
  }, [])

  const off = useCallback(<T = any,>(event: string, callback: (data: T) => void) => {
    websocketService.off<T>(event, callback)
  }, [])

  const value: WebSocketContextType = {
    isConnected,
    joinTaskRoom,
    leaveTaskRoom,
    joinProjectRoom,
    leaveProjectRoom,
    on,
    off,
  }

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>
}

// Hook to use WebSocket context
export function useWebSocketContext() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider')
  }
  return context
}
