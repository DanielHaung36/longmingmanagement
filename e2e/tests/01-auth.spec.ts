/**
 * 01 - 认证测试
 * admin 和 danielhuang 两账号各自登录 & session 保持
 */
import { test, expect } from '@playwright/test';
import { loginAs, FRONTEND, ADMIN, DANIEL } from '../helpers/auth';

test.describe('认证', () => {
  test('未登录访问首页应跳转到登录/SSO', async ({ page }) => {
    await page.goto(`${FRONTEND}/home`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const url = page.url();
    // 要么重定向到 login，要么重定向到 SSO provider
    expect(url.includes('login') || url.includes('sso') || url.includes('microsoft') || url !== `${FRONTEND}/home`).toBeTruthy();
  });

  test('admin 注入 cookie 后可访问受保护页面', async ({ context, page }) => {
    await loginAs(context, ADMIN);
    await page.goto(`${FRONTEND}/home`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 12000 });
  });

  test('danielhuang 注入 cookie 后可访问受保护页面', async ({ context, page }) => {
    await loginAs(context, DANIEL);
    await page.goto(`${FRONTEND}/home`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);
    // 普通用户应看到 Dashboard
    await expect(page.locator('body')).not.toContainText('Forbidden');
  });

  test('admin 可以访问 Users 管理页', async ({ context, page }) => {
    await loginAs(context, ADMIN);
    await page.goto(`${FRONTEND}/users`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/forbidden|403/);
  });

  test('admin 可以访问 Settings 页', async ({ context, page }) => {
    await loginAs(context, ADMIN);
    await page.goto(`${FRONTEND}/settings`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
  });
});
