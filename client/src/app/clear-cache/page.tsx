'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from 'antd'
import { Spinner } from '@/components/ui/loading'

/**
 * Emergency cache clearing page
 * Visit this page to force clear all auth cache and storage
 */
export default function ClearCachePage() {
  const router = useRouter()
  const [status, setStatus] = useState<'clearing' | 'success' | 'error'>('clearing')
  const [message, setMessage] = useState('Clearing all cached data...')

  useEffect(() => {
    const clearEverything = async () => {
      try {
        console.log('[Clear Cache] Starting emergency cache clear...')

        // Step 1: Clear localStorage
        localStorage.clear()
        console.log('[Clear Cache] ✅ localStorage cleared')

        // Step 2: Clear sessionStorage
        sessionStorage.clear()
        console.log('[Clear Cache] ✅ sessionStorage cleared')

        // Step 3: Clear all cookies
        document.cookie.split(';').forEach((c) => {
          const name = c.trim().split('=')[0]
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost`
        })
        console.log('[Clear Cache] ✅ All cookies cleared')

        setMessage('Cache cleared successfully! Redirecting to login...')
        setStatus('success')

        // Wait 2 seconds before redirect
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // Force reload to login page
        window.location.href = '/login'
      } catch (error) {
        console.error('[Clear Cache] Error:', error)
        setMessage('Error clearing cache. Please try manual clear.')
        setStatus('error')
      }
    }

    clearEverything()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          {status === 'clearing' && 'Clearing Cache...'}
          {status === 'success' && '✅ Success!'}
          {status === 'error' && '❌ Error'}
        </h1>

        <div className="mb-6">
          {status === 'clearing' && <Spinner size="lg" />}
        </div>

        <p className="text-gray-600 mb-6">{message}</p>

        {status === 'error' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Please run this in browser console:</p>
            <pre className="bg-gray-100 p-4 rounded text-left text-xs overflow-x-auto">
              {`localStorage.clear();
sessionStorage.clear();
document.cookie.split(";").forEach(c => {
  document.cookie = c.trim().split("=")[0] +
    '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/'
});
location.reload();`}
            </pre>
            <Button type="primary" onClick={() => router.push('/login')}>
              Go to Login
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
