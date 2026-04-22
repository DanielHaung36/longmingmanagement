/**
 * 权限管理服务 - Permission Management Service
 *
 * 功能：
 * 1. 权限检查 (Permission Checking)
 * 2. 角色-权限映射 (Role-Permission Mapping)
 * 3. 用户权限查询 (User Permission Query)
 * 4. 资源级权限 (Resource-level Permissions)
 */
import { UserRole, Permission, ResourceType, PermissionScope } from '@prisma/client';
/**
 * 默认角色权限映射
 * 定义每个角色的基础权限
 */
export declare const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Permission[]>;
/**
 * 获取用户的所有权限
 * Get all permissions for a user (role-based + user-specific)
 */
export declare function getUserPermissions(userId: number): Promise<Permission[]>;
/**
 * 检查用户是否有特定权限
 * Check if user has a specific permission
 */
export declare function hasPermission(userId: number, permission: Permission, resourceType?: ResourceType, resourceId?: number): Promise<boolean>;
/**
 * 批量检查权限
 * Check multiple permissions at once
 */
export declare function hasAnyPermission(userId: number, permissions: Permission[]): Promise<boolean>;
export declare function hasAllPermissions(userId: number, permissions: Permission[]): Promise<boolean>;
/**
 * 授予用户权限
 * Grant permission to user
 */
export declare function grantUserPermission(userId: number, permissionCode: Permission, scope: PermissionScope, assignedBy: number, resourceType?: ResourceType, resourceId?: number, expiresAt?: Date, reason?: string): Promise<void>;
/**
 * 撤销用户权限
 * Revoke permission from user
 */
export declare function revokeUserPermission(userId: number, permissionCode: Permission, scope: PermissionScope, resourceType?: ResourceType, resourceId?: number): Promise<void>;
/**
 * 更新用户角色
 * Update user role
 */
export declare function updateUserRole(userId: number, newRole: UserRole, updatedBy: number): Promise<void>;
/**
 * 获取角色的所有权限
 * Get all permissions for a role
 */
export declare function getRolePermissions(role: UserRole): Permission[];
/**
 * 获取所有可用权限
 * Get all available permissions
 */
export declare function getAllPermissions(): Permission[];
/**
 * 权限中间件辅助函数
 * Helper for Express middleware
 */
export declare function requirePermission(permission: Permission): (userId: number) => Promise<boolean>;
export declare function requireAnyPermission(permissions: Permission[]): (userId: number) => Promise<boolean>;
export declare function requireAllPermissions(permissions: Permission[]): (userId: number) => Promise<boolean>;
//# sourceMappingURL=permissionService.d.ts.map