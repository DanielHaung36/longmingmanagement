/**
 * 角色权限检查 Hook
 */

import { useMemo } from 'react'
import { useAppSelector } from '@/redux'
import { selectCurrentUser } from '@/state/authSlice'
import { UserRole } from '@/state/api'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// 可以审批的角色
const APPROVER_ROLES: UserRole[] = ['MANAGER', 'ADMIN', ]

// 可以管理用户的角色
const USER_MANAGER_ROLES: UserRole[] = ['MANAGER', 'ADMIN']

/**
 * 检查用户是否有审批权限
 */
export function useCanApprove(): boolean {
  const currentUser = useAppSelector(selectCurrentUser)

  return useMemo(() => {
    return currentUser ? APPROVER_ROLES.includes(currentUser.role) : false
  }, [currentUser])
}

/**
 * 检查用户是否有管理用户的权限
 */
export function useCanManageUsers(): boolean {
  const currentUser = useAppSelector(selectCurrentUser)

  return useMemo(() => {
    return currentUser ? USER_MANAGER_ROLES.includes(currentUser.role) : false
  }, [currentUser])
}

/**
 * 检查用户是否有指定角色
 */
export function useHasRole(allowedRoles: UserRole[]): boolean {
  const currentUser = useAppSelector(selectCurrentUser)

  return useMemo(() => {
    return currentUser ? allowedRoles.includes(currentUser.role) : false
  }, [currentUser, allowedRoles])
}

/**
 * 要求审批权限的 Hook
 * 如果用户没有审批权限，自动跳转到 forbidden 页面
 */
export function useRequireApprover() {
  const canApprove = useCanApprove()
  const router = useRouter()

  useEffect(() => {
    if (!canApprove) {
      router.replace('/forbidden')
    }
  }, [canApprove, router])

  return canApprove
}

/**
 * 要求用户管理权限的 Hook
 * 如果用户没有用户管理权限，自动跳转到 forbidden 页面
 */
export function useRequireUserManager() {
  const canManage = useCanManageUsers()
  const router = useRouter()

  useEffect(() => {
    if (!canManage) {
      router.replace('/forbidden')
    }
  }, [canManage, router])

  return canManage
}

/**
 * 要求指定角色的 Hook
 * 如果用户没有指定角色之一，自动跳转到 forbidden 页面
 */
export function useRequireRoles(allowedRoles: UserRole[]) {
  const hasRole = useHasRole(allowedRoles)
  const router = useRouter()

  useEffect(() => {
    if (!hasRole) {
      router.replace('/forbidden')
    }
  }, [hasRole, router])

  return hasRole
}
