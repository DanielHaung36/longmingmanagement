"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportProjectsToExcel = exports.searchProjects = exports.batchApproveProjects = exports.getPendingDeleteProjects = exports.approveProjectDeletion = exports.withdrawProjectDeletion = exports.deleteProject = exports.requestProjectDeletion = exports.updateProject = exports.getProjectById = exports.getClientCompanies = exports.getAllProjects = exports.getMyDraftProjects = exports.getDraftProjects = exports.getPendingProjects = exports.withdrawProjectApproval = exports.approveProject = exports.submitProjectForApproval = exports.createProject = void 0;
const client_1 = require("@prisma/client");
const projectFolderService_1 = require("../services/projectFolderService");
const projectNumberService_1 = require("../services/projectNumberService");
const logger_1 = require("../utils/logger");
const approvalService_1 = require("../services/approvalService");
const websocketService_1 = require("../services/websocketService");
const auditService_1 = require("../services/auditService");
const prisma = new client_1.PrismaClient();
/**
 * 创建项目
 * - 状态：DRAFT
 * - 项目编号：临时编号 TEMP-{timestamp}-{counter}
 * - 文件夹：不创建（等待审批）
 */
const createProject = async (req, res) => {
    try {
        const data = req.body;
        const userId = req.user?.id || 47; // ✅ 修复：开发模式使用实际存在的 admin 用户ID (47)
        // 验证必填字段（jobType 已改为可选，实际在 Task 级别定义）
        if (!data.name || !data.clientCompany || !data.mineSiteName) {
            res.status(400).json({
                success: false,
                message: "缺少必填字段: name, clientCompany, mineSiteName",
            });
            return;
        }
        // ✅ 检查 clientCompany + mineSiteName 组合是否已存在
        const existingProject = await prisma.projects.findFirst({
            where: {
                clientCompany: data.clientCompany,
                mineSiteName: data.mineSiteName,
                approvalStatus: {
                    not: "REJECTED", // 排除已拒绝的项目
                },
            },
        });
        if (existingProject) {
            res.status(409).json({
                success: false,
                message: `该客户公司（${data.clientCompany}）和矿区（${data.mineSiteName}）的项目组合已存在`,
                data: {
                    existingProjectId: existingProject.id,
                    existingProjectCode: existingProject.projectCode,
                    existingProjectName: existingProject.name,
                    approvalStatus: existingProject.approvalStatus,
                    clientCompany: existingProject.clientCompany,
                    mineSiteName: existingProject.mineSiteName,
                },
            });
            return;
        }
        // ✅ 生成项目编号：如果提供了 jobType，生成正式编号；否则生成临时编号
        let projectCode;
        if (data.jobType) {
            // 使用 ProjectNumberService 生成正式编号（格式：2025-AT-XXX-001）
            projectCode = await projectNumberService_1.ProjectNumberService.generateProjectNumber(data.mineSiteName);
            console.log(`✅ 生成正式项目编号: ${projectCode} (jobType: ${data.jobType}, mineSite: ${data.mineSiteName})`);
        }
        else {
            // 生成临时编号（格式：TEMP-timestamp-counter）
            const tempCounter = await prisma.projects.count();
            projectCode = `TEMP-${Date.now()}-${tempCounter}`;
            console.log(`⚠️ 生成临时项目编号: ${projectCode} (未提供 jobType)`);
        }
        // 创建项目（DRAFT 状态）
        const existingMineSite = await prisma.mine_zones.findFirst({
            where: {
                name: data.mineSiteName,
            },
        });
        let mineSiteId;
        if (existingMineSite) {
            mineSiteId = existingMineSite.id;
            console.log(`✅ 已找到矿区: ${data.mineSiteName} (ID: ${mineSiteId})`);
        }
        else {
            const newMineSite = await prisma.mine_zones.create({
                data: {
                    name: data.mineSiteName,
                    code: `ZONE-${Date.now()}`, // 自动生成唯一 code
                },
            });
            mineSiteId = newMineSite.id;
            console.log(`🆕 新建矿区: ${data.mineSiteName} (ID: ${mineSiteId})`);
        }
        // 创建项目（DRAFT 状态）
        let project = await prisma.projects.create({
            data: {
                name: data.name,
                description: data.description || "",
                // jobType 已删除 - jobType 只在 task 级别定义
                clientCompany: data.clientCompany,
                mineSiteName: data.mineSiteName,
                mineZoneId: mineSiteId,
                projectCode,
                priority: data.priority || "LOW",
                status: data.status || "PLANNING",
                approvalStatus: "DRAFT",
                syncStatus: "NOT_SYNCED",
                ownerId: data.ownerId || userId, // ✅ 修复：使用前端传来的 ownerId，如果没有则使用当前用户
                teamId: data.teamId, // 可选：主团队ID
            },
        });
        // ✅ 保存团队成员到 project_members 表
        if (data.teamMembers && data.teamMembers.length > 0) {
            await prisma.project_members.createMany({
                data: data.teamMembers.map((memberId) => ({
                    projectId: project.id,
                    userId: memberId,
                    role: memberId === project.ownerId ? "OWNER" : "MEMBER", // Owner 角色，其他是 MEMBER
                })),
                skipDuplicates: true, // 跳过重复的成员
            });
            console.log("✅ 项目团队成员添加成功:", {
                projectId: project.id,
                memberCount: data.teamMembers.length,
                members: data.teamMembers,
            });
        }
        // ✅ 如果是 Task 自动创建的项目，直接自动审批
        if (data.autoApproveFromTask) {
            try {
                await prisma.projects.update({
                    where: { id: project.id },
                    data: { approvalStatus: "PENDING" },
                });
                project = await approvalService_1.ApprovalService.approveProject(project.id, userId, true, "Auto-approved via task creation");
                console.log("✅ 自动审批成功（Task 创建）:", {
                    id: project.id,
                    status: project.approvalStatus,
                });
            }
            catch (autoError) {
                await prisma.projects.update({
                    where: { id: project.id },
                    data: { approvalStatus: "DRAFT" },
                });
                logger_1.logger.error("❌ Task 自动审批失败", {
                    projectId: project.id,
                    error: autoError.message,
                });
                throw new Error(`自动审批失败: ${autoError.message}`);
            }
        }
        console.log("✅ 项目创建成功:", {
            id: project.id,
            projectCode: project.projectCode,
            approvalStatus: project.approvalStatus,
            teamMembers: data.teamMembers?.length || 0,
        });
        res.status(201).json({
            success: true,
            message: "项目创建成功",
            data: project,
        });
    }
    catch (error) {
        console.error("❌ 创建项目失败:", error);
        res.status(500).json({
            success: false,
            message: `创建项目失败: ${error.message}`,
        });
    }
};
exports.createProject = createProject;
/**
 * 提交项目审批
 * - DRAFT → PENDING
 */
