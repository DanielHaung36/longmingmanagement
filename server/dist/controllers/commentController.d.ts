/**
 * CommentController - 评论API控制器
 */
import { Request, Response } from 'express';
export declare class CommentController {
    /**
     * POST /api/comments
     * 创建评论
     */
    static createComment(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/comments/:entityType/:entityId
     * 获取评论列表
     */
    static getComments(req: Request, res: Response): Promise<void>;
    /**
     * PATCH /api/comments/:commentId
     * 更新评论
     */
    static updateComment(req: Request, res: Response): Promise<void>;
    /**
     * DELETE /api/comments/:commentId
     * 删除评论
     */
    static deleteComment(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/comments/mentions
     * 获取用户被@提及的评论
     */
    static getMentionedComments(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=commentController.d.ts.map