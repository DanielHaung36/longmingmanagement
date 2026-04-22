/**
 * Audit Service - 操作日志服务
 * 记录系统中所有重要的操作和变更
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface AuditLogInput {
  tableName: string;
  recordId: number;
  action: string;
  changes?: any;
  userId?: number | null;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  /**
   * 创建审计日志
   */
  static async createLog(input: AuditLogInput): Promise<void> {
    try {
      await prisma.audit_logs.create({
        data: {
          tableName: input.tableName,
          recordId: input.recordId,
          action: input.action,
          changes: input.changes || {},
          userId: input.userId,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        },
      });

      logger.info('Audit log created', {
        tableName: input.tableName,
        recordId: input.recordId,
        action: input.action,
      });
    } catch (error) {
      logger.error('Failed to create audit log', { error, input });
      // 不抛出错误，避免影响主业务流程
    }
  }

  /**
   * 文件上传日志
   */
  static async logFileUpload(
    fileId: number,
    fileName: string,
    taskId: number,
    userId: number | null,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.createLog({
      tableName: 'task_files',
      recordId: fileId,
      action: 'FILE_UPLOAD',
      changes: {
        fileName,
        taskId,
        operation: 'upload',
      },
      userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * 文件删除请求日志
   */
  static async logFileDeleteRequest(
    fileId: number,
    fileName: string,
    reason: string,
    userId: number | null,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.createLog({
      tableName: 'task_files',
      recordId: fileId,
      action: 'FILE_DELETE_REQUESTED',
      changes: {
        fileName,
        reason,
        operation: 'delete_request',
      },
      userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * 文件删除审批日志
   */
  static async logFileDeleteApproval(
    fileId: number,
    fileName: string,
    approved: boolean,
    comment: string | undefined,
    approverId: number | null,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.createLog({
      tableName: 'task_files',
      recordId: fileId,
      action: approved ? 'FILE_DELETE_APPROVED' : 'FILE_DELETE_REJECTED',
      changes: {
        fileName,
        approved,
        comment,
        operation: 'delete_approval',
      },
      userId: approverId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * 创建文件夹日志
   */
  static async logFolderCreate(
    taskId: number,
    folderName: string,
    folderPath: string,
    userId: number | null,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.createLog({
      tableName: 'tasks',
      recordId: taskId,
      action: 'FOLDER_CREATED',
      changes: {
        folderName,
        folderPath,
        operation: 'create_folder',
      },
      userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * 项目审批提交日志
   */
  static async logProjectApprovalSubmit(
    projectId: number,
    projectName: string,
    userId: number | null,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.createLog({
      tableName: 'projects',
      recordId: projectId,
      action: 'APPROVAL_SUBMITTED',
      changes: {
        projectName,
        operation: 'submit_approval',
      },
      userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * 项目审批决策日志
   */
  static async logProjectApprovalDecision(
    projectId: number,
    projectName: string,
    approved: boolean,
    comment: string | undefined,
    approverId: number | null,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.createLog({
      tableName: 'projects',
      recordId: projectId,
      action: approved ? 'APPROVAL_APPROVED' : 'APPROVAL_REJECTED',
      changes: {
        projectName,
        approved,
        comment,
        operation: 'approval_decision',
      },
      userId: approverId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * 任务审批提交日志
   */
  static async logTaskApprovalSubmit(
    taskId: number,
    taskTitle: string,
    userId: number | null,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.createLog({
      tableName: 'tasks',
      recordId: taskId,
      action: 'APPROVAL_SUBMITTED',
      changes: {
        taskTitle,
        operation: 'submit_approval',
      },
      userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * 任务审批决策日志
   */
  static async logTaskApprovalDecision(
    taskId: number,
    taskTitle: string,
    approved: boolean,
    comment: string | undefined,
    approverId: number | null,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.createLog({
      tableName: 'tasks',
      recordId: taskId,
      action: approved ? 'APPROVAL_APPROVED' : 'APPROVAL_REJECTED',
      changes: {
        taskTitle,
        approved,
        comment,
        operation: 'approval_decision',
      },
      userId: approverId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * 项目创建日志
   */
  static async logProjectCreate(
    projectId: number,
    projectName: string,
    userId: number | null,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.createLog({
      tableName: 'projects',
      recordId: projectId,
      action: 'PROJECT_CREATED',
      changes: {
        projectName,
        operation: 'create',
      },
      userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * 项目更新日志
   */
  static async logProjectUpdate(
    projectId: number,
    projectName: string,
    changes: any,
    userId: number | null,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.createLog({
      tableName: 'projects',
      recordId: projectId,
      action: 'PROJECT_UPDATED',
      changes: {
        projectName,
        ...changes,
        operation: 'update',
      },
      userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * 任务创建日志
   */
  static async logTaskCreate(
    taskId: number,
    taskTitle: string,
    userId: number | null,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.createLog({
      tableName: 'tasks',
      recordId: taskId,
      action: 'TASK_CREATED',
      changes: {
        taskTitle,
        operation: 'create',
      },
      userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * 任务更新日志
   */
  static async logTaskUpdate(
    taskId: number,
    taskTitle: string,
    changes: any,
    userId: number | null,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.createLog({
      tableName: 'tasks',
      recordId: taskId,
      action: 'TASK_UPDATED',
      changes: {
        taskTitle,
        ...changes,
        operation: 'update',
      },
      userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * 获取审计日志列表
   */
  static async getLogs(params: {
    tableName?: string;
    recordId?: number;
    userId?: number;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const {
      tableName,
      recordId,
      userId,
      action,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = params;

    const where: any = {};

    if (tableName) where.tableName = tableName;
    if (recordId) where.recordId = recordId;
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.audit_logs.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              username: true,
              realName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.audit_logs.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 获取特定记录的操作历史
   */
  static async getRecordHistory(tableName: string, recordId: number) {
    const logs = await prisma.audit_logs.findMany({
      where: {
        tableName,
        recordId,
      },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            realName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return logs;
  }

  /**
   * 获取用户操作历史
   */
  static async getUserHistory(userId: number, limit: number = 100) {
    const logs = await prisma.audit_logs.findMany({
      where: { userId },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            realName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs;
  }

  /**
   * 获取最近的操作日志
   */
  static async getRecentLogs(limit: number = 50) {
    const logs = await prisma.audit_logs.findMany({
      include: {
        users: {
          select: {
            id: true,
            username: true,
            realName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs;
  }
}
