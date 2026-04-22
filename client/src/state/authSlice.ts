import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { User } from './api'

/**
 * 认证状态接口（简化版 - Cookie认证）
 */
export interface AuthState {
  user: User | null // 当前登录用户信息
  isAuthenticated: boolean // 是否已认证
  isLoading: boolean // 是否正在加载
  initializing: boolean // ⭐ 第一次加载应用时的初始化阶段
}

/**
 * 初始状态
 */
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  initializing: true, // ⭐ 初始阶段必须为 true，否则刷新时会跳 login
}

/**
 * 认证 Slice（简化版 - Cookie认证）
 *
 * 功能：
 * - 管理用户登录状态
 * - Cookie由后端自动管理
 * - 无需手动处理token
 */
export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * 设置认证凭证（登录成功时调用）
     * Cookie由后端自动设置，前端只存储用户信息
     */
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User
      }>,
    ) => {
      const { user } = action.payload
      state.user = user
      state.isAuthenticated = true
      state.isLoading = false
      state.initializing = false

      console.log('[Auth] 设置认证凭证成功', { username: user.username, userId: user.id })
    },

    /**
     * 更新用户信息
     */
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },

    /**
     * 登出（清除用户信息）
     * Cookie由后端清除
     */
    logout: (state) => {
      console.log('[Auth] 用户登出')
      state.user = null
      state.isAuthenticated = false
      state.isLoading = false
      state.initializing = false
    },

    /**
     * 设置加载状态
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },

    finishInitializing: (state) => {
      state.initializing = false
    },
  },
})

// 导出 actions
export const { setCredentials, updateUser, logout, setLoading, finishInitializing } =
  authSlice.actions

// 导出 reducer
export default authSlice.reducer

// 导出 selectors（方便在组件中使用）
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading
