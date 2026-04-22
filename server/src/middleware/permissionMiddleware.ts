/**
 * 权限中间件 - Permission Middleware
 *
 * 用法示例：
 * router.get('/projects', requireAuth, requirePermission('PROJECT_READ'), getProjects);
 * router.post('/projects', requireAuth, requirePermission('PROJECT_CREATE'), createProject);
 */

import { Request, Response, NextFunction } from 'express';
import { Permission, ResourceType } from '@prisma/client';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '../services/permissionService';
import { ApiError } from '../utils/ApiError';

// 注意：req.user 类型已在 cookieAuth.ts 中定义，这里不需要重复声明

/**
 * 要求用户拥有特定权限
 * Require user to have a specific permission
 */
export function requirePermission(permission: Permission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const hasAccess = await hasPermission(userId, permission);

      if (!hasAccess) {
        throw new ApiError(403, `Permission denied: ${permission} required`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * 要求用户拥有任意一个权限
 * Require user to have any of the specified permissions
 */
export function requireAnyPermission(permissions: Permission[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const hasAccess = await hasAnyPermission(userId, permissions);

      if (!hasAccess) {
        throw new ApiError(403, `Permission denied: one of [${permissions.join(', ')}] required`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * 要求用户拥有所有权限
 * Require user to have all of the specified permissions
 */
export function requireAllPermissions(permissions: Permission[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const hasAccess = await hasAllPermissions(userId, permissions);

      if (!hasAccess) {
        throw new ApiError(403, `Permission denied: all of [${permissions.join(', ')}] required`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * 要求用户拥有资源级权限
 * Require user to have permission on a specific resource
 */
export function requireResourcePermission(
  permission: Permission,
  resourceType: ResourceType,
  resourceIdParam: string = 'id'
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const resourceId = parseInt(req.params[resourceIdParam], 10);

      if (isNaN(resourceId)) {
        throw new ApiError(400, `Invalid resource ID: ${resourceIdParam}`);
      }

      const hasAccess = await hasPermission(userId, permission, resourceType, resourceId);

      if (!hasAccess) {
        throw new ApiError(403, `Permission denied: ${permission} on ${resourceType} ${resourceId}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * 检查权限（不阻止请求，只添加标志）
 * Check permission without blocking the request, adds flag to req.permissions
 */
export function checkPermission(permission: Permission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        req.permissions = { [permission]: false };
        return next();
      }

      const hasAccess = await hasPermission(userId, permission);
      req.permissions = { ...req.permissions, [permission]: hasAccess };

      next();
    } catch (error) {
      req.permissions = { [permission]: false };
      next();
    }
  };
}

/**
 * 扩展 Request 类型以支持 permissions 属性
 */
declare global {
  namespace Express {
    interface Request {
      permissions?: Record<string, boolean>;
    }
  }
}

/**
 * 批量检查权限（添加到 req.permissions）
 * Check multiple permissions and add to req.permissions
 */
export function checkPermissions(permissions: Permission[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        req.permissions = permissions.reduce((acc, p) => ({ ...acc, [p]: false }), {});
        return next();
      }

      const checks = await Promise.all(
        permissions.map(async p => ({
          permission: p,
          granted: await hasPermission(userId, p),
        }))
      );

      req.permissions = checks.reduce(
        (acc, { permission, granted }) => ({ ...acc, [permission]: granted }),
        {}
      );

      next();
    } catch (error) {
      req.permissions = permissions.reduce((acc, p) => ({ ...acc, [p]: false }), {});
      next();
    }
  };
}
