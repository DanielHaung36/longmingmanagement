"use strict";
/**
 * 文件夹预览控制器
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
exports.createShareLink = exports.approveFileDelete = exports.createFolder = exports.requestFileDelete = exports.uploadFileToFolder = exports.downloadFile = exports.browseFolderContents = exports.getProjectFolderContents = exports.getTaskFolderContents = void 0;
const client_1 = require("@prisma/client");
const folderPreviewService_1 = require("../services/folderPreviewService");
const auditService_1 = require("../services/auditService");
const oneDriveApiService_1 = require("../services/oneDriveApiService");
const logger_1 = require("../utils/logger");
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const prisma = new client_1.PrismaClient();
/**
 * 获取Task的文件夹内容
 * GET /api/folders/task/:taskId
 */
const getTaskFolderContents = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { subfolder } = req.query;
        const result = await folderPreviewService_1.FolderPreviewService.getTaskFolderContents(parseInt(taskId), subfolder);
        res.json({
            success: true,
            message: "文件夹内容获取成功",
            data: result,
        });
    }
    catch (error) {
        logger_1.logger.error("获取Task文件夹内容失败", {
            taskId: req.params.taskId,
            error: error.message,
        });
        res.status(500).json({
            success: false,
            message: `获取文件夹内容失败: ${error.message}`,
        });
    }
};
exports.getTaskFolderContents = getTaskFolderContents;
/**
 * 获取Project的文件夹内容
 * GET /api/folders/project/:projectId
 */
const getProjectFolderContents = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { subfolder, folderType } = req.query;
        const result = await folderPreviewService_1.FolderPreviewService.getProjectFolderContents(parseInt(projectId), subfolder, folderType);
        res.json({
            success: true,
            message: "文件夹内容获取成功",
            data: result,
        });
    }
    catch (error) {
        logger_1.logger.error("获取Project文件夹内容失败", {
            projectId: parseInt(req.params.projectId),
            error: error.message,
        });
        res.status(500).json({
            success: false,
            message: `获取文件夹内容失败: ${error.message}`,
        });
    }
};
exports.getProjectFolderContents = getProjectFolderContents;
/**
 * 获取文件夹内容（通用）
 * GET /api/folders/browse
 */
const browseFolderContents = async (req, res) => {
    try {
        const { path: folderPath, isOneDrive } = req.query;
        if (!folderPath) {
            res.status(400).json({
                success: false,
                message: "缺少path参数",
            });
            return;
        }
        const result = await folderPreviewService_1.FolderPreviewService.getFolderContents(folderPath, isOneDrive === "true");
        res.json({
            success: true,
            message: "文件夹内容获取成功",
            data: result,
        });
    }
    catch (error) {
        logger_1.logger.error("浏览文件夹失败", {
            path: req.query.path,
            error: error.message,
        });
        res.status(500).json({
            success: false,
            message: `浏览文件夹失败: ${error.message}`,
        });
    }
};
exports.browseFolderContents = browseFolderContents;
/**
 * 下载文件
 * GET /api/folders/download
 */
const downloadFile = async (req, res) => {
    try {
        const { path: filePath } = req.query;
        if (!filePath) {
            res.status(400).json({
                success: false,
                message: "缺少path参数",
            });
            return;
        }
        const filePathStr = filePath;
        const fileName = path.basename(filePathStr);
        // 尝试本地下载
        if (await fs.pathExists(filePathStr)) {
            const stats = await fs.stat(filePathStr);
            if (!stats.isFile()) {
                res.status(400).json({ success: false, message: "只能下载文件，不能下载文件夹" });
                return;
            }
            res.setHeader("Content-Type", "application/octet-stream");
            res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
            res.setHeader("Content-Length", stats.size.toString());
            const fileStream = fs.createReadStream(filePathStr);
            fileStream.pipe(res);
            fileStream.on("error", (error) => {
                logger_1.logger.error("文件流读取错误", { filePath: filePathStr, error });
                if (!res.headersSent) {
                    res.status(500).json({ success: false, message: "文件下载失败" });
                }
            });
            logger_1.logger.info("本地文件下载成功", { filePath: filePathStr, fileName });
            return;
        }
        // 本地不存在，尝试从 OneDrive 下载
        const buffer = await oneDriveApiService_1.OneDriveApiService.downloadFileAsBuffer(filePathStr);
        if (buffer) {
            res.setHeader("Content-Type", "application/octet-stream");
            res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
            res.setHeader("Content-Length", buffer.length.toString());
            res.send(buffer);
            logger_1.logger.info("OneDrive文件下载成功", { filePath: filePathStr, fileName });
            return;
        }
        res.status(404).json({ success: false, message: "文件不存在" });
    }
    catch (error) {
        logger_1.logger.error("下载文件失败", {
            path: req.query.path,
            error: error.message,
        });
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: `下载文件失败: ${error.message}`,
            });
        }
    }
};
exports.downloadFile = downloadFile;
/**
 * 上传文件到指定文件夹（并记录到数据库）
 * POST /api/folders/upload
 */
