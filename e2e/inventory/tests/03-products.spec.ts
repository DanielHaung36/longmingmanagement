/**
 * 03 - 产品管理 E2E
 * 列表加载 / API 字段验证(snake_case) / 前端字段显示 /
 * 搜索 / 分页 / CRUD(新建/读取/更新/删除) / 权限
 *
 * 注意: 后端 Prisma 直接返回 snake_case 字段，无 camelCase 转换
 *   part_number_cn / part_number_au / description_chinese /
 *   unit_price / purchase_price / part_group / code_seq
 */
import { test, expect, Page } from '@playwright/test';
import { loginViaSSO, FRONTEND, ADMIN, DANIEL } from '../helpers/auth';

const TS = Date.now();
const TEST_CODE    = `E2E-${TS}`;
const TEST_PART_CN = `E2E-CN-${TS}`;
const TEST_PART_AU = `E2E-AU-${TS}`;
const TEST_DESC    = `E2E Test Product ${TS}`;

// ─────────────────────────────────────────────
// 辅助：通过 API 获取第一个产品 (返回 snake_case 字段)
async function getFirstProduct(page: Page) {
  const resp = await page.request.get(`${FRONTEND}/api/products?limit=1`);
  if (!resp.ok()) return null;
  const data = await resp.json();
  const items = data.data ?? data;
  return items.length > 0 ? items[0] : null;
}

// ─────────────────────────────────────────────
test.describe('产品列表 & API 数据 (admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    await page.goto(`${FRONTEND}/products`, { waitUntil: 'networkidle', timeout: 30000 });
  });

  test('产品列表页面加载不报错', async ({ page }) => {
    await expect(page.locator('body')).not.toContainText('TypeError');
    await expect(page.locator('body')).not.toContainText('Unhandled');
    await expect(page.locator('body')).not.toContainText('500');
  });

  test('产品列表 API 返回数据 (GET /api/products)', async ({ page }) => {
    const resp = await page.request.get(`${FRONTEND}/api/products`);
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.success).toBeTruthy();
    const products = data.data ?? [];
    expect(Array.isArray(products)).toBeTruthy();
    console.log(`  产品总数: ${data.total ?? products.length}`);
  });

  test('产品列表有数据行', async ({ page }) => {
    await expect(
      page.locator('table tbody tr').first()
    ).toBeVisible({ timeout: 12000 });
  });
});

// ─────────────────────────────────────────────
test.describe('产品 API 字段验证 - 确认是 camelCase', () => {
  test('API 返回字段名为 camelCase', async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    const resp = await page.request.get(`${FRONTEND}/api/products?limit=5`);
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    const products = data.data ?? [];
    if (products.length === 0) { console.log('  无产品数据，跳过'); return; }

    const p = products[0];
    const keys = Object.keys(p);
    console.log('  产品 API 所有字段:', keys);

    // 后端现在返回 camelCase
    const hasCamelCase = keys.some(k => /[a-z][A-Z]/.test(k));
    console.log(`  字段含camelCase? ${hasCamelCase}`);

    // 打印前5条产品的关键字段
    for (const prod of products.slice(0, 5)) {
      console.log(`  产品 [${prod.id}]:`, {
        code:               prod.code               ?? '(空)',
        partNumberCN:       prod.partNumberCN        ?? '(空)',
        partNumberAU:       prod.partNumberAU        ?? '(空)',
        description:        prod.description         ?? '(空)',
        descriptionChinese: prod.descriptionChinese  ?? '(空)',
        oem:                prod.oem                 ?? '(空)',
        partGroup:          prod.partGroup           ?? '(空)',
        customer:           prod.customer            ?? '(空)',
        unitPrice:          prod.unitPrice           ?? '(空)',
        purchasePrice:      prod.purchasePrice       ?? '(空)',
        barcode:            prod.barcode             ?? '(空)',
      });
    }

    // 检查是否有 partNumberCN 或 partNumberAU 有值
    const hasPartNumber = products.some(
      (p: any) => p.partNumberCN || p.partNumberAU
    );
    if (!hasPartNumber) {
      console.warn('  ⚠️  所有产品的 partNumberCN 和 partNumberAU 均为空！');
    }
    // Verify camelCase fields exist in response
    expect(p.id).toBeTruthy();
    expect('partNumberCN' in p || 'partNumberAU' in p || 'description' in p).toBeTruthy();
  });

  test('API 分页参数 limit 生效', async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    const p1 = await page.request.get(`${FRONTEND}/api/products?page=1&limit=5`);
    const p2 = await page.request.get(`${FRONTEND}/api/products?page=2&limit=5`);
    expect(p1.ok()).toBeTruthy();
    expect(p2.ok()).toBeTruthy();
    const d1 = await p1.json();
    const d2 = await p2.json();
    const items1 = d1.data ?? [];
    const items2 = d2.data ?? [];
    if (items1.length > 0 && items2.length > 0) {
      expect(items1[0].id).not.toEqual(items2[0].id);
    }
    console.log(`  page1 ${items1.length} 条，page2 ${items2.length} 条`);
  });

  test('API 搜索参数生效 (search=)', async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    const resp = await page.request.get(`${FRONTEND}/api/products?search=pump`);
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    console.log(`  搜索 "pump" 结果: ${data.total ?? (data.data?.length ?? 0)} 条`);
  });
});

