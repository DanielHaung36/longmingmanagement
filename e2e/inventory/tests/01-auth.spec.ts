/**
 * 01 - 认证测试
 * 未登录跳转 / admin 登录 / danielhuang 登录 / 登出
 */
import { test, expect } from '@playwright/test';
import { loginViaSSO, FRONTEND, ADMIN, DANIEL } from '../helpers/auth';

test.describe('认证', () => {
  test('未登录访问首页应跳转到 /login', async ({ page }) => {
    await page.goto(`${FRONTEND}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    const url = page.url();
    expect(
      url.includes('/login') || url.includes('auth.easytool') || url !== `${FRONTEND}/dashboard`
    ).toBeTruthy();
  });

  test('未登录访问 /login 页面正常显示（自动跳 Keycloak）', async ({ page }) => {
    await page.goto(`${FRONTEND}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    // 登录页会自动跳转到 Keycloak SSO 或显示 SSO 按钮（有错误时）
    const url = page.url();
    const isOnKeycloak = url.includes('auth.easytool.page');
    const hasSsoBtn = await page.getByRole('button', { name: /sign in with sso/i }).isVisible().catch(() => false);
    const hasRedirecting = await page.getByText(/redirecting/i).isVisible().catch(() => false);
    expect(isOnKeycloak || hasSsoBtn || hasRedirecting).toBeTruthy();
  });

  test('admin 可以登录并访问 dashboard', async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('body')).not.toContainText('Unauthorized');
    await expect(page.locator('body')).not.toContainText('Forbidden');
  });

  test('danielhuang 可以登录并访问 dashboard', async ({ page }) => {
    await loginViaSSO(page, DANIEL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('body')).not.toContainText('Unauthorized');
  });

  test('admin 登录后 /auth/verify API 返回用户信息', async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    const resp = await page.request.get(`${FRONTEND}/api/auth/verify`);
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    // 返回 user 对象，包含 username 或 email
    expect(data).toBeTruthy();
  });

  test('admin 登录后 /auth/me 返回 admin 信息', async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    const resp = await page.request.get(`${FRONTEND}/api/auth/me`);
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    const str = JSON.stringify(data).toLowerCase();
    expect(str.includes('admin') || str.includes('longi')).toBeTruthy();
  });
});
