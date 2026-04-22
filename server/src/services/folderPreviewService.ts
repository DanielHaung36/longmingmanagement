/**
 * 文件夹预览服务
 * 支持本地和OneDrive路径的文件夹/文件浏览
 * OneDrive 路径通过 Microsoft Graph API 访问
 */

import * as fs from "fs-extra";
import * as path from "path";
import { logger } from "../utils/logger";
import { OneDriveApiService } from "./oneDriveApiService";

export interface FileItem {
  name: string;
  path: string;
  type: "file" | "folder";
  size?: number;
  extension?: string;
  modifiedAt?: Date;
  isOneDrive?: boolean;
}

export interface FolderContent {
  path: string;
  items: FileItem[];
  breadcrumbs: { name: string; path: string }[];
  isOneDrive: boolean;
}

export class FolderPreviewService {
  private static ONEDRIVE_ROOT = process.env.ONEDRIVE_PROJECT_ROOT || ""; // 开发环境 OneDrive
  private static ONEDRIVE_SOURCE_ROOT = process.env.ONEDRIVE_ROOT || ""; // 生产环境 OneDrive (只读源)
  private static LOCAL_ROOT = process.env.LOCAL_PROJECT_ROOT || "";

  /**
   * 获取文件夹内容（文件和子文件夹列表）
   */
  static async getFolderContents(
    folderPath: string,
    isOneDrive: boolean = false
  ): Promise<FolderContent> {
    try {
      logger.info("获取文件夹内容", { folderPath, isOneDrive });

      if (isOneDrive) {
        return await this.getOneDriveFolderContents(folderPath);
      }

      // 本地文件系统
      const safePath = this.validateAndNormalizePath(folderPath, false);

      if (!(await fs.pathExists(safePath))) {
        throw new Error(`文件夹不存在: ${safePath}`);
      }

      const items = await fs.readdir(safePath);
      const fileItems: FileItem[] = [];

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
        if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

      const breadcrumbs = this.generateBreadcrumbs(safePath, false);

      return { path: safePath, items: fileItems, breadcrumbs, isOneDrive: false };
    } catch (error: any) {
      logger.error("获取文件夹内容失败", { folderPath, error: error.message });
      throw error;
    }
  }

  /**
   * 通过 Graph API 获取 OneDrive 文件夹内容
   */
  private static async getOneDriveFolderContents(
    folderPath: string
  ): Promise<FolderContent> {
    const children = await OneDriveApiService.listChildren(folderPath);

    const fileItems: FileItem[] = children.map((child) => ({
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
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    const breadcrumbs = this.generateBreadcrumbs(folderPath, true);

    return { path: folderPath, items: fileItems, breadcrumbs, isOneDrive: true };
  }

  /**
   * 获取Task的文件夹内容
   */
  static async getTaskFolderContents(
    taskId: number,
    subfolder?: string
  ): Promise<{
    local: FolderContent | null;
    onedrive: FolderContent | null;
  }> {
    try {
      const { PrismaClient } = await import("@prisma/client");
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

      let localContent: FolderContent | null = null;
      let onedriveContent: FolderContent | null = null;

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
        } catch (error: any) {
          logger.warn("获取OneDrive文件夹内容失败，返回空内容占位", {
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
    } catch (error: any) {
      logger.error("获取Task文件夹内容失败", {
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
  static async getProjectFolderContents(
    projectId: number,
    subfolder?: string,
    folderType?: "client" | "minesite"
  ): Promise<{
    localClient: FolderContent | null;
    onedriveClient: FolderContent | null;
    localMinesite: FolderContent | null;
    onedriveMinesite: FolderContent | null;
  }> {
    try {
      const { PrismaClient } = await import("@prisma/client");
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

      let localClientContent: FolderContent | null = null;
      let onedriveClientContent: FolderContent | null = null;
      let localMinesiteContent: FolderContent | null = null;
      let onedriveMinesiteContent: FolderContent | null = null;

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
            const exists = await OneDriveApiService.folderExists(onedrivePath);
            if (exists) {
              onedriveClientContent = await this.getOneDriveFolderContents(onedrivePath);
            }
          } catch (e: any) {
            logger.warn("获取OneDrive客户文件夹失败", { error: e.message });
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
            const exists = await OneDriveApiService.folderExists(onedrivePath);
            if (exists) {
              onedriveMinesiteContent = await this.getOneDriveFolderContents(onedrivePath);
            }
          } catch (e: any) {
            logger.warn("获取OneDrive矿区文件夹失败", { error: e.message });
          }
        }
      }

      return {
        localClient: localClientContent,
        onedriveClient: onedriveClientContent,
        localMinesite: localMinesiteContent,
        onedriveMinesite: onedriveMinesiteContent,
      };
    } catch (error: any) {
      logger.error("获取Project文件夹内容失败", {
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
  private static validateAndNormalizePath(
    inputPath: string,
    isOneDrive: boolean
  ): string {
    const validRoots = isOneDrive
      ? [this.ONEDRIVE_ROOT, this.ONEDRIVE_SOURCE_ROOT].filter((root) => root)
      : [this.LOCAL_ROOT].filter((root) => root);

    const normalizedPath = path.normalize(inputPath);

    const isValid = validRoots.some((root) => {
      const normalizedRoot = path.normalize(root);
      return normalizedPath.startsWith(normalizedRoot);
    });

    if (!isValid) {
      logger.warn(`路径验证失败`, { inputPath, normalizedPath, validRoots, isOneDrive });
      throw new Error(`非法路径访问: ${inputPath}`);
    }

    return normalizedPath;
  }

  /**
   * 生成面包屑导航
   */
  private static generateBreadcrumbs(
    currentPath: string,
    isOneDrive: boolean
  ): { name: string; path: string }[] {
    const rootPath = isOneDrive ? this.ONEDRIVE_ROOT : this.LOCAL_ROOT;
    const normalizedCurrent = currentPath.replace(/\\/g, "/");
    const normalizedRoot = rootPath.replace(/\\/g, "/");
    const relativePath = normalizedCurrent.startsWith(normalizedRoot)
      ? normalizedCurrent.substring(normalizedRoot.length).replace(/^\//, "")
      : "";

    const breadcrumbs: { name: string; path: string }[] = [
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
  static async getFileInfo(filePath: string): Promise<FileItem | null> {
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
    } catch (error: any) {
      logger.error("获取文件信息失败", { filePath, error: error.message });
      return null;
    }
  }
}
