// src/pages/userApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

/** Role 类型 */
export interface Role {
  id: number
  name: string
  displayName: string
}

/** User 类型：与后端返回字段对应 */
export interface User {
  id: number
  username: string
  fullName: string
  email: string
  isActive: boolean
  createdAt: string
  role: Role
}

/** 后端返回的用户权限 DTO */
export interface UserPermissionDataDTO {
  userId: number
  permissions: number[]
  lastModified: string
  modifiedBy: string
}


export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  tagTypes: ['Users', 'Roles', 'Permissions'],
  endpoints: (builder) => ({
    // 列表所有用户
    listUsers: builder.query<User[], void>({
      query: () => `users`,
      transformResponse: (response: any) => response.data ?? response,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Users' as const, id })),
              { type: 'Users', id: 'LIST' },
            ]
          : [{ type: 'Users', id: 'LIST' }],
    }),

    // 根据 ID 取单个用户
    getUser: builder.query<User, number>({
      query: (id) => `users/${id}`,
      transformResponse: (response: any) => response.data ?? response,
      providesTags: (result, error, id) => [{ type: 'Users', id }],
    }),

    // 新建用户
    createUser: builder.mutation<User, { username: string; fullName: string; email: string; password: string; roleId: number }>(
      {
        query: (body) => ({
          url: `users`,
          method: 'POST',
          body,
        }),
        invalidatesTags: [{ type: 'Users', id: 'LIST' }],
      }
    ),

    // 更新用户
    updateUser: builder.mutation<User, { id: number; data: Partial<Omit<User, 'id' | 'createdAt'>> }>(
      {
        query: ({ id, data }) => ({
          url: `users/${id}`,
          method: 'PUT',
          body: data,
        }),
        invalidatesTags: (result, error, { id }) => [
          { type: 'Users', id },
          { type: 'Users', id: 'LIST' },
        ],
      }
    ),

    // 删除（软删）用户
    deleteUser: builder.mutation<void, number>({
      query: (id) => ({
        url: `users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Users', id },
        { type: 'Users', id: 'LIST' },
      ],
    }),

    // 列表角色，用于构建下拉
    listRoles: builder.query<Role[], void>({
      query: () => `roles`,
      transformResponse: (response: any) => response.data ?? response,
      providesTags: [{ type: 'Roles', id: 'LIST' }],
    }),
      // —— 用户权限 —— //
    getUserPermissions: builder.query<UserPermissionDataDTO, number>({
      query: (userId) => `users/${userId}/permissions`,
      transformResponse: (response: any) => response.data ?? response,
      providesTags: (result, error, userId) => [{ type: 'Permissions', id: userId }],
    }),
    updateUserPermissions: builder.mutation<
      void,
      { userId: number; permissions: number[] }
    >({
      query: ({ userId, permissions }) => ({
        url: `users/${userId}/permissions`,
        method: 'PUT',
        body: { permissions },
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'Permissions', id: userId },
      ],
    }),
    
  }),
})

export const {
  useListUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useListRolesQuery,
  useGetUserPermissionsQuery,
  useUpdateUserPermissionsMutation,
} = userApi
