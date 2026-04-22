export interface ActivityLog {
    id: number;
    tableName: string;
    recordId: number;
    action: string;
    changes?: any;
    userId?: number;
    user?: {
        id: number;
        username: string;
        realName?: string;
        email: string;
    };
    createdAt: Date;
}
export declare class ActivityService {
    /**
     * Get recent activity logs
     * @param limit Number of activities to fetch
     * @returns Array of activity logs
     */
    static getRecentActivities(limit?: number): Promise<ActivityLog[]>;
    /**
     * Get activities for a specific user
     * @param userId User ID
     * @param limit Number of activities to fetch
     */
    static getUserActivities(userId: number, limit?: number): Promise<ActivityLog[]>;
    /**
     * Log an activity
     * @param data Activity data
     */
    static logActivity(data: {
        tableName: string;
        recordId: number;
        action: string;
        changes?: any;
        userId?: number;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<{
        id: number;
        createdAt: Date;
        userId: number | null;
        ipAddress: string | null;
        userAgent: string | null;
        tableName: string;
        recordId: number;
        action: string;
        changes: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
//# sourceMappingURL=activityService.d.ts.map