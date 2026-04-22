/**
 * TaskFileService - Task文件管理服务
 *
 * 功能：
 * 1. 文件上传到Task文件夹
 * 2. 文件元数据保存到数据库
 * 3. 文件下载和删除
 * 4. 文件列表查询
 */
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
export declare class TaskFileService {
    /**
     * 上传文件到Task
     *
     * @param input - 文件上传信息
     * @returns 创建的文件记录
     */
    static uploadFile(input: UploadFileInput): Promise<any>;
    /**
     * 删除文件
     *
     * @param fileId - 文件ID
     * @param deletePhysical - 是否删除物理文件
     * @returns 是否成功
     */
    static deleteFile(fileId: number, deletePhysical?: boolean): Promise<boolean>;
    /**
     * 获取文件详情
     *
     * @param fileId - 文件ID
     * @returns 文件详情
     */
    static getFileById(fileId: number): Promise<any>;
    /**
     * 批量上传文件
     *
     * @param files - 文件列表
     * @returns 上传结果
     */
    static uploadBatchFiles(files: UploadFileInput[]): Promise<{
        succeeded: any[];
        failed: any[];
    }>;
    /**
     * 获取Task的所有文件
     */
    static getTaskFiles(taskId: number, options?: {
        page?: number;
        limit?: number;
        fileType?: string;
    }): Promise<any>;
    /**
     * 增加下载计数
     */
    static incrementDownloadCount(fileId: number): Promise<void>;
    /**
     * 搜索文件
     */
    static searchFiles(options: {
        query?: string;
        fileType?: string;
        taskId?: number;
        page?: number;
        limit?: number;
    }): Promise<any>;
    /**
     * 重命名文件（仅重命名文件，不移动文件夹）
     *
     * @param fileId - 文件ID
     * @param newFileName - 新文件名（不含路径）
     * @returns 更新后的文件记录
     */
    static renameFile(fileId: number, newFileName: string): Promise<any>;
    /**
     * 移动文件到其他文件夹
     *
     * @param fileId - 文件ID
     * @param targetFolder - 目标文件夹名称（例如：'02_Project Documentation'）
     * @returns 更新后的文件记录
     */
    static moveFile(fileId: number, targetFolder: string): Promise<any>;
}
//# sourceMappingURL=taskFileService.d.ts.map