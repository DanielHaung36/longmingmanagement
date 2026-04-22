/**
 * 文件名校验工具
 * 确保文件/文件夹名称符合 OneDrive/SharePoint 的命名规范
 *
 * OneDrive 文件名限制：
 * - 不能以空格开头或结尾
 * - 不能以句点(.)结尾
 * - 不能以两个句点(..)开头
 * - 不能包含以下字符: \ / : * ? " < > |
 * - 某些保留名称不能使用（如 CON, PRN, AUX 等）
 */

export class FileNameValidator {
  // OneDrive 禁止的字符
  private static INVALID_CHARS = /[\\/:*?"<>|]/g;

  // Windows 保留名称（OneDrive 继承了这些限制）
  private static RESERVED_NAMES = [
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
  ];

  /**
   * 清理文件名，使其符合 OneDrive 规范
   * @param fileName - 原始文件名
   * @param replacement - 替换字符（默认为下划线）
   * @returns 清理后的文件名
   */
  static sanitizeFileName(fileName: string, replacement: string = '_'): string {
    if (!fileName || fileName.trim() === '') {
      return 'Unnamed';
    }

    let cleaned = fileName;

    // 1. 替换非法字符为下划线
    cleaned = cleaned.replace(this.INVALID_CHARS, replacement);

    // 2. 去除首尾空格
    cleaned = cleaned.trim();

    // 3. 如果以句点结尾，移除末尾的句点
    while (cleaned.endsWith('.')) {
      cleaned = cleaned.slice(0, -1);
    }

    // 4. 如果以两个句点开头，替换为下划线
    if (cleaned.startsWith('..')) {
      cleaned = replacement + replacement + cleaned.slice(2);
    }

    // 5. 检查是否为保留名称（不区分大小写）
    const upperName = cleaned.toUpperCase();
    if (this.RESERVED_NAMES.includes(upperName)) {
      cleaned = `${cleaned}_folder`;
    }

    // 6. 如果清理后为空或只有替换字符，返回默认名称
    if (!cleaned || cleaned.replace(new RegExp(`\\${replacement}`, 'g'), '').trim() === '') {
      cleaned = 'Unnamed';
    }

    return cleaned;
  }

  /**
   * 验证文件名是否有效
   * @param fileName - 文件名
   * @returns { valid: boolean, errors: string[] }
   */
  static validateFileName(fileName: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!fileName || fileName.trim() === '') {
      errors.push('文件名不能为空');
      return { valid: false, errors };
    }

    // 检查是否包含非法字符
    const invalidChars = fileName.match(this.INVALID_CHARS);
    if (invalidChars) {
      errors.push(`包含非法字符: ${[...new Set(invalidChars)].join(', ')}`);
    }

    // 检查是否以空格开头或结尾
    if (fileName !== fileName.trim()) {
      errors.push('文件名不能以空格开头或结尾');
    }

    // 检查是否以句点结尾
    if (fileName.endsWith('.')) {
      errors.push('文件名不能以句点(.)结尾');
    }

    // 检查是否以两个句点开头
    if (fileName.startsWith('..')) {
      errors.push('文件名不能以两个句点(..)开头');
    }

    // 检查是否为保留名称
    const upperName = fileName.toUpperCase();
    if (this.RESERVED_NAMES.includes(upperName)) {
      errors.push(`"${fileName}" 是系统保留名称，不能使用`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 批量清理路径中的所有部分
   * @param pathParts - 路径部分数组（如：['Client', 'Mine Site', 'Project Name']）
   * @returns 清理后的路径部分数组
   */
  static sanitizePathParts(pathParts: string[]): string[] {
    return pathParts.map(part => this.sanitizeFileName(part));
  }

  /**
   * 清理完整路径
   * @param fullPath - 完整路径（如：'C:/Projects/Client/Mine Site/Project Name'）
   * @returns 清理后的路径
   */
  static sanitizePath(fullPath: string): string {
    const parts = fullPath.split(/[/\\]/);
    const sanitizedParts = parts.map((part, index) => {
      // 保留驱动器号（如 C:）
      if (index === 0 && part.endsWith(':')) {
        return part;
      }
      return this.sanitizeFileName(part);
    });
    return sanitizedParts.join('/');
  }
}
