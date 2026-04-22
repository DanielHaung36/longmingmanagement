import { Request, Response } from "express";
/**
 * 创建项目 DTO
 */
export interface CreateProjectDTO {
    name: string;
    description?: string;
    jobType?: "AT" | "AC" | "AQ" | "AS" | "AP";
    clientCompany: string;
    mineSiteName: string;
    ownerId?: number;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    status?: "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
    teamId?: number;
    teamMembers?: number[];
    autoApproveFromTask?: boolean;
}
/**
 * 创建项目
 * - 状态：DRAFT
 * - 项目编号：临时编号 TEMP-{timestamp}-{counter}
 * - 文件夹：不创建（等待审批）
 */
export declare const createProject: (req: Request, res: Response) => Promise<void>;
/**
 * 提交项目审批
 * - DRAFT → PENDING
 */
export declare const submitProjectForApproval: (req: Request, res: Response) => Promise<void>;
/**
 * 审批项目
 * - 审批通过：创建 2层文件夹结构（clientCompany + mineSiteName）
 * - 审批拒绝：不创建文件夹
 */
export declare const approveProject: (req: Request, res: Response) => Promise<void>;
/**
 * 撤回项目审批
 * - PENDING → DRAFT
 */
export declare const withdrawProjectApproval: (req: Request, res: Response) => Promise<void>;
/**
 * 获取待审批项目列表（支持分页）
 */
export declare const getPendingProjects: (req: Request, res: Response) => Promise<void>;
/**
 * 获取待审批项目列表（支持分页）
 */
export declare const getDraftProjects: (req: Request, res: Response) => Promise<void>;
/**
 * 获取当前用户的草稿项目列表（支持分页）
 */
export declare const getMyDraftProjects: (req: Request, res: Response) => Promise<void>;
/**
 * 获取所有项目（支持过滤和分页）
 */
export declare const getAllProjects: (req: Request, res: Response) => Promise<void>;
/**
 * 获取所有唯一的 Client Companies（高效查询，用于下拉选项）
 */
export declare const getClientCompanies: (req: Request, res: Response) => Promise<void>;
/**
 * 获取单个项目详情
 */
export declare const getProjectById: (req: Request, res: Response) => Promise<void>;
/**
 * 更新项目
 */
export declare const updateProject: (req: Request, res: Response) => Promise<void>;
/**
 * 请求删除项目
 * - 将项目标记为 DELETE_PENDING 状态
 * - 记录删除请求信息
 * - 需要审批后才能真正删除
 */
export declare const requestProjectDeletion: (req: Request, res: Response) => Promise<void>;
export declare const deleteProject: (req: Request, res: Response) => Promise<void>;
/**
 * 撤回项目删除请求
 * - 将项目从 DELETE_PENDING 恢复为之前的审批状态
 */
export declare const withdrawProjectDeletion: (req: Request, res: Response) => Promise<void>;
/**
 * 审批项目删除请求
 * - approved=true: 删除项目（包括文件夹和数据库记录）
 * - approved=false: 拒绝删除，恢复原状态
 */
export declare const approveProjectDeletion: (req: Request, res: Response) => Promise<void>;
/**
 * 获取待删除审批的项目列表
 * GET /api/projects/pending-delete
 */
export declare const getPendingDeleteProjects: (req: Request, res: Response) => Promise<void>;
/**
 * 批量审批项目
 */
export declare const batchApproveProjects: (req: Request, res: Response) => Promise<void>;
/**
 * 搜索项目（模糊搜索）
 * GET /api/projects/search?q=关键词&limit=10
 */
export declare const searchProjects: (req: Request, res: Response) => Promise<void>;
/**
 * 导出任务数据为Excel文件（使用 TaskExcelSyncService）
 * GET /api/projects/export
 */
export declare const exportProjectsToExcel: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=projectController.d.ts.map