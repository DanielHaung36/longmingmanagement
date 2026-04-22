import { config } from '../config/config'

export class KeycloakService {
  private static get baseUrl() {
    return `${config.keycloak.url}/realms/${config.keycloak.realm}`
  }

  static getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.keycloak.clientId,
      redirect_uri: config.keycloak.redirectUri,
      state,
      scope: 'openid email profile',
    })
    return `${this.baseUrl}/protocol/openid-connect/auth?${params.toString()}`
  }

  static async exchangeCodeForTokens(code: string): Promise<{
    access_token: string
    id_token: string
    refresh_token: string
  }> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: config.keycloak.clientId,
      client_secret: config.keycloak.clientSecret,
      redirect_uri: config.keycloak.redirectUri,
    })

    const res = await fetch(`${this.baseUrl}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error_description || data.error || 'Token exchange failed')
    }

    return data
  }

  static decodeIdToken(idToken: string): {
    sub: string
    email: string
    preferred_username: string
    realm_access?: { roles: string[] }
    name?: string
  } {
    const parts = idToken.split('.')
    if (parts.length !== 3) throw new Error('Invalid JWT format')

    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const decoded = Buffer.from(payload, 'base64').toString('utf8')
    return JSON.parse(decoded)
  }

  static getLogoutUrl(idTokenHint?: string): string {
    // Derive post-logout redirect from the configured redirect URI (same origin + /login)
    const redirectOrigin = config.keycloak.redirectUri.replace(/\/api\/auth\/callback$/, '')
    const params = new URLSearchParams({
      post_logout_redirect_uri: `${redirectOrigin}/login`,
      client_id: config.keycloak.clientId,
    })
    if (idTokenHint) {
      params.set('id_token_hint', idTokenHint)
    }
    return `${this.baseUrl}/protocol/openid-connect/logout?${params.toString()}`
  }
}
