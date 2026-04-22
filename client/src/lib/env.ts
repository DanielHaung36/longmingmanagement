/**
 * 环境变量验证和类型安全导出
 *
 * 功能：
 * 1. 启动时验证必需的环境变量是否存在
 * 2. 提供类型安全的环境变量访问
 * 3. 避免在代码中直接使用 process.env
 *
 * 使用方法：
 * import { env } from '@/lib/env';
 * console.log(env.apiBaseUrl);
 */

// ==================== 必需的环境变量列表 ====================
const requiredEnvVars = [
  'NEXT_PUBLIC_API_BASE_URL',
  'NEXT_PUBLIC_WS_URL',
] as const;

// ==================== 启动时验证环境变量 ====================
function validateEnv() {
  const missingVars: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }

  if (missingVars.length > 0) {
    const errorMessage = `
========================================
❌ 缺少必需的环境变量！
========================================

缺失的变量:
${missingVars.map(v => `  - ${v}`).join('\n')}

请检查 .env.local 文件是否正确配置。

开发环境配置示例:
  NEXT_PUBLIC_API_BASE_URL=/api
  NEXT_PUBLIC_WS_URL=ws://localhost:8081
  NEXT_PUBLIC_APP_NAME=Longi项目管理系统
  NEXT_PUBLIC_APP_VERSION=2.0.0

========================================
`;

    // 开发环境抛出错误，生产环境仅警告
    if (process.env.NODE_ENV === 'development') {
      console.log(process.env.NODE_ENV);
      
      throw new Error(errorMessage);
    } else {
      console.error(errorMessage);
    }
  }
}

// 执行验证
validateEnv();

// ==================== 类型安全的环境变量导出 ====================
export const env = {
  // API 配置
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL!,
  wsUrl: process.env.NEXT_PUBLIC_WS_URL!,

  // 应用配置
  appName: process.env.NEXT_PUBLIC_APP_NAME!,
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION!,

  // 环境标识
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
} as const;

// 开发环境打印配置信息
if (env.isDevelopment) {
  console.log('[ENV] 环境变量加载成功:');
  console.log(`  - API Base URL: ${env.apiBaseUrl}`);
  console.log(`  - WebSocket URL: ${env.wsUrl}`);
  console.log(`  - App Name: ${env.appName}`);
  console.log(`  - App Version: ${env.appVersion}`);
  console.log(`  - Environment: ${process.env.NODE_ENV}`);
}

// ==================== 类型定义 ====================
export type Env = typeof env;
