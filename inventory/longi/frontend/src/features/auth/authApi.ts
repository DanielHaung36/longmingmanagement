import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// User object with role
export interface User {
    id: number
    username: string
    full_name: string
    email: string
    is_active: boolean
    created_at: string
    avatar_url: string
    role: {
        id: number
        name: string
        display_name: string
        description: string
    }
    permissions: Array<{
        id: number
        name: string
        display_name: string
        description: string
    }>
}

// Verify response from /auth/verify
export interface VerifyResponse {
    success: boolean
    valid: boolean
    user: User
    message?: string
}

// Profile response from /auth/me
export interface ProfileResponse {
    success: boolean
    user: User
}

export const authApi = createApi({
    reducerPath: 'authApi',

    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_API_URL,
        credentials: 'include',
    }),

    endpoints: (builder) => ({
        // Verify session cookie — used by RequireAuth
        verify: builder.query<VerifyResponse, void>({
            query: () => '/auth/verify',
        }),

        // Get current user profile (requires valid session)
        getProfile: builder.query<ProfileResponse, void>({
            query: () => '/auth/me',
        }),

        // Update profile
        updateProfile: builder.mutation<User, Partial<User>>({
            query: (data) => ({
                url: "/auth/me",
                method: "PUT",
                body: data,
            }),
        }),

        // Upload avatar
        uploadAvatar: builder.mutation<{ avatar_url: string }, File>({
            query: (file) => {
                const form = new FormData()
                form.append("avatar", file)
                return {
                    url: "/auth/avatar",
                    method: "POST",
                    body: form,
                }
            },
        }),

        // Update profile and avatar together
        updateProfileAndAvatar: builder.mutation<
            User,
            {
                username?: string
                full_name?: string
                email?: string
                old_password?: string
                new_password?: string
                avatar?: File
            }
        >({
            query: ({ avatar, ...fields }) => {
                const form = new FormData()
                Object.entries(fields).forEach(([key, value]) => {
                    if (value != null) {
                        form.append(key, value as string)
                    }
                })
                if (avatar) {
                    form.append('avatar', avatar)
                }
                return {
                    url: '/auth/me',
                    method: 'POST',
                    body: form,
                }
            },
        }),
    }),
})

export const {
    useVerifyQuery,
    useGetProfileQuery,
    useLazyGetProfileQuery,
    useUpdateProfileMutation,
    useUploadAvatarMutation,
    useUpdateProfileAndAvatarMutation
} = authApi
