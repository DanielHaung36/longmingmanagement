"use strict";
/**
 * Task 路由配置
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskController_1 = require("../controllers/taskController");
const cookieAuth_1 = require("../middleware/cookieAuth");
const router = (0, express_1.Router)();
router.use(cookieAuth_1.cookieAuth); // 应用Cookie认证中间件到所有任务路由
/**
 * @swagger
 * /api/tasks/batch:
 *   post:
 *     summary: 批量创建任务
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tasks]
 *             properties:
 *               tasks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: "Sample Analysis Task"
 *                     projectId:
 *                       type: integer
 *                       example: 1
 *                     description:
 *                       type: string
 *                       example: "Analyze mineral samples"
 *                     priority:
 *                       type: string
 *                       enum: [LOW, MEDIUM, HIGH, URGENT]
 *                       example: "HIGH"
 *                     assignedUserId:
 *                       type: integer
 *                       example: 2
 *     responses:
 *       201:
 *         description: 批量创建成功
 *       400:
 *         description: 参数错误
 */
router.post('/batch', taskController_1.TaskController.createBatchTasks);
/**
 * @swagger
 * /api/tasks/export:
 *   get:
 *     summary: 导出任务数据为Excel文件（下载）
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: jobType
 *         schema:
 *           type: string
 *           enum: [AT, AC, AQ, AS, AP]
 *         description: 业务类型筛选
 *         example: "AT"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [TODO, IN_PROGRESS, REVIEW, DONE, CANCELLED]
 *         description: 任务状态筛选
 *         example: "IN_PROGRESS"
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *         description: 优先级筛选
 *         example: "HIGH"
 *       - in: query
 *         name: approvalStatus
 *         schema:
 *           type: string
 *           enum: [DRAFT, PENDING, APPROVED, REJECTED]
 *         description: 审批状态筛选
 *         example: "APPROVED"
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期
 *         example: "2025-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期
 *         example: "2025-12-31"
 *     responses:
 *       200:
 *         description: Excel文件导出成功
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       500:
 *         description: 导出失败
 */
router.get('/export', taskController_1.TaskController.exportTasksToExcel);
/**
 * @swagger
 * /api/tasks/minerals:
 *   get:
 *     summary: 获取所有唯一的矿物类型
 *     tags: [Tasks]
 *     description: 返回数据库中所有不重复的矿物类型列表，用于下拉选项
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "获取矿物类型列表成功"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Iron Ore", "Copper Ore", "Gold Ore", "Lithium"]
 *       500:
 *         description: 获取失败
 */
router.get('/minerals', taskController_1.TaskController.getMinerals);
/**
 * @swagger
 * /api/tasks/search:
 *   get:
 *     summary: 搜索任务（模糊搜索）
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: 搜索关键词（任务编号/标题/描述）
 *         example: "AT0001"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 返回结果数量限制
 *     responses:
 *       200:
 *         description: 搜索成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       taskCode:
 *                         type: string
 *                       title:
 *                         type: string
 *                       status:
 *                         type: string
 *                       priority:
 *                         type: string
 */
router.get('/search', taskController_1.TaskController.searchTasks);
/**
 * @swagger
 * /api/tasks/pending:
 *   get:
 *     summary: 获取待审批的任务列表
 *     tags: [Tasks]
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/pending', taskController_1.TaskController.getPendingTasks);
/**
 * @swagger
 * /api/tasks/pending-deletion:
 *   get:
 *     summary: 获取待删除审批的任务列表
 *     tags: [Tasks]
 *     description: 获取所有状态为 DELETE_PENDING 的任务
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       taskCode:
 *                         type: string
 *                       title:
 *                         type: string
 *                       approvalStatus:
 *                         type: string
 *                         example: "DELETE_PENDING"
 *                       deleteRequestedBy:
 *                         type: integer
 *                       deleteRequestedAt:
 *                         type: string
 *                         format: date-time
 *                       deleteReason:
 *                         type: string
 */
