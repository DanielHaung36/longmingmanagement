import { Request, Response } from 'express'
import { ActivityService } from '../services/activityService'

/**
 * Get recent activities
 * GET /api/activities/recent
 */
export const getRecentActivities = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 10 } = req.query
    const activities = await ActivityService.getRecentActivities(parseInt(limit as string))

    res.json({
      success: true,
      data: activities
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Get activities for a specific user
 * GET /api/activities/user/:userId
 */
export const getUserActivities = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params
    const { limit = 10 } = req.query

    const activities = await ActivityService.getUserActivities(
      parseInt(userId),
      parseInt(limit as string)
    )

    res.json({
      success: true,
      data: activities
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Log a new activity
 * POST /api/activities
 */
export const logActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tableName, recordId, action, changes } = req.body
    const userId = req.user?.id
    const ipAddress = req.ip
    const userAgent = req.headers['user-agent']

    const activity = await ActivityService.logActivity({
      tableName,
      recordId,
      action,
      changes,
      userId,
      ipAddress,
      userAgent
    })

    res.status(201).json({
      success: true,
      data: activity
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}