const uploadFileToFolder = async (req, res) => {
    try {
        const { targetPath, taskId } = req.body;
        const file = req.file;
        const sessionUserId = req.user?.id;
        if (!file) {
            res.status(400).json({
                success: false,
                message: "没有上传文件",
            });
            return;
        }
        if (!taskId) {
            res.status(400).json({
                success: false,
                message: "缺少taskId参数",
            });
            return;
        }
        const numericTaskId = parseInt(taskId);
        const task = await prisma.tasks.findUnique({
            where: { id: numericTaskId },
            select: {
                id: true,
                taskCode: true,
                localFolderPath: true,
                oneDriveFolderPath: true,
            },
        });
        if (!task) {
            res.status(404).json({
                success: false,
                message: `Task不存在: ${taskId}`,
            });
            return;
        }
        if (!task.oneDriveFolderPath) {
            logger_1.logger.warn("尝试上传文件但Task未配置OneDrive路径", {
                taskId: numericTaskId,
                fileName: file.originalname,
            });
            res.status(400).json({
                success: false,
                message: "该任务未配置 OneDrive 文件夹，无法上传文件",
            });
            return;
        }
        const normalizedTargetPath = targetPath
            ? path.normalize(targetPath)
            : path.normalize(task.oneDriveFolderPath);
        const normalizedOneDriveRoot = path.normalize(task.oneDriveFolderPath);
        let relativeSubPath = path.relative(normalizedOneDriveRoot, normalizedTargetPath);
        if (relativeSubPath === '' || relativeSubPath === '.') {
            relativeSubPath = '';
        }
        if (relativeSubPath.includes('..')) {
            logger_1.logger.warn("上传路径不在任务的OneDrive目录下", {
                taskId: numericTaskId,
                targetPath,
                normalizedTargetPath,
            });
            res.status(400).json({
                success: false,
                message: "上传路径不在任务的 OneDrive 文件夹内，已拒绝操作",
            });
            return;
        }
        const oneDriveTargetDir = relativeSubPath
            ? task.oneDriveFolderPath + "/" + relativeSubPath
            : task.oneDriveFolderPath;
        const oneDriveFilePath = oneDriveTargetDir + "/" + file.originalname;
        // 通过 Graph API 上传到 OneDrive
        const fileBuffer = await fs.readFile(file.path);
        await oneDriveApiService_1.OneDriveApiService.ensureFolder(oneDriveTargetDir);
        const uploadResult = await oneDriveApiService_1.OneDriveApiService.uploadFile(oneDriveFilePath, fileBuffer);
        if (!uploadResult.success && !uploadResult.skipped) {
            logger_1.logger.warn("上传到OneDrive失败", { error: uploadResult.error });
        }
        // 清理临时文件
        await fs.remove(file.path).catch(() => { });
        let localSyncStatus = "SUCCESS";
        let localSyncError;
        let localFilePath;
        let expectedLocalPath;
        if (!task.localFolderPath) {
            localSyncStatus = "SKIPPED_NO_LOCAL_PATH";
            localSyncError = "Task 未配置本地文件夹，已跳过本地同步";
        }
        else {
            const localTargetDir = relativeSubPath
                ? path.join(task.localFolderPath, relativeSubPath)
                : task.localFolderPath;
            expectedLocalPath = path.join(localTargetDir, file.originalname);
            try {
                await fs.ensureDir(localTargetDir);
                await fs.writeFile(expectedLocalPath, fileBuffer);
                localFilePath = expectedLocalPath;
            }
            catch (copyError) {
                const errorMessage = copyError instanceof Error ? copyError.message : String(copyError);
                localSyncStatus = "FAILED";
                localSyncError = errorMessage;
                logger_1.logger.error("同步文件到本地失败", {
                    taskId: numericTaskId,
                    fileName: file.originalname,
                    error: errorMessage,
                });
            }
        }
        const fileRelativePath = relativeSubPath
            ? path.join(relativeSubPath, file.originalname)
            : file.originalname;
        let fileType = "OTHER";
        const ext = path.extname(file.originalname).toLowerCase();
        if ([".doc", ".docx", ".pdf", ".txt", ".xls", ".xlsx"].includes(ext)) {
            fileType = "DOCUMENT";
        }
        else if ([".dwg", ".dxf", ".rvt"].includes(ext)) {
            fileType = "CAD_DRAWING";
        }
        else if ([".jpg", ".jpeg", ".png", ".gif", ".bmp"].includes(ext)) {
            fileType = "IMAGE";
        }
        else if ([".mp4", ".avi", ".mov"].includes(ext)) {
            fileType = "VIDEO";
        }
        else if ([".csv", ".dat", ".json"].includes(ext)) {
            fileType = "DATA";
        }
        else if ([".zip", ".rar", ".7z", ".tar"].includes(ext)) {
            fileType = "ARCHIVE";
        }
        let uploaderId = sessionUserId ?? null;
        if (uploaderId) {
            const uploaderExists = await prisma.users.findUnique({
                where: { id: uploaderId },
                select: { id: true },
            });
            if (!uploaderExists) {
                uploaderId = null;
            }
        }
        if (!uploaderId) {
            const fallbackUser = await prisma.users.findFirst({
                select: { id: true },
                orderBy: { id: "asc" },
            });
            if (!fallbackUser) {
                throw new Error("No available user found to attribute upload");
            }
            uploaderId = fallbackUser.id;
        }
        const fileRecord = await prisma.task_files.create({
            data: {
                taskId: numericTaskId,
                fileName: file.originalname,
                fileType,
                fileSize: BigInt(file.size),
                mimeType: file.mimetype,
                localPath: localFilePath ?? oneDriveFilePath,
                oneDrivePath: oneDriveFilePath,
                relativePath: fileRelativePath,
                md5Hash: "",
                uploadStatus: "COMPLETED",
                uploadProgress: 100,
                chunkSize: file.size,
                uploadedBy: uploaderId,
                tags: [],
                version: 1,
                isPublic: false,
                downloadCount: 0,
            },
        });
        if (localSyncStatus === "FAILED") {
            try {
                await prisma.audit_logs.create({
                    data: {
                        tableName: "task_files",
                        recordId: fileRecord.id,
                        action: "LOCAL_SYNC_FAILED",
                        changes: {
                            taskId: numericTaskId,
                            fileName: file.originalname,
                            oneDrivePath: oneDriveFilePath,
                            expectedLocalPath,
                            error: localSyncError,
                        },
                        userId: uploaderId,
                        ipAddress: req.ip,
                        userAgent: req.headers["user-agent"],
                    },
                });
            }
            catch (auditError) {
                const errorMessage = auditError instanceof Error ? auditError.message : String(auditError);
                logger_1.logger.warn("写入活动日志失败", {
                    taskId: numericTaskId,
                    fileName: file.originalname,
                    error: errorMessage,
                });
            }
        }
        logger_1.logger.info("文件上传成功", {
            fileName: file.originalname,
            taskId: numericTaskId,
            oneDrivePath: oneDriveFilePath,
            localSyncStatus,
        });
        // 记录审计日志
        await auditService_1.AuditService.logFileUpload(fileRecord.id, file.originalname, numericTaskId, uploaderId, req.ip, req.headers["user-agent"]);
        res.json({
            success: true,
            message: localSyncStatus === "FAILED"
                ? "文件上传成功，但同步本地失败"
                : localSyncStatus === "SKIPPED_NO_LOCAL_PATH"
                    ? "文件已上传到 OneDrive（未配置本地同步）"
                    : "文件上传成功",
            data: {
                fileName: file.originalname,
                filePath: oneDriveFilePath,
                size: file.size,
                localSyncStatus,
                localSyncError,
                localPath: localFilePath ?? null,
                oneDrivePath: oneDriveFilePath,
            },
        });
    }
    catch (error) {
        if (req.file?.path && (await fs.pathExists(req.file.path))) {
            await fs.remove(req.file.path).catch(() => undefined);
        }
        logger_1.logger.error("上传文件失败", {
            error: error.message,
        });
        res.status(500).json({
            success: false,
            message: `上传文件失败: ${error.message}`,
        });
    }
};
exports.uploadFileToFolder = uploadFileToFolder;
/**
 * 请求删除文件（需要审批）
 * POST /api/folders/request-delete
 */
