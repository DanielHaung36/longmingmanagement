/**
 * 数据库导入逻辑
 * 根据 OneDrive 扫描结果 + Excel 数据创建 Project 与 Task
 */
import { PrismaClient } from '@prisma/client';
import { ClientCompanyInfo } from './scanOneDrive';
import { ExcelDataMap } from './readExcelData';
interface ImportConfig {
    useProduction: boolean;
    oneDriveRoot: string;
    oneDriveProjectRoot: string;
    localProjectRoot: string;
}
export interface ImportResult {
    projectsCreated: number;
    tasksCreated: number;
    tasksFailed: number;
    excelDataUsed: number;
    excelDataMissing: number;
    errors: string[];
    warnings: string[];
}
export declare function importToDatabase(prisma: PrismaClient, scanResult: {
    clients: ClientCompanyInfo[];
}, excelDataMap: ExcelDataMap, config: ImportConfig): Promise<ImportResult>;
/**
 * 生成导入报告
 */
export declare function generateImportReport(result: ImportResult): string;
export {};
//# sourceMappingURL=importToDatabase.d.ts.map