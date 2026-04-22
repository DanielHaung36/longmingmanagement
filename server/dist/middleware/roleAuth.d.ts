/**
 * 角色权限中间件
 * 用于检查用户是否有足够的权限执行特定操作
 */
import { Request, Response, NextFunction } from 'express';
/**
 * 检查用户是否有审批权限
 */
export declare const requireApproverRole: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * 检查用户是否有管理用户的权限
 */
export declare const requireUserManagerRole: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * 检查用户是否有指定角色之一
 */
export declare const requireRoles: (allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * 检查用户是否可以审批指定的项目
 * 规则：
 * 1. 必须有审批权限的角色
 * 2. 不能审批自己创建的项目
 */
export declare const canApproveProject: (userId: number, projectOwnerId: number) => Promise<{
    canApprove: boolean;
    reason?: string;
}>;
/**
 * 检查用户是否可以审批指定的任务
 * 规则：
 * 1. 必须有审批权限的角色
 * 2. 不能审批自己创建的任务
 */
export declare const canApproveTask: (userId: number, taskAuthorId: number) => Promise<{
    canApprove: boolean;
    reason?: string;
}>;
//# sourceMappingURL=roleAuth.d.ts.map