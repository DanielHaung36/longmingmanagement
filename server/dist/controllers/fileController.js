"use strict";
/**
 * FileController - 文件查询和预览控制器
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileController = void 0;
const taskFileService_1 = require("../services/taskFileService");
const oneDriveApiService_1 = require("../services/oneDriveApiService");
const logger_1 = require("../utils/logger");
const responseBuilder_1 = require("../utils/responseBuilder");
const fs = __importStar(require("fs-extra"));
const mime = __importStar(require("mime-types"));
class FileController {
    /**
     * GET /api/files/task/:taskId
     * 获取Task的文件列表
     */
    static async getTaskFiles(req, res) {
        try {
            const { taskId } = req.params;
            const { page, limit, fileType } = req.query;
            const result = await taskFileService_1.TaskFileService.getTaskFiles(parseInt(taskId), {
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined,
                fileType: fileType,
            });
            // 转换 BigInt 为 string
            const serializedResult = {
                ...result,
                files: result.files.map((file) => ({
                    ...file,
                    fileSize: file.fileSize.toString(),
                })),
            };
            res.status(200).json(responseBuilder_1.ResponseBuilder.success(serializedResult, '查询成功'));
        }
        catch (error) {
            logger_1.logger.error('获取文件列表失败', { error: error.message });
            res.status(500).json(responseBuilder_1.ResponseBuilder.error(error.message, responseBuilder_1.ErrorCode.INTERNAL_ERROR));
        }
    }
    /**
     * GET /api/files/:fileId
     * 获取单个文件详情
     */
    static async getFileById(req, res) {
        try {
            const { fileId } = req.params;
            const file = await taskFileService_1.TaskFileService.getFileById(parseInt(fileId));
            if (!file) {
                res.status(404).json(responseBuilder_1.ResponseBuilder.error('文件不存在', responseBuilder_1.ErrorCode.NOT_FOUND));
                return;
            }
            // 转换 BigInt 为 string
            const serializedFile = {
                ...file,
                fileSize: file.fileSize.toString(),
            };
            res.status(200).json(responseBuilder_1.ResponseBuilder.success(serializedFile, '查询成功'));
        }
        catch (error) {
            logger_1.logger.error('获取文件详情失败', { error: error.message });
            res.status(500).json(responseBuilder_1.ResponseBuilder.error(error.message, responseBuilder_1.ErrorCode.INTERNAL_ERROR));
        }
    }
    /**
     * GET /api/files/:fileId/download
     * 下载文件
     */
    static async downloadFile(req, res) {
        try {
            const { fileId } = req.params;
            const file = await taskFileService_1.TaskFileService.getFileById(parseInt(fileId));
            if (!file) {
                res.status(404).json(responseBuilder_1.ResponseBuilder.error('文件不存在', responseBuilder_1.ErrorCode.NOT_FOUND));
                return;
            }
            // 增加下载计数
            await taskFileService_1.TaskFileService.incrementDownloadCount(parseInt(fileId));
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
                const buffer = await oneDriveApiService_1.OneDriveApiService.downloadFileAsBuffer(file.oneDrivePath);
                if (buffer) {
                    res.setHeader('Content-Type', mimeType);
                    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.fileName)}"`);
                    res.setHeader('Content-Length', buffer.length.toString());
                    res.send(buffer);
                    return;
                }
            }
            res.status(404).json(responseBuilder_1.ResponseBuilder.error('文件物理路径不存在', responseBuilder_1.ErrorCode.NOT_FOUND));
        }
        catch (error) {
            logger_1.logger.error('下载文件失败', { error: error.message });
            res.status(500).json(responseBuilder_1.ResponseBuilder.error(error.message, responseBuilder_1.ErrorCode.INTERNAL_ERROR));
        }
    }
    /**
     * GET /api/files/:fileId/preview
     * 预览文件（支持图片、PDF等）
     */
    static async previewFile(req, res) {
        try {
            const { fileId } = req.params;
            const file = await taskFileService_1.TaskFileService.getFileById(parseInt(fileId));
            if (!file) {
                res.status(404).json(responseBuilder_1.ResponseBuilder.error('文件不存在', responseBuilder_1.ErrorCode.NOT_FOUND));
                return;
            }
            // 检查文件类型是否支持预览
            const previewableTypes = ['image/', 'application/pdf', 'text/'];
            const mimeType = mime.lookup(file.fileName) || '';
            const canPreview = previewableTypes.some(type => mimeType.startsWith(type));
            if (!canPreview) {
                res.status(400).json(responseBuilder_1.ResponseBuilder.error('该文件类型不支持在线预览', responseBuilder_1.ErrorCode.VALIDATION_ERROR));
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
                const buffer = await oneDriveApiService_1.OneDriveApiService.downloadFileAsBuffer(file.oneDrivePath);
                if (buffer) {
                    res.setHeader('Content-Type', mimeType);
                    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`);
                    res.setHeader('Content-Length', buffer.length.toString());
                    res.send(buffer);
                    return;
                }
            }
            res.status(404).json(responseBuilder_1.ResponseBuilder.error('文件物理路径不存在', responseBuilder_1.ErrorCode.NOT_FOUND));
        }
        catch (error) {
            logger_1.logger.error('预览文件失败', { error: error.message });
            res.status(500).json(responseBuilder_1.ResponseBuilder.error(error.message, responseBuilder_1.ErrorCode.INTERNAL_ERROR));
        }
    }
    /**
     * DELETE /api/files/:fileId
     * 删除文件
     */
    static async deleteFile(req, res) {
        try {
            const { fileId } = req.params;
            const userId = req.user?.id || 84;
            const result = await taskFileService_1.TaskFileService.deleteFile(parseInt(fileId), true);
            res.status(200).json(responseBuilder_1.ResponseBuilder.success(result, '文件删除成功'));
        }
        catch (error) {
            logger_1.logger.error('删除文件失败', { error: error.message });
            res.status(500).json(responseBuilder_1.ResponseBuilder.error(error.message, responseBuilder_1.ErrorCode.INTERNAL_ERROR));
        }
    }
    /**
     * GET /api/files/search
     * 搜索文件
     */
    static async searchFiles(req, res) {
        try {
            const { query, fileType, taskId, page, limit } = req.query;
            const result = await taskFileService_1.TaskFileService.searchFiles({
                query: query,
                fileType: fileType,
                taskId: taskId ? parseInt(taskId) : undefined,
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined,
            });
            // 转换 BigInt 为 string
            const serializedResult = {
                ...result,
                files: result.files.map((file) => ({
                    ...file,
                    fileSize: file.fileSize.toString(),
                })),
            };
            res.status(200).json(responseBuilder_1.ResponseBuilder.success(serializedResult, '搜索成功'));
        }
        catch (error) {
            logger_1.logger.error('搜索文件失败', { error: error.message });
            res.status(500).json(responseBuilder_1.ResponseBuilder.error(error.message, responseBuilder_1.ErrorCode.INTERNAL_ERROR));
        }
    }
}
exports.FileController = FileController;
//# sourceMappingURL=fileController.js.map