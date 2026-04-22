'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

export function PageLoading() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // 延迟显示loading，避免快速页面加载时的闪烁
    const timer = setTimeout(() => setShow(true), 100)
    return () => clearTimeout(timer)
  }, [])

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 text-emerald-600 animate-spin" />
        <p className="text-sm text-gray-600 animate-pulse">Loading...</p>
      </div>
    </div>
  )
}
