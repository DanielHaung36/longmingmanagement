import { isRejectedWithValue } from '@reduxjs/toolkit'
import type { MiddlewareAPI, Middleware } from '@reduxjs/toolkit'
import { showError } from './error-handler'

/**
 * RTK Query Error Logger Middleware
 *
 * Automatically catch all RTK Query errors and show toast notifications
 * Skip automatic error toast by adding meta: { skipErrorToast: true } to specific mutation/query
 */
export const rtkQueryErrorLogger: Middleware =
  (api: MiddlewareAPI) => (next) => (action) => {
    // RTK Query uses `isRejectedWithValue` to check for errors
    if (isRejectedWithValue(action)) {
      // Check if error toast should be skipped
      const skipErrorToast = action.meta?.arg?.skipErrorToast

      if (!skipErrorToast) {
        console.error('[RTK Query Error]', action)
        showError(action.payload)
      }
    }

    return next(action)
  }
