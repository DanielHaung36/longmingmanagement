/**
 * Task文件路由
 */

import { Router } from 'express';
import { TaskFileController } from '../controllers/taskFileController';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs-extra';

const router = Router();

// 配置multer存储
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'temp');
    await fs.ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

// ==================== Task 文件上传专用路由 ====================
// 说明：只处理文件上传和移动操作
// 文件查询、下载、删除等操作请使用 /api/files 路由

// 上传文件到Task（需要multer中间件）
router.post(
  '/tasks/:taskId/files',
  upload.single('file'),
  TaskFileController.uploadFile
);

// 移动文件到其他子文件夹（Task专用功能）
router.put('/files/:fileId/move', TaskFileController.moveFile);

// 重命名文件（仅文件名，不含文件夹路径）
router.put('/files/:fileId/rename', TaskFileController.renameFile);

// 获取文件的 OneDrive 路径
router.get('/files/:fileId/onedrive-path', TaskFileController.getOneDrivePath);

// 以下路由已整合到 fileRoutes.ts，避免重复定义
// GET /api/tasks/:taskId/files -> 使用 /api/files/task/:taskId
// GET /api/files/:fileId -> 使用 /api/files/:fileId
// GET /api/files/:fileId/download -> 使用 /api/files/:fileId/download
// DELETE /api/files/:fileId -> 使用 /api/files/:fileId

export default router;
