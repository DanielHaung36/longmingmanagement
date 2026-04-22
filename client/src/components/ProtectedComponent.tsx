'use client'

import { ReactNode } from 'react'
import { usePermission, Permission, UserRole, useRole } from '@/hooks/use-permission'

/**
 * ProtectedComponent
 *
 * Only renders children if user has required permission
 *
 * @example
 * ```tsx
 * <ProtectedComponent permission="PROJECT_APPROVE">
 *   <ApproveButton />
 * </ProtectedComponent>
 * ```
 */
interface ProtectedComponentProps {
  permission: Permission
  children: ReactNode
  fallback?: ReactNode
}

export function ProtectedComponent({ permission, children, fallback = null }: ProtectedComponentProps) {
  const hasPermission = usePermission(permission)

  if (!hasPermission) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * RequireRole
 *
 * Only renders children if user has one of the required roles
 *
 * @example
 * ```tsx
 * <RequireRole roles={[UserRole.ADMIN, UserRole.PROJECT_MANAGER]}>
 *   <AdminPanel />
 * </RequireRole>
 * ```
 */
interface RequireRoleProps {
  roles: UserRole[]
  children: ReactNode
  fallback?: ReactNode
}

export function RequireRole({ roles, children, fallback = null }: RequireRoleProps) {
  const userRole = useRole()

  if (!userRole || !roles.includes(userRole)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * AdminOnly
 *
 * Shorthand for admin-only content
 */
interface AdminOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  return (
    <RequireRole roles={[UserRole.ADMIN]} fallback={fallback}>
      {children}
    </RequireRole>
  )
}

/**
 * ManagerOnly
 *
 * For admins and project managers only
 */
interface ManagerOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

export function ManagerOnly({ children, fallback = null }: ManagerOnlyProps) {
  return (
    <RequireRole roles={[UserRole.ADMIN, UserRole.PROJECT_MANAGER]} fallback={fallback}>
      {children}
    </RequireRole>
  )
}
