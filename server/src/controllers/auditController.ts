/**
 * Audit Controller - 审计日志控制器
 */

import { Request, Response } from 'express';
import { AuditService } from '../services/auditService';
import { ResponseBuilder, ErrorCode } from '../utils/responseBuilder';
import { logger } from '../utils/logger';

export class AuditController {
  /**
   * GET /api/audit/logs
   * 获取审计日志列表
   */
  static async getLogs(req: Request, res: Response): Promise<void> {
    try {
      const {
        tableName,
        recordId,
        userId,
        action,
        startDate,
        endDate,
        page,
        limit,
      } = req.query;

      const result = await AuditService.getLogs({
        tableName: tableName as string | undefined,
        recordId: recordId ? parseInt(recordId as string) : undefined,
        userId: userId ? parseInt(userId as string) : undefined,
        action: action as string | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50,
      });

      res.status(200).json(
        ResponseBuilder.success(result, '查询成功')
      );
    } catch (error: any) {
      logger.error('获取审计日志失败', { error: error.message });
      res.status(500).json(
        ResponseBuilder.error(error.message, ErrorCode.INTERNAL_ERROR)
      );
    }
  }

  /**
   * GET /api/audit/record-history/:tableName/:recordId
   * 获取特定记录的操作历史
   */
  static async getRecordHistory(req: Request, res: Response): Promise<void> {
    try {
      const { tableName, recordId } = req.params;

      const logs = await AuditService.getRecordHistory(
        tableName,
        parseInt(recordId)
      );

      res.status(200).json(
        ResponseBuilder.success(logs, '查询成功')
      );
    } catch (error: any) {
      logger.error('获取记录历史失败', { error: error.message });
      res.status(500).json(
        ResponseBuilder.error(error.message, ErrorCode.INTERNAL_ERROR)
      );
    }
  }

  /**
   * GET /api/audit/user-history/:userId
   * 获取用户操作历史
   */
  static async getUserHistory(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { limit } = req.query;

      const logs = await AuditService.getUserHistory(
        parseInt(userId),
        limit ? parseInt(limit as string) : 100
      );

      res.status(200).json(
        ResponseBuilder.success(logs, '查询成功')
      );
    } catch (error: any) {
      logger.error('获取用户历史失败', { error: error.message });
      res.status(500).json(
        ResponseBuilder.error(error.message, ErrorCode.INTERNAL_ERROR)
      );
    }
  }

  /**
   * GET /api/audit/recent
   * 获取最近的操作日志
   */
  static async getRecentLogs(req: Request, res: Response): Promise<void> {
    try {
      const { limit } = req.query;

      const logs = await AuditService.getRecentLogs(
        limit ? parseInt(limit as string) : 50
      );

      res.status(200).json(
        ResponseBuilder.success(logs, '查询成功')
      );
    } catch (error: any) {
      logger.error('获取最近日志失败', { error: error.message });
      res.status(500).json(
        ResponseBuilder.error(error.message, ErrorCode.INTERNAL_ERROR)
      );
    }
  }
}
