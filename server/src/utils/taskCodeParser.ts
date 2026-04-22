/**
 * Task 编码解析器
 * 从文件夹名称解析 TaskCode 和 Title
 * 格式: {TaskCode} {TaskTitle}
 * 示例: AQ0041 LGS-EX Replacement
 */

export interface ParsedTaskInfo {
  taskCode: string; // AQ0041
  businessType: string; // AQ
  sequenceNumber: number; // 41
  title: string; // LGS-EX Replacement
  isValid: boolean;
  errors: string[];
}

// 有效的业务类型
export const VALID_BUSINESS_TYPES = ['AT', 'AC', 'AQ', 'AS', 'AP'];

const TASK_CODE_PATTERN = /^([A-Z]{2})(\d{4})\s+(.+)$/;
const TASK_CODE_ONLY_PATTERN = /^([A-Z]{2})(\d{4})$/;

/**
 * 解析文件夹名称，提取 TaskCode 和 Title
 */
export function parseTaskFolderName(
  folderName: string
): ParsedTaskInfo {
  const errors: string[] = [];
  const trimmed = folderName.trim();

  // 尝试匹配完整格式: {CODE} {TITLE}
  const match = trimmed.match(TASK_CODE_PATTERN);
  if (match) {
    const [, businessType, sequenceStr, title] = match;
    const sequenceNumber = parseInt(sequenceStr, 10);

    // 验证业务类型
    if (!VALID_BUSINESS_TYPES.includes(businessType)) {
      errors.push(
        `无效的业务类型: ${businessType}，有效值: ${VALID_BUSINESS_TYPES.join(', ')}`
      );
    }

    // 验证序列号范围
    if (sequenceNumber < 1 || sequenceNumber > 9999) {
      errors.push(
        `序列号超出范围: ${sequenceNumber}，应在 1-9999 之间`
      );
    }

    return {
      taskCode: `${businessType}${sequenceStr}`,
      businessType,
      sequenceNumber,
      title: title.trim(),
      isValid: errors.length === 0,
      errors,
    };
  }

  // 尝试仅匹配 TaskCode（没有 Title）
  const codeOnlyMatch = trimmed.match(TASK_CODE_ONLY_PATTERN);
  if (codeOnlyMatch) {
    const [, businessType, sequenceStr] = codeOnlyMatch;
    errors.push(
      `格式不完整：缺少 Title，应为 "{TaskCode} {Title}"，当前: ${trimmed}`
    );

    return {
      taskCode: `${businessType}${sequenceStr}`,
      businessType,
      sequenceNumber: parseInt(sequenceStr, 10),
      title: '',
      isValid: false,
      errors,
    };
  }

  // 格式完全不匹配
  errors.push(
    `无效的文件夹名称格式，应为 "{TaskCode} {Title}"，当前: ${trimmed}`
  );

  return {
    taskCode: '',
    businessType: '',
    sequenceNumber: 0,
    title: trimmed,
    isValid: false,
    errors,
  };
}

/**
 * 验证 TaskCode 格式是否正确
 */
export function isValidTaskCode(taskCode: string): boolean {
  if (taskCode.length !== 6) return false;

  const businessType = taskCode.substring(0, 2);
  const sequenceStr = taskCode.substring(2);

  if (!VALID_BUSINESS_TYPES.includes(businessType)) return false;

  const sequenceNumber = parseInt(sequenceStr, 10);
  return sequenceNumber >= 1 && sequenceNumber <= 9999;
}

/**
 * 从 TaskCode 提取业务类型
 */
export function extractBusinessType(taskCode: string): string | null {
  if (!isValidTaskCode(taskCode)) return null;
  return taskCode.substring(0, 2);
}

/**
 * 从 TaskCode 提取序列号
 */
export function extractSequenceNumber(taskCode: string): number | null {
  if (!isValidTaskCode(taskCode)) return null;
  return parseInt(taskCode.substring(2), 10);
}

/**
 * 批量解析多个文件夹名称
 */
export function parseMultipleFolderNames(
  folderNames: string[]
): Map<string, ParsedTaskInfo> {
  const results = new Map<string, ParsedTaskInfo>();

  for (const folderName of folderNames) {
    const parsed = parseTaskFolderName(folderName);
    results.set(folderName, parsed);
  }

  return results;
}

/**
 * 生成有效的 Task 文件夹名称
 */
export function generateTaskFolderName(
  businessType: string,
  sequenceNumber: number,
  title: string
): string {
  if (!VALID_BUSINESS_TYPES.includes(businessType)) {
    throw new Error(`无效的业务类型: ${businessType}`);
  }

  if (sequenceNumber < 1 || sequenceNumber > 9999) {
    throw new Error(`序列号超出范围: ${sequenceNumber}`);
  }

  const taskCode = `${businessType}${String(sequenceNumber).padStart(4, '0')}`;
  return `${taskCode} ${title}`;
}
