import { JobType } from '@prisma/client';
export declare class FolderService {
    private static LOCAL_ROOT;
    private static TEMPLATE_ROOT;
    private static ONEDRIVE_BASE;
    private static TEMPLATE_MAP;
    /**
     * 创建正确的文件夹结构并复制模板
     * Client/
     *   ├─01 Client General info
     *   └─MineSite/
     *       ├─01 Project General Info
     *       └─{job_id} {project}/  (复制模板内容)
     */
    static copyTemplateFolder(jobType: JobType, clientName: string, mineSite: string, projectCode: string, projectName: string): Promise<{
        localPath: string;
        oneDrivePath: string;
    }>;
    /**
     * 创建本地项目文件夹（V2三层存储-第2层）
     */
    static createLocalProjectFolder(projectCode: string, clientName?: string, mineSite?: string): Promise<string>;
    /**
     * 生成metadata.json文件
     */
    static createMetadataFile(localPath: string, projectData: any): Promise<void>;
    /**
     * 复制模板文件到项目文件夹
     */
    static copyTemplateFiles(jobType: string, localPath: string): Promise<void>;
    /**
     * 生成OneDrive路径（第一期返回模拟路径）
     */
    static generateOneDrivePath(clientCompany: string, mineSiteName: string, projectCode: string): string;
    static deleteProjectFolder(folderPath: string): Promise<void>;
    static folderExists(folderPath: string): Promise<boolean>;
    static getFolderSize(folderPath: string): Promise<number>;
    static listFolderContents(folderPath: string): Promise<any[]>;
    static calculateRelativePath(basePath: string, targetPath: string): string;
    static setPaths(templateBase: string, projectBase: string): void;
    static getPaths(): {
        templateBase: string;
        projectBase: string;
        templateMap: Record<string, string>;
    };
}
//# sourceMappingURL=folderService.d.ts.map