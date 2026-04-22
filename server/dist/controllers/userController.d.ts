import { Request, Response } from "express";
/**
 * 创建用户
 */
export declare const createUser: (req: Request, res: Response) => Promise<void>;
/**
 * 获取所有用户（带分页）
 */
export declare const getUsers: (req: Request, res: Response) => Promise<void>;
/**
 * 根据ID获取用户
 */
export declare const getUserById: (req: Request, res: Response) => Promise<void>;
/**
 * 根据Cognito ID获取用户（兼容旧接口）
 */
export declare const getUser: (req: Request, res: Response) => Promise<void>;
/**
 * 根据用户名获取用户
 */
export declare const getUserByUsername: (req: Request, res: Response) => Promise<void>;
/**
 * 根据邮箱获取用户
 */
export declare const getUserByEmail: (req: Request, res: Response) => Promise<void>;
/**
 * 更新用户
 */
export declare const updateUser: (req: Request, res: Response) => Promise<void>;
/**
 * 删除用户（软删除）
 */
export declare const deleteUser: (req: Request, res: Response) => Promise<void>;
/**
 * 硬删除用户
 */
export declare const hardDeleteUser: (req: Request, res: Response) => Promise<void>;
/**
 * 批量创建用户
 */
export declare const bulkCreateUsers: (req: Request, res: Response) => Promise<void>;
/**
 * 获取用户统计
 */
export declare const getUserStats: (req: Request, res: Response) => Promise<void>;
/**
 * 搜索用户（用于@功能）
 * GET /api/users/search
 */
export declare const searchUsers: (req: Request, res: Response) => Promise<void>;
/**
 * 更新用户状态
 * PATCH /api/users/:id/status
 */
export declare const updateUserStatus: (req: Request, res: Response) => Promise<void>;
/**
 * 保存用户的 OneDrive 本地路径配置
 */
export declare const saveOneDrivePath: (req: Request, res: Response) => Promise<void>;
/**
 * 获取用户的 OneDrive 本地路径配置
 */
export declare const getOneDrivePath: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=userController.d.ts.map