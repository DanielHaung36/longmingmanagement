import { Request, Response } from 'express';
/**
 * 创建本地项目文件夹
 */
export declare const createLocalFolder: (req: Request, res: Response) => Promise<void>;
/**
 * 复制模板文件夹
 */
export declare const copyTemplate: (req: Request, res: Response) => Promise<void>;
/**
 * 检查文件夹是否存在
 */
export declare const checkFolderExists: (req: Request, res: Response) => Promise<void>;
/**
 * 获取文件夹大小
 */
export declare const getFolderSize: (req: Request, res: Response) => Promise<void>;
/**
 * 列出文件夹内容
 */
export declare const listFolderContents: (req: Request, res: Response) => Promise<void>;
/**
 * 删除项目文件夹
 */
export declare const deleteFolder: (req: Request, res: Response) => Promise<void>;
/**
 * 获取文件夹配置路径
 */
export declare const getFolderPaths: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=folderController.d.ts.map