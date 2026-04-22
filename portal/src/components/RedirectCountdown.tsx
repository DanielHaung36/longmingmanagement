import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import type { AppConfig } from '../config/apps'

interface RedirectCountdownProps {
  app: AppConfig
  seconds?: number
  onCancel: () => void
}

export default function RedirectCountdown({ app, seconds = 3, onCancel }: RedirectCountdownProps) {
  const [count, setCount] = useState(seconds)

  const redirect = useCallback(() => {
    window.location.href = app.url
  }, [app.url])

  useEffect(() => {
    if (count <= 0) { redirect(); return }
    const timer = setTimeout(() => setCount(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [count, redirect])

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-sm mx-4"
      >
        <Loader2 className="h-6 w-6 text-slate-400 animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium text-slate-700 mb-1">
          Redirecting to {app.name}
        </p>
        <p className="text-xs text-slate-400 mb-6">
          {count > 0 ? `In ${count} second${count > 1 ? 's' : ''}...` : 'Now...'}
        </p>

        <div className="w-48 mx-auto bg-slate-200 rounded-full h-1 mb-6 overflow-hidden">
          <motion.div
            className="h-full bg-slate-500 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: seconds, ease: 'linear' }}
          />
        </div>

        <button
          onClick={onCancel}
          className="text-sm text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2"
        >
          Stay on workspace
        </button>
      </motion.div>
    </div>
  )
}
