import { PrismaClient, UserStatus,UserRole,$Enums } from '@prisma/client';

const prisma = new PrismaClient();

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

// Map string to Prisma's $Enums.UserRole
const mapToPrismaUserRole = (role: string): $Enums.UserRole => {
  switch (role) {
    case 'USER':
      return $Enums.UserRole.USER;
    case 'MANAGER':
      return $Enums.UserRole.MANAGER;
    case 'ADMIN':
      return $Enums.UserRole.ADMIN;
    default:
      throw new Error(`Invalid UserRole: ${role}`);
  }
};



export class UserService {
  /**
   * 创建用户
   */
  static async createUser(data: CreateUserDTO) {
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
    } catch (error: any) {
      throw new Error(`创建用户失败: ${error.message}`);
    }
  }

  /**
   * 根据ID获取用户
   */
  static async getUserById(id: number) {
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
    } catch (error: any) {
      throw new Error(`获取用户失败: ${error.message}`);
    }
  }

  /**
   * 根据用户名获取用户
   */
  static async getUserByUsername(username: string) {
    try {
      const user = await prisma.users.findUnique({
        where: { username },
        include: {
          
          departments_users_departmentIdTodepartments: true
        }
      });

      return user;
    } catch (error: any) {
      throw new Error(`获取用户失败: ${error.message}`);
    }
  }

  /**
   * 根据邮箱获取用户
   */
  static async getUserByEmail(email: string) {
    try {
      const user = await prisma.users.findUnique({
        where: { email },
        include: {
          
          departments_users_departmentIdTodepartments: true
        }
      });

      return user;
    } catch (error: any) {
      throw new Error(`获取用户失败: ${error.message}`);
    }
  }

  /**
   * 获取所有用户（带分页和筛选）
   */
  static async getAllUsers(options: {
    page?: number;
    limit?: number;
    status?: UserStatus;
    departmentId?: number;
    teamId?: number;
    search?: string;
  } = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        departmentId,
        teamId,
        search
      } = options;

      const skip = (page - 1) * limit;

      const where: any = {};

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
    } catch (error: any) {
      throw new Error(`获取用户列表失败: ${error.message}`);
    }
  }

  /**
   * 更新用户
   */
  static async updateUser(id: number, data: UpdateUserDTO) {
    try {
      const user = await prisma.users.update({
        where: { id },
        data: {
          realName: data.realName,
          phone: data.phone,
          role: data.role,   // ✅ 修正,  // Add role field
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
    } catch (error: any) {
      console.log(`更新用户失败: ${error.message}`);
      
      throw new Error(`更新用户失败: ${error.message}`);
    }
  }

  /**
   * 删除用户（软删除：设置状态为SUSPENDED）
   */
  static async deleteUser(id: number) {
    try {
      const user = await prisma.users.update({
        where: { id },
        data: {
          status: 'SUSPENDED'
        }
      });

      return user;
    } catch (error: any) {
      throw new Error(`删除用户失败: ${error.message}`);
    }
  }

  /**
   * 硬删除用户（谨慎使用）
   */
  static async hardDeleteUser(id: number) {
    try {
      await prisma.users.delete({
        where: { id }
      });

      return { success: true, message: '用户已永久删除' };
    } catch (error: any) {
      throw new Error(`永久删除用户失败: ${error.message}`);
    }
  }

  /**
   * 更新用户最后登录时间
   */
  static async updateLastLogin(id: number) {
    try {
      await prisma.users.update({
        where: { id },
        data: {
          lastLoginAt: new Date()
        }
      });
    } catch (error: any) {
      throw new Error(`更新登录时间失败: ${error.message}`);
    }
  }

  /**
   * 批量创建用户
   */
  static async bulkCreateUsers(usersData: CreateUserDTO[]) {
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
    } catch (error: any) {
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
    } catch (error: any) {
      throw new Error(`获取用户统计失败: ${error.message}`);
    }
  }
}
