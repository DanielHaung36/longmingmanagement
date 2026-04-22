/**
 * 密码加密工具类
 */
export declare class PasswordUtils {
    private static readonly SALT_ROUNDS;
    /**
     * 加密密码
     * @param plainPassword 明文密码
     * @returns 加密后的密码hash
     */
    static hash(plainPassword: string): Promise<string>;
    /**
     * 验证密码
     * @param plainPassword 明文密码
     * @param hashedPassword 加密后的密码hash
     * @returns 是否匹配
     */
    static verify(plainPassword: string, hashedPassword: string): Promise<boolean>;
    /**
     * 验证密码强度
     * @param password 密码
     * @returns 是否符合强度要求
     */
    static validateStrength(password: string): {
        valid: boolean;
        message?: string;
    };
}
//# sourceMappingURL=password.d.ts.map