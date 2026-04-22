import { useEffect, useCallback } from 'react'
import { useWebSocketContext } from '@/contexts/WebSocketContext'
import type {
  CommentNotification,
  TaskStatusChange,
  UploadProgress,
  FileDeleted,
} from '@/services/websocket'

/**
 * Hook for Task-specific WebSocket events
 */
export function useTaskWebSocket(taskId: number | undefined) {
  const ws = useWebSocketContext()

  // 加入/离开Task房间
  useEffect(() => {
    if (!taskId || !ws.isConnected) return

    ws.joinTaskRoom(taskId)
    console.log('[useTaskWebSocket] Joined task room:', taskId)

    return () => {
      ws.leaveTaskRoom(taskId)
      console.log('[useTaskWebSocket] Left task room:', taskId)
    }
  }, [taskId, ws.isConnected, ws])

  // 监听新评论
  const onNewComment = useCallback(
    (callback: (data: CommentNotification) => void) => {
      ws.on<CommentNotification>('comment:new', callback)
      return () => ws.off<CommentNotification>('comment:new', callback)
    },
    [ws]
  )

  // 监听Task状态变更
  const onTaskStatusChange = useCallback(
    (callback: (data: TaskStatusChange) => void) => {
      ws.on<TaskStatusChange>('task:status:change', callback)
      return () => ws.off<TaskStatusChange>('task:status:change', callback)
    },
    [ws]
  )

  // 监听文件上传
  const onFileUpload = useCallback(
    (callback: (data: any) => void) => {
      ws.on('task:file:upload', callback)
      return () => ws.off('task:file:upload', callback)
    },
    [ws]
  )

  // 监听文件删除
  const onFileDeleted = useCallback(
    (callback: (data: FileDeleted) => void) => {
      ws.on<FileDeleted>('task:file:deleted', callback)
      return () => ws.off<FileDeleted>('task:file:deleted', callback)
    },
    [ws]
  )

  return {
    isConnected: ws.isConnected,
    onNewComment,
    onTaskStatusChange,
    onFileUpload,
    onFileDeleted,
  }
}

/**
 * Hook for Project-specific WebSocket events
 */
export function useProjectWebSocket(projectId: number | undefined) {
  const ws = useWebSocketContext()

  // 加入/离开Project房间
  useEffect(() => {
    if (!projectId || !ws.isConnected) return

    ws.joinProjectRoom(projectId)
    console.log('[useProjectWebSocket] Joined project room:', projectId)

    return () => {
      ws.leaveProjectRoom(projectId)
      console.log('[useProjectWebSocket] Left project room:', projectId)
    }
  }, [projectId, ws.isConnected, ws])

  // 监听新评论
  const onNewComment = useCallback(
    (callback: (data: CommentNotification) => void) => {
      ws.on<CommentNotification>('comment:new', callback)
      return () => ws.off<CommentNotification>('comment:new', callback)
    },
    [ws]
  )

  return {
    isConnected: ws.isConnected,
    onNewComment,
  }
}

/**
 * Hook for upload progress
 */
export function useUploadProgress(fileId?: string) {
  const ws = useWebSocketContext()

  const onProgress = useCallback(
    (callback: (data: UploadProgress) => void) => {
      const handler = (data: UploadProgress) => {
        // 只处理特定文件的进度（如果指定了fileId）
        if (!fileId || data.fileId === fileId) {
          callback(data)
        }
      }

      ws.on<UploadProgress>('upload:progress', handler)
      return () => ws.off<UploadProgress>('upload:progress', handler)
    },
    [ws, fileId]
  )

  return {
    isConnected: ws.isConnected,
    onProgress,
  }
}

/**
 * Hook for @mention notifications
 */
export function useMentionNotifications() {
  const ws = useWebSocketContext()

  const onMention = useCallback(
    (callback: (data: CommentNotification) => void) => {
      ws.on<CommentNotification>('comment:mention', callback)
      return () => ws.off<CommentNotification>('comment:mention', callback)
    },
    [ws]
  )

  return {
    isConnected: ws.isConnected,
    onMention,
  }
}

/**
 * Generic WebSocket event listener hook
 */
export function useWebSocketEvent<T = any>(
  event: string,
  callback: (data: T) => void,
  deps: any[] = []
) {
  const ws = useWebSocketContext()

  useEffect(() => {
    if (!ws.isConnected) return

    ws.on<T>(event, callback)

    return () => {
      ws.off<T>(event, callback)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws.isConnected, event, ...deps])

  return {
    isConnected: ws.isConnected,
  }
}
