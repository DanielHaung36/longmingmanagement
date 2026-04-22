/**
 * FileController - 文件查询和预览控制器
 */

import { Request, Response } from 'express';
import { TaskFileService } from '../services/taskFileService';
import { OneDriveApiService } from '../services/oneDriveApiService';
import { logger } from '../utils/logger';
import { ResponseBuilder, ErrorCode } from '../utils/responseBuilder';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as mime from 'mime-types';

export class FileController {
  /**
   * GET /api/files/task/:taskId
   * 获取Task的文件列表
   */
  static async getTaskFiles(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;
      const { page, limit, fileType } = req.query;

      const result = await TaskFileService.getTaskFiles(parseInt(taskId), {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        fileType: fileType as any,
      });

      // 转换 BigInt 为 string
      const serializedResult = {
        ...result,
        files: result.files.map((file: any) => ({
          ...file,
          fileSize: file.fileSize.toString(),
        })),
      };

      res.status(200).json(
        ResponseBuilder.success(serializedResult, '查询成功')
      );
    } catch (error: any) {
      logger.error('获取文件列表失败', { error: error.message });
      res.status(500).json(
        ResponseBuilder.error(error.message, ErrorCode.INTERNAL_ERROR)
      );
    }
  }

  /**
   * GET /api/files/:fileId
   * 获取单个文件详情
   */
  static async getFileById(req: Request, res: Response): Promise<void> {
    try {
      const { fileId } = req.params;

      const file = await TaskFileService.getFileById(parseInt(fileId));

      if (!file) {
        res.status(404).json(
          ResponseBuilder.error('文件不存在', ErrorCode.NOT_FOUND)
        );
        return;
      }

      // 转换 BigInt 为 string
      const serializedFile = {
        ...file,
        fileSize: file.fileSize.toString(),
      };

      res.status(200).json(
        ResponseBuilder.success(serializedFile, '查询成功')
      );
    } catch (error: any) {
      logger.error('获取文件详情失败', { error: error.message });
      res.status(500).json(
        ResponseBuilder.error(error.message, ErrorCode.INTERNAL_ERROR)
      );
    }
  }

  /**
   * GET /api/files/:fileId/download
   * 下载文件
   */
  static async downloadFile(req: Request, res: Response): Promise<void> {
    try {
      const { fileId } = req.params;

      const file = await TaskFileService.getFileById(parseInt(fileId));

      if (!file) {
        res.status(404).json(
          ResponseBuilder.error('文件不存在', ErrorCode.NOT_FOUND)
        );
        return;
      }

      // 增加下载计数
      await TaskFileService.incrementDownloadCount(parseInt(fileId));

      const mimeType = mime.lookup(file.fileName) || 'application/octet-stream';

      // 优先尝试本地文件
      if (await fs.pathExists(file.localPath)) {
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.fileName)}"`);
        res.setHeader('Content-Length', file.fileSize.toString());
        const fileStream = fs.createReadStream(file.localPath);
        fileStream.pipe(res);
        return;
      }

      // 本地不存在，尝试从 OneDrive 下载
      if (file.oneDrivePath) {
        const buffer = await OneDriveApiService.downloadFileAsBuffer(file.oneDrivePath);
        if (buffer) {
          res.setHeader('Content-Type', mimeType);
          res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.fileName)}"`);
          res.setHeader('Content-Length', buffer.length.toString());
          res.send(buffer);
          return;
        }
      }

      res.status(404).json(
        ResponseBuilder.error('文件物理路径不存在', ErrorCode.NOT_FOUND)
      );
    } catch (error: any) {
      logger.error('下载文件失败', { error: error.message });
      res.status(500).json(
        ResponseBuilder.error(error.message, ErrorCode.INTERNAL_ERROR)
      );
    }
  }

  /**
   * GET /api/files/:fileId/preview
   * 预览文件（支持图片、PDF等）
   */
  static async previewFile(req: Request, res: Response): Promise<void> {
    try {
      const { fileId } = req.params;

      const file = await TaskFileService.getFileById(parseInt(fileId));

      if (!file) {
        res.status(404).json(
          ResponseBuilder.error('文件不存在', ErrorCode.NOT_FOUND)
        );
        return;
      }

      // 检查文件类型是否支持预览
      const previewableTypes = ['image/', 'application/pdf', 'text/'];
      const mimeType = mime.lookup(file.fileName) || '';
      const canPreview = previewableTypes.some(type => mimeType.startsWith(type));

      if (!canPreview) {
        res.status(400).json(
          ResponseBuilder.error('该文件类型不支持在线预览', ErrorCode.VALIDATION_ERROR)
        );
        return;
      }

      // 优先尝试本地文件
      if (await fs.pathExists(file.localPath)) {
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`);
        res.setHeader('Content-Length', file.fileSize.toString());
        const fileStream = fs.createReadStream(file.localPath);
        fileStream.pipe(res);
        return;
      }

      // 本地不存在，尝试从 OneDrive 下载
      if (file.oneDrivePath) {
        const buffer = await OneDriveApiService.downloadFileAsBuffer(file.oneDrivePath);
        if (buffer) {
          res.setHeader('Content-Type', mimeType);
          res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`);
          res.setHeader('Content-Length', buffer.length.toString());
          res.send(buffer);
          return;
        }
      }

      res.status(404).json(
        ResponseBuilder.error('文件物理路径不存在', ErrorCode.NOT_FOUND)
      );
    } catch (error: any) {
      logger.error('预览文件失败', { error: error.message });
      res.status(500).json(
        ResponseBuilder.error(error.message, ErrorCode.INTERNAL_ERROR)
      );
    }
  }

  /**
   * DELETE /api/files/:fileId
   * 删除文件
   */
  static async deleteFile(req: Request, res: Response): Promise<void> {
    try {
      const { fileId } = req.params;
      const userId = (req as any).user?.id || 84;

      const result = await TaskFileService.deleteFile(parseInt(fileId), true);

      res.status(200).json(
        ResponseBuilder.success(result, '文件删除成功')
      );
    } catch (error: any) {
      logger.error('删除文件失败', { error: error.message });
      res.status(500).json(
        ResponseBuilder.error(error.message, ErrorCode.INTERNAL_ERROR)
      );
    }
  }

  /**
   * GET /api/files/search
   * 搜索文件
   */
  static async searchFiles(req: Request, res: Response): Promise<void> {
    try {
      const { query, fileType, taskId, page, limit } = req.query;

      const result = await TaskFileService.searchFiles({
        query: query as string,
        fileType: fileType as any,
        taskId: taskId ? parseInt(taskId as string) : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      // 转换 BigInt 为 string
      const serializedResult = {
        ...result,
        files: result.files.map((file: any) => ({
          ...file,
          fileSize: file.fileSize.toString(),
        })),
      };

      res.status(200).json(
        ResponseBuilder.success(serializedResult, '搜索成功')
      );
    } catch (error: any) {
      logger.error('搜索文件失败', { error: error.message });
      res.status(500).json(
        ResponseBuilder.error(error.message, ErrorCode.INTERNAL_ERROR)
      );
    }
  }
}
