"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotificationStats = exports.getUnreadCount = exports.clearReadNotifications = exports.bulkDeleteNotifications = exports.deleteNotification = exports.markAllAsRead = exports.markMultipleAsRead = exports.markAsRead = exports.getNotificationById = exports.getUserNotifications = exports.bulkCreateNotifications = exports.createNotification = void 0;
const notificationService_1 = require("../services/notificationService");
/**
 * 创建通知
 */
const createNotification = async (req, res) => {
    try {
        const notificationData = req.body;
        const notification = await notificationService_1.NotificationService.createNotification(notificationData);
        res.status(201).json({
            success: true,
            message: '通知创建成功',
            data: notification
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.createNotification = createNotification;
/**
 * 批量创建通知
 */
const bulkCreateNotifications = async (req, res) => {
    try {
        const { recipientIds, ...notificationData } = req.body;
        if (!Array.isArray(recipientIds)) {
            res.status(400).json({
                success: false,
                message: '请提供收件人ID数组'
            });
            return;
        }
        const result = await notificationService_1.NotificationService.bulkCreateNotifications(recipientIds, notificationData);
        res.status(201).json({
            success: true,
            message: `成功创建 ${result.count} 条通知`,
            data: result
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.bulkCreateNotifications = bulkCreateNotifications;
/**
 * 获取用户通知列表
 */
const getUserNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page, limit, isRead, type, priority } = req.query;
        const result = await notificationService_1.NotificationService.getUserNotifications(parseInt(userId), {
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
            type: type,
            priority: priority
        });
        res.json({
            success: true,
            data: result.notifications,
            pagination: result.pagination,
            unreadCount: result.unreadCount
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.getUserNotifications = getUserNotifications;
/**
 * 获取单个通知
 */
const getNotificationById = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await notificationService_1.NotificationService.getNotificationById(parseInt(id));
        res.json({
            success: true,
            data: notification
        });
    }
    catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};
exports.getNotificationById = getNotificationById;
/**
 * 标记通知为已读
 */
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await notificationService_1.NotificationService.markAsRead(parseInt(id));
        res.json({
            success: true,
            message: '已标记为已读',
            data: notification
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.markAsRead = markAsRead;
/**
 * 批量标记为已读
 */
const markMultipleAsRead = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids)) {
            res.status(400).json({
                success: false,
                message: '请提供通知ID数组'
            });
            return;
        }
        const result = await notificationService_1.NotificationService.markMultipleAsRead(ids);
        res.json({
            success: true,
            message: `已标记 ${result.count} 条通知为已读`,
            data: result
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.markMultipleAsRead = markMultipleAsRead;
/**
 * 标记所有通知为已读
 */
const markAllAsRead = async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await notificationService_1.NotificationService.markAllAsRead(parseInt(userId));
        res.json({
            success: true,
            message: `已标记 ${result.count} 条通知为已读`,
            data: result
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.markAllAsRead = markAllAsRead;
/**
 * 删除通知
 */
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await notificationService_1.NotificationService.deleteNotification(parseInt(id));
        res.json({
            success: true,
            message: result.message
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.deleteNotification = deleteNotification;
/**
 * 批量删除通知
 */
const bulkDeleteNotifications = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids)) {
            res.status(400).json({
                success: false,
                message: '请提供通知ID数组'
            });
            return;
        }
        const result = await notificationService_1.NotificationService.bulkDeleteNotifications(ids);
        res.json({
            success: true,
            message: result.message
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.bulkDeleteNotifications = bulkDeleteNotifications;
/**
 * 清空已读通知
 */
const clearReadNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await notificationService_1.NotificationService.clearReadNotifications(parseInt(userId));
        res.json({
            success: true,
            message: `已清空 ${result.count} 条已读通知`
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.clearReadNotifications = clearReadNotifications;
/**
 * 获取未读通知数量
 */
const getUnreadCount = async (req, res) => {
    try {
        const { userId } = req.params;
        const count = await notificationService_1.NotificationService.getUnreadCount(parseInt(userId));
        res.json({
            success: true,
            data: { count }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.getUnreadCount = getUnreadCount;
/**
 * 获取通知统计
 */
const getNotificationStats = async (req, res) => {
    try {
        const { userId } = req.params;
        const stats = await notificationService_1.NotificationService.getNotificationStats(parseInt(userId));
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.getNotificationStats = getNotificationStats;
//# sourceMappingURL=notificationController.js.map