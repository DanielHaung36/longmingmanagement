/**
 * QuotationController - 项目报价控制器
 */
import { Request, Response } from 'express';
export declare class QuotationController {
    /**
     * 获取项目的报价信息
     * GET /api/projects/:projectId/quotations
     */
    static getProjectQuotations(req: Request, res: Response): Promise<void>;
    /**
     * 创建或更新报价信息
     * PUT /api/projects/:projectId/quotations
     */
    static upsertQuotation(req: Request, res: Response): Promise<void>;
    /**
     * 删除报价信息
     * DELETE /api/projects/:projectId/quotations
     */
    static deleteQuotation(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=quotationController.d.ts.map