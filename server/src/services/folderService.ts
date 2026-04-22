import fs from 'fs-extra';
import path from 'path';
import { JobType } from '@prisma/client';
import { OneDriveApiService } from './oneDriveApiService';

export class FolderService {
  // 本地存储根目录（V2三层存储）
  private static LOCAL_ROOT = process.env.LOCAL_PROJECT_ROOT || 'C:/Longi/ProjectData/Projects';

  // 模板文件夹路径（Graph API 逻辑路径）
  private static TEMPLATE_ROOT = process.env.TEMPLATE_ROOT || '05 Templates/Project Management Template';

  // OneDrive项目基础路径（Graph API 逻辑路径）
  private static ONEDRIVE_BASE = process.env.ONEDRIVE_PROJECT_ROOT || '03 Project Management/Client';

  private static TEMPLATE_MAP: Record<string, string> = {
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
  static async copyTemplateFolder(
    jobType: JobType,
    clientName: string,
    mineSite: string,
    projectCode: string,
    projectName: string
  ): Promise<{ localPath: string; oneDrivePath: string }> {
    try {
      const templateName = this.TEMPLATE_MAP[jobType];
      if (!templateName) {
        throw new Error(`未知的JOB TYPE: ${jobType}`);
      }

      const sourcePath = path.join(this.TEMPLATE_ROOT, templateName);

      // 项目文件夹名：job_id + project
      const projectFolderName = `${projectCode} ${projectName}`;

      // 客户文件夹路径
      const localClientPath = path.join(this.LOCAL_ROOT, clientName);
      const oneDriveClientPath = path.join(this.ONEDRIVE_BASE, clientName);

      // 矿区文件夹路径
      const localMineSitePath = path.join(localClientPath, mineSite);
      const oneDriveMineSitePath = path.join(oneDriveClientPath, mineSite);

      // 项目文件夹路径
      const localProjectPath = path.join(localMineSitePath, projectFolderName);
      const oneDriveProjectPath = path.join(oneDriveMineSitePath, projectFolderName);

      // === 本地路径创建 ===

      // 1. 创建客户文件夹
      await fs.ensureDir(localClientPath);

      // 2. 创建 "01 Client General info" (如果不存在)
      const localClientInfoPath = path.join(localClientPath, '01 Client General info');
      if (!fs.existsSync(localClientInfoPath)) {
        await fs.ensureDir(localClientInfoPath);
        console.log(`✅ 创建客户信息文件夹: ${localClientInfoPath}`);
      }

      // 3. 创建矿区文件夹
      await fs.ensureDir(localMineSitePath);

      // 4. 创建 "01 Project General Info" (如果不存在)
      const localProjectInfoPath = path.join(localMineSitePath, '01 Project General Info');
      if (!fs.existsSync(localProjectInfoPath)) {
        await fs.ensureDir(localProjectInfoPath);
        console.log(`✅ 创建项目总览文件夹: ${localProjectInfoPath}`);
      }

      // 5. 创建项目文件夹并复制模板
      if (!fs.existsSync(localProjectPath)) {
        if (fs.existsSync(sourcePath)) {
          await fs.copy(sourcePath, localProjectPath, {
            overwrite: false,
            errorOnExist: false
          });
          console.log(`✅ 本地项目文件夹已创建: ${localProjectPath}`);
        } else {
          await fs.ensureDir(localProjectPath);
          console.warn(`⚠️ 模板不存在，创建空文件夹: ${localProjectPath}`);
        }
      } else {
        console.log(`ℹ️ 本地项目文件夹已存在: ${localProjectPath}`);
      }

      // === OneDrive路径创建（通过 Graph API） ===

      // 1. 创建客户文件夹
      await OneDriveApiService.ensureFolder(oneDriveClientPath);

      // 2. 创建 "01 Client General info"
      const oneDriveClientInfoPath = oneDriveClientPath + '/01 Client General info';
      if (!(await OneDriveApiService.folderExists(oneDriveClientInfoPath))) {
        await OneDriveApiService.createFolder(oneDriveClientInfoPath);
      }

      // 3. 创建矿区文件夹
      await OneDriveApiService.ensureFolder(oneDriveMineSitePath);

      // 4. 创建 "01 Project General Info"
      const oneDriveProjectInfoPath = oneDriveMineSitePath + '/01 Project General Info';
      if (!(await OneDriveApiService.folderExists(oneDriveProjectInfoPath))) {
        await OneDriveApiService.createFolder(oneDriveProjectInfoPath);
      }

      // 5. 创建项目文件夹（模板复制仅在本地，OneDrive 创建空结构）
      if (!(await OneDriveApiService.folderExists(oneDriveProjectPath))) {
        await OneDriveApiService.ensureFolder(oneDriveProjectPath);
      }

      return {
        localPath: localProjectPath,
        oneDrivePath: oneDriveProjectPath
      };
    } catch (error: any) {
      throw new Error(`文件夹操作失败: ${error.message}`);
    }
  }

  /**
   * 创建本地项目文件夹（V2三层存储-第2层）
   */
  static async createLocalProjectFolder(
    projectCode: string,
    clientName?: string,
    mineSite?: string
  ): Promise<string> {
    try {
      const folderPath = path.join(this.LOCAL_ROOT, projectCode);

      // 创建项目根目录
      await fs.ensureDir(folderPath);

      // 创建标准文件夹结构
      const subfolders = [
        '01-Correspondence',
        '02-Quotation',
        '03-Test Data',
        '04-Reports',
        '05-Delivery'
      ];

      for (const subfolder of subfolders) {
        await fs.ensureDir(path.join(folderPath, subfolder));
      }

      console.log(`✅ 本地文件夹已创建: ${folderPath}`);
      return folderPath;
    } catch (error: any) {
      throw new Error(`本地文件夹创建失败: ${error.message}`);
    }
  }

  /**
   * 生成metadata.json文件
   */
  static async createMetadataFile(
    localPath: string,
    projectData: any
  ): Promise<void> {
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

    const metadataPath = path.join(localPath, 'metadata.json');
    await fs.writeJson(metadataPath, metadata, { spaces: 2 });

    console.log(`✅ metadata.json 已创建`);
  }

  /**
   * 复制模板文件到项目文件夹
   */
  static async copyTemplateFiles(
    jobType: string,
    localPath: string
  ): Promise<void> {
    const templateName = this.TEMPLATE_MAP[jobType];
    if (!templateName) return;

    const templatePath = path.join(this.TEMPLATE_ROOT, templateName);

    // 检查模板是否存在
    if (!await fs.pathExists(templatePath)) {
      console.warn(`⚠️ 模板文件夹不存在: ${templatePath}`);
      return;
    }

    try {
      // 复制模板文件到项目文件夹
      await fs.copy(templatePath, localPath, {
        overwrite: false,
        filter: (src) => !src.includes('metadata.json')
      });

      console.log(`✅ 模板文件已复制`);
    } catch (error) {
      console.warn(`⚠️ 模板复制失败，跳过: ${error}`);
    }
  }

  /**
   * 生成OneDrive路径（第一期返回模拟路径）
   */
  static generateOneDrivePath(
    clientCompany: string,
    mineSiteName: string,
    projectCode: string
  ): string {
    return `${this.ONEDRIVE_BASE}/${clientCompany}/${mineSiteName}/${projectCode}`;
  }

  static async deleteProjectFolder(folderPath: string): Promise<void> {
    try {
      if (fs.existsSync(folderPath)) {
        await fs.remove(folderPath);
        console.log(`文件夹已删除: ${folderPath}`);
      }
    } catch (error: any) {
      throw new Error(`文件夹删除失败: ${error.message}`);
    }
  }

  static async folderExists(folderPath: string): Promise<boolean> {
    return fs.existsSync(folderPath);
  }

  static async getFolderSize(folderPath: string): Promise<number> {
    if (!fs.existsSync(folderPath)) {
      return 0;
    }

    let totalSize = 0;
    const files = await fs.readdir(folderPath);

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stats = await fs.stat(filePath);

      if (stats.isDirectory()) {
        totalSize += await this.getFolderSize(filePath);
      } else {
        totalSize += stats.size;
      }
    }

    return totalSize;
  }

  static async listFolderContents(folderPath: string): Promise<any[]> {
    if (!fs.existsSync(folderPath)) {
      return [];
    }

    const items = await fs.readdir(folderPath);
    const contents: any[] = [];

    for (const item of items) {
      const itemPath = path.join(folderPath, item);
      const stats = await fs.stat(itemPath);

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

  static calculateRelativePath(basePath: string, targetPath: string): string {
    return path.relative(basePath, targetPath);
  }

  static setPaths(templateBase: string, projectBase: string) {
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