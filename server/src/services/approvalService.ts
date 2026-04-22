import { PrismaClient } from '@prisma/client';
import { ProjectFolderService } from "./projectFolderService";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

export class ApprovalService {
  /**
   * 审批项目（新架构：只创建前两层文件夹，不创建Task）
   *
   * Project 审批流程：
   * 1. 拒绝：更新状态为 REJECTED
   * 2. 批准：
   *    - 创建前两层文件夹（clientCompany/ 和 mineSiteName/）
   *    - 更新状态为 APPROVED
   *    - 不生成 projectCode（保留 TEMP-xxx）
   *    - 不创建 Task
   *    - 不同步 Excel（Task 创建时才同步）
   */
  static async approveProject(
    projectId: number,
    approverId: number,
    approved: boolean,
    comment?: string
  ) {
    try {
      logger.info("开始审批Project", { projectId, approverId, approved });

      const project = await prisma.projects.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new Error("项目不存在");
      }

      if (project.approvalStatus !== "PENDING") {
        throw new Error("项目已处理过");
      }

      // 拒绝项目
      if (!approved) {
        const rejectedProject = await prisma.projects.update({
          where: { id: projectId },
          data: {
            approvalStatus: "REJECTED",
            approvedBy: approverId,
            approvedAt: new Date(),
            rejectionReason: comment,
          },
        });

        logger.info("Project审批被拒绝", { projectId, reason: comment });
        return rejectedProject;
      }

      // 批准项目 - 创建前两层文件夹
      // 1. 创建 clientCompany/ 和 mineSiteName/ 文件夹
      const folderResult = await ProjectFolderService.createProjectFolders({
        clientCompany: project.clientCompany!,
        mineSiteName: project.mineSiteName!
      });

      // 2. 更新项目状态为 APPROVED
      const approvedProject = await prisma.projects.update({
        where: { id: projectId },
        data: {
          approvalStatus: "APPROVED",
          approvedBy: approverId,
          approvedAt: new Date(),
          status: "IN_PROGRESS",
          clientFolderPath: folderResult.clientFolderPath ?? null,
          mineSiteFolderPath: folderResult.mineSiteFolderPath ?? null,
          oneDriveClientFolderPath: folderResult.oneDriveClientFolderPath ?? null,
          oneDriveMineSiteFolderPath: folderResult.oneDriveMineSiteFolderPath ?? null,
          syncStatus: "SYNCED",
        },
      });

      logger.info("Project审批通过", {
        projectId,
        clientFolderPath: folderResult.clientFolderPath,
        mineSiteFolderPath: folderResult.mineSiteFolderPath,
      });

      console.log(`✅ 项目审批完成: ${project.name}`);
      console.log(`   - 客户文件夹: ${folderResult.clientFolderPath}`);
      console.log(`   - 矿区文件夹: ${folderResult.mineSiteFolderPath}`);
      console.log(`   ⚠️  注意：需要手动创建Task来生成第三层文件夹和同步Excel`);

      return approvedProject;
    } catch (error: any) {
      logger.error("审批Project失败", {
        projectId,
        error: error.message,
        stack: error.stack,
      });

      throw new Error(`审批失败: ${error.message}`);
    }
  }

  /**
   * 获取待审批项目列表
   */
  static async getPendingProjects() {
    return await prisma.projects.findMany({
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
        teams: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        mine_zones: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * 获取审批统计
   */
  static async getApprovalStats() {
    const [pending, approved, rejected] = await Promise.all([
      prisma.projects.count({ where: { approvalStatus: "PENDING" } }),
      prisma.projects.count({ where: { approvalStatus: "APPROVED" } }),
      prisma.projects.count({ where: { approvalStatus: "REJECTED" } }),
    ]);

    return {
      pending,
      approved,
      rejected,
      total: pending + approved + rejected,
    };
  }
}
