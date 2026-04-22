"use strict";
/**
 * TaskFileController - Task文件控制器
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
exports.TaskFileController = void 0;
const taskFileService_1 = require("../services/taskFileService");
const logger_1 = require("../utils/logger");
const fs = __importStar(require("fs-extra"));
class TaskFileController {
    /**
     * 上传文件到Task
     */
    static async uploadFile(req, res) {
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
            const userId = req.user?.id || 84; // DevAdmin
            const fileRecord = await taskFileService_1.TaskFileService.uploadFile({
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
        }
        catch (error) {
            logger_1.logger.error('上传文件失败', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
    /**
     * 获取Task的文件列表
     */
    static async getTaskFiles(req, res) {
        try {
            const { taskId } = req.params;
            const files = await taskFileService_1.TaskFileService.getTaskFiles(parseInt(taskId));
            res.json({
                success: true,
                data: files,
            });
        }
        catch (error) {
            logger_1.logger.error('获取Task文件列表失败', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
    /**
     * 删除文件
     */
    static async deleteFile(req, res) {
        try {
            const { fileId } = req.params;
            const { deletePhysical = true } = req.body;
            await taskFileService_1.TaskFileService.deleteFile(parseInt(fileId), deletePhysical);
            res.json({
                success: true,
                message: '文件删除成功',
            });
        }
        catch (error) {
            logger_1.logger.error('删除文件失败', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
    /**
     * 获取文件详情
     */
    static async getFileById(req, res) {
        try {
            const { fileId } = req.params;
            const file = await taskFileService_1.TaskFileService.getFileById(parseInt(fileId));
            res.json({
                success: true,
                data: file,
            });
        }
        catch (error) {
            logger_1.logger.error('获取文件详情失败', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
    /**
     * 下载文件
     */
    static async downloadFile(req, res) {
        try {
            const { fileId } = req.params;
            const file = await taskFileService_1.TaskFileService.getFileById(parseInt(fileId));
            if (!(await fs.pathExists(file.localPath))) {
                res.status(404).json({
                    success: false,
                    message: '文件不存在',
                });
                return;
            }
            res.download(file.localPath, file.originalName);
        }
        catch (error) {
            logger_1.logger.error('下载文件失败', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
    /**
     * 移动文件到其他文件夹
     */
    static async moveFile(req, res) {
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
            const updatedFile = await taskFileService_1.TaskFileService.moveFile(parseInt(fileId), targetFolder);
            res.json({
                success: true,
                message: '文件移动成功',
                data: updatedFile,
            });
        }
        catch (error) {
            logger_1.logger.error('移动文件失败', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
    /**
     * 重命名文件（仅文件名，不含文件夹）
     */
    static async renameFile(req, res) {
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
            const updatedFile = await taskFileService_1.TaskFileService.renameFile(parseInt(fileId), newFileName.trim());
            res.json({
                success: true,
                message: '文件重命名成功',
                data: updatedFile,
            });
        }
        catch (error) {
            logger_1.logger.error('重命名文件失败', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
    /**
     * 复制 OneDrive 路径到剪贴板（前端处理，此处返回路径）
     */
    static async getOneDrivePath(req, res) {
        try {
            const { fileId } = req.params;
            const file = await taskFileService_1.TaskFileService.getFileById(parseInt(fileId));
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
        }
        catch (error) {
            logger_1.logger.error('获取 OneDrive 路径失败', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
}
exports.TaskFileController = TaskFileController;
//# sourceMappingURL=taskFileController.js.map