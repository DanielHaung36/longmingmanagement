import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route GET /api/mine-zones
 * @desc 获取所有矿区列表
 */
router.get('/', async (req, res) => {
  try {
    const { isActive, search } = req.query;

    const where: any = {};

    // 筛选激活状态
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // 搜索功能
    if (search) {
      where.OR = [
        { code: { contains: search as string, mode: 'insensitive' } },
        { name: { contains: search as string, mode: 'insensitive' } },
        { location: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const mineZones = await prisma.mine_zones.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { projects: true }
        }
      }
    });

    res.json({
      success: true,
      data: mineZones,
      total: mineZones.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/mine-zones/:id
 * @desc 获取单个矿区详情
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const mineZone = await prisma.mine_zones.findUnique({
      where: { id },
      include: {
        projects: {
          select: {
            id: true,
            projectCode: true,
            name: true,
            // jobType 已删除 - jobType 只在 task 级别定义
            status: true,
            users: {
              select: {
                id: true,
                realName: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!mineZone) {
      return res.status(404).json({
        success: false,
        error: '矿区不存在'
      });
    }

    res.json({
      success: true,
      data: mineZone
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/mine-zones
 * @desc 创建新矿区
 */
router.post('/', async (req, res) => {
  try {
    const { code, name, location, description, isActive = true } = req.body;

    // 验证必填字段
    if (!code || !name || !location) {
      return res.status(400).json({
        success: false,
        error: '矿区代码、名称和位置不能为空'
      });
    }

    // 检查代码是否已存在
    const existing = await prisma.mine_zones.findFirst({
      where: { code }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: `矿区代码 ${code} 已存在`
      });
    }

    const mineZone = await prisma.mine_zones.create({
      data: {
        code,
        name,
        location,
        description,
        isActive
      }
    });

    res.status(201).json({
      success: true,
      message: '矿区创建成功',
      data: mineZone
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route PUT /api/mine-zones/:id
 * @desc 更新矿区信息
 */
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { code, name, location, description, isActive } = req.body;

    // 检查矿区是否存在
    const existing = await prisma.mine_zones.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: '矿区不存在'
      });
    }

    // 如果修改了代码，检查新代码是否已存在
    if (code && code !== existing.code) {
      const duplicate = await prisma.mine_zones.findFirst({
        where: { code, id: { not: id } }
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          error: `矿区代码 ${code} 已被使用`
        });
      }
    }

    const mineZone = await prisma.mine_zones.update({
      where: { id },
      data: {
        ...(code && { code }),
        ...(name && { name }),
        ...(location && { location }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json({
      success: true,
      message: '矿区更新成功',
      data: mineZone
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/mine-zones/:id
 * @desc 删除矿区（软删除，设为不激活）
 */
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // 检查矿区是否存在
    const mineZone = await prisma.mine_zones.findUnique({
      where: { id },
      include: {
        _count: {
          select: { projects: true }
        }
      }
    });

    if (!mineZone) {
      return res.status(404).json({
        success: false,
        error: '矿区不存在'
      });
    }

    // 如果有关联项目，只做软删除（设为不激活）
    if (mineZone._count.projects > 0) {
      const updated = await prisma.mine_zones.update({
        where: { id },
        data: { isActive: false }
      });

      return res.json({
        success: true,
        message: `矿区已停用（该矿区有 ${mineZone._count.projects} 个关联项目）`,
        data: updated
      });
    }

    // 如果没有关联项目，可以真删除
    await prisma.mine_zones.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: '矿区删除成功'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/mine-zones/:id/projects
 * @desc 获取矿区下的所有项目
 */
router.get('/:id/projects', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const mineZone = await prisma.mine_zones.findUnique({
      where: { id }
    });

    if (!mineZone) {
      return res.status(404).json({
        success: false,
        error: '矿区不存在'
      });
    }

    const projects = await prisma.projects.findMany({
      where: { mineZoneId: id },
      include: {
        users: {
          select: {
            id: true,
            realName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: {
        mineZone,
        projects,
        total: projects.length
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
