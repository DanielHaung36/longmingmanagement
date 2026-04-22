"use strict";
/**
 * Audit Routes - 审计日志路由
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auditController_1 = require("../controllers/auditController");
const router = express_1.default.Router();
// 获取审计日志列表
router.get('/logs', auditController_1.AuditController.getLogs);
// 获取特定记录的操作历史
router.get('/record-history/:tableName/:recordId', auditController_1.AuditController.getRecordHistory);
// 获取用户操作历史
router.get('/user-history/:userId', auditController_1.AuditController.getUserHistory);
// 获取最近的操作日志
router.get('/recent', auditController_1.AuditController.getRecentLogs);
exports.default = router;
//# sourceMappingURL=audit.js.map