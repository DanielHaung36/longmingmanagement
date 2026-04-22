/**
 * TaskApprovalController - Task审批控制器
 */
import { Request, Response } from 'express';
export declare class TaskApprovalController {
    /**
     * 提交Task审批
     */
    static submitForApproval(req: Request, res: Response): Promise<void>;
    /**
     * 审批Task
     */
    static approveTask(req: Request, res: Response): Promise<void>;
    /**
     * 撤回Task审批
     */
    static withdrawApproval(req: Request, res: Response): Promise<void>;
    /**
     * 获取待审批的Tasks
     */
    static getPendingTasks(req: Request, res: Response): Promise<void>;
    /**
     * 批量审批Tasks
     */
    static batchApprove(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=taskApprovalController.d.ts.map