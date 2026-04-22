export interface RegisterInput {
    username: string;
    email: string;
    password: string;
    realName?: string;
    phone?: string;
}
export interface LoginInput {
    username: string;
    password: string;
}
/**
 * 认证服务类
 */
export declare class AuthService {
    /**
     * 用户注册
     */
    static register(data: RegisterInput): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        user: {
            id: number;
            cognitoId: string;
            username: string;
            email: string;
            realName: string | null;
            phone: string | null;
            profilePictureUrl: string | null;
            departmentId: number | null;
            position: string | null;
            employeeId: string | null;
            teamId: number | null;
            status: import(".prisma/client").$Enums.UserStatus;
            role: import(".prisma/client").$Enums.UserRole;
            lastNotificationReadTime: Date | null;
            lastLoginAt: Date | null;
            oneDriveLocalPath: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    /**
     * 用户登录
     */
    static login(data: LoginInput, ipAddress?: string, userAgent?: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        user: {
            id: number;
            cognitoId: string;
            username: string;
            email: string;
            realName: string | null;
            phone: string | null;
            profilePictureUrl: string | null;
            departmentId: number | null;
            position: string | null;
            employeeId: string | null;
            teamId: number | null;
            status: import(".prisma/client").$Enums.UserStatus;
            role: import(".prisma/client").$Enums.UserRole;
            lastNotificationReadTime: Date | null;
            lastLoginAt: Date | null;
            oneDriveLocalPath: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    /**
     * 刷新Token
     */
    static refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        expiresIn: number;
    }>;
    /**
     * 登出
     */
    static logout(refreshToken: string): Promise<void>;
    /**
     * 忘记密码 - 发送重置邮件
     */
    static forgotPassword(email: string): Promise<{
        message: string;
    }>;
    /**
     * 重置密码
     */
    static resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
    /**
     * 修改密码 (已登录用户)
     */
    static changePassword(userId: number, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    /**
     * 验证Access Token并获取用户信息
     */
    static verifyAccessToken(token: string): Promise<{
        id: number;
        cognitoId: string;
        username: string;
        email: string;
        realName: string | null;
        phone: string | null;
        profilePictureUrl: string | null;
        departmentId: number | null;
        position: string | null;
        employeeId: string | null;
        teamId: number | null;
        status: import(".prisma/client").$Enums.UserStatus;
        role: import(".prisma/client").$Enums.UserRole;
        lastNotificationReadTime: Date | null;
        lastLoginAt: Date | null;
        oneDriveLocalPath: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
//# sourceMappingURL=authService.d.ts.map