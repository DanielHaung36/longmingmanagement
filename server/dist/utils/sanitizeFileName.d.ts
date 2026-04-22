/**
 * 文件名规范化工具
 * OneDrive 命名规则：
 * - 不能包含: : * ? " < > |
 * - 不能以空格开头或结尾
 * - 不能以点结尾
 * - 不能以两个或多个点开头
 */
export interface SanitizeOptions {
    replaceDirSeparator?: boolean;
    trimDots?: boolean;
    trimSpaces?: boolean;
}
/**
 * 规范化文件名，使其符合 OneDrive 命名规则
 */
export declare function sanitizeFileName(fileName: string, options?: SanitizeOptions): string;
/**
 * 验证文件名是否符合 OneDrive 命名规则
 */
export declare function isValidOneDriveName(fileName: string): boolean;
/**
 * 获取需要修复的文件名清单
 */
export declare function getInvalidCharsInFileName(fileName: string): {
    hasInvalidChars: boolean;
    invalidChars: string[];
    issues: string[];
};
//# sourceMappingURL=sanitizeFileName.d.ts.map