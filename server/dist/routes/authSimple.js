"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const crypto_1 = __importDefault(require("crypto"));
const client_1 = require("@prisma/client");
const cookieAuthService_1 = require("../services/cookieAuthService");
const keycloakService_1 = require("../services/keycloakService");
const cookieAuth_1 = require("../middleware/cookieAuth");
const authService_1 = require("../services/authService");
const prisma = new client_1.PrismaClient();
const router = express_1.default.Router();
/**
 * @route   POST /api/auth/register
 * @desc    用户注册
 * @access  Public
 */
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, realName, role, status, phone } = req.body;
        // 验证必填字段
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username, email and password are required'
            });
        }
        // 调用注册服务（传递额外参数）
        const user = await cookieAuthService_1.CookieAuthService.register(username, email, password, realName, res, role, status, phone);
        return res.status(201).json({
            success: true,
            message: 'User created successfully',
            user
        });
    }
    catch (error) {
        console.error('Registration failed:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Registration failed'
        });
    }
});
/**
 * @route   POST /api/auth/change-password
 * @desc    用户修改密码
 * @access  Private
 *
 */
// =============================================================================
// 修改密码 (需要认证)
// =============================================================================
router.post("/change-password", cookieAuth_1.cookieAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        // 生产模式
        if (!currentPassword || !newPassword) {
            console.error("Change password failed");
            return res.status(400).json({
                success: false,
                message: "缺少必要参数",
            });
        }
        const result = await authService_1.AuthService.changePassword(req.userId, currentPassword, newPassword);
        return res.json({
            success: true,
            ...result,
        });
    }
    catch (error) {
        console.error('Change password failed:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || "修改密码失败",
        });
    }
});
/**
 * @route   POST /api/auth/login
 * @desc    用户登录（设置Cookie）
 * @access  Public
 *
 * @body {string} username - 用户名
 * @body {string} password - 密码
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('🔐 [Login] Login request received:', { username, origin: req.headers.origin });
        // 验证必填字段
        if (!username || !password) {
            console.log('❌ [Login] Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }
        // 执行登录（自动设置Cookie）
        const user = await cookieAuthService_1.CookieAuthService.login(username, password, res);
        console.log('✅ [Login] Login successful:', { userId: user.id, username: user.username, role: user.role });
        return res.json({
            success: true,
            message: 'Login successful',
            user
        });
    }
    catch (error) {
        console.error('❌ [Login] Login failed:', error.message);
        return res.status(401).json({
            success: false,
            message: error.message || 'Login failed'
        });
    }
});
/**
 * @route   POST /api/auth/logout
 * @desc    用户登出（清除Cookie）
 * @access  Private
 */
