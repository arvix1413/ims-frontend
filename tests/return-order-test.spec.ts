import { test, expect } from '@playwright/test';

// 生产环境配置
const PROD_URL = 'http://119.28.104.20';
const TEST_USER = {
  name: 'ern',
  password: 'ern'
};

test.describe('退货订单功能 E2E 测试 - 生产环境', () => {
  test.beforeEach(async ({ page }) => {
    // 设置较长的超时时间
    test.setTimeout(120000);
    
    // 访问登录页面并登录
    await page.goto(`${PROD_URL}/login`);
    await page.locator('input').first().fill(TEST_USER.name);
    await page.locator('input[type="password"]').fill(TEST_USER.password);
    await page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Login")').click();
    
    // 等待登录成功，跳转到主页
    await page.waitForURL(`${PROD_URL}/`, { timeout: 15000 });
    await page.waitForTimeout(2000);
  });

  test('测试1: 打开退货订单抽屉不崩溃', async ({ page }) => {
    console.log('开始测试：打开退货订单抽屉');
    
    // 导航到销售订单页面
    await page.goto(`${PROD_URL}?page=billManagement`);
    await page.waitForLoadState('networkidle');
    
    // 查找并点击"退货订单"按钮（选择第一个）
    const returnOrderButton = page.getByRole('button', { name: /Return Order|退货订单/ }).first();
    await expect(returnOrderButton).toBeVisible({ timeout: 10000 });
    await returnOrderButton.click();
    
    // 等待抽屉打开
    await page.waitForSelector('.ant-drawer', { timeout: 10000 });
    
    // 验证抽屉标题
    const drawerTitle = page.locator('.ant-drawer-title');
    await expect(drawerTitle).toContainText(/退货订单|Return Order/);
    
    // 验证表单存在
    const form = page.locator('.ant-drawer .ant-form');
    await expect(form).toBeVisible();
    
    console.log('✅ 测试通过：退货订单抽屉正常打开');
  });

  test('测试2: 输入商品代码不崩溃', async ({ page }) => {
    console.log('开始测试：输入商品代码');
    
    // 导航到销售订单页面
    await page.goto(`${PROD_URL}?page=billManagement`);
    await page.waitForLoadState('networkidle');
    
    // 打开退货订单抽屉
    const returnOrderButton = page.getByRole('button', { name: /Return Order|退货订单/ }).first();
    await returnOrderButton.click();
    await page.waitForSelector('.ant-drawer', { timeout: 10000 });
    
    // 点击"添加商品"按钮
    const addProductButton = page.getByText('添加商品').or(page.getByText('Add Product'));
    await addProductButton.click();
    
    // 等待输入框出现
    await page.waitForSelector('.ant-select-auto-complete input, .ant-autocomplete input', { timeout: 5000 });
    
    // 获取商品代码输入框
    const codeInput = page.locator('.ant-select-auto-complete input, .ant-autocomplete input').first();
    
    // 测试输入不同的内容
    const testInputs = ['A', 'ABC', '123', 'TEST', 'あ', '测试'];
    
    for (const input of testInputs) {
      console.log(`  测试输入: "${input}"`);
      
      // 清空并输入
      await codeInput.clear();
      await codeInput.fill(input);
      
      // 等待一下让 debounce 触发
      await page.waitForTimeout(500);
      
      // 检查页面是否仍然正常（没有崩溃）
      const drawerStillVisible = await page.locator('.ant-drawer').isVisible();
      expect(drawerStillVisible).toBe(true);
      
      // 检查是否有错误边界显示
      const errorBoundary = page.locator('text=组件加载出错').or(page.locator('text=Error'));
      const hasError = await errorBoundary.isVisible().catch(() => false);
      expect(hasError).toBe(false);
    }
    
    console.log('✅ 测试通过：输入各种字符都不崩溃');
  });

  test('测试3: 快速连续输入不崩溃', async ({ page }) => {
    console.log('开始测试：快速连续输入');
    
    // 导航到销售订单页面
    await page.goto(`${PROD_URL}?page=billManagement`);
    await page.waitForLoadState('networkidle');
    
    // 打开退货订单抽屉
    const returnOrderButton = page.getByRole('button', { name: /Return Order|退货订单/ }).first();
    await returnOrderButton.click();
    await page.waitForSelector('.ant-drawer', { timeout: 10000 });
    
    // 添加商品
    const addProductButton = page.getByText('添加商品').or(page.getByText('Add Product'));
    await addProductButton.click();
    
    // 获取输入框
    const codeInput = page.locator('.ant-select-auto-complete input, .ant-autocomplete input').first();
    
    // 快速输入多个字符
    await codeInput.type('ABCDEFGHIJK', { delay: 50 });
    
    // 等待一下
    await page.waitForTimeout(1000);
    
    // 验证页面没有崩溃
    const drawerStillVisible = await page.locator('.ant-drawer').isVisible();
    expect(drawerStillVisible).toBe(true);
    
    // 检查控制台错误
    const errorBoundary = page.locator('text=组件加载出错');
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
    
    console.log('✅ 测试通过：快速输入不崩溃');
  });

  test('测试4: 添加多个商品行不崩溃', async ({ page }) => {
    console.log('开始测试：添加多个商品行');
    
    // 导航到销售订单页面
    await page.goto(`${PROD_URL}?page=billManagement`);
    await page.waitForLoadState('networkidle');
    
    // 打开退货订单抽屉
    const returnOrderButton = page.getByRole('button', { name: /Return Order|退货订单/ }).first();
    await returnOrderButton.click();
    await page.waitForSelector('.ant-drawer', { timeout: 10000 });
    
    // 添加3个商品行
    for (let i = 0; i < 3; i++) {
      console.log(`  添加第 ${i + 1} 个商品行`);
      const addProductButton = page.getByText('添加商品').or(page.getByText('Add Product'));
      await addProductButton.click();
      await page.waitForTimeout(300);
    }
    
    // 获取所有商品代码输入框
    const codeInputs = page.locator('.ant-select-auto-complete input, .ant-autocomplete input');
    const count = await codeInputs.count();
    
    console.log(`  找到 ${count} 个输入框`);
    expect(count).toBeGreaterThanOrEqual(3);
    
    // 在每个输入框中输入内容
    for (let i = 0; i < Math.min(count, 3); i++) {
      await codeInputs.nth(i).fill(`TEST${i + 1}`);
      await page.waitForTimeout(200);
    }
    
    // 验证页面没有崩溃
    const drawerStillVisible = await page.locator('.ant-drawer').isVisible();
    expect(drawerStillVisible).toBe(true);
    
    console.log('✅ 测试通过：添加多个商品行不崩溃');
  });

  test('测试5: 选择操作员不崩溃', async ({ page }) => {
    console.log('开始测试：选择操作员');
    
    // 导航到销售订单页面
    await page.goto(`${PROD_URL}?page=billManagement`);
    await page.waitForLoadState('networkidle');
    
    // 打开退货订单抽屉
    const returnOrderButton = page.getByRole('button', { name: /Return Order|退货订单/ }).first();
    await returnOrderButton.click();
    await page.waitForSelector('.ant-drawer', { timeout: 10000 });
    
    // 查找操作员下拉框
    const operatorLabel = page.locator('text=操作员').or(page.locator('text=Operator'));
    await expect(operatorLabel).toBeVisible();
    
    // 点击操作员下拉框
    const operatorSelect = page.locator('.ant-form-item').filter({ hasText: /操作员|Operator/ }).locator('.ant-select');
    await operatorSelect.click();
    
    // 等待下拉菜单出现
    await page.waitForSelector('.ant-select-dropdown', { timeout: 5000 });
    
    // 验证下拉菜单中有选项
    const options = page.locator('.ant-select-dropdown .ant-select-item');
    const optionCount = await options.count();
    
    console.log(`  找到 ${optionCount} 个操作员选项`);
    expect(optionCount).toBeGreaterThan(0);
    
    // 选择第一个选项
    if (optionCount > 0) {
      await options.first().click();
    }
    
    // 验证页面没有崩溃
    const drawerStillVisible = await page.locator('.ant-drawer').isVisible();
    expect(drawerStillVisible).toBe(true);
    
    console.log('✅ 测试通过：选择操作员不崩溃');
  });

  test('测试6: 关闭抽屉正常工作', async ({ page }) => {
    console.log('开始测试：关闭抽屉');
    
    // 导航到销售订单页面
    await page.goto(`${PROD_URL}?page=billManagement`);
    await page.waitForLoadState('networkidle');
    
    // 打开退货订单抽屉
    const returnOrderButton = page.getByRole('button', { name: /Return Order|退货订单/ }).first();
    await returnOrderButton.click();
    await page.waitForSelector('.ant-drawer', { timeout: 10000 });
    
    // 点击取消按钮
    const cancelButton = page.getByText('取消').or(page.getByText('Cancel'));
    await cancelButton.click();
    
    // 验证抽屉已关闭
    await page.waitForTimeout(500);
    const drawerVisible = await page.locator('.ant-drawer').isVisible().catch(() => false);
    expect(drawerVisible).toBe(false);
    
    console.log('✅ 测试通过：关闭抽屉正常工作');
  });
});
