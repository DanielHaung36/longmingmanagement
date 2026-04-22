import { useCallback } from 'react'
import { showError, showSuccess, showWarning, showInfo } from '@/lib/error-handler'

/**
 * Error Handler Hook
 *
 * Usage example:
 * ```tsx
 * const { handleError, handleSuccess } = useErrorHandler()
 *
 * try {
 *   await someApiCall()
 *   handleSuccess('Operation successful')
 * } catch (error) {
 *   handleError(error)
 * }
 * ```
 */
export function useErrorHandler() {
  const handleError = useCallback((error: unknown) => {
    showError(error)
  }, [])

  const handleSuccess = useCallback((message: string) => {
    showSuccess(message)
  }, [])

  const handleWarning = useCallback((message: string) => {
    showWarning(message)
  }, [])

  const handleInfo = useCallback((message: string) => {
    showInfo(message)
  }, [])

  /**
   * Wrap async function with automatic error and success handling
   */
  const withHandler = useCallback(
    <T>(
      fn: () => Promise<T>,
      options?: {
        successMessage?: string
        errorMessage?: string
        onSuccess?: (result: T) => void
        onError?: (error: unknown) => void
      }
    ) => {
      return async () => {
        try {
          const result = await fn()
          if (options?.successMessage) {
            handleSuccess(options.successMessage)
          }
          if (options?.onSuccess) {
            options.onSuccess(result)
          }
          return result
        } catch (error) {
          if (options?.errorMessage) {
            showError(options.errorMessage)
          } else {
            handleError(error)
          }
          if (options?.onError) {
            options.onError(error)
          }
          throw error
        }
      }
    },
    [handleError, handleSuccess]
  )

  return {
    handleError,
    handleSuccess,
    handleWarning,
    handleInfo,
    withHandler,
  }
}
