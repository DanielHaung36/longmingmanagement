/**
 * 数据库导入逻辑
 * 根据 OneDrive 扫描结果 + Excel 数据创建 Project 与 Task
 */

import { PrismaClient, Prisma, JobType, TaskStatus, Priority, UserRole, users as PrismaUserModel } from '@prisma/client';
import bcrypt from 'bcrypt';
import { ClientCompanyInfo, MineSiteInfo, TaskFolderInfo } from './scanOneDrive';
import { ExcelTaskData, ExcelDataMap } from './readExcelData';
import { isValidTaskCode } from '../utils/taskCodeParser';
import { ProjectNumberService } from '../services/projectNumberService';

interface ImportConfig {
  useProduction: boolean;
  oneDriveRoot: string;
  oneDriveProjectRoot: string;
  localProjectRoot: string;
}

export interface ImportResult {
  projectsCreated: number;
  tasksCreated: number;
  tasksFailed: number;
  excelDataUsed: number;
  excelDataMissing: number;
  errors: string[];
  warnings: string[];
}

type PrismaUser = Awaited<ReturnType<typeof getOrCreateDefaultUser>>;

const PROJECT_CODE_PATTERN = /^[A-Z]{2}\d{4}$/;

const DEFAULT_USER_PASSWORD = process.env.DEFAULT_USER_PASSWORD || 'Longi@123';
const parsedRounds = Number.parseInt(process.env.DEFAULT_USER_PASSWORD_SALT_ROUNDS ?? '', 10);
const DEFAULT_PASSWORD_SALT_ROUNDS =
  Number.isNaN(parsedRounds) || parsedRounds <= 0 ? 10 : parsedRounds;

let defaultPasswordHashPromise: Promise<string> | null = null;

function getDefaultPasswordHash(): Promise<string> {
  if (!defaultPasswordHashPromise) {
    defaultPasswordHashPromise = bcrypt.hash(DEFAULT_USER_PASSWORD, DEFAULT_PASSWORD_SALT_ROUNDS);
  }
  return defaultPasswordHashPromise;
}

async function passwordMatchesDefaultPassword(hash: string | null | undefined): Promise<boolean> {
  if (!hash) return false;
  try {
    return await bcrypt.compare(DEFAULT_USER_PASSWORD, hash);
  } catch {
    return false;
  }
}
/**
 * 获取或创建默认用户（admin）
 */
async function getOrCreateDefaultUser(prisma: PrismaClient) {
  let user = await prisma.users.findFirst({
    where: { username: 'admin' },
  });

  if (!user) {
    const timestamp = Date.now();
    try {
      user = await prisma.users.create({
        data: {
          username: 'admin',
          email: 'admin@ljmagnet.com',
          realName: 'System Admin',
          password: await getDefaultPasswordHash(),
          status: 'ACTIVE',
          role: 'ADMIN',
          cognitoId: `admin-cognito-${timestamp}`,
        },
      });
      console.log(`   ✅ 创建默认用户: admin (ID: ${user.id}, Role: ADMIN, 使用统一密码)`);
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        user = await prisma.users.findFirst({
          where: { username: 'admin' },
        });
        if (!user) {
          throw error;
        }
      } else {
        throw error;
      }
    }
  }

  if (!user) {
    throw new Error('Admin 用户创建失败');
  }

  const updateData: Prisma.usersUpdateInput = {};
  const needsRoleUpdate = user.role !== 'ADMIN' && user.role !== 'MANAGER';
  if (needsRoleUpdate) {
    updateData.role = 'ADMIN';
  }

  const hasDefaultPassword = await passwordMatchesDefaultPassword(user.password);
  if (!hasDefaultPassword) {
    updateData.password = await getDefaultPasswordHash();
  }

  if (Object.keys(updateData).length > 0) {
    user = await prisma.users.update({
      where: { id: user.id },
      data: updateData,
    });

    if (needsRoleUpdate && !hasDefaultPassword) {
      console.log(`   🔄 同步管理员角色与默认密码: admin (ID: ${user.id})`);
    } else if (needsRoleUpdate) {
      console.log(`   🔄 更新管理员角色: admin (ID: ${user.id})`);
    } else if (!hasDefaultPassword) {
      console.log(`   🔄 重置管理员为统一默认密码: admin (ID: ${user.id})`);
    }
  } else {
    console.log(`   ✅ 使用现有用户: admin (ID: ${user.id}, Role: ${user.role})`);
  }

  return user;
}


