"use strict";
/**
 * 权限管理服务 - Permission Management Service
 *
 * 功能：
 * 1. 权限检查 (Permission Checking)
 * 2. 角色-权限映射 (Role-Permission Mapping)
 * 3. 用户权限查询 (User Permission Query)
 * 4. 资源级权限 (Resource-level Permissions)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ROLE_PERMISSIONS = void 0;
exports.getUserPermissions = getUserPermissions;
exports.hasPermission = hasPermission;
exports.hasAnyPermission = hasAnyPermission;
exports.hasAllPermissions = hasAllPermissions;
exports.grantUserPermission = grantUserPermission;
exports.revokeUserPermission = revokeUserPermission;
exports.updateUserRole = updateUserRole;
exports.getRolePermissions = getRolePermissions;
exports.getAllPermissions = getAllPermissions;
exports.requirePermission = requirePermission;
exports.requireAnyPermission = requireAnyPermission;
exports.requireAllPermissions = requireAllPermissions;
const client_1 = require("@prisma/client");
const ApiError_1 = require("../utils/ApiError");
const prisma = new client_1.PrismaClient();
/**
 * 默认角色权限映射
 * 定义每个角色的基础权限
 */
exports.DEFAULT_ROLE_PERMISSIONS = {
    // 普通用户 - 基本读取权限
    USER: [
        'PROJECT_READ',
        'TASK_READ',
        'FILE_DOWNLOAD',
        'COMMENT_READ',
        'COMMENT_CREATE',
        'CHAT_PARTICIPATE',
        'NOTIFICATION_MANAGE',
        'REPORT_VIEW',
        'MINE_ZONE_READ',
    ],
    // 项目经理 - 项目全权管理 + 任务管理 + 审批
    MANAGER: [
        // 项目权限
        'PROJECT_CREATE',
        'PROJECT_READ',
        'PROJECT_UPDATE',
        'PROJECT_MEMBER_MANAGE',
        // 任务权限
        'TASK_CREATE',
        'TASK_READ',
        'TASK_UPDATE',
        'TASK_DELETE',
        'TASK_ASSIGN',
        // 测试工作权限
        'TESTWORK_CREATE',
        'TESTWORK_READ',
        'TESTWORK_UPDATE',
        'TESTWORK_EXECUTE',
        'TESTWORK_MONITOR',
        // 工作流权限
        'WORKFLOW_APPROVE',
        'WORKFLOW_DELEGATE',
        // 文件权限
        'FILE_UPLOAD',
        'FILE_DOWNLOAD',
        'FILE_SHARE',
        // 评论和聊天
        'COMMENT_CREATE',
        'COMMENT_READ',
        'CHAT_PARTICIPATE',
        'CHAT_MANAGE',
        // 通知和报表
        'NOTIFICATION_SEND',
        'NOTIFICATION_MANAGE',
        'REPORT_VIEW',
        'REPORT_EXPORT',
        // 矿区
        'MINE_ZONE_READ',
        'MINE_ZONE_UPDATE',
    ],
    // 团队主管 - 类似项目经理，但权限略少
    // 管理员 - 系统管理 + 用户管理
    ADMIN: [
        'SYSTEM_ADMIN',
        'USER_MANAGE',
        'ROLE_MANAGE',
        'TEAM_MANAGE',
        'PROJECT_CREATE',
        'PROJECT_READ',
        'PROJECT_UPDATE',
        'PROJECT_DELETE',
        'PROJECT_MEMBER_MANAGE',
        'TASK_CREATE',
        'TASK_READ',
        'TASK_UPDATE',
        'TASK_DELETE',
        'TASK_ASSIGN',
        'TESTWORK_CREATE',
        'TESTWORK_READ',
        'TESTWORK_UPDATE',
        'TESTWORK_DELETE',
        'TESTWORK_EXECUTE',
        'TESTWORK_MONITOR',
        'TESTWORK_ANALYZE',
        'WORKFLOW_CREATE',
        'WORKFLOW_APPROVE',
        'WORKFLOW_MANAGE',
        'FILE_UPLOAD',
        'FILE_DOWNLOAD',
        'FILE_DELETE',
        'FILE_SHARE',
        'COMMENT_CREATE',
        'COMMENT_READ',
        'COMMENT_DELETE',
        'CHAT_PARTICIPATE',
        'CHAT_MANAGE',
        'NOTIFICATION_SEND',
        'NOTIFICATION_MANAGE',
        'REPORT_VIEW',
        'REPORT_EXPORT',
        'REPORT_MANAGE',
        'MINE_ZONE_CREATE',
        'MINE_ZONE_READ',
        'MINE_ZONE_UPDATE',
        'MINE_ZONE_DELETE',
    ],
    // 超级管理员 - 所有权限
};
/**
 * 资源所有权检查
 * Check if user owns a resource
 */
