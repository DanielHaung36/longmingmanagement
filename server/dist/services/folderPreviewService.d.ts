/**
 * 文件夹预览服务
 * 支持本地和OneDrive路径的文件夹/文件浏览
 * OneDrive 路径通过 Microsoft Graph API 访问
 */
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
    breadcrumbs: {
        name: string;
        path: string;
    }[];
    isOneDrive: boolean;
}
export declare class FolderPreviewService {
    private static ONEDRIVE_ROOT;
    private static ONEDRIVE_SOURCE_ROOT;
    private static LOCAL_ROOT;
    /**
     * 获取文件夹内容（文件和子文件夹列表）
     */
    static getFolderContents(folderPath: string, isOneDrive?: boolean): Promise<FolderContent>;
    /**
     * 通过 Graph API 获取 OneDrive 文件夹内容
     */
    private static getOneDriveFolderContents;
    /**
     * 获取Task的文件夹内容
     */
    static getTaskFolderContents(taskId: number, subfolder?: string): Promise<{
        local: FolderContent | null;
        onedrive: FolderContent | null;
    }>;
    /**
     * 获取Project的文件夹内容
     */
    static getProjectFolderContents(projectId: number, subfolder?: string, folderType?: "client" | "minesite"): Promise<{
        localClient: FolderContent | null;
        onedriveClient: FolderContent | null;
        localMinesite: FolderContent | null;
        onedriveMinesite: FolderContent | null;
    }>;
    /**
     * 验证并规范化路径（防止路径遍历攻击）
     */
    private static validateAndNormalizePath;
    /**
     * 生成面包屑导航
     */
    private static generateBreadcrumbs;
    /**
     * 获取文件信息
     */
    static getFileInfo(filePath: string): Promise<FileItem | null>;
}
//# sourceMappingURL=folderPreviewService.d.ts.map