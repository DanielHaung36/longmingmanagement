// src/features/auth/RequirePermission.tsx
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '@/app/store'
import { useGetPermissionsQuery } from '../setting/permissionApi'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export interface RequirePermissionProps {
  permission: string
  children: React.ReactNode 
}

export default function RequirePermission({ permission, children }: RequirePermissionProps) {
  const user = useSelector((state: RootState) => state.auth.user)

  const location = useLocation()
  
  // 获取所有权限定义
  const { data: allPermissions, isLoading: allPermissionsLoading, error: allPermissionsError } = useGetPermissionsQuery()
  
  // 显示加载状态
  if (allPermissionsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-gray-600">检查权限中...</span>
        </div>
      </div>
    )
  }
  
  // 显示错误状态
  if (allPermissionsError) {
    return (
      <Alert className="max-w-md mx-auto mt-8">
        <AlertDescription>
          获取权限信息失败，请刷新页面重试。
        </AlertDescription>
      </Alert>
    )
  }
  
  // 如果没有用户信息，跳转到登录页
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  
  // 权限检查逻辑
  const hasPermission = () => {
    // 如果是admin用户，跳过权限检查
    if (user?.username === 'admin' || user?.email === 'admin@longi.com' || user?.role?.name === 'admin') {
      return true
    }

    if (!user?.permissions || user.permissions.length === 0) {
      return false
    }

    return user.permissions.some(p => p.name === permission)
  }
  
  if (!hasPermission()) {
    // 如果没有权限，跳转到未授权页面
    return <Navigate to="/unauthorized" state={{ from: location }} replace />
  }
  
  return <>{children}</>
}
