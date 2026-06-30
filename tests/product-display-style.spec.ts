import { test, expect } from '@playwright/test';

test.describe('产品展示风格验证', () => {
  test.beforeEach(async ({ page }) => {
    // 访问登录页
    await page.goto('/login');
    
    // 等待登录页加载
    await page.waitForLoadState('networkidle');
  });

  test('验证账单页面商品展示风格', async ({ page }) => {
    // 登录（需要根据实际的登录逻辑调整）
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // 等待跳转到主页
    await page.waitForURL('/', { timeout: 10000 });
    
    // 导航到账单页面
    await page.click('text=账单管理');
    
    // 等待账单数据加载
    await page.waitForSelector('.ant-table', { timeout: 10000 });
    
    // 检查商品项是否使用 Tag 组件
    const productTags = await page.locator('.ant-tag').count();
    expect(productTags).toBeGreaterThan(0);
    
    // 验证商品代码样式（蓝色粗体）
    const productCodeSpan = page.locator('.ant-tag span').first();
    const color = await productCodeSpan.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    const fontWeight = await productCodeSpan.evaluate((el) => {
      return window.getComputedStyle(el).fontWeight;
    });
    
    console.log('商品代码颜色:', color);
    console.log('商品代码字重:', fontWeight);
    
    // RGB(57, 98, 147) = #396293
    expect(color).toContain('57, 98, 147');
    expect(fontWeight).toBe('bold');
  });

  test('验证会员购买记录商品展示风格', async ({ page }) => {
    // 登录
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/', { timeout: 10000 });
    
    // 导航到会员管理页面
    await page.click('text=会员管理');
    
    // 等待会员列表加载
    await page.waitForSelector('.ant-table', { timeout: 10000 });
    
    // 点击第一个会员的详情记录
    await page.click('button:has-text("详情记录")').first();
    
    // 等待购买记录页面加载
    await page.waitForSelector('.ant-table', { timeout: 10000 });
    
    // 检查商品项是否使用 Tag 组件
    const productTags = await page.locator('.ant-tag').count();
    expect(productTags).toBeGreaterThan(0);
    
    // 验证商品代码样式
    const productCodeSpan = page.locator('.ant-tag span').first();
    const color = await productCodeSpan.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    const fontWeight = await productCodeSpan.evaluate((el) => {
      return window.getComputedStyle(el).fontWeight;
    });
    
    console.log('会员页商品代码颜色:', color);
    console.log('会员页商品代码字重:', fontWeight);
    
    expect(color).toContain('57, 98, 147');
    expect(fontWeight).toBe('bold');
  });

  test('验证会员余额颜色改动', async ({ page }) => {
    // 登录
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/', { timeout: 10000 });
    
    // 导航到会员管理页面
    await page.click('text=会员管理');
    
    // 等待会员列表加载
    await page.waitForSelector('.ant-table', { timeout: 10000 });
    
    // 查找会员余额列
    const balanceCell = page.locator('.ant-table-tbody tr').first().locator('td').nth(4);
    const balanceColor = await balanceCell.locator('div').evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    
    console.log('会员余额颜色:', balanceColor);
    
    // 验证不是绿色 (rgb(82, 196, 26) = #52c41a)
    expect(balanceColor).not.toContain('82, 196, 26');
    
    // 验证是深灰色 (rgb(38, 38, 38) = #262626)
    expect(balanceColor).toContain('38, 38, 38');
  });

  test('截图对比 - 账单页面', async ({ page }) => {
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/', { timeout: 10000 });
    await page.click('text=账单管理');
    await page.waitForSelector('.ant-table', { timeout: 10000 });
    
    // 等待数据加载完成
    await page.waitForTimeout(2000);
    
    // 截图
    await page.screenshot({ 
      path: 'tests/screenshots/bill-page-product-display.png',
      fullPage: true 
    });
  });

  test('截图对比 - 会员余额', async ({ page }) => {
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/', { timeout: 10000 });
    await page.click('text=会员管理');
    await page.waitForSelector('.ant-table', { timeout: 10000 });
    
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: 'tests/screenshots/member-balance-display.png',
      fullPage: true 
    });
  });
});
