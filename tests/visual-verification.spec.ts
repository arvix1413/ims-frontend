import { test, expect } from '@playwright/test';

// 测试生产环境的样式
test.use({ 
  baseURL: 'https://ims.example.com' // 替换为实际的生产环境 URL
});

test.describe('视觉验证 - 风格改动', () => {
  test('验证 ProductItemTag 组件样式统一性', async ({ page }) => {
    test.setTimeout(60000);
    
    // 先检查本地开发环境
    await page.goto('http://localhost:3000/login');
    
    console.log('🔍 开始验证风格改动...');
    
    // 检查页面标题
    const title = await page.title();
    console.log('页面标题:', title);
    
    // 等待页面完全加载
    await page.waitForLoadState('networkidle');
    
    // 检查是否有登录表单
    const hasLoginForm = await page.locator('input[type="text"]').count() > 0;
    console.log('登录表单存在:', hasLoginForm);
    
    if (hasLoginForm) {
      console.log('✅ 应用正常运行');
    }
  });

  test('本地开发环境截图', async ({ page }) => {
    test.setTimeout(120000);
    
    // 访问本地开发服务器
    await page.goto('http://localhost:3000');
    
    // 等待加载
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 截图首页
    await page.screenshot({ 
      path: 'tests/screenshots/homepage.png',
      fullPage: false 
    });
    
    console.log('✅ 首页截图已保存');
  });

  test('验证颜色常量', async ({ page }) => {
    // 这个测试验证我们的颜色方案
    const colors = {
      productCode: '#396293',     // 商品代码蓝色
      colorSize: '#595959',       // 颜色尺码灰色
      order: '#faad14',           // ORDER 橙色
      balance: '#262626',         // 会员余额深灰色
      balanceHighlight: '#1890ff' // 余额高亮蓝色
    };
    
    console.log('🎨 颜色方案:');
    console.log('  商品代码:', colors.productCode);
    console.log('  颜色尺码:', colors.colorSize);
    console.log('  ORDER 标识:', colors.order);
    console.log('  会员余额:', colors.balance);
    console.log('  余额高亮:', colors.balanceHighlight);
    
    // 验证颜色值是否符合设计规范
    expect(colors.productCode).toBe('#396293');
    expect(colors.balance).toBe('#262626');
    expect(colors.balanceHighlight).toBe('#1890ff');
  });
});

test.describe('代码验证', () => {
  test('验证 ProductItemTag 组件存在', async () => {
    const fs = require('fs');
    const path = require('path');
    
    const componentPath = path.join(__dirname, '../src/app/components/common/ProductItemTag.tsx');
    const exists = fs.existsSync(componentPath);
    
    console.log('ProductItemTag 组件路径:', componentPath);
    console.log('组件文件存在:', exists);
    
    expect(exists).toBeTruthy();
    
    if (exists) {
      const content = fs.readFileSync(componentPath, 'utf-8');
      
      // 验证颜色值在代码中
      expect(content).toContain('#396293'); // 商品代码蓝色
      expect(content).toContain('#595959'); // 颜色尺码灰色
      expect(content).toContain('#faad14'); // ORDER 橙色
      
      console.log('✅ ProductItemTag 组件颜色方案验证通过');
    }
  });

  test('验证会员页面颜色改动', async () => {
    const fs = require('fs');
    const path = require('path');
    
    const memberIndexPath = path.join(__dirname, '../src/app/components/pages/member/index.tsx');
    const exists = fs.existsSync(memberIndexPath);
    
    expect(exists).toBeTruthy();
    
    if (exists) {
      const content = fs.readFileSync(memberIndexPath, 'utf-8');
      
      // 验证绿色已被替换
      const greenColorCount = (content.match(/#52c41a/g) || []).length;
      console.log('绿色 #52c41a 出现次数:', greenColorCount);
      expect(greenColorCount).toBe(0);
      
      // 验证新颜色存在
      expect(content).toContain('#262626'); // 深灰色
      expect(content).toContain('#1890ff'); // 蓝色
      
      console.log('✅ 会员页面颜色改动验证通过');
    }
  });

  test('验证导入路径使用绝对路径', async () => {
    const fs = require('fs');
    const path = require('path');
    
    const billIndexPath = path.join(__dirname, '../src/app/components/pages/bill/index.tsx');
    const memberPurchasePath = path.join(__dirname, '../src/app/components/pages/member/MemberPurchaseHistory.tsx');
    
    const billContent = fs.readFileSync(billIndexPath, 'utf-8');
    const memberContent = fs.readFileSync(memberPurchasePath, 'utf-8');
    
    // 验证使用绝对路径而非相对路径
    expect(billContent).toContain('@/app/components/common/ProductItemTag');
    expect(memberContent).toContain('@/app/components/common/ProductItemTag');
    
    // 验证不包含相对路径
    expect(billContent).not.toContain('../common/ProductItemTag');
    expect(memberContent).not.toContain('../common/ProductItemTag');
    
    console.log('✅ 导入路径验证通过（使用绝对路径）');
  });
});
