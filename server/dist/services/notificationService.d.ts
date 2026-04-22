import { NotificationType, Priority, NotificationChannel } from '@prisma/client';
export interface CreateNotificationDTO {
    type: NotificationType;
    title: string;
    content: string;
    priority?: Priority;
    recipientId: number;
    senderId?: number;
    relatedType?: string;
    relatedId?: number;
    channels?: NotificationChannel[];
    metadata?: any;
}
export interface UpdateNotificationDTO {
    isRead?: boolean;
    readAt?: Date;
}
export declare class NotificationService {
    /**
     * 创建通知
     */
    static createNotification(data: CreateNotificationDTO): Promise<{
        users_notifications_recipientIdTousers: {
            id: number;
            username: string;
            email: string;
            realName: string;
        };
        users_notifications_senderIdTousers: {
            id: number;
            username: string;
            realName: string;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.NotificationType;
        priority: import(".prisma/client").$Enums.Priority;
        title: string;
        content: string;
        relatedType: string | null;
        relatedId: number | null;
        isRead: boolean;
        readAt: Date | null;
        channels: import(".prisma/client").$Enums.NotificationChannel[];
        emailSent: boolean;
        pushSent: boolean;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        recipientId: number;
        senderId: number | null;
    }>;
    /**
     * 批量创建通知
     */
    static bulkCreateNotifications(recipientIds: number[], data: Omit<CreateNotificationDTO, 'recipientId'>): Promise<import(".prisma/client").Prisma.BatchPayload>;
    /**
     * 获取用户通知列表
     */
    static getUserNotifications(userId: number, options?: {
        page?: number;
        limit?: number;
        isRead?: boolean;
        type?: NotificationType;
        priority?: Priority;
    }): Promise<{
        notifications: ({
            users_notifications_senderIdTousers: {
                id: number;
                username: string;
                realName: string;
                profilePictureUrl: string;
            };
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.NotificationType;
            priority: import(".prisma/client").$Enums.Priority;
            title: string;
            content: string;
            relatedType: string | null;
            relatedId: number | null;
            isRead: boolean;
            readAt: Date | null;
            channels: import(".prisma/client").$Enums.NotificationChannel[];
            emailSent: boolean;
            pushSent: boolean;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            recipientId: number;
            senderId: number | null;
        })[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
        unreadCount: number;
    }>;
    /**
     * 获取单个通知
     */
    static getNotificationById(id: number): Promise<{
        users_notifications_recipientIdTousers: {
            id: number;
            username: string;
            email: string;
            realName: string;
        };
        users_notifications_senderIdTousers: {
            id: number;
            username: string;
            realName: string;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.NotificationType;
        priority: import(".prisma/client").$Enums.Priority;
        title: string;
        content: string;
        relatedType: string | null;
        relatedId: number | null;
        isRead: boolean;
        readAt: Date | null;
        channels: import(".prisma/client").$Enums.NotificationChannel[];
        emailSent: boolean;
        pushSent: boolean;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        recipientId: number;
        senderId: number | null;
    }>;
    /**
     * 标记通知为已读
     */
    static markAsRead(id: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.NotificationType;
        priority: import(".prisma/client").$Enums.Priority;
        title: string;
        content: string;
        relatedType: string | null;
        relatedId: number | null;
        isRead: boolean;
        readAt: Date | null;
        channels: import(".prisma/client").$Enums.NotificationChannel[];
        emailSent: boolean;
        pushSent: boolean;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        recipientId: number;
        senderId: number | null;
    }>;
    /**
     * 批量标记为已读
     */
    static markMultipleAsRead(ids: number[]): Promise<import(".prisma/client").Prisma.BatchPayload>;
    /**
     * 标记所有通知为已读
     */
    static markAllAsRead(userId: number): Promise<import(".prisma/client").Prisma.BatchPayload>;
    /**
     * 删除通知
     */
    static deleteNotification(id: number): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * 批量删除通知
     */
    static bulkDeleteNotifications(ids: number[]): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * 清空用户所有已读通知
     */
    static clearReadNotifications(userId: number): Promise<{
        success: boolean;
        count: number;
    }>;
    /**
     * 获取未读通知数量
     */
    static getUnreadCount(userId: number): Promise<number>;
    /**
     * 获取通知统计信息
     */
    static getNotificationStats(userId: number): Promise<{
        total: number;
        unread: number;
        byType: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.NotificationsGroupByOutputType, "type"[]> & {
            _count: number;
        })[];
        byPriority: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.NotificationsGroupByOutputType, "priority"[]> & {
            _count: number;
        })[];
    }>;
}
//# sourceMappingURL=notificationService.d.ts.map