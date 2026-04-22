'use client'

import { Loader2 } from 'lucide-react'

export function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      <div className="flex flex-col items-center space-y-4">
        {/* Logo */}
        <div className="flex items-center mb-4">
          <div className="mr-3 flex h-12 w-12 items-center justify-center rounded-lg bg-red-600">
            <div className="h-6 w-6 rounded-sm bg-white"></div>
          </div>
          <h1 className="text-3xl font-semibold text-gray-900">LONGi</h1>
        </div>

        {/* Loading Spinner */}
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-red-500" />
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-gray-700">Loading...</p>
          <p className="text-sm text-gray-500">Please wait while we verify your session</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
        <div className="h-full bg-red-500 animate-pulse" style={{ width: '40%' }}></div>
      </div>
    </div>
  )
}
