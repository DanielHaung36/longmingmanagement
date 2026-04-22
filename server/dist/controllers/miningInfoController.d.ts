/**
 * MiningInfoController - 矿业信息控制器
 */
import { Request, Response } from 'express';
export declare class MiningInfoController {
    /**
     * 获取项目的矿业信息
     * GET /api/projects/:projectId/mining-info
     */
    static getMiningInfo(req: Request, res: Response): Promise<void>;
    /**
     * 更新或创建矿业信息
     * PUT /api/projects/:projectId/mining-info
     */
    static upsertMiningInfo(req: Request, res: Response): Promise<void>;
    /**
     * 删除矿业信息
     * DELETE /api/projects/:projectId/mining-info
     */
    static deleteMiningInfo(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=miningInfoController.d.ts.map