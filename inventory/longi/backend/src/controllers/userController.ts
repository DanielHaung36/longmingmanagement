import { Request, Response } from 'express'
import { UserService } from '../services/userService'

export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await UserService.getAll()
    res.json({ success: true, data: users })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch users'
    res.status(500).json({ success: false, message: msg })
  }
}

export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await UserService.getById(parseInt(req.params.id as string))
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }
    res.json({ success: true, data: user })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch user'
    res.status(500).json({ success: false, message: msg })
  }
}

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const targetId = parseInt(req.params.id as string)
    if (req.user?.roleName !== 'admin' && req.userId !== targetId) {
      res.status(403).json({ success: false, message: 'Cannot update other users' })
      return
    }

    const { full_name, email, is_active, role_id, avatar_url } = req.body
    const isAdmin = req.user?.roleName === 'admin'
    const user = await UserService.update(targetId, { full_name, email, is_active, role_id, avatar_url }, isAdmin)
    res.json({ success: true, data: user })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update user'
    res.status(400).json({ success: false, message: msg })
  }
}
