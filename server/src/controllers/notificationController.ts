import { Request, Response } from 'express';
import { NotificationService, CreateNotificationDTO } from '../services/notificationService';

/**
 * 创建通知
 */
export const createNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const notificationData: CreateNotificationDTO = req.body;
    const notification = await NotificationService.createNotification(notificationData);

    res.status(201).json({
      success: true,
      message: '通知创建成功',
      data: notification
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 批量创建通知
 */
export const bulkCreateNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const { recipientIds, ...notificationData } = req.body;

    if (!Array.isArray(recipientIds)) {
      res.status(400).json({
        success: false,
        message: '请提供收件人ID数组'
      });
      return;
    }

    const result = await NotificationService.bulkCreateNotifications(recipientIds, notificationData);

    res.status(201).json({
      success: true,
      message: `成功创建 ${result.count} 条通知`,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 获取用户通知列表
 */
export const getUserNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { page, limit, isRead, type, priority } = req.query;

    const result = await NotificationService.getUserNotifications(parseInt(userId), {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      type: type as any,
      priority: priority as any
    });

    res.json({
      success: true,
      data: result.notifications,
      pagination: result.pagination,
      unreadCount: result.unreadCount
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 获取单个通知
 */
export const getNotificationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const notification = await NotificationService.getNotificationById(parseInt(id));

    res.json({
      success: true,
      data: notification
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 标记通知为已读
 */
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const notification = await NotificationService.markAsRead(parseInt(id));

    res.json({
      success: true,
      message: '已标记为已读',
      data: notification
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 批量标记为已读
 */
export const markMultipleAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids)) {
      res.status(400).json({
        success: false,
        message: '请提供通知ID数组'
      });
      return;
    }

    const result = await NotificationService.markMultipleAsRead(ids);

    res.json({
      success: true,
      message: `已标记 ${result.count} 条通知为已读`,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 标记所有通知为已读
 */
export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const result = await NotificationService.markAllAsRead(parseInt(userId));

    res.json({
      success: true,
      message: `已标记 ${result.count} 条通知为已读`,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 删除通知
 */
export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await NotificationService.deleteNotification(parseInt(id));

    res.json({
      success: true,
      message: result.message
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 批量删除通知
 */
export const bulkDeleteNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids)) {
      res.status(400).json({
        success: false,
        message: '请提供通知ID数组'
      });
      return;
    }

    const result = await NotificationService.bulkDeleteNotifications(ids);

    res.json({
      success: true,
      message: result.message
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 清空已读通知
 */
export const clearReadNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const result = await NotificationService.clearReadNotifications(parseInt(userId));

    res.json({
      success: true,
      message: `已清空 ${result.count} 条已读通知`
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 获取未读通知数量
 */
export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const count = await NotificationService.getUnreadCount(parseInt(userId));

    res.json({
      success: true,
      data: { count }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 获取通知统计
 */
export const getNotificationStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const stats = await NotificationService.getNotificationStats(parseInt(userId));

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
