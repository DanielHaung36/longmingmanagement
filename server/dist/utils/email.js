"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailUtils = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = require("../config/config");
/**
 * 邮件发送工具类
 */
class EmailUtils {
    static transporter = nodemailer_1.default.createTransport({
        host: config_1.config.smtp.host,
        port: config_1.config.smtp.port,
        secure: false, // MailHog不需要TLS
        auth: config_1.config.smtp.user && config_1.config.smtp.pass ? {
            user: config_1.config.smtp.user,
            pass: config_1.config.smtp.pass
        } : undefined,
        tls: {
            rejectUnauthorized: false // 本地开发环境
        }
    });
    /**
     * 发送密码重置邮件
     * @param to 收件人邮箱
     * @param resetToken 重置token
     * @param username 用户名
     */
    static async sendPasswordResetEmail(to, resetToken, username) {
        const resetUrl = `${config_1.config.clientUrl}/reset-password?token=${resetToken}`;
        const mailOptions = {
            from: `"${config_1.config.smtp.fromName}" <${config_1.config.smtp.fromEmail}>`,
            to,
            subject: '重置密码 - Longi项目管理系统',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1890ff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; padding: 12px 24px; background: #1890ff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>重置密码</h1>
            </div>
            <div class="content">
              <p>您好, <strong>${username}</strong>,</p>
              <p>我们收到了重置您账户密码的请求。点击下方按钮可以重置密码:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">重置密码</a>
              </p>
              <p>或者复制以下链接到浏览器:</p>
              <p style="background: #fff; padding: 10px; border: 1px solid #ddd; word-break: break-all;">${resetUrl}</p>
              <p><strong>注意:</strong></p>
              <ul>
                <li>该链接有效期为 <strong>1小时</strong></li>
                <li>如果您没有请求重置密码,请忽略此邮件</li>
                <li>为了安全,请勿将此链接分享给他人</li>
              </ul>
            </div>
            <div class="footer">
              <p>© 2024 Longi项目管理系统. 保留所有权利.</p>
            </div>
          </div>
        </body>
        </html>
      `,
            text: `
您好, ${username},

我们收到了重置您账户密码的请求。

请访问以下链接重置密码:
${resetUrl}

该链接有效期为1小时。

如果您没有请求重置密码,请忽略此邮件。

© 2024 Longi项目管理系统
      `
        };
        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`✉️ 密码重置邮件已发送到: ${to}`);
        }
        catch (error) {
            console.error('邮件发送失败:', error);
            throw new Error('邮件发送失败');
        }
    }
    /**
     * 发送欢迎邮件
     * @param to 收件人邮箱
     * @param username 用户名
     */
    static async sendWelcomeEmail(to, username) {
        const mailOptions = {
            from: `"${config_1.config.smtp.fromName}" <${config_1.config.smtp.fromEmail}>`,
            to,
            subject: '欢迎加入Longi项目管理系统',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #52c41a; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; padding: 12px 24px; background: #52c41a; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>欢迎加入!</h1>
            </div>
            <div class="content">
              <p>您好, <strong>${username}</strong>,</p>
              <p>欢迎加入Longi项目管理系统!</p>
              <p>您的账户已经成功创建,现在可以开始使用系统的各项功能。</p>
              <p style="text-align: center;">
                <a href="${config_1.config.clientUrl}" class="button">立即登录</a>
              </p>
              <p>如有任何问题,请联系系统管理员。</p>
            </div>
            <div class="footer">
              <p>© 2024 Longi项目管理系统. 保留所有权利.</p>
            </div>
          </div>
        </body>
        </html>
      `
        };
        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`✉️ 欢迎邮件已发送到: ${to}`);
        }
        catch (error) {
            console.error('邮件发送失败:', error);
            // 欢迎邮件发送失败不应该阻止注册流程
        }
    }
    /**
     * 发送测试邮件 (用于验证邮件配置)
     * @param to 收件人邮箱
     */
    static async sendTestEmail(to) {
        const mailOptions = {
            from: `"${config_1.config.smtp.fromName}" <${config_1.config.smtp.fromEmail}>`,
            to,
            subject: '测试邮件 - Longi项目管理系统',
            html: '<h1>邮件配置测试成功!</h1><p>您的邮件服务已正确配置。</p>',
            text: '邮件配置测试成功! 您的邮件服务已正确配置。'
        };
        await this.transporter.sendMail(mailOptions);
        console.log(`✉️ 测试邮件已发送到: ${to}`);
    }
}
exports.EmailUtils = EmailUtils;
//# sourceMappingURL=email.js.map