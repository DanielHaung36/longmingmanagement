/**
 * FileController - 文件查询和预览控制器
 */
import { Request, Response } from 'express';
export declare class FileController {
    /**
     * GET /api/files/task/:taskId
     * 获取Task的文件列表
     */
    static getTaskFiles(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/files/:fileId
     * 获取单个文件详情
     */
    static getFileById(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/files/:fileId/download
     * 下载文件
     */
    static downloadFile(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/files/:fileId/preview
     * 预览文件（支持图片、PDF等）
     */
    static previewFile(req: Request, res: Response): Promise<void>;
    /**
     * DELETE /api/files/:fileId
     * 删除文件
     */
    static deleteFile(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/files/search
     * 搜索文件
     */
    static searchFiles(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=fileController.d.ts.map