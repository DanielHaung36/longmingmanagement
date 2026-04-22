/**
 * 角色权限中间件
 * 用于检查用户是否有足够的权限执行特定操作
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 可以审批的角色
const APPROVER_ROLES = ['TEAM_LEAD', 'PROJECT_MANAGER', 'ADMIN', 'SUPER_ADMIN'];

// 可以管理用户的角色
const USER_MANAGER_ROLES = ['ADMIN', 'SUPER_ADMIN'];

/**
 * 检查用户是否有审批权限
 */
export const requireApproverRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: '未登录或登录已过期',
      });
      return;
    }

    // 查询用户角色
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, username: true, role: true, realName: true },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    // 检查是否有审批权限
    if (!APPROVER_ROLES.includes(user.role)) {
      res.status(403).json({
        success: false,
        message: `权限不足：只有 ${APPROVER_ROLES.join(', ')} 角色可以执行审批操作`,
        data: {
          requiredRoles: APPROVER_ROLES,
          yourRole: user.role,
        },
      });
      return;
    }

    // 将用户信息附加到请求对象，方便后续使用
    (req as any).approver = user;

    next();
  } catch (error: any) {
    console.error('❌ 权限检查失败:', error);
    res.status(500).json({
      success: false,
      message: `权限检查失败: ${error.message}`,
    });
  }
};

/**
 * 检查用户是否有管理用户的权限
 */
export const requireUserManagerRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: '未登录或登录已过期',
      });
      return;
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, username: true, role: true },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    if (!USER_MANAGER_ROLES.includes(user.role)) {
      res.status(403).json({
        success: false,
        message: `权限不足：只有 ${USER_MANAGER_ROLES.join(', ')} 角色可以管理用户`,
        data: {
          requiredRoles: USER_MANAGER_ROLES,
          yourRole: user.role,
        },
      });
      return;
    }

    (req as any).manager = user;
    next();
  } catch (error: any) {
    console.error('❌ 权限检查失败:', error);
    res.status(500).json({
      success: false,
      message: `权限检查失败: ${error.message}`,
    });
  }
};

/**
 * 检查用户是否有指定角色之一
 */
export const requireRoles = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未登录或登录已过期',
        });
        return;
      }

      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { id: true, username: true, role: true },
      });

      if (!user) {
        res.status(401).json({
          success: false,
          message: '用户不存在',
        });
        return;
      }

      if (!allowedRoles.includes(user.role)) {
        res.status(403).json({
          success: false,
          message: `权限不足：需要 ${allowedRoles.join(', ')} 角色之一`,
          data: {
            requiredRoles: allowedRoles,
            yourRole: user.role,
          },
        });
        return;
      }

      (req as any).authorizedUser = user;
      next();
    } catch (error: any) {
      console.error('❌ 权限检查失败:', error);
      res.status(500).json({
        success: false,
        message: `权限检查失败: ${error.message}`,
      });
    }
  };
};

/**
 * 检查用户是否可以审批指定的项目
 * 规则：
 * 1. 必须有审批权限的角色
 * 2. 不能审批自己创建的项目
 */
export const canApproveProject = async (
  userId: number,
  projectOwnerId: number
): Promise<{ canApprove: boolean; reason?: string }> => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return { canApprove: false, reason: '用户不存在' };
    }

    // 检查角色权限
    if (!APPROVER_ROLES.includes(user.role)) {
      return {
        canApprove: false,
        reason: `权限不足：只有 ${APPROVER_ROLES.join(', ')} 角色可以审批`,
      };
    }

    // 检查是否是自己的项目
    if (userId === projectOwnerId) {
      return {
        canApprove: false,
        reason: '不能审批自己创建的项目',
      };
    }

    return { canApprove: true };
  } catch (error: any) {
    return { canApprove: false, reason: `检查失败: ${error.message}` };
  }
};

/**
 * 检查用户是否可以审批指定的任务
 * 规则：
 * 1. 必须有审批权限的角色
 * 2. 不能审批自己创建的任务
 */
export const canApproveTask = async (
  userId: number,
  taskAuthorId: number
): Promise<{ canApprove: boolean; reason?: string }> => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return { canApprove: false, reason: '用户不存在' };
    }

    // 检查角色权限
    if (!APPROVER_ROLES.includes(user.role)) {
      return {
        canApprove: false,
        reason: `权限不足：只有 ${APPROVER_ROLES.join(', ')} 角色可以审批`,
      };
    }

    // 检查是否是自己的任务
    if (userId === taskAuthorId) {
      return {
        canApprove: false,
        reason: '不能审批自己创建的任务',
      };
    }

    return { canApprove: true };
  } catch (error: any) {
    return { canApprove: false, reason: `检查失败: ${error.message}` };
  }
};
