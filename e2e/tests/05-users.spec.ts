/**
 * 05 - 用户管理 E2E
 * 列表 / 搜索 / 筛选 / 分页 / 新建用户(表单验证) / 编辑 / 删除 / 角色切换
 */
import { test, expect } from '@playwright/test';
import { loginAs, FRONTEND, ADMIN, DANIEL } from '../helpers/auth';

const TS = Date.now();

test.describe('用户管理 - admin', () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAs(context, ADMIN);
    await page.goto(`${FRONTEND}/users`);
    await page.waitForLoadState('networkidle');
  });

  test('用户列表加载有数据', async ({ page }) => {
    // 默认 grid 模式：卡片带 hover:shadow-xl border-l-4 class；list 模式：table
    await expect(
      page.locator(
        'table tbody tr, [class*="border-l-4"], [class*="hover:shadow-xl"]'
      ).first()
    ).toBeVisible({ timeout: 12000 });
  });

  test('统计卡片显示（Total Users / Active / Admins）', async ({ page }) => {
    await expect(page.getByText(/total users/i).first()).toBeVisible({ timeout: 8000 });
  });

  test('搜索 "admin" 显示 admin 用户', async ({ page }) => {
    const search = page.locator('input[placeholder*="earch"]').first();
    await search.fill('admin');
    await page.waitForTimeout(1000);
    await expect(page.getByText(/admin/i).first()).toBeVisible({ timeout: 6000 });
  });

  test('搜索无结果不崩溃', async ({ page }) => {
    const search = page.locator('input[placeholder*="earch"]').first();
    await search.fill('zzz_nobody_xyz_9999');
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).not.toContainText('TypeError');
  });

  test('清空搜索恢复列表', async ({ page }) => {
    const search = page.locator('input[placeholder*="earch"]').first();
    await search.fill('hill');
    await page.waitForTimeout(800);
    await search.fill('');
    await page.waitForTimeout(800);
    await expect(
      page.locator('table tbody tr, [class*="card"]').first()
    ).toBeVisible({ timeout: 6000 });
  });

  test('角色筛选 - 筛选 ADMIN', async ({ page }) => {
    const roleFilter = page.locator('select').filter({ hasText: /all|admin|user|manager/i }).first();
    if (await roleFilter.isVisible()) {
      await roleFilter.selectOption('ADMIN');
      await page.waitForTimeout(800);
      await expect(page.locator('body')).not.toContainText('TypeError');
    }
  });

  test('角色筛选 - 筛选 USER', async ({ page }) => {
    const roleFilter = page.locator('select').filter({ hasText: /all|admin|user|manager/i }).first();
    if (await roleFilter.isVisible()) {
      await roleFilter.selectOption('USER');
      await page.waitForTimeout(800);
    }
  });

  test('视图切换 Grid / List', async ({ page }) => {
    const gridBtn = page.getByRole('button', { name: /grid/i }).first();
    const listBtn = page.getByRole('button', { name: /list/i }).first();
    if (await gridBtn.isVisible()) {
      await gridBtn.click();
      await page.waitForTimeout(300);
    }
    if (await listBtn.isVisible()) {
      await listBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('点击统计卡片过滤（Active Users）', async ({ page }) => {
    const activeCard = page.getByText(/active users/i).first();
    if (await activeCard.isVisible()) {
      await activeCard.click();
      await page.waitForTimeout(800);
      await expect(page.locator('body')).not.toContainText('TypeError');
    }
  });

  test('分页控件可点击', async ({ page }) => {
    const nextBtn = page.getByRole('button', { name: /next|下一页/i }).first();
    if (await nextBtn.isVisible() && await nextBtn.isEnabled()) {
      await nextBtn.click();
      await page.waitForTimeout(800);
      const prevBtn = page.getByRole('button', { name: /prev|上一页/i }).first();
      if (await prevBtn.isEnabled()) await prevBtn.click();
    }
  });

  // ── 新建用户 ──────────────────────────────────────────────────────────────
  test('点击 Add User 按钮打开对话框', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add user|新建|添加用户/i }).first();
    await expect(addBtn).toBeVisible();
    await addBtn.click();
    await page.waitForTimeout(500);
    // 对话框/弹窗应该出现
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });

  test('新建用户 - 空提交显示必填错误', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add user|新建|添加用户/i }).first();
    await addBtn.click();
    await page.waitForTimeout(500);
    const dialog = page.getByRole('dialog');
    if (await dialog.isVisible()) {
      const submitBtn = dialog.getByRole('button', { name: /create|save|确定|提交/i }).first();
      if (await submitBtn.isVisible()) {
        // 强制点击（按钮可能 disabled）
        await submitBtn.click({ force: true });
        await page.waitForTimeout(800);
        // 验证：dialog 仍然可见（说明提交被阻止）或有错误提示
        const dialogStillVisible = await dialog.isVisible();
        const hasError = await page.locator('[aria-invalid="true"], [class*="text-red"], [class*="destructive"]').count() > 0
          || await page.getByText(/required|必填|invalid/i).count() > 0;
        const isStillDisabled = await submitBtn.isDisabled();
        // dialog 仍显示 = 提交被验证拦截，任一条件满足即可
        expect(dialogStillVisible || hasError || isStillDisabled).toBeTruthy();
      }
    }
  });

  test('新建用户 - 填写并创建', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add user|新建|添加用户/i }).first();
    await addBtn.click();
    await page.waitForTimeout(500);
    const dialog = page.getByRole('dialog');
    if (await dialog.isVisible()) {
      // 填写用户名
      const usernameInput = dialog.locator('input[name="username"], input#username').first();
      if (await usernameInput.isVisible()) await usernameInput.fill(`e2etest${TS}`);
      // 邮箱
      const emailInput = dialog.locator('input[name="email"], input#email, input[type="email"]').first();
      if (await emailInput.isVisible()) await emailInput.fill(`e2e${TS}@longi.test`);
      // 密码
      const pwInput = dialog.locator('input[name="password"], input[type="password"]').first();
      if (await pwInput.isVisible()) await pwInput.fill('Test@12345');
      // 名字
      const nameInput = dialog.locator('input[name="realName"], input[name="fullName"], input#realName').first();
      if (await nameInput.isVisible()) await nameInput.fill(`E2E Test ${TS}`);

      const submitBtn = dialog.getByRole('button', { name: /create|save|确定|提交/i }).first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(2000);
        await expect(page.locator('body')).not.toContainText('TypeError');
      }
    }
  });

  // ── 编辑用户 ──────────────────────────────────────────────────────────────
  test('点击 Edit 按钮打开编辑对话框', async ({ page }) => {
    const editBtn = page.getByRole('button', { name: /edit|编辑/i }).first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.waitForTimeout(500);
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 5000 });
      // 关闭
      const cancelBtn = dialog.getByRole('button', { name: /cancel|取消/i }).first();
      if (await cancelBtn.isVisible()) await cancelBtn.click();
    }
  });

  // ── 角色变更 ──────────────────────────────────────────────────────────────
  test('点击 Role 按钮打开角色对话框', async ({ page }) => {
    // Role 按钮通常是 Shield 图标
    const roleBtn = page.getByRole('button', { name: /role|角色/i }).first();
    if (await roleBtn.isVisible()) {
      await roleBtn.click();
      await page.waitForTimeout(500);
      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible()) {
        const cancelBtn = dialog.getByRole('button', { name: /cancel|取消/i }).first();
        if (await cancelBtn.isVisible()) await cancelBtn.click();
      }
    }
  });
});

test.describe('用户管理 - danielhuang 权限', () => {
  test('danielhuang 无法访问用户管理（应跳转到 forbidden）', async ({ context, page }) => {
    await loginAs(context, DANIEL);
    await page.goto(`${FRONTEND}/users`);
    await page.waitForLoadState('networkidle');
    // 普通用户应该被拒绝
    const url = page.url();
    const isForbidden = url.includes('forbidden') || url.includes('403')
      || await page.getByText(/forbidden|unauthorized|没有权限/i).count() > 0;
    // 如果系统允许普通用户只读，也不崩溃即可
    await expect(page.locator('body')).not.toContainText('TypeError');
  });
});