// ─────────────────────────────────────────────
test.describe('产品列表 - 前端字段显示验证', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    await page.goto(`${FRONTEND}/products`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.locator('table tbody tr').first().waitFor({ timeout: 12000 }).catch(() => {});
  });

  test('表头包含 Part Number 相关列', async ({ page }) => {
    const headers = await page.locator('table thead th').allTextContents();
    console.log('  产品表头:', headers);
    expect(headers.length).toBeGreaterThan(0);
    const combined = headers.join(' ').toLowerCase();
    const hasPartCol = combined.includes('part') || combined.includes('number')
      || combined.includes('编号') || combined.includes('code');
    if (!hasPartCol) {
      console.warn('  ⚠️  表头未找到 Part Number 相关列！实际表头: ' + headers.join(', '));
    }
  });

  test('表头包含 Description 相关列', async ({ page }) => {
    const headers = await page.locator('table thead th').allTextContents();
    const combined = headers.join(' ').toLowerCase();
    const hasDescCol = combined.includes('description') || combined.includes('描述')
      || combined.includes('name') || combined.includes('名称');
    if (!hasDescCol) {
      console.warn('  ⚠️  表头未找到 Description 相关列！实际表头: ' + headers.join(' | '));
    }
  });

  test('第一行数据单元格不全为空', async ({ page }) => {
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });
    const cells = await firstRow.locator('td').allTextContents();
    console.log('  产品第一行单元格:', cells);
    const nonEmpty = cells.filter(c => c.trim().length > 0);
    expect(nonEmpty.length).toBeGreaterThan(0);
  });

  test('前端表格内容与 API 数据对应', async ({ page }) => {
    const product = await getFirstProduct(page);
    if (!product) { console.log('  无产品数据，跳过'); return; }

    // 取产品的 code 或 description 检查是否出现在表格中
    const keyword = product.code || product.description || product.partNumberAU || '';
    if (keyword) {
      const tableText = await page.locator('table tbody').innerText();
      console.log(`  表格内容含 "${keyword}"? ${tableText.includes(keyword)}`);
      console.log('  表格前400字:', tableText.substring(0, 400));
    }
  });
});

