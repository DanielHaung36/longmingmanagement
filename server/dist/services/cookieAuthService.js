"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CookieAuthService = void 0;
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
// Session 配置
const SESSION_CONFIG = {
    cookieName: 'longi_session',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
    secret: process.env.SESSION_SECRET || 'longi-secret-key-change-in-production',
    // 环境检测
    isDev: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production'
};
/**
 * Cookie认证服务类
 *
 * 核心功能：
 * 1. 登录/登出
 * 2. Session创建/验证/删除
 * 3. Cookie自动刷新
 * 4. 简单清晰，只用Cookie
 */
class CookieAuthService {
    /**
     * 用户注册
     */
    static async register(username, email, password, realName, res, role, status, phone) {
        // 1. 检查用户名是否已存在（不区分大小写）
        const existingUsername = await prisma.users.findFirst({
            where: {
                username: {
                    equals: username,
                    mode: 'insensitive'
                }
            }
        });
        if (existingUsername) {
            throw new Error('Username already exists');
        }
        // 2. 检查邮箱是否已存在（不区分大小写）
        const existingEmail = await prisma.users.findFirst({
            where: {
                email: {
                    equals: email,
                    mode: 'insensitive'
                }
            }
        });
        if (existingEmail) {
            throw new Error('Email already registered');
        }
        // 3. 加密密码
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // 4. 创建用户
        const user = await prisma.users.create({
            data: {
                username,
                email,
                password: hashedPassword,
                realName: realName || username,
                phone,
                cognitoId: `local-${Date.now()}-${username}`,
                status: status || 'ACTIVE',
                role: role || 'USER',
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
        });
        // 5. 创建Session并设置Cookie
        const sessionToken = await this.createSession(user.id, user.username, user.email, user.role);
        this.setCookie(res, sessionToken);
        // 6. 返回用户信息
        return user;
    }
    /**
     * 用户登录
     */
    static async login(username, password, res) {
        console.log('🔑 [CookieAuth] 开始登录流程:', username);
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
        });
        if (!user) {
            console.log('❌ [CookieAuth] 用户不存在:', username);
            throw new Error('用户名或密码错误');
        }
        console.log('✅ [CookieAuth] 找到用户:', { id: user.id, username: user.username });
        // 2. 验证密码
        const isValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isValid) {
            console.log('❌ [CookieAuth] 密码错误');
            throw new Error('用户名或密码错误');
        }
        console.log('✅ [CookieAuth] 密码验证通过');
        // 3. 检查用户状态
        if (user.status !== 'ACTIVE') {
            console.log('❌ [CookieAuth] 用户状态异常:', user.status);
            throw new Error('账户已被停用，请联系管理员');
        }
        console.log('✅ [CookieAuth] 用户状态正常');
        // 4. 创建Session
        const sessionToken = await this.createSession(user.id, user.username, user.email, user.role);
        console.log('✅ [CookieAuth] Session创建成功, Token长度:', sessionToken.length);
        // 5. 设置Cookie
        this.setCookie(res, sessionToken);
        // 6. 更新最后登录时间
        await prisma.users.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });
        // 7. 返回用户信息（不含密码）
        const { password: _, ...userInfo } = user;
        return userInfo;
    }
    /**
     * Create session for an externally-authenticated user (e.g. Keycloak SSO callback)
     */
    static async createSessionForUser(userId, username, email, role, res) {
        const sessionToken = await this.createSession(userId, username, email, role);
        this.setCookie(res, sessionToken);
        await prisma.users.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
    }
    /**
     * 用户登出
     */
    static async logout(sessionToken, res) {
        // 1. 删除Session记录
        await this.deleteSession(sessionToken);
        // 2. 清除Cookie
        this.clearCookie(res);
    }
    /**
     * 验证Session并返回用户信息
     */
    static async verifySession(sessionToken, res) {
        try {
            // 1. 解密Session
            const sessionData = this.decryptSession(sessionToken);
            // 2. 检查是否过期
            if (Date.now() > sessionData.expiresAt) {
                throw new Error('Session已过期，请重新登录');
            }
            // 3. 从数据库验证用户是否仍然存在且活跃
            let user;
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
                });
            }
            catch (dbError) {
                console.error('❌ [verifySession] Database query failed:', dbError);
                throw new Error('数据库连接失败，请稍后重试');
            }
            if (!user) {
                throw new Error('用户不存在');
            }
            if (user.status !== 'ACTIVE') {
                throw new Error('账户已被停用');
            }
            // 4. 自动刷新Cookie（如果还剩不到2天就延长）
            const remainingTime = sessionData.expiresAt - Date.now();
            const twoDays = 2 * 24 * 60 * 60 * 1000;
            if (res && remainingTime < twoDays) {
                const newToken = await this.createSession(user.id, user.username, user.email, user.role);
                this.setCookie(res, newToken);
                console.log(`🔄 Session自动刷新: ${user.username}`);
            }
            return user;
        }
        catch (error) {
            // 确保错误被正确传递，包含有用的信息
            console.error('❌ [verifySession] Verification failed:', error.message);
            throw error;
        }
    }
    /**
     * 创建Session（加密存储）
     */
    static async createSession(userId, username, email, role) {
        const now = Date.now();
        const sessionData = {
            userId,
            username,
            email,
            role,
            createdAt: now,
            expiresAt: now + SESSION_CONFIG.maxAge
        };
        // 使用AES加密Session数据
        const sessionToken = this.encryptSession(sessionData);
        // 可选：存储到数据库（用于跟踪活跃Session）
        // await prisma.sessions.create({ data: { token: sessionToken, userId, expiresAt: new Date(sessionData.expiresAt) }})
        return sessionToken;
    }
    /**
     * 加密Session数据（AES-256-CBC）
     */
    static encryptSession(data) {
        const text = JSON.stringify(data);
        // 生成密钥和IV
        const key = crypto_1.default.scryptSync(SESSION_CONFIG.secret, 'salt', 32);
        const iv = crypto_1.default.randomBytes(16);
        const cipher = crypto_1.default.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        // 返回 IV + 加密数据（用:分隔）
        return iv.toString('hex') + ':' + encrypted;
    }
    /**
     * 解密Session数据
     */
    static decryptSession(token) {
        try {
            const parts = token.split(':');
            if (parts.length !== 2) {
                console.error('❌ [decryptSession] Invalid token format');
                throw new Error('Session格式无效');
            }
            const iv = Buffer.from(parts[0], 'hex');
            const encryptedText = parts[1];
            const key = crypto_1.default.scryptSync(SESSION_CONFIG.secret, 'salt', 32);
            const decipher = crypto_1.default.createDecipheriv('aes-256-cbc', key, iv);
            let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return JSON.parse(decrypted);
        }
        catch (error) {
            console.error('❌ [decryptSession] Decryption failed:', error.message);
            if (error.message.includes('格式无效')) {
                throw error; // 保持原始错误消息
            }
            throw new Error('Session无效或已损坏');
        }
    }
    /**
     * 删除Session
     */
    static async deleteSession(_sessionToken) {
        // 如果Session存储在数据库，这里删除
        // await prisma.sessions.deleteMany({ where: { token: _sessionToken }})
    }
    /**
     * 设置Cookie
     */
    static setCookie(res, token) {
        const cookieOptions = {
            maxAge: SESSION_CONFIG.maxAge,
            httpOnly: true, // 防止XSS攻击
            secure: SESSION_CONFIG.isProduction, // 🔥 生产环境使用HTTPS
            sameSite: 'lax', // lax允许跨站GET请求带Cookie
            path: '/',
            // 不设置domain，让浏览器自动处理（支持跨端口）
        };
        res.cookie(SESSION_CONFIG.cookieName, token, cookieOptions);
        if (SESSION_CONFIG.isDev) {
            console.log('✅ Cookie已设置:', {
                name: SESSION_CONFIG.cookieName,
                options: cookieOptions,
                tokenLength: token.length
            });
        }
    }
    /**
     * 清除Cookie
     */
    static clearCookie(res) {
        res.clearCookie(SESSION_CONFIG.cookieName, { path: '/' });
    }
    /**
     * 从Cookie中提取Session Token
     */
    static extractToken(cookies) {
        return cookies?.[SESSION_CONFIG.cookieName] || null;
    }
}
exports.CookieAuthService = CookieAuthService;
//# sourceMappingURL=cookieAuthService.js.map