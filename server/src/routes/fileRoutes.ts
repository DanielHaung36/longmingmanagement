/**
 * File Routes - 文件管理API路由
 * @swagger
 * tags:
 *   name: Files
 *   description: 文件管理系统
 */

import { Router } from 'express';
import { FileController } from '../controllers/fileController';
import { cookieAuth } from '../middleware/cookieAuth';

const router = Router();
router.use(cookieAuth);

/**
 * @swagger
 * /api/files/search:
 *   get:
 *     summary: 搜索文件
 *     tags: [Files]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - in: query
 *         name: fileType
 *         schema:
 *           type: string
 *         description: 文件类型过滤
 *       - in: query
 *         name: taskId
 *         schema:
 *           type: integer
 *         description: 任务ID过滤
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: 搜索成功
 */
router.get('/search', FileController.searchFiles);

/**
 * @swagger
 * /api/files/task/{taskId}:
 *   get:
 *     summary: 获取任务的文件列表
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: fileType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/task/:taskId', FileController.getTaskFiles);

/**
 * @swagger
 * /api/files/{fileId}:
 *   get:
 *     summary: 获取文件详情
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 文件不存在
 *   delete:
 *     summary: 删除文件
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.get('/:fileId', FileController.getFileById);

/**
 * @swagger
 * /api/files/{fileId}/download:
 *   get:
 *     summary: 下载文件
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 文件流
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:fileId/download', FileController.downloadFile);

/**
 * @swagger
 * /api/files/{fileId}/preview:
 *   get:
 *     summary: 预览文件（支持图片和PDF）
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 文件流
 *       400:
 *         description: 文件类型不支持预览
 */
router.get('/:fileId/preview', FileController.previewFile);

router.delete('/:fileId', FileController.deleteFile);

export default router;
