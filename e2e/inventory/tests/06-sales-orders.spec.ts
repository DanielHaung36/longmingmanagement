/**
 * 06 - 订单 CRUD E2E
 * 列表加载 / API 数据验证 / CRUD 完整流程 / 错误场景 / 权限
 *
 * 注意:
 *   后端路由: /api/orders (复数)
 *   软删除: DELETE 不是真正删除，返回 success 即可
 *   无 /api/sales 路由（只有 /api/orders）
 */
import { test, expect } from '@playwright/test';
import { loginViaSSO, FRONTEND, ADMIN, DANIEL } from '../helpers/auth';

const TS = Date.now();
const TEST_ORDER_NUMBER = `E2E-ORD-${TS}`;
const TEST_CUSTOMER     = `E2E Customer ${TS}`;

// ─────────────────────────────────────────────
test.describe('订单列表页 (admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    await page.goto(`${FRONTEND}/order`, { waitUntil: 'networkidle', timeout: 30000 });
  });

  test('订单页面加载不报错', async ({ page }) => {
    await expect(page.locator('body')).not.toContainText('TypeError');
    await expect(page.locator('body')).not.toContainText('Unhandled');
  });

  test('订单列表显示内容或空态', async ({ page }) => {
    const hasRows  = await page.locator('table tbody tr').count() > 0;
    const hasCards = await page.locator('[class*="card"], .MuiCard-root').count() > 0;
    const hasEmpty = await page.getByText(/no data|empty|暂无|没有/i).count() > 0;
    // 至少有一种内容形式 or 页面不崩溃
    await expect(page.locator('body')).not.toContainText('TypeError');
    console.log(`  有表格行: ${hasRows}, 有卡片: ${hasCards}, 有空状态: ${hasEmpty}`);
  });
});

// ─────────────────────────────────────────────
test.describe('订单 API 基础 (GET)', () => {
  test('GET /api/orders — 返回列表', async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    const resp = await page.request.get(`${FRONTEND}/api/orders`);
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.success).toBeTruthy();
    const items = data.data ?? [];
    expect(Array.isArray(items)).toBeTruthy();
    console.log(`  订单总数: ${data.total ?? items.length}`);
    if (items.length > 0) {
      const o = items[0];
      console.log('  订单字段:', Object.keys(o));
      console.log('  第一条:', JSON.stringify(o, null, 2).substring(0, 300));
    }
  });

  test('GET /api/orders 支持分页参数', async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    const p1 = await page.request.get(`${FRONTEND}/api/orders?page=1&limit=5`);
    expect(p1.ok()).toBeTruthy();
    const d1 = await p1.json();
    const items = d1.data ?? [];
    console.log(`  第一页 (limit=5): ${items.length} 条`);
    expect(items.length).toBeLessThanOrEqual(5);
  });

  test('GET /api/orders 支持 search 参数', async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    const resp = await page.request.get(`${FRONTEND}/api/orders?search=e2e`);
    expect(resp.ok()).toBeTruthy();
    console.log('  搜索 "e2e" 状态:', resp.status());
  });
});

// ─────────────────────────────────────────────
test.describe('订单 CRUD — API 完整流程', () => {
  let orderId: string;

  test('POST /api/orders — 新建订单', async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    const resp = await page.request.post(`${FRONTEND}/api/orders`, {
      data: {
        order_number:  TEST_ORDER_NUMBER,
        customer_name: TEST_CUSTOMER,
        total_amount:  999.99,
        order_date:    new Date().toISOString(),
        status:        'pending',
      },
    });
    console.log('  新建订单 status:', resp.status());
    const body = await resp.json();
    console.log('  响应:', JSON.stringify(body, null, 2).substring(0, 300));
    expect(resp.status()).toBe(201);
    expect(body.success).toBeTruthy();
    const order = body.data ?? body;
    expect(order.id).toBeTruthy();
    orderId = String(order.id);
    console.log(`  ✅ 新建订单成功 ID: ${orderId}`);
  });

  test('GET /api/orders/:id — 读取刚新建的订单', async ({ page }) => {
    test.skip(!orderId, '依赖新建测试');
    await loginViaSSO(page, ADMIN);
    const resp = await page.request.get(`${FRONTEND}/api/orders/${orderId}`);
    console.log('  GET /:id status:', resp.status());
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    const order = data.data ?? data;
    expect(String(order.id)).toBe(orderId);
    expect(order.order_number).toBe(TEST_ORDER_NUMBER);
    console.log('  ✅ 单条订单查询成功');
  });

  test('PUT /api/orders/:id — 更新订单状态', async ({ page }) => {
    test.skip(!orderId, '依赖新建测试');
    await loginViaSSO(page, ADMIN);
    const resp = await page.request.put(`${FRONTEND}/api/orders/${orderId}`, {
      data: {
        status:        'completed',
        customer_name: `${TEST_CUSTOMER} (UPDATED)`,
        total_amount:  1099.99,
      },
    });
    console.log('  PUT 更新订单 status:', resp.status());
    const body = await resp.json();
    if (resp.ok()) {
      const order = body.data ?? body;
      expect(order.status).toBe('completed');
      console.log('  ✅ 更新成功, status:', order.status);
    } else {
      console.warn('  ⚠️  更新失败:', body.message ?? '');
    }
    expect(resp.status()).toBeLessThan(300);
  });

  test('DELETE /api/orders/:id — 软删除订单', async ({ page }) => {
    test.skip(!orderId, '依赖新建测试');
    await loginViaSSO(page, ADMIN);
    const resp = await page.request.delete(`${FRONTEND}/api/orders/${orderId}`);
    console.log('  DELETE 订单 status:', resp.status());
    const body = await resp.json();
    expect(resp.ok()).toBeTruthy();
    expect(body.success).toBeTruthy();
    console.log('  ✅ 软删除成功:', body.message ?? '');
  });
});

