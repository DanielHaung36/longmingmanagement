function buildDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  // Fallback: build from individual vars (K8s configmap/secret pattern)
  const host = process.env.DB_HOST
  const port = process.env.DB_PORT || '5432'
  const name = process.env.DB_NAME
  const user = process.env.DB_USER
  const pass = process.env.DB_PASS
  if (host && name && user) {
    const encodedPass = pass ? encodeURIComponent(pass) : ''
    return `postgresql://${user}:${encodedPass}@${host}:${port}/${name}`
  }
  throw new Error('Missing DATABASE_URL or DB_HOST/DB_NAME/DB_USER')
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8080', 10),
  databaseUrl: buildDatabaseUrl(),
  sessionSecret: process.env.SESSION_SECRET || 'inventory-secret-key-change-in-production',
  keycloak: {
    url: process.env.KEYCLOAK_URL || 'https://auth.easytool.page',
    realm: process.env.KEYCLOAK_REALM || 'longi',
    clientId: process.env.KEYCLOAK_CLIENT_ID || 'longi-web',
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
    redirectUri: process.env.KEYCLOAK_REDIRECT_URI || 'https://inventory.easytool.page/api/auth/callback',
  },
  corsOrigins: (process.env.CORS_ORIGINS || 'https://inventory.easytool.page,http://localhost:3000,http://localhost:3001').split(','),
  get isProduction() { return this.nodeEnv === 'production' },
  get isDev() { return this.nodeEnv === 'development' },
}