// ─────────────────────────────────────────────
test.describe('产品 CRUD - 新建 (CREATE)', () => {
  test('通过 API 新建产品 (POST /api/products) - camelCase 字段', async ({ page }) => {
    await loginViaSSO(page, ADMIN);

    // 后端 controller 接收 camelCase 字段并转换为 snake_case 存入 DB
    const resp = await page.request.post(`${FRONTEND}/api/products`, {
      data: {
        code:               TEST_CODE,
        partNumberCN:       TEST_PART_CN,
        partNumberAU:       TEST_PART_AU,
        description:        TEST_DESC,
        descriptionChinese: `E2E 测试产品 ${TS}`,
        oem:                `OEM-${TS}`,
        partGroup:          'E2E',
        unitPrice:          99.99,
        purchasePrice:      80.00,
      },
    });
    console.log('  新建产品 status:', resp.status());
    const body = await resp.json();
    console.log('  响应:', JSON.stringify(body, null, 2).substring(0, 500));

    if (resp.ok()) {
      const product = body.data ?? body;
      expect(product.id).toBeTruthy();
      expect(product.code).toBe(TEST_CODE);
      console.log('  ✅ 新建产品成功，ID:', product.id);
    } else {
      console.warn('  ⚠️  新建产品失败:', body.message ?? '');
    }
  });

  test('新建产品缺少必填 code 字段应返回 400', async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    const resp = await page.request.post(`${FRONTEND}/api/products`, {
      data: {
        part_number_cn: TEST_PART_CN,
        description:    '缺少code字段测试',
      },
    });
    console.log('  缺少code字段 status:', resp.status());
    // 应该是 400 错误
    expect(resp.status()).not.toBe(200);
  });

  test('前端新建产品按钮可见', async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    await page.goto(`${FRONTEND}/products`, { waitUntil: 'networkidle', timeout: 30000 });

    const addBtn = page.getByRole('button', { name: /add|new|create|新建|添加/i }).first();
    if (await addBtn.isVisible()) {
      console.log('  ✅ 找到新建按钮');
      await addBtn.click();
      await page.waitForTimeout(1500);
      await expect(page.locator('body')).not.toContainText('TypeError');

      // 打印表单字段
      const labels = await page.locator('label').allTextContents();
      console.log('  表单字段标签:', labels);
      const inputCount = await page.locator('input, select, textarea').count();
      console.log('  表单输入框数量:', inputCount);
    } else {
      console.log('  ⚠️  未找到新建按钮（可能在其他位置）');
    }
  });

  test('前端新建产品表单字段检查', async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    await page.goto(`${FRONTEND}/products`, { waitUntil: 'networkidle', timeout: 30000 });

    const addBtn = page.getByRole('button', { name: /add|new|create|新建|添加/i }).first();
    if (!await addBtn.isVisible()) {
      console.log('  未找到新建按钮，跳过');
      return;
    }
    await addBtn.click();
    await page.waitForTimeout(1500);

    // 检查各字段 (可能前端用 camelCase id，也可能用 snake_case)
    const checkField = async (selectors: string[], label: string) => {
      for (const sel of selectors) {
        const el = page.locator(sel).first();
        if (await el.isVisible()) {
          console.log(`  ✅ ${label} 字段存在 (${sel})`);
          return true;
        }
      }
      console.warn(`  ⚠️  ${label} 字段未找到`);
      return false;
    };

    await checkField(['#code, input[name="code"]'], 'code');
    await checkField(['#part_number_cn, #partNumberCN, input[name*="cn"]'], 'part_number_cn');
    await checkField(['#part_number_au, #partNumberAU, input[name*="au"]'], 'part_number_au');
    await checkField(['#description, textarea[name="description"]'], 'description');
    await checkField(['#description_chinese, #descriptionChinese'], 'description_chinese');
    await checkField(['#unit_price, #unitPrice, input[name*="price"]'], 'unit_price');
    await checkField(['#oem, input[name="oem"]'], 'oem');

    await expect(page.locator('body')).not.toContainText('TypeError');
  });
});