/**
 * 主导入函数
 */
type JobTypeEnum = JobType;
type TaskStatusEnum = TaskStatus;
type PriorityEnum = Priority;

const JOB_TYPE_VALUES: JobTypeEnum[] = ['AC', 'AP', 'AQ', 'AS', 'AT'];
const TASK_STATUS_VALUES: TaskStatusEnum[] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED'];
const PRIORITY_VALUES: PriorityEnum[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export async function importToDatabase(
  prisma: PrismaClient,
  scanResult: {
    clients: ClientCompanyInfo[];
  },
  excelDataMap: ExcelDataMap,
  config: ImportConfig
): Promise<ImportResult> {
  const result: ImportResult = {
    projectsCreated: 0,
    tasksCreated: 0,
    tasksFailed: 0,
    excelDataUsed: 0,
    excelDataMissing: 0,
    errors: [],
    warnings: [],
  };

  try {
    const user = await getOrCreateDefaultUser(prisma);
    const syntheticSequenceCache = new Map<JobTypeEnum, number>();
    const namedUserCache = new Map<string, PrismaUserModel>();
    const projectOwnerAssigned = new Map<number, boolean>();

    // 🔥 新增：预先从Excel创建所有用户
    console.log('\n👥 正在从Excel预创建用户...');
    await preCreateUsersFromExcel(prisma, excelDataMap, namedUserCache);
    console.log(`   ✅ 已预创建 ${namedUserCache.size} 个用户`);

    for (const client of scanResult.clients) {
      for (const mineSite of client.mineSites) {
        try {
          const jobType = determineProjectJobType(mineSite, excelDataMap);
          const projectCode = await determineProjectCode(mineSite, excelDataMap, jobType, client.name, mineSite.name);

          const project = await createProject(
            prisma,
            {
              clientName: client.name,
              mineSiteName: mineSite.name,
              mineSitePath: mineSite.path,
              jobType,
              projectCode,
            },
            config,
            user
          );

          result.projectsCreated++;
          projectOwnerAssigned.set(project.id, project.ownerId !== user.id);

          for (const taskFolder of mineSite.taskFolders) {
            await createTask(
              prisma,
              project.id,
              taskFolder,
              client.name,
              mineSite.name,
              jobType, // 使用本地推断的 jobType，而不是 project.jobType
              syntheticSequenceCache,
              namedUserCache,
              projectOwnerAssigned,
              excelDataMap,
              config,
              user,
              result
            );
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          result.errors.push(`处理 ${client.name} - ${mineSite.name} 失败: ${errorMsg}`);
        }
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    result.errors.push(`导入过程中出现致命错误: ${errorMsg}`);
  }

  return result;
}

/**
 * 生成导入报告
 */
export function generateImportReport(result: ImportResult): string {
  let report = `\n╔════════════════════════════════════════════════════╗\n`;
  report += `║                数据库导入报告                       ║\n`;
  report += `╚════════════════════════════════════════════════════╝\n\n`;

  report += `导入统计:\n`;
  report += `  • Projects 创建: ${result.projectsCreated}\n`;
  report += `  • Tasks 创建: ${result.tasksCreated}\n`;
  report += `  • Tasks 失败: ${result.tasksFailed}\n`;
  report += `  • Excel 数据匹配成功: ${result.excelDataUsed}\n`;
  report += `  • Excel 数据缺失: ${result.excelDataMissing}\n\n`;

  const denominator = result.tasksCreated + result.tasksFailed;
  const successRate = denominator === 0 ? 0 : ((result.tasksCreated / denominator) * 100).toFixed(2);
  report += `  • 成功率: ${successRate}%\n\n`;

  if (result.warnings.length > 0) {
    report += `⚠️  警告:\n`;
    result.warnings.slice(0, 10).forEach((warning) => {
      report += `   • ${warning}\n`;
    });
    if (result.warnings.length > 10) {
      report += `   ... 还有 ${result.warnings.length - 10} 条警告\n`;
    }
    report += '\n';
  }

  if (result.errors.length > 0) {
    report += `❌ 错误 (最多显示 10 条):\n`;
    result.errors.slice(0, 10).forEach((error) => {
      report += `   • ${error}\n`;
    });
    if (result.errors.length > 10) {
      report += `   ... 还有 ${result.errors.length - 10} 条错误\n`;
    }
    report += '\n';
  }

  return report;
}

/**
 * 创建 Project
 */
async function createProject(
  prisma: PrismaClient,
  projectInfo: {
    clientName: string;
    mineSiteName: string;
    mineSitePath: string;
    jobType: JobTypeEnum;
    projectCode: string;
  },
  config: ImportConfig,
  user: PrismaUser
) {
  const projectName = `${projectInfo.clientName} - ${projectInfo.mineSiteName}`;
  const oneDrivePath = resolveOneDrivePath(projectInfo.mineSitePath, config);

  try {
    return await prisma.projects.create({
      data: {
        name: projectName,
        description: `Project for ${projectName}`,
        projectCode: projectInfo.projectCode,
        // jobType 已删除 - jobType 只在 task 级别定义
        clientCompany: projectInfo.clientName,
        mineSiteName: projectInfo.mineSiteName,
        status: 'IN_PROGRESS',
        approvalStatus: 'APPROVED',
        priority: 'MEDIUM',
        ownerId: user.id,
        oneDriveMineSiteFolderPath: oneDrivePath,
        mineSiteFolderPath: normalizeSeparators(projectInfo.mineSitePath),
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`创建项目 ${projectName} 失败: ${errorMsg}`);
  }
}

/**
 * 创建 Task
 */
async function createTask(
  prisma: PrismaClient,
  projectId: number,
  taskFolderInfo: TaskFolderInfo,
  clientName: string,
  mineSiteName: string,
  projectJobType: JobTypeEnum,
  syntheticSequenceCache: Map<JobTypeEnum, number>,
  namedUserCache: Map<string, PrismaUserModel>,
  projectOwnerAssigned: Map<number, boolean>,
  excelDataMap: ExcelDataMap,
  config: ImportConfig,
  user: PrismaUser,
  result: ImportResult
): Promise<void> {
  try {
    const normalizedOriginalPath = normalizeSeparators(taskFolderInfo.fullPath);
    const originalTaskCode = (taskFolderInfo.taskCode || '').trim();
    const excelData = originalTaskCode
      ? takeExcelData(originalTaskCode, excelDataMap, clientName, mineSiteName)
      : undefined;

    let taskCode = originalTaskCode;
    let generatedNewCode = false;
    const jobTypeForSynthetic = projectJobType ?? ('AT' as JobTypeEnum);

    if (!taskCode || !isValidTaskCode(taskCode)) {
      const existingByPath = await prisma.tasks.findFirst({
        where: { originalOneDrivePath: normalizedOriginalPath },
        select: { taskCode: true },
      });

      if (existingByPath?.taskCode) {
        taskCode = existingByPath.taskCode;
      } else {
        taskCode = await generateSyntheticTaskCode(
          prisma,
          jobTypeForSynthetic,
          syntheticSequenceCache
        );
        generatedNewCode = true;
      }
    }

    const existingTask = await prisma.tasks.findUnique({
      where: { taskCode },
      select: {
        id: true,
        projectId: true,
        originalOneDrivePath: true,
      },
    });

    if (existingTask) {
      if (
        existingTask.originalOneDrivePath &&
        existingTask.originalOneDrivePath.toLowerCase() === normalizedOriginalPath.toLowerCase()
      ) {
        result.warnings.push(`检测到重复导入的任务 ${taskCode}，已忽略`);
        return;
      }

      taskCode = await generateSyntheticTaskCode(prisma, jobTypeForSynthetic, syntheticSequenceCache);
      generatedNewCode = true;
    }

    if (generatedNewCode) {
      result.warnings.push(
        `为文件夹 ${taskFolderInfo.originalName} 自动生成任务编号 ${taskCode}`
      );
    }

    const status = normalizeStatus(excelData?.status);
    const priority = normalizePriority(excelData?.priority);
    const progress = determineProgress(excelData?.progress, status);
    const estimatedHours = toOptionalInt(excelData?.estimatedHours);
    const actualHours = toOptionalInt(excelData?.actualHours);
    const startDate = parseExcelDate(excelData?.startDate);
    const dueDate = parseExcelDate(excelData?.dueDate);
    const requestDate = parseExcelDate(excelData?.requestDate);
    const quotationDate = parseExcelDate(excelData?.quotationDate);

    const taskTitle = excelData?.title?.trim() || taskFolderInfo.title || taskFolderInfo.originalName;
    const taskDescription =
      excelData?.description?.trim() || `Task folder: ${taskFolderInfo.originalName}`;

    const managerName = excelData?.projectManager?.trim();
    const managerUser = managerName
      ? await getOrCreateUserByRealName(prisma, managerName, namedUserCache, UserRole.USER)
      : null;

    if (managerUser && !projectOwnerAssigned.get(projectId)) {
      await prisma.projects.update({
        where: { id: projectId },
        data: { ownerId: managerUser.id },
      });
      projectOwnerAssigned.set(projectId, true);
    }

    const oneDrivePath = resolveOneDrivePath(taskFolderInfo.fullPath, config);
    const localPath = resolveLocalPath(taskFolderInfo.fullPath, config);

    // 确定任务的 jobType：优先使用 Excel 数据，其次从 taskCode 提取，最后使用 projectJobType
    let taskJobType: JobTypeEnum = projectJobType;
    if (excelData?.jobTypeCode) {
      taskJobType = excelData.jobTypeCode as JobTypeEnum;
    } else {
      // 从 taskCode 提取 jobType (例如 AT0001 -> AT)
      const match = taskCode.match(/^([A-Z]{2})\d+$/);
      if (match) {
        taskJobType = match[1] as JobTypeEnum;
      }
    }

    await prisma.tasks.create({
      data: {
        taskCode,
        title: taskTitle,
        description: taskDescription,
        jobType: taskJobType,  // 重要：Task 级别的 jobType
        mineral: excelData?.mineral || '',
        status,
        priority,
        approvalStatus: 'APPROVED',
        projectId,
        authorUserId: user.id,
        assignedUserId: managerUser?.id ?? user.id,
        startDate,
        dueDate,
        estimatedHours,
        actualHours,
        progress,
        localFolderPath: localPath,
        oneDriveFolderPath: oneDrivePath,
        originalOneDrivePath: normalizedOriginalPath,
        folderCreated: true,
        excelRowNumber: excelData?.rowNumber,
        syncStatus: 'SYNCED',
        contactCompany: excelData?.contactCompany,
        projectManager: managerName || excelData?.projectManager,
        quotationNumber: excelData?.quotationNumber,
        requestDate,
        quotationDate,
        clientFeedback: excelData?.clientFeedback,
        excelComment: excelData?.comment,
      },
    });

    result.tasksCreated++;
    if (excelData) {
      result.excelDataUsed++;
    } else {
      result.excelDataMissing++;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const codeForLog = taskFolderInfo.taskCode || taskFolderInfo.originalName;
    result.errors.push(`创建任务 ${codeForLog} 失败: ${errorMsg}`);
    result.tasksFailed++;
  }
}

/**
 * 根据 Excel/Task 文件夹数据判断 Project Job Type
 */
function determineProjectJobType(mineSite: MineSiteInfo, excelDataMap: ExcelDataMap): JobTypeEnum {
  const counts = new Map<JobTypeEnum, number>();

  for (const taskFolder of mineSite.taskFolders) {
    const excelList = peekExcelData(taskFolder.taskCode, excelDataMap);
    for (const excel of excelList) {
      const code = excel.jobTypeCode?.toUpperCase();
      if (code && isValidJobType(code)) {
        const jobType = code as JobTypeEnum;
        counts.set(jobType, (counts.get(jobType) || 0) + 1);
      }
    }

    if (taskFolder.businessType && isValidJobType(taskFolder.businessType)) {
      const jobType = taskFolder.businessType as JobTypeEnum;
      counts.set(jobType, (counts.get(jobType) || 0) + 1);
    }
  }

  if (counts.size === 0) {
    return 'AT';
  }

  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  return sorted[0][0];
}

/**
 * 生成项目编号
 */
async function determineProjectCode(
  mineSite: MineSiteInfo,
  excelDataMap: ExcelDataMap,
  jobType: JobTypeEnum,
  clientName: string,
  mineSiteName: string
): Promise<string> {
  // 💡 强制使用新的 ProjectNumberService 生成项目编号
  // ProjectCode 格式: 2025-AQ-RTV-001
  // TaskCode 格式: AQ0043 (保持不变)
  return await ProjectNumberService.generateProjectNumber(mineSiteName);
}

/**
 * 生成暂时的项目编号
 */
function generateTempCode(jobType: JobTypeEnum, client: string, mineSite: string): string {
  const jobTypeCode = (jobType as string) || 'AT';
  const safeJobType = isValidJobType(jobTypeCode) ? jobTypeCode : 'TP';
  const slug = (str: string) => str.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase() || 'XXXX';
  return `${safeJobType}-${slug(client)}-${slug(mineSite)}-${Date.now().toString().slice(-6)}`;
}

/**
 * 从 Excel 数据中取出最佳匹配（优先匹配客户 & 矿区）
 */
function takeExcelData(
  taskCode: string,
  excelDataMap: ExcelDataMap,
  clientName: string,
  mineSiteName: string
): ExcelTaskData | undefined {
  const list = excelDataMap.get(taskCode);
  if (!list || list.length === 0) {
    return undefined;
  }

  const matchIndex = list.findIndex(
    (item) =>
      equalsIgnoreCase(item.clientCompany, clientName) &&
      equalsIgnoreCase(item.mineSiteName, mineSiteName)
  );

  const data = matchIndex >= 0 ? list.splice(matchIndex, 1)[0] : list.shift();
  if (list.length === 0) {
    excelDataMap.delete(taskCode);
  }
  return data;
}

/**
 * 查看 Excel 数据（不移除）
 */
function peekExcelData(taskCode: string, excelDataMap: ExcelDataMap): ExcelTaskData[] {
  return excelDataMap.get(taskCode) ? [...excelDataMap.get(taskCode)!] : [];
}

/**
 * 解析日期字符串
 */
function parseExcelDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (trimmed === '') return undefined;

  const numeric = Number(trimmed);
  if (!Number.isNaN(numeric) && numeric > 25569) {
    // 处理 Excel 序列号（基准 1899-12-30）
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const millis = excelEpoch.getTime() + numeric * 24 * 60 * 60 * 1000;
    const result = new Date(millis);
    return Number.isNaN(result.getTime()) ? undefined : result;
  }

  const normalized = trimmed
    .replace(/[./]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/年|月/g, '-')
    .replace(/日/g, '');

  const direct = new Date(normalized);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  if (/^\d{8}$/.test(trimmed)) {
    const year = Number(trimmed.slice(0, 4));
    const month = Number(trimmed.slice(4, 6)) - 1;
    const day = Number(trimmed.slice(6, 8));
    const date = new Date(year, month, day);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  return undefined;
}

function determineProgress(progress: number | undefined, status: TaskStatusEnum): number {
  if (progress !== undefined) {
    return clamp(Math.round(progress), 0, 100);
  }
  return status === 'DONE' ? 100 : 50;
}

function normalizeStatus(value?: string): TaskStatusEnum {
  if (!value) return 'IN_PROGRESS';
  const candidate = value.trim().toUpperCase().replace(/\s+/g, '_');
  const normalized = candidate as TaskStatusEnum;
  if (TASK_STATUS_VALUES.includes(normalized)) return normalized;
  if (candidate === 'INPROGRESS') return 'IN_PROGRESS';
  if (candidate === 'COMPLETE' || candidate === 'COMPLETED') return 'DONE';
  return 'IN_PROGRESS';
}

function normalizePriority(value?: string): PriorityEnum {
  if (!value) return 'MEDIUM';
  const candidate = value.trim().toUpperCase().replace(/\s+/g, '_');
  const normalized = candidate as PriorityEnum;
  if (PRIORITY_VALUES.includes(normalized)) return normalized;
  if (candidate === 'NORMAL') return 'MEDIUM';
  if (candidate === 'URGENTLY') return 'URGENT';
  return 'MEDIUM';
}

function resolveOneDrivePath(fullPath: string, config: ImportConfig): string {
  const relative = getRelativePath(fullPath, config.oneDriveRoot);
  if (config.useProduction) {
    return normalizeSeparators(fullPath);
  }
  return joinPath(config.oneDriveProjectRoot, relative);
}

function resolveLocalPath(fullPath: string, config: ImportConfig): string {
  const relative = getRelativePath(fullPath, config.oneDriveRoot);
  return joinPath(config.localProjectRoot, relative);
}

function getRelativePath(fullPath: string, root: string): string {
  const normalizedFull = normalizeSeparators(fullPath);
  const normalizedRoot = normalizeSeparators(root);
  if (!normalizedFull.toLowerCase().startsWith(normalizedRoot.toLowerCase())) {
    return '';
  }
  const relative = normalizedFull.slice(normalizedRoot.length);
  return relative.startsWith('/') ? relative : `/${relative}`;
}

function normalizeSeparators(path: string): string {
  return path.replace(/\\/g, '/');
}

function joinPath(base: string, relative: string): string {
  const normalizedBase = normalizeSeparators(base).replace(/\/+$/, '');
  const normalizedRelative = normalizeSeparators(relative || '').replace(/^\/+/, '');
  return `${normalizedBase}/${normalizedRelative}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function equalsIgnoreCase(a?: string, b?: string): boolean {
  return (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();
}

function toOptionalInt(value: number | undefined): number | undefined {
  if (value === undefined || value === null || Number.isNaN(value)) return undefined;
  return Math.round(value);
}

/**
 * 🔥 新增：从Excel预创建所有用户
 */
async function preCreateUsersFromExcel(
  prisma: PrismaClient,
  excelDataMap: ExcelDataMap,
  cache: Map<string, PrismaUserModel>
): Promise<void> {
  const uniqueManagerNames = new Set<string>();

  // 收集所有唯一的项目经理名称
  for (const taskList of excelDataMap.values()) {
    for (const task of taskList) {
      const managerName = task.projectManager?.trim();
      if (managerName) {
        uniqueManagerNames.add(managerName);
      }
    }
  }

  // 批量创建用户
  for (const managerName of uniqueManagerNames) {
    await getOrCreateUserByRealName(
      prisma,
      managerName,
      cache,
      UserRole.USER
    );
  }
}

async function getOrCreateUserByRealName(
  prisma: PrismaClient,
  realName: string,
  cache: Map<string, PrismaUserModel>,
  role: UserRole = UserRole.USER
): Promise<PrismaUserModel | null> {
  const trimmed = realName.trim();
  if (!trimmed) return null;

  const cacheKey = trimmed.toLowerCase();
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  let user = await prisma.users.findFirst({
    where: {
      realName: {
        equals: trimmed,
        mode: 'insensitive',
      },
    },
  });

  if (!user) {
    const baseUsername = slugifyName(trimmed);
    const username = await generateUniqueUsername(prisma, baseUsername);
    const email = await generateUniqueEmail(prisma, username);

    const passwordHash = await getDefaultPasswordHash();
    user = await prisma.users.create({
      data: {
        username,
        email,
        password: passwordHash,
        realName: trimmed,
        status: 'ACTIVE',
        role,
        cognitoId: `imported-${username}-${Date.now()}`,
      },
    });
    console.log(`   ✅ 创建用户: ${trimmed} (${username}, Role: ${role})`);
  } else {
    // 🔥 如果用户已存在但role不对，更新role
    if (user.role !== role) {
      user = await prisma.users.update({
        where: { id: user.id },
        data: { role },
      });
      console.log(`   🔄 更新用户角色: ${trimmed} (${user.username}, Role: USER → ${role})`);
    } else {
      console.log(`   ✅ 使用现有用户: ${trimmed} (${user.username}, Role: ${role})`);
    }
  }

  cache.set(cacheKey, user);
  return user;
}

function slugifyName(value: string): string {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normalized.length > 0) {
    return normalized.substring(0, 24);
  }
  return `user${Date.now().toString().slice(-6)}`;
}

async function generateUniqueUsername(prisma: PrismaClient, base: string): Promise<string> {
  let username = base || 'user';
  let counter = 1;

  while (await prisma.users.findUnique({ where: { username } })) {
    username = `${base}${counter}`;
    counter += 1;
  }

  return username;
}

async function generateUniqueEmail(prisma: PrismaClient, username: string): Promise<string> {
  const domain = 'ljmagnet.com';
  let email = `${username}@${domain}`;
  let counter = 1;

  while (await prisma.users.findUnique({ where: { email } })) {
    email = `${username}${counter}@${domain}`;
    counter += 1;
  }

  return email;
}

async function generateSyntheticTaskCode(
  prisma: PrismaClient,
  jobType: JobTypeEnum,
  sequenceCache: Map<JobTypeEnum, number>
): Promise<string> {
  let nextSequence = sequenceCache.get(jobType);

  if (nextSequence === undefined) {
    const latestTask = await prisma.tasks.findFirst({
      where: { taskCode: { startsWith: jobType } },
      orderBy: { taskCode: 'desc' },
      select: { taskCode: true },
    });

    const startingSequence = latestTask ? parseSequence(latestTask.taskCode) + 1 : 1;
    nextSequence = Math.max(startingSequence, 9000);
  }

  const taskCode = `${jobType}${String(nextSequence).padStart(4, '0')}`;
  sequenceCache.set(jobType, nextSequence + 1);
  return taskCode;
}

function parseSequence(taskCode: string): number {
  const digits = taskCode.substring(2);
  const parsed = parseInt(digits, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function isValidJobType(code: string): code is JobTypeEnum {
  return JOB_TYPE_VALUES.includes(code as JobTypeEnum);
}
