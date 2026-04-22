/**
 * Keycloak OIDC Service
 *
 * Handles Authorization Code Flow:
 * - Build authorization URL for redirect
 * - Exchange authorization code for tokens
 * - Decode ID token (JWT payload)
 * - Build logout URL
 */
export declare class KeycloakService {
    private static KEYCLOAK_URL;
    private static REALM;
    private static CLIENT_ID;
    private static CLIENT_SECRET;
    private static REDIRECT_URI;
    private static get baseUrl();
    /**
     * Build Keycloak authorization URL for browser redirect
     */
    static getAuthorizationUrl(state: string): string;
    /**
     * Exchange authorization code for tokens via Keycloak token endpoint
     */
    static exchangeCodeForTokens(code: string): Promise<{
        access_token: string;
        id_token: string;
        refresh_token: string;
    }>;
    /**
     * Decode JWT ID token payload (no signature verification — token comes directly from Keycloak over HTTPS)
     */
    static decodeIdToken(idToken: string): {
        sub: string;
        email: string;
        preferred_username: string;
        realm_access?: {
            roles: string[];
        };
        name?: string;
    };
    /**
     * Build Keycloak logout URL
     */
    static getLogoutUrl(idTokenHint?: string): string;
}
//# sourceMappingURL=keycloakService.d.ts.map