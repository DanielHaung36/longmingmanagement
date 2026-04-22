/**
 * Audit Controller - 审计日志控制器
 */
import { Request, Response } from 'express';
export declare class AuditController {
    /**
     * GET /api/audit/logs
     * 获取审计日志列表
     */
    static getLogs(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/audit/record-history/:tableName/:recordId
     * 获取特定记录的操作历史
     */
    static getRecordHistory(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/audit/user-history/:userId
     * 获取用户操作历史
     */
    static getUserHistory(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/audit/recent
     * 获取最近的操作日志
     */
    static getRecentLogs(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=auditController.d.ts.map