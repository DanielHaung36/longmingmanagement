import { BrowserContext, request, APIRequestContext } from '@playwright/test';

export const FRONTEND = 'https://clientlongi.easytool.page';
export const API      = 'https://serverlongi.easytool.page';
const COOKIE_NAME     = 'longi_session';

export interface AuthUser { username: string; password: string }

export const ADMIN:   AuthUser = { username: 'admin',       password: 'Longi@123' };
export const DANIEL:  AuthUser = { username: 'danielhuang', password: 'Longi@123' };

/**
 * 通过后端 API 登录，将 longi_session cookie 注入浏览器 context
 */
export async function loginAs(context: BrowserContext, user: AuthUser = ADMIN): Promise<void> {
  const apiCtx = await request.newContext({ baseURL: API, ignoreHTTPSErrors: true });
  const resp = await apiCtx.post('/api/auth/login', {
    data: { username: user.username, password: user.password },
  });

  const setCookieHeader: string | string[] = resp.headers()['set-cookie'] ?? '';
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader.join('; ') : setCookieHeader;
  const match = cookies.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) throw new Error(`登录失败 (${user.username})：未找到 ${COOKIE_NAME} cookie`);

  await context.addCookies([{
    name:     COOKIE_NAME,
    value:    match[1],
    domain:   'clientlongi.easytool.page',
    path:     '/',
    httpOnly: true,
    secure:   true,
    sameSite: 'Lax',
  }]);

  await apiCtx.dispose();
}

/**
 * 获取登录后的 API 请求上下文（带 session cookie），用于直接调用后端 API 做数据准备/验证/清理
 */
export async function apiAs(context: BrowserContext): Promise<{ req: APIRequestContext; cleanup: () => Promise<void> }> {
  const cookies = await context.cookies();
  const session = cookies.find(c => c.name === COOKIE_NAME);
  const req = await request.newContext({
    baseURL: API,
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: {
      Cookie: `${COOKIE_NAME}=${session?.value ?? ''}`,
    },
  });
  return { req, cleanup: () => req.dispose() };
}

/** 快速获取当前登录用户信息 */
export async function getMe(context: BrowserContext) {
  const { req, cleanup } = await apiAs(context);
  const resp = await req.get('/api/auth/me');
  await cleanup();
  return resp.json();
}
