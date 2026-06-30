import { test, expect } from '@playwright/test';

test.describe('会员购买记录商品展示截图', () => {
  test('截图 - 会员购买记录页面商品展示', async ({ page }) => {
    test.setTimeout(120000);
    
    try {
      // 访问登录页
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('networkidle');
      
      console.log('📸 开始截取会员购买记录页面...');
      
      // 尝试登录（如果有登录表单）
      const hasUsernameInput = await page.locator('input[placeholder*="用户名"], input[placeholder*="账号"], input[type="text"]').first().isVisible().catch(() => false);
      
      if (hasUsernameInput) {
        console.log('🔑 尝试登录...');
        
        // 填写登录信息
        await page.locator('input[placeholder*="用户名"], input[placeholder*="账号"], input[type="text"]').first().fill('ern');
        await page.locator('input[type="password"]').first().fill('ern');
        
        // 点击登录按钮
        await page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Login")').first().click();
        
        // 等待登录完成
        await page.waitForURL('http://localhost:3000/', { timeout: 10000 }).catch(() => {
          console.log('⚠️ 登录可能失败，继续尝试...');
        });
        
        await page.waitForTimeout(2000);
      }
      
      // 截取当前页面（主页）
      await page.screenshot({ 
        path: 'tests/screenshots/01-homepage.png',
        fullPage: false
      });
      console.log('✅ 首页截图已保存');
      
      // 查找并点击会员管理菜单
      const memberMenu = page.locator('text=/会员|Member/i').first();
      if (await memberMenu.isVisible()) {
        await memberMenu.click();
        await page.waitForTimeout(2000);
        
        // 截取会员列表页
        await page.screenshot({ 
          path: 'tests/screenshots/02-member-list.png',
          fullPage: true
        });
        console.log('✅ 会员列表页截图已保存');
        
        // 等待会员表格加载
        await page.waitForSelector('.ant-table', { timeout: 10000 });
        
        // 查找并点击第一个会员的"详情记录"或"查看"按钮
        const detailButtons = [
          'button:has-text("详情记录")',
          'button:has-text("详情")',
          'button:has-text("查看")',
          '[aria-label="more"]',
          '.ant-dropdown-trigger'
        ];
        
        let clicked = false;
        for (const selector of detailButtons) {
          const button = page.locator(selector).first();
          if (await button.isVisible().catch(() => false)) {
            await button.click();
            await page.waitForTimeout(1000);
            
            // 如果是下拉菜单，再点击详情选项
            const detailOption = page.locator('text=/详情|购买记录|Purchase/i').first();
            if (await detailOption.isVisible().catch(() => false)) {
              await detailOption.click();
            }
            
            clicked = true;
            console.log('✅ 已点击详情按钮');
            break;
          }
        }
        
        if (clicked) {
          await page.waitForTimeout(3000);
          
          // 截取会员购买记录页面（重点！）
          await page.screenshot({ 
            path: 'tests/screenshots/03-member-purchase-history-FULL.png',
            fullPage: true
          });
          console.log('✅ 会员购买记录完整页面截图已保存');
          
          // 查找商品列表区域并截取特写
          const productTable = page.locator('.ant-table').first();
          if (await productTable.isVisible()) {
            await productTable.screenshot({
              path: 'tests/screenshots/04-product-display-detail.png'
            });
            console.log('✅ 商品展示详细截图已保存');
          }
          
          // 查找商品 Tag 区域
          const productTags = page.locator('.ant-tag').first();
          if (await productTags.isVisible()) {
            // 滚动到商品区域
            await productTags.scrollIntoViewIfNeeded();
            await page.waitForTimeout(500);
            
            // 截取商品区域特写
            const productRow = productTags.locator('xpath=ancestor::tr').first();
            await productRow.screenshot({
              path: 'tests/screenshots/05-product-tag-closeup.png'
            });
            console.log('✅ 商品 Tag 特写截图已保存');
          }
          
          console.log('\n🎉 所有截图已完成！');
          console.log('📁 截图位置: tests/screenshots/');
          console.log('   - 01-homepage.png');
          console.log('   - 02-member-list.png');
          console.log('   - 03-member-purchase-history-FULL.png ⭐');
          console.log('   - 04-product-display-detail.png ⭐');
          console.log('   - 05-product-tag-closeup.png ⭐');
        } else {
          console.log('⚠️ 未找到详情按钮');
        }
      } else {
        console.log('⚠️ 未找到会员管理菜单');
      }
    } catch (error) {
      console.error('❌ 截图过程出错:', error);
      
      // 即使出错也保存当前页面状态
      await page.screenshot({ 
        path: 'tests/screenshots/error-state.png',
        fullPage: true
      });
      console.log('已保存错误状态截图: error-state.png');
    }
  });

  test('直接访问会员购买记录（如果知道URL）', async ({ page }) => {
    test.setTimeout(60000);
    
    // 如果你知道直接访问购买记录的URL，可以尝试直接访问
    console.log('尝试直接访问购买记录页面...');
    
    try {
      await page.goto('http://localhost:3000/member-purchase', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: 'tests/screenshots/direct-purchase-page.png',
        fullPage: true
      });
      console.log('✅ 直接访问购买记录页面截图已保存');
    } catch (error) {
      console.log('⚠️ 直接访问失败（可能需要登录或URL不正确）');
    }
  });
});
