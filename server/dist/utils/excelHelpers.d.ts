/**
 * Excel操作辅助函数
 * 提供通用的Excel行更新、日期格式化等功能
 */
import ExcelJS from 'exceljs';
/**
 * 格式化日期为 DD/MM/YYYY
 */
export declare function formatDate(date: Date | string | null | undefined): string;
/**
 * 更新Excel单行数据
 */
export declare function updateProjectRow(worksheet: ExcelJS.Worksheet, project: any, rowNumber: number): Promise<void>;
/**
 * 打开Excel工作簿
 * 优先从本地读取，本地不存在时从 OneDrive 下载
 */
export declare function openExcelWorkbook(): Promise<{
    workbook: ExcelJS.Workbook;
    worksheet: ExcelJS.Worksheet;
}>;
/**
 * 保存Excel工作簿
 * 保存到本地文件，并通过 Graph API 上传到 OneDrive
 */
export declare function saveExcelWorkbook(workbook: ExcelJS.Workbook): Promise<void>;
/**
 * 标记Excel行为已删除（软删除）
 */
export declare function markRowAsDeleted(worksheet: ExcelJS.Worksheet, rowNumber: number): Promise<void>;
//# sourceMappingURL=excelHelpers.d.ts.map