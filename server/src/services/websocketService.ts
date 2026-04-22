/**
 * WebSocket Service - 实时通知和进度追踪
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '../utils/logger';

export interface UploadProgress {
  fileId: string;
  fileName: string;
  taskId: number;
  progress: number; // 0-100
  speed?: number; // bytes/s
  remainingTime?: number; // seconds
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface CommentNotification {
  commentId: number;
  entityType: 'project' | 'task';
  entityId: number;
  userId: number;
  username: string;
  author: {
    id: number;
    username: string | null;
    realName: string | null;
    displayName: string;
  };
  content: string;
  mentions: {
    id: number;
    username: string | null;
    realName: string | null;
    displayName: string;
  }[];
  mentionNames?: string[];
  createdAt: string;
}

export class WebSocketService {
  private static io: SocketIOServer | null = null;
  private static connectedUsers: Map<number, Set<string>> = new Map(); // userId -> Set<socketId>

  /**
   * 初始化WebSocket服务器
   */
  static initialize(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        credentials: true,
      },
      path: '/socket.io',
    });

    this.io.on('connection', (socket: Socket) => {
      logger.info('WebSocket客户端连接', { socketId: socket.id });

      // 用户认证和注册
      socket.on('authenticate', (data: { userId: number }) => {
        const { userId } = data;

        // Validate userId is a positive integer
        if (!userId || typeof userId !== 'number' || !Number.isInteger(userId) || userId <= 0) {
          logger.warn('WebSocket认证失败：无效的userId', { userId, socketId: socket.id });
          socket.emit('authenticated', { success: false, error: '无效的用户ID' });
          return;
        }

        if (!this.connectedUsers.has(userId)) {
          this.connectedUsers.set(userId, new Set());
        }
        this.connectedUsers.get(userId)!.add(socket.id);

        socket.join(`user:${userId}`);
        logger.info('用户已认证', { userId, socketId: socket.id });

        socket.emit('authenticated', { success: true, userId });
      });

      // 加入任务房间
      socket.on('join:task', (taskId: number) => {
        socket.join(`task:${taskId}`);
        logger.info('加入任务房间', { taskId, socketId: socket.id });
      });

      // 离开任务房间
      socket.on('leave:task', (taskId: number) => {
        socket.leave(`task:${taskId}`);
        logger.info('离开任务房间', { taskId, socketId: socket.id });
      });

      // 加入项目房间
      socket.on('join:project', (projectId: number) => {
        socket.join(`project:${projectId}`);
        logger.info('加入项目房间', { projectId, socketId: socket.id });
      });

      // 离开项目房间
      socket.on('leave:project', (projectId: number) => {
        socket.leave(`project:${projectId}`);
        logger.info('离开项目房间', { projectId, socketId: socket.id });
      });

      // 断开连接
      socket.on('disconnect', () => {
        // 从所有用户列表中移除
        this.connectedUsers.forEach((sockets, userId) => {
          if (sockets.has(socket.id)) {
            sockets.delete(socket.id);
            if (sockets.size === 0) {
              this.connectedUsers.delete(userId);
            }
            logger.info('用户断开连接', { userId, socketId: socket.id });
          }
        });
        logger.info('WebSocket客户端断开', { socketId: socket.id });
      });
    });

    logger.info('✅ WebSocket服务器已初始化');
  }

  /**
   * 发送文件上传进度
   */
  static emitUploadProgress(userId: number, progress: UploadProgress) {
    if (!this.io) {
      logger.warn('WebSocket未初始化');
      return;
    }

    // 发送给特定用户
    this.io.to(`user:${userId}`).emit('upload:progress', progress);

    // 同时发送给任务房间的所有人
    this.io.to(`task:${progress.taskId}`).emit('task:file:upload', {
      taskId: progress.taskId,
      fileName: progress.fileName,
      progress: progress.progress,
      status: progress.status,
    });

    logger.info('发送上传进度', { userId, fileId: progress.fileId, progress: progress.progress });
  }

  /**
   * 发送评论通知
   */
  static emitCommentNotification(notification: CommentNotification) {
    if (!this.io) {
      logger.warn('WebSocket未初始化');
      return;
    }

    const room = notification.entityType === 'task'
      ? `task:${notification.entityId}`
      : `project:${notification.entityId}`;

    // 发送给房间内所有人
    this.io.to(room).emit('comment:new', notification);

    // 发送@提及通知给特定用户
    notification.mentions.forEach((mention) => {
      // 如果需要精准推送，可以在此处根据 mention.id 找到用户 socket 并发送
    });

    logger.info('发送评论通知', {
      entityType: notification.entityType,
      entityId: notification.entityId,
      commentId: notification.commentId,
    });
  }

  /**
   * 发送@提及通知给特定用户
   */
  static emitMentionNotification(userId: number, notification: CommentNotification) {
    if (!this.io) {
      logger.warn('WebSocket未初始化');
      return;
    }

    this.io.to(`user:${userId}`).emit('comment:mention', notification);
    logger.info('发送@提及通知', { userId, commentId: notification.commentId });
  }

  /**
   * 发送任务状态变更通知
   */
  static emitTaskStatusChange(taskId: number, data: {
    status: string;
    progress?: number;
    userId: number;
    username: string;
  }) {
    if (!this.io) {
      logger.warn('WebSocket未初始化');
      return;
    }

    this.io.to(`task:${taskId}`).emit('task:status:change', {
      taskId,
      ...data,
      timestamp: new Date().toISOString(),
    });

    logger.info('发送任务状态变更', { taskId, status: data.status });
  }

  /**
   * 发送文件删除通知
   */
  static emitFileDeleted(taskId: number, fileId: number, fileName: string) {
    if (!this.io) {
      logger.warn('WebSocket未初始化');
      return;
    }

    this.io.to(`task:${taskId}`).emit('task:file:deleted', {
      taskId,
      fileId,
      fileName,
      timestamp: new Date().toISOString(),
    });

    logger.info('发送文件删除通知', { taskId, fileId });
  }

  /**
   * 发送任务审批状态变更通知 (发送给所有审批者)
   */
  static emitTaskApprovalChange(data: {
    taskId: number;
    taskCode: string;
    title: string;
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    approvedBy?: number;
    comment?: string;
  }) {
    if (!this.io) {
      logger.warn('WebSocket未初始化');
      return;
    }

    // 广播给所有审批者 (通过房间 "approvers" 或直接广播)
    this.io.emit('task:approval:change', {
      ...data,
      timestamp: new Date().toISOString(),
    });

    // 也可以发送特定事件
    if (data.approvalStatus === 'APPROVED') {
      this.io.emit('task:approved', data);
    } else if (data.approvalStatus === 'REJECTED') {
      this.io.emit('task:rejected', data);
    }

    logger.info('发送任务审批状态变更', { taskId: data.taskId, status: data.approvalStatus });
  }

  /**
   * 发送项目审批状态变更通知
   */
  static emitProjectApprovalChange(data: {
    projectId: number;
    projectCode: string;
    name: string;
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    approvedBy?: number;
    comment?: string;
  }) {
    if (!this.io) {
      logger.warn('WebSocket未初始化');
      return;
    }

    this.io.emit('project:approval:change', {
      ...data,
      timestamp: new Date().toISOString(),
    });

    if (data.approvalStatus === 'APPROVED') {
      this.io.emit('project:approved', data);
    } else if (data.approvalStatus === 'REJECTED') {
      this.io.emit('project:rejected', data);
    }

    logger.info('发送项目审批状态变更', { projectId: data.projectId, status: data.approvalStatus });
  }

  /**
   * 发送任务删除审批通知
   */
  static emitTaskDeletionApproval(data: {
    taskId: number;
    taskCode: string;
    approved: boolean;
    approvedBy: number;
  }) {
    if (!this.io) {
      logger.warn('WebSocket未初始化');
      return;
    }

    const event = data.approved ? 'task:deletion:approved' : 'task:deletion:rejected';
    this.io.emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });

    logger.info('发送任务删除审批通知', { taskId: data.taskId, approved: data.approved });
  }

  /**
   * 发送项目删除审批通知
   */
  static emitProjectDeletionApproval(data: {
    projectId: number;
    projectCode: string;
    approved: boolean;
    approvedBy: number;
  }) {
    if (!this.io) {
      logger.warn('WebSocket未初始化');
      return;
    }

    const event = data.approved ? 'project:deletion:approved' : 'project:deletion:rejected';
    this.io.emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });

    logger.info('发送项目删除审批通知', { projectId: data.projectId, approved: data.approved });
  }

  /**
   * 发送新任务创建通知
   */
  static emitTaskCreated(data: {
    taskId: number;
    taskCode: string;
    title: string;
    approvalStatus: string;
    createdBy: number;
  }) {
    if (!this.io) {
      logger.warn('❌ WebSocket未初始化，无法发送任务创建通知');
      return;
    }

    console.log('🔌 [WebSocket] Emitting task:created event:', {
      taskId: data.taskId,
      taskCode: data.taskCode,
      approvalStatus: data.approvalStatus,
      connectedClients: this.io.engine.clientsCount,
    });

    this.io.emit('task:created', {
      ...data,
      timestamp: new Date().toISOString(),
    });

    logger.info('✅ 发送新任务创建通知', { taskId: data.taskId, taskCode: data.taskCode });
  }

  /**
   * 发送新项目创建通知
   */
  static emitProjectCreated(data: {
    projectId: number;
    projectCode: string;
    name: string;
    approvalStatus: string;
    createdBy: number;
  }) {
    if (!this.io) {
      logger.warn('WebSocket未初始化');
      return;
    }

    this.io.emit('project:created', {
      ...data,
      timestamp: new Date().toISOString(),
    });

    logger.info('发送新项目创建通知', { projectId: data.projectId });
  }

  /**
   * 获取在线用户数
   */
  static getOnlineUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * 检查用户是否在线
   */
  static isUserOnline(userId: number): boolean {
    return this.connectedUsers.has(userId) && this.connectedUsers.get(userId)!.size > 0;
  }

  /**
   * 获取用户的Socket连接数
   */
  static getUserSocketCount(userId: number): number {
    return this.connectedUsers.get(userId)?.size || 0;
  }
}




