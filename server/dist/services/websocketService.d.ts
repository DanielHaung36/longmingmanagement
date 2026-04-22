/**
 * WebSocket Service - 实时通知和进度追踪
 */
import { Server as HttpServer } from 'http';
export interface UploadProgress {
    fileId: string;
    fileName: string;
    taskId: number;
    progress: number;
    speed?: number;
    remainingTime?: number;
    status: 'uploading' | 'completed' | 'error';
    error?: string;
}
export interface CommentNotification {
    commentId: number;
    entityType: 'project' | 'task';
    entityId: number;
    userId: number;
    username: string;
    author: {
        id: number;
        username: string | null;
        realName: string | null;
        displayName: string;
    };
    content: string;
    mentions: {
        id: number;
        username: string | null;
        realName: string | null;
        displayName: string;
    }[];
    mentionNames?: string[];
    createdAt: string;
}
export declare class WebSocketService {
    private static io;
    private static connectedUsers;
    /**
     * 初始化WebSocket服务器
     */
    static initialize(httpServer: HttpServer): void;
    /**
     * 发送文件上传进度
     */
    static emitUploadProgress(userId: number, progress: UploadProgress): void;
    /**
     * 发送评论通知
     */
    static emitCommentNotification(notification: CommentNotification): void;
    /**
     * 发送@提及通知给特定用户
     */
    static emitMentionNotification(userId: number, notification: CommentNotification): void;
    /**
     * 发送任务状态变更通知
     */
    static emitTaskStatusChange(taskId: number, data: {
        status: string;
        progress?: number;
        userId: number;
        username: string;
    }): void;
    /**
     * 发送文件删除通知
     */
    static emitFileDeleted(taskId: number, fileId: number, fileName: string): void;
    /**
     * 发送任务审批状态变更通知 (发送给所有审批者)
     */
    static emitTaskApprovalChange(data: {
        taskId: number;
        taskCode: string;
        title: string;
        approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
        approvedBy?: number;
        comment?: string;
    }): void;
    /**
     * 发送项目审批状态变更通知
     */
    static emitProjectApprovalChange(data: {
        projectId: number;
        projectCode: string;
        name: string;
        approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
        approvedBy?: number;
        comment?: string;
    }): void;
    /**
     * 发送任务删除审批通知
     */
    static emitTaskDeletionApproval(data: {
        taskId: number;
        taskCode: string;
        approved: boolean;
        approvedBy: number;
    }): void;
    /**
     * 发送项目删除审批通知
     */
    static emitProjectDeletionApproval(data: {
        projectId: number;
        projectCode: string;
        approved: boolean;
        approvedBy: number;
    }): void;
    /**
     * 发送新任务创建通知
     */
    static emitTaskCreated(data: {
        taskId: number;
        taskCode: string;
        title: string;
        approvalStatus: string;
        createdBy: number;
    }): void;
    /**
     * 发送新项目创建通知
     */
    static emitProjectCreated(data: {
        projectId: number;
        projectCode: string;
        name: string;
        approvalStatus: string;
        createdBy: number;
    }): void;
    /**
     * 获取在线用户数
     */
    static getOnlineUsersCount(): number;
    /**
     * 检查用户是否在线
     */
    static isUserOnline(userId: number): boolean;
    /**
     * 获取用户的Socket连接数
     */
    static getUserSocketCount(userId: number): number;
}
//# sourceMappingURL=websocketService.d.ts.map