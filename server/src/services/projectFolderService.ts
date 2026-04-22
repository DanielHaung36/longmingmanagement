/**
 * ProjectFolderService - Project文件夹管理服务
 *
 * 功能：仅创建前两层文件夹结构（不创建Task文件夹）
 *
 * 架构：
 * Project 审批时：
 *   Client/                      ← 第一层
 *     ├─ 01 Client General info
 *     └─ MineSite/               ← 第二层
 *         └─ 01 Project General Info
 *
 * Task 创建时（由 TaskFolderService 处理）：
 *         └─ AT0001 任务名称/     ← 第三层 + 模板文件夹
 */

import * as fs from "fs-extra";
import * as path from "path";
import { PrismaClient } from '@prisma/client';
import { logger } from "../utils/logger";
import {
  sanitizeFolderName,
  validateFolderName,
} from "../utils/folderNameSanitizer";
import { OneDriveApiService } from './oneDriveApiService';

const prisma = new PrismaClient();

export class ProjectFolderService {
  // 从环境变量读取根路径
  private static LOCAL_ROOT =
    process.env.LOCAL_PROJECT_ROOT || "C:/Longi/ProjectData/Projects";
  private static ONEDRIVE_ROOT = process.env.ONEDRIVE_PROJECT_ROOT || "";

  /**
   * 确保根目录存在（若不存在则自动创建）
   * OneDrive 根目录通过 Graph API 创建
   */
  private static async ensureRootDirectory(rootPath: string, label: string) {
    if (!rootPath) {
      logger.warn(`${label} 未配置，跳过根目录检查`);
      return;
    }
    try {
      if (label.includes('ONEDRIVE')) {
        // OneDrive 通过 Graph API 确保存在
        await OneDriveApiService.ensureFolder(rootPath);
      } else {
        await fs.ensureDir(rootPath);
      }
      logger.debug(`${label} 根目录就绪`, { rootPath });
    } catch (error: any) {
      logger.error(`${label} 根目录创建失败`, { rootPath, error: error.message });
      throw new Error(`${label} 根目录创建失败: ${error.message}`);
    }
  }

  /**
   * 为 Project 创建前两层文件夹结构（通过参数，不查询数据库）
   *
   * @param clientCompany - 客户公司
   * @param mineSiteName - 矿区名称
   * @returns 创建结果
   */
  static async createProjectFolders(params: {
    clientCompany: string;
    mineSiteName: string;
  }): Promise<{
    clientFolderPath?: string;
    mineSiteFolderPath?: string;
    oneDriveClientFolderPath: string;
    oneDriveMineSiteFolderPath: string;
  }> {
    const { clientCompany, mineSiteName } = params;

    // 运行时始终创建两个位置
    let localResult: { clientPath: string; mineSitePath: string };
    let oneDriveResult: { clientPath: string; mineSitePath: string };

    // 创建 OneDrive 文件夹结构
    if (!this.ONEDRIVE_ROOT) {
      throw new Error('ONEDRIVE_PROJECT_ROOT 环境变量未配置');
    }
    await this.ensureRootDirectory(this.ONEDRIVE_ROOT, 'ONEDRIVE_PROJECT_ROOT');
    oneDriveResult = await this.createOneDriveFolders(clientCompany, mineSiteName);
    // 创建本地文件夹结构（运行时始终创建）
    if (!this.LOCAL_ROOT) {
      throw new Error('LOCAL_PROJECT_ROOT 环境变量未配置');
    }
    await this.ensureRootDirectory(this.LOCAL_ROOT, 'LOCAL_PROJECT_ROOT');
    localResult = await this.createLocalFolders(clientCompany, mineSiteName);
    logger.info("✅ 本地Project文件夹创建完成", {
      clientFolderPath: localResult.clientPath,
      mineSiteFolderPath: localResult.mineSitePath,
    });

    logger.info("Project前两层文件夹创建完成", {
      clientFolderPath: localResult.clientPath,
      mineSiteFolderPath: localResult.mineSitePath,
      oneDriveClientFolderPath: oneDriveResult.clientPath,
      oneDriveMineSiteFolderPath: oneDriveResult.mineSitePath,
    });

    return {
      clientFolderPath: localResult.clientPath,
      mineSiteFolderPath: localResult.mineSitePath,
      oneDriveClientFolderPath: oneDriveResult.clientPath,
      oneDriveMineSiteFolderPath: oneDriveResult.mineSitePath,
    };
  }

