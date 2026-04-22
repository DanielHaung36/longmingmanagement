"use strict";
/**
 * TaskController - Task REST API 控制器
 *
 * 提供 Task 的 CRUD 接口
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskController = void 0;
const taskService_1 = require("../services/taskService");
const taskApprovalService_1 = require("../services/taskApprovalService");
const taskExcelSyncService_1 = require("../services/taskExcelSyncService");
const response_types_1 = require("../types/response.types");
const logger_1 = require("../utils/logger");
const websocketService_1 = require("../services/websocketService");
class TaskController {
    /**
     * 创建 Task
     * POST /api/tasks
     */
    static async createTask(req, res) {
        try {
            const { title, description, jobType, // 新增：任务类型必填字段
            projectId, assignedUserId, mineral, priority, tags, excelComment, quotationNumber, startDate, dueDate, estimatedHours, } = req.body;
            // 验证必填字段
            if (!title || !projectId || !jobType) {
                return res.status(400).json(response_types_1.ResponseBuilder.validationError('title/projectId/jobType', 'Title, projectId, and jobType are required fields'));
            }
            // 验证 jobType 的有效值
            const validJobTypes = ['AC', 'AP', 'AQ', 'AS', 'AT'];
            if (!validJobTypes.includes(jobType)) {
                return res.status(400).json(response_types_1.ResponseBuilder.validationError('jobType', 'JobType must be one of AC, AP, AQ, AS, AT'));
            }
            // 从认证中间件获取当前用户ID
            const authorUserId = req.user?.id;
            logger_1.logger.info('测试', {
                userId: req.user?.id,
                body: req.body,
            });
            const task = await taskService_1.TaskService.createTask({
                title,
                description,
                jobType, // 传递 jobType
                projectId: parseInt(projectId),
                authorUserId,
                mineral,
                tags,
                excelComment,
                quotationNumber: quotationNumber ? quotationNumber : undefined,
                assignedUserId: assignedUserId ? parseInt(assignedUserId) : undefined,
                priority,
                startDate: startDate ? new Date(startDate) : undefined,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                estimatedHours: estimatedHours ? parseInt(estimatedHours) : undefined,
            });
            // 🔌 如果任务需要审批，发送 WebSocket 通知
            if (task.approvalStatus === 'PENDING') {
                websocketService_1.WebSocketService.emitTaskCreated({
                    taskId: task.id,
                    taskCode: task.taskCode,
                    title: task.title,
                    approvalStatus: task.approvalStatus,
                    createdBy: authorUserId,
                });
            }
            return res.status(201).json(response_types_1.ResponseBuilder.created(task, 'Project created successfully'));
        }
        catch (error) {
            logger_1.logger.error('Failed to create Task', { error: error.message, body: req.body });
            return res.status(500).json(response_types_1.ResponseBuilder.error(error.message, 'TASK_CREATE_FAILED'));
        }
    }
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
    static async getAllTasks(req, res) {
        try {
            const { search, jobType, mineral, status, priority, assignedUserId, projectId, page, limit, approvalStatus, dueRange } = req.query;
            const filters = {};
            if (search)
                filters.search = search;
            if (jobType)
                filters.jobType = jobType;
            if (mineral)
                filters.mineral = mineral;
            if (status)
                filters.status = status;
            if (priority)
                filters.priority = priority;
            if (assignedUserId)
                filters.assignedUserId = parseInt(assignedUserId);
            if (projectId)
                filters.projectId = parseInt(projectId);
            if (approvalStatus)
                filters.approvalStatus = approvalStatus;
            if (dueRange)
                filters.dueRange = dueRange;
            const pagination = {};
            if (page)
                pagination.page = parseInt(page);
            if (limit)
                pagination.limit = parseInt(limit);
            const result = await taskService_1.TaskService.getAllTasks(filters, pagination);
            return res.status(200).json(response_types_1.ResponseBuilder.paginated(result.tasks, result.pagination.page, result.pagination.limit, result.pagination.total, 'Project list retrieved successfully'));
        }
        catch (error) {
            logger_1.logger.error('Failed to fetch Tasks list', { error: error.message });
            return res.status(500).json(response_types_1.ResponseBuilder.error(error.message, 'TASKS_FETCH_FAILED'));
        }
    }
    /**
     * 获取 Task 详情
     * GET /api/tasks/:id
     */
    static async getTaskById(req, res) {
        try {
            const taskId = parseInt(req.params.id);
            if (isNaN(taskId)) {
                return res.status(400).json(response_types_1.ResponseBuilder.validationError('id', 'Task ID必须是数字'));
            }
            const task = await taskService_1.TaskService.getTaskById(taskId);
            return res.status(200).json(response_types_1.ResponseBuilder.success(task, '获取Task详情成功'));
        }
        catch (error) {
            logger_1.logger.error('获取Task详情失败', { taskId: req.params.id, error: error.message });
            if (error.message.includes('不存在')) {
                return res.status(404).json(response_types_1.ResponseBuilder.notFound('Task'));
            }
            return res.status(500).json(response_types_1.ResponseBuilder.error(error.message, 'TASK_FETCH_FAILED'));
        }
    }
    /**
     * 获取 Project 下的所有 Tasks
     * GET /api/tasks/project/:projectId
     */
    static async getTasksByProject(req, res) {
        try {
            const projectId = parseInt(req.params.projectId);
            const { status, priority, assignedUserId } = req.query;
            if (isNaN(projectId)) {
                return res.status(400).json(response_types_1.ResponseBuilder.validationError('projectId', 'Minesite ID must be a number'));
            }
            const filters = {};
            if (status)
                filters.status = status;
            if (priority)
                filters.priority = priority;
            if (assignedUserId)
                filters.assignedUserId = parseInt(assignedUserId);
            const tasks = await taskService_1.TaskService.getTasksByProject(projectId, filters);
            return res.status(200).json(response_types_1.ResponseBuilder.list(tasks, `Project for Minesite ${projectId} retrieved successfully`));
        }
        catch (error) {
            logger_1.logger.error('Failed to fetch Project', {
                projectId: parseInt(req.params.projectId),
                error: error.message,
            });
            return res.status(500).json(response_types_1.ResponseBuilder.error(error.message, 'TASKS_FETCH_FAILED'));
        }
    }
    /**
     * 获取当前用户的所有 Tasks
     * GET /api/tasks/my
     */
    static async getMyTasks(req, res) {
        try {
            const userId = req.user?.id || 2;
            const { status, priority, includeAuthored } = req.query;
            const filters = {};
            if (status)
                filters.status = status;
            if (priority)
                filters.priority = priority;
            const tasks = await taskService_1.TaskService.getTasksByUser(userId, filters, { includeAuthored: includeAuthored === 'true' });
            return res.status(200).json(response_types_1.ResponseBuilder.list(tasks, 'User Tasks retrieved successfully'));
        }
        catch (error) {
            logger_1.logger.error('Failed to fetch user Tasks', { error: error.message });
            return res.status(500).json(response_types_1.ResponseBuilder.error(error.message, 'TASKS_FETCH_FAILED'));
        }
    }
    /**
     * 更新 Task
     * PUT /api/tasks/:id
     */
    static async updateTask(req, res) {
        try {
            const taskId = parseInt(req.params.id);
            if (isNaN(taskId)) {
                return res.status(400).json(response_types_1.ResponseBuilder.validationError('id', 'Project ID must be a number'));
            }
            const { title, description, status, priority, assignedUserId, mineral, // 添加：mineral 字段可以修改
            startDate, dueDate, estimatedHours, actualHours, progress, } = req.body;
            // ⚠️ 注意：jobType 不在这里，因为创建后不能修改
            const updateData = {};
            if (title !== undefined)
                updateData.title = title;
            if (description !== undefined)
                updateData.description = description;
            if (status !== undefined)
                updateData.status = status;
            if (priority !== undefined)
                updateData.priority = priority;
            if (assignedUserId !== undefined)
                updateData.assignedUserId = parseInt(assignedUserId);
            if (mineral !== undefined)
                updateData.mineral = mineral; // 添加：允许更新 mineral
            if (startDate !== undefined)
                updateData.startDate = new Date(startDate);
            if (dueDate !== undefined)
                updateData.dueDate = new Date(dueDate);
            if (estimatedHours !== undefined)
                updateData.estimatedHours = parseInt(estimatedHours);
            if (actualHours !== undefined)
                updateData.actualHours = parseInt(actualHours);
            if (progress !== undefined)
                updateData.progress = parseInt(progress);
            const task = await taskService_1.TaskService.updateTask(taskId, updateData);
            return res.status(200).json(response_types_1.ResponseBuilder.updated(task, 'Task updated successfully'));
        }
        catch (error) {
            logger_1.logger.error('Failed to update Task', {
                taskId: req.params.id,
                error: error.message,
                body: req.body,
            });
            if (error.message.includes('不存在')) {
                return res.status(404).json(response_types_1.ResponseBuilder.notFound('Task'));
            }
            return res.status(500).json(response_types_1.ResponseBuilder.error(error.message, 'TASK_UPDATE_FAILED'));
        }
    }
    /**
     * 更新 Task 状态
     * PATCH /api/tasks/:id/status
     */
    static async updateTaskStatus(req, res) {
        try {
            const taskId = parseInt(req.params.id);
            const { status } = req.body;
            if (isNaN(taskId)) {
                return res.status(400).json(response_types_1.ResponseBuilder.validationError('id', 'Task ID必须是数字'));
            }
            if (!status) {
                return res.status(400).json(response_types_1.ResponseBuilder.validationError('status', '状态为必填项'));
            }
            const task = await taskService_1.TaskService.updateTaskStatus(taskId, status);
            return res.status(200).json(response_types_1.ResponseBuilder.updated(task, 'Task状态更新成功'));
        }
        catch (error) {
            logger_1.logger.error('更新Task状态失败', {
                taskId: req.params.id,
                error: error.message,
            });
            return res.status(500).json(response_types_1.ResponseBuilder.error(error.message, 'TASK_STATUS_UPDATE_FAILED'));
        }
    }
    /**
     * 删除 Task
     * DELETE /api/tasks/:id
     */
    static async deleteTask(req, res) {
        try {
            const taskId = parseInt(req.params.id);
            if (isNaN(taskId)) {
                return res.status(400).json(response_types_1.ResponseBuilder.validationError('id', 'Task ID必须是数字'));
            }
            await taskService_1.TaskService.deleteTask(taskId);
            return res.status(200).json(response_types_1.ResponseBuilder.deleted('Task删除成功'));
        }
        catch (error) {
            logger_1.logger.error('删除Task失败', {
                taskId: req.params.id,
                error: error.message,
            });
            if (error.message.includes('不存在')) {
                return res.status(404).json(response_types_1.ResponseBuilder.notFound('Task'));
            }
            return res.status(500).json(response_types_1.ResponseBuilder.error(error.message, 'TASK_DELETE_FAILED'));
        }
    }
    /**
     * 批量创建 Tasks
     * POST /api/tasks/batch
     */
    static async createBatchTasks(req, res) {
        try {
            const { projectId, tasks } = req.body;
            if (!projectId || !tasks || !Array.isArray(tasks)) {
                return res.status(400).json(response_types_1.ResponseBuilder.validationError('projectId/tasks', 'projectId和tasks数组为必填项'));
            }
            const authorUserId = req.user?.id || 2;
            // 为每个task添加authorUserId
            const tasksWithAuthor = tasks.map((task) => ({
                ...task,
                authorUserId,
            }));
            const createdTasks = await taskService_1.TaskService.createBatchTasks(parseInt(projectId), tasksWithAuthor);
            return res.status(201).json(response_types_1.ResponseBuilder.batch(createdTasks.map((task, index) => ({
                id: index,
                success: true,
                data: task,
            })), '批量创建Tasks完成'));
        }
        catch (error) {
            logger_1.logger.error('批量创建Tasks失败', { error: error.message, body: req.body });
            return res.status(500).json(response_types_1.ResponseBuilder.error(error.message, 'BATCH_TASKS_CREATE_FAILED'));
        }
    }
    // ==================== 审批相关方法 ====================
    /**
     * 获取待审批的 Tasks
     * GET /api/tasks/pending
     */
    static async getPendingTasks(req, res) {
        try {
            const userId = req.user?.id;
            const tasks = await taskApprovalService_1.TaskApprovalService.getPendingTasks(userId);
            return res.status(200).json(response_types_1.ResponseBuilder.list(tasks, '获取待审批Tasks成功'));
        }
        catch (error) {
            logger_1.logger.error('获取待审批Tasks失败', { error: error.message });
            return res.status(500).json(response_types_1.ResponseBuilder.error(error.message, 'PENDING_TASKS_FETCH_FAILED'));
        }
    }
    /**
     * 获取草稿 Tasks
     * GET /api/tasks/draft
     */
    static async getDraftTasks(req, res) {
        try {
            const userId = req.user?.id;
            const tasks = await taskService_1.TaskService.getAllTasks({ approvalStatus: 'DRAFT' });
            return res.status(200).json(response_types_1.ResponseBuilder.list(tasks.tasks, '获取草稿Tasks成功'));
        }
        catch (error) {
            logger_1.logger.error('获取草稿Tasks失败', { error: error.message });
            return res.status(500).json(response_types_1.ResponseBuilder.error(error.message, 'DRAFT_TASKS_FETCH_FAILED'));
        }
    }
    /**
     * 提交 Task 审批
     * POST /api/tasks/:id/submit
     */
    static async submitForApproval(req, res) {
        try {
            const taskId = parseInt(req.params.id);
            const userId = req.user?.id || 1;
            if (isNaN(taskId)) {
                return res.status(400).json(response_types_1.ResponseBuilder.validationError('id', 'Task ID必须是数字'));
            }
            const task = await taskApprovalService_1.TaskApprovalService.submitTaskForApproval(taskId, userId);
            // 🔌 提交审批后发送 WebSocket 通知（状态变为 PENDING）
            if (task.approvalStatus === 'PENDING') {
                websocketService_1.WebSocketService.emitTaskCreated({
                    taskId: task.id,
                    taskCode: task.taskCode,
                    title: task.title,
                    approvalStatus: task.approvalStatus,
                    createdBy: userId,
                });
            }
            return res.status(200).json(response_types_1.ResponseBuilder.success(task, 'Task已提交审批'));
        }
        catch (error) {
            logger_1.logger.error('提交Task审批失败', { taskId: req.params.id, error: error.message });
            return res.status(500).json(response_types_1.ResponseBuilder.error(error.message, 'TASK_SUBMIT_FAILED'));
        }
    }
    /**
     * 审批 Task
     * POST /api/tasks/:id/approve
     */
    static async approveTask(req, res) {
        try {
            const taskId = parseInt(req.params.id);
            const { approved, comment } = req.body;
            const userId = req.user?.id;
            const role = req.user?.role;
            if (isNaN(taskId)) {
                return res.status(400).json(response_types_1.ResponseBuilder.validationError('id', 'Task ID必须是数字'));
            }
            if (typeof approved !== 'boolean') {
                return res.status(400).json(response_types_1.ResponseBuilder.validationError('approved', '请提供审批结果（approved: true/false）'));
            }
            const task = await taskApprovalService_1.TaskApprovalService.approveTask(taskId, userId, role, approved, comment);
            // 🔌 发送 WebSocket 审批状态变更通知
            websocketService_1.WebSocketService.emitTaskApprovalChange({
                taskId: task.id,
                taskCode: task.taskCode,
                title: task.title,
                approvalStatus: task.approvalStatus,
                approvedBy: userId,
                comment: comment,
            });
            return res.status(200).json(response_types_1.ResponseBuilder.success(task, `Task已${approved ? '通过' : '拒绝'}`));
        }
        catch (error) {
            logger_1.logger.error('审批Task失败', { taskId: req.params.id, error: error.message });
            return res.status(500).json(response_types_1.ResponseBuilder.error(error.message, 'TASK_APPROVE_FAILED'));
        }
    }
    /**
     * 撤回 Task 审批
     * POST /api/tasks/:id/withdraw
     */
    static async withdrawApproval(req, res) {
        try {
            const taskId = parseInt(req.params.id);
            const userId = req.user?.id || 1;
            if (isNaN(taskId)) {
                return res.status(400).json(response_types_1.ResponseBuilder.validationError('id', 'Project ID must be a number'));
            }
            const userRole = req.user?.role || '';
            const task = await taskApprovalService_1.TaskApprovalService.withdrawTaskApproval(taskId, userId, userRole);
            return res.status(200).json(response_types_1.ResponseBuilder.success(task, 'Task审批已撤回'));
        }
        catch (error) {
            logger_1.logger.error('撤回Task审批失败', { taskId: req.params.id, error: error.message });
            return res.status(500).json(response_types_1.ResponseBuilder.error(error.message, 'TASK_WITHDRAW_FAILED'));
        }
    }
    /**
     * 批量审批 Tasks
     * POST /api/tasks/batch-approve
     */
    static async batchApprove(req, res) {
        try {
            const { taskIds, approved, comment } = req.body;
            const userId = req.user?.id || 1;
            const role = req.user?.role;
            if (!Array.isArray(taskIds) || taskIds.length === 0) {
                return res.status(400).json(response_types_1.ResponseBuilder.validationError('taskIds', '请提供Task ID数组'));
            }
            if (typeof approved !== 'boolean') {
                return res.status(400).json(response_types_1.ResponseBuilder.validationError('approved', '请提供审批结果（approved: true/false）'));
            }
            const tasks = await taskApprovalService_1.TaskApprovalService.batchApproveTasks(taskIds, userId, role, approved, comment);
            return res.status(200).json(response_types_1.ResponseBuilder.batch(tasks.map((task, index) => ({
                id: index,
                success: true,
                data: task,
            })), '批量审批完成'));
        }
        catch (error) {
            logger_1.logger.error('批量审批Tasks失败', { error: error.message, body: req.body });
            return res.status(500).json(response_types_1.ResponseBuilder.error(error.message, 'BATCH_APPROVE_FAILED'));
        }
    }
    /**
     * 搜索 Tasks（模糊搜索）
     * GET /api/tasks/search?q=关键词&limit=10
     */
    static async searchTasks(req, res) {
        try {
            const { q, limit = 10 } = req.query;
            if (!q || q.trim().length === 0) {
                return res.status(400).json(response_types_1.ResponseBuilder.validationError('q', '搜索关键词不能为空'));
            }
            const searchTerm = q.trim();
            const limitNum = parseInt(limit);
            const tasks = await taskService_1.TaskService.searchTasks(searchTerm, limitNum);
            return res.status(200).json(response_types_1.ResponseBuilder.list(tasks, `找到 ${tasks.length} 个Task`));
        }
        catch (error) {
            logger_1.logger.error('搜索Tasks失败', { query: req.query, error: error.message });
            return res.status(500).json(response_types_1.ResponseBuilder.error(error.message, 'TASKS_SEARCH_FAILED'));
        }
    }
    // ==================== 删除审批相关方法 ====================
    /**
     * 获取待删除审批的 Tasks
     * GET /api/tasks/pending-deletion
     */
    static async getPendingDeletionTasks(req, res) {
        try {
            const userId = req.user?.id;
            const tasks = await taskApprovalService_1.TaskApprovalService.getPendingDeletionTasks(userId);
            return res.status(200).json(response_types_1.ResponseBuilder.list(tasks, '获取待删除审批Tasks成功'));
        }
        catch (error) {
            logger_1.logger.error('获取待删除审批Tasks失败', { error: error.message });
            return res.status(500).json(response_types_1.ResponseBuilder.error(error.message, 'PENDING_DELETION_TASKS_FETCH_FAILED'));
        }
    }
    /**
     * 提交 Task 删除申请
     * POST /api/tasks/:id/request-deletion
     */
    static async requestDeletion(req, res) {
        try {
            const taskId = parseInt(req.params.id);
            const { reason } = req.body;
            const userId = req.user?.id || 1;
            if (isNaN(taskId)) {
                return res.status(400).json(response_types_1.ResponseBuilder.validationError('id', 'Task ID必须是数字'));
            }
            if (!reason || reason.trim().length === 0) {
                return res.status(400).json(response_types_1.ResponseBuilder.validationError('reason', '删除原因为必填项'));
            }
            const task = await taskApprovalService_1.TaskApprovalService.requestTaskDeletion(taskId, userId, reason);
            return res.status(200).json(response_types_1.ResponseBuilder.success(task, 'Task删除申请已提交'));
        }
        catch (error) {
            logger_1.logger.error('提交Task删除申请失败', { taskId: req.params.id, error: error.message });
            return res.status(500).json(response_types_1.ResponseBuilder.error(error.message, 'TASK_DELETION_REQUEST_FAILED'));
        }
    }
    /**
     * 审批 Task 删除申请
     * POST /api/tasks/:id/approve-deletion
     */
    static async approveDeletion(req, res) {
        try {
            const taskId = parseInt(req.params.id);
            const { approved, comment } = req.body;
            const userId = req.user?.id || 1;
            if (isNaN(taskId)) {
                return res.status(400).json(response_types_1.ResponseBuilder.validationError('id', 'Task ID must be a number'));
            }
            if (typeof approved !== 'boolean') {
                return res.status(400).json(response_types_1.ResponseBuilder.validationError('approved', 'Approval status is required (approved: true/false)'));
            }
            const task = await taskApprovalService_1.TaskApprovalService.approveTaskDeletion(taskId, userId, approved, comment);
            // 🔌 发送 WebSocket 删除审批通知
            websocketService_1.WebSocketService.emitTaskDeletionApproval({
                taskId: task.id,
                taskCode: task.taskCode,
                approved: approved,
                approvedBy: userId,
            });
            return res.status(200).json(`Project deletion request has been ${approved ? 'approved (Task deleted)' : 'rejected (Task restored)'}`);
        }
        catch (error) {
            logger_1.logger.error('审批Task删除申请失败', { taskId: req.params.id, error: error.message });
            return res.status(500).json(response_types_1.ResponseBuilder.error(error.message, 'TASK_DELETION_APPROVE_FAILED'));
        }
    }
    /**
     * 撤回 Task 删除申请
     * POST /api/tasks/:id/withdraw-deletion
     */
    static async withdrawDeletion(req, res) {
        try {
            const taskId = parseInt(req.params.id);
            const userId = req.user?.id || 1;
            if (isNaN(taskId)) {
                return res.status(400).json(response_types_1.ResponseBuilder.validationError('id', 'Project ID must be a number'));
            }
            const task = await taskApprovalService_1.TaskApprovalService.withdrawTaskDeletionRequest(taskId, userId);
            return res.status(200).json(response_types_1.ResponseBuilder.success(task, 'Project deletion request has been withdrawn'));
        }
        catch (error) {
            logger_1.logger.error('Failed to withdraw Project deletion request', { taskId: req.params.id, error: error.message });
            return res.status(500).json(response_types_1.ResponseBuilder.error(error.message, 'TASK_DELETION_WITHDRAW_FAILED'));
        }
    }
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
    static async exportTasksToExcel(req, res) {
        try {
            const { jobType, status, priority, approvalStatus, startDate, endDate } = req.query;
            logger_1.logger.info('开始导出任务数据', {
                jobType,
                status,
                priority,
                approvalStatus,
                startDate,
                endDate
            });
            // 构建过滤条件
            const filters = {};
            if (jobType) {
                filters.jobType = jobType;
            }
            if (status) {
                filters.status = status;
            }
            if (priority) {
                filters.priority = priority;
            }
            if (approvalStatus) {
                filters.approvalStatus = approvalStatus;
            }
            if (startDate) {
                filters.startDate = new Date(startDate);
            }
            if (endDate) {
                filters.endDate = new Date(endDate);
            }
            // 生成 Excel 文件
            const buffer = await taskExcelSyncService_1.TaskExcelSyncService.exportTasksToExcel(filters);
            // 生成文件名（包含日期时间）
            const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
            const filename = `Longi_Tasks_Export_${timestamp}.xlsx`;
            // 设置响应头
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', buffer.length.toString());
            // 发送文件
            res.send(buffer);
            logger_1.logger.info('任务数据导出成功', {
                filename,
                size: buffer.length,
                filters
            });
        }
        catch (error) {
            logger_1.logger.error('导出任务数据失败', {
                query: req.query,
                error: error.message,
                stack: error.stack
            });
            return res.status(500).json(response_types_1.ResponseBuilder.error(error.message, 'TASKS_EXPORT_FAILED'));
        }
    }
    /**
     * 获取所有唯一的矿物类型
     * GET /api/tasks/minerals
     */
    static async getMinerals(req, res) {
        try {
            const minerals = await taskService_1.TaskService.getUniqueMinerals();
            return res.status(200).json(response_types_1.ResponseBuilder.success(minerals, 'Mineral type list retrieved successfully'));
        }
        catch (error) {
            logger_1.logger.error('Failed to retrieve mineral type list', {
                error: error.message,
                stack: error.stack
            });
            return res.status(500).json(response_types_1.ResponseBuilder.error(error.message, 'GET_MINERALS_FAILED'));
        }
    }
}
exports.TaskController = TaskController;
//# sourceMappingURL=taskController.js.map