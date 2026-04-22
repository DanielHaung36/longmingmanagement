import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                username: string;
                email: string;
                role: string;
                realName?: string;
                profilePictureUrl?: string;
                status: string;
            };
            userId?: number;
            role?: string;
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
export declare function cookieAuth(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
/**
 * 可选认证中间件
 *
 * 如果有Cookie则验证并注入用户，没有Cookie也允许继续
 * 用于公开接口但需要区分登录/未登录用户的场景
 *
 * 开发模式：如果没有Cookie，自动注入管理员用户（id: 11）
 */
export declare function optionalCookieAuth(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * 角色验证中间件工厂函数
 *
 * @param allowedRoles 允许的角色列表
 *
 * 使用示例：
 * router.post('/approve', cookieAuth, requireRole('ADMIN', 'MANAGER'), handler)
 */
export declare function requireRole(...allowedRoles: string[]): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
/**
 * 预定义角色中间件
 */
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const requireManager: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const requireApprover: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
/**
 * 资源所有权验证中间件工厂函数
 *
 * @param getResourceOwnerId 获取资源所有者ID的函数
 *
 * 使用示例：
 * router.delete('/tasks/:id', cookieAuth, requireOwnership(getTaskOwnerId), handler)
 */
export declare function requireOwnership(getResourceOwnerId: (req: Request) => Promise<number | null>): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=cookieAuth.d.ts.map