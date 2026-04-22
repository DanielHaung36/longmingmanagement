/**
 * 权限管理路由 - Permission Management Routes
 */

import express, { Request, Response } from 'express';
import {
  getUserPermissions,
  getRolePermissions,
  getAllPermissions,
  grantUserPermission,
  revokeUserPermission,
  updateUserRole,
} from '../services/permissionService';
import { cookieAuth } from '../middleware/cookieAuth';
import { requirePermission } from '../middleware/permissionMiddleware';
import { Permission, UserRole, PermissionScope, ResourceType } from '@prisma/client';
import { ApiResponse } from '../types/response.types';
import { ApiError } from '../utils/ApiError';

const router = express.Router();

/**
 * GET /permissions/me
 * 获取当前用户的所有权限
 */
router.get('/me', cookieAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const permissions = await getUserPermissions(userId);

    const response: ApiResponse<Permission[]> = {
      success: true,
      data: permissions,
      message: 'User permissions retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /permissions/user/:userId
 * 获取指定用户的所有权限（需要管理员权限）
 */
router.get(
  '/user/:userId',
  cookieAuth,
  requirePermission('USER_MANAGE'),
  async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      if (isNaN(userId)) {
        throw new ApiError(400, 'Invalid user ID');
      }

      const permissions = await getUserPermissions(userId);

      const response: ApiResponse<Permission[]> = {
        success: true,
        data: permissions,
        message: 'User permissions retrieved successfully',
      };

      res.json(response);
    } catch (error) {
      const err = error as Error;
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

/**
 * GET /permissions/role/:role
 * 获取角色的默认权限
 */
router.get('/role/:role', cookieAuth, async (req: Request, res: Response) => {
  try {
    const role = req.params.role.toUpperCase() as UserRole;

    if (!Object.values(UserRole).includes(role)) {
      throw new ApiError(400, `Invalid role: ${role}`);
    }

    const permissions = getRolePermissions(role);

    const response: ApiResponse<Permission[]> = {
      success: true,
      data: permissions,
      message: 'Role permissions retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /permissions/all
 * 获取所有可用权限
 */
router.get('/all', cookieAuth, requirePermission('ROLE_MANAGE'), async (req: Request, res: Response) => {
  try {
    const permissions = getAllPermissions();

    const response: ApiResponse<Permission[]> = {
      success: true,
      data: permissions,
      message: 'All permissions retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /permissions/grant
 * 授予用户权限（需要角色管理权限）
 */
router.post(
  '/grant',
  cookieAuth,
  requirePermission('ROLE_MANAGE'),
  async (req: Request, res: Response) => {
    try {
      const assignedBy = req.user?.id;
      if (!assignedBy) {
        throw new ApiError(401, 'Unauthorized');
      }

      const {
        userId,
        permissionCode,
        scope,
        resourceType,
        resourceId,
        expiresAt,
        reason,
      } = req.body;

      if (!userId || !permissionCode || !scope) {
        throw new ApiError(400, 'Missing required fields: userId, permissionCode, scope');
      }

      await grantUserPermission(
        userId,
        permissionCode as Permission,
        scope as PermissionScope,
        assignedBy,
        resourceType as ResourceType | undefined,
        resourceId,
        expiresAt ? new Date(expiresAt) : undefined,
        reason
      );

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Permission granted successfully',
      };

      res.json(response);
    } catch (error) {
      const err = error as Error;
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

/**
 * POST /permissions/revoke
 * 撤销用户权限（需要角色管理权限）
 */
router.post(
  '/revoke',
  cookieAuth,
  requirePermission('ROLE_MANAGE'),
  async (req: Request, res: Response) => {
    try {
      const { userId, permissionCode, scope, resourceType, resourceId } = req.body;

      if (!userId || !permissionCode || !scope) {
        throw new ApiError(400, 'Missing required fields: userId, permissionCode, scope');
      }

      await revokeUserPermission(
        userId,
        permissionCode as Permission,
        scope as PermissionScope,
        resourceType as ResourceType | undefined,
        resourceId
      );

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Permission revoked successfully',
      };

      res.json(response);
    } catch (error) {
      const err = error as Error;
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

/**
 * PUT /permissions/user/:userId/role
 * 更新用户角色（需要角色管理权限）
 */
router.put(
  '/user/:userId/role',
  cookieAuth,
  requirePermission('ROLE_MANAGE'),
  async (req: Request, res: Response) => {
    try {
      const updatedBy = req.user?.id;
      if (!updatedBy) {
        throw new ApiError(401, 'Unauthorized');
      }

      const userId = parseInt(req.params.userId, 10);
      if (isNaN(userId)) {
        throw new ApiError(400, 'Invalid user ID');
      }

      const { role } = req.body;
      if (!role || !Object.values(UserRole).includes(role)) {
        throw new ApiError(400, 'Invalid role');
      }

      await updateUserRole(userId, role as UserRole, updatedBy);

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'User role updated successfully',
      };

      res.json(response);
    } catch (error) {
      const err = error as Error;
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

export default router;
