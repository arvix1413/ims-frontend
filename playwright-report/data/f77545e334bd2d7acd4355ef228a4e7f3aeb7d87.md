# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: return-order-test.spec.ts >> 退货订单功能 E2E 测试 - 生产环境 >> 测试4: 添加多个商品行不崩溃
- Location: tests/return-order-test.spec.ts:137:7

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: locator.fill: Test timeout of 120000ms exceeded.
Call log:
  - waiting for locator('.ant-select-auto-complete input, .ant-autocomplete input').nth(2)

```

# Page snapshot

```yaml
- 'heading "Application error: a client-side exception has occurred while loading 119.28.104.20 (see the browser console for more information)." [level=2] [ref=e4]'
```

# Test source

```ts
  66  |     await addProductButton.click();
  67  |     
  68  |     // 等待输入框出现
  69  |     await page.waitForSelector('.ant-select-auto-complete input, .ant-autocomplete input', { timeout: 5000 });
  70  |     
  71  |     // 获取商品代码输入框
  72  |     const codeInput = page.locator('.ant-select-auto-complete input, .ant-autocomplete input').first();
  73  |     
  74  |     // 测试输入不同的内容
  75  |     const testInputs = ['A', 'ABC', '123', 'TEST', 'あ', '测试'];
  76  |     
  77  |     for (const input of testInputs) {
  78  |       console.log(`  测试输入: "${input}"`);
  79  |       
  80  |       // 清空并输入
  81  |       await codeInput.clear();
  82  |       await codeInput.fill(input);
  83  |       
  84  |       // 等待一下让 debounce 触发
  85  |       await page.waitForTimeout(500);
  86  |       
  87  |       // 检查页面是否仍然正常（没有崩溃）
  88  |       const drawerStillVisible = await page.locator('.ant-drawer').isVisible();
  89  |       expect(drawerStillVisible).toBe(true);
  90  |       
  91  |       // 检查是否有错误边界显示
  92  |       const errorBoundary = page.locator('text=组件加载出错').or(page.locator('text=Error'));
  93  |       const hasError = await errorBoundary.isVisible().catch(() => false);
  94  |       expect(hasError).toBe(false);
  95  |     }
  96  |     
  97  |     console.log('✅ 测试通过：输入各种字符都不崩溃');
  98  |   });
  99  | 
  100 |   test('测试3: 快速连续输入不崩溃', async ({ page }) => {
  101 |     console.log('开始测试：快速连续输入');
  102 |     
  103 |     // 导航到销售订单页面
  104 |     await page.goto(`${PROD_URL}?page=billManagement`);
  105 |     await page.waitForLoadState('networkidle');
  106 |     
  107 |     // 打开退货订单抽屉
  108 |     const returnOrderButton = page.getByRole('button', { name: /Return Order|退货订单/ }).first();
  109 |     await returnOrderButton.click();
  110 |     await page.waitForSelector('.ant-drawer', { timeout: 10000 });
  111 |     
  112 |     // 添加商品
  113 |     const addProductButton = page.getByText('添加商品').or(page.getByText('Add Product'));
  114 |     await addProductButton.click();
  115 |     
  116 |     // 获取输入框
  117 |     const codeInput = page.locator('.ant-select-auto-complete input, .ant-autocomplete input').first();
  118 |     
  119 |     // 快速输入多个字符
  120 |     await codeInput.type('ABCDEFGHIJK', { delay: 50 });
  121 |     
  122 |     // 等待一下
  123 |     await page.waitForTimeout(1000);
  124 |     
  125 |     // 验证页面没有崩溃
  126 |     const drawerStillVisible = await page.locator('.ant-drawer').isVisible();
  127 |     expect(drawerStillVisible).toBe(true);
  128 |     
  129 |     // 检查控制台错误
  130 |     const errorBoundary = page.locator('text=组件加载出错');
  131 |     const hasError = await errorBoundary.isVisible().catch(() => false);
  132 |     expect(hasError).toBe(false);
  133 |     
  134 |     console.log('✅ 测试通过：快速输入不崩溃');
  135 |   });
  136 | 
  137 |   test('测试4: 添加多个商品行不崩溃', async ({ page }) => {
  138 |     console.log('开始测试：添加多个商品行');
  139 |     
  140 |     // 导航到销售订单页面
  141 |     await page.goto(`${PROD_URL}?page=billManagement`);
  142 |     await page.waitForLoadState('networkidle');
  143 |     
  144 |     // 打开退货订单抽屉
  145 |     const returnOrderButton = page.getByRole('button', { name: /Return Order|退货订单/ }).first();
  146 |     await returnOrderButton.click();
  147 |     await page.waitForSelector('.ant-drawer', { timeout: 10000 });
  148 |     
  149 |     // 添加3个商品行
  150 |     for (let i = 0; i < 3; i++) {
  151 |       console.log(`  添加第 ${i + 1} 个商品行`);
  152 |       const addProductButton = page.getByText('添加商品').or(page.getByText('Add Product'));
  153 |       await addProductButton.click();
  154 |       await page.waitForTimeout(300);
  155 |     }
  156 |     
  157 |     // 获取所有商品代码输入框
  158 |     const codeInputs = page.locator('.ant-select-auto-complete input, .ant-autocomplete input');
  159 |     const count = await codeInputs.count();
  160 |     
  161 |     console.log(`  找到 ${count} 个输入框`);
  162 |     expect(count).toBeGreaterThanOrEqual(3);
  163 |     
  164 |     // 在每个输入框中输入内容
  165 |     for (let i = 0; i < Math.min(count, 3); i++) {
> 166 |       await codeInputs.nth(i).fill(`TEST${i + 1}`);
      |                               ^ Error: locator.fill: Test timeout of 120000ms exceeded.
  167 |       await page.waitForTimeout(200);
  168 |     }
  169 |     
  170 |     // 验证页面没有崩溃
  171 |     const drawerStillVisible = await page.locator('.ant-drawer').isVisible();
  172 |     expect(drawerStillVisible).toBe(true);
  173 |     
  174 |     console.log('✅ 测试通过：添加多个商品行不崩溃');
  175 |   });
  176 | 
  177 |   test('测试5: 选择操作员不崩溃', async ({ page }) => {
  178 |     console.log('开始测试：选择操作员');
  179 |     
  180 |     // 导航到销售订单页面
  181 |     await page.goto(`${PROD_URL}?page=billManagement`);
  182 |     await page.waitForLoadState('networkidle');
  183 |     
  184 |     // 打开退货订单抽屉
  185 |     const returnOrderButton = page.getByRole('button', { name: /Return Order|退货订单/ }).first();
  186 |     await returnOrderButton.click();
  187 |     await page.waitForSelector('.ant-drawer', { timeout: 10000 });
  188 |     
  189 |     // 查找操作员下拉框
  190 |     const operatorLabel = page.locator('text=操作员').or(page.locator('text=Operator'));
  191 |     await expect(operatorLabel).toBeVisible();
  192 |     
  193 |     // 点击操作员下拉框
  194 |     const operatorSelect = page.locator('.ant-form-item').filter({ hasText: /操作员|Operator/ }).locator('.ant-select');
  195 |     await operatorSelect.click();
  196 |     
  197 |     // 等待下拉菜单出现
  198 |     await page.waitForSelector('.ant-select-dropdown', { timeout: 5000 });
  199 |     
  200 |     // 验证下拉菜单中有选项
  201 |     const options = page.locator('.ant-select-dropdown .ant-select-item');
  202 |     const optionCount = await options.count();
  203 |     
  204 |     console.log(`  找到 ${optionCount} 个操作员选项`);
  205 |     expect(optionCount).toBeGreaterThan(0);
  206 |     
  207 |     // 选择第一个选项
  208 |     if (optionCount > 0) {
  209 |       await options.first().click();
  210 |     }
  211 |     
  212 |     // 验证页面没有崩溃
  213 |     const drawerStillVisible = await page.locator('.ant-drawer').isVisible();
  214 |     expect(drawerStillVisible).toBe(true);
  215 |     
  216 |     console.log('✅ 测试通过：选择操作员不崩溃');
  217 |   });
  218 | 
  219 |   test('测试6: 关闭抽屉正常工作', async ({ page }) => {
  220 |     console.log('开始测试：关闭抽屉');
  221 |     
  222 |     // 导航到销售订单页面
  223 |     await page.goto(`${PROD_URL}?page=billManagement`);
  224 |     await page.waitForLoadState('networkidle');
  225 |     
  226 |     // 打开退货订单抽屉
  227 |     const returnOrderButton = page.getByRole('button', { name: /Return Order|退货订单/ }).first();
  228 |     await returnOrderButton.click();
  229 |     await page.waitForSelector('.ant-drawer', { timeout: 10000 });
  230 |     
  231 |     // 点击取消按钮
  232 |     const cancelButton = page.getByText('取消').or(page.getByText('Cancel'));
  233 |     await cancelButton.click();
  234 |     
  235 |     // 验证抽屉已关闭
  236 |     await page.waitForTimeout(500);
  237 |     const drawerVisible = await page.locator('.ant-drawer').isVisible().catch(() => false);
  238 |     expect(drawerVisible).toBe(false);
  239 |     
  240 |     console.log('✅ 测试通过：关闭抽屉正常工作');
  241 |   });
  242 | });
  243 | 
```