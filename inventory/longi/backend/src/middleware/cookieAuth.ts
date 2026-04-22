import { Request, Response, NextFunction } from 'express'
import { CookieAuthService } from '../services/cookieAuthService'

export async function cookieAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionToken = CookieAuthService.extractToken(req.cookies)

    if (!sessionToken) {
      res.status(401).json({ success: false, message: 'Not authenticated' })
      return
    }

    const user = await CookieAuthService.verifySession(sessionToken, res)
    req.user = user
    req.userId = user.id
    next()
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Authentication failed'
    res.status(401).json({ success: false, message: msg })
  }
}
