declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number
        username: string
        email: string
        fullName?: string
        isActive: boolean
        roleId?: number
        roleName?: string
        avatarUrl?: string
      }
      userId?: number
    }
  }
}

export {}
