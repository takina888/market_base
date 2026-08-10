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
  for (const label of ['なぜ大事？', 'わかりやすく説明', '見積前に顧客へ確認すること', 'ここまで決まれば次へ']) {
    if (!firstBody.includes(label)) throw new Error(`card block missing: ${label}`);
  }

  await page.locator('[data-qa-stage="judge"]').click();
  const judgeCount = await page.locator('#qa-list > .ulce-qa').count();
  if (judgeCount !== 9) throw new Error(`judge count: ${judgeCount}`);

  await page.locator('[data-qa-stage="expert"]').click();
  const expertCount = await page.locator('#qa-list > .ulce-qa').count();
  if (expertCount !== 303) throw new Error(`expert count: ${expertCount}`);

  // Return to the concise first view before taking the visual QA image.
  await page.locator('[data-qa-stage="first"]').click();
  await page.locator('#qa-list > .ulce-qa').first().locator('summary').click();

  const size = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  if (size.width > size.viewport + 1) throw new Error(`horizontal overflow: ${JSON.stringify(size)}`);
  if (errors.length) throw new Error(`page errors: ${errors.join(' | ')}`);

  await page.screenshot({ path: screenshot, fullPage: false });
  await page.close();
  return { viewport, featuredCount, judgeCount, expertCount, horizontalOverflow: false };
}

const results = [];
results.push(await run({ width: 390, height: 844 }, '/tmp/market-base-v33311-ul-qa-mobile.png'));
results.push(await run({ width: 1280, height: 900 }, '/tmp/market-base-v33311-ul-qa-pc.png'));
await browser.close();
console.log(JSON.stringify({ result: 'PASS', results }, null, 2));
