import type { Request } from 'express';
export declare function logActivitySafe(req: Request, params: {
    tableName: string;
    recordId: number;
    action: string;
    changes?: any;
}): Promise<void>;
//# sourceMappingURL=activityLogger.d.ts.map