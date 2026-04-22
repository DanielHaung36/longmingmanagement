/**
 * 统一API响应类型定义
 * 确保前端能获取完整的数据和元信息
 */
/**
 * 基础响应结构
 */
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: ErrorDetail;
    meta?: ResponseMeta;
}
/**
 * 错误详情
 */
export interface ErrorDetail {
    code: string;
    message: string;
    field?: string;
    details?: any;
    timestamp: string;
}
/**
 * 响应元信息
 */
export interface ResponseMeta {
    timestamp: string;
    duration?: number;
    requestId?: string;
    version?: string;
}
/**
 * 分页响应结构
 */
export interface PaginatedResponse<T> {
    success: boolean;
    message: string;
    data: T[];
    pagination: PaginationMeta;
    meta?: ResponseMeta;
}
/**
 * 分页元信息
 */
export interface PaginationMeta {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
/**
 * 列表响应（不分页）
 */
export interface ListResponse<T> {
    success: boolean;
    message: string;
    data: T[];
    count: number;
    meta?: ResponseMeta;
}
/**
 * 文件上传响应
 */
export interface FileUploadResponse {
    success: boolean;
    message: string;
    data: {
        fileId: number;
        fileName: string;
        fileSize: number;
        fileType: string;
        uploadedAt: string;
        url?: string;
    };
    meta?: ResponseMeta;
}
/**
 * 批量操作响应
 */
export interface BatchOperationResponse<T = any> {
    success: boolean;
    message: string;
    data: {
        total: number;
        succeeded: number;
        failed: number;
        results: Array<{
            id: number | string;
            success: boolean;
            error?: string;
            data?: T;
        }>;
    };
    meta?: ResponseMeta;
}
/**
 * 统计数据响应
 */
export interface StatsResponse<T = any> {
    success: boolean;
    message: string;
    data: T;
    period?: {
        start: string;
        end: string;
    };
    meta?: ResponseMeta;
}
/**
 * 响应构建器工具类
 */
export declare class ResponseBuilder {
    /**
     * 成功响应
     */
    static success<T>(data: T, message?: string, meta?: Partial<ResponseMeta>): ApiResponse<T>;
    /**
     * 错误响应
     */
    static error(message: string, code?: string, details?: any, field?: string): ApiResponse;
    /**
     * 分页响应
     */
    static paginated<T>(data: T[], page: number, pageSize: number, total: number, message?: string): PaginatedResponse<T>;
    /**
     * 列表响应（不分页）
     */
    static list<T>(data: T[], message?: string): ListResponse<T>;
    /**
     * 创建响应（包含新创建的资源）
     */
    static created<T>(data: T, message?: string): ApiResponse<T>;
    /**
     * 更新响应
     */
    static updated<T>(data: T, message?: string): ApiResponse<T>;
    /**
     * 删除响应
     */
    static deleted(message?: string): ApiResponse<void>;
    /**
     * 验证错误响应
     */
    static validationError(field: string, message: string, details?: any): ApiResponse;
    /**
     * 未找到资源响应
     */
    static notFound(resource?: string): ApiResponse;
    /**
     * 未授权响应
     */
    static unauthorized(message?: string): ApiResponse;
    /**
     * 禁止访问响应
     */
    static forbidden(message?: string): ApiResponse;
    /**
     * 冲突响应（如重复创建）
     */
    static conflict(message: string, details?: any): ApiResponse;
    /**
     * 批量操作响应
     */
    static batch<T>(results: Array<{
        id: number | string;
        success: boolean;
        error?: string;
        data?: T;
    }>, message?: string): BatchOperationResponse<T>;
}
/**
 * 常用错误代码
 */
export declare enum ErrorCode {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    NOT_FOUND = "NOT_FOUND",
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    CONFLICT = "CONFLICT",
    BAD_REQUEST = "BAD_REQUEST",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    DATABASE_ERROR = "DATABASE_ERROR",
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
    APPROVAL_FAILED = "APPROVAL_FAILED",
    FILE_UPLOAD_FAILED = "FILE_UPLOAD_FAILED",
    EXCEL_SYNC_FAILED = "EXCEL_SYNC_FAILED",
    FOLDER_CREATION_FAILED = "FOLDER_CREATION_FAILED"
}
//# sourceMappingURL=response.types.d.ts.map