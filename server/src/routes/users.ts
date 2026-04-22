import express from 'express';
import {
  createUser,
  getUsers,
  getUserById,
  getUser,
  getUserByUsername,
  getUserByEmail,
  updateUser,
  deleteUser,
  hardDeleteUser,
  bulkCreateUsers,
  getUserStats,
  searchUsers,
  updateUserStatus,
  saveOneDrivePath,
  getOneDrivePath
} from '../controllers/userController';

const router = express.Router();

// 统计接口（必须在 /:id 之前）
router.get('/stats', getUserStats);

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: 搜索用户（用于@功能）
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: 搜索关键词（用户名/真实姓名/邮箱）
 *         example: "admin"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 返回结果数量限制
 *     responses:
 *       200:
 *         description: 搜索成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       username:
 *                         type: string
 *                       realName:
 *                         type: string
 *                       email:
 *                         type: string
 *                       profilePictureUrl:
 *                         type: string
 *       400:
 *         description: 搜索关键词为空
 */
router.get('/search', searchUsers);

// 特殊查询接口（必须在 /:id 之前）
router.get('/cognito/:cognitoId', getUser); // 兼容旧接口
router.get('/username/:username', getUserByUsername);
router.get('/email/:email', getUserByEmail);

// 批量操作（必须在 /:id 之前）
router.post('/bulk', bulkCreateUsers);

// OneDrive 路径配置（必须在 /:id 之前）
router.post('/onedrive-path', saveOneDrivePath);
router.get('/:userId/onedrive-path', getOneDrivePath);

// CRUD 基础接口（/:id 必须放在最后）
router.post('/', createUser);
router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);

/**
 * @swagger
 * /api/users/{id}/status:
 *   patch:
 *     summary: 更新用户状态
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, SUSPENDED]
 *                 description: 用户状态
 *                 example: "ACTIVE"
 *     responses:
 *       200:
 *         description: 用户状态更新成功
 *       400:
 *         description: 无效的状态值
 */
router.patch('/:id/status', updateUserStatus);

router.delete('/:id', deleteUser);
router.delete('/:id/hard', hardDeleteUser);

export default router;
