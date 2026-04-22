/**
 * API错误类 - API Error Class
 *
 * 用于在服务层抛出格式化的错误
 */
export declare class ApiError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    constructor(statusCode: number, message: string, isOperational?: boolean, stack?: string);
    static badRequest(message: string): ApiError;
    static unauthorized(message?: string): ApiError;
    static forbidden(message?: string): ApiError;
    static notFound(message?: string): ApiError;
    static internal(message?: string): ApiError;
}
//# sourceMappingURL=ApiError.d.ts.map