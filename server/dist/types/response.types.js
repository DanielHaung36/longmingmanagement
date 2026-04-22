"use strict";
/**
 * 统一API响应类型定义
 * 确保前端能获取完整的数据和元信息
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCode = exports.ResponseBuilder = void 0;
/**
 * 响应构建器工具类
 */
class ResponseBuilder {
    /**
     * 成功响应
     */
    static success(data, message = 'Success', meta) {
        return {
            success: true,
            message,
            data,
            meta: {
                timestamp: new Date().toISOString(),
                ...meta
            }
        };
    }
    /**
     * 错误响应
     */
    static error(message, code = 'INTERNAL_ERROR', details, field) {
        return {
            success: false,
            message,
            error: {
                code,
                message,
                field,
                details,
                timestamp: new Date().toISOString()
            },
            meta: {
                timestamp: new Date().toISOString()
            }
        };
    }
    /**
     * 分页响应
     */
    static paginated(data, page, pageSize, total, message = 'Success') {
        const totalPages = Math.ceil(total / pageSize);
        return {
            success: true,
            message,
            data,
            pagination: {
                page,
                pageSize,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            },
            meta: {
                timestamp: new Date().toISOString()
            }
        };
    }
    /**
     * 列表响应（不分页）
     */
    static list(data, message = 'Success') {
        return {
            success: true,
            message,
            data,
            count: data.length,
            meta: {
                timestamp: new Date().toISOString()
            }
        };
    }
    /**
     * 创建响应（包含新创建的资源）
     */
    static created(data, message = 'Resource created successfully') {
        return {
            success: true,
            message,
            data,
            meta: {
                timestamp: new Date().toISOString()
            }
        };
    }
    /**
     * 更新响应
     */
    static updated(data, message = 'Resource updated successfully') {
        return {
            success: true,
            message,
            data,
            meta: {
                timestamp: new Date().toISOString()
            }
        };
    }
    /**
     * 删除响应
     */
    static deleted(message = 'Resource deleted successfully') {
        return {
            success: true,
            message,
            meta: {
                timestamp: new Date().toISOString()
            }
        };
    }
    /**
     * 验证错误响应
     */
    static validationError(field, message, details) {
        return this.error(message, 'VALIDATION_ERROR', details, field);
    }
    /**
     * 未找到资源响应
     */
    static notFound(resource = 'Resource') {
        return this.error(`${resource} not found`, 'NOT_FOUND');
    }
    /**
     * 未授权响应
     */
    static unauthorized(message = 'Unauthorized') {
        return this.error(message, 'UNAUTHORIZED');
    }
    /**
     * 禁止访问响应
     */
    static forbidden(message = 'Forbidden') {
        return this.error(message, 'FORBIDDEN');
    }
    /**
     * 冲突响应（如重复创建）
     */
    static conflict(message, details) {
        return this.error(message, 'CONFLICT', details);
    }
    /**
     * 批量操作响应
     */
    static batch(results, message = 'Batch operation completed') {
        const succeeded = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        return {
            success: failed === 0,
            message,
            data: {
                total: results.length,
                succeeded,
                failed,
                results
            },
            meta: {
                timestamp: new Date().toISOString()
            }
        };
    }
}
exports.ResponseBuilder = ResponseBuilder;
/**
 * 常用错误代码
 */
var ErrorCode;
(function (ErrorCode) {
    // 客户端错误 (4xx)
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ErrorCode["CONFLICT"] = "CONFLICT";
    ErrorCode["BAD_REQUEST"] = "BAD_REQUEST";
    // 服务器错误 (5xx)
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorCode["DATABASE_ERROR"] = "DATABASE_ERROR";
    ErrorCode["EXTERNAL_SERVICE_ERROR"] = "EXTERNAL_SERVICE_ERROR";
    // 业务错误
    ErrorCode["APPROVAL_FAILED"] = "APPROVAL_FAILED";
    ErrorCode["FILE_UPLOAD_FAILED"] = "FILE_UPLOAD_FAILED";
    ErrorCode["EXCEL_SYNC_FAILED"] = "EXCEL_SYNC_FAILED";
    ErrorCode["FOLDER_CREATION_FAILED"] = "FOLDER_CREATION_FAILED";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
//# sourceMappingURL=response.types.js.map