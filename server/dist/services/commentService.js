"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const websocketService_1 = require("./websocketService");
const notificationService_1 = require("./notificationService");
const prisma = new client_1.PrismaClient();
// 只查2层：主评论 + 直接回复（性能最优）
const COMMENT_RELATION_INCLUDE = {
    users: {
        select: {
            id: true,
            username: true,
            realName: true,
            profilePictureUrl: true,
        },
    },
    comment_mentions: {
        include: {
            users: {
                select: {
                    id: true,
                    username: true,
                    realName: true,
                },
            },
        },
    },
    // 只查询直接子评论，不递归
    other_comments: {
        where: { isDeleted: false },
        include: {
            users: {
                select: {
                    id: true,
                    username: true,
                    realName: true,
                    profilePictureUrl: true,
                },
            },
            comment_mentions: {
                include: {
                    users: {
                        select: {
                            id: true,
                            username: true,
                            realName: true,
                        },
                    },
                },
            },
            // 如果直接子评论还有子评论，不在这里查询，前端可以请求加载
        },
        orderBy: { createdAt: 'asc' },
    },
    // 查询父评论信息（用于楼中楼@显示）
    comments: {
        select: {
            id: true,
            userId: true,
            users: {
                select: {
                    id: true,
                    username: true,
                    realName: true,
                },
            },
        },
    },
};
const getDisplayName = (user) => {
    const real = user?.realName?.trim();
    if (real)
        return real;
    const username = user?.username?.trim();
    if (username)
        return username;
    return 'Unknown';
};
const getInitials = (name) => {
    if (!name)
        return 'NA';
    const parts = name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase());
    return parts.join('').slice(0, 2) || 'NA';
};
class CommentService {
    static async createComment(input) {
        let parentComment = null;
        try {
            logger_1.logger.info('创建评论', {
                entityType: input.entityType,
                entityId: input.entityId,
                userId: input.userId,
            });
            await this.validateEntity(input.entityType, input.entityId);
            if (input.parentId) {
                parentComment = await prisma.comments.findUnique({
                    where: { id: input.parentId },
                });
                if (!parentComment) {
                    throw new Error(`父评论不存在: ${input.parentId}`);
                }
                if (parentComment.entityType !== input.entityType ||
                    parentComment.entityId !== input.entityId) {
                    throw new Error('回复的评论不属于同一实体');
                }
            }
            const comment = await prisma.comments.create({
                data: {
                    content: input.content,
                    images: input.images && input.images.length > 0 ? JSON.stringify(input.images) : null,
                    entityType: input.entityType,
                    entityId: input.entityId,
                    userId: input.userId,
                    parentId: input.parentId,
                },
                include: COMMENT_RELATION_INCLUDE,
            });
            const mentionPayloads = [];
            if (input.mentionedUserIds && input.mentionedUserIds.length > 0) {
                const validMentionIds = await this.validateUsers(input.mentionedUserIds);
                for (const mentionedUserId of validMentionIds) {
                    await prisma.comment_mentions.create({
                        data: {
                            commentId: comment.id,
                            userId: mentionedUserId,
                        },
                    });
                    const mentionedUser = await prisma.users.findUnique({
                        where: { id: mentionedUserId },
                        select: { id: true, username: true, realName: true },
                    });
                    if (mentionedUser) {
                        const displayName = getDisplayName(mentionedUser);
                        mentionPayloads.push({
                            id: mentionedUser.id,
                            username: mentionedUser.username,
                            realName: mentionedUser.realName,
                            displayName,
                        });
                        try {
                            // Notify the mentioned user through the in-app notification center.
                            await notificationService_1.NotificationService.createNotification({
                                type: client_1.NotificationType.COMMENT_MENTION,
                                title: `${getDisplayName(comment.users)} 提及了你`,
                                content: comment.content,
                                recipientId: mentionedUser.id,
                                senderId: input.userId,
                                relatedType: input.entityType,
                                relatedId: input.entityId,
                                metadata: {
                                    commentId: comment.id,
                                    entityType: input.entityType,
                                    entityId: input.entityId,
                                },
                            });
                        }
                        catch (notifyErr) {
                            logger_1.logger.warn('创建@提及通知失败', {
                                error: notifyErr.message,
                                commentId: comment.id,
                                mentionedUserId,
                            });
                        }
                        // Emit a realtime WebSocket message so the mentioned user sees it immediately.
                        websocketService_1.WebSocketService.emitMentionNotification(mentionedUser.id, {
                            commentId: comment.id,
                            username: getDisplayName(comment.users),
                            entityType: input.entityType,
                            entityId: input.entityId,
                            userId: input.userId,
                            author: {
                                id: comment.users.id,
                                username: comment.users.username,
                                realName: comment.users.realName,
                                displayName: getDisplayName(comment.users),
                            },
                            content: comment.content,
                            mentions: mentionPayloads,
                            mentionNames: mentionPayloads.map((m) => m.displayName),
                            createdAt: comment.createdAt.toISOString(),
                        });
                    }
                }
            }
            websocketService_1.WebSocketService.emitCommentNotification({
                commentId: comment.id,
                username: getDisplayName(comment.users),
                entityType: input.entityType,
                entityId: input.entityId,
                userId: input.userId,
                author: {
                    id: comment.users.id,
                    username: comment.users.username,
                    realName: comment.users.realName,
                    displayName: getDisplayName(comment.users),
                },
                content: comment.content,
                mentions: mentionPayloads,
                mentionNames: mentionPayloads.map((m) => m.displayName),
                createdAt: comment.createdAt.toISOString(),
            });
            if (parentComment && parentComment.userId !== input.userId) {
                try {
                    // Notify the original author that someone replied to their comment.
                    await notificationService_1.NotificationService.createNotification({
                        type: client_1.NotificationType.COMMENT_REPLY,
                        title: `${getDisplayName(comment.users)} 回复了你的评论`,
                        content: comment.content,
                        recipientId: parentComment.userId,
                        senderId: input.userId,
                        relatedType: input.entityType,
                        relatedId: input.entityId,
                        metadata: {
                            commentId: comment.id,
                            parentCommentId: parentComment.id,
                            entityType: input.entityType,
                            entityId: input.entityId,
                        },
                    });
                }
                catch (notifyErr) {
                    logger_1.logger.warn('创建评论回复通知失败', {
                        error: notifyErr.message,
                        commentId: comment.id,
                        parentCommentId: parentComment.id,
                    });
                }
            }
            const hydratedComment = await prisma.comments.findUnique({
                where: { id: comment.id },
                include: COMMENT_RELATION_INCLUDE,
            });
            return hydratedComment ? this.formatComment(hydratedComment) : this.formatComment(comment);
        }
        catch (error) {
            logger_1.logger.error('创建评论失败', { error: error.message });
            throw error;
        }
    }
    static async getComments(entityType, entityId, options = {}) {
        const { page = 1, limit = 50, includeReplies = true } = options;
        const skip = (page - 1) * limit;
        try {
            logger_1.logger.info('查询评论列表', { entityType, entityId, page, limit });
            const comments = await prisma.comments.findMany({
                where: {
                    entityType,
                    entityId,
                    parentId: null,
                    isDeleted: false,
                },
                include: includeReplies
                    ? COMMENT_RELATION_INCLUDE
                    : { ...COMMENT_RELATION_INCLUDE, other_comments: false },
                orderBy: { createdAt: 'asc' },
                skip,
                take: limit,
            });
            const total = await prisma.comments.count({
                where: {
                    entityType,
                    entityId,
                    parentId: null,
                    isDeleted: false,
                },
            });
            return {
                comments: comments.map((comment) => this.formatComment(comment)),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        catch (error) {
            logger_1.logger.error('查询评论列表失败', { error: error.message });
            throw error;
        }
    }
    static async updateComment(input) {
        try {
            const { commentId, content, userId, mentionedUserIds } = input;
            logger_1.logger.info('更新评论', { commentId, userId });
            const existing = await prisma.comments.findUnique({
                where: { id: commentId },
            });
            if (!existing) {
                throw new Error(`评论不存在: ${commentId}`);
            }
            if (existing.userId !== userId) {
                throw new Error('无权修改他人的评论');
            }
            if (existing.isDeleted) {
                throw new Error('评论已删除，无法修改');
            }
            await prisma.comments.update({
                where: { id: commentId },
                data: {
                    content,
                    images: input.images && input.images.length > 0 ? JSON.stringify(input.images) : null,
                    isEdited: true,
                },
            });
            if (mentionedUserIds) {
                await prisma.comment_mentions.deleteMany({ where: { commentId } });
                const validMentionIds = await this.validateUsers(mentionedUserIds);
                for (const mentionedUserId of validMentionIds) {
                    await prisma.comment_mentions.create({
                        data: {
                            commentId,
                            userId: mentionedUserId,
                        },
                    });
                }
            }
            const hydratedComment = await prisma.comments.findUnique({
                where: { id: commentId },
                include: COMMENT_RELATION_INCLUDE,
            });
            logger_1.logger.info('评论更新成功', { commentId });
            return hydratedComment ? this.formatComment(hydratedComment) : null;
        }
        catch (error) {
            logger_1.logger.error('更新评论失败', { error: error.message });
            throw error;
        }
    }
    static async deleteComment(commentId, userId) {
        try {
            logger_1.logger.info('删除评论', { commentId, userId });
            const existing = await prisma.comments.findUnique({
                where: { id: commentId },
            });
            if (!existing) {
                throw new Error(`评论不存在: ${commentId}`);
            }
            if (existing.userId !== userId) {
                throw new Error('无权删除他人的评论');
            }
            const deleted = await prisma.comments.update({
                where: { id: commentId },
                data: { isDeleted: true },
            });
            logger_1.logger.info('评论删除成功', { commentId });
            return deleted;
        }
        catch (error) {
            logger_1.logger.error('删除评论失败', { error: error.message });
            throw error;
        }
    }
    static async getMentionedComments(userId, options = {}) {
        const { page = 1, limit = 20 } = options;
        const skip = (page - 1) * limit;
        try {
            logger_1.logger.info('查询被@提及的评论', { userId, page, limit });
            const mentions = await prisma.comment_mentions.findMany({
                where: {
                    userId,
                    comments: { isDeleted: false },
                },
                include: {
                    comments: {
                        include: { ...COMMENT_RELATION_INCLUDE, other_comments: false },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            });
            const total = await prisma.comment_mentions.count({
                where: {
                    userId,
                    comments: { isDeleted: false },
                },
            });
            return {
                mentions: mentions.map((mention) => this.formatComment(mention.comments)),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        catch (error) {
            logger_1.logger.error('查询被@提及的评论失败', { error: error.message });
            throw error;
        }
    }
    static formatComment(comment) {
        const author = comment.users || null;
        const displayName = getDisplayName(author);
        const avatarInitials = getInitials(displayName);
        // 解析图片JSON
        let images = [];
        if (comment.images) {
            try {
                images = JSON.parse(comment.images);
            }
            catch (e) {
                images = [];
            }
        }
        const mentions = comment.comment_mentions?.map((mention) => ({
            id: mention.userId ?? mention.users?.id ?? null,
            user: mention.users
                ? {
                    id: mention.users.id,
                    username: mention.users.username,
                    realName: mention.users.realName,
                    displayName: getDisplayName(mention.users),
                    avatarInitials: getInitials(getDisplayName(mention.users)),
                }
                : null,
        })) ?? [];
        // 扁平化处理回复（所有回复在同一层级，用@区分）
        const replies = comment.other_comments?.map((reply) => this.formatComment(reply)) ?? [];
        // 如果有父评论，获取父评论的用户信息（用于@显示）
        const replyTo = comment.comments ? {
            id: comment.comments.id,
            userId: comment.comments.userId,
            user: comment.comments.users,
            displayName: getDisplayName(comment.comments.users),
        } : null;
        return {
            id: comment.id,
            content: comment.content,
            images, // 图片数组
            entityType: comment.entityType,
            entityId: comment.entityId,
            userId: comment.userId,
            parentId: comment.parentId,
            isDeleted: comment.isDeleted,
            isEdited: comment.isEdited,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            users: author,
            author,
            displayName,
            avatarInitials,
            mentions,
            comment_mentions: comment.comment_mentions ?? [],
            replies,
            children: replies,
            replyCount: replies.length,
            replyTo, // 回复的目标用户
        };
    }
    static async validateEntity(entityType, entityId) {
        if (entityType === 'project') {
            const project = await prisma.projects.findUnique({
                where: { id: entityId },
            });
            if (!project) {
                throw new Error(`Project不存在: ${entityId}`);
            }
        }
        else {
            const task = await prisma.tasks.findUnique({
                where: { id: entityId },
            });
            if (!task) {
                throw new Error(`Task不存在: ${entityId}`);
            }
        }
    }
    static async validateUsers(userIds) {
        const users = await prisma.users.findMany({
            where: {
                id: { in: userIds },
            },
            select: { id: true },
        });
        return users.map((user) => user.id);
    }
}
exports.CommentService = CommentService;
//# sourceMappingURL=commentService.js.map