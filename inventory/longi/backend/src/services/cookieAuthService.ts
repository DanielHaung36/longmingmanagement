import prisma from '../utils/prisma'
import { Response } from 'express'
import crypto from 'crypto'
import { config } from '../config/config'

const SESSION_CONFIG = {
  cookieName: 'inventory_session',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
}

export interface SessionData {
  userId: number
  username: string
  email: string
  roleId?: number
  roleName?: string
  createdAt: number
  expiresAt: number
}

export interface UserInfo {
  id: number
  username: string
  email: string
  fullName?: string
  isActive: boolean
  roleId?: number
  roleName?: string
  avatarUrl?: string
}

export class CookieAuthService {
  static async createSessionForUser(
    userId: number, username: string, email: string,
    roleId: number | null, roleName: string | null, res: Response
  ): Promise<void> {
    const sessionToken = this.createSession(userId, username, email, roleId, roleName)
    this.setCookie(res, sessionToken)
    await prisma.users.update({ where: { id: userId }, data: { last_login_at: new Date() } })
  }

  static async logout(_sessionToken: string, res: Response): Promise<void> {
    this.clearCookie(res)
  }

  static async verifySession(sessionToken: string, res?: Response): Promise<UserInfo> {
    const sessionData = this.decryptSession(sessionToken)

    if (Date.now() > sessionData.expiresAt) {
      throw new Error('Session expired')
    }

    const user = await prisma.users.findUnique({
      where: { id: sessionData.userId },
      include: { role: true },
    })

    if (!user) throw new Error('User not found')
    if (!user.is_active) throw new Error('Account deactivated')

    // Auto-refresh cookie if less than 2 days remaining
    const remainingTime = sessionData.expiresAt - Date.now()
    const twoDays = 2 * 24 * 60 * 60 * 1000
    if (res && remainingTime < twoDays) {
      const newToken = this.createSession(
        user.id, user.username, user.email, user.role_id, user.role?.name || null
      )
      this.setCookie(res, newToken)
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name || undefined,
      isActive: user.is_active ?? true,
      roleId: user.role_id || undefined,
      roleName: user.role?.name || undefined,
      avatarUrl: user.avatar_url || undefined,
    }
  }

  static extractToken(cookies: Record<string, string>): string | null {
    return cookies?.[SESSION_CONFIG.cookieName] || null
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private static createSession(
    userId: number, username: string, email: string,
    roleId?: number | null, roleName?: string | null
  ): string {
    const now = Date.now()
    const sessionData: SessionData = {
      userId,
      username,
      email,
      roleId: roleId ?? undefined,
      roleName: roleName ?? undefined,
      createdAt: now,
      expiresAt: now + SESSION_CONFIG.maxAge,
    }
    return this.encryptSession(sessionData)
  }

  private static encryptSession(data: SessionData): string {
    const text = JSON.stringify(data)
    const key = crypto.scryptSync(config.sessionSecret, 'salt', 32)
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return iv.toString('hex') + ':' + encrypted
  }

  private static decryptSession(token: string): SessionData {
    try {
      const parts = token.split(':')
      if (parts.length !== 2) throw new Error('Invalid session format')

      const iv = Buffer.from(parts[0], 'hex')
      const encryptedText = parts[1]
      const key = crypto.scryptSync(config.sessionSecret, 'salt', 32)
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      return JSON.parse(decrypted)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'unknown'
      if (msg === 'Invalid session format') throw error
      throw new Error('Session invalid or corrupted')
    }
  }

  private static setCookie(res: Response, token: string): void {
    res.cookie(SESSION_CONFIG.cookieName, token, {
      maxAge: SESSION_CONFIG.maxAge,
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax' as const,
      path: '/',
    })
  }

  private static clearCookie(res: Response): void {
    res.clearCookie(SESSION_CONFIG.cookieName, { path: '/' })
  }
}