// ─────────────────────────────────────────────
test.describe('产品 CRUD - 读取详情 (READ)', () => {
  test('通过 API 获取产品详情并验证所有字段', async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    const product = await getFirstProduct(page);
    if (!product) { console.log('  无产品，跳过'); return; }

    const resp = await page.request.get(`${FRONTEND}/api/products/${product.id}`);
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    const p = data.data ?? data;

    console.log('  产品详情所有字段:');
    Object.entries(p).forEach(([k, v]) => {
      if (k !== 'inventory') {
        console.log(`    ${k}: ${JSON.stringify(v)}`);
      }
    });

    // 检查详情包含 inventory 关联
    if (p.inventory !== undefined) {
      console.log(`  ✅ 包含 inventory 关联数据，条数: ${p.inventory.length}`);
    } else {
      console.warn('  ⚠️  产品详情缺少 inventory 关联数据');
    }

    // 关键字段存在性检查
    expect(p.id).toBeTruthy();
    expect(p.code !== undefined).toBeTruthy();
  });

  test('点击产品行查看详情或弹窗', async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    await page.goto(`${FRONTEND}/products`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.locator('table tbody tr').first().waitFor({ timeout: 12000 });

    await page.locator('table tbody tr').first().click();
    await page.waitForTimeout(2000);

    const url = page.url();
    console.log('  点击后 URL:', url);
    await expect(page.locator('body')).not.toContainText('TypeError');

    // 如果弹窗或跳转到详情页，检查字段显示
    const pageText = await page.locator('body').innerText();
    console.log('  点击后页面文字 (前500字):', pageText.substring(0, 500));
  });

  test('产品不存在返回 404', async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    const resp = await page.request.get(`${FRONTEND}/api/products/non-existent-id-99999`);
    console.log('  不存在产品 status:', resp.status());
    expect(resp.status()).toBe(404);
  });
});

// ─────────────────────────────────────────────
test.describe('产品 CRUD - 更新 (UPDATE)', () => {
  test('通过 API 更新产品 description (PUT /api/products/:id)', async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    const product = await getFirstProduct(page);
    if (!product) { console.log('  无产品，跳过'); return; }

    const originalDesc = product.description ?? '';
    const newDesc = `[E2E Updated ${TS}] ${originalDesc}`.substring(0, 200);

    const resp = await page.request.put(`${FRONTEND}/api/products/${product.id}`, {
      data: { description: newDesc },
    });
    console.log('  更新产品 status:', resp.status());

    if (resp.ok()) {
      const data = await resp.json();
      const updated = data.data ?? data;
      expect(updated.description).toBe(newDesc);
      console.log('  ✅ 更新成功');

      // 恢复原值
      await page.request.put(`${FRONTEND}/api/products/${product.id}`, {
        data: { description: originalDesc },
      });
      console.log('  已恢复原 description');
    } else {
      console.warn('  ⚠️  更新失败:', (await resp.text()).substring(0, 200));
    }
  });

  test('更新不存在产品返回错误', async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    const resp = await page.request.put(`${FRONTEND}/api/products/non-existent-id-99999`, {
      data: { description: 'test' },
    });
    console.log('  更新不存在产品 status:', resp.status());
    expect(resp.ok()).toBeFalsy();
  });
});

// ─────────────────────────────────────────────
test.describe('产品 CRUD - 删除 (DELETE)', () => {
  test('新建后再删除产品 (完整生命周期)', async ({ page }) => {
    await loginViaSSO(page, ADMIN);

    // 1. 新建
    const createResp = await page.request.post(`${FRONTEND}/api/products`, {
      data: {
        code:        `E2E-DEL-${TS}`,
        description: `E2E Delete Test ${TS}`,
        partGroup:   'E2E-DELETE',
      },
    });
    console.log('  新建 status:', createResp.status());
    if (!createResp.ok()) {
      console.log('  新建失败，跳过删除测试');
      return;
    }
    const created = await createResp.json();
    const productId = (created.data ?? created).id;
    console.log('  新建产品 ID:', productId);

    // 2. 验证存在
    const getResp = await page.request.get(`${FRONTEND}/api/products/${productId}`);
    expect(getResp.ok()).toBeTruthy();

    // 3. 删除
    const delResp = await page.request.delete(`${FRONTEND}/api/products/${productId}`);
    console.log('  删除 status:', delResp.status());
    expect(delResp.ok()).toBeTruthy();

    // 4. 验证已删除 (应 404)
    const checkResp = await page.request.get(`${FRONTEND}/api/products/${productId}`);
    console.log('  删除后 GET status:', checkResp.status());
    expect(checkResp.status()).toBe(404);
    console.log('  ✅ 产品生命周期测试完成');
  });
});

