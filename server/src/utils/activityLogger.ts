import type { Request } from 'express'
import { ActivityService } from '../services/activityService'
import { logger } from './logger'

export async function logActivitySafe(
  req: Request,
  params: {
    tableName: string
    recordId: number
    action: string
    changes?: any
  },
) {
  try {
    await ActivityService.logActivity({
      tableName: params.tableName,
      recordId: params.recordId,
      action: params.action,
      changes: params.changes,
      userId: (req as any).user?.id || 47,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string | undefined,
    })
  } catch (error: any) {
    logger.warn('Failed to log activity', {
      tableName: params.tableName,
      recordId: params.recordId,
      action: params.action,
      error: error.message,
    })
  }
}
