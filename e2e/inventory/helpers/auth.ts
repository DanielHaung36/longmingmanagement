import { Page, BrowserContext } from '@playwright/test';

export const FRONTEND = 'https://inventory.easytool.page';

export interface AuthUser { username: string; password: string }

export const ADMIN:  AuthUser = { username: 'admin',       password: 'Longi@123' };
export const DANIEL: AuthUser = { username: 'danielhuang', password: 'Longi@123' };

/**
 * 通过 SSO (Keycloak) 登录 inventory 系统
 * 支持两种情况:
 *   A) /login 页有 "Sign in with SSO" 按钮 → 点击后跳到 Keycloak
 *   B) /login 页直接重定向到 Keycloak (自动 SSO) → 跳过按钮点击
 */
export async function loginViaSSO(page: Page, user: AuthUser = ADMIN): Promise<void> {
  await page.goto(`${FRONTEND}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // 等待页面稳定 (允许自动重定向)
  await page.waitForTimeout(2000);

  const currentUrl = page.url();

  if (!currentUrl.includes('auth.easytool.page')) {
    // 情况 A: 还在 inventory login 页，需要点击 SSO 按钮
    const ssoBtn = page.getByRole('button', { name: /sign in with sso/i });
    const hasSsoBtn = await ssoBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasSsoBtn) {
      await ssoBtn.click();
    }
    // 等待跳转到 Keycloak
    await page.waitForURL(/auth\.easytool\.page/, { timeout: 20000 });
  }
  // 情况 B: 已经在 Keycloak 页，直接填写凭据

  // 填写 Keycloak 表单
  await page.locator('#username, input[name="username"]').fill(user.username);
  await page.locator('#password, input[name="password"]').fill(user.password);
  await page.getByRole('button', { name: /sign in|log in|login/i }).click();

  // 等待跳转回 inventory app
  await page.waitForURL(/inventory\.easytool\.page/, { timeout: 20000 });
  await page.waitForLoadState('networkidle');
}
