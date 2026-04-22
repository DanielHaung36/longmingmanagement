/**
 * Task Excel 同步服务
 *
 * 新架构：Excel 的每一行代表一个 Task（不再是 Project）
 *
 * 数据来源：
 * - Project 信息：clientCompany, mineSiteName, jobType
 * - Task 信息：taskCode, title, status, folderPath 等
 *
 * 同步策略：
 * - Task 创建 → 添加新行到 Excel
 * - Task 更新 → 更新对应行
 * - Task 删除 → 从 Excel 删除行
 */
export declare class TaskExcelSyncService {
    private static EXCEL_LOCAL_PATH;
    private static EXCEL_ONEDRIVE_PATH;
    private static SHEET_NAME;
    /**
     * 获取导出用的 Excel 文件路径（避免覆盖原文件）
     * 例如：LJA Job Register Rev3.xlsm → LJA Job Register Rev3_Export.xlsx
     * 注意：ExcelJS 只能创建 .xlsx 格式，不支持带宏的 .xlsm
     */
    private static getExportPath;
    /**
     * 检查路径是否安全（不会覆盖原始 xlsm 文件）
     * 原始文件特征：包含 "LJA Job Register Rev3.xlsm" 且不包含 "_Export" 或 "_Local"
     */
    private static isSafeExcelPath;
    /**
     * 获取安全的本地 Excel 路径（如果配置的路径不安全，自动使用安全路径）
     */
    private static getSafeLocalPath;
    /**
     * Task 创建后同步到 Excel
     */
    static syncTaskCreate(taskId: number): Promise<number | null>;
    /**
     * Task 更新后同步到 Excel
     */
    static syncTaskUpdate(taskId: number): Promise<boolean>;
    /**
     * Task 删除后从 Excel 删除
     */
    static syncTaskDelete(taskId: number, excelRowNumber?: number): Promise<boolean>;
    /**
     * 完整重建 Excel（基于所有 Tasks，按类型排序）
     */
    static rebuildExcel(): Promise<void>;
    /**
     * 将 Task 转换为 Excel 行数据（优化版：序号 + 15列基础 + 8列管理）
     *
     * 映射关系（对应原始Excel列）：
     * - 列1: Job ID → task.taskCode
     * - 列2: Client → project.clientCompany
     * - 列3: Mine/Site → project.mineSiteName
     * - 列4: Project → task.title
     * - 列5: Job Type → task.jobType (注意：从 task 获取，不是 project)
     * - 列6: Mineral → task.mineral
     * - 列7: Contact Company(if not the Client) → task.contactCompany
     * - 列8: Project Manager → task.projectManager
     * - 列9: Quotation/Record Number(HQ) → task.quotationNumber
     * - 列10: Request Date → task.requestDate
     * - 列11: Quotation Provided Date → task.quotationDate
     * - 列12: Feedback From Client → task.clientFeedback
     * - 列13: Comment → task.excelComment
     * - 列14: Name → task.title
     * - 列15: Link (OneDrive Path) → task.originalOneDrivePath
     */
    private static taskToExcelRow;
    /**
     * 获取 Excel 列定义（优化版：序号 + 15列基础 + 8列管理）
     */
    private static getExcelColumns;
    /**
     * 获取 Task 及关联的 Project（包含完整数据）
     */
    private static getTaskWithProject;
    /**
     * 打开 Excel 工作簿
     * 优先从本地读取，本地不存在时从 OneDrive 下载
     */
    private static openWorkbook;
    /**
     * 保存 Excel 工作簿
     * 保存到本地文件，并通过 Graph API 上传到 OneDrive
     */
    private static saveWorkbook;
    /**
     * 应用行格式（字体、颜色、边框）
     */
    private static applyRowFormatting;
    /**
     * 初始化工作表（设置表头样式）
     */
    private static initializeWorksheet;
    /**
     * 导出所有任务数据为 Excel Buffer（用于 HTTP 下载）
     *
     * @param filters 过滤条件（可选）
     * @returns Excel 文件的 Buffer
     */
    static exportTasksToExcel(filters?: {
        jobType?: string;
        status?: string;
        priority?: string;
        approvalStatus?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<Buffer>;
}
//# sourceMappingURL=taskExcelSyncService.d.ts.map