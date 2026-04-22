/**
 * Team Controller - Teams 管理控制器
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 创建 Team DTO
 */
export interface CreateTeamDTO {
  name: string;
  description?: string;
  managerId?: number;
  isActive?: boolean;
}

/**
 * 创建 Team
 * POST /api/teams
 */
export const createTeam = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data: CreateTeamDTO = req.body;

    // 验证必填字段
    if (!data.name || data.name.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: '团队名称不能为空',
      });
      return;
    }

    // 检查团队名称是否已存在
    const existingTeam = await prisma.teams.findFirst({
      where: {
        name: data.name.trim(),
      },
    });

    if (existingTeam) {
      res.status(409).json({
        success: false,
        message: `团队名称 "${data.name}" 已存在`,
        data: {
          existingTeamId: existingTeam.id,
        },
      });
      return;
    }

    // 如果指定了 managerId，验证该用户是否存在
    if (data.managerId) {
      const manager = await prisma.users.findUnique({
        where: { id: data.managerId },
      });

      if (!manager) {
        res.status(400).json({
          success: false,
          message: `管理员用户 ID ${data.managerId} 不存在`,
        });
        return;
      }
    }

    // 创建团队
    const team = await prisma.teams.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        managerId: data.managerId || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      include: {
        users_teams_managerIdTousers: {
          select: {
            id: true,
            username: true,
            realName: true,
            email: true,
          },
        },
      },
    });

    console.log('✅ 团队创建成功:', { id: team.id, name: team.name });

    res.status(201).json({
      success: true,
      message: '团队创建成功',
      data: team,
    });
  } catch (error: any) {
    console.error('❌ 创建团队失败:', error);
    res.status(500).json({
      success: false,
      message: `创建团队失败: ${error.message}`,
    });
  }
};

/**
 * 获取所有 Teams（支持分页和过滤）
 * GET /api/teams?page=1&pageSize=10&isActive=true
 */
