/**
 * Task Excel 同步服务
 *
 * 新架构：Excel 的每一行代表一个 Task（不再是 Project）
 *
 * 数据来源：
 * - Project 信息：clientCompany, mineSiteName, jobType
 * - Task 信息：taskCode, title, status, folderPath 等
 *
 * 同步策略：
 * - Task 创建 → 添加新行到 Excel
 * - Task 更新 → 更新对应行
 * - Task 删除 → 从 Excel 删除行
 */

import { PrismaClient } from '@prisma/client';
import { logger } from "../utils/logger";
import ExcelJS from "exceljs";
import * as path from "path";
import * as fs from "fs-extra";
import { OneDriveApiService } from './oneDriveApiService';

const prisma = new PrismaClient();

// Excel 格式配置
const EXCEL_CONFIG = {
  FONT: { name: "Times New Roman", size: 11 },
  COLORS: {
    HEADER: "FFD3D3D3",
    JOB_TYPES: {
      AT: "FFFCE4EC", // 粉红色 - Testwork
      AQ: "FFE3F2FD", // 蓝色 - Quote
      AC: "FFF1F8E9", // 绿色 - Consulting
      AS: "FFFFF3E0", // 橙色 - Sales
      AP: "FFF3E5F5", // 紫色 - Production
    } as Record<string, string>,
    DEFAULT: "FFFFFFFF",
  },
};

export class TaskExcelSyncService {
  // Excel 文件路径
  private static EXCEL_LOCAL_PATH =
    process.env.EXCEL_LOCAL_PATH ;
  private static EXCEL_ONEDRIVE_PATH = process.env.EXCEL_ONEDRIVE_PATH || "";

  // Excel 工作表名称
  private static SHEET_NAME = "Job Data"; // 统一使用 Job Data 表名

  /**
   * 获取导出用的 Excel 文件路径（避免覆盖原文件）
   * 例如：LJA Job Register Rev3.xlsm → LJA Job Register Rev3_Export.xlsx
   * 注意：ExcelJS 只能创建 .xlsx 格式，不支持带宏的 .xlsm
   */
  private static getExportPath(originalPath: string): string {
    if (!originalPath) return originalPath;

    const parsedPath = require('path').parse(originalPath);
    // 在文件名后添加 _Export 后缀，并强制使用 .xlsx 扩展名
    return require('path').join(
      parsedPath.dir,
      `${parsedPath.name}_Export.xlsx`
    );
  }

  /**
   * 检查路径是否安全（不会覆盖原始 xlsm 文件）
   * 原始文件特征：包含 "LJA Job Register Rev3.xlsm" 且不包含 "_Export" 或 "_Local"
   */
  private static isSafeExcelPath(filePath: string): boolean {
    if (!filePath) return false;

    const fileName = require('path').basename(filePath);
    const isOriginalFile = fileName.includes('LJA Job Register Rev3.xlsm');
    const hasProtectionSuffix = fileName.includes('_Export') ||
                                 fileName.includes('_Local') ||
                                 fileName.includes('副本') ||
                                 fileName.includes('copy');

    // 如果是原始文件且没有保护后缀，则不安全
    if (isOriginalFile && !hasProtectionSuffix) {
      logger.warn('⚠️  检测到危险路径：试图写入原始 Excel 文件', { filePath });
      return false;
    }

    return true;
  }

  /**
   * 获取安全的本地 Excel 路径（如果配置的路径不安全，自动使用安全路径）
   */
  private static getSafeLocalPath(): string {
    let localPath = this.EXCEL_LOCAL_PATH;

    // 如果路径不安全，使用导出路径
    if (!this.isSafeExcelPath(localPath)) {
      logger.warn('⚠️  EXCEL_LOCAL_PATH 指向原始文件，自动使用 _Export 路径');
      localPath = this.getExportPath(localPath);
    }

    return localPath;
  }

