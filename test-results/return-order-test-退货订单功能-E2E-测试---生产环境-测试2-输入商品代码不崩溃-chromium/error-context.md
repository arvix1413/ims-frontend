# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: return-order-test.spec.ts >> 退货订单功能 E2E 测试 - 生产环境 >> 测试2: 输入商品代码不崩溃
- Location: tests/return-order-test.spec.ts:52:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- 'heading "Application error: a client-side exception has occurred while loading 119.28.104.20 (see the browser console for more information)." [level=2] [ref=e4]'
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | // 生产环境配置
  4   | const PROD_URL = 'http://119.28.104.20';
  5   | const TEST_USER = {
  6   |   name: 'ern',
  7   |   password: 'ern'
  8   | };
  9   | 
  10  | test.describe('退货订单功能 E2E 测试 - 生产环境', () => {
  11  |   test.beforeEach(async ({ page }) => {
  12  |     // 设置较长的超时时间
  13  |     test.setTimeout(120000);
  14  |     
  15  |     // 访问登录页面并登录
  16  |     await page.goto(`${PROD_URL}/login`);
  17  |     await page.locator('input').first().fill(TEST_USER.name);
  18  |     await page.locator('input[type="password"]').fill(TEST_USER.password);
  19  |     await page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Login")').click();
  20  |     
  21  |     // 等待登录成功，跳转到主页
  22  |     await page.waitForURL(`${PROD_URL}/`, { timeout: 15000 });
  23  |     await page.waitForTimeout(2000);
  24  |   });
  25  | 
  26  |   test('测试1: 打开退货订单抽屉不崩溃', async ({ page }) => {
  27  |     console.log('开始测试：打开退货订单抽屉');
  28  |     
  29  |     // 导航到销售订单页面
  30  |     await page.goto(`${PROD_URL}?page=billManagement`);
  31  |     await page.waitForLoadState('networkidle');
  32  |     
  33  |     // 查找并点击"退货订单"按钮（选择第一个）
  34  |     const returnOrderButton = page.getByRole('button', { name: /Return Order|退货订单/ }).first();
  35  |     await expect(returnOrderButton).toBeVisible({ timeout: 10000 });
  36  |     await returnOrderButton.click();
  37  |     
  38  |     // 等待抽屉打开
  39  |     await page.waitForSelector('.ant-drawer', { timeout: 10000 });
  40  |     
  41  |     // 验证抽屉标题
  42  |     const drawerTitle = page.locator('.ant-drawer-title');
  43  |     await expect(drawerTitle).toContainText(/退货订单|Return Order/);
  44  |     
  45  |     // 验证表单存在
  46  |     const form = page.locator('.ant-drawer .ant-form');
  47  |     await expect(form).toBeVisible();
  48  |     
  49  |     console.log('✅ 测试通过：退货订单抽屉正常打开');
  50  |   });
  51  | 
  52  |   test('测试2: 输入商品代码不崩溃', async ({ page }) => {
  53  |     console.log('开始测试：输入商品代码');
  54  |     
  55  |     // 导航到销售订单页面
  56  |     await page.goto(`${PROD_URL}?page=billManagement`);
  57  |     await page.waitForLoadState('networkidle');
  58  |     
  59  |     // 打开退货订单抽屉
  60  |     const returnOrderButton = page.getByRole('button', { name: /Return Order|退货订单/ }).first();
  61  |     await returnOrderButton.click();
  62  |     await page.waitForSelector('.ant-drawer', { timeout: 10000 });
  63  |     
  64  |     // 点击"添加商品"按钮
  65  |     const addProductButton = page.getByText('添加商品').or(page.getByText('Add Product'));
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
> 89  |       expect(drawerStillVisible).toBe(true);
      |                                  ^ Error: expect(received).toBe(expected) // Object.is equality
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
  166 |       await codeInputs.nth(i).fill(`TEST${i + 1}`);
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
```