router.get('/pending-deletion', taskController_1.TaskController.getPendingDeletionTasks);
/**
 * @swagger
 * /api/tasks/draft:
 *   get:
 *     summary: 获取草稿状态的任务列表
 *     tags: [Tasks]
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/draft', taskController_1.TaskController.getDraftTasks);
/**
 * @swagger
 * /api/tasks/my:
 *   get:
 *     summary: 获取我的任务（分配给当前用户的任务）
 *     tags: [Tasks]
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/my', taskController_1.TaskController.getMyTasks);
/**
 * @swagger
 * /api/tasks/project/{projectId}:
 *   get:
 *     summary: 获取项目下的所有任务
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 项目ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/project/:projectId', taskController_1.TaskController.getTasksByProject);
/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: 获取所有任务（支持分页和过滤）
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每页数量
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [TODO, IN_PROGRESS, REVIEW, DONE, CANCELLED]
 *         description: 任务状态过滤
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *         description: 优先级过滤
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     tasks:
 *                       type: array
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 */
router.get('/', taskController_1.TaskController.getAllTasks);
/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: 创建新任务（立即创建3层文件夹+模板）
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, projectId]
 *             properties:
 *               title:
 *                 type: string
 *                 description: 任务标题
 *                 example: "Iron Ore Sample Analysis"
 *               projectId:
 *                 type: integer
 *                 description: 所属项目ID
 *                 example: 1
 *               description:
 *                 type: string
 *                 description: 任务描述
 *                 example: "Analyze 5 iron ore samples for Fe content"
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *                 default: MEDIUM
 *                 example: "HIGH"
 *               assignedUserId:
 *                 type: integer
 *                 description: 分配给的用户ID
 *                 example: 2
 *               estimatedHours:
 *                 type: number
 *                 description: 预估工时（小时）
 *                 example: 40
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: 开始日期
 *                 example: "2025-01-15"
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 description: 截止日期
 *                 example: "2025-02-15"
 *     responses:
 *       201:
 *         description: 任务创建成功（已创建文件夹）
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "任务创建成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     taskCode:
 *                       type: string
 *                       example: "AT0001"
 *                     title:
 *                       type: string
 *                     approvalStatus:
 *                       type: string
 *                       example: "DRAFT"
 *                     syncStatus:
 *                       type: string
 *                       example: "NOT_SYNCED"
 *                     folderCreated:
 *                       type: boolean
 *                       example: true
 *                     localFolderPath:
 *                       type: string
 *                       example: "C:/Longi/.../Client/TestCorp/TestMine/AT0001 Iron Ore Sample Analysis"
 *                     oneDriveFolderPath:
 *                       type: string
 *       400:
 *         description: 参数错误或项目不存在
 */
router.post('/', taskController_1.TaskController.createTask);
/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: 获取任务详情
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 任务ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 任务不存在
 */
router.get('/:id', taskController_1.TaskController.getTaskById);
/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: 更新任务（已审批的任务会自动同步到Excel）
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Task Title"
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, REVIEW, DONE, CANCELLED]
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *               progress:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 50
 *               actualHours:
 *                 type: number
 *                 example: 20
 *     responses:
 *       200:
 *         description: 更新成功（如果已审批，Excel已同步）
 *       404:
 *         description: 任务不存在
 */
router.put('/:id', taskController_1.TaskController.updateTask);
/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: 删除任务（删除文件夹和Excel行）
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: 删除成功（已删除文件夹和Excel行）
 *       404:
 *         description: 任务不存在
 */
router.delete('/:id', taskController_1.TaskController.deleteTask);
/**
 * @swagger
 * /api/tasks/{id}/status:
 *   patch:
 *     summary: 更新任务状态
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, REVIEW, DONE, CANCELLED]
 *                 example: "IN_PROGRESS"
 *     responses:
 *       200:
 *         description: 状态更新成功
 */
router.patch('/:id/status', taskController_1.TaskController.updateTaskStatus);
/**
 * @swagger
 * /api/tasks/{id}/submit:
 *   post:
 *     summary: 提交任务审批
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: 提交审批成功（状态变为PENDING）
 *       400:
 *         description: 任务状态不允许提交审批
 */
