/**
 * Excel 数据读取工具
 * 读取 LJA Job Register Rev3.xlsm 文件
 * 增强：支持重复 TaskCode、多字段解析、Job Type 自动识别
 */

import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { VALID_BUSINESS_TYPES } from '../utils/taskCodeParser';

export type ExcelDataMap = Map<string, ExcelTaskData[]>;

export interface ExcelTaskData {
  taskCode: string;             // Task 编号 (例如 AT0001)
  taskCodeSource?: string;      // Excel 原始 TaskCode（便于调试）
  projectCode?: string;         // Project Code 列值
  jobTypeCode?: string;         // Job Type（AT/AC/AQ/AS/AP）
  jobTypeName?: string;         // Job Type 文本描述
  title: string;                // 任务标题（Project 列）
  projectName?: string;         // Project 列原始值
  description?: string;         // 任务描述
  clientCompany?: string;       // 客户公司
  mineSiteName?: string;        // 矿区名称
  mineral?: string;             // 矿产品种
  status?: string;              // 任务状态
  priority?: string;            // 优先级
  progress?: number;            // 进度（0-100）
  startDate?: string;           // 开始日期（原始字符串）
  dueDate?: string;             // 截止日期（原始字符串）
  estimatedHours?: number;      // 预估工时
  actualHours?: number;         // 实际工时
  assignedUser?: string;        // 任务负责人
  contactCompany?: string;      // Contact Company/Person
  projectManager?: string;      // Project Manager
  quotationNumber?: string;     // 报价编号
  requestDate?: string;         // Request Date
  quotationDate?: string;       // Quotation Provided Date
  clientFeedback?: string;      // 客户反馈
  comment?: string;             // 备注
  oneDrivePath?: string;        // OneDrive 路径
  rowNumber?: number;           // Excel 中的行号
  rawData?: Record<string, any>; // 原始行数据
}

interface FallbackTaskData {
  job_id: string;
  client?: string;
  mine_site?: string;
  project?: string;
  job_type?: string;
  mineral?: string;
  contact_company?: string;
  project_manager?: string;
  quotation_number?: string;
  request_date?: string | number;
  quotation_date?: string | number;
  client_feedback?: string;
  comment?: string;
  name?: string;
  link?: string;
}

let fallbackDataCache: Map<string, FallbackTaskData> | null = null;

function loadFallbackData(): Map<string, FallbackTaskData> {
  if (fallbackDataCache) {
    return fallbackDataCache;
  }

  try {
    const fallbackPath = path.resolve(__dirname, '../data/excelseed.json');
    if (!fs.existsSync(fallbackPath)) {
      fallbackDataCache = new Map();
      return fallbackDataCache;
    }

    const raw = fs.readFileSync(fallbackPath, 'utf8');
    const parsed = JSON.parse(raw) as FallbackTaskData[];
    const map = new Map<string, FallbackTaskData>();

    for (const item of parsed) {
      if (!item?.job_id) continue;
      const key = String(item.job_id).trim();
      if (!key) continue;
      // Prefer keeping the first entry; if there are duplicates, keep the most complete one
      const existing = map.get(key);
      if (!existing) {
        map.set(key, item);
        continue;
      }

      const existingScore = scoreFallback(existing);
      const newScore = scoreFallback(item);
      if (newScore > existingScore) {
        map.set(key, item);
      }
    }

    fallbackDataCache = map;
  } catch (error) {
    fallbackDataCache = new Map();
  }

  return fallbackDataCache!;
}

function scoreFallback(item: FallbackTaskData): number {
  let score = 0;
  if (item.mineral) score += 2;
  if (item.contact_company) score += 2;
  if (item.project_manager) score += 2;
  if (item.request_date) score += 1;
  if (item.quotation_date) score += 1;
  if (item.client_feedback) score += 1;
  if (item.comment) score += 1;
  if (item.client) score += 1;
  if (item.mine_site) score += 1;
  return score;
}

export interface ExcelReadResult {
  filePath: string;
  sheetName: string;
  totalRows: number;
  dataRows: number;
  tasksByCode: ExcelDataMap;
  allTasks: ExcelTaskData[];
  errors: string[];
  warnings: string[];
}

/**
 * 读取 Excel 文件数据
 */
