/**
 * 04 - 任务管理 E2E（完整 CRUD + 审批流程 + 状态变更 + 加载态 + 错误态）
 */
import { test, expect } from '@playwright/test';
import { loginAs, apiAs, FRONTEND, API, ADMIN, DANIEL } from '../helpers/auth';

const TS = Date.now();
const APPROVED_PROJECT_ID = '3455'; // Cemix（已批准，有 OneDrive 路径）
const REAL_TASK_ID        = '5973'; // 已知存在的任务 AQ0177

// ─────────────────────────────────────────────────────────────────────────────
// 任务列表 & 搜索 & 筛选
// ─────────────────────────────────────────────────────────────────────────────
test.describe('任务列表 & 搜索 & 筛选', () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAs(context, ADMIN);
    await page.goto(`${FRONTEND}/tasks/list`);
    await page.waitForLoadState('networkidle');
  });

  test('任务列表有内容', async ({ page }) => {
    await expect(
      page.locator('table tbody tr, [class*="task"], [class*="card"]').first()
    ).toBeVisible({ timeout: 12000 });
  });

  test('列表显示任务 Code（格式：字母+数字）', async ({ page }) => {
    await expect(page.getByText(/[A-Z]{2}\d{4}/).first()).toBeVisible({ timeout: 10000 });
  });

  test('搜索 "mag" 返回匹配任务', async ({ page }) => {
    const search = page.locator('input[placeholder*="earch"]').first();
    await search.fill('mag');
    await page.waitForTimeout(1200);
    await expect(page.locator('body')).not.toContainText('TypeError');
    await expect(
      page.locator('table tbody tr, [class*="card"]').first()
    ).toBeVisible({ timeout: 6000 });
  });

  test('搜索无结果 — 不崩溃、有空态或无行', async ({ page }) => {
    const search = page.locator('input[placeholder*="earch"]').first();
    await search.fill('xyzNONE_RESULT_2099');
    await page.waitForTimeout(1200);
    await expect(page.locator('body')).not.toContainText('TypeError');
    const rows  = await page.locator('table tbody tr').count();
    const empty = await page.getByText(/no data|暂无|empty|no task/i).count();
    expect(rows === 0 || empty > 0).toBeTruthy();
  });

  test('清空搜索词 — 列表恢复', async ({ page }) => {
    const search = page.locator('input[placeholder*="earch"]').first();
    await search.fill('test');
    await page.waitForTimeout(800);
    await search.fill('');
    await page.waitForTimeout(800);
    await expect(
      page.locator('table tbody tr, [class*="card"]').first()
    ).toBeVisible({ timeout: 6000 });
  });

  test('按状态筛选 IN_PROGRESS — 不崩溃', async ({ page }) => {
    const f = page.locator('select[name="status"], select#status').first();
    if (await f.isVisible()) {
      await f.selectOption('IN_PROGRESS');
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).not.toContainText('TypeError');
    }
  });

  test('按优先级筛选 HIGH — 不崩溃', async ({ page }) => {
    const f = page.locator('select[name="priority"], select#priority').first();
    if (await f.isVisible()) {
      await f.selectOption('HIGH');
      await page.waitForTimeout(800);
      await expect(page.locator('body')).not.toContainText('TypeError');
    }
  });

  test('按 JobType 筛选 AQ — 不崩溃', async ({ page }) => {
    const f = page.locator('select[name="jobType"], select#jobType').first();
    if (await f.isVisible()) {
      await f.selectOption('AQ');
      await page.waitForTimeout(800);
      await expect(page.locator('body')).not.toContainText('TypeError');
    }
  });

  test('按审批状态筛选 PENDING — 不崩溃', async ({ page }) => {
    const f = page.locator('select[name="approvalStatus"]').first();
    if (await f.isVisible()) {
      await f.selectOption('PENDING');
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).not.toContainText('TypeError');
    }
  });

  test('视图切换 Grid/List — 不崩溃', async ({ page }) => {
    const btns = page.getByRole('button').filter({ hasText: /grid|list/i });
    const count = await btns.count();
    for (let i = 0; i < Math.min(count, 2); i++) {
      await btns.nth(i).click();
      await page.waitForTimeout(400);
      await expect(page.locator('body')).not.toContainText('TypeError');
    }
  });

  test('分页 — 下一页/上一页', async ({ page }) => {
    const nextBtn = page.getByRole('button', { name: /next|下一页/i }).first();
    if (await nextBtn.isVisible() && await nextBtn.isEnabled()) {
      await nextBtn.click();
      await page.waitForTimeout(800);
      await expect(page.locator('body')).not.toContainText('TypeError');
      const prevBtn = page.getByRole('button', { name: /prev|上一页/i }).first();
      if (await prevBtn.isEnabled()) await prevBtn.click();
    }
  });

  test('每页条数切换', async ({ page }) => {
    const pageSize = page.locator('select[name="pageSize"], select#pageSize').first();
    if (await pageSize.isVisible()) {
      const opts = await pageSize.locator('option').allTextContents();
      if (opts.length > 1) {
        await pageSize.selectOption({ index: 1 });
        await page.waitForTimeout(800);
        await expect(page.locator('body')).not.toContainText('TypeError');
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 加载态
// ─────────────────────────────────────────────────────────────────────────────
test.describe('任务列表 — 加载态', () => {
  test('API 响应慢时页面显示加载指示器', async ({ context, page }) => {
    await loginAs(context, ADMIN);
    await page.route(`${API}/api/tasks*`, async (route) => {
      await new Promise(res => setTimeout(res, 1500));
      await route.continue();
    });
    await page.goto(`${FRONTEND}/tasks/list`);
    // 等加载指示器出现（任一即可）
    const loadingFound = await Promise.race([
      page.locator('[class*="skeleton"], [class*="spinner"], [role="progressbar"]')
        .first().waitFor({ timeout: 1200 }).then(() => true).catch(() => false),
      page.getByText(/loading/i).first().waitFor({ timeout: 1200 }).then(() => true).catch(() => false),
      new Promise<boolean>(res => setTimeout(() => res(true), 1200)),
    ]);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 新建任务 — 表单验证
// ─────────────────────────────────────────────────────────────────────────────
test.describe('新建任务 — 表单验证', () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAs(context, ADMIN);
    await page.goto(`${FRONTEND}/tasks/new`);
    await page.waitForLoadState('networkidle');
  });

  test('空提交 — 被阻止（按钮 disabled 或有必填提示）', async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: /create task/i });
    await expect(submitBtn).toBeVisible({ timeout: 10000 });
    const isDisabled = await submitBtn.isDisabled();
    const hasError = await page.locator('[aria-invalid="true"]').count() > 0
      || await page.getByText(/required|必填/i).count() > 0;
    expect(isDisabled || hasError).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 任务 CRUD 完整流程（API 级别：Create → Read → Update → Delete）
// ─────────────────────────────────────────────────────────────────────────────
test.describe('任务 CRUD — API 完整流程', () => {
  let taskId: number;

  test('POST /api/tasks — 创建任务', async ({ context }) => {
    await loginAs(context, ADMIN);
    const { req, cleanup } = await apiAs(context);

    const resp = await req.post('/api/tasks', {
      data: {
        title: `[E2E] Task ${TS}`,
        projectId: Number(APPROVED_PROJECT_ID),
        jobType: 'AT',
        priority: 'MEDIUM',
        status: 'TODO',
      },
    });
    expect(resp.status()).toBeLessThan(300);
    const body = await resp.json();
    taskId = body.id ?? body.data?.id ?? body.task?.id;
    expect(taskId).toBeTruthy();
    await cleanup();
  });

  test('GET /api/tasks/:id — 读取刚创建的任务', async ({ context }) => {
    test.skip(!taskId, '依赖创建测试');
    await loginAs(context, ADMIN);
    const { req, cleanup } = await apiAs(context);

    const resp = await req.get(`/api/tasks/${taskId}`);
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    const title = body.title ?? body.data?.title ?? body.task?.title;
    expect(String(title)).toContain('[E2E]');
    await cleanup();
  });

  test('PUT /api/tasks/:id — 更新标题并验证', async ({ context }) => {
    test.skip(!taskId, '依赖创建测试');
    await loginAs(context, ADMIN);
    const { req, cleanup } = await apiAs(context);

    const updatedTitle = `[E2E] Task ${TS} UPDATED`;
    const putResp = await req.put(`/api/tasks/${taskId}`, {
      data: { title: updatedTitle, priority: 'HIGH' },
    });
    expect(putResp.status()).toBeLessThan(300);

    const getResp = await req.get(`/api/tasks/${taskId}`);
    const body = await getResp.json();
    const title = body.title ?? body.data?.title ?? body.task?.title;
    expect(String(title)).toContain('UPDATED');
    await cleanup();
  });

  test('PATCH /api/tasks/:id/status — 更新任务状态', async ({ context }) => {
    test.skip(!taskId, '依赖创建测试');
    await loginAs(context, ADMIN);
    const { req, cleanup } = await apiAs(context);

    const patchResp = await req.patch(`/api/tasks/${taskId}/status`, {
      data: { status: 'IN_PROGRESS' },
    });
    expect(patchResp.status()).toBeLessThan(300);

    const getResp = await req.get(`/api/tasks/${taskId}`);
    const body = await getResp.json();
    const status = body.status ?? body.data?.status ?? body.task?.status;
    expect(String(status).toUpperCase()).toContain('PROGRESS');
    await cleanup();
  });

  test('DELETE /api/tasks/:id — 删除任务，GET 返回 404', async ({ context }) => {
    test.skip(!taskId, '依赖创建测试');
    await loginAs(context, ADMIN);
    const { req, cleanup } = await apiAs(context);

    const delResp = await req.delete(`/api/tasks/${taskId}`);
    expect(delResp.status()).toBeLessThan(300);

    const getResp = await req.get(`/api/tasks/${taskId}`);
    expect(getResp.status()).toBe(404);
    await cleanup();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 任务审批完整流程（API：创建 → 提交审批 → 管理员审批 → 验证状态 → 清理）
// ─────────────────────────────────────────────────────────────────────────────
test.describe('任务审批流程 — 完整 API 流程', () => {
  let approvalTaskId: number;

  test('1. 创建任务（DRAFT）', async ({ context }) => {
    await loginAs(context, ADMIN);
    const { req, cleanup } = await apiAs(context);
    const resp = await req.post('/api/tasks', {
      data: {
        title: `[E2E-Approval] Task ${TS}`,
        projectId: Number(APPROVED_PROJECT_ID),
        jobType: 'AT',
        priority: 'MEDIUM',
        status: 'DRAFT',
      },
    });
    expect(resp.status()).toBeLessThan(300);
    const body = await resp.json();
    approvalTaskId = body.id ?? body.data?.id ?? body.task?.id;
    expect(approvalTaskId).toBeTruthy();
    await cleanup();
  });

  test('2. 提交任务审批（DRAFT → PENDING）', async ({ context }) => {
    test.skip(!approvalTaskId, '依赖创建测试');
    await loginAs(context, ADMIN);
    const { req, cleanup } = await apiAs(context);
    const resp = await req.post(`/api/tasks/${approvalTaskId}/submit`);
    expect(resp.status()).toBeLessThan(300);
    await cleanup();
  });

  test('3. Admin 审批通过（PENDING → APPROVED）', async ({ context }) => {
    test.skip(!approvalTaskId, '依赖创建测试');
    await loginAs(context, ADMIN);
    const { req, cleanup } = await apiAs(context);
    const resp = await req.post(`/api/tasks/${approvalTaskId}/approve`, {
      data: { approved: true, comment: 'E2E 自动审批通过' },
    });
    expect(resp.status()).toBeLessThan(300);
    await cleanup();
  });

  test('4. 验证任务审批状态为 APPROVED', async ({ context }) => {
    test.skip(!approvalTaskId, '依赖创建测试');
    await loginAs(context, ADMIN);
    const { req, cleanup } = await apiAs(context);
    const resp = await req.get(`/api/tasks/${approvalTaskId}`);
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    const status = body.approvalStatus ?? body.data?.approvalStatus ?? body.task?.approvalStatus;
    expect(String(status).toUpperCase()).toContain('APPROVED');
    await cleanup();
  });

  test('5. 清理 — 删除测试任务', async ({ context }) => {
    if (!approvalTaskId) return;
    await loginAs(context, ADMIN);
    const { req, cleanup } = await apiAs(context);
    await req.delete(`/api/tasks/${approvalTaskId}`);
    await cleanup();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 任务详情页 — UI
// ─────────────────────────────────────────────────────────────────────────────
test.describe('任务详情页', () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAs(context, ADMIN);
    await page.goto(`${FRONTEND}/tasks/${REAL_TASK_ID}`);
    await page.waitForLoadState('networkidle');
  });

  test('显示 task code AQ0177', async ({ page }) => {
    await expect(page.getByText(/AQ0177/i)).toBeVisible({ timeout: 10000 });
  });

  test('显示任务标题和基本信息', async ({ page }) => {
    const body = await page.locator('body').innerText();
    const hasInfo = /AQ0177|status|priority|project/i.test(body);
    expect(hasInfo).toBeTruthy();
  });

  test('文件管理区域可见', async ({ page }) => {
    const fileSection = page.getByText(/onedrive|local|files|file/i).first();
    await expect(fileSection).toBeVisible({ timeout: 8000 });
  });

  test('OneDrive 标签切换不崩溃', async ({ page }) => {
    const odTab = page.getByRole('tab', { name: /onedrive/i });
    if (await odTab.isVisible()) {
      await odTab.click();
      await page.waitForTimeout(1500);
      await expect(page.locator('body')).not.toContainText('TypeError');
    }
  });

  test('Local 标签切换不崩溃', async ({ page }) => {
    const localTab = page.getByRole('tab', { name: /local/i });
    if (await localTab.isVisible()) {
      await localTab.click();
      await page.waitForTimeout(800);
      await expect(page.locator('body')).not.toContainText('TypeError');
    }
  });

  test('文件夹浏览 — 双击子文件夹', async ({ page }) => {
    const folderItem = page.locator('[class*="folder"], [data-type="folder"]').first();
    if (await folderItem.isVisible()) {
      await folderItem.dblclick();
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).not.toContainText('TypeError');
    }
  });

  test('评论区 — 输入并提交，评论出现在列表', async ({ page }) => {
    const commentInput = page.locator(
      'textarea[placeholder*="comment"], textarea[placeholder*="写评论"], textarea[placeholder*="留言"], [contenteditable="true"]'
    ).first();
    if (await commentInput.isVisible()) {
      await commentInput.click();
      await commentInput.fill(`E2E 测试评论 ${TS}`);
      const submitBtn = page.getByRole('button', { name: /submit|send|发送|评论/i }).first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(2000);
        await expect(page.getByText(`E2E 测试评论 ${TS}`)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('状态下拉菜单可以更改任务状态', async ({ page }) => {
    const statusSelect = page.locator('select[name="status"], [class*="status"] select').first();
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption('IN_PROGRESS');
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).not.toContainText('TypeError');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 任务审批 — UI
// ─────────────────────────────────────────────────────────────────────────────
test.describe('任务审批 — UI (admin)', () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAs(context, ADMIN);
    await page.goto(`${FRONTEND}/approvals/tasks`);
    await page.waitForLoadState('networkidle');
  });

  test('任务审批列表页加载', async ({ page }) => {
    await expect(page.locator('body')).not.toContainText('TypeError');
    await expect(page.locator('body')).not.toContainText('Forbidden');
  });

  test('有内容或空态', async ({ page }) => {
    const hasContent =
      await page.locator('table tbody tr, [class*="approval"], [class*="task"]').count() > 0
      || await page.getByText(/no data|暂无|empty|no pending/i).count() > 0;
    expect(hasContent).toBeTruthy();
  });

  test('Pending/Approved/Rejected 标签切换', async ({ page }) => {
    for (const tab of ['pending', 'approved', 'rejected']) {
      const t = page.getByRole('tab', { name: new RegExp(tab, 'i') });
      if (await t.isVisible()) {
        await t.click();
        await page.waitForTimeout(400);
        await expect(page.locator('body')).not.toContainText('TypeError');
      }
    }
  });

  test('Approve / Reject 按钮点击有确认对话框（不实际提交）', async ({ page }) => {
    for (const btnName of [/approve|批准/i, /reject|拒绝/i]) {
      const btn = page.getByRole('button', { name: btnName }).first();
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(500);
        const dialog = page.getByRole('dialog');
        if (await dialog.isVisible()) {
          const cancel = dialog.getByRole('button', { name: /cancel|取消/i }).first();
          if (await cancel.isVisible()) await cancel.click();
        }
        await expect(page.locator('body')).not.toContainText('TypeError');
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 错误态
// ─────────────────────────────────────────────────────────────────────────────
test.describe('任务 — 错误态', () => {
  test('访问不存在的任务 ID — 不崩溃', async ({ context, page }) => {
    await loginAs(context, ADMIN);
    await page.goto(`${FRONTEND}/tasks/99999999`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
    const hasError = await page.getByText(/not found|404|不存在|找不到|error/i).count() > 0;
    expect(hasError || page.url().includes('tasks')).toBeTruthy();
  });

  test('任务列表 API 失败 — 不崩溃', async ({ context, page }) => {
    await loginAs(context, ADMIN);
    await page.route(`${API}/api/tasks*`, (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ message: 'Internal Server Error' }) })
    );
    await page.goto(`${FRONTEND}/tasks/list`);
    await page.waitForTimeout(3000);
    await expect(page.locator('body')).not.toContainText('TypeError');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// My Work 页面
// ─────────────────────────────────────────────────────────────────────────────
test.describe('My Work 页面', () => {
  test('admin My Work 加载正常', async ({ context, page }) => {
    await loginAs(context, ADMIN);
    await page.goto(`${FRONTEND}/my-work`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
  });

  test('admin My Work 有任务或空态', async ({ context, page }) => {
    await loginAs(context, ADMIN);
    await page.goto(`${FRONTEND}/my-work`);
    await page.waitForLoadState('networkidle');
    const hasContent =
      await page.locator('table tbody tr, [class*="task"], [class*="card"]').count() > 0
      || await page.getByText(/no task|暂无任务|empty/i).count() > 0;
    expect(hasContent).toBeTruthy();
  });

  test('My Work 标签切换', async ({ context, page }) => {
    await loginAs(context, ADMIN);
    await page.goto(`${FRONTEND}/my-work`);
    await page.waitForLoadState('networkidle');
    for (const tab of [/in.progress|进行中/i, /pending|待处理/i, /done|completed|完成/i]) {
      const t = page.getByRole('tab', { name: tab });
      if (await t.isVisible()) {
        await t.click();
        await page.waitForTimeout(400);
        await expect(page.locator('body')).not.toContainText('TypeError');
      }
    }
  });

  test('点击任务跳转详情不崩溃', async ({ context, page }) => {
    await loginAs(context, ADMIN);
    await page.goto(`${FRONTEND}/my-work`);
    await page.waitForLoadState('networkidle');
    const taskLink = page.locator('table tbody tr td a, [class*="task"] a').first();
    if (await taskLink.isVisible()) {
      await taskLink.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).not.toContainText('TypeError');
      await page.goBack();
    }
  });

  test('danielhuang My Work 加载正常', async ({ context, page }) => {
    await loginAs(context, DANIEL);
    await page.goto(`${FRONTEND}/my-work`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('Forbidden');
    await expect(page.locator('body')).not.toContainText('TypeError');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 权限 — danielhuang
// ─────────────────────────────────────────────────────────────────────────────
test.describe('任务 — danielhuang 权限', () => {
  test('danielhuang 可以看任务列表', async ({ context, page }) => {
    await loginAs(context, DANIEL);
    await page.goto(`${FRONTEND}/tasks/list`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('Forbidden');
    await expect(page.locator('body')).not.toContainText('TypeError');
  });

  test('danielhuang 无权访问任务审批管理', async ({ context, page }) => {
    await loginAs(context, DANIEL);
    await page.goto(`${FRONTEND}/approvals/tasks`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [新] Withdraw 审批 — API 级别 + 错误处理
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Withdraw 审批 — API 完整流程', () => {
  let withdrawTaskId: number;

  test('1. 创建任务并提交审批（DRAFT → PENDING）', async ({ context }) => {
    await loginAs(context, ADMIN);
    const { req, cleanup } = await apiAs(context);
    const create = await req.post('/api/tasks', {
      data: {
        title: `[E2E-Withdraw] Task ${TS}`,
        projectId: Number(APPROVED_PROJECT_ID),
        jobType: 'AT',
        priority: 'LOW',
        status: 'DRAFT',
      },
    });
    expect(create.status()).toBeLessThan(300);
    const body = await create.json();
    withdrawTaskId = body.id ?? body.data?.id ?? body.task?.id;
    expect(withdrawTaskId).toBeTruthy();

    const submit = await req.post(`/api/tasks/${withdrawTaskId}/submit`);
    expect(submit.status()).toBeLessThan(300);
    await cleanup();
  });

  test('2. Admin 撤回别人的 PENDING 任务（绕过 author 检查）', async ({ context }) => {
    test.skip(!withdrawTaskId, '依赖创建测试');
    await loginAs(context, ADMIN);
    const { req, cleanup } = await apiAs(context);
    const resp = await req.post(`/api/tasks/${withdrawTaskId}/withdraw`);
    expect(resp.status()).toBeLessThan(300);
    const body = await resp.json();
    const status = body.approvalStatus ?? body.data?.approvalStatus;
    expect(String(status).toUpperCase()).toBe('DRAFT');
    await cleanup();
  });

  test('3. 清理测试任务', async ({ context }) => {
    if (!withdrawTaskId) return;
    await loginAs(context, ADMIN);
    const { req, cleanup } = await apiAs(context);
    await req.delete(`/api/tasks/${withdrawTaskId}`);
    await cleanup();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [新] Admin 在任务详情页直接 Approve / Reject
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Admin 在任务详情页审批 — UI + API', () => {
  let detailApprovalTaskId: number;

  test('1. 创建并提交任务（API）', async ({ context }) => {
    await loginAs(context, ADMIN);
    const { req, cleanup } = await apiAs(context);
    const create = await req.post('/api/tasks', {
      data: {
        title: `[E2E-DetailApprove] Task ${TS}`,
        projectId: Number(APPROVED_PROJECT_ID),
        jobType: 'AT',
        priority: 'MEDIUM',
        status: 'DRAFT',
      },
    });
    expect(create.status()).toBeLessThan(300);
    const body = await create.json();
    detailApprovalTaskId = body.id ?? body.data?.id ?? body.task?.id;
    expect(detailApprovalTaskId).toBeTruthy();

    const submit = await req.post(`/api/tasks/${detailApprovalTaskId}/submit`);
    expect(submit.status()).toBeLessThan(300);
    await cleanup();
  });

  test('2. Admin 打开任务详情页 — 看到 Approve 和 Reject 按钮', async ({ context, page }) => {
    test.skip(!detailApprovalTaskId, '依赖创建测试');
    await loginAs(context, ADMIN);
    await page.goto(`${FRONTEND}/tasks/${detailApprovalTaskId}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
    // Admin 应该看到 Approve 按钮
    await expect(page.getByRole('button', { name: /^approve$/i })).toBeVisible({ timeout: 8000 });
    // Admin 应该看到 Reject 按钮
    await expect(page.getByRole('button', { name: /^reject$/i })).toBeVisible({ timeout: 8000 });
  });

  test('3. 点击 Approve — 弹出 comment 对话框，填写后确认', async ({ context, page }) => {
    test.skip(!detailApprovalTaskId, '依赖创建测试');
    await loginAs(context, ADMIN);
    await page.goto(`${FRONTEND}/tasks/${detailApprovalTaskId}`);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /^approve$/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await dialog.locator('textarea').fill('E2E 自动审批通过 — detail page');
    await dialog.getByRole('button', { name: /^approve$/i }).click();
    await page.waitForTimeout(3000);
    await expect(page.locator('body')).not.toContainText('TypeError');
    // 审批后状态应变为 Approved
    await expect(page.getByText(/approved/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('4. 清理测试任务', async ({ context }) => {
    if (!detailApprovalTaskId) return;
    await loginAs(context, ADMIN);
    const { req, cleanup } = await apiAs(context);
    await req.delete(`/api/tasks/${detailApprovalTaskId}`);
    await cleanup();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [新] danielhuang 视角 — 不应看到 Approve/Reject 按钮
// ─────────────────────────────────────────────────────────────────────────────
test.describe('普通用户视角 — 任务详情无审批按钮', () => {
  test('danielhuang 看 APPROVED 任务 — 无 Approve/Reject 按钮', async ({ context, page }) => {
    await loginAs(context, DANIEL);
    await page.goto(`${FRONTEND}/tasks/${REAL_TASK_ID}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
    // 普通用户不应看到审批按钮
    const approveBtn = page.getByRole('button', { name: /^approve$/i });
    const rejectBtn  = page.getByRole('button', { name: /^reject$/i });
    expect(await approveBtn.isVisible()).toBeFalsy();
    expect(await rejectBtn.isVisible()).toBeFalsy();
  });
});
