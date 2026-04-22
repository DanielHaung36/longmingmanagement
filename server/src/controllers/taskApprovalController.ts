/**
 * TaskApprovalController - Task审批控制器
 */

import { Request, Response } from 'express';
import { TaskApprovalService } from '../services/taskApprovalService';
import { logger } from '../utils/logger';
import { AuditService } from '../services/auditService';

export class TaskApprovalController {
  /**
   * 提交Task审批
   */
  static async submitForApproval(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;
      const userId = (req as any).user?.id || 84;

      const task = await TaskApprovalService.submitTaskForApproval(
        parseInt(taskId),
        userId
      );

      // 📝 记录审计日志
      await AuditService.logTaskApprovalSubmit(
        task.id,
        task.title,
        userId,
        req.ip,
        req.headers["user-agent"]
      );

      res.json({
        success: true,
        message: 'Task已提交审批',
        data: task,
      });
    } catch (error: any) {
      logger.error('提交Task审批失败', { error: error.message });
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * 审批Task
   */
  static async approveTask(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;
      const { approved, comment } = req.body;
      const userId = (req as any).user?.id || 84;
      const  role:string  = (req as any).user?.role;
      if (typeof approved !== 'boolean') {
        res.status(400).json({
          success: false,
          message: '请提供审批结果（approved: true/false）',
        });
        return;
      }

      const task = await TaskApprovalService.approveTask(
        parseInt(taskId),
        userId,
        role,
        approved,
        comment
      );

      // 📝 记录审计日志
      await AuditService.logTaskApprovalDecision(
        task.id,
        task.title,
        approved,
        comment,
        userId,
        req.ip,
        req.headers["user-agent"]
      );

      res.json({
        success: true,
        message: `Task已${approved ? '通过' : '拒绝'}`,
        data: task,
      });
    } catch (error: any) {
      logger.error('审批Task失败', { error: error.message });
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * 撤回Task审批
   */
  static async withdrawApproval(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;
      const userId = (req as any).user?.id || 84;

      const task = await TaskApprovalService.withdrawTaskApproval(
        parseInt(taskId),
        userId
      );

      res.json({
        success: true,
        message: 'Task审批已撤回',
        data: task,
      });
    } catch (error: any) {
      logger.error('撤回Task审批失败', { error: error.message });
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * 获取待审批的Tasks
   */
  static async getPendingTasks(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      const tasks = await TaskApprovalService.getPendingTasks(userId);

      res.json({
        success: true,
        data: tasks,
      });
    } catch (error: any) {
      logger.error('获取待审批Tasks失败', { error: error.message });
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * 批量审批Tasks
   */
  static async batchApprove(req: Request, res: Response): Promise<void> {
    try {
      const { taskIds, approved, comment } = req.body;
      const userId = (req as any).user?.id || 84;
      const  role:string  = (req as any).user?.role;
      if (!Array.isArray(taskIds) || taskIds.length === 0) {
        res.status(400).json({
          success: false,
          message: '请提供Task ID数组',
        });
        return;
      }

      if (typeof approved !== 'boolean') {
        res.status(400).json({
          success: false,
          message: '请提供审批结果（approved: true/false）',
        });
        return;
      }

      const tasks = await TaskApprovalService.batchApproveTasks(
        taskIds,
        userId,
        role,
        approved,
        comment
      );

      // 📝 记录审计日志（批量）
      for (const task of tasks) {
        await AuditService.logTaskApprovalDecision(
          task.id,
          task.title,
          approved,
          comment,
          userId,
          req.ip,
          req.headers["user-agent"]
        );
      }

      res.json({
        success: true,
        message: `批量审批完成`,
        data: tasks,
      });
    } catch (error: any) {
      logger.error('批量审批Tasks失败', { error: error.message });
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}
