"use strict";
/**
 * Audit Controller - 审计日志控制器
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditController = void 0;
const auditService_1 = require("../services/auditService");
const responseBuilder_1 = require("../utils/responseBuilder");
const logger_1 = require("../utils/logger");
class AuditController {
    /**
     * GET /api/audit/logs
     * 获取审计日志列表
     */
    static async getLogs(req, res) {
        try {
            const { tableName, recordId, userId, action, startDate, endDate, page, limit, } = req.query;
            const result = await auditService_1.AuditService.getLogs({
                tableName: tableName,
                recordId: recordId ? parseInt(recordId) : undefined,
                userId: userId ? parseInt(userId) : undefined,
                action: action,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 50,
            });
            res.status(200).json(responseBuilder_1.ResponseBuilder.success(result, '查询成功'));
        }
        catch (error) {
            logger_1.logger.error('获取审计日志失败', { error: error.message });
            res.status(500).json(responseBuilder_1.ResponseBuilder.error(error.message, responseBuilder_1.ErrorCode.INTERNAL_ERROR));
        }
    }
    /**
     * GET /api/audit/record-history/:tableName/:recordId
     * 获取特定记录的操作历史
     */
    static async getRecordHistory(req, res) {
        try {
            const { tableName, recordId } = req.params;
            const logs = await auditService_1.AuditService.getRecordHistory(tableName, parseInt(recordId));
            res.status(200).json(responseBuilder_1.ResponseBuilder.success(logs, '查询成功'));
        }
        catch (error) {
            logger_1.logger.error('获取记录历史失败', { error: error.message });
            res.status(500).json(responseBuilder_1.ResponseBuilder.error(error.message, responseBuilder_1.ErrorCode.INTERNAL_ERROR));
        }
    }
    /**
     * GET /api/audit/user-history/:userId
     * 获取用户操作历史
     */
    static async getUserHistory(req, res) {
        try {
            const { userId } = req.params;
            const { limit } = req.query;
            const logs = await auditService_1.AuditService.getUserHistory(parseInt(userId), limit ? parseInt(limit) : 100);
            res.status(200).json(responseBuilder_1.ResponseBuilder.success(logs, '查询成功'));
        }
        catch (error) {
            logger_1.logger.error('获取用户历史失败', { error: error.message });
            res.status(500).json(responseBuilder_1.ResponseBuilder.error(error.message, responseBuilder_1.ErrorCode.INTERNAL_ERROR));
        }
    }
    /**
     * GET /api/audit/recent
     * 获取最近的操作日志
     */
    static async getRecentLogs(req, res) {
        try {
            const { limit } = req.query;
            const logs = await auditService_1.AuditService.getRecentLogs(limit ? parseInt(limit) : 50);
            res.status(200).json(responseBuilder_1.ResponseBuilder.success(logs, '查询成功'));
        }
        catch (error) {
            logger_1.logger.error('获取最近日志失败', { error: error.message });
            res.status(500).json(responseBuilder_1.ResponseBuilder.error(error.message, responseBuilder_1.ErrorCode.INTERNAL_ERROR));
        }
    }
}
exports.AuditController = AuditController;
//# sourceMappingURL=auditController.js.map