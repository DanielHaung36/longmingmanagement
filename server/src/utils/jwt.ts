import jwt from 'jsonwebtoken'
import { config } from '../config/config'

export interface JWTPayload {
  userId: number
  username: string
  email: string
  type: 'access' | 'refresh'
}

/**
 * JWT Token工具类
 */
export class JWTUtils {
  /**
   * 生成Access Token
   * @param payload 用户信息
   * @returns JWT token
   */
  static generateAccessToken(payload: Omit<JWTPayload, 'type'>): string {
    const secret = config.jwt.secret
    if (!secret) {
      throw new Error('JWT_SECRET未配置')
    }

    return jwt.sign(
      { ...payload, type: 'access' },
      secret,
      { expiresIn: config.jwt.accessExpiresIn } as jwt.SignOptions
    )
  }

  /**
   * 生成Refresh Token
   * @param payload 用户信息
   * @returns JWT token
   */
  static generateRefreshToken(payload: Omit<JWTPayload, 'type'>): string {
    const secret = config.jwt.refreshSecret
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET未配置')
    }

    return jwt.sign(
      { ...payload, type: 'refresh' },
      secret,
      { expiresIn: config.jwt.refreshExpiresIn } as jwt.SignOptions
    )
  }

  /**
   * 生成一对token
   */
  static generateTokenPair(payload: Omit<JWTPayload, 'type'>) {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
      expiresIn: 15 * 60 // 15分钟(秒)
    }
  }

  /**
   * 验证Access Token
   * @param token JWT token
   * @returns 解码后的payload
   */
  static verifyAccessToken(token: string): JWTPayload {
    const secret = config.jwt.secret
    if (!secret) {
      throw new Error('JWT_SECRET未配置')
    }

    try {
      const payload = jwt.verify(token, secret) as JWTPayload
      if (payload.type !== 'access') {
        throw new Error('Token类型错误')
      }
      return payload
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token已过期')
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Token无效')
      }
      throw error
    }
  }

  /**
   * 验证Refresh Token
   * @param token JWT token
   * @returns 解码后的payload
   */
  static verifyRefreshToken(token: string): JWTPayload {
    const secret = config.jwt.refreshSecret
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET未配置')
    }

    try {
      const payload = jwt.verify(token, secret) as JWTPayload
      if (payload.type !== 'refresh') {
        throw new Error('Token类型错误')
      }
      return payload
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh Token已过期,请重新登录')
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Refresh Token无效')
      }
      throw error
    }
  }

  /**
   * 解码token(不验证签名)
   * @param token JWT token
   * @returns 解码后的payload
   */
  static decode(token: string): JWTPayload | null {
    return jwt.decode(token) as JWTPayload | null
  }
}
