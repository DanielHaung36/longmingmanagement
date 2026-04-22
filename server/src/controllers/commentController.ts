/**
 * CommentController - 评论API控制器
 */

import { Request, Response } from 'express';
import { CommentService } from '../services/commentService';
import { logger } from '../utils/logger';
import { ResponseBuilder, ErrorCode } from '../utils/responseBuilder';

export class CommentController {
  /**
   * POST /api/comments
   * 创建评论
   */
  static async createComment(req: Request, res: Response): Promise<void> {
    try {
      const { content, images, entityType, entityId, parentId, mentionedUserIds } = req.body;

      // 从认证中间件获取用户ID（开发模式会自动注入）
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json(
          ResponseBuilder.error('未登录，请先登录', ErrorCode.UNAUTHORIZED)
        );
        return;
      }

      if (!content || !entityType || !entityId) {
        res.status(400).json(
          ResponseBuilder.error('缺少必填字段: content, entityType, entityId', ErrorCode.VALIDATION_ERROR)
        );
        return;
      }

      if (!['project', 'task'].includes(entityType)) {
        res.status(400).json(
          ResponseBuilder.error('entityType必须是project或task', ErrorCode.VALIDATION_ERROR)
        );
        return;
      }

      const comment = await CommentService.createComment({
        content,
        images: images || [],
        entityType,
        entityId: parseInt(entityId),
        userId,
        parentId: parentId ? parseInt(parentId) : undefined,
        mentionedUserIds: mentionedUserIds || [],
      });

      res.status(201).json(
        ResponseBuilder.success(comment, '评论创建成功')
      );
    } catch (error: any) {
      logger.error('创建评论失败', { error: error.message });
      res.status(500).json(
        ResponseBuilder.error(error.message, ErrorCode.INTERNAL_ERROR)
      );
    }
  }

  /**
   * GET /api/comments/:entityType/:entityId
   * 获取评论列表
   */
  static async getComments(req: Request, res: Response): Promise<void> {
    try {
      const { entityType, entityId } = req.params;
      const { page, limit, includeReplies } = req.query;

      if (!['project', 'task'].includes(entityType)) {
        res.status(400).json(
          ResponseBuilder.error('entityType必须是project或task', ErrorCode.VALIDATION_ERROR)
        );
        return;
      }

      const result = await CommentService.getComments(
        entityType as 'project' | 'task',
        parseInt(entityId),
        {
          page: page ? parseInt(page as string) : undefined,
          limit: limit ? parseInt(limit as string) : undefined,
          includeReplies: includeReplies === 'false' ? false : true,
        }
      );

      res.status(200).json(
        ResponseBuilder.success(result, '查询成功')
      );
    } catch (error: any) {
      logger.error('获取评论列表失败', { error: error.message });
      res.status(500).json(
        ResponseBuilder.error(error.message, ErrorCode.INTERNAL_ERROR)
      );
    }
  }

  /**
   * PATCH /api/comments/:commentId
   * 更新评论
   */
  static async updateComment(req: Request, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;
      const { content, images, mentionedUserIds } = req.body;
      const userId = (req as any).user?.id || 84;

      if (!content) {
        res.status(400).json(
          ResponseBuilder.error('缺少必填字段: content', ErrorCode.VALIDATION_ERROR)
        );
        return;
      }

      const updatedComment = await CommentService.updateComment({
        commentId: parseInt(commentId),
        content,
        images: images || [],
        userId,
        mentionedUserIds,
      });

      res.status(200).json(
        ResponseBuilder.success(updatedComment, '评论更新成功')
      );
    } catch (error: any) {
      logger.error('更新评论失败', { error: error.message });
      res.status(500).json(
        ResponseBuilder.error(error.message, ErrorCode.INTERNAL_ERROR)
      );
    }
  }

  /**
   * DELETE /api/comments/:commentId
   * 删除评论
   */
  static async deleteComment(req: Request, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;
      const userId = (req as any).user?.id || 84;

      const deletedComment = await CommentService.deleteComment(
        parseInt(commentId),
        userId
      );

      res.status(200).json(
        ResponseBuilder.success(deletedComment, '评论删除成功')
      );
    } catch (error: any) {
      logger.error('删除评论失败', { error: error.message });
      res.status(500).json(
        ResponseBuilder.error(error.message, ErrorCode.INTERNAL_ERROR)
      );
    }
  }

  /**
   * GET /api/comments/mentions
   * 获取用户被@提及的评论
   */
  static async getMentionedComments(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || 84;
      const { page, limit } = req.query;

      const result = await CommentService.getMentionedComments(userId, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.status(200).json(
        ResponseBuilder.success(result, '查询成功')
      );
    } catch (error: any) {
      logger.error('获取被@提及的评论失败', { error: error.message });
      res.status(500).json(
        ResponseBuilder.error(error.message, ErrorCode.INTERNAL_ERROR)
      );
    }
  }
}
