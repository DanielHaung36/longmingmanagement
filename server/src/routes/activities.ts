import express from 'express'
import { getRecentActivities, getUserActivities, logActivity } from '../controllers/activityController'
import { cookieAuth } from '../middleware/cookieAuth'

const router = express.Router()

// All activity routes require authentication
router.use(cookieAuth)

/**
 * @route   GET /api/activities/recent
 * @desc    Get recent activities
 * @access  Private
 */
router.get('/recent', getRecentActivities)

/**
 * @route   GET /api/activities/user/:userId
 * @desc    Get activities for a specific user
 * @access  Private
 */
router.get('/user/:userId', getUserActivities)

/**
 * @route   POST /api/activities
 * @desc    Log a new activity
 * @access  Private
 */
router.post('/', logActivity)

export default router
