export declare class ApprovalService {
    /**
     * 审批项目（新架构：只创建前两层文件夹，不创建Task）
     *
     * Project 审批流程：
     * 1. 拒绝：更新状态为 REJECTED
     * 2. 批准：
     *    - 创建前两层文件夹（clientCompany/ 和 mineSiteName/）
     *    - 更新状态为 APPROVED
     *    - 不生成 projectCode（保留 TEMP-xxx）
     *    - 不创建 Task
     *    - 不同步 Excel（Task 创建时才同步）
     */
    static approveProject(projectId: number, approverId: number, approved: boolean, comment?: string): Promise<{
        id: number;
        teamId: number | null;
        status: import(".prisma/client").$Enums.ProjectStatus;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        priority: import(".prisma/client").$Enums.Priority;
        description: string | null;
        projectCode: string;
        approvalStatus: string;
        approvedBy: number | null;
        approvedAt: Date | null;
        progress: number;
        syncStatus: string;
        deleteRequestedBy: number | null;
        deleteRequestedAt: Date | null;
        deleteReason: string | null;
        clientCompany: string | null;
        mineSiteName: string | null;
        mineZoneId: number | null;
        clientFolderPath: string | null;
        mineSiteFolderPath: string | null;
        oneDriveClientFolderPath: string | null;
        oneDriveMineSiteFolderPath: string | null;
        ownerId: number;
        rejectionReason: string | null;
        lastSyncTime: Date | null;
        syncError: string | null;
    }>;
    /**
     * 获取待审批项目列表
     */
    static getPendingProjects(): Promise<({
        users: {
            id: number;
            username: string;
            email: string;
            realName: string;
        };
        mine_zones: {
            id: number;
            name: string;
            code: string;
            description: string;
        };
        teams: {
            id: number;
            name: string;
            description: string;
        };
    } & {
        id: number;
        teamId: number | null;
        status: import(".prisma/client").$Enums.ProjectStatus;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        priority: import(".prisma/client").$Enums.Priority;
        description: string | null;
        projectCode: string;
        approvalStatus: string;
        approvedBy: number | null;
        approvedAt: Date | null;
        progress: number;
        syncStatus: string;
        deleteRequestedBy: number | null;
        deleteRequestedAt: Date | null;
        deleteReason: string | null;
        clientCompany: string | null;
        mineSiteName: string | null;
        mineZoneId: number | null;
        clientFolderPath: string | null;
        mineSiteFolderPath: string | null;
        oneDriveClientFolderPath: string | null;
        oneDriveMineSiteFolderPath: string | null;
        ownerId: number;
        rejectionReason: string | null;
        lastSyncTime: Date | null;
        syncError: string | null;
    })[]>;
    /**
     * 获取审批统计
     */
    static getApprovalStats(): Promise<{
        pending: number;
        approved: number;
        rejected: number;
        total: number;
    }>;
}
//# sourceMappingURL=approvalService.d.ts.map