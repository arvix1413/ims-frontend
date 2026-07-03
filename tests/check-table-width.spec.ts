import { test, expect } from '@playwright/test';

const BASE = 'http://119.28.104.20';
const USER = 'ern';
const PASS = 'ern';

async function login(page: any) {
  await page.goto(`${BASE}/login`);
  await page.locator('input').first().fill(USER);
  await page.locator('input[type="password"]').fill(PASS);
  await page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Login")').click();
  await page.waitForURL(`${BASE}/`, { timeout: 15000 });
  await page.waitForTimeout(2000);
}

async function goTo(page: any, pageName: string) {
  await page.goto(`${BASE}/?page=${pageName}`);
  await page.waitForTimeout(2500);
}

test.describe('Table宽度检查', () => {

  test('进货订单 - Table宽度不超出内容区', async ({ page }) => {
    await login(page);
    await goTo(page, 'orderManagement');
    
    // 获取内容区域宽度
    const contentWidth = await page.evaluate(() => {
      const content = document.querySelector('.flex-1');
      return content ? content.getBoundingClientRect().width : 0;
    });
    
    // 获取Table容器宽度
    const tableWidth = await page.evaluate(() => {
      const table = document.querySelector('.ant-table');
      return table ? table.getBoundingClientRect().width : 0;
    });
    
    console.log(`进货订单 - 内容区宽度: ${contentWidth}px, Table宽度: ${tableWidth}px`);
    
    // Table宽度应该不超过内容区宽度
    expect(tableWidth).toBeLessThanOrEqual(contentWidth + 50); // 允许50px误差
    
    await page.screenshot({ path: 'tests/screenshots/order-table-width.png' });
  });

  test('销售订单 - Table宽度不超出内容区', async ({ page }) => {
    await login(page);
    await goTo(page, 'billManagement');
    
    const contentWidth = await page.evaluate(() => {
      const content = document.querySelector('.flex-1');
      return content ? content.getBoundingClientRect().width : 0;
    });
    
    const tableWidth = await page.evaluate(() => {
      const table = document.querySelector('.ant-table');
      return table ? table.getBoundingClientRect().width : 0;
    });
    
    console.log(`销售订单 - 内容区宽度: ${contentWidth}px, Table宽度: ${tableWidth}px`);
    
    expect(tableWidth).toBeLessThanOrEqual(contentWidth + 50);
    
    await page.screenshot({ path: 'tests/screenshots/bill-table-width.png' });
  });

  test('员工历史 - Table宽度对比（参照）', async ({ page }) => {
    await login(page);
    await goTo(page, 'employeeHistory');
    
    const contentWidth = await page.evaluate(() => {
      const content = document.querySelector('.flex-1');
      return content ? content.getBoundingClientRect().width : 0;
    });
    
    const tableWidth = await page.evaluate(() => {
      const table = document.querySelector('.ant-table');
      return table ? table.getBoundingClientRect().width : 0;
    });
    
    console.log(`员工历史 - 内容区宽度: ${contentWidth}px, Table宽度: ${tableWidth}px`);
    
    expect(tableWidth).toBeLessThanOrEqual(contentWidth + 50);
    
    await page.screenshot({ path: 'tests/screenshots/employee-table-width.png' });
  });

});
