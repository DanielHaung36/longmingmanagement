/**
 * 文件夹结构镜像和验证
 * 创建标准化的文件夹结构和空文件
 */
export interface MirrorStats {
    foldersCreated: number;
    filesCreated: number;
    filesSkipped: number;
    filesSkippedSameHash: number;
    totalSize: number;
    errors: string[];
}
export interface VerifyStats {
    totalFolders: number;
    totalFiles: number;
    missingFolders: string[];
    missingFiles: string[];
    nameMismatches: Array<{
        source: string;
        target: string;
    }>;
    errors: string[];
}
/**
 * 主函数：镜像文件夹结构
 * @param sourceDir 源文件夹路径
 * @param targetDir 目标文件夹路径
 * @param createEmptyFiles true: 创建空文件(开发), false: 复制完整文件(生产)
 */
export declare function mirrorFolderStructure(sourceDir: string, targetDir: string, createEmptyFiles?: boolean): Promise<MirrorStats>;
/**
 * 主函数：验证文件夹结构
 */
export declare function verifyFolderStructure(sourceDir: string, targetDir: string): Promise<VerifyStats>;
/**
 * 生成验证报告
 */
export declare function generateVerifyReport(stats: VerifyStats): string;
//# sourceMappingURL=mirrorFolderStructure.d.ts.map