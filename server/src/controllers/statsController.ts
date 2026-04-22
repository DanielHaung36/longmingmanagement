/**
 * StatsController - 统计和报表控制器
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ResponseBuilder } from '../utils/responseBuilder';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class StatsController {
  /**
   * 仪表盘统计
   * GET /api/stats/dashboard
   */
  static async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      // 并发查询所有统计数据
      const [
        totalProjects,
        activeProjects,
        totalTasks,
        activeTasks,
        pendingApprovals,
        myTasks,
        tasksByJobType, // 修改：改为按 task.jobType 分组，因为 jobType 只在 task 级别定义
        tasksByStatus,
        tasksByPriority,
        recentActivitiesRaw,
      ] = await Promise.all([
        // 项目总数
        prisma.projects.count(),
        // 活跃项目数
        prisma.projects.count({
          where: { status: { in: ['IN_PROGRESS', 'PLANNING'] } },
        }),
        // 任务总数
        prisma.tasks.count(),
        // 活跃任务数
        prisma.tasks.count({
          where: { status: { in: ['TODO', 'IN_PROGRESS', 'REVIEW'] } },
        }),
        // 待审批数量
        prisma.$transaction([
          prisma.projects.count({ where: { approvalStatus: 'PENDING' } }),
          prisma.tasks.count({ where: { approvalStatus: 'PENDING' } }),
        ]),
        // 我的任务
        userId
          ? prisma.tasks.count({
              where: {
                OR: [{ authorUserId: userId }, { assignedUserId: userId }],
                status: { not: 'CANCELLED' },
              },
            })
          : 0,
        // 任务按业务类型分组（jobType 只在 task 级别定义）
        prisma.tasks.groupBy({
          by: ['jobType'],
          _count: true,
        }),
        // 任务按状态分组
        prisma.tasks.groupBy({
          by: ['status'],
          _count: true,
        }),
        // 任务按优先级分组
        prisma.tasks.groupBy({
          by: ['priority'],
          _count: true,
        }),
        // 最近活动（最近更新的10个任务）
        prisma.tasks.findMany({
          take: 10,
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            taskCode: true,
            title: true,
            status: true,
            priority: true,
            progress: true,
            updatedAt: true,
            projects: {
              select: {
                name: true,
                clientCompany: true,
              },
            },
            users_tasks_assignedUserIdTousers: {
              select: {
                id: true,
                realName: true,
              },
            },
            projectManager: true,
          },
        }),
      ]);

      const recentActivities = recentActivitiesRaw.map((activity) => ({
        id: activity.id,
        taskCode: activity.taskCode,
        title: activity.title,
        status: activity.status,
        priority: activity.priority,
        progress: activity.progress,
        updatedAt: activity.updatedAt,
        project: activity.projects?.name ?? null,
        clientCompany: activity.projects?.clientCompany ?? null,
        assignedUser: activity.users_tasks_assignedUserIdTousers
          ? {
              id: activity.users_tasks_assignedUserIdTousers.id,
              realName: activity.users_tasks_assignedUserIdTousers.realName,
            }
          : null,
        projectManager: activity.projectManager,
      }));

      const stats = {
        overview: {
          totalProjects,
          activeProjects,
          totalTasks,
          activeTasks,
          myTasks,
          pendingApprovals: {
            projects: pendingApprovals[0],
            tasks: pendingApprovals[1],
          },
        },
        tasksByJobType: tasksByJobType.reduce((acc: any, item) => {
          acc[item.jobType] = item._count;
          return acc;
        }, {}),
        tasksByStatus: tasksByStatus.reduce((acc: any, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {}),
        tasksByPriority: tasksByPriority.reduce((acc: any, item) => {
          acc[item.priority] = item._count;
          return acc;
        }, {}),
        recentActivities,
      };

      res.status(200).json(
        ResponseBuilder.success(stats, '仪表盘统计查询成功')
      );
    } catch (error: any) {
      logger.error('仪表盘统计查询失败', { error: error.message });
      res.status(500).json(
        ResponseBuilder.error(error.message, 'DASHBOARD_STATS_FAILED')
      );
    }
  }

  /**
   * 任务统计
   * GET /api/stats/tasks
   */
  static async getTaskStats(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate, projectId, jobType } = req.query;

      // 构建查询条件
      const where: any = {};
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) where.createdAt.lte = new Date(endDate as string);
      }
      if (projectId) {
        where.projectId = parseInt(projectId as string);
      }
      if (jobType) {
        // 修改：直接使用 task.jobType 而不是 projects.jobType
        where.jobType = jobType as string;
      }

      // 查询统计数据
      const [
        totalTasks,
        tasksByStatus,
        tasksByPriority,
        completionRate,
        avgEstimatedHours,
        avgActualHours,
      ] = await Promise.all([
        // 总任务数
        prisma.tasks.count({ where }),
        // 按状态分组
        prisma.tasks.groupBy({
          by: ['status'],
          where,
          _count: true,
        }),
        // 按优先级分组
        prisma.tasks.groupBy({
          by: ['priority'],
          where,
          _count: true,
        }),
        // 完成率
        prisma.tasks.count({
          where: { ...where, status: 'DONE' },
        }),
        // 平均预估工时
        prisma.tasks.aggregate({
          where,
          _avg: { estimatedHours: true },
        }),
        // 平均实际工时
        prisma.tasks.aggregate({
          where: { ...where, actualHours: { not: null } },
          _avg: { actualHours: true },
        }),
      ]);

      const completedTasks = tasksByStatus.find((s) => s.status === 'DONE')?._count || 0;

      const stats = {
        overview: {
          total: totalTasks,
          completed: completionRate,
          completionRate: totalTasks > 0 ? (completionRate / totalTasks) * 100 : 0,
        },
        byStatus: tasksByStatus.reduce((acc: any, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {}),
        byPriority: tasksByPriority.reduce((acc: any, item) => {
          acc[item.priority] = item._count;
          return acc;
        }, {}),
        workload: {
          avgEstimatedHours: avgEstimatedHours._avg.estimatedHours || 0,
          avgActualHours: avgActualHours._avg.actualHours || 0,
        },
      };

      res.status(200).json(
        ResponseBuilder.success(stats, '任务统计查询成功')
      );
    } catch (error: any) {
      logger.error('任务统计查询失败', { error: error.message });
      res.status(500).json(
        ResponseBuilder.error(error.message, 'TASK_STATS_FAILED')
      );
    }
  }

  /**
   * 项目统计
   * GET /api/stats/projects
   */
  static async getProjectStats(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate, status } = req.query;
      // jobType 已删除 - jobType 只在 task 级别定义

      // 构建查询条件
      const where: any = {};
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) where.createdAt.lte = new Date(endDate as string);
      }
      // if (jobType) where.jobType = jobType as string; // 已删除
      if (status) where.status = status as string;

      // 查询统计数据
      const [
        totalProjects,
        // projectsByJobType 已删除 - jobType 只在 task 级别定义
        projectsByStatus,
        projectsByApprovalStatus,
        avgTasksPerProject,
        topClients,
      ] = await Promise.all([
        // 总项目数
        prisma.projects.count({ where }),
        // 按业务类型分组 - 已删除，jobType 只在 task 级别定义
        // 按状态分组
        prisma.projects.groupBy({
          by: ['status'],
          where,
          _count: true,
        }),
        // 按审批状态分组
        prisma.projects.groupBy({
          by: ['approvalStatus'],
          where,
          _count: true,
        }),
        // 平均每个项目的任务数
        prisma.tasks.groupBy({
          by: ['projectId'],
          _count: true,
        }),
        // 前10个客户（按项目数量）
        prisma.projects.groupBy({
          by: ['clientCompany'],
          where,
          _count: true,
          orderBy: { _count: { clientCompany: 'desc' } },
          take: 10,
        }),
      ]);

      const stats = {
        overview: {
          total: totalProjects,
          avgTasksPerProject:
            avgTasksPerProject.length > 0
              ? avgTasksPerProject.reduce((sum, item) => sum + item._count, 0) /
                avgTasksPerProject.length
              : 0,
        },
        // byJobType 已删除 - jobType 只在 task 级别定义
        byStatus: projectsByStatus.reduce((acc: any, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {}),
        byApprovalStatus: projectsByApprovalStatus.reduce((acc: any, item) => {
          acc[item.approvalStatus] = item._count;
          return acc;
        }, {}),
        topClients: topClients.map((item) => ({
          client: item.clientCompany,
          projectCount: item._count,
        })),
      };

      res.status(200).json(
        ResponseBuilder.success(stats, '项目统计查询成功')
      );
    } catch (error: any) {
      logger.error('项目统计查询失败', { error: error.message });
      res.status(500).json(
        ResponseBuilder.error(error.message, 'PROJECT_STATS_FAILED')
      );
    }
  }
}
