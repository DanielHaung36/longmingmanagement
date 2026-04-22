import { PrismaClient } from '@prisma/client'
import { PasswordUtils } from '../utils/password'
import { JWTUtils } from '../utils/jwt'
import { EmailUtils } from '../utils/email'
import crypto from 'crypto'

const prisma = new PrismaClient()

export interface RegisterInput {
  username: string
  email: string
  password: string
  realName?: string
  phone?: string
}

export interface LoginInput {
  username: string
  password: string
}

/**
 * 认证服务类
 */
export class AuthService {
  /**
   * 用户注册
   */
  static async register(data: RegisterInput) {
    const { username, email, password, realName, phone } = data

    // 1. 验证密码强度
    const passwordCheck = PasswordUtils.validateStrength(password)
    if (!passwordCheck.valid) {
      throw new Error(passwordCheck.message)
    }

    // 2. 检查用户名是否已存在
    const existingUsername = await prisma.users.findUnique({
      where: { username }
    })
    if (existingUsername) {
      throw new Error('用户名已被使用')
    }

    // 3. 检查邮箱是否已存在
    const existingEmail = await prisma.users.findUnique({
      where: { email }
    })
    if (existingEmail) {
      throw new Error('邮箱已被注册')
    }

    // 4. 加密密码
    const hashedPassword = await PasswordUtils.hash(password)

    // 5. 创建用户
    const user = await prisma.users.create({
      data: {
        username,
        email,
        password: hashedPassword,
        realName: realName || username,
        phone,
        cognitoId: `local-${Date.now()}-${username}`, // 生产环境会用真实的cognito ID
        status: 'ACTIVE',
        role: 'USER' // ✅ 设置默认角色为普通用户
      }
    })

    // 6. 发送欢迎邮件 (异步,不阻塞)
    EmailUtils.sendWelcomeEmail(email, username).catch(err =>
      console.error('发送欢迎邮件失败:', err)
    )

    // 7. 生成tokens
    const tokens = JWTUtils.generateTokenPair({
      userId: user.id,
      username: user.username,
      email: user.email
    })

    // 8. 保存refresh token到数据库
    await prisma.refresh_tokens.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天
      }
    })

    // 9. 返回用户信息和tokens (不返回密码)
    const { password: _, ...userWithoutPassword } = user
    return {
      user: userWithoutPassword,  // 改为 user (单数) 与前端保持一致
      ...tokens
    }
  }

  /**
   * 用户登录
   */
  static async login(data: LoginInput, ipAddress?: string, userAgent?: string) {
    const { username, password } = data

    // 1. 查找用户
    const user = await prisma.users.findUnique({
      where: { username }
    })

    if (!user) {
      throw new Error('用户名或密码错误')
    }

    // 2. 验证密码
    const isValid = await PasswordUtils.verify(password, user.password)
    if (!isValid) {
      throw new Error('用户名或密码错误')
    }

    // 3. 检查用户状态
    if (user.status !== 'ACTIVE') {
      throw new Error('账户已被停用,请联系管理员')
    }

    // 4. 生成tokens
    const tokens = JWTUtils.generateTokenPair({
      userId: user.id,
      username: user.username,
      email: user.email
    })

    // 5. 保存refresh token
    await prisma.refresh_tokens.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress,
        userAgent
      }
    })

    // 6. 更新最后登录时间
    await prisma.users.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // 7. 返回用户信息和tokens
    const { password: _, ...userWithoutPassword } = user
    return {
      user: userWithoutPassword,  // 改为 user (单数) 与前端保持一致
      ...tokens
    }
  }

  /**
   * 刷新Token
   */
  static async refreshToken(refreshToken: string) {
    // 1. 验证refresh token
    let payload
    try {
      payload = JWTUtils.verifyRefreshToken(refreshToken)
    } catch (error: any) {
      throw new Error(error.message)
    }

    // 2. 检查token是否在数据库中且未被撤销
    const tokenRecord = await prisma.refresh_tokens.findUnique({
      where: { token: refreshToken },
      include: { users: true }
    })

    if (!tokenRecord) {
      throw new Error('Refresh Token无效')
    }

    if (tokenRecord.isRevoked) {
      throw new Error('Refresh Token已被撤销')
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new Error('Refresh Token已过期')
    }

    // 3. 生成新的access token
    const newAccessToken = JWTUtils.generateAccessToken({
      userId: tokenRecord.users.id,
      username: tokenRecord.users.username,
      email: tokenRecord.users.email
    })

    return {
      accessToken: newAccessToken,
      expiresIn: 15 * 60 // 15分钟
    }
  }

  /**
   * 登出
   */
  static async logout(refreshToken: string) {
    // 撤销refresh token
    await prisma.refresh_tokens.updateMany({
      where: { token: refreshToken },
      data: { isRevoked: true }
    })
  }

  /**
   * 忘记密码 - 发送重置邮件
   */
  static async forgotPassword(email: string) {
    // 1. 查找用户
    const user = await prisma.users.findUnique({
      where: { email }
    })

    if (!user) {
      // 为了安全,不透露用户是否存在
      return { message: '如果该邮箱已注册,您将收到重置密码的邮件' }
    }

    // 2. 生成重置token (随机字符串)
    const resetToken = crypto.randomBytes(32).toString('hex')

    // 3. 保存到数据库
    await prisma.password_reset_tokens.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1小时
      }
    })

    // 4. 发送重置邮件
    await EmailUtils.sendPasswordResetEmail(email, resetToken, user.username)

    return { message: '如果该邮箱已注册,您将收到重置密码的邮件' }
  }

  /**
   * 重置密码
   */
  static async resetPassword(token: string, newPassword: string) {
    // 1. 验证密码强度
    const passwordCheck = PasswordUtils.validateStrength(newPassword)
    if (!passwordCheck.valid) {
      throw new Error(passwordCheck.message)
    }

    // 2. 查找token
    const tokenRecord = await prisma.password_reset_tokens.findUnique({
      where: { token },
      include: { users: true }
    })

    if (!tokenRecord) {
      throw new Error('重置链接无效')
    }

    if (tokenRecord.isUsed) {
      throw new Error('该重置链接已被使用')
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new Error('重置链接已过期')
    }

    // 3. 加密新密码
    const hashedPassword = await PasswordUtils.hash(newPassword)

    // 4. 更新密码
    await prisma.users.update({
      where: { id: tokenRecord.userId },
      data: { password: hashedPassword }
    })

    // 5. 标记token为已使用
    await prisma.password_reset_tokens.update({
      where: { id: tokenRecord.id },
      data: { isUsed: true }
    })

    // 6. 撤销该用户的所有refresh tokens (强制重新登录)
    await prisma.refresh_tokens.updateMany({
      where: { userId: tokenRecord.userId },
      data: { isRevoked: true }
    })

    return { message: '密码重置成功,请使用新密码登录' }
  }

  /**
   * 修改密码 (已登录用户)
   */
  static async changePassword(userId: number, currentPassword: string, newPassword: string) {
    // 1. 查找用户
    const user = await prisma.users.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new Error('用户不存在')
    }

    // 2. 验证当前密码
    const isValid = await PasswordUtils.verify(currentPassword, user.password)
    if (!isValid) {
      throw new Error('当前密码错误')
    }

    // 3. 验证新密码强度
    const passwordCheck = PasswordUtils.validateStrength(newPassword)
    if (!passwordCheck.valid) {
      throw new Error(passwordCheck.message)
    }

    // 4. 加密新密码
    const hashedPassword = await PasswordUtils.hash(newPassword)

    // 5. 更新密码
    await prisma.users.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })

    // 6. 撤销所有refresh tokens (强制重新登录)
    await prisma.refresh_tokens.updateMany({
      where: { userId },
      data: { isRevoked: true }
    })

    return { message: '密码修改成功,请重新登录' }
  }

  /**
   * 验证Access Token并获取用户信息
   */
  static async verifyAccessToken(token: string) {
    const payload = JWTUtils.verifyAccessToken(token)

    const user = await prisma.users.findUnique({
      where: { id: payload.userId }
    })

    if (!user) {
      throw new Error('用户不存在')
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('账户已被停用')
    }

    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  }
}
