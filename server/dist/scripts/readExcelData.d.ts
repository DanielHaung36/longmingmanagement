/**
 * Excel 数据读取工具
 * 读取 LJA Job Register Rev3.xlsm 文件
 * 增强：支持重复 TaskCode、多字段解析、Job Type 自动识别
 */
export type ExcelDataMap = Map<string, ExcelTaskData[]>;
export interface ExcelTaskData {
    taskCode: string;
    taskCodeSource?: string;
    projectCode?: string;
    jobTypeCode?: string;
    jobTypeName?: string;
    title: string;
    projectName?: string;
    description?: string;
    clientCompany?: string;
    mineSiteName?: string;
    mineral?: string;
    status?: string;
    priority?: string;
    progress?: number;
    startDate?: string;
    dueDate?: string;
    estimatedHours?: number;
    actualHours?: number;
    assignedUser?: string;
    contactCompany?: string;
    projectManager?: string;
    quotationNumber?: string;
    requestDate?: string;
    quotationDate?: string;
    clientFeedback?: string;
    comment?: string;
    oneDrivePath?: string;
    rowNumber?: number;
    rawData?: Record<string, any>;
}
export interface ExcelReadResult {
    filePath: string;
    sheetName: string;
    totalRows: number;
    dataRows: number;
    tasksByCode: ExcelDataMap;
    allTasks: ExcelTaskData[];
    errors: string[];
    warnings: string[];
}
/**
 * 读取 Excel 文件数据
 */
export declare function readExcelData(excelFilePath: string, sheetName?: string): Promise<ExcelReadResult>;
/**
 * 生成 Excel 读取报告
 */
export declare function generateExcelReadReport(result: ExcelReadResult): string;
/**
 * 导出 Excel 数据为 JSON（用于调试）
 */
export declare function exportTasksAsJson(tasks: ExcelDataMap): string;
//# sourceMappingURL=readExcelData.d.ts.map