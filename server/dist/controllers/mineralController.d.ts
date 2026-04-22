import { Request, Response } from "express";
/**
 * Get all unique mineral types from the database
 * Used for autocomplete/suggestions
 */
export declare const getAllMinerals: (req: Request, res: Response) => Promise<void>;
/**
 * Get mineral statistics
 */
export declare const getMineralStats: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=mineralController.d.ts.map