const submitProjectForApproval = async (req, res) => {
    try {
        const { id } = req.params;
        const projectId = parseInt(id);
        const autoApprove = req.query.autoApprove === "true"; // ✅ 可选参数
        const project = await prisma.projects.findUnique({
            where: { id: projectId },
        });
        if (!project) {
            res.status(404).json({
                success: false,
                message: "项目不存在",
            });
            return;
        }
        if (project.approvalStatus !== "DRAFT") {
            res.status(400).json({
                success: false,
                message: `项目状态必须为 DRAFT，当前状态：${project.approvalStatus}`,
            });
            return;
        }
        // 更新为 PENDING
        const updatedProject = await prisma.projects.update({
            where: { id: projectId },
            data: {
                approvalStatus: "PENDING",
            },
        });
        console.log("✅ 项目已提交审批:", {
            id: updatedProject.id,
            approvalStatus: updatedProject.approvalStatus,
        });
        // 🔌 提交审批后发送 WebSocket 通知（状态变为 PENDING）
        if (updatedProject.approvalStatus === 'PENDING') {
            websocketService_1.WebSocketService.emitProjectCreated({
                projectId: updatedProject.id,
                projectCode: updatedProject.projectCode,
                name: updatedProject.name,
                approvalStatus: updatedProject.approvalStatus,
                createdBy: updatedProject.ownerId || 0,
            });
        }
        // 📝 记录审计日志
        const userId = req.user?.id;
        await auditService_1.AuditService.logProjectApprovalSubmit(updatedProject.id, updatedProject.name, userId, req.ip, req.headers["user-agent"]);
        // Step 2: 是否自动审批？
        if (autoApprove) {
            const userId = req.user?.id;
            const approvedProject = await approvalService_1.ApprovalService.approveProject(projectId, userId, true, "Auto-Generated Project by Task");
            const updatedProject = await prisma.projects.update({
                where: { id: approvedProject.id },
                data: {
                    approvalStatus: "APPROVED",
                },
            });
            res.json({
                success: true,
                message: "项目已自动审批",
                data: updatedProject,
            });
            return;
        }
        // 如果不自动审批，仅标记为 PENDING
        res.json({
            success: true,
            message: "项目已提交审批",
            data: updatedProject,
        });
    }
    catch (error) {
        console.error("❌ 提交审批失败:", error);
        res.status(500).json({
            success: false,
            message: `提交审批失败: ${error.message}`,
        });
    }
};
exports.submitProjectForApproval = submitProjectForApproval;
/**
 * 审批项目
 * - 审批通过：创建 2层文件夹结构（clientCompany + mineSiteName）
 * - 审批拒绝：不创建文件夹
 */
const approveProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { approved, comment } = req.body;
        const approverId = req.user?.id || 11;
        const projectId = parseInt(id);
        const project = await prisma.projects.findUnique({
            where: { id: projectId },
        });
        if (!project) {
            res.status(404).json({
                success: false,
                message: "项目不存在",
            });
            return;
        }
        if (project.approvalStatus !== "PENDING") {
            res.status(400).json({
                success: false,
                message: `项目状态必须为 PENDING，当前状态：${project.approvalStatus}`,
            });
            return;
        }
        // ✅ 检查审批权限：不能审批自己创建的项目
        // if (project.ownerId === approverId) {
        //   res.status(403).json({
        //     success: false,
        //     message: "不能审批自己创建的项目，请联系其他审批人",
        //   });
        //   return;
        // }
        if (approved) {
            // 审批通过：创建文件夹
            console.log("📁 开始创建项目文件夹...");
            const folderResult = await projectFolderService_1.projectFolderService.createProjectFolders({
                clientCompany: project.clientCompany,
                mineSiteName: project.mineSiteName,
            });
            // 更新项目状态
            const updatedProject = await prisma.projects.update({
                where: { id: projectId },
                data: {
                    approvalStatus: "APPROVED",
                    approvedBy: approverId,
                    approvedAt: new Date(),
                    clientFolderPath: folderResult.clientFolderPath,
                    mineSiteFolderPath: folderResult.mineSiteFolderPath,
                    oneDriveClientFolderPath: folderResult.oneDriveClientFolderPath, // ✅ 保存 OneDrive 路径
                    oneDriveMineSiteFolderPath: folderResult.oneDriveMineSiteFolderPath, // ✅ 保存 OneDrive 路径
                    rejectionReason: null,
                    syncStatus: "SYNCED",
                },
            });
            console.log("✅ 项目审批通过，文件夹已创建:", {
                id: updatedProject.id,
                clientFolderPath: updatedProject.clientFolderPath,
                mineSiteFolderPath: updatedProject.mineSiteFolderPath,
            });
            // 🔌 发送 WebSocket 项目审批通知
            websocketService_1.WebSocketService.emitProjectApprovalChange({
                projectId: updatedProject.id,
                projectCode: updatedProject.projectCode,
                name: updatedProject.name,
                approvalStatus: 'APPROVED',
                approvedBy: approverId,
                comment: comment,
            });
            // 📝 记录审计日志
            await auditService_1.AuditService.logProjectApprovalDecision(updatedProject.id, updatedProject.name, true, comment, approverId, req.ip, req.headers["user-agent"]);
            res.json({
                success: true,
                message: "项目审批通过",
                data: updatedProject,
            });
        }
        else {
            // 审批拒绝
            const updatedProject = await prisma.projects.update({
                where: { id: projectId },
                data: {
                    approvalStatus: "REJECTED",
                    approvedBy: approverId,
                    approvedAt: new Date(),
                    rejectionReason: comment || "审批拒绝",
                },
            });
            console.log("❌ 项目审批拒绝:", {
                id: updatedProject.id,
                rejectionReason: updatedProject.rejectionReason,
            });
            // 🔌 发送 WebSocket 项目审批拒绝通知
            websocketService_1.WebSocketService.emitProjectApprovalChange({
                projectId: updatedProject.id,
                projectCode: updatedProject.projectCode,
                name: updatedProject.name,
                approvalStatus: 'REJECTED',
                approvedBy: approverId,
                comment: comment,
            });
            // 📝 记录审计日志
            await auditService_1.AuditService.logProjectApprovalDecision(updatedProject.id, updatedProject.name, false, comment, approverId, req.ip, req.headers["user-agent"]);
            res.json({
                success: true,
                message: "项目审批拒绝",
                data: updatedProject,
            });
        }
    }
    catch (error) {
        console.error("❌ 审批项目失败:", error);
        res.status(500).json({
            success: false,
            message: `审批失败: ${error.message}`,
        });
    }
};
exports.approveProject = approveProject;
/**
 * 撤回项目审批
 * - PENDING → DRAFT
 */
const withdrawProjectApproval = async (req, res) => {
    try {
        const { id } = req.params;
        const projectId = parseInt(id);
        const project = await prisma.projects.findUnique({
            where: { id: projectId },
        });
        if (!project) {
            res.status(404).json({
                success: false,
                message: "项目不存在",
            });
            return;
        }
        if (project.approvalStatus !== "PENDING") {
            res.status(400).json({
                success: false,
                message: `只能撤回PENDING状态的项目，当前状态：${project.approvalStatus}`,
            });
            return;
        }
        const updatedProject = await prisma.projects.update({
            where: { id: projectId },
            data: {
                approvalStatus: "DRAFT",
            },
        });
        console.log("✅ 项目审批已撤回:", { id: updatedProject.id });
        res.json({
            success: true,
            message: "项目审批已撤回",
            data: updatedProject,
        });
    }
    catch (error) {
        console.error("❌ 撤回审批失败:", error);
        res.status(500).json({
            success: false,
            message: `撤回失败: ${error.message}`,
        });
    }
};
exports.withdrawProjectApproval = withdrawProjectApproval;
/**
 * 获取待审批项目列表（支持分页）
 */