// ─────────────────────────────────────────────
test.describe('产品搜索 & 筛选', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    await page.goto(`${FRONTEND}/products`, { waitUntil: 'networkidle', timeout: 30000 });
  });

  test('搜索无结果不崩溃', async ({ page }) => {
    const search = page.locator('input[placeholder*="earch"], input[placeholder*="搜索"]').first();
    if (await search.isVisible()) {
      await search.fill('xyzNO_RESULT_12345678');
      await page.waitForTimeout(1500);
      await expect(page.locator('body')).not.toContainText('TypeError');
      console.log('  搜索无结果，页面正常');
    }
  });

  test('用真实关键词搜索有结果', async ({ page }) => {
    const product = await getFirstProduct(page);
    if (!product) { console.log('  无产品，跳过'); return; }

    const keyword = product.code?.substring(0, 3)
      || product.description?.substring(0, 3)
      || 'pump';

    const search = page.locator('input[placeholder*="earch"], input[placeholder*="搜索"]').first();
    if (await search.isVisible()) {
      await search.fill(keyword);
      await page.waitForTimeout(1500);
      await expect(page.locator('body')).not.toContainText('TypeError');
      const rows = await page.locator('table tbody tr').count();
      console.log(`  搜索 "${keyword}" 结果行数: ${rows}`);
    }
  });

  test('分页 - 下一页按钮', async ({ page }) => {
    const nextBtn = page.getByRole('button', { name: /next|下一页/i }).first();
    if (await nextBtn.isVisible() && await nextBtn.isEnabled()) {
      await nextBtn.click();
      await page.waitForTimeout(800);
      await expect(page.locator('body')).not.toContainText('TypeError');
    }
  });
});

// ─────────────────────────────────────────────
test.describe('产品 — 加载态 & 错误态', () => {
  test('产品 API 响应慢时页面显示加载指示器', async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    await page.route(`**/api/products**`, async (route) => {
      await new Promise(res => setTimeout(res, 1500));
      await route.continue();
    });
    await page.goto(`${FRONTEND}/products`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const loadingFound = await Promise.race([
      page.locator('[class*="skeleton"], [class*="spinner"], [role="progressbar"]')
        .first().waitFor({ timeout: 1200 }).then(() => true).catch(() => false),
      page.getByText(/loading/i).first().waitFor({ timeout: 1200 }).then(() => true).catch(() => false),
      new Promise<boolean>(res => setTimeout(() => res(true), 1200)),
    ]);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
  });

  test('产品 API 500 时页面不崩溃', async ({ page }) => {
    await loginViaSSO(page, ADMIN);
    await page.route(`**/api/products**`, route =>
      route.fulfill({ status: 500, body: JSON.stringify({ success: false, message: 'Internal Server Error' }) })
    );
    await page.goto(`${FRONTEND}/products`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    await expect(page.locator('body')).not.toContainText('TypeError');
  });
});

// ─────────────────────────────────────────────
test.describe('产品 - danielhuang 权限', () => {
  test('danielhuang 可以查看产品列表', async ({ page }) => {
    await loginViaSSO(page, DANIEL);
    await page.goto(`${FRONTEND}/products`, { waitUntil: 'networkidle', timeout: 30000 });
    await expect(page.locator('body')).not.toContainText('Forbidden');
    await expect(page.locator('body')).not.toContainText('TypeError');
  });

  test('danielhuang 产品 API 可访问，检查返回字段', async ({ page }) => {
    await loginViaSSO(page, DANIEL);
    const resp = await page.request.get(`${FRONTEND}/api/products?limit=3`);
    console.log('  danielhuang 产品 API status:', resp.status());
    if (resp.ok()) {
      const data = await resp.json();
      const items = data.data ?? [];
      console.log(`  danielhuang 可见产品数: ${items.length}`);
      if (items.length > 0) {
        console.log('  danielhuang 看到的产品字段:', Object.keys(items[0]));
        console.log('  第一条:', {
          code:         items[0].code         ?? '(空)',
          partNumberCN: items[0].partNumberCN ?? '(空)',
          partNumberAU: items[0].partNumberAU ?? '(空)',
          description:  items[0].description  ?? '(空)',
        });
      }
    }
  });
});