  /**
   * 为 Project 创建前两层文件夹结构（使用 projectId，从数据库查询）
   *
   * @param projectId - Project ID
   * @returns 创建结果
   */
  static async createProjectFoldersById(projectId: number): Promise<{
    success: boolean;
    clientFolderPath?: string;
    mineSiteFolderPath?: string;
    error?: string;
  }> {
    try {
      logger.info("开始创建Project前两层文件夹", { projectId });

      // 1. 获取 Project 信息
      const project = await prisma.projects.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          clientCompany: true,
          mineSiteName: true,
        },
      });

      if (!project) {
        throw new Error(`找不到Project: ${projectId}`);
      }

      if (!project.clientCompany || !project.mineSiteName) {
        throw new Error("Project缺少clientCompany或mineSiteName信息");
      }

      // 2. 创建本地文件夹结构
      await this.ensureRootDirectory(this.LOCAL_ROOT, 'LOCAL_PROJECT_ROOT');
      const localResult = await this.createLocalFolders(
        project.clientCompany,
        project.mineSiteName
      );

      // 3. 创建 OneDrive 文件夹结构（如果配置了）
      let oneDriveClientPath: string | undefined;
      let oneDriveMineSitePath: string | undefined;

      if (this.ONEDRIVE_ROOT) {
        await this.ensureRootDirectory(this.ONEDRIVE_ROOT, 'ONEDRIVE_PROJECT_ROOT');
        const oneDriveResult = await this.createOneDriveFolders(
          project.clientCompany,
          project.mineSiteName
        );
        oneDriveClientPath = oneDriveResult.clientPath;
        oneDriveMineSitePath = oneDriveResult.mineSitePath;
      }

      // 4. 更新 Project 数据库记录（本地路径 + OneDrive路径）
      await prisma.projects.update({
        where: { id: projectId },
        data: {
          clientFolderPath: localResult.clientPath,
          mineSiteFolderPath: localResult.mineSitePath,
          oneDriveClientFolderPath: oneDriveClientPath,
          oneDriveMineSiteFolderPath: oneDriveMineSitePath,
        },
      });

      logger.info("Project前两层文件夹创建完成", {
        projectId,
        clientFolderPath: localResult.clientPath,
        mineSiteFolderPath: localResult.mineSitePath,
        oneDriveClientFolderPath: oneDriveClientPath,
        oneDriveMineSiteFolderPath: oneDriveMineSitePath,
      });

      return {
        success: true,
        clientFolderPath: localResult.clientPath,
        mineSiteFolderPath: localResult.mineSitePath,
      };
    } catch (error: any) {
      logger.error("创建Project文件夹失败", {
        projectId,
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
   * 创建本地文件夹（前两层）
   */
  private static async createLocalFolders(
    clientCompany: string,
    mineSiteName: string
  ): Promise<{
    clientPath: string;
    mineSitePath: string;
  }> {
    await this.ensureRootDirectory(this.LOCAL_ROOT, 'LOCAL_PROJECT_ROOT');

    // Sanitize folder names for OneDrive/Windows compatibility
    const sanitizedClientCompany = sanitizeFolderName(clientCompany);
    const sanitizedMineSiteName = sanitizeFolderName(mineSiteName);

    logger.info("原始名称和清理后名称", {
      originalClient: clientCompany,
      sanitizedClient: sanitizedClientCompany,
      originalMineSite: mineSiteName,
      sanitizedMineSite: sanitizedMineSiteName,
    });

    // 客户文件夹路径
    const localClientPath = path.join(this.LOCAL_ROOT, sanitizedClientCompany);

    // 矿区文件夹路径
    const localMineSitePath = path.join(localClientPath, sanitizedMineSiteName);

    // 1. 创建客户文件夹
    await fs.ensureDir(localClientPath);
    logger.debug("创建客户文件夹", { localClientPath });

    // 2. 创建 "01 Client General info" (如果不存在)
    const localClientInfoPath = path.join(
      localClientPath,
      "01 Client General info"
    );
    if (!(await fs.pathExists(localClientInfoPath))) {
      await fs.ensureDir(localClientInfoPath);
      logger.info("创建客户信息文件夹", { localClientInfoPath });
    }

    // 3. 创建矿区文件夹
    await fs.ensureDir(localMineSitePath);
    logger.debug("创建矿区文件夹", { localMineSitePath });

    // 4. 创建 "01 Project General Info" (如果不存在)
    const localProjectInfoPath = path.join(
      localMineSitePath,
      "01 Project General Info"
    );
    if (!(await fs.pathExists(localProjectInfoPath))) {
      await fs.ensureDir(localProjectInfoPath);
      logger.info("创建项目总览文件夹", { localProjectInfoPath });
    }

    return {
      clientPath: localClientPath,
      mineSitePath: localMineSitePath,
    };
  }

  /**
   * 通过 Graph API 创建 OneDrive 文件夹（前两层）
   */
  private static async createOneDriveFolders(
    clientCompany: string,
    mineSiteName: string
  ): Promise<{
    clientPath: string;
    mineSitePath: string;
  }> {
    const sanitizedClientCompany = sanitizeFolderName(clientCompany);
    const sanitizedMineSiteName = sanitizeFolderName(mineSiteName);

    const oneDriveClientPath = path.join(this.ONEDRIVE_ROOT, sanitizedClientCompany);
    const oneDriveMineSitePath = path.join(oneDriveClientPath, sanitizedMineSiteName);

    // 通过 Graph API 创建文件夹结构
    await OneDriveApiService.ensureFolder(oneDriveClientPath);
    logger.debug("创建OneDrive客户文件夹", { oneDriveClientPath });

    // 创建 "01 Client General info"
    const clientInfoPath = oneDriveClientPath.replace(/\\/g, "/") + "/01 Client General info";
    if (!(await OneDriveApiService.folderExists(clientInfoPath))) {
      await OneDriveApiService.createFolder(clientInfoPath);
      logger.info("创建OneDrive客户信息文件夹", { clientInfoPath });
    }

    // 创建矿区文件夹
    await OneDriveApiService.ensureFolder(oneDriveMineSitePath);
    logger.debug("创建OneDrive矿区文件夹", { oneDriveMineSitePath });

    // 创建 "01 Project General Info"
    const projectInfoPath = oneDriveMineSitePath.replace(/\\/g, "/") + "/01 Project General Info";
    if (!(await OneDriveApiService.folderExists(projectInfoPath))) {
      await OneDriveApiService.createFolder(projectInfoPath);
      logger.info("创建OneDrive项目总览文件夹", { projectInfoPath });
    }

    return {
      clientPath: oneDriveClientPath,
      mineSitePath: oneDriveMineSitePath,
    };
  }

  /**
   * 检查 Project 文件夹是否已创建
   */
  static async projectFoldersExist(projectId: number): Promise<boolean> {
    const project = await prisma.projects.findUnique({
      where: { id: projectId },
      select: { mineSiteFolderPath: true },
    });

    if (!project || !project.mineSiteFolderPath) {
      return false;
    }

    return await fs.pathExists(project.mineSiteFolderPath);
  }

  /**
   * 重命名 Project 文件夹
   */
  static async renameProjectFolders(params: {
    oldClientCompany: string;
    oldMineSiteName: string;
    newClientCompany: string;
    newMineSiteName: string;
  }): Promise<{
    newClientFolderPath: string;
    newMineSiteFolderPath: string;
    oneDriveSyncFailed?: boolean; // 新增字段，表示 OneDrive 同步是否失败
  }> {
    const { oldClientCompany, oldMineSiteName, newClientCompany, newMineSiteName } = params;

    // Sanitize folder names
    const sanitizedOldClient = sanitizeFolderName(oldClientCompany);
    const sanitizedOldMine = sanitizeFolderName(oldMineSiteName);
    const sanitizedNewClient = sanitizeFolderName(newClientCompany);
    const sanitizedNewMine = sanitizeFolderName(newMineSiteName);

    // Old paths
    const oldClientPath = path.join(this.LOCAL_ROOT, sanitizedOldClient);
    const oldMineSitePath = path.join(oldClientPath, sanitizedOldMine);

    // New paths
    const newClientPath = path.join(this.LOCAL_ROOT, sanitizedNewClient);
    const newMineSitePath = path.join(newClientPath, sanitizedNewMine);


    const oldClientPathExists = await fs.pathExists(oldClientPath);
    const oldMineSitePathExists = await fs.pathExists(oldMineSitePath);


    // Rename client folder if changed
    if (
      sanitizedOldClient === sanitizedNewClient &&
      sanitizedOldMine === sanitizedNewMine
    ) {
      logger.info("🟡 客户与矿区名称未变化，跳过文件夹重命名。");
      return {
        newClientFolderPath: oldClientPath,
        newMineSiteFolderPath: oldMineSitePath,
      };
    }

    // === Step 4. 检查路径存在性 ===
    if (!oldClientPathExists && !oldMineSitePathExists) {
      logger.warn("⚠️ 未找到旧文件夹路径，可能是项目未创建或路径已变更。", {
        oldClientPath,
        oldMineSitePath,
      });
      return {
        newClientFolderPath: newClientPath,
        newMineSiteFolderPath: newMineSitePath,
      };
    }


    // === Step 5. 开始本地重命名 ===
    try {
      // 1️⃣ 重命名客户文件夹
      if (sanitizedOldClient !== sanitizedNewClient && oldClientPathExists) {
        await fs.ensureDir(path.dirname(newClientPath)); // 确保父目录存在
        await fs.move(oldClientPath, newClientPath, { overwrite: true });
        logger.info("✅ 客户文件夹已重命名", {
          oldClientPath,
          newClientPath,
        });
      }

      // 2️⃣ 重命名矿区文件夹
      if (sanitizedOldMine !== sanitizedNewMine && oldMineSitePathExists) {
        await fs.ensureDir(path.dirname(newMineSitePath)); // 确保父目录存在
        await fs.move(oldMineSitePath, newMineSitePath, { overwrite: true });
        logger.info("✅ 矿区文件夹已重命名", {
          oldMineSitePath,
          newMineSitePath,
        });
      }
    } catch (err: any) {
      logger.error("❌ 文件夹重命名失败", { error: err.message });
    }
    // OneDrive 重命名（通过 Graph API）
    let oneDriveSyncFailed = false;
    if (this.ONEDRIVE_ROOT) {
      try {
        // 重命名客户文件夹
        if (sanitizedOldClient !== sanitizedNewClient) {
          const oldOneDriveClientPath = path.join(this.ONEDRIVE_ROOT, sanitizedOldClient);
          const result = await OneDriveApiService.renameFolder(oldOneDriveClientPath, sanitizedNewClient);
          if (result.success) {
            logger.info("OneDrive 客户文件夹已重命名", { old: sanitizedOldClient, new: sanitizedNewClient });
          } else if (!result.skipped) {
            logger.warn("OneDrive 客户文件夹重命名失败", { error: result.error });
            oneDriveSyncFailed = true;
          }
        }

        // 重命名矿区文件夹
        if (sanitizedOldMine !== sanitizedNewMine) {
          const parentPath = path.join(this.ONEDRIVE_ROOT, sanitizedNewClient);
          const oldOneDriveMineSitePath = path.join(parentPath, sanitizedOldMine);
          const result = await OneDriveApiService.renameFolder(oldOneDriveMineSitePath, sanitizedNewMine);
          if (result.success) {
            logger.info("OneDrive 矿区文件夹已重命名", { old: sanitizedOldMine, new: sanitizedNewMine });
          } else if (!result.skipped) {
            logger.warn("OneDrive 矿区文件夹重命名失败", { error: result.error });
            oneDriveSyncFailed = true;
          }
        }
      } catch (err: any) {
        logger.error("OneDrive 文件夹重命名失败", { error: err.message });
        oneDriveSyncFailed = true;
      }
    }
    return {
      newClientFolderPath: newClientPath,
      newMineSiteFolderPath: newMineSitePath,
      oneDriveSyncFailed,
    };
  }

  /**
   * 删除 Project 文件夹
   */
  static async deleteProjectFolders(params: {
    clientCompany: string;
    mineSiteName: string;
  }): Promise<void> {
    const { clientCompany, mineSiteName } = params;

    // Sanitize folder names
    const sanitizedClient = sanitizeFolderName(clientCompany);
    const sanitizedMine = sanitizeFolderName(mineSiteName);

    // Local paths
    const localClientPath = path.join(this.LOCAL_ROOT, sanitizedClient);
    const localMineSitePath = path.join(localClientPath, sanitizedMine);

    // Delete mine site folder
    if (await fs.pathExists(localMineSitePath)) {
      await fs.remove(localMineSitePath);
      logger.info('矿区文件夹已删除', { localMineSitePath });
    }

    // Check if client folder is empty, if so delete it
    if (await fs.pathExists(localClientPath)) {
      const files = await fs.readdir(localClientPath);
      // Only delete if empty or only contains "01 Client General info"
      if (files.length === 0 || (files.length === 1 && files[0] === '01 Client General info')) {
        await fs.remove(localClientPath);
        logger.info('客户文件夹已删除（无其他矿区）', { localClientPath });
      }
    }

    // 通过 Graph API 删除 OneDrive 文件夹
    if (this.ONEDRIVE_ROOT) {
      const oneDriveClientPath = path.join(this.ONEDRIVE_ROOT, sanitizedClient);
      const oneDriveMineSitePath = path.join(oneDriveClientPath, sanitizedMine);

      // 删除矿区文件夹
      await OneDriveApiService.deleteItem(oneDriveMineSitePath);

      // 检查客户文件夹是否还有其他子项
      const children = await OneDriveApiService.listChildren(oneDriveClientPath);
      if (children.length === 0 || (children.length === 1 && children[0].name === '01 Client General info')) {
        await OneDriveApiService.deleteItem(oneDriveClientPath);
      }
    }
  }
}

// 导出单例实例
export const projectFolderService = ProjectFolderService;
