/**
 * 统一日志工具（增强版）
 * - 支持日志级别控制（环境变量）
 * - 自动追踪代码位置（文件名、行号）
 * - 优化Excel日志（不输出重复内容）
 * - 结构化日志输出
 */

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

interface LogContext {
  operation?: string;
  userId?: number;
  projectId?: number;
  file?: string;
  line?: number;
  function?: string;
  [key: string]: any;
}

// 日志级别优先级
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

class Logger {
  private isDevelopment: boolean;
  private currentLogLevel: LogLevel;
  private lastExcelLog: string = '';  // 防止Excel日志重复输出

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';

    // 从环境变量读取日志级别（LOG_LEVEL=DEBUG 或 LOG_LEVEL=INFO）
    const envLogLevel = process.env.LOG_LEVEL?.toUpperCase() as LogLevel;
    this.currentLogLevel = envLogLevel || (this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO);
  }

  /**
   * 检查是否应该输出日志
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] <= LOG_LEVEL_PRIORITY[this.currentLogLevel];
  }

  /**
   * 格式化时间戳
   */
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * 获取调用栈信息（文件名和行号）
   */
  private getCallerInfo(): { file: string; line: number; func: string } | null {
    try {
      const stack = new Error().stack;
      if (!stack) return null;

      // 解析调用栈，获取第4层（跳过Error、getCallerInfo、日志方法本身）
      const stackLines = stack.split('\n');
      const callerLine = stackLines[4] || stackLines[3];

      // 匹配格式: at functionName (C:\path\file.ts:123:45)
      const match = callerLine.match(/at\s+(?:(.+?)\s+\()?(.+?):(\d+):\d+\)?/);

      if (match) {
        const funcName = match[1] || 'anonymous';
        const fullPath = match[2];
        const lineNum = parseInt(match[3]);

        // 提取文件名（去掉路径）
        const fileName = fullPath.split(/[/\\]/).pop() || fullPath;

        return { file: fileName, line: lineNum, func: funcName };
      }
    } catch (error) {
      // 如果获取失败，不影响日志输出
    }
    return null;
  }

  /**
   * 格式化日志前缀（包含代码位置）
   */
  private formatPrefix(level: LogLevel, showLocation: boolean = true): string {
    const timestamp = this.getTimestamp();
    const icons: Record<LogLevel, string> = {
      ERROR: '❌',
      WARN: '⚠️',
      INFO: 'ℹ️',
      DEBUG: '🔍'
    };

    let prefix = `[${timestamp}] ${icons[level]} [${level}]`;

    // 添加代码位置信息（仅在DEBUG级别显示）
    if (showLocation && this.shouldLog(LogLevel.DEBUG)) {
      const caller = this.getCallerInfo();
      if (caller) {
        prefix += ` ${caller.file}:${caller.line} (${caller.func})`;
      }
    }

    return prefix;
  }

  /**
   * 设置日志级别（运行时动态修改）
   */
  setLogLevel(level: LogLevel): void {
    this.currentLogLevel = level;
    console.log(`📝 日志级别已设置为: ${level}`);
  }

  /**
   * 获取当前日志级别
   */
  getLogLevel(): LogLevel {
    return this.currentLogLevel;
  }

  /**
   * 记录错误
   */
  error(message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const prefix = this.formatPrefix(LogLevel.ERROR);
    console.error(prefix, message);

    if (context) {
      console.error('  Context:', this.formatContext(context));
    }

    if (error) {
      console.error('  Error:', error.message);
      if (error.stack) {
        console.error('  Stack:', error.stack);
      }
    }
  }

  /**
   * 记录警告
   */
  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const prefix = this.formatPrefix(LogLevel.WARN);
    console.warn(prefix, message);

    if (context) {
      console.warn('  Context:', this.formatContext(context));
    }
  }

  /**
   * 记录信息
   */
  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const prefix = this.formatPrefix(LogLevel.INFO, false);  // INFO不显示代码位置
    console.log(prefix, message);

    if (context) {
      console.log('  Context:', this.formatContext(context));
    }
  }

  /**
   * 记录调试信息
   */
  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const prefix = this.formatPrefix(LogLevel.DEBUG);
    console.log(prefix, message);

    if (context) {
      console.log('  Context:', this.formatContext(context));
    }
  }

  /**
   * 格式化上下文对象（简化输出）
   */
  private formatContext(context: LogContext): string {
    // 移除undefined和null值
    const cleaned = Object.entries(context)
      .filter(([_, value]) => value !== undefined && value !== null)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    return JSON.stringify(cleaned, null, 2);
  }

  /**
   * 记录HTTP请求
   */
  request(method: string, path: string, userId?: number, statusCode?: number, duration?: number): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const icon = statusCode && statusCode >= 400 ? '❌' : '✅';
    const timestamp = this.getTimestamp();
    const durationStr = duration ? `${duration}ms` : '';
    const userStr = userId ? `User#${userId}` : 'Anonymous';

    console.log(`[${timestamp}] ${icon} [HTTP] ${method} ${path} ${statusCode || ''} ${durationStr} (${userStr})`);
  }

  /**
   * 记录数据库操作
   */
  database(operation: string, table: string, recordId?: number | string, duration?: number): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const timestamp = this.getTimestamp();
    const durationStr = duration ? `${duration}ms` : '';
    const idStr = recordId ? `#${recordId}` : '';

    console.log(`[${timestamp}] 🗄️  [DB] ${operation} ${table}${idStr} ${durationStr}`);
  }

  /**
   * 记录文件操作
   */
  file(operation: string, filePath: string, success: boolean = true): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const timestamp = this.getTimestamp();
    const icon = success ? '📁' : '❌';
    const fileName = filePath.split(/[/\\]/).pop() || filePath;  // 只显示文件名

    console.log(`[${timestamp}] ${icon} [FILE] ${operation}: ${fileName}`);
  }

  /**
   * 记录Excel同步（优化：不重复输出）
   */
  excel(message: string, recordCount?: number, skipDuplicate: boolean = true): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const logContent = `${message} ${recordCount ? `(${recordCount} rows)` : ''}`;

    // 防止重复输出相同的Excel日志
    if (skipDuplicate && this.lastExcelLog === logContent) {
      return;
    }
    this.lastExcelLog = logContent;

    const timestamp = this.getTimestamp();
    const countStr = recordCount ? `${recordCount} rows` : '';

    console.log(`[${timestamp}] 📊 [EXCEL] ${message} ${countStr}`);
  }

  /**
   * 记录审批流程
   */
  approval(action: string, projectCode: string, userId: number, result: 'approved' | 'rejected'): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const timestamp = this.getTimestamp();
    const icon = result === 'approved' ? '✅' : '❌';

    console.log(`[${timestamp}] ${icon} [APPROVAL] ${action} ${projectCode} by User#${userId} - ${result.toUpperCase()}`);
  }

  /**
   * 记录性能指标
   */
  performance(operation: string, duration: number, metadata?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const timestamp = this.getTimestamp();
    const metaStr = metadata ? JSON.stringify(metadata) : '';

    console.log(`[${timestamp}] ⚡ [PERF] ${operation} - ${duration}ms ${metaStr}`);
  }

  /**
   * 一键切换到DEBUG模式
   */
  enableDebug(): void {
    this.setLogLevel(LogLevel.DEBUG);
  }

  /**
   * 一键切换到INFO模式
   */
  enableInfo(): void {
    this.setLogLevel(LogLevel.INFO);
  }

  /**
   * 一键切换到生产模式（WARN）
   */
  enableProduction(): void {
    this.setLogLevel(LogLevel.WARN);
  }
}

export const logger = new Logger();

// 导出便捷函数，用于切换日志级别
export const enableDebugLog = () => logger.enableDebug();
export const enableInfoLog = () => logger.enableInfo();
export const enableProductionLog = () => logger.enableProduction();
