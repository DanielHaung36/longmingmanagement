import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { User } from './authApi'
import { authApi } from './authApi'

interface AuthState {
    user: User | null
}

const initialState: AuthState = {
    user: null,
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logoutLocal(state) {
            state.user = null;
        },
        setUser(state, action: PayloadAction<User>) {
            state.user = action.payload
        },
    },
    extraReducers: (builder) => {
        // When verify succeeds, store user
        builder.addMatcher(
            authApi.endpoints.verify.matchFulfilled,
            (state, { payload }) => {
                if (payload.success && payload.user) {
                    state.user = payload.user
                }
            }
        )
        // When getProfile succeeds, store user
        builder.addMatcher(
            authApi.endpoints.getProfile.matchFulfilled,
            (state, { payload }) => {
                if (payload.user) {
                    state.user = payload.user
                }
            }
        )
    },
})

export const { logoutLocal, setUser } = authSlice.actions;
export default authSlice.reducer
