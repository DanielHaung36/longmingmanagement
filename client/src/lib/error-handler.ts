import { message } from 'antd'

/**
 * Global Error Handler Utility
 */

/**
 * Extract user-friendly error message from error object
 */
export function getErrorMessage(error: unknown): string {
  // RTK Query errors
  if (error && typeof error === 'object' && 'status' in error) {
    const rtkError = error as { status: number | string; data?: any }

    if (rtkError.data?.message) {
      return rtkError.data.message
    }

    if (typeof rtkError.data === 'string') {
      return rtkError.data
    }

    // Return default message based on HTTP status code
    switch (rtkError.status) {
      case 400:
        return 'Invalid request parameters'
      case 401:
        return 'Unauthorized. Please login again'
      case 403:
        return 'Access denied. You do not have permission'
      case 404:
        return 'Resource not found'
      case 500:
        return 'Server error. Please try again later'
      case 'FETCH_ERROR':
        return 'Network connection failed. Please check your internet'
      case 'PARSING_ERROR':
        return 'Failed to parse response data'
      case 'TIMEOUT_ERROR':
        return 'Request timeout. Please try again'
      default:
        return 'Operation failed. Please try again'
    }
  }

  // Standard Error object
  if (error instanceof Error) {
    return error.message
  }

  // String error
  if (typeof error === 'string') {
    return error
  }

  // Unknown error
  return 'An unknown error occurred'
}

/**
 * Show error toast notification
 */
export function showError(error: unknown) {
  const errorMessage = getErrorMessage(error)
  message.error(errorMessage)
  console.error('[Error Handler]', error)
}

/**
 * Show success toast notification
 */
export function showSuccess(msg: string) {
  message.success(msg)
}

/**
 * Show warning toast notification
 */
export function showWarning(msg: string) {
  message.warning(msg)
}

/**
 * Show info toast notification
 */
export function showInfo(msg: string) {
  message.info(msg)
}

/**
 * Wrap async function with automatic error handling
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  successMessage?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      const result = await fn(...args)
      if (successMessage) {
        showSuccess(successMessage)
      }
      return result
    } catch (error) {
      showError(error)
      throw error
    }
  }) as T
}

/**
 * Confirmation dialog helper
 */
export async function confirmAction(
  title: string,
  content?: string
): Promise<boolean> {
  return new Promise((resolve) => {
    message.loading({
      content: content || 'Processing...',
      duration: 0,
      key: 'confirm',
    })

    // Use antd Modal.confirm (should be used within component)
    // Simplified here, actual usage requires component context
    resolve(true)
  })
}
