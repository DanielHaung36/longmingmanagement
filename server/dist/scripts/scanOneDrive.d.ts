/**
 * OneDrive 文件夹扫描器
 * 扫描三层结构：客户公司 → 矿区 → Task文件夹
 */
export interface TaskFolderInfo {
    taskCode: string;
    businessType: string;
    sequenceNumber: number;
    title: string;
    originalName: string;
    fullPath: string;
    parentPath: string;
    subFolders: string[];
    files: string[];
    hasInvalidName: boolean;
    nameIssues: string[];
    isValid: boolean;
    errors: string[];
}
export interface MineSiteInfo {
    name: string;
    originalName: string;
    path: string;
    parentPath: string;
    taskFolders: TaskFolderInfo[];
    totalTasks: number;
    invalidTasks: number;
}
export interface ClientCompanyInfo {
    name: string;
    originalName: string;
    path: string;
    mineSites: MineSiteInfo[];
    totalTasks: number;
    invalidTasks: number;
}
export interface OneDriveScanResult {
    rootPath: string;
    totalClients: number;
    totalMineSites: number;
    totalTasks: number;
    invalidTasks: number;
    clients: ClientCompanyInfo[];
    errors: string[];
}
/**
 * 主扫描函数：扫描 OneDrive Client 目录
 */
export declare function scanOneDrive(rootPath: string): Promise<OneDriveScanResult>;
/**
 * 生成扫描报告
 */
export declare function generateScanReport(result: OneDriveScanResult): string;
//# sourceMappingURL=scanOneDrive.d.ts.map