'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/redux'
import {
  setCredentials,
  logout,
  setLoading,
  finishInitializing
} from '@/state/authSlice'
import { useVerifyAuthQuery } from '@/state/api'
import { GlobalLoading } from './GlobalLoading'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const { initializing } = useAppSelector((s) => s.auth)

  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password']
  const isPublic = publicRoutes.some((p) => pathname.startsWith(p))

  // ⭐ 只有私有路由才验证 Cookie
  const { data, error, isLoading } = useVerifyAuthQuery(undefined, {
    skip: isPublic,
  })

  useEffect(() => {
    // 1) verify loading 中
    if (isLoading) {
      dispatch(setLoading(true))
      return
    }

    // 2) verify 成功
    if (data?.success && data.user) {
      dispatch(setCredentials({ user: data.user }))

      // 登录页访问时自动跳 home
      if (pathname === '/login') {
        router.replace('/home')
      }

      dispatch(finishInitializing())
      return
    }

    // 3) verify 失败
    if (error) {
      // 非公开路由 → 强制跳登录页
      if (!isPublic) {
        dispatch(logout())
        router.replace(`/login?redirect=${pathname}`)
      }
      dispatch(finishInitializing())
      return
    }

    // 4) 无 verify 过程（公开路由）
    dispatch(finishInitializing())
  }, [data, error, isLoading])

  // ⭐ 在 initializing 或 verify loading 时显示 Loading（核心防闪屏逻辑）
  if (initializing || isLoading) {
    return <GlobalLoading />
  }

  return <>{children}</>
}
