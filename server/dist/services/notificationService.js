"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class NotificationService {
    /**
     * 创建通知
     */
    static async createNotification(data) {
        try {
            const notification = await prisma.notifications.create({
                data: {
                    type: data.type,
                    title: data.title,
                    content: data.content,
                    priority: data.priority || 'MEDIUM',
                    recipientId: data.recipientId,
                    senderId: data.senderId,
                    relatedType: data.relatedType,
                    relatedId: data.relatedId,
                    channels: data.channels || ['IN_APP'],
                    metadata: data.metadata
                },
                include: {
                    users_notifications_recipientIdTousers: {
                        select: {
                            id: true,
                            username: true,
                            realName: true,
                            email: true
                        }
                    },
                    users_notifications_senderIdTousers: {
                        select: {
                            id: true,
                            username: true,
                            realName: true
                        }
                    }
                }
            });
            return notification;
        }
        catch (error) {
            throw new Error(`创建通知失败: ${error.message}`);
        }
    }
    /**
     * 批量创建通知
     */
    static async bulkCreateNotifications(recipientIds, data) {
        try {
            const notifications = await prisma.notifications.createMany({
                data: recipientIds.map(recipientId => ({
                    type: data.type,
                    title: data.title,
                    content: data.content,
                    priority: data.priority || 'MEDIUM',
                    recipientId,
                    senderId: data.senderId,
                    relatedType: data.relatedType,
                    relatedId: data.relatedId,
                    channels: data.channels || ['IN_APP'],
                    metadata: data.metadata
                }))
            });
            return notifications;
        }
        catch (error) {
            throw new Error(`批量创建通知失败: ${error.message}`);
        }
    }
    /**
     * 获取用户通知列表
     */
    static async getUserNotifications(userId, options = {}) {
        try {
            const { page = 1, limit = 20, isRead, type, priority } = options;
            const skip = (page - 1) * limit;
            const where = {
                recipientId: userId
            };
            if (isRead !== undefined) {
                where.isRead = isRead;
            }
            if (type) {
                where.type = type;
            }
            if (priority) {
                where.priority = priority;
            }
            const [notifications, total, unreadCount] = await Promise.all([
                prisma.notifications.findMany({
                    where,
                    skip,
                    take: limit,
                    include: {
                        users_notifications_senderIdTousers: {
                            select: {
                                id: true,
                                username: true,
                                realName: true,
                                profilePictureUrl: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }),
                prisma.notifications.count({ where }),
                prisma.notifications.count({
                    where: {
                        recipientId: userId,
                        isRead: false
                    }
                })
            ]);
            return {
                notifications,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                },
                unreadCount
            };
        }
        catch (error) {
            throw new Error(`获取通知列表失败: ${error.message}`);
        }
    }
    /**
     * 获取单个通知
     */
    static async getNotificationById(id) {
        try {
            const notification = await prisma.notifications.findUnique({
                where: { id },
                include: {
                    users_notifications_recipientIdTousers: {
                        select: {
                            id: true,
                            username: true,
                            realName: true,
                            email: true
                        }
                    },
                    users_notifications_senderIdTousers: {
                        select: {
                            id: true,
                            username: true,
                            realName: true
                        }
                    }
                }
            });
            if (!notification) {
                throw new Error('通知不存在');
            }
            return notification;
        }
        catch (error) {
            throw new Error(`获取通知失败: ${error.message}`);
        }
    }
    /**
     * 标记通知为已读
     */
    static async markAsRead(id) {
        try {
            const notification = await prisma.notifications.update({
                where: { id },
                data: {
                    isRead: true,
                    readAt: new Date()
                }
            });
            return notification;
        }
        catch (error) {
            throw new Error(`标记通知失败: ${error.message}`);
        }
    }
    /**
     * 批量标记为已读
     */
    static async markMultipleAsRead(ids) {
        try {
            const result = await prisma.notifications.updateMany({
                where: {
                    id: {
                        in: ids
                    }
                },
                data: {
                    isRead: true,
                    readAt: new Date()
                }
            });
            return result;
        }
        catch (error) {
            throw new Error(`批量标记失败: ${error.message}`);
        }
    }
    /**
     * 标记所有通知为已读
     */
    static async markAllAsRead(userId) {
        try {
            const result = await prisma.notifications.updateMany({
                where: {
                    recipientId: userId,
                    isRead: false
                },
                data: {
                    isRead: true,
                    readAt: new Date()
                }
            });
            return result;
        }
        catch (error) {
            throw new Error(`标记全部已读失败: ${error.message}`);
        }
    }
    /**
     * 删除通知
     */
    static async deleteNotification(id) {
        try {
            await prisma.notifications.delete({
                where: { id }
            });
            return { success: true, message: '通知已删除' };
        }
        catch (error) {
            throw new Error(`删除通知失败: ${error.message}`);
        }
    }
    /**
     * 批量删除通知
     */
    static async bulkDeleteNotifications(ids) {
        try {
            await prisma.notifications.deleteMany({
                where: {
                    id: {
                        in: ids
                    }
                }
            });
            return { success: true, message: `已删除 ${ids.length} 条通知` };
        }
        catch (error) {
            throw new Error(`批量删除失败: ${error.message}`);
        }
    }
    /**
     * 清空用户所有已读通知
     */
    static async clearReadNotifications(userId) {
        try {
            const result = await prisma.notifications.deleteMany({
                where: {
                    recipientId: userId,
                    isRead: true
                }
            });
            return { success: true, count: result.count };
        }
        catch (error) {
            throw new Error(`清空通知失败: ${error.message}`);
        }
    }
    /**
     * 获取未读通知数量
     */
    static async getUnreadCount(userId) {
        try {
            const count = await prisma.notifications.count({
                where: {
                    recipientId: userId,
                    isRead: false
                }
            });
            return count;
        }
        catch (error) {
            throw new Error(`获取未读数量失败: ${error.message}`);
        }
    }
    /**
     * 获取通知统计信息
     */
    static async getNotificationStats(userId) {
        try {
            const [total, unread, byType, byPriority] = await Promise.all([
                prisma.notifications.count({ where: { recipientId: userId } }),
                prisma.notifications.count({ where: { recipientId: userId, isRead: false } }),
                prisma.notifications.groupBy({
                    by: ['type'],
                    where: { recipientId: userId },
                    _count: true
                }),
                prisma.notifications.groupBy({
                    by: ['priority'],
                    where: { recipientId: userId, isRead: false },
                    _count: true
                })
            ]);
            return {
                total,
                unread,
                byType,
                byPriority
            };
        }
        catch (error) {
            throw new Error(`获取通知统计失败: ${error.message}`);
        }
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=notificationService.js.map