const getPendingProjects = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const skip = (page - 1) * pageSize;
        const [projects, total] = await Promise.all([
            prisma.projects.findMany({
                where: {
                    approvalStatus: "PENDING",
                },
                include: {
                    users: {
                        select: {
                            id: true,
                            username: true,
                            realName: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
                skip,
                take: pageSize,
            }),
            prisma.projects.count({
                where: {
                    approvalStatus: "PENDING",
                },
            }),
        ]);
        // ✅ 修复：将 users 字段映射为 owner，与前端类型一致
        const projectsWithOwner = projects.map((project) => ({
            ...project,
            owner: project.users,
        }));
        res.json({
            success: true,
            message: "待审批项目列表查询成功",
            data: {
                projects: projectsWithOwner,
                pagination: {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize),
                },
            },
        });
    }
    catch (error) {
        console.error("❌ 查询待审批项目失败:", error);
        res.status(500).json({
            success: false,
            message: `查询失败: ${error.message}`,
        });
    }
};
exports.getPendingProjects = getPendingProjects;
/**
 * 获取待审批项目列表（支持分页）
 */
const getDraftProjects = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const skip = (page - 1) * pageSize;
        const [projects, total] = await Promise.all([
            prisma.projects.findMany({
                where: {
                    approvalStatus: "DRAFT",
                },
                include: {
                    users: {
                        select: {
                            id: true,
                            username: true,
                            realName: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
                skip,
                take: pageSize,
            }),
            prisma.projects.count({
                where: {
                    approvalStatus: "DRAFT", // ✅ 修复：应该是 DRAFT 而不是 PENDING
                },
            }),
        ]);
        // ✅ 修复：将 users 字段映射为 owner，与前端类型一致
        const projectsWithOwner = projects.map((project) => ({
            ...project,
            owner: project.users,
        }));
        res.json({
            success: true,
            message: "草稿项目列表查询成功",
            data: {
                projects: projectsWithOwner,
                pagination: {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize),
                },
            },
        });
    }
    catch (error) {
        console.error("❌ 查询待审批项目失败:", error);
        res.status(500).json({
            success: false,
            message: `查询失败: ${error.message}`,
        });
    }
};
exports.getDraftProjects = getDraftProjects;
/**
 * 获取当前用户的草稿项目列表（支持分页）
 */
