"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivitySafe = logActivitySafe;
const activityService_1 = require("../services/activityService");
const logger_1 = require("./logger");
async function logActivitySafe(req, params) {
    try {
        await activityService_1.ActivityService.logActivity({
            tableName: params.tableName,
            recordId: params.recordId,
            action: params.action,
            changes: params.changes,
            userId: req.user?.id || 47,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });
    }
    catch (error) {
        logger_1.logger.warn('Failed to log activity', {
            tableName: params.tableName,
            recordId: params.recordId,
            action: params.action,
            error: error.message,
        });
    }
}
//# sourceMappingURL=activityLogger.js.map