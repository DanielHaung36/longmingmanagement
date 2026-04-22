import prisma from '../utils/prisma'

const USER_SELECT = {
  id: true,
  username: true,
  email: true,
  full_name: true,
  is_active: true,
  role_id: true,
  avatar_url: true,
  created_at: true,
  last_login_at: true,
  role: { select: { id: true, name: true, display_name: true } },
} as const

export class UserService {
  static async getAll() {
    return prisma.users.findMany({
      where: { deleted_at: null },
      select: USER_SELECT,
      orderBy: { id: 'asc' },
    })
  }

  static async getById(id: number) {
    return prisma.users.findUnique({
      where: { id },
      select: {
        ...USER_SELECT,
        user_permissions: { include: { permission: true } },
      },
    })
  }

  static async update(
    id: number,
    data: { full_name?: string; email?: string; is_active?: boolean; role_id?: number; avatar_url?: string },
    isAdmin: boolean
  ) {
    const updateData: Record<string, unknown> = { updated_at: new Date() }
    if (data.full_name !== undefined) updateData.full_name = data.full_name
    if (data.email !== undefined) updateData.email = data.email
    if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url
    // Only admin can change active status and role
    if (isAdmin) {
      if (data.is_active !== undefined) updateData.is_active = data.is_active
      if (data.role_id !== undefined) updateData.role_id = data.role_id
    }

    return prisma.users.update({
      where: { id },
      data: updateData,
      select: {
        ...USER_SELECT,
      },
    })
  }
}
