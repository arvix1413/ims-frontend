import { test } from '@playwright/test';

const BASE = 'http://119.28.104.20';

async function login(page: any) {
  await page.goto(`${BASE}/login`);
  await page.locator('input').first().fill('ern');
  await page.locator('input[type="password"]').fill('ern');
  await page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Login")').click();
  await page.waitForURL(`${BASE}/`, { timeout: 15000 });
  await page.waitForTimeout(2000);
}

test('debug - 看商品管理里的按钮文字', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/?page=designManagement`);
  await page.waitForTimeout(3000);
  
  // 找所有按钮文字
  const btns = await page.locator('button').allTextContents();
  console.log('Buttons:', btns.slice(0, 20));
  
  // 找第一张卡片内的按钮
  const cardBtns = await page.locator('.ant-card button, [style*="box-shadow"] button').allTextContents();
  console.log('Card buttons:', cardBtns.slice(0, 10));
});

test('debug - 看库存记录搜索栏真实label', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/?page=inventoryRecords`);
  await page.waitForTimeout(2500);
  
  const labels = await page.locator('label, .ant-form-item-label').allTextContents();
  console.log('Form labels:', labels);
  
  const body = await page.textContent('body');
  // 搜索关键字
  const relevant = body?.split(/\s+/).filter(w => ['Color','Size','Operator','operationTime','Operation','打印标签','退货订单','Design'].some(k => w.includes(k)));
  console.log('Relevant words:', relevant?.slice(0, 20));
});

test('debug - 看销售订单创建页内容', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/?page=billManagement`);
  await page.waitForTimeout(2500);
  
  const btns = await page.locator('button').allTextContents();
  console.log('Bill buttons:', btns.slice(0, 15));
});

test('debug - 看会员管理菜单文字', async ({ page }) => {
  await login(page);
  await page.waitForTimeout(2000);
  
  const navText = await page.locator('aside, nav').textContent().catch(() => '');
  console.log('Nav text:', navText?.replace(/\s+/g, ' ').slice(0, 300));
});
