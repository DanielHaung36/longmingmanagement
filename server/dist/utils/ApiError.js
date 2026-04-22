"use strict";
/**
 * API错误类 - API Error Class
 *
 * 用于在服务层抛出格式化的错误
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
class ApiError extends Error {
    statusCode;
    isOperational;
    constructor(statusCode, message, isOperational = true, stack = '') {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        if (stack) {
            this.stack = stack;
        }
        else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    static badRequest(message) {
        return new ApiError(400, message);
    }
    static unauthorized(message = 'Unauthorized') {
        return new ApiError(401, message);
    }
    static forbidden(message = 'Forbidden') {
        return new ApiError(403, message);
    }
    static notFound(message = 'Not found') {
        return new ApiError(404, message);
    }
    static internal(message = 'Internal server error') {
        return new ApiError(500, message);
    }
}
exports.ApiError = ApiError;
//# sourceMappingURL=ApiError.js.map