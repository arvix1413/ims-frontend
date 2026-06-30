import { test } from '@playwright/test';

// 连接生产环境
const PRODUCTION_URL = 'http://119.28.104.20';

test('生产环境 - 会员购买记录商品展示截图', async ({ page }) => {
  test.setTimeout(180000);
  
  console.log('🚀 开始从生产环境截图...\n');
  console.log(`📍 生产环境地址: ${PRODUCTION_URL}\n`);
  
  // 1. 访问生产环境登录页
  console.log('步骤 1: 访问生产环境登录页面');
  await page.goto(`${PRODUCTION_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // 截图：登录页
  await page.screenshot({ 
    path: 'tests/production-screenshots/01-login-page.png',
    fullPage: true
  });
  console.log('✅ 截图 1: 登录页面\n');
  
  // 2. 登录
  console.log('步骤 2: 填写登录信息 (ern/ern)');
  await page.fill('input[type="text"]', 'ern');
  await page.fill('input[type="password"]', 'ern');
  
  console.log('步骤 3: 点击登录');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  
  console.log(`📍 当前URL: ${page.url()}\n`);
  
  // 截图：登录后首页
  await page.screenshot({ 
    path: 'tests/production-screenshots/02-homepage.png',
    fullPage: true
  });
  console.log('✅ 截图 2: 登录后首页\n');
  
  // 3. 查找会员管理菜单
  console.log('步骤 4: 查找会员管理菜单');
  const menuSelectors = [
    'text=会员管理',
    'text=Member Management',
    '[href*="member"]',
    '.ant-menu-item:has-text("会员")',
  ];
  
  let foundMenu = false;
  for (const selector of menuSelectors) {
    try {
      const menu = page.locator(selector).first();
      if (await menu.isVisible({ timeout: 2000 })) {
        console.log(`  → 找到菜单: ${selector}`);
        await menu.click();
        await page.waitForTimeout(3000);
        foundMenu = true;
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (!foundMenu) {
    console.log('⚠️ 未找到会员管理菜单，列出页面上的所有菜单项');
    const allMenuItems = await page.locator('.ant-menu-item, a').allTextContents();
    console.log('可见菜单项:', allMenuItems.slice(0, 20));
    
    // 即使没找到，也保存当前状态
    await page.screenshot({ 
      path: 'tests/production-screenshots/03-no-menu-found.png',
      fullPage: true
    });
    return;
  }
  
  console.log(`📍 点击后URL: ${page.url()}\n`);
  
  // 截图：会员列表页
  await page.screenshot({ 
    path: 'tests/production-screenshots/03-member-list.png',
    fullPage: true
  });
  console.log('✅ 截图 3: 会员列表页\n');
  
  // 4. 等待表格加载
  console.log('步骤 5: 等待会员列表加载');
  await page.waitForSelector('.ant-table', { timeout: 10000 });
  console.log('  → 表格加载完成\n');
  
  // 截图：会员列表表格
  const memberTable = page.locator('.ant-table').first();
  await memberTable.screenshot({
    path: 'tests/production-screenshots/04-member-table.png'
  });
  console.log('✅ 截图 4: 会员列表表格\n');
  
  // 5. 点击第一个会员的操作按钮
  console.log('步骤 6: 查找并点击会员操作按钮');
  
  const buttonSelectors = [
    '.ant-table-tbody tr:first-child button',
    'button[aria-label="more"]',
    '.ant-dropdown-trigger',
    'button:has-text("详情")',
  ];
  
  let clickedButton = false;
  for (const selector of buttonSelectors) {
    try {
      const button = page.locator(selector).first();
      if (await button.isVisible({ timeout: 2000 })) {
        console.log(`  → 找到按钮: ${selector}`);
        await button.click();
        await page.waitForTimeout(1500);
        
        // 如果是下拉菜单，再点击详情选项
        const dropdownOptions = [
          'text=详情记录',
          'text=详情',
          'text=Purchase History',
          'li:has-text("详情")',
        ];
        
        for (const option of dropdownOptions) {
          try {
            const menuItem = page.locator(option).first();
            if (await menuItem.isVisible({ timeout: 1000 })) {
              console.log(`  → 点击下拉选项: ${option}`);
              await menuItem.click();
              await page.waitForTimeout(2000);
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
        clickedButton = true;
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (!clickedButton) {
    console.log('⚠️ 未找到操作按钮\n');
    await page.screenshot({ 
      path: 'tests/production-screenshots/05-no-button-found.png',
      fullPage: true
    });
    return;
  }
  
  console.log('步骤 7: 等待购买记录页面加载');
  await page.waitForTimeout(4000);
  console.log(`📍 购买记录页URL: ${page.url()}\n`);
  
  // 截图：购买记录完整页面 ⭐⭐⭐
  await page.screenshot({ 
    path: 'tests/production-screenshots/06-purchase-history-FULL.png',
    fullPage: true
  });
  console.log('✅ 截图 6: 会员购买记录完整页面 ⭐⭐⭐\n');
  
  // 6. 等待购买记录表格加载
  console.log('步骤 8: 等待购买记录表格加载');
  await page.waitForSelector('.ant-table', { timeout: 10000 });
  
  // 截图：购买记录表格
  const purchaseTable = page.locator('.ant-table').first();
  await purchaseTable.screenshot({
    path: 'tests/production-screenshots/07-purchase-table.png'
  });
  console.log('✅ 截图 7: 购买记录表格 ⭐⭐\n');
  
  // 7. 查找商品Tag展示
  console.log('步骤 9: 查找商品 Tag 展示');
  const productTags = page.locator('.ant-tag');
  const tagCount = await productTags.count();
  console.log(`  → 找到 ${tagCount} 个商品标签\n`);
  
  if (tagCount > 0) {
    // 滚动到商品Tag
    await productTags.first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    
    // 截图：商品列（包含ProductItemTag） ⭐⭐⭐⭐⭐
    const productColumn = page.locator('td:has(.ant-tag)').first();
    if (await productColumn.isVisible()) {
      await productColumn.screenshot({
        path: 'tests/production-screenshots/08-PRODUCT-TAG-DETAIL.png'
      });
      console.log('✅ 截图 8: 商品 Tag 详细展示 ⭐⭐⭐⭐⭐\n');
    }
    
    // 截图：购买记录整行
    const dataRow = page.locator('.ant-table-tbody tr:has(.ant-tag)').first();
    if (await dataRow.isVisible()) {
      await dataRow.screenshot({
        path: 'tests/production-screenshots/09-purchase-row.png'
      });
      console.log('✅ 截图 9: 购买记录行 ⭐⭐\n');
    }
    
    // 截图：多个商品Tag（如果有的话）
    const productCells = page.locator('td:has(.ant-tag)');
    const cellCount = await productCells.count();
    if (cellCount > 1) {
      await productCells.nth(1).screenshot({
        path: 'tests/production-screenshots/10-product-tag-sample-2.png'
      });
      console.log('✅ 截图 10: 第二个商品展示样例\n');
    }
  } else {
    console.log('⚠️ 未找到商品标签（可能该会员没有购买记录）\n');
  }
  
  // 8. 截取会员信息卡片（如果有）
  const infoCard = page.locator('.ant-card').first();
  if (await infoCard.isVisible()) {
    await infoCard.screenshot({
      path: 'tests/production-screenshots/11-member-info-card.png'
    });
    console.log('✅ 截图 11: 会员信息卡片\n');
  }
  
  // 9. 最后的完整页面截图
  await page.screenshot({ 
    path: 'tests/production-screenshots/12-final-full-page.png',
    fullPage: true
  });
  console.log('✅ 截图 12: 最终完整页面\n');
  
  // 总结
  console.log('═══════════════════════════════════════');
  console.log('🎉 截图完成！');
  console.log('═══════════════════════════════════════');
  console.log('📁 保存位置: tests/production-screenshots/');
  console.log('');
  console.log('🌟 重点查看（商品展示效果）:');
  console.log('  ⭐⭐⭐⭐⭐ 08-PRODUCT-TAG-DETAIL.png');
  console.log('  ⭐⭐⭐    06-purchase-history-FULL.png');
  console.log('  ⭐⭐     07-purchase-table.png');
  console.log('  ⭐⭐     09-purchase-row.png');
  console.log('');
  console.log('📊 其他截图:');
  console.log('  - 03-member-list.png - 会员列表（查看余额颜色）');
  console.log('  - 04-member-table.png - 会员表格特写');
  console.log('  - 10-product-tag-sample-2.png - 更多商品展示样例');
  console.log('═══════════════════════════════════════\n');
});
