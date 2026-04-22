"use strict";
/**
 * Task审批路由
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskApprovalController_1 = require("../controllers/taskApprovalController");
const cookieAuth_1 = require("../middleware/cookieAuth");
const router = (0, express_1.Router)();
router.use(cookieAuth_1.cookieAuth);
// 提交Task审批
router.post('/tasks/:taskId/submit', taskApprovalController_1.TaskApprovalController.submitForApproval);
// 审批Task
router.post('/tasks/:taskId/approve', taskApprovalController_1.TaskApprovalController.approveTask);
// 撤回Task审批
router.post('/tasks/:taskId/withdraw', taskApprovalController_1.TaskApprovalController.withdrawApproval);
// 获取待审批的Tasks
router.get('/tasks/pending', taskApprovalController_1.TaskApprovalController.getPendingTasks);
// 批量审批Tasks
router.post('/tasks/batch-approve', taskApprovalController_1.TaskApprovalController.batchApprove);
exports.default = router;
//# sourceMappingURL=taskApprovalRoutes.js.map