router.post('/:id/submit', taskController_1.TaskController.submitForApproval);
/**
 * @swagger
 * /api/tasks/{id}/approve:
 *   post:
 *     summary: 审批任务（审批通过后同步到Excel）
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [approved]
 *             properties:
 *               approved:
 *                 type: boolean
 *                 description: true=批准, false=拒绝
 *                 example: true
 *               comment:
 *                 type: string
 *                 description: 审批意见
 *                 example: "Approved for execution"
 *     responses:
 *       200:
 *         description: 审批成功（如果批准，已同步到Excel并分配行号）
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "任务审批通过"
 *                 data:
 *                   type: object
 *                   properties:
 *                     approvalStatus:
 *                       type: string
 *                       example: "APPROVED"
 *                     syncStatus:
 *                       type: string
 *                       example: "SYNCED"
 *                     excelRowNumber:
 *                       type: integer
 *                       example: 13
 *       400:
 *         description: 任务状态不允许审批
 */
router.post('/:id/approve', taskController_1.TaskController.approveTask);
/**
 * @swagger
 * /api/tasks/{id}/withdraw:
 *   post:
 *     summary: 撤回审批申请
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: 撤回成功（状态变为DRAFT）
 */
router.post('/:id/withdraw', taskController_1.TaskController.withdrawApproval);
/**
 * @swagger
 * /api/tasks/batch-approve:
 *   post:
 *     summary: 批量审批任务
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [taskIds, approved]
 *             properties:
 *               taskIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *               approved:
 *                 type: boolean
 *                 example: true
 *               comment:
 *                 type: string
 *                 example: "Batch approval for Q1 tasks"
 *     responses:
 *       200:
 *         description: 批量审批成功
 */
router.post('/batch-approve', taskController_1.TaskController.batchApprove);
/**
 * @swagger
 * /api/tasks/{id}/request-deletion:
 *   post:
 *     summary: 提交任务删除申请
 *     tags: [Tasks]
 *     description: 将任务状态更改为 DELETE_PENDING，需要审批后才能真正删除
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *                 description: 删除原因
 *                 example: "任务已取消，不再需要执行"
 *     responses:
 *       200:
 *         description: 删除申请提交成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Task删除申请已提交"
 *                 data:
 *                   type: object
 *                   properties:
 *                     approvalStatus:
 *                       type: string
 *                       example: "DELETE_PENDING"
 *                     deleteReason:
 *                       type: string
 *       400:
 *         description: 参数错误或任务状态不允许删除
 */
router.post('/:id/request-deletion', taskController_1.TaskController.requestDeletion);
/**
 * @swagger
 * /api/tasks/{id}/approve-deletion:
 *   post:
 *     summary: 审批任务删除申请
 *     tags: [Tasks]
 *     description: 批准后真正删除任务（包括文件夹和Excel）；拒绝后恢复任务到 APPROVED 状态
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [approved]
 *             properties:
 *               approved:
 *                 type: boolean
 *                 description: true=批准删除, false=拒绝删除
 *                 example: true
 *               comment:
 *                 type: string
 *                 description: 审批意见
 *                 example: "同意删除此任务"
 *     responses:
 *       200:
 *         description: 审批成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Task删除申请已批准（Task已删除）"
 *                 data:
 *                   type: object
 *                   description: 如果批准，返回 null（任务已删除）；如果拒绝，返回恢复后的任务对象
 *       400:
 *         description: 任务状态不允许审批
 */
router.post('/:id/approve-deletion', taskController_1.TaskController.approveDeletion);
/**
 * @swagger
 * /api/tasks/{id}/withdraw-deletion:
 *   post:
 *     summary: 撤回任务删除申请
 *     tags: [Tasks]
 *     description: 撤回删除申请，将任务从 DELETE_PENDING 恢复到 APPROVED 状态
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: 撤回成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Task删除申请已撤回"
 *                 data:
 *                   type: object
 *                   properties:
 *                     approvalStatus:
 *                       type: string
 *                       example: "APPROVED"
 *       400:
 *         description: 只有申请人可以撤回
 */
router.post('/:id/withdraw-deletion', taskController_1.TaskController.withdrawDeletion);
exports.default = router;
//# sourceMappingURL=taskRoutes.js.map