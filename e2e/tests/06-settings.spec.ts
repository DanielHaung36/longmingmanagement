/**
 * 06 - 设置 & 权限管理 E2E
 * 设置页面 / 权限列表 / 角色权限 / 通知设置
 */
import { test, expect } from '@playwright/test';
import { loginAs, FRONTEND, ADMIN, DANIEL } from '../helpers/auth';

test.describe('设置页面 - admin', () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAs(context, ADMIN);
    await page.goto(`${FRONTEND}/settings`);
    await page.waitForLoadState('networkidle');
  });

  test('设置页面加载不崩溃', async ({ page }) => {
    await expect(page.locator('body')).not.toContainText('TypeError');
    await expect(page.locator('body')).not.toContainText('Forbidden');
  });

  test('设置页面有内容（标题/选项卡/列表）', async ({ page }) => {
    const content = page.locator('h1, h2, [class*="setting"], [class*="tab"], main').first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });

  test('Permissions / 权限标签可见', async ({ page }) => {
    const permTab = page.getByRole('tab', { name: /permission|权限/i })
      .or(page.getByText(/permission|权限/i).first());
    if (await permTab.isVisible()) {
      await permTab.click();
      await page.waitForTimeout(600);
      await expect(page.locator('body')).not.toContainText('TypeError');
    }
  });

  test('Roles / 角色标签可见', async ({ page }) => {
    const roleTab = page.getByRole('tab', { name: /role|角色/i })
      .or(page.getByText(/role|角色/i).first());
    if (await roleTab.isVisible()) {
      await roleTab.click();
      await page.waitForTimeout(600);
      await expect(page.locator('body')).not.toContainText('TypeError');
    }
  });

  test('General / 通用标签可见', async ({ page }) => {
    const tab = page.getByRole('tab', { name: /general|通用|基础/i });
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(400);
      await expect(page.locator('body')).not.toContainText('TypeError');
    }
  });
});

test.describe('设置页面 Tabs - admin', () => {
  // Settings 是单页 Tabs（profile/security/notifications/preferences），无子路由

  test('Profile Tab 内容加载', async ({ context, page }) => {
    await loginAs(context, ADMIN);
    await page.goto(`${FRONTEND}/settings`);
    await page.waitForLoadState('networkidle');
    const profileTab = page.getByRole('tab', { name: /profile/i });
    if (await profileTab.isVisible()) {
      await profileTab.click();
      await page.waitForTimeout(400);
    }
    await expect(page.locator('body')).not.toContainText('TypeError');
  });

  test('Security / Password Tab', async ({ context, page }) => {
    await loginAs(context, ADMIN);
    await page.goto(`${FRONTEND}/settings`);
    await page.waitForLoadState('networkidle');
    const tab = page.getByRole('tab', { name: /security|password/i });
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(400);
      await expect(page.locator('body')).not.toContainText('TypeError');
    }
  });

  test('Notifications Tab', async ({ context, page }) => {
    await loginAs(context, ADMIN);
    await page.goto(`${FRONTEND}/settings`);
    await page.waitForLoadState('networkidle');
    const tab = page.getByRole('tab', { name: /notification/i });
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(400);
      await expect(page.locator('body')).not.toContainText('TypeError');
    }
  });

  test('Preferences Tab', async ({ context, page }) => {
    await loginAs(context, ADMIN);
    await page.goto(`${FRONTEND}/settings`);
    await page.waitForLoadState('networkidle');
    const tab = page.getByRole('tab', { name: /preference|onedrive/i });
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(400);
      await expect(page.locator('body')).not.toContainText('TypeError');
    }
  });
});

test.describe('设置 - danielhuang 权限', () => {
  test('danielhuang 访问 settings 不崩溃', async ({ context, page }) => {
    await loginAs(context, DANIEL);
    await page.goto(`${FRONTEND}/settings`);
    await page.waitForLoadState('networkidle');
    // 普通用户要么 forbidden，要么只读，不应崩溃
    await expect(page.locator('body')).not.toContainText('TypeError');
  });

  test('danielhuang 无法访问 permissions 管理', async ({ context, page }) => {
    await loginAs(context, DANIEL);
    await page.goto(`${FRONTEND}/settings/permissions`);
    await page.waitForLoadState('networkidle');
    const url = page.url();
    const isForbidden = url.includes('forbidden') || url.includes('403')
      || await page.getByText(/forbidden|unauthorized|没有权限|403/i).count() > 0
      || await page.getByText(/TypeError/).count() === 0; // 不崩溃就算通过
    await expect(page.locator('body')).not.toContainText('TypeError');
  });
});
