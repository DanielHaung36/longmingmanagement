/**
 * OneDrive 文件夹扫描器
 * 扫描三层结构：客户公司 → 矿区 → Task文件夹
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseTaskFolderName, ParsedTaskInfo } from '../utils/taskCodeParser';
import { getInvalidCharsInFileName } from '../utils/sanitizeFileName';

export interface TaskFolderInfo {
  taskCode: string;
  businessType: string;
  sequenceNumber: number;
  title: string;
  originalName: string; // 原始文件夹名称
  fullPath: string;
  parentPath: string; // 矿区路径
  subFolders: string[]; // 子文件夹列表
  files: string[]; // 文件列表
  hasInvalidName: boolean;
  nameIssues: string[];
  isValid: boolean;
  errors: string[];
}

export interface MineSiteInfo {
  name: string;
  originalName: string;
  path: string;
  parentPath: string; // 客户公司路径
  taskFolders: TaskFolderInfo[];
  totalTasks: number;
  invalidTasks: number;
}

export interface ClientCompanyInfo {
  name: string;
  originalName: string;
  path: string;
  mineSites: MineSiteInfo[];
  totalTasks: number;
  invalidTasks: number;
}

export interface OneDriveScanResult {
  rootPath: string;
  totalClients: number;
  totalMineSites: number;
  totalTasks: number;
  invalidTasks: number;
  clients: ClientCompanyInfo[];
  errors: string[];
}

/**
 * 检查文件夹是否应该跳过（通用信息文件夹和模板文件夹）
 */
function shouldSkipFolder(folderName: string): boolean {
  const skipPatterns = [
    /^01\s+client\s+general\s+info$/i,
    /^01\s+project\s+general\s+info$/i,
    /^01\s+general\s+info$/i,
    /^general\s+info$/i,
    /template/i,  // Skip any folder containing "template"
  ];

  return skipPatterns.some((pattern) => pattern.test(folderName));
}

/**
 * 获取文件夹内的所有子项
 */
function getDirectoryContents(
  dirPath: string
): {
  folders: string[];
  files: string[];
} {
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    const folders: string[] = [];
    const files: string[] = [];

    for (const item of items) {
      if (item.isDirectory()) {
        folders.push(item.name);
      } else if (item.isFile()) {
        files.push(item.name);
      }
    }

    return { folders, files };
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
    return { folders: [], files: [] };
  }
}

/**
 * 扫描 Task 文件夹
 */
function scanTaskFolder(
  taskFolderPath: string,
  taskFolderName: string,
  mineSitePath: string
): TaskFolderInfo {
  const errors: string[] = [];
  const nameIssueInfo = getInvalidCharsInFileName(taskFolderName);

  // 解析 TaskCode 和 Title
  const parsed = parseTaskFolderName(taskFolderName);
  if (!parsed.isValid) {
    errors.push(...parsed.errors);
  }

  // 获取子文件夹和文件
  const { folders, files } = getDirectoryContents(taskFolderPath);

  return {
    taskCode: parsed.taskCode,
    businessType: parsed.businessType,
    sequenceNumber: parsed.sequenceNumber,
    title: parsed.title,
    originalName: taskFolderName,
    fullPath: taskFolderPath,
    parentPath: mineSitePath,
    subFolders: folders,
    files: files,
    hasInvalidName: nameIssueInfo.hasInvalidChars,
    nameIssues: nameIssueInfo.issues,
    isValid: parsed.isValid && !nameIssueInfo.hasInvalidChars,
    errors: [...errors, ...nameIssueInfo.issues],
  };
}

/**
 * 扫描矿区
 */
function scanMineSite(
  mineSitePath: string,
  mineSiteName: string,
  clientPath: string
): MineSiteInfo {
  const { folders } = getDirectoryContents(mineSitePath);
  const taskFolders: TaskFolderInfo[] = [];
  let invalidTaskCount = 0;

  for (const folder of folders) {
    // 跳过通用信息文件夹
    if (shouldSkipFolder(folder)) {
      continue;
    }

    const taskFolderPath = path.join(mineSitePath, folder);
    const taskInfo = scanTaskFolder(taskFolderPath, folder, mineSitePath);

    if (!taskInfo.isValid) {
      invalidTaskCount++;
    }

    taskFolders.push(taskInfo);
  }

  return {
    name: mineSiteName,
    originalName: mineSiteName,
    path: mineSitePath,
    parentPath: clientPath,
    taskFolders,
    totalTasks: taskFolders.length,
    invalidTasks: invalidTaskCount,
  };
}

