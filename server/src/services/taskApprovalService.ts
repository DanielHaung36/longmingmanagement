/**
 * TaskApprovalService - Task审批服务
 *
 * 功能：
 * 1. Task审批流程管理
 * 2. 审批通过后无需额外操作（文件夹和Excel已在创建时完成）
 * 3. 审批拒绝后标记状态
 * 4. 记录审批历史
 */

import { PrismaClient } from '@prisma/client';
import { logger } from "../utils/logger";
import { TaskFolderService } from "./taskFolderService";
import { TaskExcelSyncService } from "./taskExcelSyncService";

const prisma = new PrismaClient();

export class TaskApprovalService {
  /**
   * 提交Task审批
   *
   * @param taskId - Task ID
   * @param submitterId - 提交者ID
   * @returns 更新后的Task
   */
  static async submitTaskForApproval(
    taskId: number,
    submitterId: number
  ): Promise<any> {
    try {
      logger.info("提交Task审批", { taskId, submitterId });

      const task = await prisma.tasks.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new Error(`Task不存在: ${taskId}`);
      }

      if (task.approvalStatus !== "DRAFT") {
        throw new Error(`Task状态不允许提交审批: ${task.approvalStatus}`);
      }

      const updatedTask = await prisma.tasks.update({
        where: { id: taskId },
        data: {
          approvalStatus: "PENDING",
        },
        include: {
          projects: true,
          users_tasks_authorUserIdTousers: true,
          users_tasks_assignedUserIdTousers: true,
        },
      });

      logger.info("Task审批提交成功", { taskId, approvalStatus: "PENDING" });
      return updatedTask;
    } catch (error: any) {
      logger.error("提交Task审批失败", {
        taskId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 审批Task
   *
   * @param taskId - Task ID
   * @param approverId - 审批者ID
   * @param approved - 是否通过
   * @param comment - 审批意见
   * @returns 更新后的Task
   */
  static async approveTask(
    taskId: number,
    approverId: number,
    approverrole: string,
    approved: boolean,
    comment?: string
  ): Promise<any> {
    try {
      logger.info("开始审批Task", { taskId, approverId, approved, comment ,approverrole});

      const task = await prisma.tasks.findUnique({
        where: { id: taskId },
        include: {
          projects: true,
        },
      });

      if (!task) {
        throw new Error(`Task不存在: ${taskId}`);
      }

      if (task.approvalStatus !== "PENDING") {
        throw new Error(`Task状态不允许审批: ${task.approvalStatus}`);
      }
      // 获取当前审批人信息
      approverrole = approverrole.toLowerCase();
      // ✅ 检查是否有审批权限
      if (approverrole !== 'admin' && approverrole !== 'manager') {
        throw new Error("没有审批权限，仅管理员或经理可执行审批操作");
      }

      const newStatus = approved ? "APPROVED" : "REJECTED";

      if (approved) {
        // 审批通过：创建文件夹和同步Excel
        logger.info("审批通过，开始创建文件夹和同步Excel", { taskId });

        // 1. 创建第三层文件夹（包含模板复制）
        const folderResult = await TaskFolderService.createTaskFolder(
          taskId,
          task.taskCode,
          task.title,
          task.projectId,
          task.jobType  // 修改：使用 task.jobType
        );

        if (!folderResult.success) {
          logger.error("Task文件夹创建失败", { error: folderResult.error });
          // 不抛出异常，允许继续
        }

        // 2. 更新Task状态并记录文件夹路径
        await prisma.tasks.update({
          where: { id: taskId },
          data: {
            approvalStatus: "APPROVED",
            status: "TODO",
            localFolderPath: folderResult.localFolderPath,
            oneDriveFolderPath: folderResult.oneDriveFolderPath,
            folderCreated: folderResult.success,
          },
        });

        // 3. 重建整个Excel（确保数据按业务类型排序）
        logger.info("开始重建Excel（保持业务类型排序）", { taskId });
        await TaskExcelSyncService.rebuildExcel();
        logger.info("Excel重建完成");

        // 4. 重新查询Task获取最新数据（包含excelRowNumber和syncStatus）
        const updatedTask = await prisma.tasks.findUnique({
          where: { id: taskId },
          include: {
            projects: true,
            users_tasks_authorUserIdTousers: true,
            users_tasks_assignedUserIdTousers: true,
          },
        });

        logger.info("Task审批通过，文件夹和Excel同步完成", {
          taskId,
          localFolderPath: folderResult.localFolderPath,
          excelRowNumber: updatedTask?.excelRowNumber,
        });

        console.log(`✅ Task审批通过: ${task.taskCode} ${task.title}`);
        console.log(`   - 审批者: ${approverId}`);
        console.log(`   - 本地路径: ${folderResult.localFolderPath}`);
        console.log(`   - OneDrive: ${folderResult.oneDriveFolderPath}`);
        console.log(`   - Excel行号: ${updatedTask?.excelRowNumber || '未分配'}`);
        console.log(`   - 数据已按业务类型排序（AT → AC → AQ → AS → AP）`);
        if (comment) {
          console.log(`   - 审批意见: ${comment}`);
        }

        return updatedTask;
      } else {
        // 审批拒绝：只更新状态
        const updatedTask = await prisma.tasks.update({
          where: { id: taskId },
          data: {
            approvalStatus: "REJECTED",
            status: "CANCELLED",
          },
          include: {
            projects: true,
            users_tasks_authorUserIdTousers: true,
            users_tasks_assignedUserIdTousers: true,
          },
        });

        logger.info("Task审批拒绝", {
          taskId,
          approverId,
          comment,
        });

        console.log(`❌ Task审批拒绝: ${task.taskCode} ${task.title}`);
        console.log(`   - 审批者: ${approverId}`);
        if (comment) {
          console.log(`   - 拒绝原因: ${comment}`);
        }

        return updatedTask;
      }
    } catch (error: any) {
      logger.error("审批Task失败", {
        taskId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 撤回Task审批
   *
   * @param taskId - Task ID
   * @param userId - 操作者ID
   * @returns 更新后的Task
   */
  static async withdrawTaskApproval(
    taskId: number,
    userId: number,
    userRole: string = ''
  ): Promise<any> {
    try {
      logger.info("撤回Task审批", { taskId, userId, userRole });

      const task = await prisma.tasks.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new Error(`Task不存在: ${taskId}`);
      }

      if (task.approvalStatus !== "PENDING") {
        throw new Error(`只能撤回待审批的Task: ${task.approvalStatus}`);
      }

      const isAdminOrManager = ['ADMIN', 'MANAGER'].includes(userRole.toUpperCase());
      if (task.authorUserId !== userId && !isAdminOrManager) {
        throw new Error("只有Task创建者或管理员可以撤回审批");
      }

      const updatedTask = await prisma.tasks.update({
        where: { id: taskId },
        data: {
          approvalStatus: "DRAFT",
        },
        include: {
          projects: true,
          users_tasks_authorUserIdTousers: true,
          users_tasks_assignedUserIdTousers: true,
        },
      });

      logger.info("Task审批撤回成功", { taskId });
      return updatedTask;
    } catch (error: any) {
      logger.error("撤回Task审批失败", {
        taskId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 获取待审批的Tasks
   *
   * @param approverId - 审批者ID（可选）
   * @returns Task列表
   */
  static async getPendingTasks(approverId?: number): Promise<any[]> {
    const tasks = await prisma.tasks.findMany({
      where: {
        approvalStatus: "PENDING",
      },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            clientCompany: true,
            mineSiteName: true,
            // jobType 已删除 - jobType 只在 task 级别定义
          },
        },
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
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return tasks;
  }

  /**
   * 批量审批Tasks
   *
   * @param taskIds - Task ID数组
   * @param approverId - 审批者ID
   * @param approved - 是否通过
   * @param comment - 审批意见
   * @returns 更新后的Tasks
   */
  static async batchApproveTasks(
    taskIds: number[],
    approverId: number,
    approverRole: string,
    approved: boolean,
    comment?: string
  ): Promise<any[]> {
    const results: any[] = [];
    for (const taskId of taskIds) {
      try {
        const task = await this.approveTask(
          taskId,
          approverId,
          approverRole,
          approved,
          comment
        );
        results.push(task);
      } catch (error: any) {
        logger.error("批量审批Task失败", {
          taskId,
          error: error.message,
        });
        // 继续处理其他Task
      }
    }

    logger.info("批量审批完成", {
      total: taskIds.length,
      succeeded: results.length,
      failed: taskIds.length - results.length,
    });

    return results;
  }

  // ==================== Task 删除审批相关方法 ====================

  /**
   * 提交 Task 删除请求
   *
   * 流程:
   * 1. 验证Task状态（必须是APPROVED状态才能删除）
   * 2. 更新Task状态为 DELETE_PENDING
   * 3. 记录删除请求信息
   */
  static async requestTaskDeletion(
    taskId: number,
    userId: number,
    reason: string
  ): Promise<any> {
    try {
      logger.info("提交Task删除请求", { taskId, userId, reason });

      // 1. 验证Task是否存在
      const task = await prisma.tasks.findUnique({
        where: { id: taskId },
        select: {
          id: true,
          taskCode: true,
          title: true,
          approvalStatus: true,
        },
      });

      if (!task) {
        throw new Error(`Task不存在: ${taskId}`);
      }

      // 2. 验证Task状态（只有APPROVED或REJECTED的Task才能删除）
      if (task.approvalStatus === "DELETE_PENDING") {
        throw new Error("Task已在删除审批中，请勿重复提交");
      }

      if (task.approvalStatus === "DRAFT" || task.approvalStatus === "PENDING") {
        throw new Error("草稿或待审批的Task可以直接取消，无需删除审批");
      }

      // 3. 更新Task状态为 DELETE_PENDING
      const updatedTask = await prisma.tasks.update({
        where: { id: taskId },
        data: {
          approvalStatus: "DELETE_PENDING",
          deleteRequestedBy: userId,
          deleteRequestedAt: new Date(),
          deleteReason: reason,
        },
        include: {
          projects: {
            select: {
              id: true,
              name: true,
              clientCompany: true,
              mineSiteName: true,
            },
          },
          users_tasks_deleteRequestedByTousers: {
            select: {
              id: true,
              username: true,
              realName: true,
            },
          },
        },
      });

      logger.info("Task删除请求提交成功", {
        taskId,
        taskCode: task.taskCode,
        approvalStatus: "DELETE_PENDING",
      });

      console.log(`✅ Task删除请求已提交: ${task.taskCode} ${task.title}`);
      console.log(`   - 删除原因: ${reason}`);
      console.log(`   - 请求人: User ID ${userId}`);
      console.log(`   - 等待审批中...`);

      return updatedTask;
    } catch (error: any) {
      logger.error("提交Task删除请求失败", {
        taskId,
        userId,
        error: error.message,
      });
      throw new Error(`提交Task删除请求失败: ${error.message}`);
    }
  }

  /**
   * 审批 Task 删除请求
   *
   * 流程:
   * 1. 验证Task状态（必须是DELETE_PENDING）
   * 2. 如果批准：删除Task、文件夹、Excel行
   * 3. 如果拒绝：恢复Task到APPROVED状态
   */
  static async approveTaskDeletion(
    taskId: number,
    userId: number,
    approved: boolean,
    comment?: string
  ): Promise<any> {
    try {
      logger.info("审批Task删除请求", { taskId, userId, approved, comment });

      // 1. 验证Task是否存在
      const task = await prisma.tasks.findUnique({
        where: { id: taskId },
        select: {
          id: true,
          taskCode: true,
          title: true,
          approvalStatus: true,
          deleteRequestedBy: true,
          deleteReason: true,
          excelRowNumber: true,
        },
      });

      if (!task) {
        throw new Error(`Task不存在: ${taskId}`);
      }

      // 2. 验证Task状态
      if (task.approvalStatus !== "DELETE_PENDING") {
        throw new Error(
          `Task不在删除审批状态，当前状态: ${task.approvalStatus}`
        );
      }

      // 3. 审批通过：删除Task
      if (approved) {
        logger.info("删除请求审批通过，开始删除Task", {
          taskId,
          taskCode: task.taskCode,
        });

        // 3.1 删除文件夹
        const deleteResult = await TaskFolderService.deleteTaskFolder(taskId);
        if (!deleteResult.success) {
          logger.warn("Task文件夹删除失败", { error: deleteResult.error });
        }

        // 3.2 删除数据库记录（级联删除关联的 TaskFile、Comment 等）
        await prisma.tasks.delete({
          where: { id: taskId },
        });

        // 3.3 重建整个 Excel（确保数据按业务类型排序）
        if (task.excelRowNumber) {
          logger.info("Task已同步到Excel，开始重建Excel", { taskId });
          await TaskExcelSyncService.rebuildExcel();
          logger.info("Excel重建完成");
        }

        logger.info("Task删除审批通过，删除成功", {
          taskId,
          taskCode: task.taskCode,
          approvedBy: userId,
        });

        console.log(`✅ Task删除请求已批准: ${task.taskCode} ${task.title}`);
        console.log(`   - 审批人: User ID ${userId}`);
        console.log(`   - Task已成功删除`);
        console.log(`   - 文件夹已删除`);
        if (task.excelRowNumber) {
          console.log(`   - Excel已更新`);
        }

        return {
          success: true,
          message: "Task删除成功",
          taskCode: task.taskCode,
          title: task.title,
        };
      }

      // 4. 审批拒绝：恢复Task到APPROVED状态
      else {
        const updatedTask = await prisma.tasks.update({
          where: { id: taskId },
          data: {
            approvalStatus: "APPROVED", // 恢复为APPROVED状态
            deleteRequestedBy: null,
            deleteRequestedAt: null,
            deleteReason: null,
          },
          include: {
            projects: {
              select: {
                id: true,
                name: true,
                clientCompany: true,
                mineSiteName: true,
              },
            },
            users_tasks_authorUserIdTousers: {
              select: {
                id: true,
                username: true,
                realName: true,
              },
            },
          },
        });

        logger.info("Task删除请求被拒绝，已恢复", {
          taskId,
          taskCode: task.taskCode,
          rejectedBy: userId,
          comment,
        });

        console.log(`❌ Task删除请求已拒绝: ${task.taskCode} ${task.title}`);
        console.log(`   - 审批人: User ID ${userId}`);
        console.log(`   - 拒绝原因: ${comment || "无"}`);
        console.log(`   - Task已恢复为APPROVED状态`);

        return updatedTask;
      }
    } catch (error: any) {
      logger.error("审批Task删除请求失败", {
        taskId,
        userId,
        approved,
        error: error.message,
      });
      throw new Error(`审批Task删除请求失败: ${error.message}`);
    }
  }

  /**
   * 撤回 Task 删除请求
   *
   * 只有删除请求的提交人可以撤回
   */
  static async withdrawTaskDeletionRequest(
    taskId: number,
    userId: number
  ): Promise<any> {
    try {
      logger.info("撤回Task删除请求", { taskId, userId });

      // 1. 验证Task是否存在
      const task = await prisma.tasks.findUnique({
        where: { id: taskId },
        select: {
          id: true,
          taskCode: true,
          title: true,
          approvalStatus: true,
          deleteRequestedBy: true,
        },
      });

      if (!task) {
        throw new Error(`Task不存在: ${taskId}`);
      }

      // 2. 验证Task状态
      if (task.approvalStatus !== "DELETE_PENDING") {
        throw new Error(`Task不在删除审批状态，无法撤回`);
      }

      // 3. 验证权限（只有请求人可以撤回）
      if (task.deleteRequestedBy !== userId) {
        throw new Error("只有删除请求的提交人可以撤回");
      }

      // 4. 恢复Task到APPROVED状态
      const updatedTask = await prisma.tasks.update({
        where: { id: taskId },
        data: {
          approvalStatus: "APPROVED",
          deleteRequestedBy: null,
          deleteRequestedAt: null,
          deleteReason: null,
        },
        include: {
          projects: {
            select: {
              id: true,
              name: true,
              clientCompany: true,
              mineSiteName: true,
            },
          },
        },
      });

      logger.info("Task删除请求已撤回", {
        taskId,
        taskCode: task.taskCode,
        userId,
      });

      console.log(`↩️  Task删除请求已撤回: ${task.taskCode} ${task.title}`);
      console.log(`   - Task已恢复为APPROVED状态`);

      return updatedTask;
    } catch (error: any) {
      logger.error("撤回Task删除请求失败", {
        taskId,
        userId,
        error: error.message,
      });
      throw new Error(`撤回Task删除请求失败: ${error.message}`);
    }
  }

  /**
   * 获取待删除审批的 Tasks
   */
  static async getPendingDeletionTasks(userId?: number): Promise<any[]> {
    try {
      const tasks = await prisma.tasks.findMany({
        where: {
          approvalStatus: "DELETE_PENDING",
        },
        include: {
          projects: {
            select: {
              id: true,
              name: true,
              projectCode: true,
              // jobType 已删除 - jobType 只在 task 级别定义
              clientCompany: true,
              mineSiteName: true,
            },
          },
          users_tasks_deleteRequestedByTousers: {
            select: {
              id: true,
              username: true,
              realName: true,
            },
          },
          users_tasks_authorUserIdTousers: {
            select: {
              id: true,
              username: true,
              realName: true,
            },
          },
        },
        orderBy: {
          deleteRequestedAt: "asc", // 按删除请求时间排序
        },
      });

      logger.info("获取待删除审批Tasks成功", { count: tasks.length });
      return tasks;
    } catch (error: any) {
      logger.error("获取待删除审批Tasks失败", { error: error.message });
      throw new Error(`获取待删除审批Tasks失败: ${error.message}`);
    }
  }
}
