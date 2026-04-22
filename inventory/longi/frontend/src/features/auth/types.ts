// src/features/auth/types.ts
export interface LoginRequest {
    username:string
    password:string
}

export interface User {
    id:number
    username:string
}

export interface AuthState {
  token: string | null
  user: User | null
  loading: boolean
  error: string | null
}