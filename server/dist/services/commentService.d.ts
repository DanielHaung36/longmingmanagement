export interface CreateCommentInput {
    content: string;
    images?: string[];
    entityType: 'project' | 'task';
    entityId: number;
    userId: number;
    parentId?: number;
    mentionedUserIds?: number[];
}
export interface UpdateCommentInput {
    commentId: number;
    content: string;
    images?: string[];
    userId: number;
    mentionedUserIds?: number[];
}
export declare class CommentService {
    static createComment(input: CreateCommentInput): Promise<any>;
    static getComments(entityType: 'project' | 'task', entityId: number, options?: {
        page?: number;
        limit?: number;
        includeReplies?: boolean;
    }): Promise<any>;
    static updateComment(input: UpdateCommentInput): Promise<any>;
    static deleteComment(commentId: number, userId: number): Promise<any>;
    static getMentionedComments(userId: number, options?: {
        page?: number;
        limit?: number;
    }): Promise<any>;
    private static formatComment;
    private static validateEntity;
    private static validateUsers;
}
//# sourceMappingURL=commentService.d.ts.map