/**
 * Task 编码解析器
 * 从文件夹名称解析 TaskCode 和 Title
 * 格式: {TaskCode} {TaskTitle}
 * 示例: AQ0041 LGS-EX Replacement
 */
export interface ParsedTaskInfo {
    taskCode: string;
    businessType: string;
    sequenceNumber: number;
    title: string;
    isValid: boolean;
    errors: string[];
}
export declare const VALID_BUSINESS_TYPES: string[];
/**
 * 解析文件夹名称，提取 TaskCode 和 Title
 */
export declare function parseTaskFolderName(folderName: string): ParsedTaskInfo;
/**
 * 验证 TaskCode 格式是否正确
 */
export declare function isValidTaskCode(taskCode: string): boolean;
/**
 * 从 TaskCode 提取业务类型
 */
export declare function extractBusinessType(taskCode: string): string | null;
/**
 * 从 TaskCode 提取序列号
 */
export declare function extractSequenceNumber(taskCode: string): number | null;
/**
 * 批量解析多个文件夹名称
 */
export declare function parseMultipleFolderNames(folderNames: string[]): Map<string, ParsedTaskInfo>;
/**
 * 生成有效的 Task 文件夹名称
 */
export declare function generateTaskFolderName(businessType: string, sequenceNumber: number, title: string): string;
//# sourceMappingURL=taskCodeParser.d.ts.map