async function checkResourceOwnership(userId, resourceType, resourceId) {
    try {
        switch (resourceType) {
            case 'PROJECT': {
                const project = await prisma.projects.findUnique({
                    where: { id: resourceId },
                    select: { ownerId: true, project_members: { where: { userId } } },
                });
                return project?.ownerId === userId || (project?.project_members?.length ?? 0) > 0;
            }
            case 'TASK': {
                const task = await prisma.tasks.findUnique({
                    where: { id: resourceId },
                    select: { authorUserId: true, assignedUserId: true },
                });
                return task?.authorUserId === userId || task?.assignedUserId === userId;
            }
            case 'FILE': {
                const file = await prisma.project_files.findUnique({
                    where: { id: resourceId },
                    select: { uploadedBy: true, isPublic: true },
                });
                return file?.uploadedBy === userId || file?.isPublic === true;
            }
            case 'COMMENT': {
                const comment = await prisma.comments.findUnique({
                    where: { id: resourceId },
                    select: { userId: true },
                });
                return comment?.userId === userId;
            }
            default:
                return false;
        }
    }
    catch (error) {
        console.error(`Error checking resource ownership:`, error);
        return false;
    }
}
/**
 * 获取用户的所有权限
 * Get all permissions for a user (role-based + user-specific)
 */
