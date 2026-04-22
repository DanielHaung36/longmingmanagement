import { Request, Response } from "express";
import { UserService, CreateUserDTO, UpdateUserDTO } from "../services/userService";

/**
 * 创建用户
 */
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userData: CreateUserDTO = req.body;
    const user = await UserService.createUser(userData);

    res.status(201).json({
      success: true,
      message: '用户创建成功',
      data: user
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 获取所有用户（带分页）
 */
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page,
      limit,
      pageSize,
      status,
      departmentId,
      teamId,
      search
    } = req.query;

    const result = await UserService.getAllUsers({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : pageSize ? parseInt(pageSize as string) : undefined,
      status: status as any,
      departmentId: departmentId ? parseInt(departmentId as string) : undefined,
      teamId: teamId ? parseInt(teamId as string) : undefined,
      search: search as string
    });

    res.json({
      success: true,
      message: '获取用户列表成功',
      data: {
        data: result.users,
        pagination: result.pagination
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 根据ID获取用户
 */
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await UserService.getUserById(parseInt(id));

    res.json({
      success: true,
      data: user
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 根据Cognito ID获取用户（兼容旧接口）
 */
export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cognitoId } = req.params;
    const user = await UserService.getUserByUsername(cognitoId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在'
      });
      return;
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 根据用户名获取用户
 */
export const getUserByUsername = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;
    const user = await UserService.getUserByUsername(username);

    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在'
      });
      return;
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 根据邮箱获取用户
 */
export const getUserByEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.params;
    const user = await UserService.getUserByEmail(email);

    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在'
      });
      return;
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 更新用户
 */
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: UpdateUserDTO = req.body;

    const user = await UserService.updateUser(parseInt(id), updateData);

    res.json({
      success: true,
      message: '用户更新成功',
      data: user
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 删除用户（软删除）
 */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await UserService.deleteUser(parseInt(id));

    res.json({
      success: true,
      message: '用户已删除',
      data: user
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 硬删除用户
 */
export const hardDeleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await UserService.hardDeleteUser(parseInt(id));

    res.json({
      success: true,
      message: result.message
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 批量创建用户
 */
export const bulkCreateUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { users } = req.body;

    if (!Array.isArray(users)) {
      res.status(400).json({
        success: false,
        message: '请提供用户数组'
      });
      return;
    }

    const result = await UserService.bulkCreateUsers(users);

    res.status(201).json({
      success: true,
      message: `成功创建 ${result.count} 个用户`,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 获取用户统计
 */
export const getUserStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await UserService.getUserStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 搜索用户（用于@功能）
 * GET /api/users/search
 */
export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || (q as string).trim().length === 0) {
      res.status(400).json({
        success: false,
        message: '搜索关键词不能为空'
      });
      return;
    }

    const result = await UserService.getAllUsers({
      search: q as string,
      limit: parseInt(limit as string),
      page: 1,
      status: 'ACTIVE'  // 只搜索活跃用户
    });

    res.json({
      success: true,
      data: result.users.map(user => ({
        id: user.id,
        username: user.username,
        realName: user.realName,
        email: user.email,
        profilePictureUrl: user.profilePictureUrl
      }))
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 更新用户状态
 * PATCH /api/users/:id/status
 */
export const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
      res.status(400).json({
        success: false,
        message: '无效的状态值，必须为 ACTIVE, INACTIVE 或 SUSPENDED'
      });
      return;
    }

    const user = await UserService.updateUser(parseInt(id), { status });

    res.json({
      success: true,
      message: '用户状态更新成功',
      data: user
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 保存用户的 OneDrive 本地路径配置
 */
export const saveOneDrivePath = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.body.userId || req.user?.id);
    const { oneDriveLocalPath } = req.body;

    if (!userId) {
      res.status(400).json({
        success: false,
        message: '用户 ID 缺失'
      });
      return;
    }

    if (!oneDriveLocalPath || typeof oneDriveLocalPath !== 'string') {
      res.status(400).json({
        success: false,
        message: 'OneDrive 路径无效'
      });
      return;
    }

    const user = await UserService.updateUser(userId, { oneDriveLocalPath });

    res.json({
      success: true,
      message: 'OneDrive 路径保存成功',
      data: {
        oneDriveLocalPath: user.oneDriveLocalPath
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 获取用户的 OneDrive 本地路径配置
 */
export const getOneDrivePath = async (req: Request, res: Response): Promise<void> => {
  try {
    const userIdValue = req.params.userId || req.user?.id;
    const userId = typeof userIdValue === 'number' ? userIdValue : parseInt(userIdValue || '0');

    if (!userId) {
      res.status(400).json({
        success: false,
        message: '用户 ID 缺失'
      });
      return;
    }

    const user = await UserService.getUserById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户未找到'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        oneDriveLocalPath: user.oneDriveLocalPath || ''
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
