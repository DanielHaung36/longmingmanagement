/**
 * 文件名规范化工具
 * OneDrive 命名规则：
 * - 不能包含: : * ? " < > |
 * - 不能以空格开头或结尾
 * - 不能以点结尾
 * - 不能以两个或多个点开头
 */

export interface SanitizeOptions {
  replaceDirSeparator?: boolean; // 是否将 / 替换为 -
  trimDots?: boolean; // 是否移除开头/结尾的点
  trimSpaces?: boolean; // 是否移除开头/结尾的空格
}

const ONEDRIVE_FORBIDDEN_CHARS = /[:*?"<>|]/g;
const LEADING_DOTS = /^\.{2,}/;
const TRAILING_SPACE = / +$/;
const LEADING_SPACE = /^ +/;
const TRAILING_DOT = /\.+$/;
const FORWARD_SLASH = /\//g;

/**
 * 规范化文件名，使其符合 OneDrive 命名规则
 */
export function sanitizeFileName(
  fileName: string,
  options: SanitizeOptions = {}
): string {
  const {
    replaceDirSeparator = true,
    trimDots = true,
    trimSpaces = true,
  } = options;

  let sanitized = fileName;

  // 删除禁用字符
  sanitized = sanitized.replace(ONEDRIVE_FORBIDDEN_CHARS, '');

  // 将 / 替换为 -
  if (replaceDirSeparator) {
    sanitized = sanitized.replace(FORWARD_SLASH, '-');
  }

  // 移除开头/结尾的空格
  if (trimSpaces) {
    sanitized = sanitized.replace(LEADING_SPACE, '');
    sanitized = sanitized.replace(TRAILING_SPACE, '');
  }

  // 处理开头的多个点
  if (trimDots && LEADING_DOTS.test(sanitized)) {
    sanitized = sanitized.replace(LEADING_DOTS, '');
  }

  // 移除结尾的点
  if (trimDots) {
    sanitized = sanitized.replace(TRAILING_DOT, '');
  }

  return sanitized;
}

/**
 * 验证文件名是否符合 OneDrive 命名规则
 */
export function isValidOneDriveName(fileName: string): boolean {
  // 检查禁用字符
  if (ONEDRIVE_FORBIDDEN_CHARS.test(fileName)) {
    return false;
  }

  // 检查开头/结尾的空格
  if (fileName.startsWith(' ') || fileName.endsWith(' ')) {
    return false;
  }

  // 检查结尾的点
  if (fileName.endsWith('.')) {
    return false;
  }

  // 检查开头的多个点
  if (LEADING_DOTS.test(fileName)) {
    return false;
  }

  return true;
}

/**
 * 获取需要修复的文件名清单
 */
export function getInvalidCharsInFileName(
  fileName: string
): {
  hasInvalidChars: boolean;
  invalidChars: string[];
  issues: string[];
} {
  const invalidChars: string[] = [];
  const issues: string[] = [];

  // 检查禁用字符
  const matches = fileName.match(ONEDRIVE_FORBIDDEN_CHARS);
  if (matches) {
    invalidChars.push(...new Set(matches)); // 去重
    issues.push(`包含禁用字符: ${invalidChars.join(', ')}`);
  }

  // 检查开头/结尾的空格
  if (fileName.startsWith(' ')) {
    issues.push('文件名以空格开头');
  }
  if (fileName.endsWith(' ')) {
    issues.push('文件名以空格结尾');
  }

  // 检查结尾的点
  if (fileName.endsWith('.')) {
    issues.push('文件名以点结尾');
  }

  // 检查开头的多个点
  if (LEADING_DOTS.test(fileName)) {
    issues.push('文件名以多个点开头');
  }

  return {
    hasInvalidChars: invalidChars.length > 0 || issues.length > 0,
    invalidChars,
    issues,
  };
}
