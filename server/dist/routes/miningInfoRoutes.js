"use strict";
/**
 * miningInfoRoutes.ts - 矿业信息路由
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const miningInfoController_1 = require("../controllers/miningInfoController");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/projects/{projectId}/mining-info:
 *   get:
 *     summary: 获取项目的矿业信息
 *     tags: [Project Mining Info]
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
 *         description: 获取矿业信息成功
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
 *                     mineralType:
 *                       type: string
 *                     estimatedTonnage:
 *                       type: number
 *                     grade:
 *                       type: string
 *                     contactPerson:
 *                       type: string
 *                     contactEmail:
 *                       type: string
 *       404:
 *         description: 矿业信息不存在
 */
router.get('/projects/:projectId/mining-info', miningInfoController_1.MiningInfoController.getMiningInfo);
/**
 * @swagger
 * /api/projects/{projectId}/mining-info:
 *   put:
 *     summary: 创建或更新项目矿业信息
 *     tags: [Project Mining Info]
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
 *               mineralType:
 *                 type: string
 *                 description: 矿物类型
 *                 example: "铁矿石"
 *               estimatedTonnage:
 *                 type: number
 *                 description: 预估储量（吨）
 *                 example: 5000000
 *               grade:
 *                 type: string
 *                 description: 品位
 *                 example: "Fe 62%"
 *               contactPerson:
 *                 type: string
 *                 description: 联系人
 *                 example: "张三"
 *               contactEmail:
 *                 type: string
 *                 description: 联系邮箱
 *                 example: "zhangsan@example.com"
 *     responses:
 *       200:
 *         description: 矿业信息更新成功
 *       404:
 *         description: 项目不存在
 */
router.put('/projects/:projectId/mining-info', miningInfoController_1.MiningInfoController.upsertMiningInfo);
/**
 * @swagger
 * /api/projects/{projectId}/mining-info:
 *   delete:
 *     summary: 删除项目矿业信息
 *     tags: [Project Mining Info]
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
 *         description: 矿业信息删除成功
 *       404:
 *         description: 矿业信息不存在
 */
router.delete('/projects/:projectId/mining-info', miningInfoController_1.MiningInfoController.deleteMiningInfo);
exports.default = router;
//# sourceMappingURL=miningInfoRoutes.js.map