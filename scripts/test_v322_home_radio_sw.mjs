#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');

const index = read('index.html');
const currency = read('market-base-currency-converter-v273-r29.html');
const radioIndex = read('world-radio/index.html');
const radioPlayer = read('world-radio/player.html');
const radioJs = read('world-radio/assets/world-radio.js');
const radioPlayerJs = read('world-radio/assets/world-radio-player.js');
const radioCss = read('world-radio/assets/world-radio.css');
const radioPlayerCss = read('world-radio/assets/world-radio-player.css');
const sw = read('sw.js');
const runtime = read('assets/js/market-base-runtime-r11348.js');
const scrollController = read('assets/js/market-base-scroll-controls-r11328.js');

assert.ok(!index.includes('home-world-radio-entry-section'),
  'the World Radio card must be removed from the main page');
assert.ok(!index.includes('world-radio-home-card-v307.css'),
  'the removed main-page card stylesheet must not be loaded');
assert.ok(!index.includes('world-radio/index.html') &&
  !index.includes('世界のラジオ'),
  'the main page must not retain a World Radio card or prefetch');

const homeStart = index.indexOf('<div id="homeViewContent"');
const homeEnd = index.indexOf('<nav aria-label="メインナビゲーション"', homeStart);
const home = index.slice(homeStart, homeEnd);
const historyMount = '<div id="historyLearningMount"></div>';
assert.equal((index.match(/id="historyLearningMount"/g) || []).length, 1,
  'the history mount must exist exactly once');
assert.ok(home.endsWith(`${historyMount}\n</div>\n`),
  'World History must be the final block of the main page');

assert.ok(currency.includes('world-radio/index.html?v=20260730-v322'),
  'World Radio must remain accessible from the Tools page');
