import express from 'express';
import {
  createNotification,
  bulkCreateNotifications,
  getUserNotifications,
  getNotificationById,
  markAsRead,
  markMultipleAsRead,
  markAllAsRead,
  deleteNotification,
  bulkDeleteNotifications,
  clearReadNotifications,
  getUnreadCount,
  getNotificationStats
} from '../controllers/notificationController';
import { cookieAuth } from '../middleware/cookieAuth';

const router = express.Router();
router.use(cookieAuth);

// 创建通知
router.post('/', createNotification);
router.post('/bulk', bulkCreateNotifications);

// 查询通知
router.get('/user/:userId', getUserNotifications);
router.get('/user/:userId/unread-count', getUnreadCount);
router.get('/user/:userId/stats', getNotificationStats);
router.get('/:id', getNotificationById);

// 标记已读
router.patch('/:id/read', markAsRead);
router.patch('/bulk/read', markMultipleAsRead);
router.patch('/user/:userId/read-all', markAllAsRead);

// 删除通知
router.delete('/:id', deleteNotification);
router.delete('/bulk/delete', bulkDeleteNotifications);
router.delete('/user/:userId/clear-read', clearReadNotifications);

export default router;