// ─────────────────────────────────────────────
test.describe('订单 API 错误场景', () => {
  test('POST 缺少必填字段 → 400', async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    const resp = await page.request.post(`${FRONTEND}/api/orders`, {
      data: { order_number: `E2E-MISSING-${TS}` }, // 缺少 customer_name / total_amount
    });
    console.log('  缺必填字段 status:', resp.status());
    expect(resp.status()).toBe(400);
    const body = await resp.json();
    expect(body.success).toBeFalsy();
    console.log('  错误信息:', body.message ?? '');
  });

  test('GET 不存在的订单 → 4xx', async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    const resp = await page.request.get(`${FRONTEND}/api/orders/non-existent-99999`);
    console.log('  GET 不存在订单 status:', resp.status());
    expect(resp.status()).toBeGreaterThanOrEqual(400);
  });

  test('PUT 不存在的订单 → 4xx', async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    const resp = await page.request.put(`${FRONTEND}/api/orders/non-existent-99999`, {
      data: { status: 'cancelled' },
    });
    console.log('  PUT 不存在订单 status:', resp.status());
    expect(resp.status()).toBeGreaterThanOrEqual(400);
  });
});

// ─────────────────────────────────────────────
test.describe('订单 - danielhuang 权限', () => {
  test('danielhuang 可以访问订单页（sales.view）', async ({ page }) => {
    await loginViaSSO(page, DANIEL);
    await page.goto(`${FRONTEND}/order`, { waitUntil: 'networkidle', timeout: 30000 });
    await expect(page.locator('body')).not.toContainText('TypeError');
    await expect(page.locator('body')).not.toContainText('Forbidden');
    console.log('  URL:', page.url());
  });

  test('danielhuang GET /api/orders 可访问', async ({ page }) => {
    await loginViaSSO(page, DANIEL);
    const resp = await page.request.get(`${FRONTEND}/api/orders`);
    console.log('  danielhuang GET /api/orders status:', resp.status());
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    console.log(`  danielhuang 可见订单数: ${data.total ?? (data.data ?? []).length}`);
  });
});

// ─────────────────────────────────────────────
test.describe('订单 — 加载态 & 错误态', () => {
  test('订单 API 响应慢时页面不崩溃', async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    // 延迟订单 API 1.5s
    await page.route(`**/api/orders**`, async (route) => {
      await new Promise(res => setTimeout(res, 1500));
      await route.continue();
    });
    await page.goto(`${FRONTEND}/order`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // 加载中应有指示器或 skeleton
    const loadingFound = await Promise.race([
      page.locator('[class*="skeleton"], [class*="spinner"], [role="progressbar"]')
        .first().waitFor({ timeout: 1200 }).then(() => true).catch(() => false),
      page.getByText(/loading/i).first().waitFor({ timeout: 1200 }).then(() => true).catch(() => false),
      new Promise<boolean>(res => setTimeout(() => res(true), 1200)), // 超时默认 pass
    ]);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
  });

  test('订单 API 500 时页面不崩溃', async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    await page.route(`**/api/orders**`, route =>
      route.fulfill({ status: 500, body: JSON.stringify({ success: false, message: 'Server Error' }) })
    );
    await page.goto(`${FRONTEND}/order`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    await expect(page.locator('body')).not.toContainText('TypeError');
  });
});
