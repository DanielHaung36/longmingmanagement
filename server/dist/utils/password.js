"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordUtils = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
/**
 * 密码加密工具类
 */
class PasswordUtils {
    static SALT_ROUNDS = 10;
    /**
     * 加密密码
     * @param plainPassword 明文密码
     * @returns 加密后的密码hash
     */
    static async hash(plainPassword) {
        return bcrypt_1.default.hash(plainPassword, this.SALT_ROUNDS);
    }
    /**
     * 验证密码
     * @param plainPassword 明文密码
     * @param hashedPassword 加密后的密码hash
     * @returns 是否匹配
     */
    static async verify(plainPassword, hashedPassword) {
        return bcrypt_1.default.compare(plainPassword, hashedPassword);
    }
    /**
     * 验证密码强度
     * @param password 密码
     * @returns 是否符合强度要求
     */
    static validateStrength(password) {
        if (!password || password.length < 8) {
            return { valid: false, message: '密码长度至少8位' };
        }
        if (!/[A-Z]/.test(password)) {
            return { valid: false, message: '密码必须包含至少一个大写字母' };
        }
        if (!/[a-z]/.test(password)) {
            return { valid: false, message: '密码必须包含至少一个小写字母' };
        }
        if (!/[0-9]/.test(password)) {
            return { valid: false, message: '密码必须包含至少一个数字' };
        }
        return { valid: true };
    }
}
exports.PasswordUtils = PasswordUtils;
//# sourceMappingURL=password.js.map