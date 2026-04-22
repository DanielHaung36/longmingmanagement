"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const activityController_1 = require("../controllers/activityController");
const cookieAuth_1 = require("../middleware/cookieAuth");
const router = express_1.default.Router();
// All activity routes require authentication
router.use(cookieAuth_1.cookieAuth);
/**
 * @route   GET /api/activities/recent
 * @desc    Get recent activities
 * @access  Private
 */
router.get('/recent', activityController_1.getRecentActivities);
/**
 * @route   GET /api/activities/user/:userId
 * @desc    Get activities for a specific user
 * @access  Private
 */
router.get('/user/:userId', activityController_1.getUserActivities);
/**
 * @route   POST /api/activities
 * @desc    Log a new activity
 * @access  Private
 */
router.post('/', activityController_1.logActivity);
exports.default = router;
//# sourceMappingURL=activities.js.map