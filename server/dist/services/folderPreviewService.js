"use strict";
/**
 * 文件夹预览服务
 * 支持本地和OneDrive路径的文件夹/文件浏览
 * OneDrive 路径通过 Microsoft Graph API 访问
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
exports.FolderPreviewService = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const logger_1 = require("../utils/logger");
const oneDriveApiService_1 = require("./oneDriveApiService");
class FolderPreviewService {
    static ONEDRIVE_ROOT = process.env.ONEDRIVE_PROJECT_ROOT || ""; // 开发环境 OneDrive
    static ONEDRIVE_SOURCE_ROOT = process.env.ONEDRIVE_ROOT || ""; // 生产环境 OneDrive (只读源)
    static LOCAL_ROOT = process.env.LOCAL_PROJECT_ROOT || "";
    /**
     * 获取文件夹内容（文件和子文件夹列表）
     */
    static async getFolderContents(folderPath, isOneDrive = false) {
        try {
            logger_1.logger.info("获取文件夹内容", { folderPath, isOneDrive });
            if (isOneDrive) {
                return await this.getOneDriveFolderContents(folderPath);
            }
            // 本地文件系统
            const safePath = this.validateAndNormalizePath(folderPath, false);
            if (!(await fs.pathExists(safePath))) {
                throw new Error(`文件夹不存在: ${safePath}`);
            }
            const items = await fs.readdir(safePath);
            const fileItems = [];
            for (const item of items) {
                const itemPath = path.join(safePath, item);
                const stats = await fs.stat(itemPath);
                fileItems.push({
                    name: item,
                    path: itemPath,
                    type: stats.isDirectory() ? "folder" : "file",
                    size: stats.isFile() ? stats.size : undefined,
                    extension: stats.isFile() ? path.extname(item) : undefined,
                    modifiedAt: stats.mtime,
                    isOneDrive: false,
                });
            }
            fileItems.sort((a, b) => {
                if (a.type !== b.type)
                    return a.type === "folder" ? -1 : 1;
                return a.name.localeCompare(b.name);
            });
            const breadcrumbs = this.generateBreadcrumbs(safePath, false);
            return { path: safePath, items: fileItems, breadcrumbs, isOneDrive: false };
        }
        catch (error) {
            logger_1.logger.error("获取文件夹内容失败", { folderPath, error: error.message });
            throw error;
        }
    }
    /**
     * 通过 Graph API 获取 OneDrive 文件夹内容
     */
    static async getOneDriveFolderContents(folderPath) {
        const children = await oneDriveApiService_1.OneDriveApiService.listChildren(folderPath);
        const fileItems = children.map((child) => ({
            name: child.name,
            path: folderPath.replace(/\\/g, "/") + "/" + child.name,
            type: child.type,
            size: child.type === "file" ? child.size : undefined,
            extension: child.type === "file" ? path.extname(child.name) : undefined,
            modifiedAt: child.lastModifiedDateTime
                ? new Date(child.lastModifiedDateTime)
                : undefined,
            isOneDrive: true,
        }));
        fileItems.sort((a, b) => {
            if (a.type !== b.type)
                return a.type === "folder" ? -1 : 1;
            return a.name.localeCompare(b.name);
        });
        const breadcrumbs = this.generateBreadcrumbs(folderPath, true);
        return { path: folderPath, items: fileItems, breadcrumbs, isOneDrive: true };
    }
    /**
     * 获取Task的文件夹内容
     */
    static async getTaskFolderContents(taskId, subfolder) {
        try {
            const { PrismaClient } = await Promise.resolve().then(() => __importStar(require("@prisma/client")));
            const prisma = new PrismaClient();
            const task = await prisma.tasks.findUnique({
                where: { id: taskId },
                select: {
                    localFolderPath: true,
                    oneDriveFolderPath: true,
                },
            });
            if (!task) {
                throw new Error(`Task不存在: ${taskId}`);
            }
            let localContent = null;
            let onedriveContent = null;
            // 获取本地文件夹内容
            if (task.localFolderPath) {
                const localPath = subfolder
                    ? path.join(task.localFolderPath, subfolder)
                    : task.localFolderPath;
                if (await fs.pathExists(localPath)) {
                    localContent = await this.getFolderContents(localPath, false);
                }
            }
            // 获取OneDrive文件夹内容（通过 Graph API）
            // 只要 DB 里有 oneDriveFolderPath，就返回非 null（保证前端能显示 OneDrive 标签页）
            if (task.oneDriveFolderPath) {
                const onedrivePath = subfolder
                    ? task.oneDriveFolderPath + "/" + subfolder
                    : task.oneDriveFolderPath;
                try {
                    onedriveContent = await this.getOneDriveFolderContents(onedrivePath);
                }
                catch (error) {
                    logger_1.logger.warn("获取OneDrive文件夹内容失败，返回空内容占位", {
                        taskId,
                        onedrivePath,
                        error: error.message,
                    });
                    // 返回空内容而非 null：让前端知道路径已配置，只是暂时无法访问
                    onedriveContent = {
                        path: onedrivePath,
                        items: [],
                        breadcrumbs: this.generateBreadcrumbs(onedrivePath, true),
                        isOneDrive: true,
                    };
                }
            }
            return { local: localContent, onedrive: onedriveContent };
        }
        catch (error) {
            logger_1.logger.error("获取Task文件夹内容失败", {
                taskId,
                subfolder,
                error: error.message,
            });
            throw error;
        }
    }
    /**
     * 获取Project的文件夹内容
     */
    static async getProjectFolderContents(projectId, subfolder, folderType) {
        try {
            const { PrismaClient } = await Promise.resolve().then(() => __importStar(require("@prisma/client")));
            const prisma = new PrismaClient();
            const project = await prisma.projects.findUnique({
                where: { id: projectId },
                select: {
                    clientFolderPath: true,
                    mineSiteFolderPath: true,
                    oneDriveClientFolderPath: true,
                    oneDriveMineSiteFolderPath: true,
                },
            });
            if (!project) {
                throw new Error(`Project不存在: ${projectId}`);
            }
            let localClientContent = null;
            let onedriveClientContent = null;
            let localMinesiteContent = null;
            let onedriveMinesiteContent = null;
            if (!folderType || folderType === "client") {
                // 本地客户文件夹
                if (project.clientFolderPath) {
                    const localPath = subfolder
                        ? path.join(project.clientFolderPath, subfolder)
                        : project.clientFolderPath;
                    if (await fs.pathExists(localPath)) {
                        localClientContent = await this.getFolderContents(localPath, false);
                    }
                }
                // OneDrive客户文件夹（Graph API）
                if (project.oneDriveClientFolderPath) {
                    try {
                        const onedrivePath = subfolder
                            ? project.oneDriveClientFolderPath + "/" + subfolder
                            : project.oneDriveClientFolderPath;
                        const exists = await oneDriveApiService_1.OneDriveApiService.folderExists(onedrivePath);
                        if (exists) {
                            onedriveClientContent = await this.getOneDriveFolderContents(onedrivePath);
                        }
                    }
                    catch (e) {
                        logger_1.logger.warn("获取OneDrive客户文件夹失败", { error: e.message });
                    }
                }
            }
            if (!folderType || folderType === "minesite") {
                // 本地矿区文件夹
                if (project.mineSiteFolderPath) {
                    const localPath = subfolder
                        ? path.join(project.mineSiteFolderPath, subfolder)
                        : project.mineSiteFolderPath;
                    if (await fs.pathExists(localPath)) {
                        localMinesiteContent = await this.getFolderContents(localPath, false);
                    }
                }
                // OneDrive矿区文件夹（Graph API）
                if (project.oneDriveMineSiteFolderPath) {
                    try {
                        const onedrivePath = subfolder
                            ? project.oneDriveMineSiteFolderPath + "/" + subfolder
                            : project.oneDriveMineSiteFolderPath;
                        const exists = await oneDriveApiService_1.OneDriveApiService.folderExists(onedrivePath);
                        if (exists) {
                            onedriveMinesiteContent = await this.getOneDriveFolderContents(onedrivePath);
                        }
                    }
                    catch (e) {
                        logger_1.logger.warn("获取OneDrive矿区文件夹失败", { error: e.message });
                    }
                }
            }
            return {
                localClient: localClientContent,
                onedriveClient: onedriveClientContent,
                localMinesite: localMinesiteContent,
                onedriveMinesite: onedriveMinesiteContent,
            };
        }
        catch (error) {
            logger_1.logger.error("获取Project文件夹内容失败", {
                projectId,
                subfolder,
                folderType,
                error: error.message,
            });
            throw error;
        }
    }
    /**
     * 验证并规范化路径（防止路径遍历攻击）
     */
    static validateAndNormalizePath(inputPath, isOneDrive) {
        const validRoots = isOneDrive
            ? [this.ONEDRIVE_ROOT, this.ONEDRIVE_SOURCE_ROOT].filter((root) => root)
            : [this.LOCAL_ROOT].filter((root) => root);
        const normalizedPath = path.normalize(inputPath);
        const isValid = validRoots.some((root) => {
            const normalizedRoot = path.normalize(root);
            return normalizedPath.startsWith(normalizedRoot);
        });
        if (!isValid) {
            logger_1.logger.warn(`路径验证失败`, { inputPath, normalizedPath, validRoots, isOneDrive });
            throw new Error(`非法路径访问: ${inputPath}`);
        }
        return normalizedPath;
    }
    /**
     * 生成面包屑导航
     */
    static generateBreadcrumbs(currentPath, isOneDrive) {
        const rootPath = isOneDrive ? this.ONEDRIVE_ROOT : this.LOCAL_ROOT;
        const normalizedCurrent = currentPath.replace(/\\/g, "/");
        const normalizedRoot = rootPath.replace(/\\/g, "/");
        const relativePath = normalizedCurrent.startsWith(normalizedRoot)
            ? normalizedCurrent.substring(normalizedRoot.length).replace(/^\//, "")
            : "";
        const breadcrumbs = [
            { name: isOneDrive ? "OneDrive" : "Local", path: rootPath },
        ];
        if (relativePath && relativePath !== ".") {
            const parts = relativePath.split("/");
            let accumulatedPath = rootPath;
            parts.forEach((part) => {
                accumulatedPath = accumulatedPath.replace(/\\/g, "/") + "/" + part;
                breadcrumbs.push({ name: part, path: accumulatedPath });
            });
        }
        return breadcrumbs;
    }
    /**
     * 获取文件信息
     */
    static async getFileInfo(filePath) {
        try {
            if (!(await fs.pathExists(filePath))) {
                return null;
            }
            const stats = await fs.stat(filePath);
            const isOneDrive = filePath.includes(this.ONEDRIVE_ROOT);
            return {
                name: path.basename(filePath),
                path: filePath,
                type: stats.isDirectory() ? "folder" : "file",
                size: stats.isFile() ? stats.size : undefined,
                extension: stats.isFile() ? path.extname(filePath) : undefined,
                modifiedAt: stats.mtime,
                isOneDrive,
            };
        }
        catch (error) {
            logger_1.logger.error("获取文件信息失败", { filePath, error: error.message });
            return null;
        }
    }
}
exports.FolderPreviewService = FolderPreviewService;
//# sourceMappingURL=folderPreviewService.js.map