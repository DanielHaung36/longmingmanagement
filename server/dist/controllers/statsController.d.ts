/**
 * StatsController - 统计和报表控制器
 */
import { Request, Response } from 'express';
export declare class StatsController {
    /**
     * 仪表盘统计
     * GET /api/stats/dashboard
     */
    static getDashboardStats(req: Request, res: Response): Promise<void>;
    /**
     * 任务统计
     * GET /api/stats/tasks
     */
    static getTaskStats(req: Request, res: Response): Promise<void>;
    /**
     * 项目统计
     * GET /api/stats/projects
     */
    static getProjectStats(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=statsController.d.ts.map