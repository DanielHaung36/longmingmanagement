import bcrypt from 'bcrypt'

/**
 * 密码加密工具类
 */
export class PasswordUtils {
  private static readonly SALT_ROUNDS = 10

  /**
   * 加密密码
   * @param plainPassword 明文密码
   * @returns 加密后的密码hash
   */
  static async hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, this.SALT_ROUNDS)
  }

  /**
   * 验证密码
   * @param plainPassword 明文密码
   * @param hashedPassword 加密后的密码hash
   * @returns 是否匹配
   */
  static async verify(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword)
  }

  /**
   * 验证密码强度
   * @param password 密码
   * @returns 是否符合强度要求
   */
  static validateStrength(password: string): { valid: boolean; message?: string } {
    if (!password || password.length < 8) {
      return { valid: false, message: '密码长度至少8位' }
    }

    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: '密码必须包含至少一个大写字母' }
    }

    if (!/[a-z]/.test(password)) {
      return { valid: false, message: '密码必须包含至少一个小写字母' }
    }

    if (!/[0-9]/.test(password)) {
      return { valid: false, message: '密码必须包含至少一个数字' }
    }

    return { valid: true }
  }
}
