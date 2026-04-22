/**
 * TaskFileController - Task文件控制器
 */

import { Request, Response } from 'express';
import { TaskFileService } from '../services/taskFileService';
import { logger } from '../utils/logger';
import * as path from 'path';
import * as fs from 'fs-extra';

export class TaskFileController {
  /**
   * 上传文件到Task
   */
  static async uploadFile(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;
      const file = req.file; // 来自multer中间件

      if (!file) {
        res.status(400).json({
          success: false,
          message: '未提供文件',
        });
        return;
      }

      const userId = (req as any).user?.id || 84; // DevAdmin

      const fileRecord = await TaskFileService.uploadFile({
        taskId: parseInt(taskId),
        fileName: file.filename,
        originalName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        uploadedBy: userId,
        localPath: file.path,
      });

      res.status(201).json({
        success: true,
        message: '文件上传成功',
        data: fileRecord,
      });
    } catch (error: any) {
      logger.error('上传文件失败', { error: error.message });
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * 获取Task的文件列表
   */
  static async getTaskFiles(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;

      const files = await TaskFileService.getTaskFiles(parseInt(taskId));

      res.json({
        success: true,
        data: files,
      });
    } catch (error: any) {
      logger.error('获取Task文件列表失败', { error: error.message });
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * 删除文件
   */
  static async deleteFile(req: Request, res: Response): Promise<void> {
    try {
      const { fileId } = req.params;
      const { deletePhysical = true } = req.body;

      await TaskFileService.deleteFile(parseInt(fileId), deletePhysical);

      res.json({
        success: true,
        message: '文件删除成功',
      });
    } catch (error: any) {
      logger.error('删除文件失败', { error: error.message });
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * 获取文件详情
   */
  static async getFileById(req: Request, res: Response): Promise<void> {
    try {
      const { fileId } = req.params;

      const file = await TaskFileService.getFileById(parseInt(fileId));

      res.json({
        success: true,
        data: file,
      });
    } catch (error: any) {
      logger.error('获取文件详情失败', { error: error.message });
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * 下载文件
   */
  static async downloadFile(req: Request, res: Response): Promise<void> {
    try {
      const { fileId } = req.params;

      const file = await TaskFileService.getFileById(parseInt(fileId));

      if (!(await fs.pathExists(file.localPath))) {
        res.status(404).json({
          success: false,
          message: '文件不存在',
        });
        return;
      }

      res.download(file.localPath, file.originalName);
    } catch (error: any) {
      logger.error('下载文件失败', { error: error.message });
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * 移动文件到其他文件夹
   */
  static async moveFile(req: Request, res: Response): Promise<void> {
    try {
      const { fileId } = req.params;
      const { targetFolder } = req.body;

      if (!targetFolder) {
        res.status(400).json({
          success: false,
          message: '请提供目标文件夹名称',
        });
        return;
      }

      const updatedFile = await TaskFileService.moveFile(
        parseInt(fileId),
        targetFolder
      );

      res.json({
        success: true,
        message: '文件移动成功',
        data: updatedFile,
      });
    } catch (error: any) {
      logger.error('移动文件失败', { error: error.message });
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * 重命名文件（仅文件名，不含文件夹）
   */
  static async renameFile(req: Request, res: Response): Promise<void> {
    try {
      const { fileId } = req.params;
      const { newFileName } = req.body;

      if (!newFileName || newFileName.trim() === '') {
        res.status(400).json({
          success: false,
          message: '请提供新的文件名',
        });
        return;
      }

      const updatedFile = await TaskFileService.renameFile(
        parseInt(fileId),
        newFileName.trim()
      );

      res.json({
        success: true,
        message: '文件重命名成功',
        data: updatedFile,
      });
    } catch (error: any) {
      logger.error('重命名文件失败', { error: error.message });
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * 复制 OneDrive 路径到剪贴板（前端处理，此处返回路径）
   */
  static async getOneDrivePath(req: Request, res: Response): Promise<void> {
    try {
      const { fileId } = req.params;

      const file = await TaskFileService.getFileById(parseInt(fileId));

      if (!file.oneDrivePath) {
        res.status(404).json({
          success: false,
          message: '文件没有 OneDrive 路径',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          oneDrivePath: file.oneDrivePath,
        },
      });
    } catch (error: any) {
      logger.error('获取 OneDrive 路径失败', { error: error.message });
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}
