import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface ActivityLog {
  id: number
  tableName: string
  recordId: number
  action: string
  changes?: any
  userId?: number
  user?: {
    id: number
    username: string
    realName?: string
    email: string
  }
  createdAt: Date
}

export class ActivityService {
  /**
   * Get recent activity logs
   * @param limit Number of activities to fetch
   * @returns Array of activity logs
   */
  static async getRecentActivities(limit: number = 10): Promise<ActivityLog[]> {
    try {
      const activities = await prisma.audit_logs.findMany({
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          users: {
            select: {
              id: true,
              username: true,
              realName: true,
              email: true
            }
          }
        }
      })

      return activities.map(activity => ({
        id: activity.id,
        tableName: activity.tableName,
        recordId: activity.recordId,
        action: activity.action,
        changes: activity.changes,
        userId: activity.userId || undefined,
        user: activity.users ? {
          id: activity.users.id,
          username: activity.users.username,
          realName: activity.users.realName || undefined,
          email: activity.users.email
        } : undefined,
        createdAt: activity.createdAt
      }))
    } catch (error: any) {
      throw new Error(`Failed to fetch activities: ${error.message}`)
    }
  }

  /**
   * Get activities for a specific user
   * @param userId User ID
   * @param limit Number of activities to fetch
   */
  static async getUserActivities(userId: number, limit: number = 10): Promise<ActivityLog[]> {
    try {
      const activities = await prisma.audit_logs.findMany({
        where: {
          userId
        },
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          users: {
            select: {
              id: true,
              username: true,
              realName: true,
              email: true
            }
          }
        }
      })

      return activities.map(activity => ({
        id: activity.id,
        tableName: activity.tableName,
        recordId: activity.recordId,
        action: activity.action,
        changes: activity.changes,
        userId: activity.userId || undefined,
        user: activity.users ? {
          id: activity.users.id,
          username: activity.users.username,
          realName: activity.users.realName || undefined,
          email: activity.users.email
        } : undefined,
        createdAt: activity.createdAt
      }))
    } catch (error: any) {
      throw new Error(`Failed to fetch user activities: ${error.message}`)
    }
  }

  /**
   * Log an activity
   * @param data Activity data
   */
  static async logActivity(data: {
    tableName: string
    recordId: number
    action: string
    changes?: any
    userId?: number
    ipAddress?: string
    userAgent?: string
  }) {
    try {
      const activity = await prisma.audit_logs.create({
        data: {
          tableName: data.tableName,
          recordId: data.recordId,
          action: data.action,
          changes: data.changes,
          userId: data.userId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent
        }
      })

      return activity
    } catch (error: any) {
      throw new Error(`Failed to log activity: ${error.message}`)
    }
  }
}
