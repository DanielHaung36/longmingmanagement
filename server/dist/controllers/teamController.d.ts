/**
 * Team Controller - Teams 管理控制器
 */
import { Request, Response } from 'express';
/**
 * 创建 Team DTO
 */
export interface CreateTeamDTO {
    name: string;
    description?: string;
    managerId?: number;
    isActive?: boolean;
}
/**
 * 创建 Team
 * POST /api/teams
 */
export declare const createTeam: (req: Request, res: Response) => Promise<void>;
/**
 * 获取所有 Teams（支持分页和过滤）
 * GET /api/teams?page=1&pageSize=10&isActive=true
 */
export declare const getAllTeams: (req: Request, res: Response) => Promise<void>;
/**
 * 获取单个 Team 详情
 * GET /api/teams/:id
 */
export declare const getTeamById: (req: Request, res: Response) => Promise<void>;
/**
 * 更新 Team
 * PUT /api/teams/:id
 */
export declare const updateTeam: (req: Request, res: Response) => Promise<void>;
/**
 * 删除 Team
 * DELETE /api/teams/:id
 */
export declare const deleteTeam: (req: Request, res: Response) => Promise<void>;
/**
 * 搜索 Teams（模糊搜索）
 * GET /api/teams/search?q=关键词&limit=10
 */
export declare const searchTeams: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=teamController.d.ts.map