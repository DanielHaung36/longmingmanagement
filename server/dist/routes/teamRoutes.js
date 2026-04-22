"use strict";
/**
 * Team Routes - 团队管理路由
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const teamController_1 = require("../controllers/teamController");
const router = express_1.default.Router();
/**
 * @swagger
 * /api/teams/search:
 *   get:
 *     summary: 搜索团队（模糊搜索）
 *     tags: [Teams]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 返回结果数量限制
 *     responses:
 *       200:
 *         description: 搜索成功
 *       400:
 *         description: 搜索关键词为空
 */
router.get('/search', teamController_1.searchTeams);
/**
 * @swagger
 * /api/teams:
 *   post:
 *     summary: 创建新团队
 *     tags: [Teams]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "开发团队"
 *               description:
 *                 type: string
 *                 example: "负责软件开发"
 *               managerId:
 *                 type: integer
 *                 example: 2
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: 团队创建成功
 *       409:
 *         description: 团队名称已存在
 */
router.post('/', teamController_1.createTeam);
/**
 * @swagger
 * /api/teams:
 *   get:
 *     summary: 获取所有团队（支持分页和过滤）
 *     tags: [Teams]
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: 过滤激活状态
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: 团队列表
 */
router.get('/', teamController_1.getAllTeams);
/**
 * @swagger
 * /api/teams/{id}:
 *   get:
 *     summary: 获取单个团队详情
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 团队详情
 *       404:
 *         description: 团队不存在
 */
router.get('/:id', teamController_1.getTeamById);
/**
 * @swagger
 * /api/teams/{id}:
 *   put:
 *     summary: 更新团队信息
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               managerId:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 团队不存在
 *       409:
 *         description: 团队名称已存在
 */
router.put('/:id', teamController_1.updateTeam);
/**
 * @swagger
 * /api/teams/{id}:
 *   delete:
 *     summary: 删除团队
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 删除成功
 *       400:
 *         description: 有关联成员或项目，无法删除
 *       404:
 *         description: 团队不存在
 */
router.delete('/:id', teamController_1.deleteTeam);
exports.default = router;
//# sourceMappingURL=teamRoutes.js.map