import { Request, Response } from 'express'
import crypto from 'crypto'
import prisma from '../utils/prisma'
import { CookieAuthService } from '../services/cookieAuthService'
import { KeycloakService } from '../services/keycloakService'
import { config } from '../config/config'
import { logger } from '../utils/logger'

export const ssoLogin = (req: Request, res: Response): void => {
  const redirect = (req.query.redirect as string) || '/'
  const state = crypto.randomBytes(32).toString('hex')

  res.cookie('oauth_state', state, { httpOnly: true, maxAge: 300_000, sameSite: 'lax', path: '/', secure: config.isProduction })
  res.cookie('oauth_redirect', redirect, { httpOnly: true, maxAge: 300_000, sameSite: 'lax', path: '/', secure: config.isProduction })

  res.redirect(KeycloakService.getAuthorizationUrl(state))
}

export const callback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state } = req.query as { code?: string; state?: string }
    const storedState = req.cookies?.oauth_state
    const redirectUrl = req.cookies?.oauth_redirect || '/'

    res.clearCookie('oauth_state', { path: '/' })
    res.clearCookie('oauth_redirect', { path: '/' })

    if (!code || !state || state !== storedState) {
      res.redirect('/login?error=' + encodeURIComponent('Authentication failed: invalid state'))
      return
    }

    const tokens = await KeycloakService.exchangeCodeForTokens(code)
    const idPayload = KeycloakService.decodeIdToken(tokens.id_token)

    const keycloakId = `kc-${idPayload.sub}`
    const email = idPayload.email
    const preferredUsername = idPayload.preferred_username
    const kcRoles = idPayload.realm_access?.roles || []

    // Map Keycloak role to inventory role name
    let roleName = 'user'
    if (kcRoles.includes('ADMIN') || kcRoles.includes('admin')) roleName = 'admin'
    else if (kcRoles.includes('MANAGER') || kcRoles.includes('finance_leader')) roleName = 'finance_leader'
    else if (kcRoles.includes('operations_staff')) roleName = 'operations_staff'

    logger.info(`SSO Callback: user=${preferredUsername}, email=${email}, role=${roleName}`)

    // Find the role record
    let roleRecord = await prisma.role.findFirst({ where: { name: roleName } })
    if (!roleRecord) {
      roleRecord = await prisma.role.findFirst({ where: { name: 'user' } })
    }

    // Find existing user: cognito_id first (exact), then fall back to email/username
    // This prevents unique constraint violations when multiple rows match the OR condition
    let user = await prisma.users.findFirst({
      where: { cognito_id: keycloakId },
      include: { role: true },
    })
    if (!user) {
      user = await prisma.users.findFirst({
        where: {
          OR: [
            { email: { equals: email, mode: 'insensitive' } },
            { username: { equals: preferredUsername, mode: 'insensitive' } },
          ],
        },
        include: { role: true },
      })
    }

    if (user) {
      const updates: Record<string, unknown> = {}
      if (user.cognito_id !== keycloakId) updates.cognito_id = keycloakId
      if (roleRecord && user.role_id !== roleRecord.id) updates.role_id = roleRecord.id
      if (Object.keys(updates).length > 0) {
        user = await prisma.users.update({
          where: { id: user.id },
          data: updates,
          include: { role: true },
        })
      }
    } else {
      user = await prisma.users.create({
        data: {
          cognito_id: keycloakId,
          username: preferredUsername,
          email,
          password_hash: crypto.randomBytes(32).toString('hex'),
          full_name: idPayload.name || preferredUsername,
          is_active: true,
          role_id: roleRecord?.id || null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        include: { role: true },
      })
      logger.info(`Created new user: ${user.username} (id=${user.id})`)
    }

    if (!user.is_active) {
      res.redirect('/login?error=' + encodeURIComponent('Account is deactivated.'))
      return
    }

    await CookieAuthService.createSessionForUser(
      user.id, user.username, user.email,
      user.role_id, user.role?.name || null, res
    )

    // Store id_token for logout
    res.cookie('kc_id_token', tokens.id_token, {
      httpOnly: true,
      maxAge: 8 * 60 * 60 * 1000,
      sameSite: 'lax',
      path: '/',
      secure: config.isProduction,
    })

    res.redirect(redirectUrl)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'SSO login failed'
    logger.error('SSO Callback error', { error: msg })
    res.redirect('/login?error=' + encodeURIComponent(msg))
  }
}

export const ssoLogout = (req: Request, res: Response): void => {
  const idTokenHint = req.cookies?.kc_id_token

  res.clearCookie('inventory_session', { path: '/' })
  res.clearCookie('kc_id_token', { path: '/' })

  res.redirect(KeycloakService.getLogoutUrl(idTokenHint))
}

/** Query full user with role + permissions from DB */
async function getFullUser(userId: number) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: { role_permissions: { include: { permission: true } } },
      },
      user_permissions: { include: { permission: true } },
    },
  })
  if (!user) return null

  // Merge role permissions + direct user permissions (deduplicated by id)
  const rolePerms = user.role?.role_permissions.map(rp => rp.permission) ?? []
  const directPerms = user.user_permissions.map(up => up.permission)
  const seen = new Set<number>()
  const allPerms = [...rolePerms, ...directPerms].filter(p => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })

  return {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    email: user.email,
    is_active: user.is_active,
    created_at: user.created_at?.toISOString() || null,
    avatar_url: user.avatar_url,
    role: user.role ? {
      id: user.role.id,
      name: user.role.name,
      display_name: user.role.display_name,
      description: user.role.description,
    } : null,
    permissions: allPerms.map(p => ({
      id: p.id,
      name: p.name,
      display_name: p.display_name,
      description: p.description,
    })),
  }
}

export const verify = async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionToken = CookieAuthService.extractToken(req.cookies)
    if (!sessionToken) {
      res.status(401).json({ success: false, valid: false, message: 'Not logged in' })
      return
    }

    const sessionUser = await CookieAuthService.verifySession(sessionToken, res)
    const user = await getFullUser(sessionUser.id)
    res.json({ success: true, valid: true, user })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Verification failed'
    res.status(401).json({ success: false, valid: false, message: msg })
  }
}

export const me = async (req: Request, res: Response): Promise<void> => {
  const user = await getFullUser(req.userId!)
  res.json({ success: true, user })
}
