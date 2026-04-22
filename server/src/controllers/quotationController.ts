/**
 * QuotationController - 项目报价控制器
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ResponseBuilder } from '../utils/responseBuilder';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class QuotationController {
  /**
   * 获取项目的报价信息
   * GET /api/projects/:projectId/quotations
   */
  static async getProjectQuotations(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;

      const quotation = await prisma.project_quotations.findUnique({
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

      if (!quotation) {
        res.status(404).json(
          ResponseBuilder.notFound('Quotation')
        );
        return;
      }

      res.status(200).json(
        ResponseBuilder.success(quotation, '获取报价信息成功')
      );
    } catch (error: any) {
      logger.error('获取报价信息失败', { error: error.message });
      res.status(500).json(
        ResponseBuilder.error(error.message, 'QUOTATION_FETCH_FAILED')
      );
    }
  }

  /**
   * 创建或更新报价信息
   * PUT /api/projects/:projectId/quotations
   */
  static async upsertQuotation(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const {
        quotationNumber,
        requestDate,
        quotationProvidedDate,
        feedbackFromClient,
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
      const quotation = await prisma.project_quotations.upsert({
        where: { projectId: parseInt(projectId) },
        update: {
          quotationNumber,
          requestDate: requestDate ? new Date(requestDate) : undefined,
          quotationProvidedDate: quotationProvidedDate ? new Date(quotationProvidedDate) : undefined,
          feedbackFromClient,
        },
        create: {
          projectId: parseInt(projectId),
          quotationNumber,
          requestDate: requestDate ? new Date(requestDate) : undefined,
          quotationProvidedDate: quotationProvidedDate ? new Date(quotationProvidedDate) : undefined,
          feedbackFromClient,
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
        ResponseBuilder.success(quotation, '报价信息更新成功')
      );
    } catch (error: any) {
      logger.error('更新报价信息失败', { error: error.message });
      res.status(500).json(
        ResponseBuilder.error(error.message, 'QUOTATION_UPDATE_FAILED')
      );
    }
  }

  /**
   * 删除报价信息
   * DELETE /api/projects/:projectId/quotations
   */
  static async deleteQuotation(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;

      await prisma.project_quotations.delete({
        where: { projectId: parseInt(projectId) },
      });

      res.status(200).json(
        ResponseBuilder.deleted('报价信息删除成功')
      );
    } catch (error: any) {
      logger.error('删除报价信息失败', { error: error.message });
      if (error.code === 'P2025') {
        res.status(404).json(
          ResponseBuilder.notFound('Quotation')
        );
        return;
      }
      res.status(500).json(
        ResponseBuilder.error(error.message, 'QUOTATION_DELETE_FAILED')
      );
    }
  }
}
