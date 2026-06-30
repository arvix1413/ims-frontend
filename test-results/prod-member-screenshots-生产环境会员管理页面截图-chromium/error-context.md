# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: prod-member-screenshots.spec.ts >> 生产环境会员管理页面截图
- Location: tests/prod-member-screenshots.spec.ts:5:5

# Error details

```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('.ant-table') to be visible

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - img "Slady Logo" [ref=e6]
      - generic [ref=e8]:
        - generic [ref=e9]:
          - generic [ref=e10]: Account
          - textbox "Account" [ref=e11]
        - generic [ref=e12]:
          - generic [ref=e13]: Password
          - generic [ref=e14]:
            - textbox "Password" [ref=e15]
            - button [ref=e16]:
              - img [ref=e17]
        - button "Login" [ref=e20]
    - generic [ref=e22]:
      - img "Background 1" [ref=e24]
      - img "Background 2" [ref=e27]
      - img "Background 3" [ref=e30]
      - img "Background 4" [ref=e33]
  - alert [ref=e35]
```

# Test source

```ts
  7   |   
  8   |   console.log('🚀 访问生产环境会员管理页面\n');
  9   |   
  10  |   // 直接访问会员管理页面
  11  |   console.log('步骤 1: 访问会员管理页面');
  12  |   await page.goto(`${PROD_URL}/?page=memberManagement`);
  13  |   await page.waitForLoadState('networkidle');
  14  |   await page.waitForTimeout(3000);
  15  |   
  16  |   // 检查是否跳转到登录页
  17  |   const currentUrl = page.url();
  18  |   console.log(`📍 当前URL: ${currentUrl}\n`);
  19  |   
  20  |   if (currentUrl.includes('login') || currentUrl.includes('Login')) {
  21  |     console.log('🔐 需要登录，开始登录流程\n');
  22  |     
  23  |     // 截图登录页
  24  |     await page.screenshot({ 
  25  |       path: 'tests/prod-member-screenshots/01-login-required.png',
  26  |       fullPage: true
  27  |     });
  28  |     console.log('✅ 截图 1: 登录页面\n');
  29  |     
  30  |     // 查找并填写登录表单
  31  |     console.log('步骤 2: 填写登录信息');
  32  |     
  33  |     // 尝试多种输入框选择器
  34  |     const usernameSelectors = [
  35  |       'input[name="username"]',
  36  |       'input[placeholder*="用户"]',
  37  |       'input[placeholder*="账号"]',
  38  |       'input[type="text"]',
  39  |       'input[id*="user"]',
  40  |     ];
  41  |     
  42  |     for (const selector of usernameSelectors) {
  43  |       try {
  44  |         const input = page.locator(selector).first();
  45  |         if (await input.isVisible({ timeout: 1000 })) {
  46  |           console.log(`  → 找到用户名输入框: ${selector}`);
  47  |           await input.fill('ern');
  48  |           break;
  49  |         }
  50  |       } catch (e) {
  51  |         continue;
  52  |       }
  53  |     }
  54  |     
  55  |     // 填写密码
  56  |     const passwordInput = page.locator('input[type="password"]').first();
  57  |     if (await passwordInput.isVisible()) {
  58  |       await passwordInput.fill('ern');
  59  |       console.log('  → 已填写密码\n');
  60  |     }
  61  |     
  62  |     // 点击登录按钮
  63  |     console.log('步骤 3: 点击登录按钮');
  64  |     const loginButtonSelectors = [
  65  |       'button[type="submit"]',
  66  |       'button:has-text("登录")',
  67  |       'button:has-text("Login")',
  68  |       '.ant-btn-primary',
  69  |     ];
  70  |     
  71  |     for (const selector of loginButtonSelectors) {
  72  |       try {
  73  |         const button = page.locator(selector).first();
  74  |         if (await button.isVisible({ timeout: 1000 })) {
  75  |           console.log(`  → 找到登录按钮: ${selector}`);
  76  |           await button.click();
  77  |           break;
  78  |         }
  79  |       } catch (e) {
  80  |         continue;
  81  |       }
  82  |     }
  83  |     
  84  |     // 等待登录完成
  85  |     console.log('步骤 4: 等待登录完成');
  86  |     await page.waitForTimeout(5000);
  87  |     
  88  |     console.log(`📍 登录后URL: ${page.url()}\n`);
  89  |   }
  90  |   
  91  |   // 确保在会员管理页面
  92  |   if (!page.url().includes('memberManagement')) {
  93  |     console.log('步骤 5: 导航到会员管理页面');
  94  |     await page.goto(`${PROD_URL}/?page=memberManagement`);
  95  |     await page.waitForTimeout(3000);
  96  |   }
  97  |   
  98  |   // 截图：会员管理主页
  99  |   await page.screenshot({ 
  100 |     path: 'tests/prod-member-screenshots/02-member-management.png',
  101 |     fullPage: true
  102 |   });
  103 |   console.log('✅ 截图 2: 会员管理页面 ⭐\n');
  104 |   
  105 |   // 等待表格加载
  106 |   console.log('步骤 6: 等待会员列表加载');
> 107 |   await page.waitForSelector('.ant-table', { timeout: 10000 });
      |              ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  108 |   console.log('  → 表格加载完成\n');
  109 |   
  110 |   // 截图：会员列表表格（查看余额颜色）
  111 |   const memberTable = page.locator('.ant-table').first();
  112 |   await memberTable.screenshot({
  113 |     path: 'tests/prod-member-screenshots/03-member-table-BALANCE-COLOR.png'
  114 |   });
  115 |   console.log('✅ 截图 3: 会员表格（查看余额颜色） ⭐⭐\n');
  116 |   
  117 |   // 查找并点击第一个会员的操作按钮
  118 |   console.log('步骤 7: 查找第一个会员的操作按钮');
  119 |   
  120 |   // 先尝试找到所有的按钮
  121 |   const allButtons = await page.locator('.ant-table-tbody tr:first-child button').all();
  122 |   console.log(`  → 找到 ${allButtons.length} 个按钮\n`);
  123 |   
  124 |   if (allButtons.length > 0) {
  125 |     // 点击最后一个按钮（通常是操作按钮）
  126 |     const lastButton = allButtons[allButtons.length - 1];
  127 |     await lastButton.click();
  128 |     console.log('  → 已点击操作按钮');
  129 |     await page.waitForTimeout(1500);
  130 |     
  131 |     // 截图下拉菜单
  132 |     await page.screenshot({ 
  133 |       path: 'tests/prod-member-screenshots/04-dropdown-menu.png',
  134 |       fullPage: false
  135 |     });
  136 |     console.log('✅ 截图 4: 下拉菜单\n');
  137 |     
  138 |     // 查找并点击"详情记录"
  139 |     console.log('步骤 8: 查找"详情记录"选项');
  140 |     const menuOptions = [
  141 |       'text=详情记录',
  142 |       'text=详情',
  143 |       'text=Purchase History',
  144 |       '[role="menuitem"]:has-text("详情")',
  145 |       '.ant-dropdown-menu-item:has-text("详情")',
  146 |     ];
  147 |     
  148 |     for (const selector of menuOptions) {
  149 |       try {
  150 |         const option = page.locator(selector).first();
  151 |         if (await option.isVisible({ timeout: 2000 })) {
  152 |           console.log(`  → 找到选项: ${selector}`);
  153 |           await option.click();
  154 |           await page.waitForTimeout(3000);
  155 |           break;
  156 |         }
  157 |       } catch (e) {
  158 |         continue;
  159 |       }
  160 |     }
  161 |     
  162 |     console.log(`📍 点击后URL: ${page.url()}\n`);
  163 |     
  164 |     // 截图：会员购买记录页面（完整）
  165 |     await page.screenshot({ 
  166 |       path: 'tests/prod-member-screenshots/05-PURCHASE-HISTORY-FULL.png',
  167 |       fullPage: true
  168 |     });
  169 |     console.log('✅ 截图 5: 会员购买记录完整页面 ⭐⭐⭐⭐\n');
  170 |     
  171 |     // 等待购买记录表格加载
  172 |     console.log('步骤 9: 等待购买记录表格加载');
  173 |     await page.waitForSelector('.ant-table', { timeout: 10000 });
  174 |     
  175 |     // 截图：购买记录表格
  176 |     const purchaseTable = page.locator('.ant-table').first();
  177 |     await purchaseTable.screenshot({
  178 |       path: 'tests/prod-member-screenshots/06-purchase-table.png'
  179 |     });
  180 |     console.log('✅ 截图 6: 购买记录表格 ⭐⭐\n');
  181 |     
  182 |     // 查找商品Tag
  183 |     console.log('步骤 10: 查找商品 ProductItemTag');
  184 |     const productTags = page.locator('.ant-tag');
  185 |     const tagCount = await productTags.count();
  186 |     console.log(`  → 找到 ${tagCount} 个商品标签\n`);
  187 |     
  188 |     if (tagCount > 0) {
  189 |       // 滚动到第一个商品Tag
  190 |       await productTags.first().scrollIntoViewIfNeeded();
  191 |       await page.waitForTimeout(500);
  192 |       
  193 |       // 截图：商品列（重点！！！）
  194 |       const productColumn = page.locator('td:has(.ant-tag)').first();
  195 |       if (await productColumn.isVisible()) {
  196 |         await productColumn.screenshot({
  197 |           path: 'tests/prod-member-screenshots/07-PRODUCT-DISPLAY-DETAIL.png'
  198 |         });
  199 |         console.log('✅ 截图 7: 商品展示详细（ProductItemTag） ⭐⭐⭐⭐⭐\n');
  200 |       }
  201 |       
  202 |       // 截图：购买记录行
  203 |       const purchaseRow = page.locator('.ant-table-tbody tr:has(.ant-tag)').first();
  204 |       await purchaseRow.screenshot({
  205 |         path: 'tests/prod-member-screenshots/08-purchase-row-with-product.png'
  206 |       });
  207 |       console.log('✅ 截图 8: 包含商品的购买记录行 ⭐⭐\n');
```