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
  code: string;           // 错误代码（如: VALIDATION_ERROR, NOT_FOUND）
  message: string;        // 用户友好的错误消息
  field?: string;         // 出错的字段名（用于表单验证）
  details?: any;          // 详细错误信息
  timestamp: string;      // 错误发生时间
}

/**
 * 响应元信息
 */
export interface ResponseMeta {
  timestamp: string;      // 响应时间戳
  duration?: number;      // 请求处理耗时（ms）
  requestId?: string;     // 请求ID（用于追踪）
  version?: string;       // API版本
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
  page: number;           // 当前页码（从1开始）
  pageSize: number;       // 每页大小
  total: number;          // 总记录数
  totalPages: number;     // 总页数
  hasNext: boolean;       // 是否有下一页
  hasPrev: boolean;       // 是否有上一页
}

/**
 * 列表响应（不分页）
 */
export interface ListResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  count: number;          // 列表总数
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
    url?: string;         // 文件访问URL
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
    total: number;        // 总操作数
    succeeded: number;    // 成功数量
    failed: number;       // 失败数量
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
  period?: {            // 统计周期
    start: string;
    end: string;
  };
  meta?: ResponseMeta;
}

/**
 * 响应构建器工具类
 */
export class ResponseBuilder {
  /**
   * 成功响应
   */
  static success<T>(data: T, message: string = 'Success', meta?: Partial<ResponseMeta>): ApiResponse<T> {
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
  static error(
    message: string,
    code: string = 'INTERNAL_ERROR',
    details?: any,
    field?: string
  ): ApiResponse {
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
  static paginated<T>(
    data: T[],
    page: number,
    pageSize: number,
    total: number,
    message: string = 'Success'
  ): PaginatedResponse<T> {
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
  static list<T>(data: T[], message: string = 'Success'): ListResponse<T> {
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
  static created<T>(data: T, message: string = 'Resource created successfully'): ApiResponse<T> {
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
  static updated<T>(data: T, message: string = 'Resource updated successfully'): ApiResponse<T> {
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
  static deleted(message: string = 'Resource deleted successfully'): ApiResponse<void> {
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
  static validationError(field: string, message: string, details?: any): ApiResponse {
    return this.error(message, 'VALIDATION_ERROR', details, field);
  }

  /**
   * 未找到资源响应
   */
  static notFound(resource: string = 'Resource'): ApiResponse {
    return this.error(`${resource} not found`, 'NOT_FOUND');
  }

  /**
   * 未授权响应
   */
  static unauthorized(message: string = 'Unauthorized'): ApiResponse {
    return this.error(message, 'UNAUTHORIZED');
  }

  /**
   * 禁止访问响应
   */
  static forbidden(message: string = 'Forbidden'): ApiResponse {
    return this.error(message, 'FORBIDDEN');
  }

  /**
   * 冲突响应（如重复创建）
   */
  static conflict(message: string, details?: any): ApiResponse {
    return this.error(message, 'CONFLICT', details);
  }

  /**
   * 批量操作响应
   */
  static batch<T>(
    results: Array<{ id: number | string; success: boolean; error?: string; data?: T }>,
    message: string = 'Batch operation completed'
  ): BatchOperationResponse<T> {
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

/**
 * 常用错误代码
 */
export enum ErrorCode {
  // 客户端错误 (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  BAD_REQUEST = 'BAD_REQUEST',

  // 服务器错误 (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  // 业务错误
  APPROVAL_FAILED = 'APPROVAL_FAILED',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  EXCEL_SYNC_FAILED = 'EXCEL_SYNC_FAILED',
  FOLDER_CREATION_FAILED = 'FOLDER_CREATION_FAILED'
}
