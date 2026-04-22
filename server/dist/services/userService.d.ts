import { UserStatus, UserRole, $Enums } from '@prisma/client';
export interface CreateUserDTO {
    cognitoId: string;
    username: string;
    email: string;
    realName?: string;
    phone?: string;
    profilePictureUrl?: string;
    departmentId?: number;
    position?: string;
    employeeId?: string;
    teamId?: number;
    status?: UserStatus;
}
export interface UpdateUserDTO {
    realName?: string;
    phone?: string;
    role?: UserRole;
    profilePictureUrl?: string;
    departmentId?: number;
    position?: string;
    status?: UserStatus;
    teamId?: number;
    oneDriveLocalPath?: string;
}
export declare class UserService {
    /**
     * 创建用户
     */
    static createUser(data: CreateUserDTO): Promise<{
        departments_users_departmentIdTodepartments: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            code: string;
            description: string | null;
            parentId: number | null;
            managerId: number | null;
            isActive: boolean;
        };
    } & {
        id: number;
        cognitoId: string;
        username: string;
        email: string;
        password: string;
        realName: string | null;
        phone: string | null;
        profilePictureUrl: string | null;
        departmentId: number | null;
        position: string | null;
        employeeId: string | null;
        teamId: number | null;
        status: $Enums.UserStatus;
        role: $Enums.UserRole;
        lastNotificationReadTime: Date | null;
        lastLoginAt: Date | null;
        oneDriveLocalPath: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * 根据ID获取用户
     */
    static getUserById(id: number): Promise<{
        user_roles: ({
            roles: {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                scope: $Enums.PermissionScope;
                description: string | null;
                isActive: boolean;
                isSystem: boolean;
            };
        } & {
            id: number;
            scope: $Enums.PermissionScope;
            userId: number;
            expiresAt: Date | null;
            isActive: boolean;
            resourceType: $Enums.ResourceType | null;
            resourceId: number | null;
            assignedAt: Date;
            roleId: number;
        })[];
        departments_users_departmentIdTodepartments: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            code: string;
            description: string | null;
            parentId: number | null;
            managerId: number | null;
            isActive: boolean;
        };
    } & {
        id: number;
        cognitoId: string;
        username: string;
        email: string;
        password: string;
        realName: string | null;
        phone: string | null;
        profilePictureUrl: string | null;
        departmentId: number | null;
        position: string | null;
        employeeId: string | null;
        teamId: number | null;
        status: $Enums.UserStatus;
        role: $Enums.UserRole;
        lastNotificationReadTime: Date | null;
        lastLoginAt: Date | null;
        oneDriveLocalPath: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * 根据用户名获取用户
     */
    static getUserByUsername(username: string): Promise<{
        departments_users_departmentIdTodepartments: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            code: string;
            description: string | null;
            parentId: number | null;
            managerId: number | null;
            isActive: boolean;
        };
    } & {
        id: number;
        cognitoId: string;
        username: string;
        email: string;
        password: string;
        realName: string | null;
        phone: string | null;
        profilePictureUrl: string | null;
        departmentId: number | null;
        position: string | null;
        employeeId: string | null;
        teamId: number | null;
        status: $Enums.UserStatus;
        role: $Enums.UserRole;
        lastNotificationReadTime: Date | null;
        lastLoginAt: Date | null;
        oneDriveLocalPath: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * 根据邮箱获取用户
     */
    static getUserByEmail(email: string): Promise<{
        departments_users_departmentIdTodepartments: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            code: string;
            description: string | null;
            parentId: number | null;
            managerId: number | null;
            isActive: boolean;
        };
    } & {
        id: number;
        cognitoId: string;
        username: string;
        email: string;
        password: string;
        realName: string | null;
        phone: string | null;
        profilePictureUrl: string | null;
        departmentId: number | null;
        position: string | null;
        employeeId: string | null;
        teamId: number | null;
        status: $Enums.UserStatus;
        role: $Enums.UserRole;
        lastNotificationReadTime: Date | null;
        lastLoginAt: Date | null;
        oneDriveLocalPath: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * 获取所有用户（带分页和筛选）
     */
    static getAllUsers(options?: {
        page?: number;
        limit?: number;
        status?: UserStatus;
        departmentId?: number;
        teamId?: number;
        search?: string;
    }): Promise<{
        users: ({
            departments_users_departmentIdTodepartments: {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                code: string;
                description: string | null;
                parentId: number | null;
                managerId: number | null;
                isActive: boolean;
            };
        } & {
            id: number;
            cognitoId: string;
            username: string;
            email: string;
            password: string;
            realName: string | null;
            phone: string | null;
            profilePictureUrl: string | null;
            departmentId: number | null;
            position: string | null;
            employeeId: string | null;
            teamId: number | null;
            status: $Enums.UserStatus;
            role: $Enums.UserRole;
            lastNotificationReadTime: Date | null;
            lastLoginAt: Date | null;
            oneDriveLocalPath: string | null;
            createdAt: Date;
            updatedAt: Date;
        })[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    /**
     * 更新用户
     */
    static updateUser(id: number, data: UpdateUserDTO): Promise<{
        departments_users_departmentIdTodepartments: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            code: string;
            description: string | null;
            parentId: number | null;
            managerId: number | null;
            isActive: boolean;
        };
    } & {
        id: number;
        cognitoId: string;
        username: string;
        email: string;
        password: string;
        realName: string | null;
        phone: string | null;
        profilePictureUrl: string | null;
        departmentId: number | null;
        position: string | null;
        employeeId: string | null;
        teamId: number | null;
        status: $Enums.UserStatus;
        role: $Enums.UserRole;
        lastNotificationReadTime: Date | null;
        lastLoginAt: Date | null;
        oneDriveLocalPath: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * 删除用户（软删除：设置状态为SUSPENDED）
     */
    static deleteUser(id: number): Promise<{
        id: number;
        cognitoId: string;
        username: string;
        email: string;
        password: string;
        realName: string | null;
        phone: string | null;
        profilePictureUrl: string | null;
        departmentId: number | null;
        position: string | null;
        employeeId: string | null;
        teamId: number | null;
        status: $Enums.UserStatus;
        role: $Enums.UserRole;
        lastNotificationReadTime: Date | null;
        lastLoginAt: Date | null;
        oneDriveLocalPath: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * 硬删除用户（谨慎使用）
     */
    static hardDeleteUser(id: number): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * 更新用户最后登录时间
     */
    static updateLastLogin(id: number): Promise<void>;
    /**
     * 批量创建用户
     */
    static bulkCreateUsers(usersData: CreateUserDTO[]): Promise<import(".prisma/client").Prisma.BatchPayload>;
    /**
     * 获取用户统计信息
     */
    static getUserStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        suspended: number;
    }>;
}
//# sourceMappingURL=userService.d.ts.map