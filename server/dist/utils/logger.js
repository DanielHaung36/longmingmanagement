"use strict";
/**
 * 统一日志工具（增强版）
 * - 支持日志级别控制（环境变量）
 * - 自动追踪代码位置（文件名、行号）
 * - 优化Excel日志（不输出重复内容）
 * - 结构化日志输出
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.enableProductionLog = exports.enableInfoLog = exports.enableDebugLog = exports.logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "ERROR";
    LogLevel["WARN"] = "WARN";
    LogLevel["INFO"] = "INFO";
    LogLevel["DEBUG"] = "DEBUG";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
// 日志级别优先级
const LOG_LEVEL_PRIORITY = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};
class Logger {
    isDevelopment;
    currentLogLevel;
    lastExcelLog = ''; // 防止Excel日志重复输出
    constructor() {
        this.isDevelopment = process.env.NODE_ENV === 'development';
        // 从环境变量读取日志级别（LOG_LEVEL=DEBUG 或 LOG_LEVEL=INFO）
        const envLogLevel = process.env.LOG_LEVEL?.toUpperCase();
        this.currentLogLevel = envLogLevel || (this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO);
    }
    /**
     * 检查是否应该输出日志
     */
    shouldLog(level) {
        return LOG_LEVEL_PRIORITY[level] <= LOG_LEVEL_PRIORITY[this.currentLogLevel];
    }
    /**
     * 格式化时间戳
     */
    getTimestamp() {
        return new Date().toISOString();
    }
    /**
     * 获取调用栈信息（文件名和行号）
     */
    getCallerInfo() {
        try {
            const stack = new Error().stack;
            if (!stack)
                return null;
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
        }
        catch (error) {
            // 如果获取失败，不影响日志输出
        }
        return null;
    }
    /**
     * 格式化日志前缀（包含代码位置）
     */
    formatPrefix(level, showLocation = true) {
        const timestamp = this.getTimestamp();
        const icons = {
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
    setLogLevel(level) {
        this.currentLogLevel = level;
        console.log(`📝 日志级别已设置为: ${level}`);
    }
    /**
     * 获取当前日志级别
     */
    getLogLevel() {
        return this.currentLogLevel;
    }
    /**
     * 记录错误
     */
    error(message, context, error) {
        if (!this.shouldLog(LogLevel.ERROR))
            return;
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
    warn(message, context) {
        if (!this.shouldLog(LogLevel.WARN))
            return;
        const prefix = this.formatPrefix(LogLevel.WARN);
        console.warn(prefix, message);
        if (context) {
            console.warn('  Context:', this.formatContext(context));
        }
    }
    /**
     * 记录信息
     */
    info(message, context) {
        if (!this.shouldLog(LogLevel.INFO))
            return;
        const prefix = this.formatPrefix(LogLevel.INFO, false); // INFO不显示代码位置
        console.log(prefix, message);
        if (context) {
            console.log('  Context:', this.formatContext(context));
        }
    }
    /**
     * 记录调试信息
     */
    debug(message, context) {
        if (!this.shouldLog(LogLevel.DEBUG))
            return;
        const prefix = this.formatPrefix(LogLevel.DEBUG);
        console.log(prefix, message);
        if (context) {
            console.log('  Context:', this.formatContext(context));
        }
    }
    /**
     * 格式化上下文对象（简化输出）
     */
    formatContext(context) {
        // 移除undefined和null值
        const cleaned = Object.entries(context)
            .filter(([_, value]) => value !== undefined && value !== null)
            .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
        return JSON.stringify(cleaned, null, 2);
    }
    /**
     * 记录HTTP请求
     */
    request(method, path, userId, statusCode, duration) {
        if (!this.shouldLog(LogLevel.INFO))
            return;
        const icon = statusCode && statusCode >= 400 ? '❌' : '✅';
        const timestamp = this.getTimestamp();
        const durationStr = duration ? `${duration}ms` : '';
        const userStr = userId ? `User#${userId}` : 'Anonymous';
        console.log(`[${timestamp}] ${icon} [HTTP] ${method} ${path} ${statusCode || ''} ${durationStr} (${userStr})`);
    }
    /**
     * 记录数据库操作
     */
    database(operation, table, recordId, duration) {
        if (!this.shouldLog(LogLevel.DEBUG))
            return;
        const timestamp = this.getTimestamp();
        const durationStr = duration ? `${duration}ms` : '';
        const idStr = recordId ? `#${recordId}` : '';
        console.log(`[${timestamp}] 🗄️  [DB] ${operation} ${table}${idStr} ${durationStr}`);
    }
    /**
     * 记录文件操作
     */
    file(operation, filePath, success = true) {
        if (!this.shouldLog(LogLevel.DEBUG))
            return;
        const timestamp = this.getTimestamp();
        const icon = success ? '📁' : '❌';
        const fileName = filePath.split(/[/\\]/).pop() || filePath; // 只显示文件名
        console.log(`[${timestamp}] ${icon} [FILE] ${operation}: ${fileName}`);
    }
    /**
     * 记录Excel同步（优化：不重复输出）
     */
    excel(message, recordCount, skipDuplicate = true) {
        if (!this.shouldLog(LogLevel.INFO))
            return;
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
    approval(action, projectCode, userId, result) {
        if (!this.shouldLog(LogLevel.INFO))
            return;
        const timestamp = this.getTimestamp();
        const icon = result === 'approved' ? '✅' : '❌';
        console.log(`[${timestamp}] ${icon} [APPROVAL] ${action} ${projectCode} by User#${userId} - ${result.toUpperCase()}`);
    }
    /**
     * 记录性能指标
     */
    performance(operation, duration, metadata) {
        if (!this.shouldLog(LogLevel.INFO))
            return;
        const timestamp = this.getTimestamp();
        const metaStr = metadata ? JSON.stringify(metadata) : '';
        console.log(`[${timestamp}] ⚡ [PERF] ${operation} - ${duration}ms ${metaStr}`);
    }
    /**
     * 一键切换到DEBUG模式
     */
    enableDebug() {
        this.setLogLevel(LogLevel.DEBUG);
    }
    /**
     * 一键切换到INFO模式
     */
    enableInfo() {
        this.setLogLevel(LogLevel.INFO);
    }
    /**
     * 一键切换到生产模式（WARN）
     */
    enableProduction() {
        this.setLogLevel(LogLevel.WARN);
    }
}
exports.logger = new Logger();
// 导出便捷函数，用于切换日志级别
const enableDebugLog = () => exports.logger.enableDebug();
exports.enableDebugLog = enableDebugLog;
const enableInfoLog = () => exports.logger.enableInfo();
exports.enableInfoLog = enableInfoLog;
const enableProductionLog = () => exports.logger.enableProduction();
exports.enableProductionLog = enableProductionLog;
//# sourceMappingURL=logger.js.map