  /**
   * Task 创建后同步到 Excel
   */
  static async syncTaskCreate(taskId: number): Promise<number | null> {
    try {
      logger.info("开始同步Task到Excel", { taskId });

      // 1. 获取 Task 及关联的 Project 信息
      const task = await this.getTaskWithProject(taskId);
      if (!task) {
        throw new Error(`Task不存在: ${taskId}`);
      }

      // 2. 打开 Excel 工作簿
      const workbook = await this.openWorkbook();
      let worksheet = workbook.getWorksheet(this.SHEET_NAME);

      // 如果工作表不存在，自动创建
      if (!worksheet) {
        logger.info("工作表不存在，正在创建", { sheetName: this.SHEET_NAME });
        worksheet = workbook.addWorksheet(this.SHEET_NAME);
        this.initializeWorksheet(worksheet);
        logger.info("工作表创建成功", { sheetName: this.SHEET_NAME });
      }

      // 3. 找到最后一行
      const lastRow = worksheet.lastRow;
      const newRowNumber = lastRow ? lastRow.number + 1 : 2; // 第1行是标题

      // 4. 准备行数据
      const rowData = this.taskToExcelRow(task);

      // 5. 添加新行
      const newRow = worksheet.getRow(newRowNumber);
      newRow.values = rowData;

      // 应用格式
      this.applyRowFormatting(newRow, task);

      // 6. 保存工作簿
      await this.saveWorkbook(workbook);

      // 7. 更新 Task 的 excelRowNumber
      await prisma.tasks.update({
        where: { id: taskId },
        data: {
          excelRowNumber: newRowNumber,
          syncStatus: "SYNCED",
        },
      });

      logger.info("Task同步到Excel成功", { taskId, rowNumber: newRowNumber });
      return newRowNumber;
    } catch (error: any) {
      logger.error("Task同步到Excel失败", {
        taskId,
        error: error.message,
        stack: error.stack,
      });

      // 更新同步失败状态
      await prisma.tasks.update({
        where: { id: taskId },
        data: { syncStatus: "FAILED" },
      });

      return null;
    }
  }

  /**
   * Task 更新后同步到 Excel
   */
  static async syncTaskUpdate(taskId: number): Promise<boolean> {
    try {
      logger.info("开始更新Task到Excel", { taskId });

      // 1. 获取 Task 信息
      const task = await this.getTaskWithProject(taskId);
      if (!task) {
        throw new Error(`Task不存在: ${taskId}`);
      }

      if (!task.excelRowNumber) {
        logger.warn("Task没有Excel行号，跳过更新", { taskId });
        return false;
      }

      // 2. 打开 Excel 工作簿
      const workbook = await this.openWorkbook();
      let worksheet = workbook.getWorksheet(this.SHEET_NAME);

      // 如果工作表不存在，自动创建
      if (!worksheet) {
        logger.warn("工作表不存在，正在创建", { sheetName: this.SHEET_NAME });
        worksheet = workbook.addWorksheet(this.SHEET_NAME);
        this.initializeWorksheet(worksheet);
        logger.info("工作表创建成功", { sheetName: this.SHEET_NAME });
      }

      // 3. 更新对应行
      // 计算序号：excelRowNumber - 1（因为第1行是表头）
      const sequenceNumber = task.excelRowNumber - 1;
      const rowData = this.taskToExcelRow(task, sequenceNumber);
      const row = worksheet.getRow(task.excelRowNumber);
      row.values = rowData;

      // 应用格式
      this.applyRowFormatting(row, task);

      // 4. 保存工作簿
      await this.saveWorkbook(workbook);

      // 5. 更新同步状态
      await prisma.tasks.update({
        where: { id: taskId },
        data: { syncStatus: "SYNCED" },
      });

      logger.info("Task更新到Excel成功", {
        taskId,
        rowNumber: task.excelRowNumber,
      });
      return true;
    } catch (error: any) {
      logger.error("Task更新到Excel失败", {
        taskId,
        error: error.message,
        stack: error.stack,
      });

      await prisma.tasks.update({
        where: { id: taskId },
        data: { syncStatus: "FAILED" },
      });

      return false;
    }
  }

