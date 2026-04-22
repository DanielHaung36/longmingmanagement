/**
 * quotationRoutes.ts - 项目报价路由
 */

import { Router } from 'express';
import { QuotationController } from '../controllers/quotationController';

const router = Router();

/**
 * @swagger
 * /api/projects/{projectId}/quotations:
 *   get:
 *     summary: 获取项目的报价信息
 *     tags: [Project Quotations]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 项目ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 获取报价信息成功
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
 *                     id:
 *                       type: integer
 *                     projectId:
 *                       type: integer
 *                     quotationNumber:
 *                       type: string
 *                     requestDate:
 *                       type: string
 *                       format: date-time
 *                     quotationProvidedDate:
 *                       type: string
 *                       format: date-time
 *                     feedbackFromClient:
 *                       type: string
 *       404:
 *         description: 报价信息不存在
 */
router.get('/projects/:projectId/quotations', QuotationController.getProjectQuotations);

/**
 * @swagger
 * /api/projects/{projectId}/quotations:
 *   put:
 *     summary: 创建或更新项目报价信息
 *     tags: [Project Quotations]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 项目ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quotationNumber:
 *                 type: string
 *                 description: 报价编号
 *                 example: "Q-2025-001"
 *               requestDate:
 *                 type: string
 *                 format: date
 *                 description: 报价请求日期
 *                 example: "2025-01-15"
 *               quotationProvidedDate:
 *                 type: string
 *                 format: date
 *                 description: 报价提供日期
 *                 example: "2025-01-20"
 *               feedbackFromClient:
 *                 type: string
 *                 description: 客户反馈
 *                 example: "客户接受报价"
 *     responses:
 *       200:
 *         description: 报价信息更新成功
 *       404:
 *         description: 项目不存在
 */
router.put('/projects/:projectId/quotations', QuotationController.upsertQuotation);

/**
 * @swagger
 * /api/projects/{projectId}/quotations:
 *   delete:
 *     summary: 删除项目报价信息
 *     tags: [Project Quotations]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 项目ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 报价信息删除成功
 *       404:
 *         description: 报价信息不存在
 */
router.delete('/projects/:projectId/quotations', QuotationController.deleteQuotation);

export default router;
