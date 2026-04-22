import { Request, Response, NextFunction } from 'express'
import { CookieAuthService } from '../services/cookieAuthService'

// 扩展Express Request类型
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number
        username: string
        email: string
        role: string
        realName?: string
        profilePictureUrl?: string
        status: string
      }
      userId?: number
      role?: string
    }
  }
}

/**
 * Cookie认证中间件
 *
 * 功能：
 * 1. 从Cookie提取Session Token
 * 2. 验证Token有效性
 * 3. 自动刷新即将过期的Cookie
 * 4. 将用户信息注入到req.user
 */
export async function cookieAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. 提取Session Token
    const sessionToken = CookieAuthService.extractToken(req.cookies)

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: '未登录，请先登录'
      })
    }

    // 2. 验证Session并获取用户信息（自动刷新Cookie）
    const user = await CookieAuthService.verifySession(sessionToken, res)

    // 3. 注入用户信息到Request
    req.user = user
    req.userId = user.id
    req.role = user.role
    next()
  } catch (error: any) {
    console.error('认证失败:', error.message)
    return res.status(401).json({
      success: false,
      message: error.message || '认证失败，请重新登录'
    })
  }
}

/**
 * 可选认证中间件
 *
 * 如果有Cookie则验证并注入用户，没有Cookie也允许继续
 * 用于公开接口但需要区分登录/未登录用户的场景
 *
 * 开发模式：如果没有Cookie，自动注入管理员用户（id: 11）
 */
export async function optionalCookieAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionToken = CookieAuthService.extractToken(req.cookies)

    if (sessionToken) {
      const user = await CookieAuthService.verifySession(sessionToken, res)
      req.user = user
      req.userId = user.id
    } else if (process.env.NODE_ENV === 'development' && process.env.DEV_AUTO_LOGIN === 'true') {
      // 开发模式：自动注入管理员用户
      req.user = {
        id: 11,
        username: 'admin',
        email: 'admin@ljmagnet.com.au',
        role: 'ADMIN',
        realName: 'Admin User',
        status: 'ACTIVE'
      }
      req.userId = 11
      console.log('[DevAuth] 开发模式：自动注入管理员用户 (id: 11)')
    }

    next()
  } catch (error) {
    // 认证失败也继续，因为是可选认证
    next()
  }
}

/**
 * 角色验证中间件工厂函数
 *
 * @param allowedRoles 允许的角色列表
 *
 * 使用示例：
 * router.post('/approve', cookieAuth, requireRole('ADMIN', 'MANAGER'), handler)
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未认证，请先登录'
      })
    }

    const userRole = req.user.role || 'USER'

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: '权限不足，无法执行此操作',
        required: allowedRoles,
        current: userRole
      })
    }

    next()
  }
}

/**
 * 预定义角色中间件
 */

// 管理员权限（仅ADMIN和SUPER_ADMIN）
export const requireAdmin = requireRole('ADMIN', 'MANAGER')

// 管理员或项目经理权限
export const requireManager = requireRole('ADMIN', 'MANAGER')

// 审批权限（用于Task审批）
export const requireApprover = requireRole('ADMIN', 'MANAGER')

/**
 * 资源所有权验证中间件工厂函数
 *
 * @param getResourceOwnerId 获取资源所有者ID的函数
 *
 * 使用示例：
 * router.delete('/tasks/:id', cookieAuth, requireOwnership(getTaskOwnerId), handler)
 */
export function requireOwnership(
  getResourceOwnerId: (req: Request) => Promise<number | null>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证'
        })
      }

      // 管理员可以访问所有资源
      if (req.user.role === 'ADMIN' || req.user.role === 'MANAGER') {
        return next()
      }

      // 检查所有权
      const ownerId = await getResourceOwnerId(req)

      if (ownerId === null) {
        return res.status(404).json({
          success: false,
          message: '资源不存在'
        })
      }

      if (ownerId !== req.userId) {
        return res.status(403).json({
          success: false,
          message: '无权访问此资源'
        })
      }

      next()
    } catch (error: any) {
      console.error('所有权检查错误:', error)
      return res.status(500).json({
        success: false,
        message: '权限检查失败'
      })
    }
  }
}
