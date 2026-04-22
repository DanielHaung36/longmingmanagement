"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FolderService = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const oneDriveApiService_1 = require("./oneDriveApiService");
class FolderService {
    // 本地存储根目录（V2三层存储）
    static LOCAL_ROOT = process.env.LOCAL_PROJECT_ROOT || 'C:/Longi/ProjectData/Projects';
    // 模板文件夹路径（Graph API 逻辑路径）
    static TEMPLATE_ROOT = process.env.TEMPLATE_ROOT || '05 Templates/Project Management Template';
    // OneDrive项目基础路径（Graph API 逻辑路径）
    static ONEDRIVE_BASE = process.env.ONEDRIVE_PROJECT_ROOT || '03 Project Management/Client';
    static TEMPLATE_MAP = {
        'AT': 'AT0000 template',
        'AQ': 'AQ0000 template',
        'AC': 'AC0000 template',
        'AS': 'AS0000 template',
        'AP': 'AP0000 template'
    };
    /**
     * 创建正确的文件夹结构并复制模板
     * Client/
     *   ├─01 Client General info
     *   └─MineSite/
     *       ├─01 Project General Info
     *       └─{job_id} {project}/  (复制模板内容)
     */
    static async copyTemplateFolder(jobType, clientName, mineSite, projectCode, projectName) {
        try {
            const templateName = this.TEMPLATE_MAP[jobType];
            if (!templateName) {
                throw new Error(`未知的JOB TYPE: ${jobType}`);
            }
            const sourcePath = path_1.default.join(this.TEMPLATE_ROOT, templateName);
            // 项目文件夹名：job_id + project
            const projectFolderName = `${projectCode} ${projectName}`;
            // 客户文件夹路径
            const localClientPath = path_1.default.join(this.LOCAL_ROOT, clientName);
            const oneDriveClientPath = path_1.default.join(this.ONEDRIVE_BASE, clientName);
            // 矿区文件夹路径
            const localMineSitePath = path_1.default.join(localClientPath, mineSite);
            const oneDriveMineSitePath = path_1.default.join(oneDriveClientPath, mineSite);
            // 项目文件夹路径
            const localProjectPath = path_1.default.join(localMineSitePath, projectFolderName);
            const oneDriveProjectPath = path_1.default.join(oneDriveMineSitePath, projectFolderName);
            // === 本地路径创建 ===
            // 1. 创建客户文件夹
            await fs_extra_1.default.ensureDir(localClientPath);
            // 2. 创建 "01 Client General info" (如果不存在)
            const localClientInfoPath = path_1.default.join(localClientPath, '01 Client General info');
            if (!fs_extra_1.default.existsSync(localClientInfoPath)) {
                await fs_extra_1.default.ensureDir(localClientInfoPath);
                console.log(`✅ 创建客户信息文件夹: ${localClientInfoPath}`);
            }
            // 3. 创建矿区文件夹
            await fs_extra_1.default.ensureDir(localMineSitePath);
            // 4. 创建 "01 Project General Info" (如果不存在)
            const localProjectInfoPath = path_1.default.join(localMineSitePath, '01 Project General Info');
            if (!fs_extra_1.default.existsSync(localProjectInfoPath)) {
                await fs_extra_1.default.ensureDir(localProjectInfoPath);
                console.log(`✅ 创建项目总览文件夹: ${localProjectInfoPath}`);
            }
            // 5. 创建项目文件夹并复制模板
            if (!fs_extra_1.default.existsSync(localProjectPath)) {
                if (fs_extra_1.default.existsSync(sourcePath)) {
                    await fs_extra_1.default.copy(sourcePath, localProjectPath, {
                        overwrite: false,
                        errorOnExist: false
                    });
                    console.log(`✅ 本地项目文件夹已创建: ${localProjectPath}`);
                }
                else {
                    await fs_extra_1.default.ensureDir(localProjectPath);
                    console.warn(`⚠️ 模板不存在，创建空文件夹: ${localProjectPath}`);
                }
            }
            else {
                console.log(`ℹ️ 本地项目文件夹已存在: ${localProjectPath}`);
            }
            // === OneDrive路径创建（通过 Graph API） ===
            // 1. 创建客户文件夹
            await oneDriveApiService_1.OneDriveApiService.ensureFolder(oneDriveClientPath);
            // 2. 创建 "01 Client General info"
            const oneDriveClientInfoPath = oneDriveClientPath + '/01 Client General info';
            if (!(await oneDriveApiService_1.OneDriveApiService.folderExists(oneDriveClientInfoPath))) {
                await oneDriveApiService_1.OneDriveApiService.createFolder(oneDriveClientInfoPath);
            }
            // 3. 创建矿区文件夹
            await oneDriveApiService_1.OneDriveApiService.ensureFolder(oneDriveMineSitePath);
            // 4. 创建 "01 Project General Info"
            const oneDriveProjectInfoPath = oneDriveMineSitePath + '/01 Project General Info';
            if (!(await oneDriveApiService_1.OneDriveApiService.folderExists(oneDriveProjectInfoPath))) {
                await oneDriveApiService_1.OneDriveApiService.createFolder(oneDriveProjectInfoPath);
            }
            // 5. 创建项目文件夹（模板复制仅在本地，OneDrive 创建空结构）
            if (!(await oneDriveApiService_1.OneDriveApiService.folderExists(oneDriveProjectPath))) {
                await oneDriveApiService_1.OneDriveApiService.ensureFolder(oneDriveProjectPath);
            }
            return {
                localPath: localProjectPath,
                oneDrivePath: oneDriveProjectPath
            };
        }
        catch (error) {
            throw new Error(`文件夹操作失败: ${error.message}`);
        }
    }
    /**
     * 创建本地项目文件夹（V2三层存储-第2层）
     */
    static async createLocalProjectFolder(projectCode, clientName, mineSite) {
        try {
            const folderPath = path_1.default.join(this.LOCAL_ROOT, projectCode);
            // 创建项目根目录
            await fs_extra_1.default.ensureDir(folderPath);
            // 创建标准文件夹结构
            const subfolders = [
                '01-Correspondence',
                '02-Quotation',
                '03-Test Data',
                '04-Reports',
                '05-Delivery'
            ];
            for (const subfolder of subfolders) {
                await fs_extra_1.default.ensureDir(path_1.default.join(folderPath, subfolder));
            }
            console.log(`✅ 本地文件夹已创建: ${folderPath}`);
            return folderPath;
        }
        catch (error) {
            throw new Error(`本地文件夹创建失败: ${error.message}`);
        }
    }
    /**
     * 生成metadata.json文件
     */
    static async createMetadataFile(localPath, projectData) {
        const metadata = {
            projectId: projectData.id,
            projectCode: projectData.projectCode,
            name: projectData.name,
            jobType: projectData.jobType,
            clientCompany: projectData.clientCompany,
            mineSiteName: projectData.mineSiteName,
            createdAt: new Date(),
            lastModified: new Date(),
            syncStatus: 'PENDING',
            oneDrivePath: null,
            excelRow: null,
            files: []
        };
        const metadataPath = path_1.default.join(localPath, 'metadata.json');
        await fs_extra_1.default.writeJson(metadataPath, metadata, { spaces: 2 });
        console.log(`✅ metadata.json 已创建`);
    }
    /**
     * 复制模板文件到项目文件夹
     */
    static async copyTemplateFiles(jobType, localPath) {
        const templateName = this.TEMPLATE_MAP[jobType];
        if (!templateName)
            return;
        const templatePath = path_1.default.join(this.TEMPLATE_ROOT, templateName);
        // 检查模板是否存在
        if (!await fs_extra_1.default.pathExists(templatePath)) {
            console.warn(`⚠️ 模板文件夹不存在: ${templatePath}`);
            return;
        }
        try {
            // 复制模板文件到项目文件夹
            await fs_extra_1.default.copy(templatePath, localPath, {
                overwrite: false,
                filter: (src) => !src.includes('metadata.json')
            });
            console.log(`✅ 模板文件已复制`);
        }
        catch (error) {
            console.warn(`⚠️ 模板复制失败，跳过: ${error}`);
        }
    }
    /**
     * 生成OneDrive路径（第一期返回模拟路径）
     */
    static generateOneDrivePath(clientCompany, mineSiteName, projectCode) {
        return `${this.ONEDRIVE_BASE}/${clientCompany}/${mineSiteName}/${projectCode}`;
    }
    static async deleteProjectFolder(folderPath) {
        try {
            if (fs_extra_1.default.existsSync(folderPath)) {
                await fs_extra_1.default.remove(folderPath);
                console.log(`文件夹已删除: ${folderPath}`);
            }
        }
        catch (error) {
            throw new Error(`文件夹删除失败: ${error.message}`);
        }
    }
    static async folderExists(folderPath) {
        return fs_extra_1.default.existsSync(folderPath);
    }
    static async getFolderSize(folderPath) {
        if (!fs_extra_1.default.existsSync(folderPath)) {
            return 0;
        }
        let totalSize = 0;
        const files = await fs_extra_1.default.readdir(folderPath);
        for (const file of files) {
            const filePath = path_1.default.join(folderPath, file);
            const stats = await fs_extra_1.default.stat(filePath);
            if (stats.isDirectory()) {
                totalSize += await this.getFolderSize(filePath);
            }
            else {
                totalSize += stats.size;
            }
        }
        return totalSize;
    }
    static async listFolderContents(folderPath) {
        if (!fs_extra_1.default.existsSync(folderPath)) {
            return [];
        }
        const items = await fs_extra_1.default.readdir(folderPath);
        const contents = [];
        for (const item of items) {
            const itemPath = path_1.default.join(folderPath, item);
            const stats = await fs_extra_1.default.stat(itemPath);
            contents.push({
                name: item,
                path: itemPath,
                type: stats.isDirectory() ? 'directory' : 'file',
                size: stats.size,
                createdAt: stats.birthtime,
                modifiedAt: stats.mtime
            });
        }
        return contents;
    }
    static calculateRelativePath(basePath, targetPath) {
        return path_1.default.relative(basePath, targetPath);
    }
    static setPaths(templateBase, projectBase) {
        this.TEMPLATE_ROOT = templateBase;
        this.LOCAL_ROOT = projectBase;
    }
    static getPaths() {
        return {
            templateBase: this.TEMPLATE_ROOT,
            projectBase: this.LOCAL_ROOT,
            templateMap: this.TEMPLATE_MAP
        };
    }
}
exports.FolderService = FolderService;
//# sourceMappingURL=folderService.js.map