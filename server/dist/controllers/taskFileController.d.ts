/**
 * TaskFileController - Task文件控制器
 */
import { Request, Response } from 'express';
export declare class TaskFileController {
    /**
     * 上传文件到Task
     */
    static uploadFile(req: Request, res: Response): Promise<void>;
    /**
     * 获取Task的文件列表
     */
    static getTaskFiles(req: Request, res: Response): Promise<void>;
    /**
     * 删除文件
     */
    static deleteFile(req: Request, res: Response): Promise<void>;
    /**
     * 获取文件详情
     */
    static getFileById(req: Request, res: Response): Promise<void>;
    /**
     * 下载文件
     */
    static downloadFile(req: Request, res: Response): Promise<void>;
    /**
     * 移动文件到其他文件夹
     */
    static moveFile(req: Request, res: Response): Promise<void>;
    /**
     * 重命名文件（仅文件名，不含文件夹）
     */
    static renameFile(req: Request, res: Response): Promise<void>;
    /**
     * 复制 OneDrive 路径到剪贴板（前端处理，此处返回路径）
     */
    static getOneDrivePath(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=taskFileController.d.ts.map