/**
 * 08 - My Work / 通知 / 个人资料 E2E
 */
import { test, expect } from '@playwright/test';
import { loginAs, FRONTEND, ADMIN, DANIEL } from '../helpers/auth';

test.describe('My Work - admin', () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAs(context, ADMIN);
    await page.goto(`${FRONTEND}/my-work`);
    await page.waitForLoadState('networkidle');
  });

  test('My Work 页面加载正常', async ({ page }) => {
    await expect(page.locator('body')).not.toContainText('TypeError');
    await expect(page.locator('body')).not.toContainText('Forbidden');
  });

  test('My Work 页面有任务列表或空态', async ({ page }) => {
    const hasContent = await page.locator('table tbody tr, [class*="task"], [class*="card"]').count() > 0
      || await page.getByText(/no task|暂无任务|empty/i).count() > 0;
    expect(hasContent).toBeTruthy();
  });

  test('标签切换（In Progress / Pending / Done）', async ({ page }) => {
    const tabs = ['in.progress|进行中', 'pending|待处理', 'done|completed|完成'];
    for (const tab of tabs) {
      const t = page.getByRole('tab', { name: new RegExp(tab, 'i') });
      if (await t.isVisible()) {
        await t.click();
        await page.waitForTimeout(400);
        await expect(page.locator('body')).not.toContainText('TypeError');
      }
    }
  });

  test('点击任务跳转详情不崩溃', async ({ page }) => {
    const taskLink = page.locator('table tbody tr td a, [class*="task"] a').first();
    if (await taskLink.isVisible()) {
      await taskLink.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).not.toContainText('TypeError');
      await page.goBack();
    }
  });
});

test.describe('My Work - danielhuang', () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAs(context, DANIEL);
    await page.goto(`${FRONTEND}/my-work`);
    await page.waitForLoadState('networkidle');
  });

  test('danielhuang My Work 加载正常', async ({ page }) => {
    await expect(page.locator('body')).not.toContainText('Forbidden');
    await expect(page.locator('body')).not.toContainText('TypeError');
  });

  test('danielhuang 有任务数据', async ({ page }) => {
    const hasContent = await page.locator('table tbody tr, [class*="task"], [class*="card"]').count() > 0
      || await page.getByText(/no task|暂无|empty/i).count() > 0;
    expect(hasContent).toBeTruthy();
  });
});

test.describe('通知页面', () => {
  test('admin 通知页面加载', async ({ context, page }) => {
    await loginAs(context, ADMIN);
    await page.goto(`${FRONTEND}/notifications`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
  });

  test('通知铃铛图标可点击', async ({ context, page }) => {
    await loginAs(context, ADMIN);
    await page.goto(`${FRONTEND}/home`);
    await page.waitForLoadState('networkidle');
    // 顶部导航栏通知图标
    const bell = page.locator('[aria-label*="notification"], button svg[data-icon*="bell"]').first();
    if (await bell.isVisible()) {
      await bell.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toContainText('TypeError');
    }
  });

  test('danielhuang 通知页面加载', async ({ context, page }) => {
    await loginAs(context, DANIEL);
    await page.goto(`${FRONTEND}/notifications`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
  });
});

test.describe('个人资料 / Profile', () => {
  test('admin 个人资料页面加载', async ({ context, page }) => {
    await loginAs(context, ADMIN);
    await page.goto(`${FRONTEND}/profile`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
  });

  test('danielhuang 个人资料页面加载', async ({ context, page }) => {
    await loginAs(context, DANIEL);
    await page.goto(`${FRONTEND}/profile`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
  });
});
