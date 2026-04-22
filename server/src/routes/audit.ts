/**
 * Audit Routes - 审计日志路由
 */

import express from 'express';
import { AuditController } from '../controllers/auditController';

const router = express.Router();

// 获取审计日志列表
router.get('/logs', AuditController.getLogs);

// 获取特定记录的操作历史
router.get('/record-history/:tableName/:recordId', AuditController.getRecordHistory);

// 获取用户操作历史
router.get('/user-history/:userId', AuditController.getUserHistory);

// 获取最近的操作日志
router.get('/recent', AuditController.getRecentLogs);

export default router;