  /**
   * Task 删除后从 Excel 删除
   */
  static async syncTaskDelete(
    taskId: number,
    excelRowNumber?: number
  ): Promise<boolean> {
    try {
      logger.info("开始从Excel删除Task", { taskId, excelRowNumber });

      if (!excelRowNumber) {
        logger.warn("Task没有Excel行号，跳过删除", { taskId });
        return false;
      }

      // 1. 打开 Excel 工作簿
      const workbook = await this.openWorkbook();
      let worksheet = workbook.getWorksheet(this.SHEET_NAME);

      // 如果工作表不存在，自动创建（虽然删除时理论上应该存在）
      if (!worksheet) {
        logger.warn("工作表不存在，无法删除", { sheetName: this.SHEET_NAME });
        return false;
      }

      // 2. 删除对应行（将行内容清空或标记删除）
      const row = worksheet.getRow(excelRowNumber);

      // 方法1: 清空行内容
      row.values = [];

      // 或者方法2: 标记为已删除
      // row.getCell(1).value = '[已删除]';
      // row.font = { strike: true };

      // 3. 保存工作簿
      await this.saveWorkbook(workbook);

      logger.info("Task从Excel删除成功", { taskId, rowNumber: excelRowNumber });
      return true;
    } catch (error: any) {
      logger.error("Task从Excel删除失败", {
        taskId,
        excelRowNumber,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * 完整重建 Excel（基于所有 Tasks，按类型排序）
   */
  static async rebuildExcel(): Promise<void> {
    try {
      logger.info("开始重建Excel（基于Tasks，按类型排序）");

      // 1. 获取所有已审批的 Tasks（包含Project信息和quotations）
      const tasks = await prisma.tasks.findMany({
        where: {
          approvalStatus: "APPROVED",
          projects: {
            approvalStatus: "APPROVED",
          },
        },
        include: {
          projects: {
            include: {
              project_mining_info: true,
              project_quotations: true,
            },
          },
          users_tasks_assignedUserIdTousers: {
            select: {
              id: true,
              realName: true,
            },
          },
        },
      });

      // 2. 按JobType排序：AT, AC, AQ, AS, AP
      const jobTypeOrder: Record<string, number> = {
        AT: 1,
        AC: 2,
        AQ: 3,
        AS: 4,
        AP: 5,
      };

      const sortedTasks = tasks.sort((a, b) => {
        const jobTypeA = a.jobType;  // 修改：使用 task.jobType
        const jobTypeB = b.jobType;  // 修改：使用 task.jobType
        const orderA = jobTypeOrder[jobTypeA] || 99;
        const orderB = jobTypeOrder[jobTypeB] || 99;

        // 先按JobType排序
        if (orderA !== orderB) {
          return orderA - orderB;
        }

        // 同类型内按TaskCode排序
        return a.taskCode.localeCompare(b.taskCode);
      });

      logger.info("任务已按类型排序", {
        totalTasks: sortedTasks.length,
        distribution: {
          AT: sortedTasks.filter((t) => t.jobType === "AT").length,  // 修改：使用 task.jobType
          AC: sortedTasks.filter((t) => t.jobType === "AC").length,  // 修改：使用 task.jobType
          AQ: sortedTasks.filter((t) => t.jobType === "AQ").length,  // 修改：使用 task.jobType
          AS: sortedTasks.filter((t) => t.jobType === "AS").length,  // 修改：使用 task.jobType
          AP: sortedTasks.filter((t) => t.jobType === "AP").length,  // 修改：使用 task.jobType
        },
      });

      // 3. 创建新工作簿
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(this.SHEET_NAME);

      // 4. 初始化工作表（设置表头和格式）
      this.initializeWorksheet(worksheet);

      // 5. 添加数据行（按排序后的顺序）
      let rowNumber = 2; // 第1行是表头
      const taskUpdates: Array<{ id: number; excelRowNumber: number }> = [];

      for (let i = 0; i < sortedTasks.length; i++) {
        const task = sortedTasks[i];
        const sequenceNumber = i + 1; // 序号从1开始
        const rowData = this.taskToExcelRow(task, sequenceNumber);

        const row = worksheet.addRow(rowData);

        // 应用格式
        this.applyRowFormatting(row, task);

        taskUpdates.push({
          id: task.id,
          excelRowNumber: rowNumber,
        });

        rowNumber++;
      }

      // 6. 添加统计行
      const stats = {
        AT: sortedTasks.filter((t) => t.jobType === "AT").length,  // 修改：使用 task.jobType
        AC: sortedTasks.filter((t) => t.jobType === "AC").length,  // 修改：使用 task.jobType
        AQ: sortedTasks.filter((t) => t.jobType === "AQ").length,  // 修改：使用 task.jobType
        AS: sortedTasks.filter((t) => t.jobType === "AS").length,  // 修改：使用 task.jobType
        AP: sortedTasks.filter((t) => t.jobType === "AP").length,  // 修改：使用 task.jobType
      };
      const total = sortedTasks.length;

      // 添加空行分隔
      worksheet.addRow([]);

      // 添加统计行
      const statsRow = worksheet.addRow([
        "",
        "STATISTICS",
        `AT: ${stats.AT}`,
        `AC: ${stats.AC}`,
        `AQ: ${stats.AQ}`,
        `AS: ${stats.AS}`,
        `AP: ${stats.AP}`,
        `Total: ${total}`,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ]);

      // 统计行特殊格式
      statsRow.font = { ...EXCEL_CONFIG.FONT, bold: true, size: 12 };
      statsRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFEB3B" }, // 黄色背景
      };
      statsRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: "medium" },
          left: { style: "thin" },
          bottom: { style: "medium" },
          right: { style: "thin" },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });

      logger.info("统计行已添加", { stats, total });

      // 7. 保存工作簿（使用安全路径）
      const safeLocalPath = this.getSafeLocalPath();
      await workbook.xlsx.writeFile(safeLocalPath);
      logger.info("本地Excel重建成功", {
        path: safeLocalPath,
        rows: rowNumber - 2,
      });

      // 通过 Graph API 上传到 OneDrive
      if (this.EXCEL_ONEDRIVE_PATH) {
        const exportPath = this.getExportPath(this.EXCEL_ONEDRIVE_PATH);
        const arrayBuffer = await workbook.xlsx.writeBuffer();
        const buffer = Buffer.from(arrayBuffer as ArrayBuffer);
        const result = await OneDriveApiService.uploadFile(exportPath, buffer);
        if (result.success) {
          logger.info("OneDrive Excel重建成功（Graph API）", {
            path: exportPath,
            skipped: result.skipped,
          });
        } else {
          logger.warn("OneDrive Excel重建上传失败", {
            path: exportPath,
            error: result.error,
          });
        }
      }

      // 8. 批量更新 Task 的 excelRowNumber
      for (const update of taskUpdates) {
        await prisma.tasks.update({
          where: { id: update.id },
          data: {
            excelRowNumber: update.excelRowNumber,
            syncStatus: "SYNCED",
          },
        });
      }

      logger.info("Excel重建完成", { totalTasks: taskUpdates.length });
    } catch (error: any) {
      logger.error("Excel重建失败", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * 将 Task 转换为 Excel 行数据（优化版：序号 + 15列基础 + 8列管理）
   *
   * 映射关系（对应原始Excel列）：
   * - 列1: Job ID → task.taskCode
   * - 列2: Client → project.clientCompany
   * - 列3: Mine/Site → project.mineSiteName
   * - 列4: Project → task.title
   * - 列5: Job Type → task.jobType (注意：从 task 获取，不是 project)
   * - 列6: Mineral → task.mineral
   * - 列7: Contact Company(if not the Client) → task.contactCompany
   * - 列8: Project Manager → task.projectManager
   * - 列9: Quotation/Record Number(HQ) → task.quotationNumber
   * - 列10: Request Date → task.requestDate
   * - 列11: Quotation Provided Date → task.quotationDate
   * - 列12: Feedback From Client → task.clientFeedback
   * - 列13: Comment → task.excelComment
   * - 列14: Name → task.title
   * - 列15: Link (OneDrive Path) → task.originalOneDrivePath
   */
  private static taskToExcelRow(task: any, rowNumber?: number): any[] {
    const project = task.project || task.projects;
    const jobType = task.jobType || ""; // 修复：从 task 获取 jobType，不再从 project

    // OneDrive路径：优先使用原始路径，其次使用系统生成路径
    let oneDrivePath = task.originalOneDrivePath || task.oneDriveFolderPath || "";
    if (oneDrivePath) {
      oneDrivePath = oneDrivePath.replace(/\\/g, "/");
    }

    return [
      rowNumber || "", // A: 序号（自动计数）
      jobType, // B: Job Type (Excel列5)
      project?.clientCompany || "", // C: Client (Excel列2)
      project?.mineSiteName || "", // D: Mine Site (Excel列3)
      task.title, // E: Project (Excel列4)
      task.mineral || "", // F: Mineral (Excel列6) - 从task直接读取
      task.contactCompany || "", // G: Contact Company(if not the Client) (Excel列7) ✓ 修复
      task.projectManager || "", // H: Project Manager (Excel列8) ✓ 修复
      task.quotationNumber || "", // I: Quotation Number (Excel列9) ✓ 修复 - 空值就留空，不填充taskCode
      task.requestDate ? new Date(task.requestDate) : "", // J: Request Date (Excel列10) ✓ 修复
      task.quotationDate ? new Date(task.quotationDate) : "", // K: Quotation Date (Excel列11) ✓ 修复
      task.clientFeedback || "", // L: Client Feedback (Excel列12) ✓ 修复
      task.excelComment || task.description || "", // M: Comment (Excel列13) ✓ 修复
      task.title, // N: Name (Excel列14)
      task.taskCode, // O: Project Code (Excel列1: Job ID)
      oneDrivePath, // P: OneDrive Path (Excel列15) ✓ 修复
      // 新增管理列
      task.status, // Q: Status
      task.priority, // R: Priority
      task.progress || 0, // S: Progress (%)
      task.users_tasks_assignedUserIdTousers?.realName || "", // T: Assignee
      task.startDate ? new Date(task.startDate) : "", // U: Start Date
      task.dueDate ? new Date(task.dueDate) : "", // V: Due Date
      task.estimatedHours || "", // W: Estimated Hours
      task.actualHours || "", // X: Actual Hours
    ];
  }

  /**
   * 获取 Excel 列定义（优化版：序号 + 15列基础 + 8列管理）
   */
  private static getExcelColumns(): Partial<ExcelJS.Column>[] {
    return [
      { header: "No.", key: "rowNumber", width: 6 }, // A: 序号
      { header: "Job Type", key: "jobType", width: 12 }, // B
      { header: "Client", key: "client", width: 25 }, // C
      { header: "Mine Site", key: "mineSite", width: 30 }, // D
      { header: "Project", key: "project", width: 40 }, // E
      { header: "Mineral", key: "mineral", width: 15 }, // F
      { header: "Contact Person", key: "contactPerson", width: 20 }, // G
      { header: "Project Manager", key: "projectManager", width: 20 }, // H
      { header: "Quotation Number", key: "quotationNumber", width: 18 }, // I
      { header: "Request Date", key: "requestDate", width: 15 }, // J
      { header: "Quotation Date", key: "quotationDate", width: 15 }, // K
      { header: "Client Feedback", key: "clientFeedback", width: 25 }, // L
      { header: "Comment", key: "comment", width: 40 }, // M
      { header: "Name", key: "name", width: 30 }, // N
      { header: "Project Code", key: "projectCode", width: 15 }, // O
      { header: "OneDrive Path", key: "oneDrivePath", width: 60 }, // P
      // 新增管理列
      { header: "Status", key: "status", width: 15 }, // Q
      { header: "Priority", key: "priority", width: 12 }, // R
      { header: "Progress (%)", key: "progress", width: 12 }, // S
      { header: "Assignee", key: "assignee", width: 20 }, // T
      { header: "Start Date", key: "startDate", width: 15 }, // U
      { header: "Due Date", key: "dueDate", width: 15 }, // V
      { header: "Est. Hours", key: "estimatedHours", width: 12 }, // W
      { header: "Actual Hours", key: "actualHours", width: 12 }, // X
    ];
  }

  /**
   * 获取 Task 及关联的 Project（包含完整数据）
   */
  private static async getTaskWithProject(taskId: number): Promise<any> {
    return await prisma.tasks.findUnique({
      where: { id: taskId },
      include: {
        projects: {
          include: {
            project_mining_info: true,
            project_quotations: true,
          },
        },
        users_tasks_assignedUserIdTousers: {
          select: {
            id: true,
            realName: true,
          },
        },
      },
    });
  }

  /**
   * 打开 Excel 工作簿
   * 优先从本地读取，本地不存在时从 OneDrive 下载
   */
  private static async openWorkbook(): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();

    if (await fs.pathExists(this.EXCEL_LOCAL_PATH)) {
      await workbook.xlsx.readFile(this.EXCEL_LOCAL_PATH);
    } else if (this.EXCEL_ONEDRIVE_PATH) {
      // 本地不存在，尝试从 OneDrive 下载
      const exportPath = this.getExportPath(this.EXCEL_ONEDRIVE_PATH);
      const buffer = await OneDriveApiService.downloadFileAsBuffer(exportPath);
      if (buffer) {
        await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
        logger.info('从 OneDrive 下载 Excel 工作簿成功', { path: exportPath });
      } else {
        // OneDrive 也没有，创建新工作簿
        const worksheet = workbook.addWorksheet(this.SHEET_NAME);
        this.initializeWorksheet(worksheet);
      }
    } else {
      // 没有配置 OneDrive 路径，创建新工作簿
      const worksheet = workbook.addWorksheet(this.SHEET_NAME);
      this.initializeWorksheet(worksheet);
    }

    return workbook;
  }

  /**
   * 保存 Excel 工作簿
   * 保存到本地文件，并通过 Graph API 上传到 OneDrive
   */
  private static async saveWorkbook(workbook: ExcelJS.Workbook): Promise<void> {
    // 保存到本地（使用安全路径）
    const safeLocalPath = this.getSafeLocalPath();
    await workbook.xlsx.writeFile(safeLocalPath);
    logger.debug("Excel保存到本地", { path: safeLocalPath });

    // 通过 Graph API 上传到 OneDrive
    if (this.EXCEL_ONEDRIVE_PATH) {
      const exportPath = this.getExportPath(this.EXCEL_ONEDRIVE_PATH);
      const arrayBuffer = await workbook.xlsx.writeBuffer();
      const buffer = Buffer.from(arrayBuffer as ArrayBuffer);
      const result = await OneDriveApiService.uploadFile(exportPath, buffer);
      if (result.success) {
        logger.debug("Excel通过Graph API上传到OneDrive", {
          path: exportPath,
          skipped: result.skipped,
        });
      } else {
        logger.warn("Excel上传到OneDrive失败", {
          path: exportPath,
          error: result.error,
        });
      }
    }
  }

  /**
   * 应用行格式（字体、颜色、边框）
   */
  private static applyRowFormatting(row: ExcelJS.Row, task: any): void {
    const jobType = task.jobType; // 修复：从 task 获取 jobType，不再从 project

    // 设置行字体
    row.font = EXCEL_CONFIG.FONT;

    // 根据 jobType 获取背景色
    const bgColor =
      EXCEL_CONFIG.COLORS.JOB_TYPES[jobType] || EXCEL_CONFIG.COLORS.DEFAULT;

    // 应用格式到每个单元格
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: bgColor },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // 设置日期格式
    const dateColumns = [10, 11, 21, 22]; // Request Date (J), Quotation Date (K), Start Date (U), Due Date (V)
    dateColumns.forEach((colNum) => {
      const cell = row.getCell(colNum);
      if (cell.value) {
        cell.numFmt = "dd/mm/yyyy";
      }
    });

    // 设置OneDrive路径为超链接
    const oneDrivePathCell = row.getCell(16); // OneDrive Path (P列)
    if (oneDrivePathCell.value) {
      oneDrivePathCell.font = {
        ...EXCEL_CONFIG.FONT,
        color: { argb: "FF0000FF" },
        underline: true,
      };
    }

    // 设置序号列居中
    const rowNumberCell = row.getCell(1); // No. (A列)
    rowNumberCell.alignment = { horizontal: "center", vertical: "middle" };

    // 设置Progress列居中
    const progressCell = row.getCell(19); // Progress (S列)
    progressCell.alignment = { horizontal: "center", vertical: "middle" };
  }

  /**
   * 初始化工作表（设置表头样式）
   */
  private static initializeWorksheet(worksheet: ExcelJS.Worksheet): void {
    // 设置列定义
    worksheet.columns = this.getExcelColumns();

    // 设置表头样式
    const headerRow = worksheet.getRow(1);
    headerRow.font = { ...EXCEL_CONFIG.FONT, bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: EXCEL_CONFIG.COLORS.HEADER },
    };

    // 表头边框
    headerRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: "medium" },
        left: { style: "thin" },
        bottom: { style: "medium" },
        right: { style: "thin" },
      };
    });

    // 冻结表头行
    worksheet.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }];

    // 添加自动筛选
    worksheet.autoFilter = {
      from: "A1",
      to: "X1", // 到最后一列（Actual Hours）
    };
  }

  /**
   * 导出所有任务数据为 Excel Buffer（用于 HTTP 下载）
   *
   * @param filters 过滤条件（可选）
   * @returns Excel 文件的 Buffer
   */
  static async exportTasksToExcel(filters?: {
    jobType?: string;
    status?: string;
    priority?: string;
    approvalStatus?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Buffer> {
    try {
      logger.info("开始导出任务数据为Excel", { filters });

      // 1. 构建查询条件
      const where: any = {
        projects: {
          approvalStatus: "APPROVED", // 只导出已审批的项目的任务
          // Exclude template projects
          NOT: {
            OR: [
              { name: { contains: 'template', mode: 'insensitive' } },
              { projectCode: { contains: 'template', mode: 'insensitive' } },
            ],
          },
        },
      };

      if (filters?.jobType) {
        where.jobType = filters.jobType;  // 修改：直接使用 task.jobType
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.priority) {
        where.priority = filters.priority;
      }

      if (filters?.approvalStatus) {
        where.approvalStatus = filters.approvalStatus;
      }

      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.createdAt.lte = filters.endDate;
        }
      }

      // 2. 获取所有符合条件的 Tasks
      const tasks = await prisma.tasks.findMany({
        where,
        include: {
          projects: {
            include: {
              project_mining_info: true,
              project_quotations: true,
            },
          },
          users_tasks_assignedUserIdTousers: {
            select: {
              id: true,
              realName: true,
              username: true,
            },
          },
          users_tasks_authorUserIdTousers: {
            select: {
              id: true,
              realName: true,
              username: true,
            },
          },
        },
        orderBy: [
          // jobType 已删除 - 改用 task.jobType 排序
          { jobType: "asc" },
          { taskCode: "asc" },
        ],
      });

      logger.info("查询到任务数据", { count: tasks.length });

      // 3. 按JobType排序（保持一致性）
      const jobTypeOrder: Record<string, number> = {
        AT: 1,
        AC: 2,
        AQ: 3,
        AS: 4,
        AP: 5,
      };

      const sortedTasks = tasks.sort((a, b) => {
        const jobTypeA = a.jobType;  // 修改：使用 task.jobType
        const jobTypeB = b.jobType;  // 修改：使用 task.jobType
        const orderA = jobTypeOrder[jobTypeA] || 99;
        const orderB = jobTypeOrder[jobTypeB] || 99;

        if (orderA !== orderB) {
          return orderA - orderB;
        }

        return a.taskCode.localeCompare(b.taskCode);
      });

      // 4. 创建新工作簿
      const workbook = new ExcelJS.Workbook();

      // 设置工作簿属性
      workbook.creator = "Longi Project Management System";
      workbook.lastModifiedBy = "System";
      workbook.created = new Date();
      workbook.modified = new Date();
      workbook.properties.date1904 = false;

      const worksheet = workbook.addWorksheet(this.SHEET_NAME);

      // 5. 初始化工作表（设置表头和格式）
      this.initializeWorksheet(worksheet);

      // 6. 添加数据行
      let rowNumber = 2; // 第1行是表头
      for (let i = 0; i < sortedTasks.length; i++) {
        const task = sortedTasks[i];
        const sequenceNumber = i + 1; // 序号从1开始
        const rowData = this.taskToExcelRow(task, sequenceNumber);

        const row = worksheet.addRow(rowData);

        // 应用格式
        this.applyRowFormatting(row, task);
        rowNumber++;
      }

      // 7. 添加统计行
      const stats = {
        AT: sortedTasks.filter((t) => t.jobType === "AT").length,  // 修改：使用 task.jobType
        AC: sortedTasks.filter((t) => t.jobType === "AC").length,  // 修改：使用 task.jobType
        AQ: sortedTasks.filter((t) => t.jobType === "AQ").length,  // 修改：使用 task.jobType
        AS: sortedTasks.filter((t) => t.jobType === "AS").length,  // 修改：使用 task.jobType
        AP: sortedTasks.filter((t) => t.jobType === "AP").length,  // 修改：使用 task.jobType
      };
      const total = sortedTasks.length;

      // 添加空行分隔
      worksheet.addRow([]);

      // 添加统计行
      const statsRow = worksheet.addRow([
        "",
        "STATISTICS",
        `AT: ${stats.AT}`,
        `AC: ${stats.AC}`,
        `AQ: ${stats.AQ}`,
        `AS: ${stats.AS}`,
        `AP: ${stats.AP}`,
        `Total: ${total}`,
      ]);

      // 统计行特殊格式
      statsRow.font = { ...EXCEL_CONFIG.FONT, bold: true, size: 12 };
      statsRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFEB3B" }, // 黄色背景
      };
      statsRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: "medium" },
          left: { style: "thin" },
          bottom: { style: "medium" },
          right: { style: "thin" },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });

      // 8. 添加导出信息行
      worksheet.addRow([]);
      const infoRow = worksheet.addRow([
        "",
        "Exported At:",
        new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" }),
        "",
        "Total Records:",
        total,
      ]);
      infoRow.font = { ...EXCEL_CONFIG.FONT, italic: true, size: 10 };

      // 9. 生成 Buffer
      const buffer = await workbook.xlsx.writeBuffer();

      logger.info("Excel导出成功", {
        totalRecords: total,
        bufferSize: Buffer.byteLength(buffer),
      });

      return Buffer.from(buffer);
    } catch (error: any) {
      logger.error("Excel导出失败", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}
