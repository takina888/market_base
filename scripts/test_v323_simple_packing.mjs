#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');

const html = read('machine-container-packing/index.html');
const script = read('machine-container-packing/assets/machine-container-packing.js');
const css = read('machine-container-packing/assets/machine-container-packing.css');
const dataSource = read('machine-container-packing/data/machine-container-packing-data.js');
const index = read('index.html');
const buildId = 'MARKET_BASE_V324_OFFLINE_MUSIC_PRECISE_NUMBERS_20260730';

const context = { window: {}, Object };
vm.createContext(context);
vm.runInContext(dataSource, context, {
  filename: 'machine-container-packing-data.js'
});
const data = context.window.MCP_PACKING_DATA;

assert.deepEqual(Object.keys(data).sort(), ['categories', 'qa', 'topics']);
assert.equal(data.categories.length, 6);
assert.equal(new Set(data.categories).size, 6);
assert.equal(data.qa.length, 25);
assert.equal(data.topics.length, 8);
assert.ok(data.qa.every(item =>
  data.categories.includes(item.category) &&
  item.question.length >= 8 &&
  item.answer.length >= 30
));
assert.ok(data.topics.every(item =>
  item.title && item.summary && item.points.length === 2
));

const publicSource = [html, script, dataSource].join('\n');
for (const forbidden of [
  /\bCORE-/,
  /\bSPEC-/,
  /\bSRC-/,
  /\bCASE-/,
  /\bQA-/,
  /\bCHECK-/,
  /\bTERM-/,
  /\bSTOP\b/,
  /\bRevision\b/,
  /総合ゲート/,
  /関連カードID/,
  /出典ID/,
  /学習到達点/,
  /必要証拠/
]) {
  assert.doesNotMatch(publicSource, forbidden);
}

assert.match(html, new RegExp(buildId));
assert.match(html, /id="packingSearch"/);
assert.match(html, /id="packingCategories"/);
assert.match(html, /id="packingQuestions"/);
assert.match(html, /id="packingTopics"/);
assert.match(html, /data-mbx-back="\.\.\/index\.html"/);
assert.match(html, /data-mbx-refresh/);
assert.match(html, /market-base-update-controller-v322\.js\?v=20260730-v324/);
assert.doesNotMatch(html, /role="tab"|data-tab|ケース|実務チェック|用語集/);
assert.match(script, /selectedCategory = 'すべて'/);
assert.match(script, /searchInput\.addEventListener\('search'/);
assert.match(css, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
assert.match(css, /grid-template-columns:\s*1fr/);
assert.ok(index.includes('machine-container-packing/index.html?v=20260730-v324'));
assert.doesNotMatch(
  index,
  /<article[^>]+aria-disabled="true"[^>]+id="machine-container-packing-learning"/
);
assert.ok(index.includes('id="machine-container-packing-learning"') &&
  index.includes('learn-status learn-status-open'));

for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
  const value = match[1];
  if (/^(?:https?:|#|mailto:|tel:)/.test(value)) continue;
  const local = path.resolve(
    path.join(ROOT, 'machine-container-packing'),
    value.split(/[?#]/)[0]
  );
  assert.ok(fs.existsSync(local), `missing local reference: ${value}`);
}

console.log('PASS — V324 simple machine-container packing checks');
