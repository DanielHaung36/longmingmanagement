/**
 * 全局 API 错误处理器
 *
 * 功能：
 * 1. 统一处理 RTK Query 错误
 * 2. 显示用户友好的错误提示
 * 3. 自动处理认证错误（401）
 * 4. 记录错误日志
 *
 * 使用方法：
 * import { handleApiError } from '@/lib/apiErrorHandler';
 *
 * const [createProject] = useCreateProjectMutation();
 * try {
 *   await createProject(data).unwrap();
 * } catch (error) {
 *   handleApiError(error);
 * }
 */

import { toast } from '@/hooks/use-toast';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';

// ==================== 错误类型定义 ====================

interface ApiErrorResponse {
  success: false;
  message: string;
  error?: string;
  details?: any;
}

interface ValidationError {
  field: string;
  message: string;
}

// ==================== 类型守卫 ====================

function isFetchBaseQueryError(error: any): error is FetchBaseQueryError {
  return error && typeof error === 'object' && 'status' in error;
}

function isApiErrorResponse(data: any): data is ApiErrorResponse {
  return data && typeof data === 'object' && 'success' in data && 'message' in data;
}

// ==================== 错误消息映射 ====================

const ERROR_MESSAGES: Record<number, { title: string; description: string }> = {
  400: {
    title: '请求错误',
    description: '请检查输入的数据是否正确',
  },
  401: {
    title: '未授权',
    description: '登录已过期，请重新登录',
  },
  403: {
    title: '权限不足',
    description: '您没有权限执行此操作',
  },
  404: {
    title: '资源不存在',
    description: '请求的资源未找到',
  },
  409: {
    title: '冲突错误',
    description: '数据冲突，请刷新后重试',
  },
  422: {
    title: '验证失败',
    description: '请检查输入的数据格式',
  },
  429: {
    title: '请求过于频繁',
    description: '请稍后再试',
  },
  500: {
    title: '服务器错误',
    description: '服务器出现问题，请稍后重试',
  },
  502: {
    title: '网关错误',
    description: '服务器暂时不可用，请稍后重试',
  },
  503: {
    title: '服务不可用',
    description: '服务器维护中，请稍后重试',
  },
  504: {
    title: '网关超时',
    description: '请求超时，请检查网络连接',
  },
};

// ==================== 主要错误处理函数 ====================

/**
 * 处理 API 错误（RTK Query）
 */
export function handleApiError(error: any, customMessage?: string): void {
  console.error('[API Error]', error);

  // 1. 处理 FetchBaseQueryError
  if (isFetchBaseQueryError(error)) {
    const status = typeof error.status === 'number' ? error.status : 500;

    // 获取预定义的错误消息
    const errorInfo = ERROR_MESSAGES[status] || {
      title: '操作失败',
      description: '发生未知错误',
    };

    // 尝试从响应中提取详细错误信息
    let description = errorInfo.description;
    if (error.data && isApiErrorResponse(error.data)) {
      description = error.data.message || description;
    }

    // 使用自定义消息（如果提供）
    if (customMessage) {
      description = customMessage;
    }

    // 显示错误提示
    toast({
      title: errorInfo.title,
      description: description,
      variant: 'destructive',
    });

    // 401 错误特殊处理：重定向到登录页
    if (status === 401) {
      // 延迟重定向，让用户看到错误提示
      setTimeout(() => {
        const currentPath = window.location.pathname;
        if (currentPath !== '/login') {
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }
      }, 1500);
    }

    return;
  }

  // 2. 处理网络错误
  if (error instanceof TypeError && error.message.includes('fetch')) {
    toast({
      title: '网络错误',
      description: '无法连接到服务器，请检查网络连接',
      variant: 'destructive',
    });
    return;
  }

  // 3. 处理 SerializedError (RTK Query)
  if (error && typeof error === 'object' && 'message' in error) {
    toast({
      title: '操作失败',
      description: customMessage || (error as any).message || '发生未知错误',
      variant: 'destructive',
    });
    return;
  }

  // 4. 处理其他错误
  toast({
    title: '操作失败',
    description: customMessage || '发生未知错误，请稍后重试',
    variant: 'destructive',
  });
}

/**
 * 处理验证错误（显示字段级错误）
 */
export function handleValidationError(errors: ValidationError[]): void {
  if (errors.length === 0) return;

  const errorMessages = errors.map(err => `${err.field}: ${err.message}`).join('\n');

  toast({
    title: '验证失败',
    description: errorMessages,
    variant: 'destructive',
  });
}

/**
 * 显示成功提示
 */
export function showSuccessToast(title: string, description?: string): void {
  toast({
    title,
    description,
    variant: 'default',
  });
}

/**
 * 显示警告提示
 */
export function showWarningToast(title: string, description?: string): void {
  toast({
    title,
    description,
    // Note: 需要在 toast 组件中添加 warning variant
    variant: 'default',
  });
}

/**
 * 显示信息提示
 */
export function showInfoToast(title: string, description?: string): void {
  toast({
    title,
    description,
    variant: 'default',
  });
}

// ==================== 实用工具函数 ====================

/**
 * 从错误中提取消息
 */
export function extractErrorMessage(error: any): string {
  if (isFetchBaseQueryError(error) && error.data && isApiErrorResponse(error.data)) {
    return error.data.message;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return (error as any).message;
  }

  return '发生未知错误';
}

/**
 * 判断是否为认证错误
 */
export function isAuthError(error: any): boolean {
  return isFetchBaseQueryError(error) && error.status === 401;
}

/**
 * 判断是否为权限错误
 */
export function isPermissionError(error: any): boolean {
  return isFetchBaseQueryError(error) && error.status === 403;
}

/**
 * 判断是否为网络错误
 */
export function isNetworkError(error: any): boolean {
  return error instanceof TypeError && error.message.includes('fetch');
}
