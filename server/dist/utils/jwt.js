"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWTUtils = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config/config");
/**
 * JWT Token工具类
 */
class JWTUtils {
    /**
     * 生成Access Token
     * @param payload 用户信息
     * @returns JWT token
     */
    static generateAccessToken(payload) {
        const secret = config_1.config.jwt.secret;
        if (!secret) {
            throw new Error('JWT_SECRET未配置');
        }
        return jsonwebtoken_1.default.sign({ ...payload, type: 'access' }, secret, { expiresIn: config_1.config.jwt.accessExpiresIn });
    }
    /**
     * 生成Refresh Token
     * @param payload 用户信息
     * @returns JWT token
     */
    static generateRefreshToken(payload) {
        const secret = config_1.config.jwt.refreshSecret;
        if (!secret) {
            throw new Error('JWT_REFRESH_SECRET未配置');
        }
        return jsonwebtoken_1.default.sign({ ...payload, type: 'refresh' }, secret, { expiresIn: config_1.config.jwt.refreshExpiresIn });
    }
    /**
     * 生成一对token
     */
    static generateTokenPair(payload) {
        return {
            accessToken: this.generateAccessToken(payload),
            refreshToken: this.generateRefreshToken(payload),
            expiresIn: 15 * 60 // 15分钟(秒)
        };
    }
    /**
     * 验证Access Token
     * @param token JWT token
     * @returns 解码后的payload
     */
    static verifyAccessToken(token) {
        const secret = config_1.config.jwt.secret;
        if (!secret) {
            throw new Error('JWT_SECRET未配置');
        }
        try {
            const payload = jsonwebtoken_1.default.verify(token, secret);
            if (payload.type !== 'access') {
                throw new Error('Token类型错误');
            }
            return payload;
        }
        catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Token已过期');
            }
            if (error.name === 'JsonWebTokenError') {
                throw new Error('Token无效');
            }
            throw error;
        }
    }
    /**
     * 验证Refresh Token
     * @param token JWT token
     * @returns 解码后的payload
     */
    static verifyRefreshToken(token) {
        const secret = config_1.config.jwt.refreshSecret;
        if (!secret) {
            throw new Error('JWT_REFRESH_SECRET未配置');
        }
        try {
            const payload = jsonwebtoken_1.default.verify(token, secret);
            if (payload.type !== 'refresh') {
                throw new Error('Token类型错误');
            }
            return payload;
        }
        catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Refresh Token已过期,请重新登录');
            }
            if (error.name === 'JsonWebTokenError') {
                throw new Error('Refresh Token无效');
            }
            throw error;
        }
    }
    /**
     * 解码token(不验证签名)
     * @param token JWT token
     * @returns 解码后的payload
     */
    static decode(token) {
        return jsonwebtoken_1.default.decode(token);
    }
}
exports.JWTUtils = JWTUtils;
//# sourceMappingURL=jwt.js.map