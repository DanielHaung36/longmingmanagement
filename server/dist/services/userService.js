"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Map string to Prisma's $Enums.UserRole
const mapToPrismaUserRole = (role) => {
    switch (role) {
        case 'USER':
            return client_1.$Enums.UserRole.USER;
        case 'MANAGER':
            return client_1.$Enums.UserRole.MANAGER;
        case 'ADMIN':
            return client_1.$Enums.UserRole.ADMIN;
        default:
            throw new Error(`Invalid UserRole: ${role}`);
    }
};
class UserService {
    /**
     * 创建用户
     */
    static async createUser(data) {
        try {
            const user = await prisma.users.create({
                data: {
                    cognitoId: data.cognitoId,
                    username: data.username,
                    email: data.email,
                    password: '$2b$10$rMQ5YhG3xGx6kKZ5qX7Vv.8F5Xb3XkZqYZ5L5ZqX7Vv.8F5Xb3XkZq', // 默认密码: Admin123!
                    realName: data.realName,
                    phone: data.phone,
                    profilePictureUrl: data.profilePictureUrl,
                    departmentId: data.departmentId,
                    position: data.position,
                    employeeId: data.employeeId,
                    teamId: data.teamId,
                    status: data.status || 'ACTIVE'
                },
                include: {
                    departments_users_departmentIdTodepartments: true
                }
            });
            return user;
        }
        catch (error) {
            throw new Error(`创建用户失败: ${error.message}`);
        }
    }
    /**
     * 根据ID获取用户
     */
    static async getUserById(id) {
        try {
            const user = await prisma.users.findUnique({
                where: { id },
                include: {
                    departments_users_departmentIdTodepartments: true,
                    user_roles: {
                        include: {
                            roles: true
                        }
                    }
                }
            });
            if (!user) {
                throw new Error('用户不存在');
            }
            return user;
        }
        catch (error) {
            throw new Error(`获取用户失败: ${error.message}`);
        }
    }
    /**
     * 根据用户名获取用户
     */
    static async getUserByUsername(username) {
        try {
            const user = await prisma.users.findUnique({
                where: { username },
                include: {
                    departments_users_departmentIdTodepartments: true
                }
            });
            return user;
        }
        catch (error) {
            throw new Error(`获取用户失败: ${error.message}`);
        }
    }
    /**
     * 根据邮箱获取用户
     */
    static async getUserByEmail(email) {
        try {
            const user = await prisma.users.findUnique({
                where: { email },
                include: {
                    departments_users_departmentIdTodepartments: true
                }
            });
            return user;
        }
        catch (error) {
            throw new Error(`获取用户失败: ${error.message}`);
        }
    }
    /**
     * 获取所有用户（带分页和筛选）
     */
    static async getAllUsers(options = {}) {
        try {
            const { page = 1, limit = 20, status, departmentId, teamId, search } = options;
            const skip = (page - 1) * limit;
            const where = {};
            if (status) {
                where.status = status;
            }
            if (departmentId) {
                where.departmentId = departmentId;
            }
            if (teamId) {
                where.teamId = teamId;
            }
            if (search) {
                where.OR = [
                    { username: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { realName: { contains: search, mode: 'insensitive' } }
                ];
            }
            const [users, total] = await Promise.all([
                prisma.users.findMany({
                    where,
                    skip,
                    take: limit,
                    include: {
                        departments_users_departmentIdTodepartments: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }),
                prisma.users.count({ where })
            ]);
            return {
                users,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            };
        }
        catch (error) {
            throw new Error(`获取用户列表失败: ${error.message}`);
        }
    }
    /**
     * 更新用户
     */
    static async updateUser(id, data) {
        try {
            const user = await prisma.users.update({
                where: { id },
                data: {
                    realName: data.realName,
                    phone: data.phone,
                    role: data.role, // ✅ 修正,  // Add role field
                    profilePictureUrl: data.profilePictureUrl,
                    departmentId: data.departmentId,
                    position: data.position,
                    status: data.status,
                    teamId: data.teamId
                },
                include: {
                    departments_users_departmentIdTodepartments: true
                }
            });
            return user;
        }
        catch (error) {
            console.log(`更新用户失败: ${error.message}`);
            throw new Error(`更新用户失败: ${error.message}`);
        }
    }
    /**
     * 删除用户（软删除：设置状态为SUSPENDED）
     */
    static async deleteUser(id) {
        try {
            const user = await prisma.users.update({
                where: { id },
                data: {
                    status: 'SUSPENDED'
                }
            });
            return user;
        }
        catch (error) {
            throw new Error(`删除用户失败: ${error.message}`);
        }
    }
    /**
     * 硬删除用户（谨慎使用）
     */
    static async hardDeleteUser(id) {
        try {
            await prisma.users.delete({
                where: { id }
            });
            return { success: true, message: '用户已永久删除' };
        }
        catch (error) {
            throw new Error(`永久删除用户失败: ${error.message}`);
        }
    }
    /**
     * 更新用户最后登录时间
     */
    static async updateLastLogin(id) {
        try {
            await prisma.users.update({
                where: { id },
                data: {
                    lastLoginAt: new Date()
                }
            });
        }
        catch (error) {
            throw new Error(`更新登录时间失败: ${error.message}`);
        }
    }
    /**
     * 批量创建用户
     */
    static async bulkCreateUsers(usersData) {
        try {
            const users = await prisma.users.createMany({
                data: usersData.map(user => ({
                    cognitoId: user.cognitoId,
                    username: user.username,
                    email: user.email,
                    password: '$2b$10$rMQ5YhG3xGx6kKZ5qX7Vv.8F5Xb3XkZqYZ5L5ZqX7Vv.8F5Xb3XkZq', // 默认密码: Admin123!
                    realName: user.realName,
                    phone: user.phone,
                    profilePictureUrl: user.profilePictureUrl,
                    departmentId: user.departmentId,
                    position: user.position,
                    employeeId: user.employeeId,
                    teamId: user.teamId,
                    status: user.status || 'ACTIVE'
                })),
                skipDuplicates: true
            });
            return users;
        }
        catch (error) {
            throw new Error(`批量创建用户失败: ${error.message}`);
        }
    }
    /**
     * 获取用户统计信息
     */
    static async getUserStats() {
        try {
            const [total, active, inactive, suspended] = await Promise.all([
                prisma.users.count(),
                prisma.users.count({ where: { status: 'ACTIVE' } }),
                prisma.users.count({ where: { status: 'INACTIVE' } }),
                prisma.users.count({ where: { status: 'SUSPENDED' } })
            ]);
            return {
                total,
                active,
                inactive,
                suspended
            };
        }
        catch (error) {
            throw new Error(`获取用户统计失败: ${error.message}`);
        }
    }
}
exports.UserService = UserService;
//# sourceMappingURL=userService.js.map