"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = exports.getUserActivities = exports.getRecentActivities = void 0;
const activityService_1 = require("../services/activityService");
/**
 * Get recent activities
 * GET /api/activities/recent
 */
const getRecentActivities = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const activities = await activityService_1.ActivityService.getRecentActivities(parseInt(limit));
        res.json({
            success: true,
            data: activities
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.getRecentActivities = getRecentActivities;
/**
 * Get activities for a specific user
 * GET /api/activities/user/:userId
 */
const getUserActivities = async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 10 } = req.query;
        const activities = await activityService_1.ActivityService.getUserActivities(parseInt(userId), parseInt(limit));
        res.json({
            success: true,
            data: activities
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.getUserActivities = getUserActivities;
/**
 * Log a new activity
 * POST /api/activities
 */
const logActivity = async (req, res) => {
    try {
        const { tableName, recordId, action, changes } = req.body;
        const userId = req.user?.id;
        const ipAddress = req.ip;
        const userAgent = req.headers['user-agent'];
        const activity = await activityService_1.ActivityService.logActivity({
            tableName,
            recordId,
            action,
            changes,
            userId,
            ipAddress,
            userAgent
        });
        res.status(201).json({
            success: true,
            data: activity
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.logActivity = logActivity;
//# sourceMappingURL=activityController.js.map