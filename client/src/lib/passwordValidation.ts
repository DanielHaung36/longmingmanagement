/**
 * 密码验证工具函数
 *
 * 密码要求:
 * - 至少8个字符
 * - 包含至少一个大写字母
 * - 包含至少一个小写字母
 * - 包含至少一个数字
 */

export interface PasswordValidationResult {
  valid: boolean
  message?: string
  errors: string[]
}

/**
 * 验证密码强度
 * @param password 要验证的密码
 * @returns 验证结果对象
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = []

  // 检查密码是否为空
  if (!password) {
    return {
      valid: false,
      message: 'Password is required',
      errors: ['Password is required']
    }
  }

  // 检查长度
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  // 检查是否包含大写字母
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must include at least one uppercase letter')
  }

  // 检查是否包含小写字母
  if (!/[a-z]/.test(password)) {
    errors.push('Password must include at least one lowercase letter')
  }

  // 检查是否包含数字
  if (!/[0-9]/.test(password)) {
    errors.push('Password must include at least one number')
  }

  return {
    valid: errors.length === 0,
    message: errors.length > 0 ? errors[0] : undefined,
    errors
  }
}

/**
 * 获取密码强度等级
 * @param password 要检查的密码
 * @returns 强度等级: 'weak' | 'medium' | 'strong'
 */
export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (!password) return 'weak'

  let score = 0

  // 长度评分
  if (password.length >= 8) score++
  if (password.length >= 12) score++

  // 复杂度评分
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++ // 特殊字符

  if (score <= 2) return 'weak'
  if (score <= 4) return 'medium'
  return 'strong'
}

/**
 * 获取密码强度的颜色
 * @param strength 强度等级
 * @returns Tailwind CSS 颜色类
 */
export function getPasswordStrengthColor(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return 'text-red-600'
    case 'medium':
      return 'text-yellow-600'
    case 'strong':
      return 'text-green-600'
  }
}

/**
 * 获取密码强度的显示文本
 * @param strength 强度等级
 * @returns 显示文本
 */
export function getPasswordStrengthText(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return 'Weak'
    case 'medium':
      return 'Medium'
    case 'strong':
      return 'Strong'
  }
}
