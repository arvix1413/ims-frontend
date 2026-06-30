import { chromium } from 'playwright';

const BASE = process.env.IMS_WEB || 'http://119.28.104.20';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors = [];
  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('/customer/') && res.status() >= 400) {
      errors.push(`${res.status()} ${url}`);
    }
  });

  console.log(`Open ${BASE}/login`);
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.fill('input[type="text"], input:not([type])', 'ern').catch(() => {});
  const inputs = page.locator('input');
  const count = await inputs.count();
  if (count >= 2) {
    await inputs.nth(0).fill('ern');
    await inputs.nth(1).fill('ern');
  }
  await page.getByRole('button', { name: /登录|login/i }).click();
  await page.waitForURL(/\/(?!login)/, { timeout: 30000 }).catch(() => {});

  await page.goto(`${BASE}/?page=customerManagement`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);
  const customerTitle = await page.getByText(/客户管理|Customer Management/).count();
  console.log(customerTitle > 0 ? '✓ customer management page visible' : '✗ customer management page not found');

  await page.goto(`${BASE}/?page=billManagement`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);
  const nameCol = await page.getByText(/客户姓名|Customer Name/).count();
  const phoneCol = await page.getByText(/客户电话|Customer Phone/).count();
  console.log(nameCol > 0 && phoneCol > 0 ? '✓ receipt list customer columns' : '✗ receipt list missing customer columns');

  if (errors.length) {
    console.log('✗ customer API errors from browser:');
    errors.forEach((e) => console.log('  ', e));
    process.exitCode = 1;
  } else {
    console.log('✓ no failed /customer/ responses captured');
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