assert.ok(
  /if\(\/\(\?:-v273-\|food-machinery-import\|rice-additive-products\)\/i\.test\(file\)\)return homeTarget\(''\)/.test(scrollController) &&
  !scrollController.includes("return homeTarget('global-search')"),
  'database BACK controls must return to the main page, not Cross Research'
);
function databaseBackTarget(file) {
  const page = new URL(`https://example.test/market-base/${file}?from=global-search`);
  const context = {
    URL,
    location: {
      href: page.href,
      pathname: page.pathname,
      hash: page.hash,
      replace() {}
    },
    document: {
      currentScript: {
        src: 'https://example.test/market-base/assets/js/market-base-scroll-controls-r11328.js'
      },
      readyState: 'loading',
      head: { appendChild() {} },
      addEventListener() {},
      querySelector() { return {}; },
      querySelectorAll() { return []; }
    }
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(scrollController, context, {
    filename: 'market-base-scroll-controls-r11328.js'
  });
  return new URL(context.MarketBaseSafeBack.target(null));
}
for (const file of [
  'cvs-vendor-v273-db-title-r27.html',
  'flight-kitchen-v273-db-title-r27.html',
  'food-machinery-import-v273-r32u.html',
  'gohan-food-manufacturers-v273-db-title-r27.html',
  'imported-food-machinery-v273-db-title-r27.html',
  'japan-food-machinery-v273-r58.html',
  'rail-food-kitchen-v273-db-title-r27.html',
  'retail-sales-v273-db-title-r27.html',
  'rice-additive-products-v273-r33.html',
  'school-meal-center-v273-db-title-r27.html'
]) {
  const target = databaseBackTarget(file);
  assert.equal(target.pathname, '/market-base/index.html',
    `${file} BACK must point to the main page`);
  assert.equal(target.search, '', `${file} BACK must not retain Cross Research`);
}

for (const [name, source] of Object.entries({
  'world-radio/index.html': radioIndex,
  'world-radio/player.html': radioPlayer,
  'world-radio/assets/world-radio.js': radioJs,
  'world-radio/assets/world-radio-player.js': radioPlayerJs,
  'world-radio/assets/world-radio.css': radioCss,
  'world-radio/assets/world-radio-player.css': radioPlayerCss
})) {
  assert.ok(!/timer|タイマー/i.test(source), `${name} still contains timer UI or logic`);
}

assert.ok(
  radioPlayer.includes('target="_blank"') &&
  radioPlayer.includes('rel="noopener noreferrer"'),
  'official broadcasts must open in an independent, opener-safe tab'
);
assert.ok(radioPlayerJs.includes("document.getElementById('openOfficial').href = station.url"),
  'the official link must receive the selected station URL');
assert.ok(!radioPlayerJs.includes('location.href = station.url') &&
  !radioPlayerJs.includes('window.open(station.url'),
  'popup rejection must never replace the same player document');
assert.ok(radioJs.includes("'marketBaseRadioPlayer'") &&
  !radioJs.includes('playerWindow.close()'),
  'the reusable radio guide window must survive MARKET BASE navigation');
assert.ok(radioIndex.includes('公式放送のタブを閉じずにMARKET BASEのタブへ切り替えてください'),
  'the cross-origin background-play limitation must be explained accurately');

const requiredLiteral = sw.match(/const REQUIRED=(\[[\s\S]*?\]);/)?.[1];
assert.ok(requiredLiteral, 'service worker REQUIRED list is missing');
const required = vm.runInNewContext(requiredLiteral);
const missingRequired = required
  .map(item => String(item).split('?')[0].replace(/^\.\//, ''))
  .filter(Boolean)
  .filter(item => !fs.existsSync(path.join(ROOT, item)));
assert.equal(missingRequired.length, 0,
  `required precache files are missing: ${missingRequired.join(', ')}`);
assert.ok(sw.includes('await Promise.all(REQUIRED.map(item=>put(item,requiredController.signal)))') &&
  sw.includes('await caches.delete(CACHE_NAME)'),
  'required shell precaching must be atomic');
assert.ok(sw.includes('Promise.allSettled(CORE.filter(item=>!required.has(item))'),
  'only optional precache entries may use allSettled');
assert.ok(
  sw.includes('requiredController.abort(),15000') &&
  sw.includes('optionalController.abort(),8000'),
  'precache fetches must have bounded waits so activation cannot hang indefinitely'
);
assert.ok(sw.includes("key.startsWith('market-base-')&&key!==CACHE_NAME"),
  'cache-clear messages must preserve the active cache');
assert.ok(sw.includes('cache.match(event.request,{ignoreSearch:true})'),
  'offline lookups must normalize cache-busting queries');
assert.ok(sw.includes('const cached=(await cache.match(event.request))||'),
  'static lookups must prefer an exact runtime-refreshed entry before query normalization');
assert.ok(!/if\(response\.ok\)cache\.put/.test(sw),
  'service worker cache writes must be awaited');
for (const asset of [
  'work-basics/index.html',
  'work-basics/assets/styles.css',
  'work-basics/assets/app.js',
  'work-basics/assets/data.js',
  'world-radio/index.html',
  'world-radio/player.html',
  'world-radio/assets/world-radio.js',
  'world-radio/assets/world-radio-player.js'
]) {
  assert.ok(sw.includes(asset), `service worker CORE is missing ${asset}`);
}
assert.ok(runtime.includes('encodeURIComponent(build.id)') &&
  runtime.includes("updateViaCache:'none'"),
  'runtime and common updater must use the same full build ID for the root worker');

for (const relative of [
  'assets/js/market-base-runtime-r11348.js',
  'assets/js/market-base-update-controller-v322.js',
  'sw.js',
  'world-radio/assets/world-radio.js',
  'world-radio/assets/world-radio-player.js',
  'scripts/test_v322_home_radio_sw.mjs'
]) {
  const result = spawnSync(process.execPath, ['--check', path.join(ROOT, relative)], {
    encoding: 'utf8'
  });
  assert.equal(result.status, 0,
    `node --check failed for ${relative}: ${(result.stderr || result.stdout).trim()}`);
}

console.log('PASS — V322 home, radio, and atomic service-worker checks');
console.log('History order, database BACK, radio changes, and offline-safe update switching are valid.');
