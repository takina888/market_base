#!/usr/bin/env node
import { createRequire } from 'node:module';

const require = createRequire(`${process.cwd()}/_market_base_playwright_loader.cjs`);
const { chromium } = require('playwright');

const base = process.env.MARKET_BASE_TEST_URL || 'http://127.0.0.1:8765';
const browser = await chromium.launch({ headless: true });

async function run(viewport, screenshot) {
  const page = await browser.newPage({ viewportSize: viewport });
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto(`${base}/ul-ce-learning/index.html#qa`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#view-qa.is-active');

  const featuredCount = await page.locator('#qa-list > .ulce-qa').count();
  if (featuredCount !== 8) throw new Error(`featured count: ${featuredCount}`);
  if (!(await page.locator('#qa-list').innerText()).includes('顧客から『UL対応で』')) {
    throw new Error('first customer-language question is missing');
  }

  await page.locator('#qa-list > .ulce-qa').first().locator('summary').click();
  const firstBody = await page.locator('#qa-list > .ulce-qa').first().innerText();
  for (const label of ['この質問が大切な理由', '詳しい説明', '具体例', 'よくある誤解', '次に確認すること']) {
    if (!firstBody.includes(label)) throw new Error(`card block missing: ${label}`);
  }
  for (const removed of ['実務で行うこと', 'そのまま使える文例', 'ここまで決まれば次へ']) {
    if (firstBody.includes(removed)) throw new Error(`legacy block remains: ${removed}`);
  }

  await page.locator('[data-qa-stage="judge"]').click();
  const judgeCount = await page.locator('#qa-list > .ulce-qa').count();
  if (judgeCount !== 9) throw new Error(`judge count: ${judgeCount}`);

  await page.locator('[data-qa-stage="official"]').click();
  const officialCount = await page.locator('#qa-list > .ulce-qa').count();
  if (officialCount !== 12) throw new Error(`official count: ${officialCount}`);
  const officialText = await page.locator('#qa-list').innerText();
  if (!officialText.includes('公式FAQを基に整理')) throw new Error('official badge missing');

  await page.locator('[data-qa-stage="expert"]').click();
  const expertCount = await page.locator('#qa-list > .ulce-qa').count();
  if (expertCount !== 315) throw new Error(`expert count: ${expertCount}`);

  await page.locator('[data-qa-stage="first"]').click();
  await page.locator('#qa-list > .ulce-qa').first().locator('summary').click();
  const size = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  if (size.width > size.viewport + 1) throw new Error(`horizontal overflow: ${JSON.stringify(size)}`);
  if (errors.length) throw new Error(`page errors: ${errors.join(' | ')}`);

  await page.screenshot({ path: screenshot, fullPage: false });
  await page.close();
  return { viewport, featuredCount, judgeCount, officialCount, expertCount, horizontalOverflow: false };
}

const results = [];
results.push(await run({ width: 390, height: 844 }, '/tmp/market-base-v33313-ul-qa-mobile.png'));
results.push(await run({ width: 1280, height: 900 }, '/tmp/market-base-v33313-ul-qa-pc.png'));
await browser.close();
console.log(JSON.stringify({ result: 'PASS', results }, null, 2));
