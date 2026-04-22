/**
 * TaskApprovalService - Task审批服务
 *
 * 功能：
 * 1. Task审批流程管理
 * 2. 审批通过后无需额外操作（文件夹和Excel已在创建时完成）
 * 3. 审批拒绝后标记状态
 * 4. 记录审批历史
 */
export declare class TaskApprovalService {
    /**
     * 提交Task审批
     *
     * @param taskId - Task ID
     * @param submitterId - 提交者ID
     * @returns 更新后的Task
     */
    static submitTaskForApproval(taskId: number, submitterId: number): Promise<any>;
    /**
     * 审批Task
     *
     * @param taskId - Task ID
     * @param approverId - 审批者ID
     * @param approved - 是否通过
     * @param comment - 审批意见
     * @returns 更新后的Task
     */
    static approveTask(taskId: number, approverId: number, approverrole: string, approved: boolean, comment?: string): Promise<any>;
    /**
     * 撤回Task审批
     *
     * @param taskId - Task ID
     * @param userId - 操作者ID
     * @returns 更新后的Task
     */
    static withdrawTaskApproval(taskId: number, userId: number, userRole?: string): Promise<any>;
    /**
     * 获取待审批的Tasks
     *
     * @param approverId - 审批者ID（可选）
     * @returns Task列表
     */
    static getPendingTasks(approverId?: number): Promise<any[]>;
    /**
     * 批量审批Tasks
     *
     * @param taskIds - Task ID数组
     * @param approverId - 审批者ID
     * @param approved - 是否通过
     * @param comment - 审批意见
     * @returns 更新后的Tasks
     */
    static batchApproveTasks(taskIds: number[], approverId: number, approverRole: string, approved: boolean, comment?: string): Promise<any[]>;
    /**
     * 提交 Task 删除请求
     *
     * 流程:
     * 1. 验证Task状态（必须是APPROVED状态才能删除）
     * 2. 更新Task状态为 DELETE_PENDING
     * 3. 记录删除请求信息
     */
    static requestTaskDeletion(taskId: number, userId: number, reason: string): Promise<any>;
    /**
     * 审批 Task 删除请求
     *
     * 流程:
     * 1. 验证Task状态（必须是DELETE_PENDING）
     * 2. 如果批准：删除Task、文件夹、Excel行
     * 3. 如果拒绝：恢复Task到APPROVED状态
     */
    static approveTaskDeletion(taskId: number, userId: number, approved: boolean, comment?: string): Promise<any>;
    /**
     * 撤回 Task 删除请求
     *
     * 只有删除请求的提交人可以撤回
     */
    static withdrawTaskDeletionRequest(taskId: number, userId: number): Promise<any>;
    /**
     * 获取待删除审批的 Tasks
     */
    static getPendingDeletionTasks(userId?: number): Promise<any[]>;
}
//# sourceMappingURL=taskApprovalService.d.ts.map