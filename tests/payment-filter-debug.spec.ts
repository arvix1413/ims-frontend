import { test, expect } from '@playwright/test';

const BASE = 'http://119.28.104.20';

async function login(page: any) {
  await page.goto(`${BASE}/login`);
  await page.locator('input').first().fill('ern');
  await page.locator('input[type="password"]').fill('ern');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`${BASE}/`, { timeout: 15000 });
  await page.waitForTimeout(2000);
}

test('检查前端发送的 paymentFlag 参数', async ({ page }) => {
  await login(page);
  
  // 监听 API 请求
  page.on('request', request => {
    if (request.url().includes('/order/page')) {
      const postData = request.postDataJSON();
      console.log('API请求参数:', JSON.stringify(postData, null, 2));
    }
  });
  
  page.on('response', async response => {
    if (response.url().includes('/order/page')) {
      const json = await response.json().catch(() => null);
      console.log('API响应前3条:');
      json?.data?.content?.slice(0, 3)?.forEach((item: any, idx: number) => {
        console.log(`  ${idx+1}. ${item.design} - paymentFlag: "${item.paymentFlag}" (${typeof item.paymentFlag})`);
      });
    }
  });
  
  await page.goto(`${BASE}/?page=orderManagement`);
  await page.waitForTimeout(3000);
  
  // 选择 PAID
  const paidSelect = page.locator('.ant-select-selector').filter({ hasText: /付款状态|payment/i }).first();
  await paidSelect.click();
  await page.waitForTimeout(500);
  
  const paidOption = page.locator('.ant-select-item-option-content:has-text("PAID")').first();
  await paidOption.click();
  await page.waitForTimeout(500);
  
  // 点搜索
  const searchBtn = page.locator('button:has-text("搜索"), button:has-text("Search")').first();
  await searchBtn.click();
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: 'tests/screenshots/paid-filter-result.png', fullPage: false });
});

test('检查数据库里 payment_flag 的实际值', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/?page=orderManagement`);
  await page.waitForTimeout(3000);
  
  // 不过滤，获取所有订单
  const allOrders = await page.evaluate(async () => {
    const resp = await fetch('http://119.28.104.20/order/page', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        areaType: 1,
        warehouseName: 'SL二店',
        status: ['0', '1', '2', '3', '4', '6', '7'],
        searchPage: { desc: 1, page: 1, pageSize: 50, sort: 'create_date' }
      })
    });
    return resp.json();
  });
  
  const flagValues = new Set();
  allOrders?.data?.content?.forEach((item: any) => {
    flagValues.add(`"${item.paymentFlag}"`);
  });
  
  console.log('数据库里所有不同的 paymentFlag 值:', Array.from(flagValues).join(', '));
  
  // 统计
  const counts: any = {};
  allOrders?.data?.content?.forEach((item: any) => {
    const key = item.paymentFlag || 'null';
    counts[key] = (counts[key] || 0) + 1;
  });
  
  console.log('paymentFlag 分布:');
  Object.entries(counts).forEach(([key, count]) => {
    console.log(`  ${key}: ${count}条`);
  });
});
