/**
 * Audit Service - 操作日志服务
 * 记录系统中所有重要的操作和变更
 */
export interface AuditLogInput {
    tableName: string;
    recordId: number;
    action: string;
    changes?: any;
    userId?: number | null;
    ipAddress?: string;
    userAgent?: string;
}
export declare class AuditService {
    /**
     * 创建审计日志
     */
    static createLog(input: AuditLogInput): Promise<void>;
    /**
     * 文件上传日志
     */
    static logFileUpload(fileId: number, fileName: string, taskId: number, userId: number | null, ipAddress?: string, userAgent?: string): Promise<void>;
    /**
     * 文件删除请求日志
     */
    static logFileDeleteRequest(fileId: number, fileName: string, reason: string, userId: number | null, ipAddress?: string, userAgent?: string): Promise<void>;
    /**
     * 文件删除审批日志
     */
    static logFileDeleteApproval(fileId: number, fileName: string, approved: boolean, comment: string | undefined, approverId: number | null, ipAddress?: string, userAgent?: string): Promise<void>;
    /**
     * 创建文件夹日志
     */
    static logFolderCreate(taskId: number, folderName: string, folderPath: string, userId: number | null, ipAddress?: string, userAgent?: string): Promise<void>;
    /**
     * 项目审批提交日志
     */
    static logProjectApprovalSubmit(projectId: number, projectName: string, userId: number | null, ipAddress?: string, userAgent?: string): Promise<void>;
    /**
     * 项目审批决策日志
     */
    static logProjectApprovalDecision(projectId: number, projectName: string, approved: boolean, comment: string | undefined, approverId: number | null, ipAddress?: string, userAgent?: string): Promise<void>;
    /**
     * 任务审批提交日志
     */
    static logTaskApprovalSubmit(taskId: number, taskTitle: string, userId: number | null, ipAddress?: string, userAgent?: string): Promise<void>;
    /**
     * 任务审批决策日志
     */
    static logTaskApprovalDecision(taskId: number, taskTitle: string, approved: boolean, comment: string | undefined, approverId: number | null, ipAddress?: string, userAgent?: string): Promise<void>;
    /**
     * 项目创建日志
     */
    static logProjectCreate(projectId: number, projectName: string, userId: number | null, ipAddress?: string, userAgent?: string): Promise<void>;
    /**
     * 项目更新日志
     */
    static logProjectUpdate(projectId: number, projectName: string, changes: any, userId: number | null, ipAddress?: string, userAgent?: string): Promise<void>;
    /**
     * 任务创建日志
     */
    static logTaskCreate(taskId: number, taskTitle: string, userId: number | null, ipAddress?: string, userAgent?: string): Promise<void>;
    /**
     * 任务更新日志
     */
    static logTaskUpdate(taskId: number, taskTitle: string, changes: any, userId: number | null, ipAddress?: string, userAgent?: string): Promise<void>;
    /**
     * 获取审计日志列表
     */
    static getLogs(params: {
        tableName?: string;
        recordId?: number;
        userId?: number;
        action?: string;
        startDate?: Date;
        endDate?: Date;
        page?: number;
        limit?: number;
    }): Promise<{
        logs: ({
            users: {
                id: number;
                username: string;
                email: string;
                realName: string;
            };
        } & {
            id: number;
            createdAt: Date;
            userId: number | null;
            ipAddress: string | null;
            userAgent: string | null;
            tableName: string;
            recordId: number;
            action: string;
            changes: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    /**
     * 获取特定记录的操作历史
     */
    static getRecordHistory(tableName: string, recordId: number): Promise<({
        users: {
            id: number;
            username: string;
            email: string;
            realName: string;
        };
    } & {
        id: number;
        createdAt: Date;
        userId: number | null;
        ipAddress: string | null;
        userAgent: string | null;
        tableName: string;
        recordId: number;
        action: string;
        changes: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    /**
     * 获取用户操作历史
     */
    static getUserHistory(userId: number, limit?: number): Promise<({
        users: {
            id: number;
            username: string;
            email: string;
            realName: string;
        };
    } & {
        id: number;
        createdAt: Date;
        userId: number | null;
        ipAddress: string | null;
        userAgent: string | null;
        tableName: string;
        recordId: number;
        action: string;
        changes: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    /**
     * 获取最近的操作日志
     */
    static getRecentLogs(limit?: number): Promise<({
        users: {
            id: number;
            username: string;
            email: string;
            realName: string;
        };
    } & {
        id: number;
        createdAt: Date;
        userId: number | null;
        ipAddress: string | null;
        userAgent: string | null;
        tableName: string;
        recordId: number;
        action: string;
        changes: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
}
//# sourceMappingURL=auditService.d.ts.map