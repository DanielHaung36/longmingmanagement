import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8081', 10),
  clientUrl: process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000',
  isDevelopment: process.env.NODE_ENV === 'development',
  devAutoLogin: process.env.DEV_AUTO_LOGIN === 'true',

  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:superadminpass@localhost:5432/projectmanagement'
  },

  storage: {
    localRoot: process.env.LOCAL_PROJECT_ROOT || 'C:/Longi/ProjectData/Projects',
    templateRoot: process.env.TEMPLATE_ROOT || 'C:/Longi/ProjectData/Templates',
    excelPath: process.env.EXCEL_LOCAL_PATH || 'C:/Longi/ProjectData/Excel/LJA Job Register Rev3.xlsx',
    logPath: process.env.LOG_PATH || 'C:/Longi/ProjectData/Logs',
    oneDriveBase: process.env.ONEDRIVE_BASE || '/Documents - Longi Australia/03 Project Management/Client'
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-jwt-secret-key-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dev-jwt-refresh-secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES || '7d'
  },

  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '1025', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    fromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@longi.com',
    fromName: process.env.SMTP_FROM_NAME || 'Longi项目管理系统'
  },

  cookie: {
    name: 'longi_session',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/'
  },

  cors: {
    origin: process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  },

  temporal: {
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
    namespace: process.env.TEMPORAL_NAMESPACE || 'default',
    startWorker: process.env.START_WORKER === 'true'
  },

  neo4j: {
    uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
    username: process.env.NEO4J_USERNAME || 'neo4j',
    password: process.env.NEO4J_PASSWORD || 'longi2024',
    database: process.env.NEO4J_DATABASE || 'neo4j'
  },

  pagination: {
    defaultPage: 1,
    defaultLimit: 20,
    maxLimit: 100
  }
};

export function validateConfig(): void {
  const requiredEnvVars = ['DATABASE_URL'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:');
    missingEnvVars.forEach(envVar => {
      console.error(`   - ${envVar}`);
    });
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  }

  console.log('Environment variables validated successfully');
}

export function printConfig(): void {
  console.log('\nServer Configuration:');
  console.log(`   - Environment: ${config.nodeEnv}`);
  console.log(`   - Port: ${config.port}`);
  console.log(`   - Client URL: ${config.clientUrl}`);
  console.log(`   - Dev Auto Login: ${config.devAutoLogin}`);
  console.log(`   - Local Storage: ${config.storage.localRoot}`);
  console.log(`   - Excel Path: ${config.storage.excelPath}`);
  console.log('');
}

export default config;
