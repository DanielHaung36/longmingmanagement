import { Request, Response, NextFunction } from 'express'

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' })
      return
    }

    const roleName = req.user.roleName || 'user'
    if (!allowedRoles.includes(roleName)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        required: allowedRoles,
        current: roleName,
      })
      return
    }

    next()
  }
}

export const requireAdmin = requireRole('admin')