const requestFileDelete = async (req, res) => {
    try {
        const { fileId, reason } = req.body;
        const userId = req.user?.id || 11;
        if (!fileId) {
            res.status(400).json({
                success: false,
                message: "缺少fileId参数",
            });
            return;
        }
        // 检查文件是否存在
        const file = await prisma.task_files.findUnique({
            where: { id: fileId },
        });
        if (!file) {
            res.status(404).json({
                success: false,
                message: "文件不存在",
            });
            return;
        }
        // 更新文件状态为DELETE_PENDING
        const updatedFile = await prisma.task_files.update({
            where: { id: fileId },
            data: {
                uploadStatus: "CANCELLED", // 使用CANCELLED状态表示待删除
                // TODO: 添加deleteRequestedBy, deleteReason字段到schema
            },
        });
        logger_1.logger.info("文件删除请求已提交", {
            fileId,
            fileName: file.fileName,
            reason,
            requestedBy: userId,
        });
        // 记录审计日志
        await auditService_1.AuditService.logFileDeleteRequest(fileId, file.fileName, reason, userId, req.ip, req.headers["user-agent"]);
        res.json({
            success: true,
            message: "文件删除请求已提交，等待审批",
            data: updatedFile,
        });
    }
    catch (error) {
        logger_1.logger.error("请求删除文件失败", {
            error: error.message,
        });
        res.status(500).json({
            success: false,
            message: `请求删除文件失败: ${error.message}`,
        });
    }
};
exports.requestFileDelete = requestFileDelete;
/**
 * 创建新文件夹
 * POST /api/folders/create-folder
 */
