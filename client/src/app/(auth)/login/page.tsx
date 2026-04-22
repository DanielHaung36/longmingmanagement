'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const redirect = searchParams.get('redirect') || '/home'
  const [showError, setShowError] = useState(false)
  const redirecting = useRef(false)

  useEffect(() => {
    if (redirecting.current) return
    if (error) {
      setShowError(true)
      const timer = setTimeout(() => {
        redirecting.current = true
        window.location.href = `/api/auth/sso/login?redirect=${encodeURIComponent(redirect)}`
      }, 3000)
      return () => clearTimeout(timer)
    }
    redirecting.current = true
    window.location.href = `/api/auth/sso/login?redirect=${encodeURIComponent(redirect)}`
  }, [error, redirect])

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center space-y-4">
        {/* LONGi logo */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-white border">
          <div className="h-6 w-6 rounded-sm bg-red-600" />
        </div>
        <h1 className="text-xl font-semibold">LONGi</h1>

        {showError ? (
          <div className="space-y-2">
            <p className="text-red-600 text-sm">{decodeURIComponent(error!)}</p>
            <p className="text-gray-500 text-sm">Redirecting to login...</p>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-red-500" />
            <p className="text-gray-500">Redirecting to login...</p>
          </div>
        )}
      </div>
    </div>
  )
}
