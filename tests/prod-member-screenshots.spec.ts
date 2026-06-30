import { test } from '@playwright/test';

const PROD_URL = 'http://119.28.104.20';

test('生产环境会员管理页面截图', async ({ page }) => {
  test.setTimeout(120000);
  
  console.log('🚀 访问生产环境会员管理页面\n');
  
  // 直接访问会员管理页面
  console.log('步骤 1: 访问会员管理页面');
  await page.goto(`${PROD_URL}/?page=memberManagement`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // 检查是否跳转到登录页
  const currentUrl = page.url();
  console.log(`📍 当前URL: ${currentUrl}\n`);
  
  if (currentUrl.includes('login') || currentUrl.includes('Login')) {
    console.log('🔐 需要登录，开始登录流程\n');
    
    // 截图登录页
    await page.screenshot({ 
      path: 'tests/prod-member-screenshots/01-login-required.png',
      fullPage: true
    });
    console.log('✅ 截图 1: 登录页面\n');
    
    // 查找并填写登录表单
    console.log('步骤 2: 填写登录信息');
    
    // 尝试多种输入框选择器
    const usernameSelectors = [
      'input[name="username"]',
      'input[placeholder*="用户"]',
      'input[placeholder*="账号"]',
      'input[type="text"]',
      'input[id*="user"]',
    ];
    
    for (const selector of usernameSelectors) {
      try {
        const input = page.locator(selector).first();
        if (await input.isVisible({ timeout: 1000 })) {
          console.log(`  → 找到用户名输入框: ${selector}`);
          await input.fill('ern');
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    // 填写密码
    const passwordInput = page.locator('input[type="password"]').first();
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('ern');
      console.log('  → 已填写密码\n');
    }
    
    // 点击登录按钮
    console.log('步骤 3: 点击登录按钮');
    const loginButtonSelectors = [
      'button[type="submit"]',
      'button:has-text("登录")',
      'button:has-text("Login")',
      '.ant-btn-primary',
    ];
    
    for (const selector of loginButtonSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 1000 })) {
          console.log(`  → 找到登录按钮: ${selector}`);
          await button.click();
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    // 等待登录完成
    console.log('步骤 4: 等待登录完成');
    await page.waitForTimeout(5000);
    
    console.log(`📍 登录后URL: ${page.url()}\n`);
  }
  
  // 确保在会员管理页面
  if (!page.url().includes('memberManagement')) {
    console.log('步骤 5: 导航到会员管理页面');
    await page.goto(`${PROD_URL}/?page=memberManagement`);
    await page.waitForTimeout(3000);
  }
  
  // 截图：会员管理主页
  await page.screenshot({ 
    path: 'tests/prod-member-screenshots/02-member-management.png',
    fullPage: true
  });
  console.log('✅ 截图 2: 会员管理页面 ⭐\n');
  
  // 等待表格加载
  console.log('步骤 6: 等待会员列表加载');
  await page.waitForSelector('.ant-table', { timeout: 10000 });
  console.log('  → 表格加载完成\n');
  
  // 截图：会员列表表格（查看余额颜色）
  const memberTable = page.locator('.ant-table').first();
  await memberTable.screenshot({
    path: 'tests/prod-member-screenshots/03-member-table-BALANCE-COLOR.png'
  });
  console.log('✅ 截图 3: 会员表格（查看余额颜色） ⭐⭐\n');
  
  // 查找并点击第一个会员的操作按钮
  console.log('步骤 7: 查找第一个会员的操作按钮');
  
  // 先尝试找到所有的按钮
  const allButtons = await page.locator('.ant-table-tbody tr:first-child button').all();
  console.log(`  → 找到 ${allButtons.length} 个按钮\n`);
  
  if (allButtons.length > 0) {
    // 点击最后一个按钮（通常是操作按钮）
    const lastButton = allButtons[allButtons.length - 1];
    await lastButton.click();
    console.log('  → 已点击操作按钮');
    await page.waitForTimeout(1500);
    
    // 截图下拉菜单
    await page.screenshot({ 
      path: 'tests/prod-member-screenshots/04-dropdown-menu.png',
      fullPage: false
    });
    console.log('✅ 截图 4: 下拉菜单\n');
    
    // 查找并点击"详情记录"
    console.log('步骤 8: 查找"详情记录"选项');
    const menuOptions = [
      'text=详情记录',
      'text=详情',
      'text=Purchase History',
      '[role="menuitem"]:has-text("详情")',
      '.ant-dropdown-menu-item:has-text("详情")',
    ];
    
    for (const selector of menuOptions) {
      try {
        const option = page.locator(selector).first();
        if (await option.isVisible({ timeout: 2000 })) {
          console.log(`  → 找到选项: ${selector}`);
          await option.click();
          await page.waitForTimeout(3000);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    console.log(`📍 点击后URL: ${page.url()}\n`);
    
    // 截图：会员购买记录页面（完整）
    await page.screenshot({ 
      path: 'tests/prod-member-screenshots/05-PURCHASE-HISTORY-FULL.png',
      fullPage: true
    });
    console.log('✅ 截图 5: 会员购买记录完整页面 ⭐⭐⭐⭐\n');
    
    // 等待购买记录表格加载
    console.log('步骤 9: 等待购买记录表格加载');
    await page.waitForSelector('.ant-table', { timeout: 10000 });
    
    // 截图：购买记录表格
    const purchaseTable = page.locator('.ant-table').first();
    await purchaseTable.screenshot({
      path: 'tests/prod-member-screenshots/06-purchase-table.png'
    });
    console.log('✅ 截图 6: 购买记录表格 ⭐⭐\n');
    
    // 查找商品Tag
    console.log('步骤 10: 查找商品 ProductItemTag');
    const productTags = page.locator('.ant-tag');
    const tagCount = await productTags.count();
    console.log(`  → 找到 ${tagCount} 个商品标签\n`);
    
    if (tagCount > 0) {
      // 滚动到第一个商品Tag
      await productTags.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      // 截图：商品列（重点！！！）
      const productColumn = page.locator('td:has(.ant-tag)').first();
      if (await productColumn.isVisible()) {
        await productColumn.screenshot({
          path: 'tests/prod-member-screenshots/07-PRODUCT-DISPLAY-DETAIL.png'
        });
        console.log('✅ 截图 7: 商品展示详细（ProductItemTag） ⭐⭐⭐⭐⭐\n');
      }
      
      // 截图：购买记录行
      const purchaseRow = page.locator('.ant-table-tbody tr:has(.ant-tag)').first();
      await purchaseRow.screenshot({
        path: 'tests/prod-member-screenshots/08-purchase-row-with-product.png'
      });
      console.log('✅ 截图 8: 包含商品的购买记录行 ⭐⭐\n');
      
      // 如果有多个商品记录，也截取第二个
      if (tagCount > 5) {
        const secondRow = page.locator('.ant-table-tbody tr:has(.ant-tag)').nth(1);
        if (await secondRow.isVisible()) {
          await secondRow.screenshot({
            path: 'tests/prod-member-screenshots/09-purchase-row-sample-2.png'
          });
          console.log('✅ 截图 9: 第二行购买记录样例\n');
        }
      }
      
      // 截取一个包含多个商品的单元格（如果有）
      const cellsWithTags = page.locator('td:has(.ant-tag)');
      const cellCount = await cellsWithTags.count();
      console.log(`  → 找到 ${cellCount} 个包含商品的单元格\n`);
      
      if (cellCount > 1) {
        await cellsWithTags.nth(1).screenshot({
          path: 'tests/prod-member-screenshots/10-product-cell-sample.png'
        });
        console.log('✅ 截图 10: 另一个商品单元格样例\n');
      }
    } else {
      console.log('⚠️ 该会员暂无购买记录或无商品标签\n');
    }
    
    // 会员信息卡片
    const memberCard = page.locator('.ant-card').first();
    if (await memberCard.isVisible()) {
      await memberCard.screenshot({
        path: 'tests/prod-member-screenshots/11-member-info-card.png'
      });
      console.log('✅ 截图 11: 会员信息卡片\n');
    }
    
    // 最后的完整截图
    await page.screenshot({ 
      path: 'tests/prod-member-screenshots/12-final-complete.png',
      fullPage: true
    });
    console.log('✅ 截图 12: 最终完整页面\n');
    
  } else {
    console.log('⚠️ 未找到操作按钮\n');
  }
  
  // 总结
  console.log('═══════════════════════════════════════════════');
  console.log('🎉 生产环境截图完成！');
  console.log('═══════════════════════════════════════════════');
  console.log('📁 保存位置:');
  console.log('   /Users/leo_w/Workspace/codes/ern-projects/ims-frontend/');
  console.log('   tests/prod-member-screenshots/\n');
  console.log('🌟 重点截图（查看改动效果）:\n');
  console.log('  ⭐⭐⭐⭐⭐ 07-PRODUCT-DISPLAY-DETAIL.png');
  console.log('             → 商品展示详细（ProductItemTag 组件效果）\n');
  console.log('  ⭐⭐⭐⭐  05-PURCHASE-HISTORY-FULL.png');
  console.log('             → 会员购买记录完整页面\n');
  console.log('  ⭐⭐⭐    03-member-table-BALANCE-COLOR.png');
  console.log('             → 会员列表（查看余额颜色改动）\n');
  console.log('  ⭐⭐     06-purchase-table.png');
  console.log('             → 购买记录表格\n');
  console.log('  ⭐⭐     08-purchase-row-with-product.png');
  console.log('             → 购买记录行详细\n');
  console.log('═══════════════════════════════════════════════\n');
});
