"use strict";
/**
 * TaskApprovalController - Task审批控制器
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskApprovalController = void 0;
const taskApprovalService_1 = require("../services/taskApprovalService");
const logger_1 = require("../utils/logger");
const auditService_1 = require("../services/auditService");
class TaskApprovalController {
    /**
     * 提交Task审批
     */
    static async submitForApproval(req, res) {
        try {
            const { taskId } = req.params;
            const userId = req.user?.id || 84;
            const task = await taskApprovalService_1.TaskApprovalService.submitTaskForApproval(parseInt(taskId), userId);
            // 📝 记录审计日志
            await auditService_1.AuditService.logTaskApprovalSubmit(task.id, task.title, userId, req.ip, req.headers["user-agent"]);
            res.json({
                success: true,
                message: 'Task已提交审批',
                data: task,
            });
        }
        catch (error) {
            logger_1.logger.error('提交Task审批失败', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
    /**
     * 审批Task
     */
    static async approveTask(req, res) {
        try {
            const { taskId } = req.params;
            const { approved, comment } = req.body;
            const userId = req.user?.id || 84;
            const role = req.user?.role;
            if (typeof approved !== 'boolean') {
                res.status(400).json({
                    success: false,
                    message: '请提供审批结果（approved: true/false）',
                });
                return;
            }
            const task = await taskApprovalService_1.TaskApprovalService.approveTask(parseInt(taskId), userId, role, approved, comment);
            // 📝 记录审计日志
            await auditService_1.AuditService.logTaskApprovalDecision(task.id, task.title, approved, comment, userId, req.ip, req.headers["user-agent"]);
            res.json({
                success: true,
                message: `Task已${approved ? '通过' : '拒绝'}`,
                data: task,
            });
        }
        catch (error) {
            logger_1.logger.error('审批Task失败', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
    /**
     * 撤回Task审批
     */
    static async withdrawApproval(req, res) {
        try {
            const { taskId } = req.params;
            const userId = req.user?.id || 84;
            const task = await taskApprovalService_1.TaskApprovalService.withdrawTaskApproval(parseInt(taskId), userId);
            res.json({
                success: true,
                message: 'Task审批已撤回',
                data: task,
            });
        }
        catch (error) {
            logger_1.logger.error('撤回Task审批失败', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
    /**
     * 获取待审批的Tasks
     */
    static async getPendingTasks(req, res) {
        try {
            const userId = req.user?.id;
            const tasks = await taskApprovalService_1.TaskApprovalService.getPendingTasks(userId);
            res.json({
                success: true,
                data: tasks,
            });
        }
        catch (error) {
            logger_1.logger.error('获取待审批Tasks失败', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
    /**
     * 批量审批Tasks
     */
    static async batchApprove(req, res) {
        try {
            const { taskIds, approved, comment } = req.body;
            const userId = req.user?.id || 84;
            const role = req.user?.role;
            if (!Array.isArray(taskIds) || taskIds.length === 0) {
                res.status(400).json({
                    success: false,
                    message: '请提供Task ID数组',
                });
                return;
            }
            if (typeof approved !== 'boolean') {
                res.status(400).json({
                    success: false,
                    message: '请提供审批结果（approved: true/false）',
                });
                return;
            }
            const tasks = await taskApprovalService_1.TaskApprovalService.batchApproveTasks(taskIds, userId, role, approved, comment);
            // 📝 记录审计日志（批量）
            for (const task of tasks) {
                await auditService_1.AuditService.logTaskApprovalDecision(task.id, task.title, approved, comment, userId, req.ip, req.headers["user-agent"]);
            }
            res.json({
                success: true,
                message: `批量审批完成`,
                data: tasks,
            });
        }
        catch (error) {
            logger_1.logger.error('批量审批Tasks失败', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
}
exports.TaskApprovalController = TaskApprovalController;
//# sourceMappingURL=taskApprovalController.js.map