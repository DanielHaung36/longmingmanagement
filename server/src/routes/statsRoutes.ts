/**
 * statsRoutes.ts - 统计和报表路由
 */

import { Router } from 'express';
import { StatsController } from '../controllers/statsController';

const router = Router();

/**
 * @swagger
 * /api/stats/dashboard:
 *   get:
 *     summary: 获取仪表盘统计数据
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: 仪表盘统计查询成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalProjects:
 *                           type: integer
 *                           example: 108
 *                         activeProjects:
 *                           type: integer
 *                           example: 45
 *                         totalTasks:
 *                           type: integer
 *                           example: 229
 *                         activeTasks:
 *                           type: integer
 *                           example: 120
 *                         myTasks:
 *                           type: integer
 *                           example: 15
 *                         pendingApprovals:
 *                           type: object
 *                           properties:
 *                             projects:
 *                               type: integer
 *                             tasks:
 *                               type: integer
 *                     projectsByJobType:
 *                       type: object
 *                       example: { AT: 45, AQ: 30, AC: 20, AS: 10, AP: 3 }
 *                     tasksByStatus:
 *                       type: object
 *                       example: { TODO: 50, IN_PROGRESS: 40, DONE: 139 }
 *                     tasksByPriority:
 *                       type: object
 *                       example: { LOW: 30, MEDIUM: 100, HIGH: 80, URGENT: 19 }
 *                     recentActivities:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.get('/dashboard', StatsController.getDashboardStats);

/**
 * @swagger
 * /api/stats/tasks:
 *   get:
 *     summary: 获取任务统计数据
 *     tags: [Statistics]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期
 *         example: "2025-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期
 *         example: "2025-12-31"
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: integer
 *         description: 项目ID筛选
 *         example: 1
 *       - in: query
 *         name: jobType
 *         schema:
 *           type: string
 *           enum: [AT, AQ, AC, AS, AP]
 *         description: 业务类型筛选
 *         example: "AT"
 *     responses:
 *       200:
 *         description: 任务统计查询成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         completed:
 *                           type: integer
 *                         completionRate:
 *                           type: number
 *                     byStatus:
 *                       type: object
 *                     byPriority:
 *                       type: object
 *                     workload:
 *                       type: object
 *                       properties:
 *                         avgEstimatedHours:
 *                           type: number
 *                         avgActualHours:
 *                           type: number
 */
router.get('/tasks', StatsController.getTaskStats);

/**
 * @swagger
 * /api/stats/projects:
 *   get:
 *     summary: 获取项目统计数据
 *     tags: [Statistics]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期
 *         example: "2025-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期
 *         example: "2025-12-31"
 *       - in: query
 *         name: jobType
 *         schema:
 *           type: string
 *           enum: [AT, AQ, AC, AS, AP]
 *         description: 业务类型筛选
 *         example: "AT"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: 项目状态筛选
 *         example: "IN_PROGRESS"
 *     responses:
 *       200:
 *         description: 项目统计查询成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         avgTasksPerProject:
 *                           type: number
 *                     byJobType:
 *                       type: object
 *                     byStatus:
 *                       type: object
 *                     byApprovalStatus:
 *                       type: object
 *                     topClients:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           client:
 *                             type: string
 *                           projectCount:
 *                             type: integer
 */
router.get('/projects', StatsController.getProjectStats);

export default router;
