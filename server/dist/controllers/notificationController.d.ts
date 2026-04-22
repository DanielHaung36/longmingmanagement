import { Request, Response } from 'express';
/**
 * 创建通知
 */
export declare const createNotification: (req: Request, res: Response) => Promise<void>;
/**
 * 批量创建通知
 */
export declare const bulkCreateNotifications: (req: Request, res: Response) => Promise<void>;
/**
 * 获取用户通知列表
 */
export declare const getUserNotifications: (req: Request, res: Response) => Promise<void>;
/**
 * 获取单个通知
 */
export declare const getNotificationById: (req: Request, res: Response) => Promise<void>;
/**
 * 标记通知为已读
 */
export declare const markAsRead: (req: Request, res: Response) => Promise<void>;
/**
 * 批量标记为已读
 */
export declare const markMultipleAsRead: (req: Request, res: Response) => Promise<void>;
/**
 * 标记所有通知为已读
 */
export declare const markAllAsRead: (req: Request, res: Response) => Promise<void>;
/**
 * 删除通知
 */
export declare const deleteNotification: (req: Request, res: Response) => Promise<void>;
/**
 * 批量删除通知
 */
export declare const bulkDeleteNotifications: (req: Request, res: Response) => Promise<void>;
/**
 * 清空已读通知
 */
export declare const clearReadNotifications: (req: Request, res: Response) => Promise<void>;
/**
 * 获取未读通知数量
 */
export declare const getUnreadCount: (req: Request, res: Response) => Promise<void>;
/**
 * 获取通知统计
 */
export declare const getNotificationStats: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=notificationController.d.ts.map