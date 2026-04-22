/**
 * 文件夹预览控制器
 */
import { Request, Response } from "express";
/**
 * 获取Task的文件夹内容
 * GET /api/folders/task/:taskId
 */
export declare const getTaskFolderContents: (req: Request, res: Response) => Promise<void>;
/**
 * 获取Project的文件夹内容
 * GET /api/folders/project/:projectId
 */
export declare const getProjectFolderContents: (req: Request, res: Response) => Promise<void>;
/**
 * 获取文件夹内容（通用）
 * GET /api/folders/browse
 */
export declare const browseFolderContents: (req: Request, res: Response) => Promise<void>;
/**
 * 下载文件
 * GET /api/folders/download
 */
export declare const downloadFile: (req: Request, res: Response) => Promise<void>;
/**
 * 上传文件到指定文件夹（并记录到数据库）
 * POST /api/folders/upload
 */
export declare const uploadFileToFolder: (req: Request, res: Response) => Promise<void>;
/**
 * 请求删除文件（需要审批）
 * POST /api/folders/request-delete
 */
export declare const requestFileDelete: (req: Request, res: Response) => Promise<void>;
/**
 * 创建新文件夹
 * POST /api/folders/create-folder
 */
export declare const createFolder: (req: Request, res: Response) => Promise<void>;
/**
 * 审批文件删除请求
 * POST /api/folders/approve-delete
 */
export declare const approveFileDelete: (req: Request, res: Response) => Promise<void>;
/**
 * POST /api/folders/share-link
 * 创建 OneDrive 文件/文件夹分享链接
 */
export declare const createShareLink: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=folderPreviewController.d.ts.map