"use strict";
/**
 * TaskFolderService - Task文件夹管理服务
 *
 * 功能：
 * 1. 创建第三层文件夹（taskCode taskName/）
 * 2. 拷贝模板文件夹结构（01_Incoming, 02_Project Documentation等）
 * 3. 管理Task的本地和OneDrive文件夹路径
 *
 * 架构说明：
 * - Project 审批时：创建 clientCompany/ 和 mineSiteName/（前两层）
 * - Task 创建时：创建 taskCode taskName/（第三层）+ 模板文件夹
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
exports.TaskFolderService = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const folderNameSanitizer_1 = require("../utils/folderNameSanitizer");
const oneDriveApiService_1 = require("./oneDriveApiService");
const prisma = new client_1.PrismaClient();
class TaskFolderService {
    // 从环境变量读取根路径
    static LOCAL_ROOT = process.env.LOCAL_PROJECT_ROOT || 'C:/Longi/ProjectData/Projects';
    static ONEDRIVE_ROOT = process.env.ONEDRIVE_PROJECT_ROOT || '';
    // 模板文件夹根目录
    static TEMPLATE_ROOT = process.env.TEMPLATE_ROOT || 'C:/Longi/Templates/Project Management Template';
    // 模板结构映射（基于实际 OneDrive 模板文件夹）
    // 路径: C:\Users\longi\OneDrive - Longi Magnet Australia Pty ltd\Documents - Longi Australia\05 Templates\Project Management Template
    static TEMPLATE_STRUCTURE_MAP = {
        AC: {
            templateName: 'AC0000 template',
            folders: [
                '01 Project Details',
                '02 Communication',
                '02 Communication/EMAILS',
                '02 Communication/Meeting Minutes',
                '02 Communication/Preso'
            ]
        },
        AQ: {
            templateName: 'AQ0000 template',
            folders: [
                '01 Project Details',
                '02 Communication',
                '02 Communication/EMAILS',
                '02 Communication/Meeting Minutes',
                '02 Communication/Preso',
                '03 Quotation&Tender',
                '04 Engineering Plan & Drawings'
            ]
        },
        AS: {
            templateName: 'AS0000 template',
            folders: [
                '01 Project Details',
                '01 Project Details/01 Project Details',
                '01 Project Details/02 Communication',
                '01 Project Details/02 Communication/EMAILS',
                '01 Project Details/02 Communication/Meeting Minutes',
                '01 Project Details/02 Communication/Preso',
                '01 Project Details/03 Photos',
                '01 Project Details/04 Reports',
                '02 Communication',
                '02 Communication/EMAILS',
                '02 Communication/Meeting Minutes',
                '02 Communication/Preso',
                '03 Photos',
                '03 Quotation&Tender',
                '04 Engineering Plan & Drawings',
                '04 Reports'
            ]
        },
        AP: {
            templateName: 'AP0000 template',
            folders: [
                '01 Project Details',
                '02 Communication',
                '02 Communication/EMAILS',
                '02 Communication/Meeting Minutes',
                '02 Communication/Preso',
                '03 Quotation&Tender',
                '04 Engineering Plan & Drawings'
            ]
        },
        AT: {
            templateName: 'AT0000 template',
            folders: [
                '01 Project Details',
                '01 Project Details/Photos',
                '02 Communication',
                '03 Project Management',
                '03 Project Management/Invoicing',
                '03 Project Management/Purchase Orders',
                '04 Quotes',
                '05 Report'
            ]
        }
    };
    /**
     * 为 Task 创建文件夹结构
     *
     * @param taskId - Task ID
     * @param taskCode - 任务编号 (例如: AT0001)
     * @param taskName - 任务名称
     * @param projectId - 所属 Project ID
     * @param jobType - 业务类型 (用于选择模板)
     * @returns 创建结果
     */
    static async createTaskFolder(taskId, taskCode, taskName, projectId, jobType) {
        try {
            logger_1.logger.info('开始创建Task文件夹', { taskId, taskCode, taskName, projectId, jobType });
            // 1. 获取 Project 的前两层文件夹路径
            const project = await prisma.projects.findUnique({
                where: { id: projectId },
                select: {
                    clientCompany: true,
                    mineSiteName: true,
                    oneDriveMineSiteFolderPath: true, // OneDrive路径
                },
            });
            if (!project) {
                throw new Error(`找不到Project: ${projectId}`);
            }
            if (!project.clientCompany || !project.mineSiteName) {
                throw new Error('Project缺少clientCompany或mineSiteName信息');
            }
            // 2. 构建第三层文件夹名称: "taskCode taskName" (sanitized)
            const thirdLayerName = (0, folderNameSanitizer_1.sanitizeTaskFolderName)(taskCode, taskName);
            logger_1.logger.info('原始任务名称和清理后名称', {
                originalTaskName: taskName,
                sanitizedFolderName: thirdLayerName
            });
            // 3. 始终创建到两个位置（LOCAL_PROJECT_ROOT + ONEDRIVE_PROJECT_ROOT）
            let localTaskPath;
            let oneDriveTaskPath;
            // 4. 创建 OneDrive 文件夹（通过 Graph API）
            if (this.ONEDRIVE_ROOT) {
                oneDriveTaskPath = path.join(this.ONEDRIVE_ROOT, project.clientCompany, project.mineSiteName, thirdLayerName);
                await this.createOneDriveFolderWithTemplate(oneDriveTaskPath, jobType);
                logger_1.logger.info('OneDrive Task文件夹创建成功', { oneDriveTaskPath });
            }
            // 5. 创建本地文件夹（运行时始终创建）
            if (this.LOCAL_ROOT) {
                localTaskPath = path.join(this.LOCAL_ROOT, project.clientCompany, project.mineSiteName, thirdLayerName);
                await this.createFolderWithTemplate(localTaskPath, jobType);
                logger_1.logger.info('✅ 本地Task文件夹创建成功', { localTaskPath });
            }
            // 6. 更新 Task 数据库记录
            await prisma.tasks.update({
                where: { id: taskId },
                data: {
                    localFolderPath: localTaskPath,
                    oneDriveFolderPath: oneDriveTaskPath,
                    folderCreated: true,
                },
            });
            logger_1.logger.info('Task文件夹创建完成', {
                taskId,
                taskCode,
                localFolderPath: localTaskPath,
                oneDriveFolderPath: oneDriveTaskPath,
            });
            return {
                success: true,
                localFolderPath: localTaskPath,
                oneDriveFolderPath: oneDriveTaskPath,
            };
        }
        catch (error) {
            logger_1.logger.error('创建Task文件夹失败', {
                taskId,
                taskCode,
                error: error.message,
                stack: error.stack,
            });
            return {
                success: false,
                error: error.message,
            };
        }
    }
    /**
     * 创建本地文件夹并复制模板（如果模板存在）
     */
    static async createFolderWithTemplate(targetPath, jobType) {
        const templateConfig = this.TEMPLATE_STRUCTURE_MAP[jobType];
        if (!templateConfig) {
            logger_1.logger.warn(`未知的jobType: ${jobType}，创建空文件夹`);
            await fs.ensureDir(targetPath);
            return;
        }
        const templatePath = path.join(this.TEMPLATE_ROOT, templateConfig.templateName);
        if (await fs.pathExists(templatePath)) {
            await fs.copy(templatePath, targetPath, { overwrite: false, errorOnExist: false });
            logger_1.logger.info('模板复制成功', { templatePath, targetPath });
        }
        else {
            logger_1.logger.warn('模板不存在，使用硬编码结构创建', { templatePath });
            await fs.ensureDir(targetPath);
            await this.createTemplateFoldersFromConfig(targetPath, templateConfig.folders);
        }
    }
    /**
     * 通过 Graph API 在 OneDrive 创建文件夹并按模板结构创建子文件夹
     */
    static async createOneDriveFolderWithTemplate(targetPath, jobType) {
        // 创建主文件夹
        await oneDriveApiService_1.OneDriveApiService.ensureFolder(targetPath);
        // 获取模板配置
        const templateConfig = this.TEMPLATE_STRUCTURE_MAP[jobType];
        if (!templateConfig) {
            logger_1.logger.warn(`未知的jobType: ${jobType}，仅创建空文件夹`);
            return;
        }
        // 创建子文件夹结构
        for (const folder of templateConfig.folders) {
            const subFolderPath = targetPath.replace(/\\/g, "/") + "/" + folder;
            await oneDriveApiService_1.OneDriveApiService.ensureFolder(subFolderPath);
        }
        logger_1.logger.info(`OneDrive模板子文件夹创建完成: ${templateConfig.folders.length} 个`);
    }
    /**
     * 根据配置创建模板子文件夹（回退方案）
     *
     * @param basePath - 基础路径
     * @param folders - 文件夹列表（支持嵌套路径）
     */
    static async createTemplateFoldersFromConfig(basePath, folders) {
        for (const folder of folders) {
            const folderPath = path.join(basePath, folder);
            await fs.ensureDir(folderPath);
            logger_1.logger.debug('创建模板子文件夹', { folderPath });
        }
        logger_1.logger.info(`成功创建 ${folders.length} 个模板子文件夹`);
    }
    /**
     * 重命名 Task 文件夹（当 taskCode 或 taskName 更新时）
     *
     * @param taskId - Task ID
     * @param newTaskCode - 新任务编号
     * @param newTaskName - 新任务名称
     * @returns 重命名结果
     */
    static async renameTaskFolder(taskId, newTaskCode, newTaskName) {
        try {
            const task = await prisma.tasks.findUnique({
                where: { id: taskId },
                select: {
                    localFolderPath: true,
                    oneDriveFolderPath: true,
                    folderCreated: true,
                },
            });
            if (!task || !task.folderCreated || !task.localFolderPath) {
                throw new Error('Task文件夹未创建或路径信息缺失');
            }
            // 构建新文件夹名
            const newFolderName = `${newTaskCode} ${newTaskName}`;
            // 重命名本地文件夹
            const oldLocalPath = task.localFolderPath;
            const newLocalPath = path.join(path.dirname(oldLocalPath), newFolderName);
            if (await fs.pathExists(oldLocalPath)) {
                await fs.rename(oldLocalPath, newLocalPath);
                logger_1.logger.info('本地Task文件夹重命名成功', { oldLocalPath, newLocalPath });
            }
            // 通过 Graph API 重命名 OneDrive 文件夹
            let newOneDrivePath;
            if (task.oneDriveFolderPath) {
                const oldOneDrivePath = task.oneDriveFolderPath;
                newOneDrivePath = path.join(path.dirname(oldOneDrivePath), newFolderName);
                const renameResult = await oneDriveApiService_1.OneDriveApiService.renameFolder(oldOneDrivePath, newFolderName);
                if (renameResult.success) {
                    logger_1.logger.info('OneDrive Task文件夹重命名成功', { oldOneDrivePath, newOneDrivePath });
                }
                else if (!renameResult.skipped) {
                    logger_1.logger.warn('OneDrive Task文件夹重命名失败', { error: renameResult.error });
                }
            }
            // 更新数据库
            await prisma.tasks.update({
                where: { id: taskId },
                data: {
                    localFolderPath: newLocalPath,
                    oneDriveFolderPath: newOneDrivePath,
                },
            });
            return { success: true };
        }
        catch (error) {
            logger_1.logger.error('重命名Task文件夹失败', { taskId, error: error.message });
            return { success: false, error: error.message };
        }
    }
    /**
     * 删除 Task 文件夹
     *
     * 删除顺序（防止 OneDrive 客户端恢复）：
     * 1. 先通过 OneDrive API 删除云端文件夹
     * 2. 再删除本地 OneDrive 同步目录
     * 3. 最后删除本地项目数据目录
     *
     * @param taskId - Task ID
     * @returns 删除结果
     */
    static async deleteTaskFolder(taskId) {
        try {
            const task = await prisma.tasks.findUnique({
                where: { id: taskId },
                select: {
                    localFolderPath: true,
                    oneDriveFolderPath: true,
                },
            });
            if (!task) {
                throw new Error(`找不到Task: ${taskId}`);
            }
            // 1. 先通过 OneDrive API 删除云端（防止被 OneDrive 客户端恢复）
            if (task.oneDriveFolderPath) {
                const cloudDeleteResult = await oneDriveApiService_1.OneDriveApiService.deleteFolder(task.oneDriveFolderPath);
                if (cloudDeleteResult.success) {
                    if (cloudDeleteResult.skipped) {
                        logger_1.logger.info('OneDrive API 未配置，跳过云端删除', { path: task.oneDriveFolderPath });
                    }
                    else {
                        logger_1.logger.info('OneDrive 云端文件夹已通过 API 删除', { path: task.oneDriveFolderPath });
                    }
                }
                else {
                    logger_1.logger.warn('OneDrive 云端删除失败，继续删除本地', {
                        path: task.oneDriveFolderPath,
                        error: cloudDeleteResult.error,
                    });
                }
            }
            // 2. 删除本地项目数据目录
            if (task.localFolderPath && (await fs.pathExists(task.localFolderPath))) {
                await fs.remove(task.localFolderPath);
                logger_1.logger.info('本地项目数据目录已删除', { path: task.localFolderPath });
            }
            return { success: true };
        }
        catch (error) {
            logger_1.logger.error('删除Task文件夹失败', { taskId, error: error.message });
            return { success: false, error: error.message };
        }
    }
    /**
     * 检查 Task 文件夹是否存在
     *
     * @param taskId - Task ID
     * @returns 是否存在
     */
    static async taskFolderExists(taskId) {
        const task = await prisma.tasks.findUnique({
            where: { id: taskId },
            select: { localFolderPath: true },
        });
        if (!task || !task.localFolderPath) {
            return false;
        }
        return await fs.pathExists(task.localFolderPath);
    }
    /**
     * 获取 Task 文件夹的文件列表
     *
     * @param taskId - Task ID
     * @returns 文件列表
     */
    static async getTaskFolderContents(taskId) {
        try {
            const task = await prisma.tasks.findUnique({
                where: { id: taskId },
                select: { localFolderPath: true },
            });
            if (!task || !task.localFolderPath) {
                throw new Error('Task文件夹路径不存在');
            }
            if (!(await fs.pathExists(task.localFolderPath))) {
                throw new Error('Task文件夹不存在');
            }
            const files = await fs.readdir(task.localFolderPath);
            return { success: true, files };
        }
        catch (error) {
            logger_1.logger.error('获取Task文件夹内容失败', { taskId, error: error.message });
            return { success: false, error: error.message };
        }
    }
}
exports.TaskFolderService = TaskFolderService;
//# sourceMappingURL=taskFolderService.js.map