const getMyDraftProjects = async (req, res) => {
    try {
        const userId = req.user?.id || 11; // 开发模式默认用户ID
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const skip = (page - 1) * pageSize;
        const [projects, total] = await Promise.all([
            prisma.projects.findMany({
                where: {
                    approvalStatus: "DRAFT",
                    ownerId: userId,
                },
                include: {
                    users: {
                        select: {
                            id: true,
                            username: true,
                            realName: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
                skip,
                take: pageSize,
            }),
            prisma.projects.count({
                where: {
                    approvalStatus: "DRAFT",
                    ownerId: userId,
                },
            }),
        ]);
        // ✅ 修复：将 users 字段映射为 owner，与前端类型一致
        const projectsWithOwner = projects.map((project) => ({
            ...project,
            owner: project.users,
        }));
        res.json({
            success: true,
            message: "我的草稿项目列表查询成功",
            data: {
                projects: projectsWithOwner,
                pagination: {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize),
                },
            },
        });
    }
    catch (error) {
        console.error("❌ 查询我的草稿项目失败:", error);
        res.status(500).json({
            success: false,
            message: `查询失败: ${error.message}`,
        });
    }
};
exports.getMyDraftProjects = getMyDraftProjects;
/**
 * 获取所有项目（支持过滤和分页）
 */
const getAllProjects = async (req, res) => {
    try {
        const { status, jobType, approvalStatus, ownerId, memberId } = req.query;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const skip = (page - 1) * pageSize;
        const where = {
            // Exclude template projects
            NOT: {
                OR: [
                    { name: { contains: "template", mode: "insensitive" } },
                    { projectCode: { contains: "template", mode: "insensitive" } },
                ],
            },
        };
        if (status)
            where.status = status;
        if (approvalStatus)
            where.approvalStatus = approvalStatus;
        if (ownerId)
            where.ownerId = parseInt(ownerId);
        if (memberId) {
            const parsedMemberId = parseInt(memberId);
            if (!Number.isNaN(parsedMemberId)) {
                where.project_members = {
                    some: { userId: parsedMemberId },
                };
            }
        }
        const [projects, total] = await Promise.all([
            prisma.projects.findMany({
                where,
                include: {
                    users: {
                        select: {
                            id: true,
                            username: true,
                            realName: true,
                            email: true,
                        },
                    },
                    tasks: {
                        select: {
                            id: true,
                            taskCode: true,
                            title: true,
                            status: true,
                            priority: true,
                            approvalStatus: true,
                        },
                    },
                    project_members: {
                        // ✅ 添加项目成员关系
                        select: {
                            userId: true,
                            role: true,
                            users: {
                                select: {
                                    id: true,
                                    username: true,
                                    realName: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
                skip,
                take: pageSize,
            }),
            prisma.projects.count({ where }),
        ]);
        // ✅ 修复：将 users 字段映射为 owner，与前端类型一致
        const projectsWithOwner = projects.map((project) => ({
            ...project,
            owner: project.users,
        }));
        res.json({
            success: true,
            message: "项目列表查询成功",
            data: {
                projects: projectsWithOwner,
                pagination: {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize),
                },
            },
        });
    }
    catch (error) {
        console.error("❌ 查询项目列表失败:", error);
        res.status(500).json({
            success: false,
            message: `查询失败: ${error.message}`,
        });
    }
};
exports.getAllProjects = getAllProjects;
/**
 * 获取所有唯一的 Client Companies（高效查询，用于下拉选项）
 */
const getClientCompanies = async (req, res) => {
    try {
        // 直接使用 distinct 查询，只获取唯一的 clientCompany 字段
        const companies = await prisma.projects.findMany({
            where: {
                approvalStatus: "APPROVED",
                clientCompany: { not: null },
            },
            select: { clientCompany: true },
            distinct: ["clientCompany"],
            orderBy: { clientCompany: "asc" },
        });
        const uniqueCompanies = companies
            .map((p) => p.clientCompany)
            .filter((c) => c !== null && c !== "");
        res.json({
            success: true,
            message: "Client companies 查询成功",
            data: uniqueCompanies,
        });
    }
    catch (error) {
        console.error("❌ 查询 client companies 失败:", error);
        res.status(500).json({
            success: false,
            message: `查询失败: ${error.message}`,
        });
    }
};
exports.getClientCompanies = getClientCompanies;
/**
 * 获取单个项目详情
 */
const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const projectId = parseInt(id);
        const project = await prisma.projects.findUnique({
            where: { id: projectId },
            include: {
                users: {
                    select: {
                        id: true,
                        username: true,
                        realName: true,
                        email: true,
                        status: true,
                    },
                },
                mine_zones: true,
                tasks: {
                    include: {
                        users_tasks_authorUserIdTousers: {
                            select: {
                                id: true,
                                username: true,
                                realName: true,
                            },
                        },
                        users_tasks_assignedUserIdTousers: {
                            select: {
                                id: true,
                                username: true,
                                realName: true,
                            },
                        },
                        task_files: {
                            select: {
                                id: true,
                                fileName: true,
                                fileType: true,
                                fileSize: true,
                                createdAt: true,
                            },
                            orderBy: {
                                createdAt: "desc",
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                },
            },
        });
        if (!project) {
            res.status(404).json({
                success: false,
                message: "项目不存在",
            });
            return;
        }
        // 手动查询评论
        const comments = await prisma.comments.findMany({
            where: {
                entityType: "project",
                entityId: projectId,
                isDeleted: false,
            },
            include: {
                users: {
                    select: {
                        id: true,
                        username: true,
                        realName: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        // ✅ 修复：将 users 字段映射为 owner，与前端类型一致
        const projectWithOwner = {
            ...project,
            owner: project.users,
            comments,
        };
        res.json({
            success: true,
            message: "项目详情查询成功",
            data: projectWithOwner,
        });
    }
    catch (error) {
        console.error("❌ 查询项目详情失败:", error);
        res.status(500).json({
            success: false,
            message: `查询失败: ${error.message}`,
        });
    }
};
exports.getProjectById = getProjectById;
/**
 * 更新项目
 */
const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const projectId = parseInt(id);
        // 获取旧项目数据
        const oldProject = await prisma.projects.findUnique({
            where: { id: projectId },
            include: { mine_zones: true }, // 方便查看旧矿区名
        });
        if (!oldProject) {
            res.status(404).json({
                success: false,
                message: "项目不存在",
            });
            return;
        }
        let mineZoneId = oldProject.mineZoneId;
        // 🧠 如果矿区名字被更新
        if (updateData.mineSiteName &&
            updateData.mineSiteName !== oldProject.mine_zones?.name) {
            const existingZone = await prisma.mine_zones.findFirst({
                where: { name: updateData.mineSiteName },
            });
            if (existingZone) {
                console.log(`✅ 已找到矿区: ${existingZone.name} (ID: ${existingZone.id})`);
                mineZoneId = existingZone.id;
            }
            else {
                const newZone = await prisma.mine_zones.create({
                    data: {
                        code: `ZONE-${Date.now()}`,
                        name: updateData.mineSiteName,
                        isActive: true,
                    },
                });
                console.log(`🆕 新建矿区: ${newZone.name} (ID: ${newZone.id})`);
                mineZoneId = newZone.id;
            }
        }
        // 更新项目
        const project = await prisma.projects.update({
            where: { id: projectId },
            data: {
                ...updateData,
                mineZoneId, // ✅ 更新关联矿区ID
            },
        });
        // 如果客户公司或矿区名称发生变化，需要重命名文件夹
        if (oldProject.clientFolderPath && oldProject.mineSiteFolderPath) {
            const needRename = (updateData.clientCompany &&
                updateData.clientCompany !== oldProject.clientCompany) ||
                (updateData.mineSiteName &&
                    updateData.mineSiteName !== oldProject.mineSiteName);
            if (needRename) {
                console.log("📁 项目信息变化，重命名文件夹...");
                const renameResult = await projectFolderService_1.projectFolderService.renameProjectFolders({
                    oldClientCompany: oldProject.clientCompany,
                    oldMineSiteName: oldProject.mineSiteName,
                    newClientCompany: project.clientCompany,
                    newMineSiteName: project.mineSiteName,
                });
                // 更新文件夹路径
                await prisma.projects.update({
                    where: { id: projectId },
                    data: {
                        clientFolderPath: renameResult.newClientFolderPath,
                        mineSiteFolderPath: renameResult.newMineSiteFolderPath,
                        syncStatus: renameResult.oneDriveSyncFailed
                            ? "NOT_SYNCED"
                            : "SYNCED",
                    },
                });
                console.log("✅ 文件夹重命名成功");
            }
        }
        // 重新查询最新数据
        const updatedProject = await prisma.projects.findUnique({
            where: { id: projectId },
        });
        res.json({
            success: true,
            message: "项目更新成功",
            data: updatedProject,
        });
    }
    catch (error) {
        console.error("❌ 更新项目失败:", error);
        res.status(500).json({
            success: false,
            message: `更新失败: ${error.message}`,
        });
    }
};
exports.updateProject = updateProject;
/**
 * 请求删除项目
 * - 将项目标记为 DELETE_PENDING 状态
 * - 记录删除请求信息
 * - 需要审批后才能真正删除
 */
const requestProjectDeletion = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body; // 删除原因
        const projectId = parseInt(id);
        const userId = req.user?.id || 11;
        const project = await prisma.projects.findUnique({
            where: { id: projectId },
            include: {
                tasks: true,
            },
        });
        if (!project) {
            res.status(404).json({
                success: false,
                message: "项目不存在",
            });
            return;
        }
        // 检查项目状态
        if (project.approvalStatus === "DELETE_PENDING") {
            res.status(400).json({
                success: false,
                message: "该项目已经提交删除申请，请等待审批",
            });
            return;
        }
        // 检查是否有关联的任务
        if (project.tasks.length > 0) {
            res.status(400).json({
                success: false,
                message: `无法删除项目，请先删除 ${project.tasks.length} 个关联任务`,
            });
            return;
        }
        // 标记为 DELETE_PENDING
        const updatedProject = await prisma.projects.update({
            where: { id: projectId },
            data: {
                approvalStatus: "DELETE_PENDING",
                deleteRequestedBy: userId,
                deleteRequestedAt: new Date(),
                deleteReason: reason || "请求删除项目",
            },
        });
        console.log("✅ 项目删除请求已提交:", {
            id: projectId,
            name: project.name,
            requestedBy: userId,
        });
        res.json({
            success: true,
            message: "项目删除请求已提交，等待审批",
            data: updatedProject,
        });
    }
    catch (error) {
        console.error("❌ 提交删除请求失败:", error);
        res.status(500).json({
            success: false,
            message: `提交删除请求失败: ${error.message}`,
        });
    }
};
exports.requestProjectDeletion = requestProjectDeletion;
// 保持向后兼容（DELETE /projects/:id 路由使用）
exports.deleteProject = exports.requestProjectDeletion;
/**
 * 撤回项目删除请求
 * - 将项目从 DELETE_PENDING 恢复为之前的审批状态
 */
const withdrawProjectDeletion = async (req, res) => {
    try {
        const { id } = req.params;
        const projectId = parseInt(id);
        const project = await prisma.projects.findUnique({
            where: { id: projectId },
        });
        if (!project) {
            res.status(404).json({
                success: false,
                message: "项目不存在",
            });
            return;
        }
        if (project.approvalStatus !== "DELETE_PENDING") {
            res.status(400).json({
                success: false,
                message: `项目未处于删除待审批状态，当前状态：${project.approvalStatus}`,
            });
            return;
        }
        // 恢复为 APPROVED 状态
        const updatedProject = await prisma.projects.update({
            where: { id: projectId },
            data: {
                approvalStatus: "APPROVED",
                deleteRequestedBy: null,
                deleteRequestedAt: null,
                deleteReason: null,
            },
        });
        console.log("✅ 项目删除请求已撤回:", {
            id: projectId,
            name: project.name,
        });
        res.json({
            success: true,
            message: "删除请求已撤回",
            data: updatedProject,
        });
    }
    catch (error) {
        console.error("❌ 撤回删除请求失败:", error);
        res.status(500).json({
            success: false,
            message: `撤回删除请求失败: ${error.message}`,
        });
    }
};
exports.withdrawProjectDeletion = withdrawProjectDeletion;
/**
 * 审批项目删除请求
 * - approved=true: 删除项目（包括文件夹和数据库记录）
 * - approved=false: 拒绝删除，恢复原状态
 */
const approveProjectDeletion = async (req, res) => {
    try {
        const { id } = req.params;
        const { approved, comment } = req.body;
        const approverId = req.user?.id || 11;
        const projectId = parseInt(id);
        const userole = req.user;
        const project = await prisma.projects.findUnique({
            where: { id: projectId },
        });
        if (!project) {
            res.status(404).json({
                success: false,
                message: "项目不存在",
            });
            return;
        }
        if (project.approvalStatus !== "DELETE_PENDING") {
            res.status(400).json({
                success: false,
                message: `项目状态必须为 DELETE_PENDING，当前状态：${project.approvalStatus}`,
            });
            return;
        }
        /*
             {
              id: 47,
              username: 'admin',
              email: 'admin@ljmagnet.com',
              realName: 'System Admin',
              profilePictureUrl: null,
              status: 'ACTIVE',
              role: 'ADMIN'
              }
        
        */
        if (userole.role === "ADMIN") {
        }
        else {
            // ✅ 检查审批权限：不能审批自己的删除请求
            if (project.ownerId === approverId && userole.role === "MANAGER") {
                res.status(403).json({
                    success: false,
                    message: "不能审批自己项目的删除请求，请联系其他审批人",
                });
                return;
            }
        }
        if (approved) {
            // 审批通过：执行实际删除操作
            console.log("📁 开始删除项目文件夹...");
            // 删除文件夹
            if (project.mineSiteFolderPath) {
                try {
                    await projectFolderService_1.projectFolderService.deleteProjectFolders({
                        clientCompany: project.clientCompany,
                        mineSiteName: project.mineSiteName,
                    });
                    console.log("✅ 文件夹删除成功");
                }
                catch (error) {
                    console.warn("⚠️ 文件夹删除失败（可能已被手动删除）:", error);
                }
            }
            // 删除数据库记录
            await prisma.projects.delete({
                where: { id: projectId },
            });
            console.log("✅ 项目删除审批通过，已删除:", {
                id: projectId,
                name: project.name,
                approvedBy: approverId,
            });
            // 🔌 发送 WebSocket 项目删除审批通过通知
            websocketService_1.WebSocketService.emitProjectDeletionApproval({
                projectId: projectId,
                projectCode: project.projectCode,
                approved: true,
                approvedBy: approverId,
            });
            res.json({
                success: true,
                message: "项目删除审批通过，项目已删除",
                data: {
                    id: projectId,
                    name: project.name,
                    deletedBy: project.deleteRequestedBy,
                    approvedBy: approverId,
                },
            });
        }
        else {
            // 审批拒绝：恢复为 APPROVED 状态
            const updatedProject = await prisma.projects.update({
                where: { id: projectId },
                data: {
                    approvalStatus: "APPROVED", // 恢复为原来的状态
                    deleteRequestedBy: null,
                    deleteRequestedAt: null,
                    deleteReason: null,
                    rejectionReason: comment || "删除请求被拒绝",
                    approvedBy: approverId,
                    approvedAt: new Date(),
                },
            });
            console.log("❌ 项目删除审批拒绝:", {
                id: projectId,
                rejectionReason: comment,
            });
            // 🔌 发送 WebSocket 项目删除审批拒绝通知
            websocketService_1.WebSocketService.emitProjectDeletionApproval({
                projectId: projectId,
                projectCode: project.projectCode,
                approved: false,
                approvedBy: approverId,
            });
            res.json({
                success: true,
                message: "项目删除请求已拒绝",
                data: updatedProject,
            });
        }
    }
    catch (error) {
        console.error("❌ 审批项目删除失败:", error);
        res.status(500).json({
            success: false,
            message: `审批失败: ${error.message}`,
        });
    }
};
exports.approveProjectDeletion = approveProjectDeletion;
/**
 * 获取待删除审批的项目列表
 * GET /api/projects/pending-delete
 */
const getPendingDeleteProjects = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const skip = (page - 1) * pageSize;
        const [projects, total] = await Promise.all([
            prisma.projects.findMany({
                where: {
                    approvalStatus: "DELETE_PENDING",
                },
                include: {
                    users: {
                        select: {
                            id: true,
                            username: true,
                            realName: true,
                            email: true,
                        },
                    },
                    tasks: {
                        select: {
                            id: true,
                            taskCode: true,
                            title: true,
                            status: true,
                        },
                    },
                },
                orderBy: {
                    deleteRequestedAt: "desc",
                },
                skip,
                take: pageSize,
            }),
            prisma.projects.count({
                where: {
                    approvalStatus: "DELETE_PENDING",
                },
            }),
        ]);
        // ✅ 修复：将 users 字段映射为 owner，与前端类型一致
        const projectsWithOwner = projects.map((project) => ({
            ...project,
            owner: project.users,
        }));
        res.json({
            success: true,
            message: "待删除审批项目列表查询成功",
            data: {
                projects: projectsWithOwner,
                pagination: {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize),
                },
            },
        });
    }
    catch (error) {
        console.error("❌ 查询待删除审批项目失败:", error);
        res.status(500).json({
            success: false,
            message: `查询失败: ${error.message}`,
        });
    }
};
exports.getPendingDeleteProjects = getPendingDeleteProjects;
/**
 * 批量审批项目
 */
const batchApproveProjects = async (req, res) => {
    try {
        const { projectIds, approved, comment } = req.body;
        const approverId = req.user?.id || 11;
        if (!Array.isArray(projectIds) || projectIds.length === 0) {
            res.status(400).json({
                success: false,
                message: "请提供有效的项目ID列表",
            });
            return;
        }
        const results = {
            success: [],
            failed: [],
        };
        for (const projectId of projectIds) {
            try {
                const project = await prisma.projects.findUnique({
                    where: { id: projectId },
                });
                if (!project || project.approvalStatus !== "PENDING") {
                    results.failed.push({
                        id: projectId,
                        reason: !project
                            ? "项目不存在"
                            : `项目状态不是PENDING: ${project.approvalStatus}`,
                    });
                    continue;
                }
                if (approved) {
                    // 审批通过：创建文件夹
                    const folderResult = await projectFolderService_1.projectFolderService.createProjectFolders({
                        clientCompany: project.clientCompany,
                        mineSiteName: project.mineSiteName,
                    });
                    await prisma.projects.update({
                        where: { id: projectId },
                        data: {
                            approvalStatus: "APPROVED",
                            approvedBy: approverId,
                            approvedAt: new Date(),
                            clientFolderPath: folderResult.clientFolderPath,
                            mineSiteFolderPath: folderResult.mineSiteFolderPath,
                            oneDriveClientFolderPath: folderResult.oneDriveClientFolderPath, // ✅ 保存 OneDrive 路径
                            oneDriveMineSiteFolderPath: folderResult.oneDriveMineSiteFolderPath, // ✅ 保存 OneDrive 路径
                            rejectionReason: null,
                        },
                    });
                }
                else {
                    // 审批拒绝
                    await prisma.projects.update({
                        where: { id: projectId },
                        data: {
                            approvalStatus: "REJECTED",
                            approvedBy: approverId,
                            approvedAt: new Date(),
                            rejectionReason: comment || "批量审批拒绝",
                        },
                    });
                }
                results.success.push(projectId);
            }
            catch (error) {
                results.failed.push({
                    id: projectId,
                    reason: error.message,
                });
            }
        }
        console.log("✅ 批量审批完成:", results);
        res.json({
            success: true,
            message: `批量审批完成：成功 ${results.success.length} 个，失败 ${results.failed.length} 个`,
            data: results,
        });
    }
    catch (error) {
        console.error("❌ 批量审批失败:", error);
        res.status(500).json({
            success: false,
            message: `批量审批失败: ${error.message}`,
        });
    }
};
exports.batchApproveProjects = batchApproveProjects;
/**
 * 搜索项目（模糊搜索）
 * GET /api/projects/search?q=关键词&limit=10
 */
const searchProjects = async (req, res) => {
    try {
        const { q, limit = 10 } = req.query;
        if (!q || q.trim().length === 0) {
            res.status(400).json({
                success: false,
                message: "搜索关键词不能为空",
            });
            return;
        }
        const searchTerm = q.trim();
        const projects = await prisma.projects.findMany({
            where: {
                OR: [
                    { name: { contains: searchTerm, mode: "insensitive" } },
                    { projectCode: { contains: searchTerm, mode: "insensitive" } },
                    { clientCompany: { contains: searchTerm, mode: "insensitive" } },
                    { mineSiteName: { contains: searchTerm, mode: "insensitive" } },
                    { description: { contains: searchTerm, mode: "insensitive" } },
                ],
            },
            include: {
                users: {
                    select: {
                        id: true,
                        username: true,
                        realName: true,
                    },
                },
            },
            take: parseInt(limit),
            orderBy: {
                updatedAt: "desc",
            },
        });
        res.json({
            success: true,
            message: `找到 ${projects.length} 个项目`,
            data: projects,
        });
    }
    catch (error) {
        console.error("❌ 搜索项目失败:", error);
        res.status(500).json({
            success: false,
            message: `搜索失败: ${error.message}`,
        });
    }
};
exports.searchProjects = searchProjects;
/**
 * 导出任务数据为Excel文件（使用 TaskExcelSyncService）
 * GET /api/projects/export
 */
const exportProjectsToExcel = async (req, res) => {
    try {
        const { jobType, status, priority, approvalStatus } = req.query;
        logger_1.logger.info("开始导出任务数据到Excel", {
            jobType,
            status,
            priority,
            approvalStatus,
        });
        // 使用 TaskExcelSyncService 导出
        const { TaskExcelSyncService } = await Promise.resolve().then(() => __importStar(require("../services/taskExcelSyncService")));
        const buffer = await TaskExcelSyncService.exportTasksToExcel({
            jobType: jobType,
            status: status,
            priority: priority,
            approvalStatus: approvalStatus,
        });
        // 生成文件名（包含日期时间）
        const timestamp = new Date().toISOString().replace(/:/g, "-").split(".")[0];
        const filename = `LJA_Job_Register_Export_${timestamp}.xlsx`;
        // 设置响应头
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.setHeader("Content-Length", buffer.length.toString());
        // 发送文件
        res.send(buffer);
        logger_1.logger.info("任务数据导出成功", {
            filename,
            size: buffer.length,
        });
    }
    catch (error) {
        logger_1.logger.error("导出任务数据失败", {
            query: req.query,
            error: error.message,
            stack: error.stack,
        });
        res.status(500).json({
            success: false,
            message: `导出失败: ${error.message}`,
        });
    }
};
exports.exportProjectsToExcel = exportProjectsToExcel;
//# sourceMappingURL=projectController.js.map