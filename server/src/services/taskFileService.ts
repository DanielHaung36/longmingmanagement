/**
 * TaskFileService - Task文件管理服务
 *
 * 功能：
 * 1. 文件上传到Task文件夹
 * 2. 文件元数据保存到数据库
 * 3. 文件下载和删除
 * 4. 文件列表查询
 */

import { PrismaClient } from '@prisma/client';
import { logger } from "../utils/logger";
import * as fs from "fs-extra";
import * as path from "path";
import { OneDriveApiService } from './oneDriveApiService';

const prisma = new PrismaClient();

export interface UploadFileInput {
  taskId: number;
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: number;
  localPath: string;
  oneDrivePath?: string;
}

export class TaskFileService {
  /**
   * 上传文件到Task
   *
   * @param input - 文件上传信息
   * @returns 创建的文件记录
   */
  static async uploadFile(input: UploadFileInput): Promise<any> {
    try {
      logger.info("开始上传文件到Task", {
        taskId: input.taskId,
        fileName: input.fileName,
      });

      // 1. 验证Task存在
      const task = await prisma.tasks.findUnique({
        where: { id: input.taskId },
        select: {
          id: true,
          taskCode: true,
          title: true,
          localFolderPath: true,
          oneDriveFolderPath: true,
        },
      });

      if (!task) {
        throw new Error(`Task不存在: ${input.taskId}`);
      }

      if (!task.localFolderPath) {
        throw new Error("Task文件夹未创建");
      }

      // 2. 确定文件存储位置（默认放在Incoming文件夹）
      const incomingFolder = path.join(task.localFolderPath, "01_Incoming");
      await fs.ensureDir(incomingFolder);

      const targetFilePath = path.join(incomingFolder, input.fileName);

      // 3. 复制文件到目标位置（如果源文件路径不同）
      if (input.localPath !== targetFilePath) {
        await fs.copy(input.localPath, targetFilePath, { overwrite: true });
      }

      // 4. 如果有OneDrive，通过 Graph API 上传
      let oneDriveFilePath: string | undefined;
      if (task.oneDriveFolderPath) {
        const oneDriveIncomingFolder = task.oneDriveFolderPath.replace(/\\/g, "/") + "/01_Incoming";
        await OneDriveApiService.ensureFolder(oneDriveIncomingFolder);
        oneDriveFilePath = oneDriveIncomingFolder + "/" + input.fileName;
        const fileBuffer = await fs.readFile(targetFilePath);
        await OneDriveApiService.uploadFile(oneDriveFilePath, fileBuffer);
      }

      // 5. 保存文件元数据到数据库
      const fileRecord = await prisma.task_files.create({
        data: {
          taskId: input.taskId,
          fileName: input.fileName,
          fileType: "DOCUMENT" as any, // 使用枚举值
          mimeType: input.fileType, // 使用fileType作为mimeType
          fileSize: BigInt(input.fileSize),
          localPath: targetFilePath,
          relativePath: "01_Incoming/" + input.fileName, // 相对路径
          oneDrivePath: oneDriveFilePath,
          uploadedBy: input.uploadedBy,
          md5Hash: "00000000000000000000000000000000", // 临时MD5
          uploadStatus: "COMPLETED" as any,
          uploadProgress: 100,
        },
        include: {
          tasks: {
            select: {
              id: true,
              taskCode: true,
              title: true,
            },
          },
          users: {
            select: {
              id: true,
              username: true,
              realName: true,
            },
          },
        },
      });

      logger.info("文件上传成功", {
        fileId: fileRecord.id,
        fileName: input.fileName,
        taskId: input.taskId,
      });

      return fileRecord;
    } catch (error: any) {
      logger.error("文件上传失败", {
        input,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`文件上传失败: ${error.message}`);
    }
  }

  /**
   * 删除文件
   *
   * @param fileId - 文件ID
   * @param deletePhysical - 是否删除物理文件
   * @returns 是否成功
   */
  static async deleteFile(
    fileId: number,
    deletePhysical: boolean = true
  ): Promise<boolean> {
    try {
      logger.info("开始删除文件", { fileId, deletePhysical });

      const file = await prisma.task_files.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new Error(`文件不存在: ${fileId}`);
      }

      // 1. 删除物理文件（如果需要）
      if (deletePhysical) {
        if (file.localPath && (await fs.pathExists(file.localPath))) {
          await fs.remove(file.localPath);
          logger.info("本地文件已删除", { path: file.localPath });
        }

        if (file.oneDrivePath) {
          await OneDriveApiService.deleteItem(file.oneDrivePath);
          logger.info("OneDrive文件已删除", { path: file.oneDrivePath });
        }
      }

      // 2. 删除数据库记录
      await prisma.task_files.delete({
        where: { id: fileId },
      });

      logger.info("文件删除成功", { fileId });

      return true;
    } catch (error: any) {
      logger.error("删除文件失败", {
        fileId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 获取文件详情
   *
   * @param fileId - 文件ID
   * @returns 文件详情
   */
  static async getFileById(fileId: number): Promise<any> {
    const file = await prisma.task_files.findUnique({
      where: { id: fileId },
      include: {
        tasks: {
          select: {
            id: true,
            taskCode: true,
            title: true,
          },
        },
        users: {
          select: {
            id: true,
            username: true,
            realName: true,
          },
        },
      },
    });

    if (!file) {
      throw new Error(`文件不存在: ${fileId}`);
    }

    return file;
  }

  /**
   * 批量上传文件
   *
   * @param files - 文件列表
   * @returns 上传结果
   */
  static async uploadBatchFiles(
    files: UploadFileInput[]
  ): Promise<{ succeeded: any[]; failed: any[] }> {
    const succeeded: any[] = [];
    const failed: any[] = [];

    for (const fileInput of files) {
      try {
        const file = await this.uploadFile(fileInput);
        succeeded.push(file);
      } catch (error: any) {
        logger.error("批量上传文件失败", {
          fileName: fileInput.fileName,
          error: error.message,
        });
        failed.push({
          fileName: fileInput.fileName,
          error: error.message,
        });
      }
    }

    logger.info("批量上传完成", {
      total: files.length,
      succeeded: succeeded.length,
      failed: failed.length,
    });

    return { succeeded, failed };
  }

  /**
   * 获取Task的所有文件
   */
  static async getTaskFiles(
    taskId: number,
    options: { page?: number; limit?: number; fileType?: string } = {}
  ): Promise<any> {
    const { page = 1, limit = 50, fileType } = options;
    const skip = (page - 1) * limit;

    const where: any = { taskId };
    if (fileType) {
      where.fileType = fileType;
    }

    const files = await prisma.task_files.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            username: true,
            realName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.task_files.count({ where });

    return {
      files,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 增加下载计数
   */
  static async incrementDownloadCount(fileId: number): Promise<void> {
    await prisma.task_files.update({
      where: { id: fileId },
      data: {
        downloadCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * 搜索文件
   */
  static async searchFiles(options: {
    query?: string;
    fileType?: string;
    taskId?: number;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const { query, fileType, taskId, page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query) {
      where.fileName = {
        contains: query,
        mode: "insensitive",
      };
    }

    if (fileType) {
      where.fileType = fileType;
    }

    if (taskId) {
      where.taskId = taskId;
    }

    const files = await prisma.task_files.findMany({
      where,
      include: {
        tasks: {
          select: {
            id: true,
            taskCode: true,
            title: true,
          },
        },
        users: {
          select: {
            id: true,
            username: true,
            realName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.task_files.count({ where });

    return {
      files,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 重命名文件（仅重命名文件，不移动文件夹）
   *
   * @param fileId - 文件ID
   * @param newFileName - 新文件名（不含路径）
   * @returns 更新后的文件记录
   */
  static async renameFile(fileId: number, newFileName: string): Promise<any> {
    try {
      logger.info("开始重命名文件", { fileId, newFileName });

      // 1. 验证文件存在
      const file = await prisma.task_files.findUnique({
        where: { id: fileId },
        include: {
          tasks: {
            select: {
              localFolderPath: true,
              oneDriveFolderPath: true,
            },
          },
        },
      });

      if (!file) {
        throw new Error(`文件不存在: ${fileId}`);
      }

      // 2. 清理新文件名（移除路径分隔符，防止目录遍历攻击）
      const sanitizedFileName = newFileName.replace(/[/\\]/g, "_");

      // 3. 计算新路径（保持在同一目录）
      const fileDir = path.dirname(file.localPath);
      const newLocalPath = path.join(fileDir, sanitizedFileName);

      // 4. 重命名本地文件
      if (await fs.pathExists(file.localPath)) {
        await fs.rename(file.localPath, newLocalPath);
      }

      // 5. 通过 Graph API 重命名 OneDrive 文件
      let newOneDrivePath: string | undefined;
      if (file.oneDrivePath) {
        const oneDriveDir = path.dirname(file.oneDrivePath);
        newOneDrivePath = path.join(oneDriveDir, sanitizedFileName);
        await OneDriveApiService.moveItem(file.oneDrivePath, null, sanitizedFileName);
      }

      // 6. 更新数据库
      const updatedFile = await prisma.task_files.update({
        where: { id: fileId },
        data: {
          fileName: sanitizedFileName,
          localPath: newLocalPath,
          oneDrivePath: newOneDrivePath || file.oneDrivePath,
        },
        include: {
          tasks: true,
          users: true,
        },
      });

      logger.info("文件重命名成功", {
        fileId,
        oldName: file.fileName,
        newName: sanitizedFileName,
      });

      return updatedFile;
    } catch (error: any) {
      logger.error("重命名文件失败", {
        fileId,
        newFileName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 移动文件到其他文件夹
   *
   * @param fileId - 文件ID
   * @param targetFolder - 目标文件夹名称（例如：'02_Project Documentation'）
   * @returns 更新后的文件记录
   */
  static async moveFile(fileId: number, targetFolder: string): Promise<any> {
    try {
      logger.info("开始移动文件", { fileId, targetFolder });

      const file = await prisma.task_files.findUnique({
        where: { id: fileId },
        include: {
          tasks: {
            select: {
              localFolderPath: true,
              oneDriveFolderPath: true,
            },
          },
        },
      });

      if (!file) {
        throw new Error(`文件不存在: ${fileId}`);
      }

      if (!file.tasks.localFolderPath) {
        throw new Error("Task文件夹不存在");
      }

      // 1. 计算新路径
      const newLocalFolder = path.join(
        file.tasks.localFolderPath,
        targetFolder
      );
      await fs.ensureDir(newLocalFolder);
      const newLocalPath = path.join(newLocalFolder, file.fileName);

      // 2. 移动本地文件
      if (await fs.pathExists(file.localPath)) {
        await fs.move(file.localPath, newLocalPath, { overwrite: true });
      }

      // 3. 通过 Graph API 移动 OneDrive 文件
      let newOneDrivePath: string | undefined;
      if (file.tasks.oneDriveFolderPath && file.oneDrivePath) {
        const newOneDriveFolder = file.tasks.oneDriveFolderPath.replace(/\\/g, "/") + "/" + targetFolder;
        await OneDriveApiService.ensureFolder(newOneDriveFolder);
        newOneDrivePath = newOneDriveFolder + "/" + file.fileName;
        await OneDriveApiService.moveItem(file.oneDrivePath, newOneDriveFolder, file.fileName);
      }

      // 4. 更新数据库
      const updatedFile = await prisma.task_files.update({
        where: { id: fileId },
        data: {
          localPath: newLocalPath,
          oneDrivePath: newOneDrivePath,
        },
        include: {
          tasks: true,
          users: true,
        },
      });

      logger.info("文件移动成功", { fileId, targetFolder });

      return updatedFile;
    } catch (error: any) {
      logger.error("移动文件失败", {
        fileId,
        targetFolder,
        error: error.message,
      });
      throw error;
    }
  }

}
