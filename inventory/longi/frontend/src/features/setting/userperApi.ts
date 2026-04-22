// src/lib/userApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { User, UserPermissionDataDTO } from './permissionApi'

export const userApiPermission = createApi({
  reducerPath: 'userApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL, 
    credentials: 'include',
  }),
  tagTypes: ['Users', 'Permissions'],
  endpoints: (builder) => ({
    // 1) 列表所有用户
    listUsers: builder.query<User[], void>({
      query: () => `users`,
      transformResponse: (response: any) => {
        const list: any[] = response.data ?? response
        return list.map((u) => ({
          id: u.id,
          username: u.username,
          fullName: u.full_name ?? u.fullName ?? '',
          email: u.email ?? '',
          role: u.role?.name ?? u.role ?? '',
          isActive: u.is_active ?? u.isActive ?? false,
          avatar: u.avatar_url ?? u.avatar,
          lastLogin: u.last_login ?? u.lastLogin,
        }))
      },
      providesTags: (result) =>
        result
          ? [
              { type: 'Users' as const, id: 'LIST' },
              ...result.map((u) => ({ type: 'Users' as const, id: u.id })),
            ]
          : [{ type: 'Users' as const, id: 'LIST' }],
    }),

    // 2) 拉取某个用户的权限数据
    getUserPermissions: builder.query<UserPermissionDataDTO, number>({
      query: (userId) => `users/${userId}/permissions`,
      transformResponse: (response: any) => response.data ?? response,
      providesTags: (result, error, userId) => [{ type: 'Permissions', id: userId }],
    }),

    // 3) 更新某个用户的权限
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
        { type: 'Permissions' as const, id: userId },
      ],
    }),
  }),
})

export const {
  useListUsersQuery,
  useGetUserPermissionsQuery,
  useUpdateUserPermissionsMutation,
} = userApiPermission
