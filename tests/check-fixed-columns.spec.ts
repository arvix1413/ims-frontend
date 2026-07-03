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

test.describe('Fixed列功能验证', () => {

  test('进货订单 - Fixed列检查', async ({ page }) => {
    await login(page);
    await goTo(page, 'orderManagement');
    await page.screenshot({ path: 'tests/screenshots/order-fixed-check.png', fullPage: false });

    // 检查是否有表格
    const tableExists = await page.locator('.ant-table').first().isVisible().catch(() => false);
    expect(tableExists).toBe(true);

    // 检查fixed列的CSS类
    const fixedLeftCount = await page.locator('.ant-table-cell-fix-left').count();
    const fixedRightCount = await page.locator('.ant-table-cell-fix-right').count();

    console.log(`进货订单 - 固定左列: ${fixedLeftCount}个, 固定右列: ${fixedRightCount}个`);
    
    // 应该至少有左固定列（图片、代码）和右固定列（操作）
    expect(fixedLeftCount).toBeGreaterThan(0);
    expect(fixedRightCount).toBeGreaterThan(0);

    // 检查第一个fixed-left单元格的样式
    if (fixedLeftCount > 0) {
      const leftCellStyle = await page.locator('.ant-table-cell-fix-left').first().evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          position: computed.position,
          left: computed.left,
          zIndex: computed.zIndex
        };
      });
      console.log('左固定列样式:', leftCellStyle);
      expect(leftCellStyle.position).toBe('sticky');
    }

    // 检查第一个fixed-right单元格的样式
    if (fixedRightCount > 0) {
      const rightCellStyle = await page.locator('.ant-table-cell-fix-right').first().evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          position: computed.position,
          right: computed.right,
          zIndex: computed.zIndex
        };
      });
      console.log('右固定列样式:', rightCellStyle);
      expect(rightCellStyle.position).toBe('sticky');
    }

    console.log('✅ 进货订单Fixed列验证通过');
  });

  test('销售订单 - Fixed列检查', async ({ page }) => {
    await login(page);
    await goTo(page, 'billManagement');
    await page.screenshot({ path: 'tests/screenshots/bill-fixed-check.png', fullPage: false });

    const tableExists = await page.locator('.ant-table').first().isVisible().catch(() => false);
    expect(tableExists).toBe(true);

    const fixedLeftCount = await page.locator('.ant-table-cell-fix-left').count();
    const fixedRightCount = await page.locator('.ant-table-cell-fix-right').count();

    console.log(`销售订单 - 固定左列: ${fixedLeftCount}个, 固定右列: ${fixedRightCount}个`);
    
    expect(fixedLeftCount).toBeGreaterThan(0);
    expect(fixedRightCount).toBeGreaterThan(0);

    if (fixedLeftCount > 0) {
      const leftCellStyle = await page.locator('.ant-table-cell-fix-left').first().evaluate(el => {
        return window.getComputedStyle(el).position;
      });
      expect(leftCellStyle).toBe('sticky');
    }

    if (fixedRightCount > 0) {
      const rightCellStyle = await page.locator('.ant-table-cell-fix-right').first().evaluate(el => {
        return window.getComputedStyle(el).position;
      });
      expect(rightCellStyle).toBe('sticky');
    }

    console.log('✅ 销售订单Fixed列验证通过');
  });

  test('库存记录 - Fixed列检查（对照组）', async ({ page }) => {
    await login(page);
    await goTo(page, 'inventoryRecords');
    await page.screenshot({ path: 'tests/screenshots/inventory-fixed-check.png', fullPage: false });

    const tableExists = await page.locator('.ant-table').first().isVisible().catch(() => false);
    expect(tableExists).toBe(true);

    const fixedLeftCount = await page.locator('.ant-table-cell-fix-left').count();

    console.log(`库存记录（对照组）- 固定左列: ${fixedLeftCount}个`);
    
    // 库存记录应该也有fixed列
    expect(fixedLeftCount).toBeGreaterThan(0);

    if (fixedLeftCount > 0) {
      const leftCellStyle = await page.locator('.ant-table-cell-fix-left').first().evaluate(el => {
        return window.getComputedStyle(el).position;
      });
      expect(leftCellStyle).toBe('sticky');
    }

    console.log('✅ 库存记录Fixed列验证通过（对照组）');
  });

});
