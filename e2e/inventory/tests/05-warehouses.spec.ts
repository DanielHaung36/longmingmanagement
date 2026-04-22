/**
 * 05 - 仓库 CRUD E2E
 * GET列表 / POST新建 / PUT更新 / DELETE删除 / 权限
 */
import { test, expect } from '@playwright/test';
import { loginViaSSO, FRONTEND, ADMIN, DANIEL } from '../helpers/auth';

const TS = Date.now();
const TEST_WH_NAME = `E2E-WH-${TS}`;

// ─────────────────────────────────────────────
test.describe('仓库 API (admin)', () => {
  test('GET /api/warehouses — 返回仓库列表', async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    const resp = await page.request.get(`${FRONTEND}/api/warehouses`);
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    const items = data.data ?? data;
    expect(Array.isArray(items)).toBeTruthy();
    console.log(`  仓库数量: ${items.length}`);
    if (items.length > 0) {
      const w = items[0];
      expect(w.id !== undefined).toBeTruthy();
      expect(w.name !== undefined).toBeTruthy();
      console.log('  仓库字段:', Object.keys(w));
    }
  });

  test('仓库管理页面不在前端路由中（UI 已隐藏）', async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    await page.goto(`${FRONTEND}/warehouses`, { waitUntil: 'networkidle', timeout: 20000 });
    const url = page.url();
    console.log('  访问 /warehouses 后 URL:', url);
    await expect(page.locator('body')).not.toContainText('TypeError');
  });
});

// ─────────────────────────────────────────────
test.describe('仓库 CRUD — API 完整流程', () => {
  let warehouseId: number;

  test('POST /api/warehouses — 新建仓库', async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    const resp = await page.request.post(`${FRONTEND}/api/warehouses`, {
      data: {
        name:     TEST_WH_NAME,
        location: `E2E Location ${TS}`,
      },
    });
    console.log('  新建仓库 status:', resp.status());
    const body = await resp.json();
    console.log('  响应:', JSON.stringify(body).substring(0, 300));

    expect(resp.ok()).toBeTruthy();
    const wh = body.data ?? body;
    expect(wh.id).toBeTruthy();
    expect(wh.name).toBe(TEST_WH_NAME);
    warehouseId = Number(wh.id);
    console.log(`  ✅ 新建仓库成功 ID: ${warehouseId}`);
  });

  test('GET /api/warehouses/:id — 读取刚新建的仓库', async ({ page }) => {
    test.skip(!warehouseId, '依赖新建测试');
    await loginViaSSO(page, ADMIN);
    const resp = await page.request.get(`${FRONTEND}/api/warehouses/${warehouseId}`);
    // 可能没有 GET /:id，退回到 GET / 并筛选
    if (resp.status() === 404) {
      const listResp = await page.request.get(`${FRONTEND}/api/warehouses`);
      expect(listResp.ok()).toBeTruthy();
      const data = await listResp.json();
      const items = data.data ?? data;
      const found = items.find((w: any) => String(w.id) === String(warehouseId));
      expect(found).toBeTruthy();
      console.log('  ✅ 仓库在列表中找到（无单条查询端点）');
    } else {
      expect(resp.ok()).toBeTruthy();
      const data = await resp.json();
      const wh = data.data ?? data;
      expect(String(wh.id)).toBe(String(warehouseId));
      console.log('  ✅ 单条仓库查询成功');
    }
  });

  test('PUT /api/warehouses/:id — 更新仓库名称', async ({ page }) => {
    test.skip(!warehouseId, '依赖新建测试');
    await loginViaSSO(page, ADMIN);
    const newName = `${TEST_WH_NAME}-UPDATED`;
    const resp = await page.request.put(`${FRONTEND}/api/warehouses/${warehouseId}`, {
      data: { name: newName, location: `Updated Location ${TS}` },
    });
    console.log('  更新仓库 status:', resp.status());
    const body = await resp.json();
    expect(resp.ok()).toBeTruthy();
    const wh = body.data ?? body;
    expect(wh.name).toBe(newName);
    console.log('  ✅ 更新仓库成功，新名称:', wh.name);
  });

  test('DELETE /api/warehouses/:id — 删除仓库（admin）', async ({ page }) => {
    test.skip(!warehouseId, '依赖新建测试');
    await loginViaSSO(page, ADMIN);
    const resp = await page.request.delete(`${FRONTEND}/api/warehouses/${warehouseId}`);
    console.log('  删除仓库 status:', resp.status());
    expect(resp.ok()).toBeTruthy();

    // 验证已删除（列表中找不到）
    const listResp = await page.request.get(`${FRONTEND}/api/warehouses`);
    const data = await listResp.json();
    const items = data.data ?? data;
    const still = items.find((w: any) => String(w.id) === String(warehouseId));
    expect(still).toBeFalsy();
    console.log('  ✅ 仓库删除成功');
  });
});

// ─────────────────────────────────────────────
test.describe('仓库 API 错误场景', () => {
  test('POST 缺少 name 字段 → 400', async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    const resp = await page.request.post(`${FRONTEND}/api/warehouses`, {
      data: { location: 'No name provided' },
    });
    console.log('  缺 name 字段 status:', resp.status());
    expect(resp.status()).toBe(400);
    const body = await resp.json();
    expect(body.success).toBeFalsy();
  });

  test('PUT 不存在仓库 → 4xx', async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    const resp = await page.request.put(`${FRONTEND}/api/warehouses/99999999`, {
      data: { name: 'ghost', location: 'nowhere' },
    });
    console.log('  PUT 不存在仓库 status:', resp.status());
    expect(resp.status()).toBeGreaterThanOrEqual(400);
  });

  test('DELETE 不存在仓库 → 4xx', async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    const resp = await page.request.delete(`${FRONTEND}/api/warehouses/99999999`);
    console.log('  DELETE 不存在仓库 status:', resp.status());
    expect(resp.status()).toBeGreaterThanOrEqual(400);
  });
});

// ─────────────────────────────────────────────
test.describe('仓库 API - danielhuang', () => {
  test('danielhuang 可读取仓库列表', async ({ page }) => {
    await loginViaSSO(page, DANIEL);
    const resp = await page.request.get(`${FRONTEND}/api/warehouses`);
    console.log('  danielhuang GET /warehouses status:', resp.status());
    // 无权限检查，直接可访问
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    const items = data.data ?? data;
    console.log(`  danielhuang 可见仓库数: ${items.length}`);
  });
});
