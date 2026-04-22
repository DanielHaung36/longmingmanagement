/**
 * 统一日志工具（增强版）
 * - 支持日志级别控制（环境变量）
 * - 自动追踪代码位置（文件名、行号）
 * - 优化Excel日志（不输出重复内容）
 * - 结构化日志输出
 */
export declare enum LogLevel {
    ERROR = "ERROR",
    WARN = "WARN",
    INFO = "INFO",
    DEBUG = "DEBUG"
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
declare class Logger {
    private isDevelopment;
    private currentLogLevel;
    private lastExcelLog;
    constructor();
    /**
     * 检查是否应该输出日志
     */
    private shouldLog;
    /**
     * 格式化时间戳
     */
    private getTimestamp;
    /**
     * 获取调用栈信息（文件名和行号）
     */
    private getCallerInfo;
    /**
     * 格式化日志前缀（包含代码位置）
     */
    private formatPrefix;
    /**
     * 设置日志级别（运行时动态修改）
     */
    setLogLevel(level: LogLevel): void;
    /**
     * 获取当前日志级别
     */
    getLogLevel(): LogLevel;
    /**
     * 记录错误
     */
    error(message: string, context?: LogContext, error?: Error): void;
    /**
     * 记录警告
     */
    warn(message: string, context?: LogContext): void;
    /**
     * 记录信息
     */
    info(message: string, context?: LogContext): void;
    /**
     * 记录调试信息
     */
    debug(message: string, context?: LogContext): void;
    /**
     * 格式化上下文对象（简化输出）
     */
    private formatContext;
    /**
     * 记录HTTP请求
     */
    request(method: string, path: string, userId?: number, statusCode?: number, duration?: number): void;
    /**
     * 记录数据库操作
     */
    database(operation: string, table: string, recordId?: number | string, duration?: number): void;
    /**
     * 记录文件操作
     */
    file(operation: string, filePath: string, success?: boolean): void;
    /**
     * 记录Excel同步（优化：不重复输出）
     */
    excel(message: string, recordCount?: number, skipDuplicate?: boolean): void;
    /**
     * 记录审批流程
     */
    approval(action: string, projectCode: string, userId: number, result: 'approved' | 'rejected'): void;
    /**
     * 记录性能指标
     */
    performance(operation: string, duration: number, metadata?: Record<string, any>): void;
    /**
     * 一键切换到DEBUG模式
     */
    enableDebug(): void;
    /**
     * 一键切换到INFO模式
     */
    enableInfo(): void;
    /**
     * 一键切换到生产模式（WARN）
     */
    enableProduction(): void;
}
export declare const logger: Logger;
export declare const enableDebugLog: () => void;
export declare const enableInfoLog: () => void;
export declare const enableProductionLog: () => void;
export {};
//# sourceMappingURL=logger.d.ts.map