router.post('/logout', cookieAuth_1.cookieAuth, async (req, res) => {
    try {
        const sessionToken = cookieAuthService_1.CookieAuthService.extractToken(req.cookies);
        if (sessionToken) {
            await cookieAuthService_1.CookieAuthService.logout(sessionToken, res);
        }
        return res.json({
            success: true,
            message: 'Logout successful'
        });
    }
    catch (error) {
        console.error('Logout failed:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
});
/**
 * @route   GET /api/auth/verify
 * @desc    验证Cookie是否有效（自动刷新）
 * @access  Public
 */
router.get('/verify', async (req, res) => {
    try {
        console.log('🔍 [Verify] Verification request received, Cookies:', Object.keys(req.cookies || {}));
        const sessionToken = cookieAuthService_1.CookieAuthService.extractToken(req.cookies);
        if (!sessionToken) {
            console.log('❌ [Verify] Session token not found');
            return res.status(401).json({
                success: false,
                message: 'Not logged in',
                valid: false
            });
        }
        console.log('✅ [Verify] Session token found, verifying...');
        // 验证Session（自动刷新Cookie）
        const user = await cookieAuthService_1.CookieAuthService.verifySession(sessionToken, res);
        console.log('✅ [Verify] Verification successful:', { userId: user.id, username: user.username });
        return res.json({
            success: true,
            message: 'Cookie valid',
            valid: true,
            user
        });
    }
    catch (error) {
        console.error('❌ [Verify] Verification failed:', error);
        console.error('❌ [Verify] Error stack:', error.stack);
        // 确保始终返回 JSON 格式
        return res.status(401).json({
            success: false,
            message: error.message || 'Session verification failed',
            valid: false,
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});
/**
 * @route   GET /api/auth/me
 * @desc    获取当前登录用户信息
 * @access  Private
 */
router.get('/me', cookieAuth_1.cookieAuth, async (req, res) => {
    try {
        return res.json({
            success: true,
            user: req.user
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to get user information'
        });
    }
});
// =============================================================================
// Keycloak SSO Routes
// =============================================================================
/**
 * @route   GET /api/auth/sso/login
 * @desc    Initiate Keycloak SSO login flow
 * @access  Public
 */
router.get('/sso/login', (req, res) => {
    const redirect = req.query.redirect || '/home';
    const state = crypto_1.default.randomBytes(32).toString('hex');
    // Store state and redirect URL in cookies for validation in callback
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('oauth_state', state, { httpOnly: true, maxAge: 300_000, sameSite: 'lax', path: '/', secure: isProduction });
    res.cookie('oauth_redirect', redirect, { httpOnly: true, maxAge: 300_000, sameSite: 'lax', path: '/', secure: isProduction });
    res.redirect(keycloakService_1.KeycloakService.getAuthorizationUrl(state));
});
/**
 * @route   GET /api/auth/callback
 * @desc    Keycloak OIDC callback — exchange code, create/update user, set session cookie
 * @access  Public (called by Keycloak redirect)
 */
router.get('/callback', async (req, res) => {
    try {
        const { code, state } = req.query;
        const storedState = req.cookies?.oauth_state;
        const redirectUrl = req.cookies?.oauth_redirect || '/home';
        console.log('[SSO Callback] state from query:', state, 'state from cookie:', storedState, 'cookies:', Object.keys(req.cookies || {}));
        // Clear oauth cookies immediately
        res.clearCookie('oauth_state', { path: '/' });
        res.clearCookie('oauth_redirect', { path: '/' });
        // Validate state to prevent CSRF
        if (!code || !state || state !== storedState) {
            console.warn('[SSO Callback] State mismatch or missing code, re-initiating SSO');
            // Re-initiate SSO instead of showing error (handles race from duplicate login requests)
            return res.redirect('/api/auth/sso/login?redirect=' + encodeURIComponent(redirectUrl));
        }
        // Exchange code for tokens
        const tokens = await keycloakService_1.KeycloakService.exchangeCodeForTokens(code);
        const idPayload = keycloakService_1.KeycloakService.decodeIdToken(tokens.id_token);
        const keycloakId = `kc-${idPayload.sub}`;
        const email = idPayload.email;
        const preferredUsername = idPayload.preferred_username;
        const roles = idPayload.realm_access?.roles || [];
        // Map Keycloak realm role → app role (case-insensitive)
        const rolesUpper = roles.map((r) => r.toUpperCase());
        let role = 'USER';
        if (rolesUpper.includes('ADMIN'))
            role = 'ADMIN';
        else if (rolesUpper.includes('MANAGER'))
            role = 'MANAGER';
        console.log(`[SSO Callback] User: ${preferredUsername}, email: ${email}, role: ${role}`);
        // Find existing user by cognitoId, email, or username (case-insensitive)
        let user = await prisma.users.findFirst({
            where: {
                OR: [
                    { cognitoId: keycloakId },
                    { email: { equals: email, mode: 'insensitive' } },
                    { username: { equals: preferredUsername, mode: 'insensitive' } },
                ],
            },
        });
        if (user) {
            // Update cognitoId and role if changed
            const updates = {};
            if (user.cognitoId !== keycloakId)
                updates.cognitoId = keycloakId;
            if (user.role !== role)
                updates.role = role;
            if (Object.keys(updates).length > 0) {
                user = await prisma.users.update({ where: { id: user.id }, data: updates });
            }
        }
        else {
            // Create new user
            user = await prisma.users.create({
                data: {
                    cognitoId: keycloakId,
                    username: preferredUsername,
                    email,
                    password: crypto_1.default.randomBytes(32).toString('hex'), // random password (SSO-only)
                    realName: idPayload.name || preferredUsername,
                    role: role,
                    status: 'ACTIVE',
                },
            });
            console.log(`[SSO Callback] Created new user: ${user.username} (id=${user.id})`);
        }
        // Check user is active
        if (user.status !== 'ACTIVE') {
            return res.redirect('/login?error=' + encodeURIComponent('Account is deactivated. Please contact admin.'));
        }
        // Create session cookie (same as password login)
        await cookieAuthService_1.CookieAuthService.createSessionForUser(user.id, user.username, user.email, role, res);
        // Store id_token for logout (short-lived, httpOnly)
        res.cookie('kc_id_token', tokens.id_token, {
            httpOnly: true,
            maxAge: 8 * 60 * 60 * 1000, // 8 hours
            sameSite: 'lax',
            path: '/',
            secure: process.env.NODE_ENV === 'production',
        });
        console.log(`[SSO Callback] Login successful for ${user.username}, redirecting to ${redirectUrl}`);
        return res.redirect(redirectUrl);
    }
    catch (err) {
        console.error('[SSO Callback] Error:', err.message);
        return res.redirect('/login?error=' + encodeURIComponent(err.message || 'SSO login failed'));
    }
});
/**
 * @route   GET /api/auth/sso/logout
 * @desc    Clear session and redirect to Keycloak logout
 * @access  Public
 */
router.get('/sso/logout', (req, res) => {
    const idTokenHint = req.cookies?.kc_id_token;
    // Clear all auth cookies
    res.clearCookie('longi_session', { path: '/' });
    res.clearCookie('kc_id_token', { path: '/' });
    res.redirect(keycloakService_1.KeycloakService.getLogoutUrl(idTokenHint));
});
exports.default = router;
//# sourceMappingURL=authSimple.js.map