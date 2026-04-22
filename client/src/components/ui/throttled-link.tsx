'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useCallback, MouseEvent } from 'react'

interface ThrottledLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  delay?: number
}

/**
 * 防抖的Link组件，防止快速点击导致多次跳转
 * @param delay 延迟时间（毫秒），默认500ms
 */
export function ThrottledLink({ href, children, className, delay = 500 }: ThrottledLinkProps) {
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()

  const handleClick = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
    // 如果正在导航中，阻止点击
    if (isNavigating) {
      e.preventDefault()
      return
    }

    // 设置导航状态
    setIsNavigating(true)

    // 延迟后重置状态
    setTimeout(() => {
      setIsNavigating(false)
    }, delay)
  }, [isNavigating, delay])

  return (
    <Link
      href={href}
      className={`${className} ${isNavigating ? 'pointer-events-none opacity-75' : ''}`}
      onClick={handleClick}
    >
      {children}
    </Link>
  )
}
