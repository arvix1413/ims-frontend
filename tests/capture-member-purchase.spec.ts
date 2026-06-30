import { test } from '@playwright/test';

test('完整流程 - 会员购买记录商品展示截图', async ({ page }) => {
  test.setTimeout(180000);
  
  console.log('🚀 开始自动化截图流程...\n');
  
  // 1. 登录
  console.log('步骤 1: 访问登录页面');
  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');
  
  console.log('步骤 2: 填写登录信息');
  await page.fill('input[type="text"]', 'ern');
  await page.fill('input[type="password"]', 'ern');
  
  console.log('步骤 3: 点击登录按钮');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  // 截图1: 登录后的主页
  await page.screenshot({ 
    path: 'tests/member-screenshots/01-homepage.png',
    fullPage: true
  });
  console.log('✅ 截图 1: 登录后主页\n');
  
  // 2. 进入会员管理
  console.log('步骤 4: 查找会员管理菜单');
  const memberMenu = page.locator('text=/会员管理|Member Management/i').first();
  
  if (await memberMenu.isVisible()) {
    console.log('步骤 5: 点击会员管理');
    await memberMenu.click();
    await page.waitForTimeout(2000);
    
    // 截图2: 会员列表页
    await page.screenshot({ 
      path: 'tests/member-screenshots/02-member-list.png',
      fullPage: true
    });
    console.log('✅ 截图 2: 会员列表页\n');
    
    // 等待表格加载
    await page.waitForSelector('.ant-table', { timeout: 10000 });
    console.log('步骤 6: 会员列表加载完成');
    
    // 3. 查找并点击第一个会员的操作按钮
    console.log('步骤 7: 查找会员操作按钮');
    
    // 尝试多种方式找到操作按钮
    const possibleSelectors = [
      'button:has-text("详情")',
      'button:has-text("Detail")',
      '.ant-table-row button',
      '[aria-label="more"]',
      'button.ant-dropdown-trigger',
      '.ant-table-tbody tr:first-child button:last-child'
    ];
    
    let clicked = false;
    for (const selector of possibleSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 1000 })) {
          console.log(`  → 找到按钮: ${selector}`);
          await button.click();
          await page.waitForTimeout(1500);
          
          // 如果是下拉菜单，需要再点击"详情记录"
          const detailOption = page.locator('text=/详情记录|详情|Purchase History|Detail Record/i').first();
          if (await detailOption.isVisible({ timeout: 2000 })) {
            console.log('步骤 8: 点击下拉菜单中的"详情记录"');
            await detailOption.click();
            await page.waitForTimeout(2000);
          }
          
          clicked = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!clicked) {
      console.log('⚠️ 未找到操作按钮，尝试直接点击表格第一行');
      // 如果没有找到按钮，尝试点击整行
      await page.locator('.ant-table-tbody tr').first().click();
      await page.waitForTimeout(2000);
    }
    
    console.log('步骤 9: 等待购买记录页面加载');
    await page.waitForTimeout(3000);
    
    // 截图3: 会员购买记录完整页面
    await page.screenshot({ 
      path: 'tests/member-screenshots/03-purchase-history-full.png',
      fullPage: true
    });
    console.log('✅ 截图 3: 会员购买记录完整页面 ⭐\n');
    
    // 4. 查找并截取商品展示区域
    console.log('步骤 10: 查找商品展示区域');
    
    // 等待商品数据加载
    await page.waitForSelector('.ant-table', { timeout: 10000 });
    
    // 截图4: 购买记录表格特写
    const purchaseTable = page.locator('.ant-table').first();
    if (await purchaseTable.isVisible()) {
      await purchaseTable.screenshot({
        path: 'tests/member-screenshots/04-purchase-table.png'
      });
      console.log('✅ 截图 4: 购买记录表格特写 ⭐\n');
    }
    
    // 5. 查找商品Tag展示
    console.log('步骤 11: 查找商品 Tag 展示');
    const productTags = page.locator('.ant-tag');
    const tagCount = await productTags.count();
    console.log(`  → 找到 ${tagCount} 个商品标签`);
    
    if (tagCount > 0) {
      // 滚动到第一个商品Tag
      await productTags.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      // 截图5: 商品Tag特写（包含颜色、尺码、ORDER等信息）
      const productColumn = page.locator('td:has(.ant-tag)').first();
      if (await productColumn.isVisible()) {
        await productColumn.screenshot({
          path: 'tests/member-screenshots/05-product-tag-detail.png'
        });
        console.log('✅ 截图 5: 商品 Tag 详细展示 ⭐⭐⭐\n');
      }
      
      // 截图6: 整行数据（包括商品、金额等）
      const dataRow = page.locator('.ant-table-tbody tr').first();
      await dataRow.screenshot({
        path: 'tests/member-screenshots/06-purchase-row-detail.png'
      });
      console.log('✅ 截图 6: 购买记录行详细信息 ⭐\n');
    }
    
    // 6. 额外截取一些关键信息
    console.log('步骤 12: 截取其他关键信息');
    
    // 如果有会员信息卡片
    const memberCard = page.locator('.ant-card').first();
    if (await memberCard.isVisible()) {
      await memberCard.screenshot({
        path: 'tests/member-screenshots/07-member-info-card.png'
      });
      console.log('✅ 截图 7: 会员信息卡片\n');
    }
    
    // 最后一张：整个页面的滚动截图
    await page.screenshot({ 
      path: 'tests/member-screenshots/08-full-page-final.png',
      fullPage: true
    });
    console.log('✅ 截图 8: 最终完整页面\n');
    
    console.log('🎉 所有截图已完成！');
    console.log('📁 截图保存位置: tests/member-screenshots/');
    console.log('');
    console.log('重点截图（查看商品展示效果）:');
    console.log('  ⭐⭐⭐ 05-product-tag-detail.png - 商品标签详细展示');
    console.log('  ⭐⭐  03-purchase-history-full.png - 购买记录完整页面');
    console.log('  ⭐⭐  04-purchase-table.png - 购买记录表格');
    console.log('  ⭐    06-purchase-row-detail.png - 单行详细信息');
    
  } else {
    console.log('❌ 未找到会员管理菜单');
    await page.screenshot({ 
      path: 'tests/member-screenshots/error-no-menu.png',
      fullPage: true
    });
  }
});
