/**
 * OneDrive API 服务
 *
 * 使用 Microsoft Graph API 操作 OneDrive 云端文件夹
 * 解决本地删除后被 OneDrive 客户端从云端恢复的问题
 */
export declare class OneDriveApiService {
    private static client;
    private static initialized;
    private static drivePrefix;
    private static TENANT_ID;
    private static CLIENT_ID;
    private static CLIENT_SECRET;
    private static SHAREPOINT_SITE_HOSTNAME;
    private static SHAREPOINT_SITE_PATH;
    private static ONEDRIVE_BASE_PATH;
    /**
     * 构建 API 路径（统一使用 SharePoint 站点文档库）
     */
    private static buildItemPath;
    /**
     * 构建根级 children API 路径
     */
    private static buildRootChildrenPath;
    /**
     * 初始化 Graph Client
     * 使用自定义 Auth Provider 而非 @azure/identity（后者需要 Node >= 20）
     * 自动发现 SharePoint 站点 drive
     */
    private static initialize;
    /**
     * 检查 OneDrive API 是否可用
     */
    static isAvailable(): Promise<boolean>;
    /**
     * 将路径转换为 Graph API 路径
     *
     * 支持两种输入格式：
     * 1. 旧格式（DB 遗留数据）: /mnt/onedrive/03 Project Management/Client/...
     *    → strip 挂载前缀 → /03 Project Management/Client/...
     * 2. 新格式（逻辑路径）: 03 Project Management/Client/...
     *    → 直接加 / 前缀 → /03 Project Management/Client/...
     */
    private static convertToGraphPath;
    /**
     * 删除 OneDrive 云端文件夹
     *
     * @param localPath 本地 OneDrive 路径
     * @returns 删除结果
     */
    static deleteFolder(localPath: string): Promise<{
        success: boolean;
        error?: string;
        skipped?: boolean;
    }>;
    /**
     * 创建 OneDrive 云端文件夹
     *
     * @param localPath 本地 OneDrive 路径
     * @returns 创建结果
     */
    static createFolder(localPath: string): Promise<{
        success: boolean;
        error?: string;
        skipped?: boolean;
    }>;
    /**
     * 重命名 OneDrive 云端文件夹
     *
     * @param oldPath 旧路径
     * @param newName 新文件夹名
     * @returns 重命名结果
     */
    static renameFolder(oldPath: string, newName: string): Promise<{
        success: boolean;
        error?: string;
        skipped?: boolean;
    }>;
    /**
     * 下载 OneDrive 文件为 Buffer
     *
     * @param filePath OneDrive 路径（可以是本地挂载路径或相对路径）
     * @returns 文件内容 Buffer，如果失败返回 null
     */
    static downloadFileAsBuffer(filePath: string): Promise<Buffer | null>;
    /**
     * 上传文件到 OneDrive（支持小文件直传和大文件分片上传）
     *
     * @param filePath OneDrive 路径
     * @param content 文件内容 Buffer
     * @returns 上传结果
     */
    static uploadFile(filePath: string, content: Buffer): Promise<{
        success: boolean;
        error?: string;
        skipped?: boolean;
    }>;
    /**
     * 列出 OneDrive 文件夹的子项
     *
     * @param folderPath OneDrive 文件夹路径
     * @returns 子项数组（名称、类型、大小、修改时间）
     */
    static listChildren(folderPath: string): Promise<{
        name: string;
        type: 'file' | 'folder';
        size: number;
        lastModifiedDateTime: string;
    }[]>;
    /**
     * 递归确保 OneDrive 文件夹路径存在（类似 fs.ensureDir）
     *
     * @param folderPath 完整文件夹路径
     */
    static ensureFolder(folderPath: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * 移动/重命名 OneDrive 文件或文件夹
     *
     * @param itemPath 当前路径
     * @param newParentPath 新父文件夹路径（null 表示不移动）
     * @param newName 新名称（null 表示不重命名）
     */
    static moveItem(itemPath: string, newParentPath: string | null, newName: string | null): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * 删除 OneDrive 文件或文件夹
     */
    static deleteItem(itemPath: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * 检查 OneDrive 云端文件夹是否存在
     */
    static folderExists(localPath: string): Promise<boolean>;
    /**
     * 创建 OneDrive 分享链接
     * @param filePath OneDrive 逻辑路径
     * @returns 分享链接 URL，失败返回 null
     */
    static createShareLink(filePath: string): Promise<string | null>;
}
//# sourceMappingURL=oneDriveApiService.d.ts.map