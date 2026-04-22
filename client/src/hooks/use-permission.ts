import { useAppSelector } from '@/redux'

/**
 * User Roles (from backend)
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  USER = 'USER',
}

/**
 * Permission Definitions
 *
 * Define what each role can do
 */
export const Permissions = {
  // Project permissions
  PROJECT_CREATE: [UserRole.ADMIN, UserRole.PROJECT_MANAGER],
  PROJECT_EDIT: [UserRole.ADMIN, UserRole.PROJECT_MANAGER],
  PROJECT_DELETE: [UserRole.ADMIN],
  PROJECT_APPROVE: [UserRole.ADMIN, UserRole.PROJECT_MANAGER],
  PROJECT_VIEW: [UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.USER],

  // Task permissions
  TASK_CREATE: [UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.USER],
  TASK_EDIT: [UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.USER],
  TASK_DELETE: [UserRole.ADMIN, UserRole.PROJECT_MANAGER],
  TASK_APPROVE: [UserRole.ADMIN, UserRole.PROJECT_MANAGER],
  TASK_VIEW: [UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.USER],

  // User management
  USER_MANAGE: [UserRole.ADMIN],
  USER_VIEW: [UserRole.ADMIN, UserRole.PROJECT_MANAGER],

  // Approval queue
  APPROVAL_VIEW: [UserRole.ADMIN, UserRole.PROJECT_MANAGER],
  APPROVAL_PROCESS: [UserRole.ADMIN, UserRole.PROJECT_MANAGER],

  // Settings
  SETTINGS_MANAGE: [UserRole.ADMIN],
  SETTINGS_VIEW: [UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.USER],
} as const

export type Permission = keyof typeof Permissions

/**
 * usePermission Hook
 *
 * Check if current user has specific permission
 *
 * @param permission - The permission to check
 * @returns true if user has permission, false otherwise
 *
 * @example
 * ```tsx
 * const canApprove = usePermission('PROJECT_APPROVE')
 * if (canApprove) {
 *   return <ApproveButton />
 * }
 * ```
 */
export function usePermission(permission: Permission): boolean {
  const currentUser = useAppSelector((state) => state.auth.user)

  if (!currentUser) {
    return false
  }

  // For now, since backend doesn't have role field yet,
  // we'll use a workaround based on username or user ID
  // TODO: Update when backend adds role field to User model
  const userRole = getUserRole(currentUser)

  const allowedRoles = Permissions[permission]
  return allowedRoles.includes(userRole)
}

/**
 * useRole Hook
 *
 * Get current user's role
 *
 * @returns UserRole or null if not logged in
 */
export function useRole(): UserRole | null {
  const currentUser = useAppSelector((state) => state.auth.user)

  if (!currentUser) {
    return null
  }

  return getUserRole(currentUser)
}

/**
 * Helper: Determine user role
 *
 * TEMPORARY LOGIC - Replace with backend role field
 */
function getUserRole(user: any): UserRole {
  // Admin users (hardcoded for demo)
  if (user.username === 'admin' || user.id === 11) {
    return UserRole.ADMIN
  }

  // Project Managers (based on departmentId or position)
  if (user.position?.toLowerCase().includes('manager')) {
    return UserRole.PROJECT_MANAGER
  }

  // Default role
  return UserRole.USER
}

/**
 * useIsAdmin Hook
 *
 * Shorthand to check if user is admin
 */
export function useIsAdmin(): boolean {
  const role = useRole()
  return role === UserRole.ADMIN
}

/**
 * useIsProjectManager Hook
 *
 * Check if user is admin or project manager
 */
export function useIsProjectManager(): boolean {
  const role = useRole()
  return role === UserRole.ADMIN || role === UserRole.PROJECT_MANAGER
}
