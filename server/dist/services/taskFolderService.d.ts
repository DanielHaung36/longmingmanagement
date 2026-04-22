/**
 * TaskFolderService - Task文件夹管理服务
 *
 * 功能：
 * 1. 创建第三层文件夹（taskCode taskName/）
 * 2. 拷贝模板文件夹结构（01_Incoming, 02_Project Documentation等）
 * 3. 管理Task的本地和OneDrive文件夹路径
 *
 * 架构说明：
 * - Project 审批时：创建 clientCompany/ 和 mineSiteName/（前两层）
 * - Task 创建时：创建 taskCode taskName/（第三层）+ 模板文件夹
 */
export declare class TaskFolderService {
    private static LOCAL_ROOT;
    private static ONEDRIVE_ROOT;
    private static TEMPLATE_ROOT;
    private static TEMPLATE_STRUCTURE_MAP;
    /**
     * 为 Task 创建文件夹结构
     *
     * @param taskId - Task ID
     * @param taskCode - 任务编号 (例如: AT0001)
     * @param taskName - 任务名称
     * @param projectId - 所属 Project ID
     * @param jobType - 业务类型 (用于选择模板)
     * @returns 创建结果
     */
    static createTaskFolder(taskId: number, taskCode: string, taskName: string, projectId: number, jobType: string): Promise<{
        success: boolean;
        localFolderPath?: string;
        oneDriveFolderPath?: string;
        error?: string;
    }>;
    /**
     * 创建本地文件夹并复制模板（如果模板存在）
     */
    private static createFolderWithTemplate;
    /**
     * 通过 Graph API 在 OneDrive 创建文件夹并按模板结构创建子文件夹
     */
    private static createOneDriveFolderWithTemplate;
    /**
     * 根据配置创建模板子文件夹（回退方案）
     *
     * @param basePath - 基础路径
     * @param folders - 文件夹列表（支持嵌套路径）
     */
    private static createTemplateFoldersFromConfig;
    /**
     * 重命名 Task 文件夹（当 taskCode 或 taskName 更新时）
     *
     * @param taskId - Task ID
     * @param newTaskCode - 新任务编号
     * @param newTaskName - 新任务名称
     * @returns 重命名结果
     */
    static renameTaskFolder(taskId: number, newTaskCode: string, newTaskName: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * 删除 Task 文件夹
     *
     * 删除顺序（防止 OneDrive 客户端恢复）：
     * 1. 先通过 OneDrive API 删除云端文件夹
     * 2. 再删除本地 OneDrive 同步目录
     * 3. 最后删除本地项目数据目录
     *
     * @param taskId - Task ID
     * @returns 删除结果
     */
    static deleteTaskFolder(taskId: number): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * 检查 Task 文件夹是否存在
     *
     * @param taskId - Task ID
     * @returns 是否存在
     */
    static taskFolderExists(taskId: number): Promise<boolean>;
    /**
     * 获取 Task 文件夹的文件列表
     *
     * @param taskId - Task ID
     * @returns 文件列表
     */
    static getTaskFolderContents(taskId: number): Promise<{
        success: boolean;
        files?: string[];
        error?: string;
    }>;
}
//# sourceMappingURL=taskFolderService.d.ts.map