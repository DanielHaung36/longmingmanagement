import { PrismaClient } from '@prisma/client'
import { Response } from 'express'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Session 配置
const SESSION_CONFIG = {
  cookieName: 'longi_session',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
  secret: process.env.SESSION_SECRET || 'longi-secret-key-change-in-production',
  // 环境检测
  isDev: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production'
}

/**
 * Session数据接口
 */
export interface SessionData {
  userId: number
  username: string
  email: string
  role: string
  realName?: string
  createdAt: number
  expiresAt: number
}

/**
 * 用户信息接口（返回给前端）
 */
export interface UserInfo {
  id: number
  username: string
  email: string
  role: string
  realName?: string
  profilePictureUrl?: string
  status: string
  phone?: string
  position?: string
  teamId?: number
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Cookie认证服务类
 *
 * 核心功能：
 * 1. 登录/登出
 * 2. Session创建/验证/删除
 * 3. Cookie自动刷新
 * 4. 简单清晰，只用Cookie
 */
export class CookieAuthService {
  /**
   * 用户注册
   */
  static async register(
    username: string,
    email: string,
    password: string,
    realName: string | undefined,
    res: Response,
    role?: string,
    status?: string,
    phone?: string
  ): Promise<UserInfo> {
    // 1. 检查用户名是否已存在（不区分大小写）
    const existingUsername = await prisma.users.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive'
        }
      }
    })
    if (existingUsername) {
      throw new Error('Username already exists')
    }

    // 2. 检查邮箱是否已存在（不区分大小写）
    const existingEmail = await prisma.users.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive'
        }
      }
    })
    if (existingEmail) {
      throw new Error('Email already registered')
    }

    // 3. 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 4. 创建用户
    const user = await prisma.users.create({
      data: {
        username,
        email,
        password: hashedPassword,
        realName: realName || username,
        phone,
        cognitoId: `local-${Date.now()}-${username}`,
        status: (status as any) || 'ACTIVE',
        role: (role as any) || 'USER',
      },
      select: {
        id: true,
        username: true,
        email: true,
        realName: true,
        profilePictureUrl: true,
        status: true,
        role: true,
        phone: true,
        position: true,
        teamId: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    // 5. 创建Session并设置Cookie
    const sessionToken = await this.createSession(user.id, user.username, user.email, user.role)
    this.setCookie(res, sessionToken)

    // 6. 返回用户信息
    return user as UserInfo
  }

  /**
   * 用户登录
   */
  static async login(username: string, password: string, res: Response): Promise<UserInfo> {
    console.log('🔑 [CookieAuth] 开始登录流程:', username)

    // 1. 查找用户（支持用户名或邮箱登录，不区分大小写）
    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { username: { equals: username, mode: 'insensitive' } },
          { email: { equals: username, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        username: true,
        email: true,
        password: true,
        realName: true,
        profilePictureUrl: true,
        status: true,
        role: true,
        phone: true,
        position: true,
        teamId: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!user) {
      console.log('❌ [CookieAuth] 用户不存在:', username)
      throw new Error('用户名或密码错误')
    }
    console.log('✅ [CookieAuth] 找到用户:', { id: user.id, username: user.username })

    // 2. 验证密码
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      console.log('❌ [CookieAuth] 密码错误')
      throw new Error('用户名或密码错误')
    }
    console.log('✅ [CookieAuth] 密码验证通过')

    // 3. 检查用户状态
    if (user.status !== 'ACTIVE') {
      console.log('❌ [CookieAuth] 用户状态异常:', user.status)
      throw new Error('账户已被停用，请联系管理员')
    }
    console.log('✅ [CookieAuth] 用户状态正常')

    // 4. 创建Session
    const sessionToken = await this.createSession(user.id, user.username, user.email, user.role)
    console.log('✅ [CookieAuth] Session创建成功, Token长度:', sessionToken.length)

    // 5. 设置Cookie
    this.setCookie(res, sessionToken)

    // 6. 更新最后登录时间
    await prisma.users.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // 7. 返回用户信息（不含密码）
    const { password: _, ...userInfo } = user
    return userInfo as UserInfo
  }

  /**
   * Create session for an externally-authenticated user (e.g. Keycloak SSO callback)
   */
  static async createSessionForUser(
    userId: number, username: string, email: string, role: string, res: Response
  ): Promise<void> {
    const sessionToken = await this.createSession(userId, username, email, role)
    this.setCookie(res, sessionToken)
    await prisma.users.update({ where: { id: userId }, data: { lastLoginAt: new Date() } })
  }

  /**
   * 用户登出
   */
  static async logout(sessionToken: string, res: Response): Promise<void> {
    // 1. 删除Session记录
    await this.deleteSession(sessionToken)

    // 2. 清除Cookie
    this.clearCookie(res)
  }

  /**
   * 验证Session并返回用户信息
   */
  static async verifySession(sessionToken: string, res?: Response): Promise<UserInfo> {
    try {
      // 1. 解密Session
      const sessionData = this.decryptSession(sessionToken)

      // 2. 检查是否过期
      if (Date.now() > sessionData.expiresAt) {
        throw new Error('Session已过期，请重新登录')
      }

      // 3. 从数据库验证用户是否仍然存在且活跃
      let user
      try {
        user = await prisma.users.findUnique({
          where: { id: sessionData.userId },
          select: {
            id: true,
            username: true,
            email: true,
            realName: true,
            profilePictureUrl: true,
            status: true,
            role: true,
            phone: true,
            position: true,
            teamId: true,
            createdAt: true,
            updatedAt: true,
          }
        })
      } catch (dbError: any) {
        console.error('❌ [verifySession] Database query failed:', dbError)
        throw new Error('数据库连接失败，请稍后重试')
      }

      if (!user) {
        throw new Error('用户不存在')
      }

      if (user.status !== 'ACTIVE') {
        throw new Error('账户已被停用')
      }

      // 4. 自动刷新Cookie（如果还剩不到2天就延长）
      const remainingTime = sessionData.expiresAt - Date.now()
      const twoDays = 2 * 24 * 60 * 60 * 1000

      if (res && remainingTime < twoDays) {
        const newToken = await this.createSession(user.id, user.username, user.email, user.role)
        this.setCookie(res, newToken)
        console.log(`🔄 Session自动刷新: ${user.username}`)
      }

      return user as UserInfo
    } catch (error: any) {
      // 确保错误被正确传递，包含有用的信息
      console.error('❌ [verifySession] Verification failed:', error.message)
      throw error
    }
  }

  /**
   * 创建Session（加密存储）
   */
  private static async createSession(
    userId: number,
    username: string,
    email: string,
    role: string
  ): Promise<string> {
    const now = Date.now()
    const sessionData: SessionData = {
      userId,
      username,
      email,
      role,
      createdAt: now,
      expiresAt: now + SESSION_CONFIG.maxAge
    }

    // 使用AES加密Session数据
    const sessionToken = this.encryptSession(sessionData)

    // 可选：存储到数据库（用于跟踪活跃Session）
    // await prisma.sessions.create({ data: { token: sessionToken, userId, expiresAt: new Date(sessionData.expiresAt) }})

    return sessionToken
  }

  /**
   * 加密Session数据（AES-256-CBC）
   */
  private static encryptSession(data: SessionData): string {
    const text = JSON.stringify(data)

    // 生成密钥和IV
    const key = crypto.scryptSync(SESSION_CONFIG.secret, 'salt', 32)
    const iv = crypto.randomBytes(16)

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    // 返回 IV + 加密数据（用:分隔）
    return iv.toString('hex') + ':' + encrypted
  }

  /**
   * 解密Session数据
   */
  private static decryptSession(token: string): SessionData {
    try {
      const parts = token.split(':')
      if (parts.length !== 2) {
        console.error('❌ [decryptSession] Invalid token format')
        throw new Error('Session格式无效')
      }

      const iv = Buffer.from(parts[0], 'hex')
      const encryptedText = parts[1]

      const key = crypto.scryptSync(SESSION_CONFIG.secret, 'salt', 32)
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)

      let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return JSON.parse(decrypted)
    } catch (error: any) {
      console.error('❌ [decryptSession] Decryption failed:', error.message)
      if (error.message.includes('格式无效')) {
        throw error // 保持原始错误消息
      }
      throw new Error('Session无效或已损坏')
    }
  }

  /**
   * 删除Session
   */
  private static async deleteSession(_sessionToken: string): Promise<void> {
    // 如果Session存储在数据库，这里删除
    // await prisma.sessions.deleteMany({ where: { token: _sessionToken }})
  }

  /**
   * 设置Cookie
   */
  private static setCookie(res: Response, token: string): void {
    const cookieOptions = {
      maxAge: SESSION_CONFIG.maxAge,
      httpOnly: true, // 防止XSS攻击
      secure: SESSION_CONFIG.isProduction, // 🔥 生产环境使用HTTPS
      sameSite: 'lax' as const, // lax允许跨站GET请求带Cookie
      path: '/',
      // 不设置domain，让浏览器自动处理（支持跨端口）
    }

    res.cookie(SESSION_CONFIG.cookieName, token, cookieOptions)

    if (SESSION_CONFIG.isDev) {
      console.log('✅ Cookie已设置:', {
        name: SESSION_CONFIG.cookieName,
        options: cookieOptions,
        tokenLength: token.length
      })
    }
  }

  /**
   * 清除Cookie
   */
  private static clearCookie(res: Response): void {
    res.clearCookie(SESSION_CONFIG.cookieName, { path: '/' })
  }

  /**
   * 从Cookie中提取Session Token
   */
  static extractToken(cookies: any): string | null {
    return cookies?.[SESSION_CONFIG.cookieName] || null
  }
}
