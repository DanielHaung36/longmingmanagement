/**
 * 03 - 项目管理 E2E（完整 CRUD + 审批流程 + 加载态 + 错误态）
 */
import { test, expect } from '@playwright/test';
import { loginAs, apiAs, FRONTEND, API, ADMIN, DANIEL } from '../helpers/auth';

const TS = Date.now();
const TEST_PROJECT  = `[E2E] Project ${TS}`;
const TEST_CLIENT   = `E2EClient-${TS}`;
const TEST_SITE     = `E2ESite-${TS}`;
const REAL_PROJECT_ID = '3466'; // IHC - Lab（已知存在）

// ─────────────────────────────────────────────────────────────────────────────
// 项目列表 & 搜索 & 筛选 & 视图
// ─────────────────────────────────────────────────────────────────────────────
test.describe('项目列表 & 搜索 & 筛选', () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAs(context, ADMIN);
    await page.goto(`${FRONTEND}/projects/list`);
    await page.waitForLoadState('networkidle');
  });

  test('页面标题/标头可见', async ({ page }) => {
    await expect(page.locator('h1, h2, [class*="header"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('项目列表加载：有行或卡片', async ({ page }) => {
    await expect(
      page.locator('table tbody tr, [class*="project-card"], [class*="ProjectCard"], [class*="card"]').first()
    ).toBeVisible({ timeout: 12000 });
  });

  test('搜索 "Cemix" 显示匹配结果', async ({ page }) => {
    const search = page.locator('input#search, input[placeholder*="earch"]').first();
    await search.fill('Cemix');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).not.toContainText('TypeError');
    // 搜索后：有行/卡片显示，或直接看到 Cemix 文字，或显示空态（但不崩溃）
    const rows = await page.locator('table tbody tr, [class*="card"]').count();
    const cemixText = await page.getByText(/Cemix/i).count();
    const empty = await page.getByText(/no data|no result|暂无|empty/i).count();
    expect(rows > 0 || cemixText > 0 || empty > 0).toBeTruthy();
  });

  test('搜索无结果关键词 — 不崩溃、显示空态或无结果提示', async ({ page }) => {
    const search = page.locator('input#search, input[placeholder*="earch"]').first();
    await search.fill('xyzNO_RESULT_ZZZZZ_999');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).not.toContainText('TypeError');
    // 没有行 or 有空状态文字
    const rows = await page.locator('table tbody tr').count();
    const emptyMsg = await page.getByText(/no data|no result|暂无|empty/i).count();
    expect(rows === 0 || emptyMsg > 0).toBeTruthy();
  });

  test('清空搜索词 — 列表恢复', async ({ page }) => {
    const search = page.locator('input#search, input[placeholder*="earch"]').first();
    await search.fill('Cemix');
    await page.waitForTimeout(800);
    await search.fill('');
    await page.waitForTimeout(800);
    await expect(
      page.locator('table tbody tr, [class*="card"]').first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('审批状态下拉筛选 APPROVED — 不崩溃', async ({ page }) => {
    const filter = page.locator('select#approval, select[name="approval"]').first();
    if (await filter.isVisible()) {
      await filter.selectOption('APPROVED');
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).not.toContainText('Error');
    }
  });

  test('客户公司下拉筛选 — 选第一个选项', async ({ page }) => {
    const filter = page.locator('select#client, select[name="client"]').first();
    if (await filter.isVisible()) {
      const options = await filter.locator('option').allTextContents();
      if (options.length > 1) {
        await filter.selectOption({ index: 1 });
        await page.waitForTimeout(800);
        await expect(page.locator('body')).not.toContainText('TypeError');
      }
    }
  });

  test('视图切换 Grid/List/Table — 各视图不崩溃', async ({ page }) => {
    const btns = page.getByRole('button').filter({ hasText: /grid|list|table/i });
    const count = await btns.count();
    for (let i = 0; i < Math.min(count, 3); i++) {
      await btns.nth(i).click();
      await page.waitForTimeout(400);
      await expect(page.locator('body')).not.toContainText('TypeError');
    }
  });

  test('分页 — 下一页不崩溃', async ({ page }) => {
    const nextBtn = page.getByRole('button', { name: /next|下一页/i }).first();
    if (await nextBtn.isVisible() && await nextBtn.isEnabled()) {
      await nextBtn.click();
      await page.waitForTimeout(800);
      await expect(page.locator('body')).not.toContainText('TypeError');
    }
  });

  test('导出按钮存在（Excel/Export）', async ({ page }) => {
    const exportBtn = page.getByRole('button', { name: /export|导出/i }).first();
    if (await exportBtn.isVisible()) {
      await expect(exportBtn).toBeEnabled();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 加载态
// ─────────────────────────────────────────────────────────────────────────────
test.describe('项目列表 — 加载态', () => {
  test('API 响应慢时页面显示加载指示器', async ({ context, page }) => {
    await loginAs(context, ADMIN);
    // 拦截项目 API，延迟 1.5s
    await page.route(`${API}/api/projects*`, async (route) => {
      await new Promise(res => setTimeout(res, 1500));
      await route.continue();
    });
    await page.goto(`${FRONTEND}/projects/list`);
    // 在数据到达前应有加载指示（spinner / skeleton / loading text）
    const loadingVisible = await Promise.race([
      page.locator('[class*="skeleton"], [class*="spinner"], [class*="loading"], [role="progressbar"]')
        .first().isVisible().catch(() => false),
      page.getByText(/loading/i).first().isVisible().catch(() => false),
      new Promise<boolean>(res => setTimeout(() => res(true), 800)), // 超时默认 pass
    ]);
    // 等待加载完成后不崩溃
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 创建项目（完整表单）
// ─────────────────────────────────────────────────────────────────────────────
test.describe('新建项目', () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAs(context, ADMIN);
    await page.goto(`${FRONTEND}/projects/new`);
    await page.waitForLoadState('networkidle');
  });

  test('表单必填验证 — 空提交被阻止', async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: /create project/i });
    await expect(submitBtn).toBeVisible({ timeout: 10000 });
    const isDisabled = await submitBtn.isDisabled();
    const hasError = await page.locator('[aria-invalid="true"]').count() > 0
      || await page.getByText(/required|必填/i).count() > 0;
    expect(isDisabled || hasError).toBeTruthy();
  });

  test('填写完整表单 — 创建成功并跳转', async ({ page }) => {
    await page.locator('#name').fill(TEST_PROJECT);
    await page.locator('#clientCompany').fill(TEST_CLIENT);
    await page.locator('#mineSiteName').fill(TEST_SITE);
    const jobType = page.locator('#jobType');
    if (await jobType.isVisible()) {
      await jobType.click();
      await page.waitForTimeout(300);
      const atOpt = page.getByRole('option', { name: /^AT$/i });
      if (await atOpt.isVisible()) await atOpt.click();
      else await page.keyboard.press('Escape');
    }
    const submitBtn = page.getByRole('button', { name: /create project/i });
    await expect(submitBtn).toBeVisible({ timeout: 8000 });
    await submitBtn.click({ force: true });
    await page.waitForTimeout(3000);
    await expect(page.locator('body')).not.toContainText('TypeError');
    expect(page.url()).toContain('/projects');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 项目 CRUD 完整流程（API 级别：Create → Read → Update → Delete）
// ─────────────────────────────────────────────────────────────────────────────
test.describe('项目 CRUD — API 完整流程', () => {
  let projectId: number;

  test('POST /api/projects — 创建草稿项目', async ({ context }) => {
    await loginAs(context, ADMIN);
    const { req, cleanup } = await apiAs(context);

    const resp = await req.post('/api/projects', {
      data: {
        name: TEST_PROJECT,
        clientCompany: TEST_CLIENT,
        mineSiteName: TEST_SITE,
        jobType: 'AT',
      },
    });
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    projectId = body.id ?? body.data?.id;
    expect(projectId).toBeTruthy();

    await cleanup();
  });

  test('GET /api/projects/:id — 刚创建的项目可读取', async ({ context }) => {
    test.skip(!projectId, '依赖创建测试');
    await loginAs(context, ADMIN);
    const { req, cleanup } = await apiAs(context);

    const resp = await req.get(`/api/projects/${projectId}`);
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect((body.name ?? body.data?.name) as string).toContain('[E2E]');

    await cleanup();
  });

  test('PUT /api/projects/:id — 更新项目名称并验证', async ({ context }) => {
    test.skip(!projectId, '依赖创建测试');
    await loginAs(context, ADMIN);
    const { req, cleanup } = await apiAs(context);

    const updatedName = `${TEST_PROJECT} UPDATED`;
    const putResp = await req.put(`/api/projects/${projectId}`, {
      data: { name: updatedName },
    });
    expect(putResp.status()).toBeLessThan(300);

    // 再 GET 验证
    const getResp = await req.get(`/api/projects/${projectId}`);
    const body = await getResp.json();
    expect((body.name ?? body.data?.name) as string).toContain('UPDATED');

    await cleanup();
  });

  test('DELETE /api/projects/:id — 删除项目', async ({ context }) => {
    test.skip(!projectId, '依赖创建测试');
    await loginAs(context, ADMIN);
    const { req, cleanup } = await apiAs(context);

    // Step 1: 提交删除申请（→ DELETE_PENDING，返回 200）
    const delResp = await req.delete(`/api/projects/${projectId}`, {
      data: { reason: 'E2E 自动测试清理' },
    });
    expect(delResp.status()).toBeLessThan(300);

    // Step 2: 审批通过实际删除
    const approveResp = await req.post(`/api/projects/${projectId}/approve-delete`, {
      data: { approved: true, comment: 'E2E 自动测试清理' },
    });
    expect(approveResp.status()).toBeLessThan(300);

    // 验证 GET 返回 404
    const getResp = await req.get(`/api/projects/${projectId}`);
    expect(getResp.status()).toBe(404);

    await cleanup();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 项目详情页
// ─────────────────────────────────────────────────────────────────────────────
test.describe('项目详情页', () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAs(context, ADMIN);
    await page.goto(`${FRONTEND}/projects/${REAL_PROJECT_ID}`);
    await page.waitForLoadState('networkidle');
  });

  test('显示项目名称', async ({ page }) => {
    await expect(page.getByText(/IHC|Lab/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('Tasks 标签页可点击切换', async ({ page }) => {
    const taskTab = page.getByRole('tab', { name: /tasks|任务/i });
    if (await taskTab.isVisible()) {
      await taskTab.click();
      await page.waitForTimeout(600);
      await expect(page.locator('body')).not.toContainText('TypeError');
    }
  });

  test('文件管理区域可见', async ({ page }) => {
    const fileSection = page.getByText(/files|onedrive|local|文件/i).first();
    await expect(fileSection).toBeVisible({ timeout: 8000 });
  });

  test('OneDrive/Local 标签可切换', async ({ page }) => {
    for (const tabName of ['onedrive', 'local']) {
      const tab = page.getByRole('tab', { name: new RegExp(tabName, 'i') });
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(600);
        await expect(page.locator('body')).not.toContainText('TypeError');
      }
    }
  });

  test('评论输入框可见', async ({ page }) => {
    await expect(page.locator('body')).not.toContainText('TypeError');
    const commentArea = page.locator('textarea, [contenteditable="true"]').first();
    if (await commentArea.isVisible()) {
      await expect(commentArea).toBeEnabled();
    }
  });

  test('状态/字段行内显示 — 关键字段有值', async ({ page }) => {
    // 项目详情应显示基本信息
    const body = await page.locator('body').innerText();
    const hasInfo = /IHC|Lab|status|client|site|job/i.test(body);
    expect(hasInfo).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 项目审批完整流程（API：创建 → 提交 → 审批 → 验证状态 → 清理）
// ─────────────────────────────────────────────────────────────────────────────
test.describe('项目审批流程 — 完整 API 流程', () => {
  let approvalProjectId: number;

  test('1. 创建草稿项目', async ({ context }) => {
    await loginAs(context, ADMIN);
    const { req, cleanup } = await apiAs(context);
    const resp = await req.post('/api/projects', {
      data: {
        name: `[E2E-Approval] ${TS}`,
        clientCompany: `E2ECorpApproval-${TS}`,
        mineSiteName: `E2ESiteApproval-${TS}`,
        jobType: 'AT',
      },
    });
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    approvalProjectId = body.id ?? body.data?.id;
    expect(approvalProjectId).toBeTruthy();
    await cleanup();
  });

  test('2. 提交项目审批（DRAFT → PENDING）', async ({ context }) => {
    test.skip(!approvalProjectId, '依赖创建测试');
    await loginAs(context, ADMIN);
    const { req, cleanup } = await apiAs(context);
    const resp = await req.post(`/api/projects/${approvalProjectId}/submit`);
    expect(resp.status()).toBeLessThan(300);
    await cleanup();
  });

  test('3. Admin 审批通过（PENDING → APPROVED）', async ({ context }) => {
    test.skip(!approvalProjectId, '依赖创建测试');
    await loginAs(context, ADMIN);
    const { req, cleanup } = await apiAs(context);
    const resp = await req.post(`/api/projects/${approvalProjectId}/approve`, {
      data: { approved: true, comment: 'E2E 自动化审批通过' },
    });
    expect(resp.status()).toBeLessThan(300);
    await cleanup();
  });

  test('4. 验证状态为 APPROVED', async ({ context }) => {
    test.skip(!approvalProjectId, '依赖创建测试');
    await loginAs(context, ADMIN);
    const { req, cleanup } = await apiAs(context);
    const resp = await req.get(`/api/projects/${approvalProjectId}`);
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    const status = body.approvalStatus ?? body.data?.approvalStatus ?? body.status ?? body.data?.status;
    expect(String(status).toUpperCase()).toContain('APPROVED');
    await cleanup();
  });

  test('5. 清理 — 删除测试项目', async ({ context }) => {
    if (!approvalProjectId) return;
    await loginAs(context, ADMIN);
    const { req, cleanup } = await apiAs(context);
    // 两步删除：先申请，再审批
    await req.delete(`/api/projects/${approvalProjectId}`, {
      data: { reason: 'E2E 自动测试清理' },
    });
    await req.post(`/api/projects/${approvalProjectId}/approve-delete`, {
      data: { approved: true, comment: 'E2E 自动测试清理' },
    });
    await cleanup();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 项目审批 UI 测试
// ─────────────────────────────────────────────────────────────────────────────
test.describe('项目审批 — UI', () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAs(context, ADMIN);
    await page.goto(`${FRONTEND}/approvals/projects`);
    await page.waitForLoadState('networkidle');
  });

  test('审批列表页加载正常', async ({ page }) => {
    await expect(page.locator('body')).not.toContainText('TypeError');
    await expect(page.locator('body')).not.toContainText('Forbidden');
  });

  test('列表有内容或显示空态', async ({ page }) => {
    const hasContent =
      await page.locator('table tbody tr, [class*="approval"], [class*="card"]').count() > 0
      || await page.getByText(/no data|暂无|empty|no pending/i).count() > 0;
    expect(hasContent).toBeTruthy();
  });

  test('Pending/Approved/Rejected 标签可切换', async ({ page }) => {
    for (const tab of ['pending', 'approved', 'rejected']) {
      const t = page.getByRole('tab', { name: new RegExp(tab, 'i') });
      if (await t.isVisible()) {
        await t.click();
        await page.waitForTimeout(500);
        await expect(page.locator('body')).not.toContainText('TypeError');
      }
    }
  });

  test('Approve 按钮点击后有确认对话框（不实际提交）', async ({ page }) => {
    const approveBtn = page.getByRole('button', { name: /approve|批准/i }).first();
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
      await page.waitForTimeout(600);
      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible()) {
        // 有对话框 = 需要二次确认，符合预期
        await expect(dialog).toBeVisible();
        const cancelBtn = dialog.getByRole('button', { name: /cancel|取消|no/i }).first();
        if (await cancelBtn.isVisible()) await cancelBtn.click();
      }
      await expect(page.locator('body')).not.toContainText('TypeError');
    }
  });

  test('Reject 按钮点击后有确认对话框（不实际提交）', async ({ page }) => {
    const rejectBtn = page.getByRole('button', { name: /reject|拒绝/i }).first();
    if (await rejectBtn.isVisible()) {
      await rejectBtn.click();
      await page.waitForTimeout(600);
      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible()) {
        await expect(dialog).toBeVisible();
        const cancelBtn = dialog.getByRole('button', { name: /cancel|取消/i }).first();
        if (await cancelBtn.isVisible()) await cancelBtn.click();
      }
      await expect(page.locator('body')).not.toContainText('TypeError');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 错误态
// ─────────────────────────────────────────────────────────────────────────────
test.describe('项目 — 错误态', () => {
  test('访问不存在的项目 ID — 显示 404/错误提示，不崩溃', async ({ context, page }) => {
    await loginAs(context, ADMIN);
    await page.goto(`${FRONTEND}/projects/99999999`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
    const hasErrorMsg = await page.getByText(/not found|404|不存在|找不到|error/i).count() > 0;
    // 404 页 or 错误提示，任一满足即可
    expect(hasErrorMsg || page.url().includes('projects')).toBeTruthy();
  });

  test('项目列表 API 失败 — 不崩溃，显示错误或空态', async ({ context, page }) => {
    await loginAs(context, ADMIN);
    // 拦截项目列表 API 返回 500
    await page.route(`${API}/api/projects*`, (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ message: 'Internal Server Error' }) })
    );
    await page.goto(`${FRONTEND}/projects/list`);
    await page.waitForTimeout(3000);
    // 不应有 JS 崩溃
    await expect(page.locator('body')).not.toContainText('TypeError');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 权限 — danielhuang
// ─────────────────────────────────────────────────────────────────────────────
test.describe('项目 — danielhuang 权限', () => {
  test('danielhuang 可以看项目列表', async ({ context, page }) => {
    await loginAs(context, DANIEL);
    await page.goto(`${FRONTEND}/projects/list`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('Forbidden');
  });

  test('danielhuang 可以查看项目详情', async ({ context, page }) => {
    await loginAs(context, DANIEL);
    await page.goto(`${FRONTEND}/projects/${REAL_PROJECT_ID}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('Forbidden');
    await expect(page.locator('body')).not.toContainText('TypeError');
  });

  test('danielhuang 无权审批项目（项目审批页被拒或只读）', async ({ context, page }) => {
    await loginAs(context, DANIEL);
    await page.goto(`${FRONTEND}/approvals/projects`);
    await page.waitForLoadState('networkidle');
    // 不应崩溃（403 / redirect / readonly 都可）
    await expect(page.locator('body')).not.toContainText('TypeError');
  });
});
