"use strict";
/**
 * CommentController - 评论API控制器
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentController = void 0;
const commentService_1 = require("../services/commentService");
const logger_1 = require("../utils/logger");
const responseBuilder_1 = require("../utils/responseBuilder");
class CommentController {
    /**
     * POST /api/comments
     * 创建评论
     */
    static async createComment(req, res) {
        try {
            const { content, images, entityType, entityId, parentId, mentionedUserIds } = req.body;
            // 从认证中间件获取用户ID（开发模式会自动注入）
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json(responseBuilder_1.ResponseBuilder.error('未登录，请先登录', responseBuilder_1.ErrorCode.UNAUTHORIZED));
                return;
            }
            if (!content || !entityType || !entityId) {
                res.status(400).json(responseBuilder_1.ResponseBuilder.error('缺少必填字段: content, entityType, entityId', responseBuilder_1.ErrorCode.VALIDATION_ERROR));
                return;
            }
            if (!['project', 'task'].includes(entityType)) {
                res.status(400).json(responseBuilder_1.ResponseBuilder.error('entityType必须是project或task', responseBuilder_1.ErrorCode.VALIDATION_ERROR));
                return;
            }
            const comment = await commentService_1.CommentService.createComment({
                content,
                images: images || [],
                entityType,
                entityId: parseInt(entityId),
                userId,
                parentId: parentId ? parseInt(parentId) : undefined,
                mentionedUserIds: mentionedUserIds || [],
            });
            res.status(201).json(responseBuilder_1.ResponseBuilder.success(comment, '评论创建成功'));
        }
        catch (error) {
            logger_1.logger.error('创建评论失败', { error: error.message });
            res.status(500).json(responseBuilder_1.ResponseBuilder.error(error.message, responseBuilder_1.ErrorCode.INTERNAL_ERROR));
        }
    }
    /**
     * GET /api/comments/:entityType/:entityId
     * 获取评论列表
     */
    static async getComments(req, res) {
        try {
            const { entityType, entityId } = req.params;
            const { page, limit, includeReplies } = req.query;
            if (!['project', 'task'].includes(entityType)) {
                res.status(400).json(responseBuilder_1.ResponseBuilder.error('entityType必须是project或task', responseBuilder_1.ErrorCode.VALIDATION_ERROR));
                return;
            }
            const result = await commentService_1.CommentService.getComments(entityType, parseInt(entityId), {
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined,
                includeReplies: includeReplies === 'false' ? false : true,
            });
            res.status(200).json(responseBuilder_1.ResponseBuilder.success(result, '查询成功'));
        }
        catch (error) {
            logger_1.logger.error('获取评论列表失败', { error: error.message });
            res.status(500).json(responseBuilder_1.ResponseBuilder.error(error.message, responseBuilder_1.ErrorCode.INTERNAL_ERROR));
        }
    }
    /**
     * PATCH /api/comments/:commentId
     * 更新评论
     */
    static async updateComment(req, res) {
        try {
            const { commentId } = req.params;
            const { content, images, mentionedUserIds } = req.body;
            const userId = req.user?.id || 84;
            if (!content) {
                res.status(400).json(responseBuilder_1.ResponseBuilder.error('缺少必填字段: content', responseBuilder_1.ErrorCode.VALIDATION_ERROR));
                return;
            }
            const updatedComment = await commentService_1.CommentService.updateComment({
                commentId: parseInt(commentId),
                content,
                images: images || [],
                userId,
                mentionedUserIds,
            });
            res.status(200).json(responseBuilder_1.ResponseBuilder.success(updatedComment, '评论更新成功'));
        }
        catch (error) {
            logger_1.logger.error('更新评论失败', { error: error.message });
            res.status(500).json(responseBuilder_1.ResponseBuilder.error(error.message, responseBuilder_1.ErrorCode.INTERNAL_ERROR));
        }
    }
    /**
     * DELETE /api/comments/:commentId
     * 删除评论
     */
    static async deleteComment(req, res) {
        try {
            const { commentId } = req.params;
            const userId = req.user?.id || 84;
            const deletedComment = await commentService_1.CommentService.deleteComment(parseInt(commentId), userId);
            res.status(200).json(responseBuilder_1.ResponseBuilder.success(deletedComment, '评论删除成功'));
        }
        catch (error) {
            logger_1.logger.error('删除评论失败', { error: error.message });
            res.status(500).json(responseBuilder_1.ResponseBuilder.error(error.message, responseBuilder_1.ErrorCode.INTERNAL_ERROR));
        }
    }
    /**
     * GET /api/comments/mentions
     * 获取用户被@提及的评论
     */
    static async getMentionedComments(req, res) {
        try {
            const userId = req.user?.id || 84;
            const { page, limit } = req.query;
            const result = await commentService_1.CommentService.getMentionedComments(userId, {
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined,
            });
            res.status(200).json(responseBuilder_1.ResponseBuilder.success(result, '查询成功'));
        }
        catch (error) {
            logger_1.logger.error('获取被@提及的评论失败', { error: error.message });
            res.status(500).json(responseBuilder_1.ResponseBuilder.error(error.message, responseBuilder_1.ErrorCode.INTERNAL_ERROR));
        }
    }
}
exports.CommentController = CommentController;
//# sourceMappingURL=commentController.js.map