/**
 * Excel操作辅助函数
 * 提供通用的Excel行更新、日期格式化等功能
 */

import ExcelJS from 'exceljs';
import fs from 'fs-extra';
import path from 'path';
import { logger } from './logger';
import { OneDriveApiService } from '../services/oneDriveApiService';

const EXCEL_LOCAL_PATH = process.env.EXCEL_LOCAL_PATH || path.join(process.cwd(), '../data/LJA Job Register Rev3.xlsx');
const EXCEL_ONEDRIVE_PATH = process.env.EXCEL_ONEDRIVE_PATH || '';

/**
 * 格式化日期为 DD/MM/YYYY
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';

  try {
    const d = date instanceof Date ? date : new Date(date);

    // 检查日期是否有效
    if (isNaN(d.getTime())) return '';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    logger.warn(`日期格式化失败: ${date}`, { error });
    return '';
  }
}

/**
 * 更新Excel单行数据
 */
export async function updateProjectRow(
  worksheet: ExcelJS.Worksheet,
  project: any,
  rowNumber: number
): Promise<void> {
  const row = worksheet.getRow(rowNumber);

  // 更新所有列
  // jobType 已删除 - jobType 只在 task 级别定义，此函数已废弃
  row.getCell('A').value = ''; // project.jobType 已删除
  row.getCell('B').value = project.projectCode;
  row.getCell('C').value = project.status;
  row.getCell('D').value = project.approvalStatus;
  row.getCell('E').value = project.clientCompany;
  row.getCell('F').value = project.mineSiteName;
  row.getCell('G').value = project.name;
  row.getCell('H').value = project.mineralType;
  row.getCell('I').value = project.contactPerson || '';
  row.getCell('J').value = project.owner?.realName || '';
  row.getCell('K').value = project.quotationNumber || '';
  row.getCell('L').value = formatDate(project.requestDate);
  row.getCell('M').value = formatDate(project.quotationProvidedDate);
  row.getCell('N').value = project.feedbackFromClient || '';
  row.getCell('O').value = project.notes || '';
  row.getCell('P').value = project.description || '';
  row.getCell('Q').value = project.oneDriveFolderPath || '';

  // 提交行更新
  row.commit();
}

/**
 * 打开Excel工作簿
 * 优先从本地读取，本地不存在时从 OneDrive 下载
 */
export async function openExcelWorkbook(): Promise<{ workbook: ExcelJS.Workbook; worksheet: ExcelJS.Worksheet }> {
  const workbook = new ExcelJS.Workbook();

  if (await fs.pathExists(EXCEL_LOCAL_PATH)) {
    await workbook.xlsx.readFile(EXCEL_LOCAL_PATH);
  } else if (EXCEL_ONEDRIVE_PATH) {
    // 本地不存在，尝试从 OneDrive 下载
    const buffer = await OneDriveApiService.downloadFileAsBuffer(EXCEL_ONEDRIVE_PATH);
    if (buffer) {
      await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
      logger.info('从 OneDrive 下载 Excel 工作簿成功', { path: EXCEL_ONEDRIVE_PATH });
    } else {
      throw new Error(`Excel文件不存在: 本地(${EXCEL_LOCAL_PATH})和OneDrive(${EXCEL_ONEDRIVE_PATH})均不可用`);
    }
  } else {
    throw new Error(`Excel文件不存在: ${EXCEL_LOCAL_PATH}`);
  }

  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) {
    throw new Error('工作表不存在');
  }

  return { workbook, worksheet };
}

/**
 * 保存Excel工作簿
 * 保存到本地文件，并通过 Graph API 上传到 OneDrive
 */
export async function saveExcelWorkbook(workbook: ExcelJS.Workbook): Promise<void> {
  // 保存本地文件
  await workbook.xlsx.writeFile(EXCEL_LOCAL_PATH);
  logger.debug('Excel本地文件已保存', { path: EXCEL_LOCAL_PATH });

  // 通过 Graph API 上传到 OneDrive
  if (EXCEL_ONEDRIVE_PATH) {
    const arrayBuffer = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.from(arrayBuffer as ArrayBuffer);
    const result = await OneDriveApiService.uploadFile(EXCEL_ONEDRIVE_PATH, buffer);
    if (result.success) {
      logger.debug('Excel通过Graph API上传到OneDrive', { path: EXCEL_ONEDRIVE_PATH, skipped: result.skipped });
    } else {
      logger.warn('Excel上传到OneDrive失败', { path: EXCEL_ONEDRIVE_PATH, error: result.error });
    }
  }
}

/**
 * 标记Excel行为已删除（软删除）
 */
export async function markRowAsDeleted(
  worksheet: ExcelJS.Worksheet,
  rowNumber: number
): Promise<void> {
  const row = worksheet.getRow(rowNumber);

  // 在备注列添加删除标记
  const currentComment = row.getCell('O').value?.toString() || '';
  const timestamp = new Date().toISOString();
  row.getCell('O').value = `[已删除 ${timestamp}] ${currentComment}`;

  // 修改行颜色为灰色
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }  // 灰色
    };
  });

  row.commit();
}
