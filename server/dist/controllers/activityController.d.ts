import { Request, Response } from 'express';
/**
 * Get recent activities
 * GET /api/activities/recent
 */
export declare const getRecentActivities: (req: Request, res: Response) => Promise<void>;
/**
 * Get activities for a specific user
 * GET /api/activities/user/:userId
 */
export declare const getUserActivities: (req: Request, res: Response) => Promise<void>;
/**
 * Log a new activity
 * POST /api/activities
 */
export declare const logActivity: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=activityController.d.ts.map