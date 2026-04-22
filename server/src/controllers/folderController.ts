import { Request, Response } from 'express';
import { FolderService } from '../services/folderService';

/**
 * 创建本地项目文件夹
 */
export const createLocalFolder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectCode, clientName, mineSite } = req.body;

    if (!projectCode) {
      res.status(400).json({
        success: false,
        message: '项目编号不能为空'
      });
      return;
    }

    const folderPath = await FolderService.createLocalProjectFolder(
      projectCode,
      clientName,
      mineSite
    );

    res.status(201).json({
      success: true,
      message: '本地文件夹创建成功',
      data: { folderPath }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 复制模板文件夹
 */
export const copyTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobType, clientName, mineSite, projectCode, projectName } = req.body;

    if (!jobType || !projectCode) {
      res.status(400).json({
        success: false,
        message: 'jobType和projectCode不能为空'
      });
      return;
    }

    const { localPath, oneDrivePath } = await FolderService.copyTemplateFolder(
      jobType,
      clientName || 'Default',
      mineSite || 'Default',
      projectCode,
      projectName || 'Project'
    );

    res.status(201).json({
      success: true,
      message: '模板文件夹复制成功',
      data: { localPath, oneDrivePath }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 检查文件夹是否存在
 */
export const checkFolderExists = async (req: Request, res: Response): Promise<void> => {
  try {
    const { folderPath } = req.query;

    if (!folderPath) {
      res.status(400).json({
        success: false,
        message: '文件夹路径不能为空'
      });
      return;
    }

    const exists = await FolderService.folderExists(folderPath as string);

    res.json({
      success: true,
      data: { exists }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 获取文件夹大小
 */
export const getFolderSize = async (req: Request, res: Response): Promise<void> => {
  try {
    const { folderPath } = req.query;

    if (!folderPath) {
      res.status(400).json({
        success: false,
        message: '文件夹路径不能为空'
      });
      return;
    }

    const size = await FolderService.getFolderSize(folderPath as string);

    res.json({
      success: true,
      data: { size, sizeInMB: (size / 1024 / 1024).toFixed(2) }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 列出文件夹内容
 */
export const listFolderContents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { folderPath } = req.query;

    if (!folderPath) {
      res.status(400).json({
        success: false,
        message: '文件夹路径不能为空'
      });
      return;
    }

    const contents = await FolderService.listFolderContents(folderPath as string);

    res.json({
      success: true,
      data: contents
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 删除项目文件夹
 */
export const deleteFolder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { folderPath } = req.body;

    if (!folderPath) {
      res.status(400).json({
        success: false,
        message: '文件夹路径不能为空'
      });
      return;
    }

    await FolderService.deleteProjectFolder(folderPath);

    res.json({
      success: true,
      message: '文件夹删除成功'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 获取文件夹配置路径
 */
export const getFolderPaths = async (req: Request, res: Response): Promise<void> => {
  try {
    const paths = FolderService.getPaths();

    res.json({
      success: true,
      data: paths
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
