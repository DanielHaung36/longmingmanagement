/**
 * Project路由 - 完整的CRUD和审批流程
 */

import express from "express";
import {
  createProject,
  submitProjectForApproval,
  approveProject,
  withdrawProjectApproval,
  getPendingProjects,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  requestProjectDeletion,
  withdrawProjectDeletion,
  approveProjectDeletion,
  getPendingDeleteProjects,
  batchApproveProjects,
  getDraftProjects,
  getMyDraftProjects,
  searchProjects,
  exportProjectsToExcel,
  getClientCompanies,
} from "../controllers/projectController";
import { cookieAuth } from "../middleware/cookieAuth";

const router = express.Router();

// All project routes require authenticated session
router.use(cookieAuth);

// ===== 下拉选项数据（放最前面，避免被 :id 拦截） =====
/**
 * @swagger
 * /api/projects/client-companies:
 *   get:
 *     summary: 获取所有唯一的 Client Companies（用于下拉选项）
 *     tags: [Projects]
 *     responses:
 *       200:
 *         description: Client companies 列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get("/client-companies", getClientCompanies);

// ===== 审批相关路由（放在前面，避免被 :id 拦截） =====
/**
 * @swagger
 * /api/projects/pending:
 *   get:
 *     summary: 获取待审批项目列表（支持分页）
 *     tags: [Projects, Approval]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: 待审批项目列表
 */
router.get("/pending", getPendingProjects);

// ===== 审批相关路由（放在前面，避免被 :id 拦截） =====
/**
 * @swagger
 * /api/projects/draft:
 *   get:
 *     summary: 获取待草稿项目列表（支持分页）
 *     tags: [Projects, Approval]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: 待审批项目列表
 */
router.get("/draft", getDraftProjects);

/**
 * @swagger
 * /api/projects/my-draft:
 *   get:
 *     summary: 获取当前用户的草稿项目列表（支持分页）
 *     tags: [Projects, Approval]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: 我的草稿项目列表
 */
router.get("/my-draft", getMyDraftProjects);

/**
 * @swagger
 * /api/projects/pending-delete:
 *   get:
 *     summary: 获取待删除审批的项目列表（支持分页）
 *     tags: [Projects, Approval]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: 待删除审批项目列表
 */
router.get("/pending-delete", getPendingDeleteProjects);

/**
 * @swagger
 * /api/projects/search:
 *   get:
 *     summary: 搜索项目（模糊搜索）
 *     tags: [Projects]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 返回结果数量限制
 *     responses:
 *       200:
 *         description: 搜索成功
 *       400:
 *         description: 搜索关键词为空
 */
router.get("/search", searchProjects);

/**
 * @swagger
 * /api/projects/export:
 *   get:
 *     summary: 导出任务数据为Excel文件（使用TaskExcelSyncService）
 *     tags: [Projects]
 *     parameters:
 *       - in: query
 *         name: jobType
 *         schema:
 *           type: string
 *           enum: [AT, AC, AQ, AS, AP]
 *         description: 过滤业务类型
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [TODO, IN_PROGRESS, REVIEW, DONE, CANCELLED]
 *         description: 过滤任务状态
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *         description: 过滤优先级
 *       - in: query
 *         name: approvalStatus
 *         schema:
 *           type: string
 *           enum: [DRAFT, PENDING, APPROVED, REJECTED]
 *         description: 过滤审批状态
 *     responses:
 *       200:
 *         description: Excel文件下载（LJA Job Register格式）
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       500:
 *         description: 导出失败
 */
router.get("/export", exportProjectsToExcel);

/**
 * @swagger
 * /api/projects/batch-approve:
 *   post:
 *     summary: 批量审批项目
 *     tags: [Projects, Approval]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [projectIds, approved]
 *             properties:
 *               projectIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *               approved:
 *                 type: boolean
 *                 example: true
 *               comment:
 *                 type: string
 *                 example: "批量审批通过"
 *     responses:
 *       200:
 *         description: 批量审批完成
 */
router.post("/batch-approve", batchApproveProjects);

// ===== Project CRUD =====
/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: 创建新项目（DRAFT状态）
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, jobType, clientCompany, mineSiteName]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "测试项目"
 *               jobType:
 *                 type: string
 *                 enum: [AT, AQ, AC, AS, AP]
 *                 example: "AT"
 *               clientCompany:
 *                 type: string
 *                 example: "测试公司"
 *               mineSiteName:
 *                 type: string
 *                 example: "测试矿区"
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *               status:
 *                 type: string
 *                 enum: [PLANNING, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED]
 *               teamId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: 项目创建成功
 */