export const getAllTeams = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { isActive } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [teams, total] = await Promise.all([
      prisma.teams.findMany({
        where,
        include: {
          users_teams_managerIdTousers: {
            select: {
              id: true,
              username: true,
              realName: true,
              email: true,
            },
          },
          users_users_teamIdToteams: {
            select: {
              id: true,
              username: true,
              realName: true,
            },
            take: 5, // 只显示前5个成员
          },
          _count: {
            select: {
              users_users_teamIdToteams: true,
              projects: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      prisma.teams.count({ where }),
    ]);

    res.json({
      success: true,
      message: '团队列表查询成功',
      data: {
        teams,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error: any) {
    console.error('❌ 查询团队列表失败:', error);
    res.status(500).json({
      success: false,
      message: `查询失败: ${error.message}`,
    });
  }
};

/**
 * 获取单个 Team 详情
 * GET /api/teams/:id
 */
export const getTeamById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const teamId = parseInt(id);

    const team = await prisma.teams.findUnique({
      where: { id: teamId },
      include: {
        users_teams_managerIdTousers: {
          select: {
            id: true,
            username: true,
            realName: true,
            email: true,
            status: true,
          },
        },
        users_users_teamIdToteams: {
          select: {
            id: true,
            username: true,
            realName: true,
            email: true,
            position: true,
            status: true,
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
            projectCode: true,
            // jobType 已删除 - jobType 只在 task 级别定义
            status: true,
            approvalStatus: true,
          },
          take: 10, // 最多显示10个关联项目
        },
        _count: {
          select: {
            users_users_teamIdToteams: true,
            projects: true,
            project_teams: true,
          },
        },
      },
    });

    if (!team) {
      res.status(404).json({
        success: false,
        message: '团队不存在',
      });
      return;
    }

    res.json({
      success: true,
      message: '团队详情查询成功',
      data: team,
    });
  } catch (error: any) {
    console.error('❌ 查询团队详情失败:', error);
    res.status(500).json({
      success: false,
      message: `查询失败: ${error.message}`,
    });
  }
};

/**
 * 更新 Team
 * PUT /api/teams/:id
 */
export const updateTeam = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: Partial<CreateTeamDTO> = req.body;
    const teamId = parseInt(id);

    const team = await prisma.teams.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      res.status(404).json({
        success: false,
        message: '团队不存在',
      });
      return;
    }

    // 如果更新名称，检查是否重复
    if (updateData.name && updateData.name.trim() !== team.name) {
      const existingTeam = await prisma.teams.findFirst({
        where: {
          name: updateData.name.trim(),
          id: { not: teamId },
        },
      });

      if (existingTeam) {
        res.status(409).json({
          success: false,
          message: `团队名称 "${updateData.name}" 已存在`,
        });
        return;
      }
    }

    // 如果更新 managerId，验证用户是否存在
    if (updateData.managerId) {
      const manager = await prisma.users.findUnique({
        where: { id: updateData.managerId },
      });

      if (!manager) {
        res.status(400).json({
          success: false,
          message: `管理员用户 ID ${updateData.managerId} 不存在`,
        });
        return;
      }
    }

    // 更新团队
    const updatedTeam = await prisma.teams.update({
      where: { id: teamId },
      data: {
        ...(updateData.name && { name: updateData.name.trim() }),
        ...(updateData.description !== undefined && {
          description: updateData.description?.trim() || null,
        }),
        ...(updateData.managerId !== undefined && {
          managerId: updateData.managerId || null,
        }),
        ...(updateData.isActive !== undefined && {
          isActive: updateData.isActive,
        }),
      },
      include: {
        users_teams_managerIdTousers: {
          select: {
            id: true,
            username: true,
            realName: true,
            email: true,
          },
        },
      },
    });

    console.log('✅ 团队更新成功:', { id: updatedTeam.id, name: updatedTeam.name });

    res.json({
      success: true,
      message: '团队更新成功',
      data: updatedTeam,
    });
  } catch (error: any) {
    console.error('❌ 更新团队失败:', error);
    res.status(500).json({
      success: false,
      message: `更新失败: ${error.message}`,
    });
  }
};

/**
 * 删除 Team
 * DELETE /api/teams/:id
 */
export const deleteTeam = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const teamId = parseInt(id);

    const team = await prisma.teams.findUnique({
      where: { id: teamId },
      include: {
        users_users_teamIdToteams: true,
        projects: true,
      },
    });

    if (!team) {
      res.status(404).json({
        success: false,
        message: '团队不存在',
      });
      return;
    }

    // 检查是否有关联的用户
    if (team.users_users_teamIdToteams.length > 0) {
      res.status(400).json({
        success: false,
        message: `无法删除团队，还有 ${team.users_users_teamIdToteams.length} 个成员关联到此团队，请先移除成员`,
      });
      return;
    }

    // 检查是否有关联的项目
    if (team.projects.length > 0) {
      res.status(400).json({
        success: false,
        message: `无法删除团队，还有 ${team.projects.length} 个项目关联到此团队`,
      });
      return;
    }

    // 删除团队
    await prisma.teams.delete({
      where: { id: teamId },
    });

    console.log('✅ 团队删除成功:', { id: teamId, name: team.name });

    res.json({
      success: true,
      message: '团队删除成功',
      data: {
        id: teamId,
        name: team.name,
      },
    });
  } catch (error: any) {
    console.error('❌ 删除团队失败:', error);
    res.status(500).json({
      success: false,
      message: `删除失败: ${error.message}`,
    });
  }
};

/**
 * 搜索 Teams（模糊搜索）
 * GET /api/teams/search?q=关键词&limit=10
 */
export const searchTeams = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || (q as string).trim().length === 0) {
      res.status(400).json({
        success: false,
        message: '搜索关键词不能为空',
      });
      return;
    }

    const searchTerm = (q as string).trim();

    const teams = await prisma.teams.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      include: {
        users_teams_managerIdTousers: {
          select: {
            id: true,
            username: true,
            realName: true,
          },
        },
        _count: {
          select: {
            users_users_teamIdToteams: true,
            projects: true,
          },
        },
      },
      take: parseInt(limit as string),
      orderBy: {
        updatedAt: 'desc',
      },
    });

    res.json({
      success: true,
      message: `找到 ${teams.length} 个团队`,
      data: teams,
    });
  } catch (error: any) {
    console.error('❌ 搜索团队失败:', error);
    res.status(500).json({
      success: false,
      message: `搜索失败: ${error.message}`,
    });
  }
};
