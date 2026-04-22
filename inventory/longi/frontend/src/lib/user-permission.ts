export interface User {
  id: number
  username: string
  fullName: string
  email?: string
  role?: string
  avatar?: string
  isActive: boolean
  lastLogin?: string
}

export interface Permission {
  id: number
  name: string
  label: string
  description?: string
}

export interface PermissionModule {
  module: string
  icon?: string
  description?: string
  permissions: Permission[]
}

export interface UserPermissionData {
  userId: number
  permissions: number[]
  lastModified?: string
  modifiedBy?: string
}
