/**
 * Task审批路由
 */

import { Router } from 'express';
import { TaskApprovalController } from '../controllers/taskApprovalController';
import { cookieAuth } from '../middleware/cookieAuth';
const router = Router();
router.use(cookieAuth);
// 提交Task审批
router.post('/tasks/:taskId/submit', TaskApprovalController.submitForApproval);

// 审批Task
router.post('/tasks/:taskId/approve', TaskApprovalController.approveTask);

// 撤回Task审批
router.post(
  '/tasks/:taskId/withdraw',
  TaskApprovalController.withdrawApproval
);

// 获取待审批的Tasks
router.get('/tasks/pending', TaskApprovalController.getPendingTasks);

// 批量审批Tasks
router.post('/tasks/batch-approve', TaskApprovalController.batchApprove);

export default router;
