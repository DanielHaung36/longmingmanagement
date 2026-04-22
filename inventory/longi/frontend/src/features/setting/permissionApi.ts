// src/lib/permissionApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
export interface PermissionDTO {
  id: number
  name: string
  label: string
  description?: string
}

export interface PermissionModule {
  module: string        // 模块名称
  icon: string          // 图标（可选 emoji 或图标 key）
  description: string   // 模块描述
  permissions: PermissionDTO[]
}

export interface UserPermissionDataDTO {
  userId: number
  permissions: number[]
  lastModified: string
  modifiedBy: string
}

export interface User {
  id: number
  username: string
  fullName: string
  email: string
  role: string
  isActive: boolean
  avatar?: string
  lastLogin?: string
}

export const permissionApi = createApi({
  reducerPath: 'permissionApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api', credentials: 'include' }),
  tagTypes: ['Permissions', 'Modules'],
  endpoints: (builder) => ({
    // 扁平权限列表（CRUD 用）
    getPermissions: builder.query<PermissionDTO[], void>({
      query: () => `permissions`,
      transformResponse: (response: any) => response.data ?? response,
      providesTags: ['Permissions'],
    }),
    // 分模块的权限结构（UI 一进来用它初始化模块展开／收起）
    getPermissionModules: builder.query<PermissionModule[], void>({
      query: () => `permissions/modules`,
      transformResponse: (response: any) => response.data ?? response,
      providesTags: ['Modules'],
    }),
  }),
})

export const {
  useGetPermissionsQuery,
  useGetPermissionModulesQuery,
} = permissionApi
