"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notificationController_1 = require("../controllers/notificationController");
const cookieAuth_1 = require("../middleware/cookieAuth");
const router = express_1.default.Router();
router.use(cookieAuth_1.cookieAuth);
// 创建通知
router.post('/', notificationController_1.createNotification);
router.post('/bulk', notificationController_1.bulkCreateNotifications);
// 查询通知
router.get('/user/:userId', notificationController_1.getUserNotifications);
router.get('/user/:userId/unread-count', notificationController_1.getUnreadCount);
router.get('/user/:userId/stats', notificationController_1.getNotificationStats);
router.get('/:id', notificationController_1.getNotificationById);
// 标记已读
router.patch('/:id/read', notificationController_1.markAsRead);
router.patch('/bulk/read', notificationController_1.markMultipleAsRead);
router.patch('/user/:userId/read-all', notificationController_1.markAllAsRead);
// 删除通知
router.delete('/:id', notificationController_1.deleteNotification);
router.delete('/bulk/delete', notificationController_1.bulkDeleteNotifications);
router.delete('/user/:userId/clear-read', notificationController_1.clearReadNotifications);
exports.default = router;
//# sourceMappingURL=notifications.js.map