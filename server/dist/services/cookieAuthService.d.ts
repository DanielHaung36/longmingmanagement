import { Response } from 'express';
/**
 * Session数据接口
 */
export interface SessionData {
    userId: number;
    username: string;
    email: string;
    role: string;
    realName?: string;
    createdAt: number;
    expiresAt: number;
}
/**
 * 用户信息接口（返回给前端）
 */
export interface UserInfo {
    id: number;
    username: string;
    email: string;
    role: string;
    realName?: string;
    profilePictureUrl?: string;
    status: string;
    phone?: string;
    position?: string;
    teamId?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
/**
 * Cookie认证服务类
 *
 * 核心功能：
 * 1. 登录/登出
 * 2. Session创建/验证/删除
 * 3. Cookie自动刷新
 * 4. 简单清晰，只用Cookie
 */
export declare class CookieAuthService {
    /**
     * 用户注册
     */
    static register(username: string, email: string, password: string, realName: string | undefined, res: Response, role?: string, status?: string, phone?: string): Promise<UserInfo>;
    /**
     * 用户登录
     */
    static login(username: string, password: string, res: Response): Promise<UserInfo>;
    /**
     * Create session for an externally-authenticated user (e.g. Keycloak SSO callback)
     */
    static createSessionForUser(userId: number, username: string, email: string, role: string, res: Response): Promise<void>;
    /**
     * 用户登出
     */
    static logout(sessionToken: string, res: Response): Promise<void>;
    /**
     * 验证Session并返回用户信息
     */
    static verifySession(sessionToken: string, res?: Response): Promise<UserInfo>;
    /**
     * 创建Session（加密存储）
     */
    private static createSession;
    /**
     * 加密Session数据（AES-256-CBC）
     */
    private static encryptSession;
    /**
     * 解密Session数据
     */
    private static decryptSession;
    /**
     * 删除Session
     */
    private static deleteSession;
    /**
     * 设置Cookie
     */
    private static setCookie;
    /**
     * 清除Cookie
     */
    private static clearCookie;
    /**
     * 从Cookie中提取Session Token
     */
    static extractToken(cookies: any): string | null;
}
//# sourceMappingURL=cookieAuthService.d.ts.map