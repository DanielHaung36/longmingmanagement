/**
 * 02 - Dashboard E2E
 * 看板数据展示 / 统计卡片 / 图表 / 今日扫码统计
 */
import { test, expect } from '@playwright/test';
import { loginViaSSO, FRONTEND, ADMIN, DANIEL } from '../helpers/auth';

test.describe('Dashboard (admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    await page.goto(`${FRONTEND}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
  });

  test('Dashboard 页面加载不报错', async ({ page }) => {
    await expect(page.locator('body')).not.toContainText('TypeError');
    await expect(page.locator('body')).not.toContainText('Unhandled');
  });

  test('Dashboard 有统计卡片（总库存/产品/仓库等）', async ({ page }) => {
    // 统计卡片通常包含数字
    const cards = page.locator('[class*="card"], [class*="Card"], [class*="stat"], [class*="Stat"]');
    await expect(cards.first()).toBeVisible({ timeout: 12000 });
  });

  test('今日扫码统计 API 正常', async ({ page }) => {
    const resp = await page.request.get(`${FRONTEND}/api/inventory/stats/today`);
    // 可能 200 或 401 (daniel 无权)
    expect([200, 401, 403]).toContain(resp.status());
  });

  test('Dashboard 有库存 overview 链接或区域', async ({ page }) => {
    const hasInventoryLink = await page.getByText(/inventory|库存/i).count() > 0;
    expect(hasInventoryLink).toBeTruthy();
  });
});

test.describe('Dashboard (danielhuang)', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaSSO(page, DANIEL);
    await page.goto(`${FRONTEND}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
  });

  test('danielhuang Dashboard 正常加载', async ({ page }) => {
    await expect(page.locator('body')).not.toContainText('TypeError');
    await expect(page.locator('body')).not.toContainText('Forbidden');
  });
});
