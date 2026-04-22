/**
 * 邮件发送工具类
 */
export declare class EmailUtils {
    private static transporter;
    /**
     * 发送密码重置邮件
     * @param to 收件人邮箱
     * @param resetToken 重置token
     * @param username 用户名
     */
    static sendPasswordResetEmail(to: string, resetToken: string, username: string): Promise<void>;
    /**
     * 发送欢迎邮件
     * @param to 收件人邮箱
     * @param username 用户名
     */
    static sendWelcomeEmail(to: string, username: string): Promise<void>;
    /**
     * 发送测试邮件 (用于验证邮件配置)
     * @param to 收件人邮箱
     */
    static sendTestEmail(to: string): Promise<void>;
}
//# sourceMappingURL=email.d.ts.map