/**
 * MiningInfoController - 矿业信息控制器
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ResponseBuilder } from '../utils/responseBuilder';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class MiningInfoController {
  /**
   * 获取项目的矿业信息
   * GET /api/projects/:projectId/mining-info
   */
  static async getMiningInfo(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;

      const miningInfo = await prisma.project_mining_info.findUnique({
        where: { projectId: parseInt(projectId) },
        include: {
          projects: {
            select: {
              id: true,
              name: true,
              projectCode: true,
            },
          },
        },
      });

      if (!miningInfo) {
        res.status(404).json(
          ResponseBuilder.notFound('Mining Info')
        );
        return;
      }

      res.status(200).json(
        ResponseBuilder.success(miningInfo, '获取矿业信息成功')
      );
    } catch (error: any) {
      logger.error('获取矿业信息失败', { error: error.message });
      res.status(500).json(
        ResponseBuilder.error(error.message, 'MINING_INFO_FETCH_FAILED')
      );
    }
  }

  /**
   * 更新或创建矿业信息
   * PUT /api/projects/:projectId/mining-info
   */
  static async upsertMiningInfo(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const {
        mineralType,
        estimatedTonnage,
        grade,
        contactPerson,
        contactEmail,
      } = req.body;

      // 检查项目是否存在
      const project = await prisma.projects.findUnique({
        where: { id: parseInt(projectId) },
      });

      if (!project) {
        res.status(404).json(
          ResponseBuilder.notFound('Project')
        );
        return;
      }

      // 使用 upsert 创建或更新
      const miningInfo = await prisma.project_mining_info.upsert({
        where: { projectId: parseInt(projectId) },
        update: {
          mineralType,
          estimatedTonnage: estimatedTonnage ? parseFloat(estimatedTonnage) : undefined,
          grade,
          contactPerson,
          contactEmail,
        },
        create: {
          projectId: parseInt(projectId),
          mineralType,
          estimatedTonnage: estimatedTonnage ? parseFloat(estimatedTonnage) : undefined,
          grade,
          contactPerson,
          contactEmail,
        },
        include: {
          projects: {
            select: {
              id: true,
              name: true,
              projectCode: true,
            },
          },
        },
      });

      res.status(200).json(
        ResponseBuilder.success(miningInfo, '矿业信息更新成功')
      );
    } catch (error: any) {
      logger.error('更新矿业信息失败', { error: error.message });
      res.status(500).json(
        ResponseBuilder.error(error.message, 'MINING_INFO_UPDATE_FAILED')
      );
    }
  }

  /**
   * 删除矿业信息
   * DELETE /api/projects/:projectId/mining-info
   */
  static async deleteMiningInfo(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;

      await prisma.project_mining_info.delete({
        where: { projectId: parseInt(projectId) },
      });

      res.status(200).json(
        ResponseBuilder.deleted('矿业信息删除成功')
      );
    } catch (error: any) {
      logger.error('删除矿业信息失败', { error: error.message });
      if (error.code === 'P2025') {
        res.status(404).json(
          ResponseBuilder.notFound('Mining Info')
        );
        return;
      }
      res.status(500).json(
        ResponseBuilder.error(error.message, 'MINING_INFO_DELETE_FAILED')
      );
    }
  }
}
