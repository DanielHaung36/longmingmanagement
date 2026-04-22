export interface JWTPayload {
    userId: number;
    username: string;
    email: string;
    type: 'access' | 'refresh';
}
/**
 * JWT Token工具类
 */
export declare class JWTUtils {
    /**
     * 生成Access Token
     * @param payload 用户信息
     * @returns JWT token
     */
    static generateAccessToken(payload: Omit<JWTPayload, 'type'>): string;
    /**
     * 生成Refresh Token
     * @param payload 用户信息
     * @returns JWT token
     */
    static generateRefreshToken(payload: Omit<JWTPayload, 'type'>): string;
    /**
     * 生成一对token
     */
    static generateTokenPair(payload: Omit<JWTPayload, 'type'>): {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    };
    /**
     * 验证Access Token
     * @param token JWT token
     * @returns 解码后的payload
     */
    static verifyAccessToken(token: string): JWTPayload;
    /**
     * 验证Refresh Token
     * @param token JWT token
     * @returns 解码后的payload
     */
    static verifyRefreshToken(token: string): JWTPayload;
    /**
     * 解码token(不验证签名)
     * @param token JWT token
     * @returns 解码后的payload
     */
    static decode(token: string): JWTPayload | null;
}
//# sourceMappingURL=jwt.d.ts.map