export async function readExcelData(
  excelFilePath: string,
  sheetName: string = 'Projects'
): Promise<ExcelReadResult> {
  const result: ExcelReadResult = {
    filePath: excelFilePath,
    sheetName,
    totalRows: 0,
    dataRows: 0,
    tasksByCode: new Map(),
    allTasks: [],
    errors: [],
    warnings: [],
  };

  if (!fs.existsSync(excelFilePath)) {
    result.errors.push(`Excel 文件不存在: ${excelFilePath}`);
    return result;
  }

  try {
    const workbook = XLSX.readFile(excelFilePath, { cellFormula: false });

    if (!workbook.SheetNames.includes(sheetName)) {
      if (workbook.SheetNames.length === 0) {
        result.errors.push('Excel 文件中没有可用的工作表');
        return result;
      }
      result.warnings.push(
        `工作表 "${sheetName}" 不存在，自动切换为第一个工作表: ${workbook.SheetNames[0]}`
      );
      result.sheetName = workbook.SheetNames[0];
    }

    const worksheet = workbook.Sheets[result.sheetName];
    if (!worksheet) {
      result.errors.push(`无法读取工作表 ${result.sheetName}`);
      return result;
    }

    // 🔥 跳过第1行标题，从第2行开始读取列名
    const rows = XLSX.utils.sheet_to_json(worksheet, {
      defval: '',
      blankrows: false,
      range: 1, // 跳过第1行标题 "LONGi Magnet Australia Job Register"
    }) as Record<string, any>[];

    result.totalRows = rows.length;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // sheet_to_json 默认第一行是数据，因此 +2 更接近原 Excel 行号

      const taskCodeSource = extractField(row, [
        'TaskCode',
        'Task Code',
        'Code',
        'Job ID',
        'job_id',
        'Project Code',
        'project_code',
      ]);

      const normalizedTaskCode = taskCodeSource || extractField(row, ['TaskID', 'Task Id', 'ID']);

      if (!normalizedTaskCode || normalizedTaskCode.trim() === '') {
        continue;
      }

      try {
        const jobTypeName =
          extractField(row, ['Job Type', 'JobType', 'job_type', 'Job Type Name']) || undefined;
        const jobTypeCode = normalizeJobType(
          extractField(row, ['Job Type Code', 'JobTypeCode', 'job_type_code']),
          jobTypeName,
          normalizedTaskCode
        );

        const progress = parseNumber(
          extractField(row, ['Progress (%)', 'Progress', 'progress'])
        );

        const taskData: ExcelTaskData = {
          taskCode: normalizedTaskCode.trim(),
          taskCodeSource,
          projectCode:
            extractField(row, ['Project Code', 'project_code']) || normalizedTaskCode.trim(),
          jobTypeCode,
          jobTypeName,
          title:
            extractField(row, ['Title', 'Task Title', 'Project', '项目', 'Task']) || '',
          projectName: extractField(row, ['Project', '项目', 'Name']) || '',
          description:
            extractField(row, ['Description', '描述', 'Desc', 'Comment']) || '',
          clientCompany:
            extractField(row, [
              'ClientCompany',
              'Client',
              '客户',
              'Company',
              'client',
            ]) || '',
          mineSiteName:
            extractField(row, [
              'MineSiteName',
              'MineSite',
              'Mine/Site',
              'Site',
              '矿区',
              'MineZone',
              'mine_site',
            ]) || '',
          mineral: extractField(row, ['Mineral', '矿产', 'Product', 'mineral']) || '',
          status:
            extractField(row, ['Status', 'TaskStatus', '状态', 'status']) || '',
          priority:
            extractField(row, ['Priority', '优先级', 'priority']) || '',
          progress: progress !== undefined ? progress : undefined,
          startDate:
            extractField(row, [
              'StartDate',
              'Start Date',
              'Start',
              '开始日期',
              'start_date',
            ]) || '',
          dueDate:
            extractField(row, [
              'DueDate',
              'Due Date',
              'Due',
              '截止日期',
              'due_date',
            ]) || '',
          estimatedHours: parseNumber(
            extractField(row, [
              'EstimatedHours',
              'Estimated Hours',
              'Est. Hours',
              'Estimated',
              'Hours',
              'estimated_hours',
            ])
          ),
          actualHours: parseNumber(
            extractField(row, ['ActualHours', 'Actual Hours', 'actual_hours', 'Actual'])
          ),
          assignedUser:
            extractField(row, ['AssignedUser', 'Assigned', 'User', '分配', 'Assignee']) ||
            '',
          contactCompany:
            extractField(row, [
              'Contact Company(if not the Client)',
              'Contact Company',
              'Contact Person',
              'contact_company',
              'contact_person',
            ]) || '',
          projectManager:
            extractField(row, [
              'Project Manager',
              '项目经理',
              'project_manager',
              'ProjectManager',
            ]) || '',
          quotationNumber:
            extractField(row, [
              'Quotation Number',
              'Quotation/Record Number(HQ)',
              'quotation_number',
              'Record Number',
            ]) || '',
          requestDate:
            extractField(row, [
              'Request Date',
              'RequestDate',
              'request_date',
              'Requested Date',
            ]) || '',
          quotationDate:
            extractField(row, [
              'Quotation Date',
              'Quotation Provided Date',
              'quotation_date',
              'quotation_provided_date',
            ]) || '',
          clientFeedback:
            extractField(row, [
              'Client Feedback',
              'client_feedback',
              'Feedback From Client',
            ]) || '',
          comment:
            extractField(row, ['Comment', '备注', 'comment', 'Comments']) ||
            extractField(row, ['Description', 'Desc']),
          oneDrivePath:
            extractField(row, ['OneDrive Path', 'Link', 'link', 'Path']) || '',
          rowNumber,
          rawData: row,
        };

        applyFallbackData(taskData);
        pushTaskData(result, taskData);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.errors.push(`第 ${rowNumber} 行解析失败: ${errorMsg}`);
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    result.errors.push(`读取 Excel 文件失败: ${errorMsg}`);
  }

  return result;
}

/**
 * 生成 Excel 读取报告
 */
export function generateExcelReadReport(result: ExcelReadResult): string {
  let report = `\n╔════════════════════════════════════════════════════╗\n`;
  report += `║              Excel 数据读取报告                     ║\n`;
  report += `╚════════════════════════════════════════════════════╝\n\n`;

  report += `📄 文件: ${result.filePath}\n`;
  report += `📋 工作表: ${result.sheetName}\n\n`;

  report += `📊 读取统计:\n`;
  report += `  • 总行数: ${result.totalRows}\n`;
  report += `  • 数据行数: ${result.dataRows}\n`;
  report += `  • Task 记录: ${result.allTasks.length}\n`;
  report += `  • 唯一 TaskCode 数: ${result.tasksByCode.size}\n\n`;

  const duplicates = Array.from(result.tasksByCode.entries()).filter(
    ([, list]) => list.length > 1
  );
  if (duplicates.length > 0) {
    report += `⚠️  发现重复 TaskCode (${duplicates.length} 个):\n`;
    duplicates.slice(0, 10).forEach(([code, list]) => {
      const rows = list.map((item) => item.rowNumber || '?').join(', ');
      report += `   • ${code} (行号: ${rows})\n`;
    });
    if (duplicates.length > 10) {
      report += `   ... 还有 ${duplicates.length - 10} 个重复 TaskCode\n`;
    }
    report += '\n';
  }

  const tasksByType: Map<string, number> = new Map();
  for (const task of result.allTasks) {
    const businessType = (task.jobTypeCode || task.taskCode.substring(0, 2)).toUpperCase();
    tasksByType.set(businessType, (tasksByType.get(businessType) || 0) + 1);
  }

  report += `📑 按业务类型统计:\n`;
  for (const [type, count] of Array.from(tasksByType.entries()).sort()) {
    report += `  • ${type}: ${count}\n`;
  }

  report += `\n📋 样例任务 (前 5 条):\n`;
  for (let i = 0; i < Math.min(5, result.allTasks.length); i++) {
    const task = result.allTasks[i];
    report += `  [${task.taskCode}] ${task.title}\n`;
    if (task.clientCompany || task.mineSiteName) {
      report += `    客户: ${task.clientCompany || '-'}，矿区: ${task.mineSiteName || '-'}\n`;
    }
  }
  if (result.allTasks.length > 5) {
    report += `  ... 还有 ${result.allTasks.length - 5} 条记录\n`;
  }

  if (result.warnings.length > 0) {
    report += `\n⚠️  警告:\n`;
    for (const warning of result.warnings) {
      report += `  • ${warning}\n`;
    }
  }

  if (result.errors.length > 0) {
    report += `\n❌ 错误:\n`;
    for (const error of result.errors) {
      report += `  • ${error}\n`;
    }
  }

  return report;
}

/**
 * 导出 Excel 数据为 JSON（用于调试）
 */
export function exportTasksAsJson(tasks: ExcelDataMap): string {
  const data = Array.from(tasks.entries()).flatMap(([taskCode, items]) =>
    items.map((task) => ({
      taskCode,
      title: task.title,
      clientCompany: task.clientCompany,
      mineSiteName: task.mineSiteName,
      jobType: task.jobTypeCode,
      rowNumber: task.rowNumber,
    }))
  );

  return JSON.stringify(data, null, 2);
}

/**
 * 将解析后的 Task 数据放入结果集中
 */
function pushTaskData(result: ExcelReadResult, taskData: ExcelTaskData): void {
  const key = taskData.taskCode;
  if (!result.tasksByCode.has(key)) {
    result.tasksByCode.set(key, []);
  }
  result.tasksByCode.get(key)!.push(taskData);
  result.allTasks.push(taskData);
  result.dataRows++;
}

/**
 * 从行数据中提取字段（尝试多个可能的列名）
 */
function extractField(row: Record<string, any>, columnNames: string[]): string {
  for (const columnName of columnNames) {
    const value = row[columnName];
    if (value !== undefined && value !== null && value !== '') {
      return typeof value === 'string' ? value.trim() : String(value).trim();
    }
  }
  return '';
}

/**
 * 解析数字，兼容带百分号/逗号的字符串
 */
function parseNumber(value: string | undefined): number | undefined {
  if (value === undefined || value === null) return undefined;
  const cleaned = String(value)
    .replace(/[%\s,]/g, '')
    .trim();
  if (cleaned === '') return undefined;
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/**
 * 将 Job Type 规范化成两位业务类型代码
 */
function normalizeJobType(
  jobTypeCodeRaw: string | undefined,
  jobTypeNameRaw: string | undefined,
  taskCode: string
): string | undefined {
  const candidateCode = jobTypeCodeRaw ? jobTypeCodeRaw.trim().toUpperCase() : '';
  if (VALID_BUSINESS_TYPES.includes(candidateCode)) {
    return candidateCode;
  }

  const candidateName = jobTypeNameRaw ? jobTypeNameRaw.trim().toUpperCase() : '';
  const mappedFromName = JOB_TYPE_NAME_MAP[candidateName];
  if (mappedFromName) {
    return mappedFromName;
  }

  const prefix = taskCode.substring(0, 2).toUpperCase();
  return VALID_BUSINESS_TYPES.includes(prefix) ? prefix : undefined;
}

const JOB_TYPE_NAME_MAP: Record<string, string> = {
  TESTWORK: 'AT',
  'TEST WORK': 'AT',
  CONSULTATION: 'AC',
  QUOTATION: 'AQ',
  QUOTE: 'AQ',
  SALES: 'AS',
  PRODUCTION: 'AP',
  'GENERAL INQUIRY': 'AC',
};

function applyFallbackData(taskData: ExcelTaskData): void {
  const fallbackMap = loadFallbackData();
  const fallback = fallbackMap.get(taskData.taskCode);
  if (!fallback) {
    return;
  }

  const setString = (value: string | undefined, fallbackValue: string | undefined): string => {
    const trimmed = (value ?? '').trim();
    if (trimmed) return trimmed;
    return (fallbackValue ?? '').toString().trim();
  };

  const setOptionalString = (
    value: string | undefined,
    fallbackValue: string | undefined
  ): string | undefined => {
    const merged = setString(value, fallbackValue);
    return merged ? merged : undefined;
  };

  const fillIfEmpty = (value: string | undefined, fallbackValue: string | undefined): string => {
    return setString(value, fallbackValue);
  };

  taskData.clientCompany = fillIfEmpty(taskData.clientCompany, fallback.client);
  taskData.mineSiteName = fillIfEmpty(taskData.mineSiteName, fallback.mine_site);
  taskData.mineral = fillIfEmpty(taskData.mineral, fallback.mineral);
  taskData.contactCompany = setOptionalString(taskData.contactCompany, fallback.contact_company);
  taskData.projectManager = setOptionalString(taskData.projectManager, fallback.project_manager);
  taskData.quotationNumber = setOptionalString(taskData.quotationNumber, fallback.quotation_number);
  taskData.requestDate = setOptionalString(
    taskData.requestDate,
    fallback.request_date ? String(fallback.request_date) : undefined
  );
  taskData.quotationDate = setOptionalString(
    taskData.quotationDate,
    fallback.quotation_date ? String(fallback.quotation_date) : undefined
  );
  taskData.clientFeedback = setOptionalString(taskData.clientFeedback, fallback.client_feedback);
  taskData.comment = setOptionalString(taskData.comment, fallback.comment);
  taskData.title = fillIfEmpty(taskData.title, fallback.project || fallback.name);
  taskData.projectName = setOptionalString(taskData.projectName, fallback.project);

  if (!taskData.oneDrivePath && fallback.link) {
    taskData.oneDrivePath = fallback.link;
  }

  if (!taskData.jobTypeName && fallback.job_type) {
    taskData.jobTypeName = fallback.job_type;
  }

  if (!taskData.jobTypeCode && fallback.job_type) {
    const codeFromFallback = fallback.job_type.substring(0, 2).toUpperCase();
    if (VALID_BUSINESS_TYPES.includes(codeFromFallback)) {
      taskData.jobTypeCode = codeFromFallback;
    }
  }
}