router.post("/", createProject);

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: 获取所有项目（支持过滤和分页）
 *     tags: [Projects]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: jobType
 *         schema:
 *           type: string
 *       - in: query
 *         name: approvalStatus
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: 项目列表
 */
router.get("/", getAllProjects);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: 获取单个项目详情
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 项目详情
 *       404:
 *         description: 项目不存在
 */
router.get("/:id", getProjectById);

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: 更新项目信息（可能重命名文件夹）
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               clientCompany:
 *                 type: string
 *               mineSiteName:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 项目不存在
 */
router.put("/:id", updateProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: 请求删除项目（标记为DELETE_PENDING，需审批）
 *     tags: [Projects, Approval]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "项目已完成，需要删除"
 *     responses:
 *       200:
 *         description: 删除请求已提交
 *       400:
 *         description: 有关联任务或已提交删除请求
 *       404:
 *         description: 项目不存在
 */
router.delete("/:id", deleteProject);

// ===== 审批流程 =====
/**
 * @swagger
 * /api/projects/{id}/submit:
 *   post:
 *     summary: 提交项目审批（DRAFT → PENDING）
 *     tags: [Projects, Approval]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 提交成功
 */
router.post("/:id/submit", submitProjectForApproval);

/**
 * @swagger
 * /api/projects/{id}/approve:
 *   post:
 *     summary: 审批项目（PENDING → APPROVED/REJECTED + 创建文件夹）
 *     tags: [Projects, Approval]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [approved]
 *             properties:
 *               approved:
 *                 type: boolean
 *                 example: true
 *               comment:
 *                 type: string
 *                 example: "审批通过"
 *     responses:
 *       200:
 *         description: 审批完成
 */
router.post("/:id/approve", approveProject);

/**
 * @swagger
 * /api/projects/{id}/withdraw:
 *   post:
 *     summary: 撤回项目审批（PENDING → DRAFT）
 *     tags: [Projects, Approval]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 撤回成功
 */
router.post("/:id/withdraw", withdrawProjectApproval);

/**
 * @swagger
 * /api/projects/{id}/request-deletion:
 *   post:
 *     summary: 请求删除项目（标记为DELETE_PENDING，需审批）
 *     tags: [Projects, Approval]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "项目已完成，需要删除"
 *     responses:
 *       200:
 *         description: 删除请求已提交
 *       400:
 *         description: 有关联任务或已提交删除请求
 *       404:
 *         description: 项目不存在
 */
router.post("/:id/request-deletion", requestProjectDeletion);

/**
 * @swagger
 * /api/projects/{id}/withdraw-deletion:
 *   post:
 *     summary: 撤回项目删除请求（DELETE_PENDING → APPROVED）
 *     tags: [Projects, Approval]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 撤回成功
 *       400:
 *         description: 项目未处于删除待审批状态
 *       404:
 *         description: 项目不存在
 */
router.post("/:id/withdraw-deletion", withdrawProjectDeletion);

/**
 * @swagger
 * /api/projects/{id}/approve-delete:
 *   post:
 *     summary: 审批项目删除请求（DELETE_PENDING → 删除 或 恢复）
 *     tags: [Projects, Approval]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [approved]
 *             properties:
 *               approved:
 *                 type: boolean
 *                 example: true
 *                 description: true=删除项目，false=拒绝删除
 *               comment:
 *                 type: string
 *                 example: "同意删除"
 *     responses:
 *       200:
 *         description: 审批完成
 */
router.post("/:id/approve-delete", approveProjectDeletion);

/**
 * @swagger
 * /api/projects/{id}/approve-deletion:
 *   post:
 *     summary: 审批项目删除请求（DELETE_PENDING → 删除 或 恢复）- 别名路由
 *     tags: [Projects, Approval]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [approved]
 *             properties:
 *               approved:
 *                 type: boolean
 *                 example: true
 *                 description: true=删除项目，false=拒绝删除
 *               comment:
 *                 type: string
 *                 example: "同意删除"
 *     responses:
 *       200:
 *         description: 审批完成
 */
router.post("/:id/approve-deletion", approveProjectDeletion);

export default router;