const createFolder = async (req, res) => {
    try {
        const { targetPath, folderName, taskId } = req.body;
        if (!folderName || !folderName.trim()) {
            res.status(400).json({
                success: false,
                message: "文件夹名称不能为空",
            });
            return;
        }
        if (!taskId) {
            res.status(400).json({
                success: false,
                message: "缺少taskId参数",
            });
            return;
        }
        const task = await prisma.tasks.findUnique({
            where: { id: parseInt(taskId) },
            select: {
                id: true,
                taskCode: true,
                localFolderPath: true,
                oneDriveFolderPath: true,
            },
        });
        if (!task) {
            res.status(404).json({
                success: false,
                message: `Task不存在: ${taskId}`,
            });
            return;
        }
        if (!task.oneDriveFolderPath) {
            res.status(400).json({
                success: false,
                message: "该任务未配置 OneDrive 文件夹",
            });
            return;
        }
        // 清理文件夹名称，移除危险字符
        const sanitizedFolderName = folderName.replace(/[<>:"/\\|?*]/g, '_').trim();
        // 确定创建路径
        const oneDriveTargetDir = targetPath || task.oneDriveFolderPath;
        const newOneDriveFolderPath = oneDriveTargetDir.replace(/\\/g, "/") + "/" + sanitizedFolderName;
        // 检查文件夹是否已存在（通过 Graph API）
        if (await oneDriveApiService_1.OneDriveApiService.folderExists(newOneDriveFolderPath)) {
            res.status(409).json({
                success: false,
                message: "文件夹已存在",
            });
            return;
        }
        // 通过 Graph API 创建 OneDrive 文件夹
        const createResult = await oneDriveApiService_1.OneDriveApiService.createFolder(newOneDriveFolderPath);
        if (!createResult.success && !createResult.skipped) {
            throw new Error(`创建OneDrive文件夹失败: ${createResult.error}`);
        }
        // 同步创建 Local 文件夹
        let localSyncStatus = "SUCCESS";
        let localSyncError;
        let newLocalFolderPath;
        if (!task.localFolderPath) {
            localSyncStatus = "SKIPPED_NO_LOCAL_PATH";
            localSyncError = "Task 未配置本地文件夹，已跳过本地同步";
        }
        else {
            // 计算相对路径
            const relativeSubPath = path.relative(task.oneDriveFolderPath, oneDriveTargetDir);
            const localTargetDir = relativeSubPath && relativeSubPath !== '.'
                ? path.join(task.localFolderPath, relativeSubPath)
                : task.localFolderPath;
            newLocalFolderPath = path.join(localTargetDir, sanitizedFolderName);
            try {
                await fs.ensureDir(newLocalFolderPath);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                localSyncStatus = "FAILED";
                localSyncError = errorMessage;
                logger_1.logger.error("同步文件夹到本地失败", {
                    taskId: task.id,
                    folderName: sanitizedFolderName,
                    error: errorMessage,
                });
            }
        }
        logger_1.logger.info("文件夹创建成功", {
            taskId: task.id,
            folderName: sanitizedFolderName,
            oneDrivePath: newOneDriveFolderPath,
            localSyncStatus,
        });
        // 记录审计日志
        const sessionUserId = req.user?.id || null;
        await auditService_1.AuditService.logFolderCreate(task.id, sanitizedFolderName, newOneDriveFolderPath, sessionUserId, req.ip, req.headers["user-agent"]);
        res.json({
            success: true,
            message: localSyncStatus === "FAILED"
                ? "文件夹创建成功，但同步本地失败"
                : localSyncStatus === "SKIPPED_NO_LOCAL_PATH"
                    ? "文件夹已创建到 OneDrive（未配置本地同步）"
                    : "文件夹创建成功",
            data: {
                folderName: sanitizedFolderName,
                oneDrivePath: newOneDriveFolderPath,
                localPath: newLocalFolderPath ?? null,
                localSyncStatus,
                localSyncError,
            },
        });
    }
    catch (error) {
        logger_1.logger.error("创建文件夹失败", {
            error: error.message,
        });
        res.status(500).json({
            success: false,
            message: `创建文件夹失败: ${error.message}`,
        });
    }
};
exports.createFolder = createFolder;
/**
 * 审批文件删除请求
 * POST /api/folders/approve-delete
 */
const approveFileDelete = async (req, res) => {
    try {
        const { fileId, approved, comment } = req.body;
        const approverId = req.user?.id || 11;
        if (!fileId) {
            res.status(400).json({
                success: false,
                message: "缺少fileId参数",
            });
            return;
        }
        const file = await prisma.task_files.findUnique({
            where: { id: fileId },
        });
        if (!file) {
            res.status(404).json({
                success: false,
                message: "文件不存在",
            });
            return;
        }
        if (approved) {
            // 审批通过：删除物理文件和数据库记录
            try {
                // 删除本地文件
                if (file.localPath && (await fs.pathExists(file.localPath))) {
                    await fs.remove(file.localPath);
                    logger_1.logger.info("本地文件已删除", { path: file.localPath });
                }
                // 通过 Graph API 删除 OneDrive 文件
                if (file.oneDrivePath) {
                    await oneDriveApiService_1.OneDriveApiService.deleteItem(file.oneDrivePath);
                    logger_1.logger.info("OneDrive文件已删除", { path: file.oneDrivePath });
                }
            }
            catch (error) {
                logger_1.logger.warn("删除物理文件失败（可能已被手动删除）", { error });
            }
            // 删除数据库记录
            await prisma.task_files.delete({
                where: { id: fileId },
            });
            logger_1.logger.info("文件删除审批通过", {
                fileId,
                fileName: file.fileName,
                approvedBy: approverId,
            });
            // 记录审计日志
            await auditService_1.AuditService.logFileDeleteApproval(fileId, file.fileName, true, comment, approverId, req.ip, req.headers["user-agent"]);
            res.json({
                success: true,
                message: "文件删除审批通过，文件已删除",
                data: { id: fileId, fileName: file.fileName },
            });
        }
        else {
            // 审批拒绝：恢复文件状态
            const restoredFile = await prisma.task_files.update({
                where: { id: fileId },
                data: {
                    uploadStatus: "COMPLETED",
                },
            });
            logger_1.logger.info("文件删除审批拒绝", {
                fileId,
                comment,
            });
            // 记录审计日志
            await auditService_1.AuditService.logFileDeleteApproval(fileId, file.fileName, false, comment, approverId, req.ip, req.headers["user-agent"]);
            res.json({
                success: true,
                message: "文件删除请求已拒绝",
                data: restoredFile,
            });
        }
    }
    catch (error) {
        logger_1.logger.error("审批文件删除失败", {
            error: error.message,
        });
        res.status(500).json({
            success: false,
            message: `审批文件删除失败: ${error.message}`,
        });
    }
};
exports.approveFileDelete = approveFileDelete;
/**
 * POST /api/folders/share-link
 * 创建 OneDrive 文件/文件夹分享链接
 */
const createShareLink = async (req, res) => {
    try {
        const { path: filePath } = req.query;
        if (!filePath) {
            res.status(400).json({ success: false, message: "缺少path参数" });
            return;
        }
        const url = await oneDriveApiService_1.OneDriveApiService.createShareLink(filePath);
        if (!url) {
            res.status(500).json({ success: false, message: "创建分享链接失败" });
            return;
        }
        res.json({ success: true, url });
    }
    catch (error) {
        logger_1.logger.error("创建分享链接失败", { path: req.query.path, error: error.message });
        res.status(500).json({ success: false, message: "创建分享链接失败" });
    }
};
exports.createShareLink = createShareLink;
//# sourceMappingURL=folderPreviewController.js.map