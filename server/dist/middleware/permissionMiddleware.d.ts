/**
 * 权限中间件 - Permission Middleware
 *
 * 用法示例：
 * router.get('/projects', requireAuth, requirePermission('PROJECT_READ'), getProjects);
 * router.post('/projects', requireAuth, requirePermission('PROJECT_CREATE'), createProject);
 */
import { Request, Response, NextFunction } from 'express';
import { Permission, ResourceType } from '@prisma/client';
/**
 * 要求用户拥有特定权限
 * Require user to have a specific permission
 */
export declare function requirePermission(permission: Permission): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * 要求用户拥有任意一个权限
 * Require user to have any of the specified permissions
 */
export declare function requireAnyPermission(permissions: Permission[]): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * 要求用户拥有所有权限
 * Require user to have all of the specified permissions
 */
export declare function requireAllPermissions(permissions: Permission[]): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * 要求用户拥有资源级权限
 * Require user to have permission on a specific resource
 */
export declare function requireResourcePermission(permission: Permission, resourceType: ResourceType, resourceIdParam?: string): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * 检查权限（不阻止请求，只添加标志）
 * Check permission without blocking the request, adds flag to req.permissions
 */
export declare function checkPermission(permission: Permission): (req: Request, res: Response, next: NextFunction) => Promise<void>;
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
export declare function checkPermissions(permissions: Permission[]): (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=permissionMiddleware.d.ts.map