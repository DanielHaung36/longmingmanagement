"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeycloakService = void 0;
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
/**
 * Keycloak OIDC Service
 *
 * Handles Authorization Code Flow:
 * - Build authorization URL for redirect
 * - Exchange authorization code for tokens
 * - Decode ID token (JWT payload)
 * - Build logout URL
 */
class KeycloakService {
    static KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'https://auth.easytool.page';
    static REALM = process.env.KEYCLOAK_REALM || 'longi';
    static CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'longi-web';
    static CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET || '';
    static REDIRECT_URI = process.env.KEYCLOAK_REDIRECT_URI
        || 'https://clientlongi.easytool.page/api/auth/callback';
    static get baseUrl() {
        return `${this.KEYCLOAK_URL}/realms/${this.REALM}`;
    }
    /**
     * Build Keycloak authorization URL for browser redirect
     */
    static getAuthorizationUrl(state) {
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.CLIENT_ID,
            redirect_uri: this.REDIRECT_URI,
            state,
            scope: 'openid email profile',
        });
        return `${this.baseUrl}/protocol/openid-connect/auth?${params.toString()}`;
    }
    /**
     * Exchange authorization code for tokens via Keycloak token endpoint
     */
    static async exchangeCodeForTokens(code) {
        const body = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            client_id: this.CLIENT_ID,
            client_secret: this.CLIENT_SECRET,
            redirect_uri: this.REDIRECT_URI,
        }).toString();
        const url = new URL(`${this.baseUrl}/protocol/openid-connect/token`);
        const isHttps = url.protocol === 'https:';
        const transport = isHttps ? https_1.default : http_1.default;
        return new Promise((resolve, reject) => {
            const req = transport.request({
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(body),
                },
            }, (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        if (res.statusCode !== 200) {
                            reject(new Error(parsed.error_description || parsed.error || 'Token exchange failed'));
                            return;
                        }
                        resolve(parsed);
                    }
                    catch {
                        reject(new Error('Failed to parse token response'));
                    }
                });
            });
            req.on('error', (err) => reject(new Error(`Token request failed: ${err.message}`)));
            req.write(body);
            req.end();
        });
    }
    /**
     * Decode JWT ID token payload (no signature verification — token comes directly from Keycloak over HTTPS)
     */
    static decodeIdToken(idToken) {
        const parts = idToken.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid JWT format');
        }
        // base64url decode the payload
        const payload = parts[1]
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        const decoded = Buffer.from(payload, 'base64').toString('utf8');
        return JSON.parse(decoded);
    }
    /**
     * Build Keycloak logout URL
     */
    static getLogoutUrl(idTokenHint) {
        const params = new URLSearchParams({
            post_logout_redirect_uri: 'https://clientlongi.easytool.page/login',
            client_id: this.CLIENT_ID,
        });
        if (idTokenHint) {
            params.set('id_token_hint', idTokenHint);
        }
        return `${this.baseUrl}/protocol/openid-connect/logout?${params.toString()}`;
    }
}
exports.KeycloakService = KeycloakService;
//# sourceMappingURL=keycloakService.js.map