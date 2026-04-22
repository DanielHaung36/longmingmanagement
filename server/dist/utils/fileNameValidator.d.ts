/**
 * 文件名校验工具
 * 确保文件/文件夹名称符合 OneDrive/SharePoint 的命名规范
 *
 * OneDrive 文件名限制：
 * - 不能以空格开头或结尾
 * - 不能以句点(.)结尾
 * - 不能以两个句点(..)开头
 * - 不能包含以下字符: \ / : * ? " < > |
 * - 某些保留名称不能使用（如 CON, PRN, AUX 等）
 */
export declare class FileNameValidator {
    private static INVALID_CHARS;
    private static RESERVED_NAMES;
    /**
     * 清理文件名，使其符合 OneDrive 规范
     * @param fileName - 原始文件名
     * @param replacement - 替换字符（默认为下划线）
     * @returns 清理后的文件名
     */
    static sanitizeFileName(fileName: string, replacement?: string): string;
    /**
     * 验证文件名是否有效
     * @param fileName - 文件名
     * @returns { valid: boolean, errors: string[] }
     */
    static validateFileName(fileName: string): {
        valid: boolean;
        errors: string[];
    };
    /**
     * 批量清理路径中的所有部分
     * @param pathParts - 路径部分数组（如：['Client', 'Mine Site', 'Project Name']）
     * @returns 清理后的路径部分数组
     */
    static sanitizePathParts(pathParts: string[]): string[];
    /**
     * 清理完整路径
     * @param fullPath - 完整路径（如：'C:/Projects/Client/Mine Site/Project Name'）
     * @returns 清理后的路径
     */
    static sanitizePath(fullPath: string): string;
}
//# sourceMappingURL=fileNameValidator.d.ts.map