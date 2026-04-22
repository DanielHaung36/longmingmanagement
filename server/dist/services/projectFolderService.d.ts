/**
 * ProjectFolderService - Project文件夹管理服务
 *
 * 功能：仅创建前两层文件夹结构（不创建Task文件夹）
 *
 * 架构：
 * Project 审批时：
 *   Client/                      ← 第一层
 *     ├─ 01 Client General info
 *     └─ MineSite/               ← 第二层
 *         └─ 01 Project General Info
 *
 * Task 创建时（由 TaskFolderService 处理）：
 *         └─ AT0001 任务名称/     ← 第三层 + 模板文件夹
 */
export declare class ProjectFolderService {
    private static LOCAL_ROOT;
    private static ONEDRIVE_ROOT;
    /**
     * 确保根目录存在（若不存在则自动创建）
     * OneDrive 根目录通过 Graph API 创建
     */
    private static ensureRootDirectory;
    /**
     * 为 Project 创建前两层文件夹结构（通过参数，不查询数据库）
     *
     * @param clientCompany - 客户公司
     * @param mineSiteName - 矿区名称
     * @returns 创建结果
     */
    static createProjectFolders(params: {
        clientCompany: string;
        mineSiteName: string;
    }): Promise<{
        clientFolderPath?: string;
        mineSiteFolderPath?: string;
        oneDriveClientFolderPath: string;
        oneDriveMineSiteFolderPath: string;
    }>;
    /**
     * 为 Project 创建前两层文件夹结构（使用 projectId，从数据库查询）
     *
     * @param projectId - Project ID
     * @returns 创建结果
     */
    static createProjectFoldersById(projectId: number): Promise<{
        success: boolean;
        clientFolderPath?: string;
        mineSiteFolderPath?: string;
        error?: string;
    }>;
    /**
     * 创建本地文件夹（前两层）
     */
    private static createLocalFolders;
    /**
     * 通过 Graph API 创建 OneDrive 文件夹（前两层）
     */
    private static createOneDriveFolders;
    /**
     * 检查 Project 文件夹是否已创建
     */
    static projectFoldersExist(projectId: number): Promise<boolean>;
    /**
     * 重命名 Project 文件夹
     */
    static renameProjectFolders(params: {
        oldClientCompany: string;
        oldMineSiteName: string;
        newClientCompany: string;
        newMineSiteName: string;
    }): Promise<{
        newClientFolderPath: string;
        newMineSiteFolderPath: string;
        oneDriveSyncFailed?: boolean;
    }>;
    /**
     * 删除 Project 文件夹
     */
    static deleteProjectFolders(params: {
        clientCompany: string;
        mineSiteName: string;
    }): Promise<void>;
}
export declare const projectFolderService: typeof ProjectFolderService;
//# sourceMappingURL=projectFolderService.d.ts.map