async function getUserPermissions(userId) {
    try {
        // 获取用户基本信息和角色
        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        if (!user) {
            throw new ApiError_1.ApiError(404, 'User not found');
        }
        // 基于角色的默认权限
        const rolePermissions = exports.DEFAULT_ROLE_PERMISSIONS[user.role] || [];
        // 用户特定权限（覆盖或添加）
        const userSpecificPermissions = await prisma.user_permissions.findMany({
            where: {
                userId,
                granted: true,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
            include: {
                permission_definitions: true,
            },
        });
        // 合并权限（去重）
        const allPermissions = new Set([
            ...rolePermissions,
            ...userSpecificPermissions.map(p => p.permission_definitions.code),
        ]);
        return Array.from(allPermissions);
    }
    catch (error) {
        console.error(`Error getting user permissions:`, error);
        throw error;
    }
}
/**
 * 检查用户是否有特定权限
 * Check if user has a specific permission
 */
async function hasPermission(userId, permission, resourceType, resourceId) {
    try {
        // 获取用户信息
        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        if (!user) {
            return false;
        }
        // SUPER_ADMIN 拥有所有权限
        if (user.role === 'ADMIN') {
            return true;
        }
        // 检查角色默认权限
        const rolePermissions = exports.DEFAULT_ROLE_PERMISSIONS[user.role] || [];
        const hasRolePermission = rolePermissions.includes(permission);
        // 如果需要检查资源级权限
        if (resourceType && resourceId !== undefined) {
            // 检查是否是资源所有者
            const isOwner = await checkResourceOwnership(userId, resourceType, resourceId);
            // 如果是所有者，拥有该资源的所有基本操作权限
            if (isOwner) {
                const ownerPermissions = ['READ', 'UPDATE'];
                const actionFromPermission = permission.split('_').pop();
                if (ownerPermissions.some(p => actionFromPermission?.includes(p))) {
                    return true;
                }
            }
            // 检查用户特定的资源权限
            const userResourcePermission = await prisma.user_permissions.findFirst({
                where: {
                    userId,
                    resourceType,
                    resourceId,
                    granted: true,
                    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                    permission_definitions: { code: permission },
                },
            });
            if (userResourcePermission) {
                return true;
            }
        }
        // 检查用户特定权限（系统级）
        const userPermission = await prisma.user_permissions.findFirst({
            where: {
                userId,
                scope: 'SYSTEM',
                granted: true,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                permission_definitions: { code: permission },
            },
        });
        return hasRolePermission || !!userPermission;
    }
    catch (error) {
        console.error(`Error checking permission:`, error);
        return false;
    }
}
/**
 * 批量检查权限
 * Check multiple permissions at once
 */
async function hasAnyPermission(userId, permissions) {
    try {
        const checks = await Promise.all(permissions.map(permission => hasPermission(userId, permission)));
        return checks.some(result => result);
    }
    catch (error) {
        console.error(`Error checking any permission:`, error);
        return false;
    }
}
async function hasAllPermissions(userId, permissions) {
    try {
        const checks = await Promise.all(permissions.map(permission => hasPermission(userId, permission)));
        return checks.every(result => result);
    }
    catch (error) {
        console.error(`Error checking all permissions:`, error);
        return false;
    }
}
/**
 * 授予用户权限
 * Grant permission to user
 */
async function grantUserPermission(userId, permissionCode, scope, assignedBy, resourceType, resourceId, expiresAt, reason) {
    try {
        // 获取权限定义
        const permissionDef = await prisma.permission_definitions.findUnique({
            where: { code: permissionCode },
        });
        if (!permissionDef) {
            throw new ApiError_1.ApiError(404, `Permission ${permissionCode} not found`);
        }
        // 创建用户权限
        await prisma.user_permissions.upsert({
            where: {
                userId_permissionId_scope_resourceType_resourceId: {
                    userId,
                    permissionId: permissionDef.id,
                    scope,
                    resourceType: resourceType || null,
                    resourceId: resourceId || null,
                },
            },
            create: {
                userId,
                permissionId: permissionDef.id,
                scope,
                resourceType,
                resourceId,
                granted: true,
                assignedBy,
                expiresAt,
                reason,
            },
            update: {
                granted: true,
                assignedBy,
                expiresAt,
                reason,
                assignedAt: new Date(),
            },
        });
        console.log(`✓ Granted permission ${permissionCode} to user ${userId}`);
    }
    catch (error) {
        console.error(`Error granting user permission:`, error);
        throw error;
    }
}
/**
 * 撤销用户权限
 * Revoke permission from user
 */
async function revokeUserPermission(userId, permissionCode, scope, resourceType, resourceId) {
    try {
        const permissionDef = await prisma.permission_definitions.findUnique({
            where: { code: permissionCode },
        });
        if (!permissionDef) {
            throw new ApiError_1.ApiError(404, `Permission ${permissionCode} not found`);
        }
        await prisma.user_permissions.updateMany({
            where: {
                userId,
                permissionId: permissionDef.id,
                scope,
                resourceType: resourceType || null,
                resourceId: resourceId || null,
            },
            data: {
                granted: false,
            },
        });
        console.log(`✓ Revoked permission ${permissionCode} from user ${userId}`);
    }
    catch (error) {
        console.error(`Error revoking user permission:`, error);
        throw error;
    }
}
/**
 * 更新用户角色
 * Update user role
 */
async function updateUserRole(userId, newRole, updatedBy) {
    try {
        // 检查执行者权限
        const hasRoleManagePermission = await hasPermission(updatedBy, 'ROLE_MANAGE');
        if (!hasRoleManagePermission) {
            throw new ApiError_1.ApiError(403, 'No permission to manage roles');
        }
        await prisma.users.update({
            where: { id: userId },
            data: { role: newRole },
        });
        // 记录审计日志
        await prisma.audit_logs.create({
            data: {
                tableName: 'users',
                recordId: userId,
                action: 'UPDATE_ROLE',
                changes: { newRole },
                userId: updatedBy,
            },
        });
        console.log(`✓ Updated user ${userId} role to ${newRole}`);
    }
    catch (error) {
        console.error(`Error updating user role:`, error);
        throw error;
    }
}
/**
 * 获取角色的所有权限
 * Get all permissions for a role
 */
function getRolePermissions(role) {
    return exports.DEFAULT_ROLE_PERMISSIONS[role] || [];
}
/**
 * 获取所有可用权限
 * Get all available permissions
 */
function getAllPermissions() {
    return Object.values(client_1.Permission);
}
/**
 * 权限中间件辅助函数
 * Helper for Express middleware
 */
function requirePermission(permission) {
    return async (userId) => {
        return hasPermission(userId, permission);
    };
}
function requireAnyPermission(permissions) {
    return async (userId) => {
        return hasAnyPermission(userId, permissions);
    };
}
function requireAllPermissions(permissions) {
    return async (userId) => {
        return hasAllPermissions(userId, permissions);
    };
}
//# sourceMappingURL=permissionService.js.map