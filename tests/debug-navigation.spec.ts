import { test, expect } from '@playwright/test';

test('调试导航 - 查找会员菜单', async ({ page }) => {
  test.setTimeout(120000);
  
  // 访问登录页
  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');
  
  console.log('🔑 登录中...');
  
  // 登录
  await page.fill('input[type="text"]', 'ern');
  await page.fill('input[type="password"]', 'ern');
  await page.click('button[type="submit"]');
  
  // 等待登录完成
  await page.waitForTimeout(3000);
  
  console.log('📍 当前URL:', page.url());
  
  // 截图当前页面
  await page.screenshot({ 
    path: 'tests/screenshots/after-login.png',
    fullPage: true
  });
  console.log('✅ 登录后页面截图已保存');
  
  // 查找所有可见的文本内容
  console.log('\n📋 页面上所有可见的链接和按钮:');
  const links = await page.locator('a, button, [role="menuitem"]').allTextContents();
  links.slice(0, 50).forEach((text, i) => {
    if (text.trim()) {
      console.log(`  ${i + 1}. ${text.trim()}`);
    }
  });
  
  // 查找侧边栏菜单
  const sidebarItems = await page.locator('.ant-menu-item, .ant-menu-submenu').allTextContents();
  console.log('\n🗂️ 侧边栏菜单项:');
  sidebarItems.forEach((text, i) => {
    if (text.trim()) {
      console.log(`  ${i + 1}. ${text.trim()}`);
    }
  });
  
  // 尝试查找包含"会员"的元素
  const memberElements = await page.locator('text=/会员|Member|member/i').all();
  console.log(`\n👥 找到 ${memberElements.length} 个包含"会员"的元素`);
  
  for (let i = 0; i < Math.min(memberElements.length, 5); i++) {
    const el = memberElements[i];
    const text = await el.textContent();
    const tagName = await el.evaluate(node => node.tagName);
    const isVisible = await el.isVisible();
    console.log(`  ${i + 1}. <${tagName}> "${text}" (可见: ${isVisible})`);
    
    if (isVisible && i === 0) {
      console.log('  → 尝试点击第一个会员元素...');
      await el.click();
      await page.waitForTimeout(2000);
      
      // 截图点击后的页面
      await page.screenshot({ 
        path: 'tests/screenshots/after-click-member.png',
        fullPage: true
      });
      console.log('✅ 点击会员菜单后截图已保存');
      
      console.log('📍 点击后URL:', page.url());
      
      // 查找表格
      const hasTable = await page.locator('.ant-table').isVisible();
      console.log(`📊 是否有表格: ${hasTable}`);
      
      if (hasTable) {
        // 查找操作按钮
        const actionButtons = await page.locator('button').allTextContents();
        console.log('\n🔘 表格中的按钮:');
        actionButtons.slice(0, 20).forEach((text, i) => {
          if (text.trim()) {
            console.log(`  ${i + 1}. ${text.trim()}`);
          }
        });
      }
    }
  }
});
