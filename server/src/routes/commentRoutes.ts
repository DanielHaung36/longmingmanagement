/**
 * Comment Routes - 评论系统API路由
 * @swagger
 * tags:
 *   name: Comments
 *   description: 评论系统管理
 */

import { Router } from 'express';
import { CommentController } from '../controllers/commentController';
import { cookieAuth, optionalCookieAuth } from '../middleware/cookieAuth';

const router = Router();

/**
 * @swagger
 * /api/comments:
 *   post:
 *     summary: 创建评论
 *     tags: [Comments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - entityType
 *               - entityId
 *               - content
 *             properties:
 *               entityType:
 *                 type: string
 *                 enum: [project, task]
 *                 description: 实体类型
 *               entityId:
 *                 type: integer
 *                 description: 实体ID
 *               content:
 *                 type: string
 *                 description: 评论内容（支持@提及，格式：@username）
 *               parentCommentId:
 *                 type: integer
 *                 description: 父评论ID（回复时使用）
 *     responses:
 *       200:
 *         description: 评论创建成功
 *       400:
 *         description: 参数错误
 */
// 开发模式使用可选认证（自动注入用户），生产环境需要登录
router.post('/', process.env.NODE_ENV === 'development' ? optionalCookieAuth : cookieAuth, CommentController.createComment);

/**
 * @swagger
 * /api/comments/{entityType}/{entityId}:
 *   get:
 *     summary: 获取评论列表
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [project, task]
 *         description: 实体类型
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 实体ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: 每页数量
 *       - in: query
 *         name: includeReplies
 *         schema:
 *           type: boolean
 *           default: true
 *         description: 是否包含回复
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/:entityType/:entityId', CommentController.getComments);

/**
 * @swagger
 * /api/comments/{commentId}:
 *   patch:
 *     summary: 更新评论
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: commentId
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
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
 *   delete:
 *     summary: 删除评论（软删除）
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.patch('/:commentId', cookieAuth, CommentController.updateComment);
router.delete('/:commentId', cookieAuth, CommentController.deleteComment);

/**
 * @swagger
 * /api/comments/mentions/me:
 *   get:
 *     summary: 获取我的@提及
 *     tags: [Comments]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/mentions/me', cookieAuth, CommentController.getMentionedComments);

export default router;