/**
 * 扫描客户公司
 */
function scanClientCompany(
  clientPath: string,
  clientName: string
): ClientCompanyInfo {
  const { folders } = getDirectoryContents(clientPath);
  const mineSites: MineSiteInfo[] = [];
  let invalidTaskCount = 0;

  for (const folder of folders) {
    // 跳过通用信息文件夹
    if (shouldSkipFolder(folder)) {
      continue;
    }

    const mineSitePath = path.join(clientPath, folder);
    const mineSiteInfo = scanMineSite(mineSitePath, folder, clientPath);

    invalidTaskCount += mineSiteInfo.invalidTasks;
    mineSites.push(mineSiteInfo);
  }

  return {
    name: clientName,
    originalName: clientName,
    path: clientPath,
    mineSites,
    totalTasks: mineSites.reduce((sum, m) => sum + m.totalTasks, 0),
    invalidTasks: invalidTaskCount,
  };
}

/**
 * 主扫描函数：扫描 OneDrive Client 目录
 */
export async function scanOneDrive(
  rootPath: string
): Promise<OneDriveScanResult> {
  const errors: string[] = [];

  // 验证根路径存在
  if (!fs.existsSync(rootPath)) {
    errors.push(`Root path does not exist: ${rootPath}`);
    return {
      rootPath,
      totalClients: 0,
      totalMineSites: 0,
      totalTasks: 0,
      invalidTasks: 0,
      clients: [],
      errors,
    };
  }

  const { folders: clientFolders } = getDirectoryContents(rootPath);
  const clients: ClientCompanyInfo[] = [];
  let totalMineSites = 0;
  let totalTasks = 0;
  let invalidTasks = 0;

  for (const clientFolder of clientFolders) {
    const clientPath = path.join(rootPath, clientFolder);

    try {
      const clientInfo = scanClientCompany(clientPath, clientFolder);

      totalMineSites += clientInfo.mineSites.length;
      totalTasks += clientInfo.totalTasks;
      invalidTasks += clientInfo.invalidTasks;

      clients.push(clientInfo);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(`Error scanning client ${clientFolder}: ${errorMsg}`);
    }
  }

  return {
    rootPath,
    totalClients: clients.length,
    totalMineSites,
    totalTasks,
    invalidTasks,
    clients,
    errors,
  };
}

/**
 * 生成扫描报告
 */
export function generateScanReport(result: OneDriveScanResult): string {
  let report = `\n╔════════════════════════════════════════════════════╗\n`;
  report += `║        OneDrive 文件夹结构扫描报告                 ║\n`;
  report += `╚════════════════════════════════════════════════════╝\n\n`;

  report += `📁 根路径: ${result.rootPath}\n\n`;
  report += `📊 扫描统计:\n`;
  report += `  • 客户公司数: ${result.totalClients}\n`;
  report += `  • 矿区数: ${result.totalMineSites}\n`;
  report += `  • Task 文件夹总数: ${result.totalTasks}\n`;
  report += `  • 无效 Task 文件夹: ${result.invalidTasks}\n\n`;

  // 详细信息
  for (const client of result.clients) {
    report += `\n📦 客户: ${client.name}\n`;
    report += `   路径: ${client.path}\n`;
    report += `   Task 总数: ${client.totalTasks}\n\n`;

    for (const mineSite of client.mineSites) {
      report += `   🏭 矿区: ${mineSite.name}\n`;
      report += `      路径: ${mineSite.path}\n`;
      report += `      Task 数: ${mineSite.totalTasks}\n`;

      // 显示前 5 个 Task
      for (let i = 0; i < Math.min(5, mineSite.taskFolders.length); i++) {
        const task = mineSite.taskFolders[i];
        const status = task.isValid ? '✓' : '✗';
        report += `      ${status} [${task.taskCode}] ${task.title}\n`;
      }

      if (mineSite.taskFolders.length > 5) {
        report += `      ... 还有 ${mineSite.taskFolders.length - 5} 个 Task\n`;
      }
    }
  }

  // 错误信息
  if (result.errors.length > 0) {
    report += `\n⚠️  扫描错误:\n`;
    for (const error of result.errors) {
      report += `   • ${error}\n`;
    }
  }

  return report;
}
