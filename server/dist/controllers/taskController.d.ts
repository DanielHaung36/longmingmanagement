/**
 * TaskController - Task REST API 控制器
 *
 * 提供 Task 的 CRUD 接口
 */
import { Request, Response } from 'express';
export declare class TaskController {
    /**
     * 创建 Task
     * POST /api/tasks
     */
    static createTask(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * 获取所有 Tasks（带搜索、分页和筛选）
     * GET /api/tasks
     *
     * 查询参数:
     * - search: 全文搜索关键词
     * - jobType: 业务类型 (AT/AC/AQ/AS/AP)
     * - mineral: Mineral过滤
     * - status: 工作流状态 (TODO/IN_PROGRESS/REVIEW/DONE/CANCELLED)
     * - priority: 优先级 (LOW/MEDIUM/HIGH/URGENT)
     * - approvalStatus: 审批状态 (DRAFT/PENDING/APPROVED/REJECTED/DELETE_PENDING)
     * - assignedUserId: 分配用户ID
     * - projectId: 项目ID
     * - page: 页码（默认1）
     * - limit: 每页数量（默认50）
     */
    static getAllTasks(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * 获取 Task 详情
     * GET /api/tasks/:id
     */
    static getTaskById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * 获取 Project 下的所有 Tasks
     * GET /api/tasks/project/:projectId
     */
    static getTasksByProject(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * 获取当前用户的所有 Tasks
     * GET /api/tasks/my
     */
    static getMyTasks(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * 更新 Task
     * PUT /api/tasks/:id
     */
    static updateTask(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * 更新 Task 状态
     * PATCH /api/tasks/:id/status
     */
    static updateTaskStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * 删除 Task
     * DELETE /api/tasks/:id
     */
    static deleteTask(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * 批量创建 Tasks
     * POST /api/tasks/batch
     */
    static createBatchTasks(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * 获取待审批的 Tasks
     * GET /api/tasks/pending
     */
    static getPendingTasks(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * 获取草稿 Tasks
     * GET /api/tasks/draft
     */
    static getDraftTasks(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * 提交 Task 审批
     * POST /api/tasks/:id/submit
     */
    static submitForApproval(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * 审批 Task
     * POST /api/tasks/:id/approve
     */
    static approveTask(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * 撤回 Task 审批
     * POST /api/tasks/:id/withdraw
     */
    static withdrawApproval(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * 批量审批 Tasks
     * POST /api/tasks/batch-approve
     */
    static batchApprove(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * 搜索 Tasks（模糊搜索）
     * GET /api/tasks/search?q=关键词&limit=10
     */
    static searchTasks(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * 获取待删除审批的 Tasks
     * GET /api/tasks/pending-deletion
     */
    static getPendingDeletionTasks(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * 提交 Task 删除申请
     * POST /api/tasks/:id/request-deletion
     */
    static requestDeletion(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * 审批 Task 删除申请
     * POST /api/tasks/:id/approve-deletion
     */
    static approveDeletion(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * 撤回 Task 删除申请
     * POST /api/tasks/:id/withdraw-deletion
     */
    static withdrawDeletion(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * 导出任务数据为 Excel 文件
     * GET /api/tasks/export
     *
     * 查询参数（可选）:
     * - jobType: 业务类型筛选 (AT/AC/AQ/AS/AP)
     * - status: 任务状态筛选 (TODO/IN_PROGRESS/REVIEW/DONE/CANCELLED)
     * - priority: 优先级筛选 (LOW/MEDIUM/HIGH/URGENT)
     * - approvalStatus: 审批状态筛选 (DRAFT/PENDING/APPROVED/REJECTED)
     * - startDate: 开始日期 (YYYY-MM-DD)
     * - endDate: 结束日期 (YYYY-MM-DD)
     */
    static exportTasksToExcel(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * 获取所有唯一的矿物类型
     * GET /api/tasks/minerals
     */
    static getMinerals(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=taskController.d.ts.map