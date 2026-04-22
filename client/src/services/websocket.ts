/**
 * WebSocket Service - 实时通知客户端
 *
 * 功能：
 * - Task CRUD 实时更新
 * - @提及通知
 * - 审批通知
 * - 文件上传进度
 * - 评论更新
 */

import { io, Socket } from 'socket.io-client'

// WebSocket事件类型
export interface UploadProgress {
  fileId: string
  fileName: string
  taskId: number
  progress: number
  speed?: number
  remainingTime?: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
}

export interface CommentNotification {
  commentId: number
  entityType: 'project' | 'task'
  entityId: number
  userId: number
  username: string
  author: {
    id: number
    username: string | null
    realName: string | null
    displayName: string
  }
  content: string
  mentions: {
    id: number
    username: string | null
    realName: string | null
    displayName: string
  }[]
  mentionNames?: string[]
  createdAt: string
}

export interface TaskStatusChange {
  taskId: number
  status: string
  progress?: number
  userId: number
  username: string
  timestamp: string
}

export interface FileDeleted {
  taskId: number
  fileId: number
  fileName: string
  timestamp: string
}

// 事件监听器类型
type EventCallback<T = any> = (data: T) => void

export class WebSocketService {
  private static instance: WebSocketService
  private socket: Socket | null = null
  private listeners: Map<string, Set<EventCallback>> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000 // 1秒

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService()
    }
    return WebSocketService.instance
  }

  /**
   * 连接WebSocket服务器
   */
  connect(userId: number): void {
    if (this.socket?.connected) {
      console.log('WebSocket already connected')
      return
    }

    // WebSocket needs full URL, cannot use /api proxy path
    const serverUrl = process.env.NEXT_PUBLIC_WS_URL
    if (!serverUrl) {
      console.error('[WebSocket] NEXT_PUBLIC_WS_URL not configured, skipping connection')
      return
    }

    console.log('🔌 [WebSocket] Connecting to:', serverUrl)

    this.socket = io(serverUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    })

    this.setupEventHandlers(userId)
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(userId: number): void {
    if (!this.socket) return

    // 连接成功
    this.socket.on('connect', () => {
      console.log('✅ [WebSocket] Connected, socket ID:', this.socket?.id)
      this.reconnectAttempts = 0

      // 认证用户
      this.socket?.emit('authenticate', { userId })
    })

    // 认证成功
    this.socket.on('authenticated', (data: { success: boolean; userId: number }) => {
      console.log('✅ [WebSocket] Authenticated:', data)
      this.emit('authenticated', data)
    })

    // 断开连接
    this.socket.on('disconnect', (reason: string) => {
      console.log('⚠️ [WebSocket] Disconnected:', reason)
      this.emit('disconnected', { reason })
    })

    // 连接错误
    this.socket.on('connect_error', (error: Error) => {
      console.error('❌ [WebSocket] Connection error:', error)
      this.reconnectAttempts++

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ [WebSocket] Max reconnection attempts reached')
        this.emit('connection_failed', { error })
      }
    })

    // 重新连接
    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log('🔄 [WebSocket] Reconnected after', attemptNumber, 'attempts')
      this.emit('reconnected', { attemptNumber })
    })

    // ==================== 业务事件监听 ====================

    // 文件上传进度
    this.socket.on('upload:progress', (data: UploadProgress) => {
      console.log('📤 [WebSocket] Upload progress:', data)
      this.emit('upload:progress', data)
    })

    // Task文件上传
    this.socket.on('task:file:upload', (data: any) => {
      console.log('📁 [WebSocket] Task file upload:', data)
      this.emit('task:file:upload', data)
    })

    // 新评论通知
    this.socket.on('comment:new', (data: CommentNotification) => {
      console.log('💬 [WebSocket] New comment:', data)
      this.emit('comment:new', data)
    })

    // @提及通知
    this.socket.on('comment:mention', (data: CommentNotification) => {
      console.log('📢 [WebSocket] Mentioned in comment:', data)
      this.emit('comment:mention', data)
    })

    // Task状态变更
    this.socket.on('task:status:change', (data: TaskStatusChange) => {
      console.log('🔄 [WebSocket] Task status changed:', data)
      this.emit('task:status:change', data)
    })

    // 文件删除通知
    this.socket.on('task:file:deleted', (data: FileDeleted) => {
      console.log('🗑️ [WebSocket] File deleted:', data)
      this.emit('task:file:deleted', data)
    })
  }

  /**
   * 加入Task房间
   */
  joinTaskRoom(taskId: number): void {
    if (!this.socket?.connected) {
      console.warn('WebSocket not connected')
      return
    }
    console.log('🚪 [WebSocket] Joining task room:', taskId)
    this.socket.emit('join:task', taskId)
  }

  /**
   * 离开Task房间
   */
  leaveTaskRoom(taskId: number): void {
    if (!this.socket?.connected) return
    console.log('🚪 [WebSocket] Leaving task room:', taskId)
    this.socket.emit('leave:task', taskId)
  }

  /**
   * 加入Project房间
   */
  joinProjectRoom(projectId: number): void {
    if (!this.socket?.connected) {
      console.warn('WebSocket not connected')
      return
    }
    console.log('🚪 [WebSocket] Joining project room:', projectId)
    this.socket.emit('join:project', projectId)
  }

  /**
   * 离开Project房间
   */
  leaveProjectRoom(projectId: number): void {
    if (!this.socket?.connected) return
    console.log('🚪 [WebSocket] Leaving project room:', projectId)
    this.socket.emit('leave:project', projectId)
  }

  /**
   * 监听事件
   */
  on<T = any>(event: string, callback: EventCallback<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  /**
   * 取消监听事件
   */
  off<T = any>(event: string, callback: EventCallback<T>): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.delete(callback)
    }
  }

  /**
   * 触发本地事件
   */
  private emit<T = any>(event: string, data: T): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach((callback) => callback(data))
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 [WebSocket] Disconnecting...')
      this.socket.disconnect()
      this.socket = null
      this.listeners.clear()
    }
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.socket?.connected || false
  }
}

// 导出单例实例
export const websocketService = WebSocketService.getInstance()
