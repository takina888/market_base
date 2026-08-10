import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

execFileSync(process.execPath, [path.join(root, 'scripts/build_offline_manifest_v335.mjs')], {
  cwd: root,
  stdio: 'pipe'
});

const context = { self: {} };
vm.runInNewContext(read('assets/js/market-base-offline-manifest-v335.js'), context);
const manifest = context.self.MARKET_BASE_OFFLINE_MANIFEST;
const textAssets = Array.from(manifest.textAssets || []);
const currentApp = read('index.html').match(
  /assets\/js\/(app-v273-country-profile-r28-refresh-route-header-r\d+\.js)(?:\?[^"']*)?/
)?.[1];
assert(currentApp, 'index.html current app reference was not found');

assert.equal(
  manifest.version,
  'MARKET_BASE_OFFLINE_MANIFEST_V333_18_CACHE_RADIO_NAVIGATION_STABILITY_20260810'
);
assert.equal(manifest.buildId, 'MARKET_BASE_V333_18_CACHE_RADIO_NAVIGATION_STABILITY_20260810');
assert.equal(manifest.assetVersion, '20260810-v333-18-cache-radio-navigation-stability');
assert.equal(new Set(textAssets).size, textAssets.length, 'manifest paths must be unique');

const required = [
  './index.html',
  './offline.html',
  './settings/index.html',
  `./assets/js/${currentApp}`,
  './assets/js/market-base-build-v335.js',
  './assets/js/market-base-runtime-v335.js',
  './assets/js/market-base-update-controller-v335.js',
  './assets/js/market-base-radio-dock-v333-16.js',
  './assets/css/market-base-radio-dock-v333-16.css',
  './assets/css/market-base-dual-dock-v331.css',
  './assets/js/market-base-tool-menu-v333.js',
  './assets/js/market-base-offline-manifest-v335.js',
  './settings/assets/offline-settings-v335.js',
  './embedded-data.js',
  './embedded-cross-db-search-index-v273-db-title-r27.js',
  './embedded-country-profile-data-v273-r28.js',
  './data/country-distinctive-facts-v333-15.js',
  './data/country-local-rules.js',
  './data/world-history-today-v028.js',
  './data/market_base_entities_basic_stats_full196_rc.json',
  './flight-kitchen-v273-db-title-r27.html',
  './rail-food-kitchen-v273-db-title-r27.html'
];
for (const asset of required) {
  assert(textAssets.includes(asset), `current/user-value asset missing: ${asset}`);
}
assert.deepEqual(
  textAssets.filter(asset => /app-v273-country-profile-r28-refresh-route-header-r\d+\.js$/.test(asset)),
  [`./assets/js/${currentApp}`],
  'only the app revision referenced by index.html may enter the offline snapshot'
);

const forbidden = [
  /^\.\/assets\/js\/app-v273-country-profile-r28-refresh-route-header-r(?:95|96)\.js$/,
  /^\.\/assets\/js\/market-base-build(?:-v334)?\.js$/,
  /^\.\/assets\/js\/market-base-runtime-(?:r11348|v334)\.js$/,
  /^\.\/assets\/js\/market-base-update-controller-v(?:322|331|332|333|334)\.js$/,
  /^\.\/assets\/js\/market-base-radio-dock-v(?:323|330|331|332)\.js$/,
  /^\.\/assets\/css\/market-base-radio-dock-v323\.css$/,
  /^\.\/assets\/js\/market-base-tool-dock-/,
  /^\.\/assets\/css\/market-base-dual-dock-v(?:330|332)\.css$/,
  /^\.\/assets\/js\/market-base-offline-manifest-v(?:324|334)\.js$/,
  /^\.\/settings\/assets\/offline-settings(?:-v334)?\.js$/,
  /^\.\/(?:HANDOFF|OVERWRITE|RELEASE|CHANGELOG|CHECKSUM|SHA256|#U)/i
];
for (const asset of textAssets) {
  assert(!forbidden.some(pattern => pattern.test(asset)), `obsolete asset retained: ${asset}`);
  const filename = path.join(root, asset.replace(/^\.\//, ''));
  assert(fs.existsSync(filename), `manifest path does not exist: ${asset}`);
}

assert(
  textAssets.filter(asset => asset.startsWith('./data/')).length >= 55,
  'user-value data set was unexpectedly reduced'
);
assert(
  textAssets.filter(asset => asset.endsWith('.html')).length >= 35,
  'user-facing pages were unexpectedly reduced'
);

const offlineSettings = read('settings/assets/offline-settings-v335.js');
assert(offlineSettings.includes('MARKET_BASE_V333_18_CACHE_RADIO_NAVIGATION_STABILITY_20260810'));
assert(offlineSettings.includes("url.searchParams.set('mb-offline-save', '1')"));
assert.equal(
  (offlineSettings.match(/fetch\(offlineSaveFetchUrl\(url\)/g) || []).length,
  2,
  'static assets and same-origin images must both mark offline-save fetches'
);

for (const page of [
  'flight-kitchen-v273-db-title-r27.html',
  'rail-food-kitchen-v273-db-title-r27.html'
]) {
  const source = read(page);
  for (const unsafe of [
    /\.unregister\s*\(/,
    /getRegistrations\s*\(/,
    /caches\.keys\s*\(/,
    /caches\.delete\s*\(/,
    /cache\.delete\s*\(/
  ]) {
    assert(!unsafe.test(source), `${page} still contains destructive refresh fallback: ${unsafe}`);
  }
  assert(source.includes('window.MarketBaseUpdate?.refresh'));
  assert(source.includes('location.reload()'));
}

let textBytes = 0;
for (const asset of textAssets) {
  textBytes += fs.statSync(path.join(root, asset.replace(/^\.\//, ''))).size;
}

console.log(JSON.stringify({
  ok: true,
  manifestVersion: manifest.version,
  textAssets: textAssets.length,
  textBytes,
  dataAssets: textAssets.filter(asset => asset.startsWith('./data/')).length,
  htmlPages: textAssets.filter(asset => asset.endsWith('.html')).length,
  offlineSaveMarker: 'mb-offline-save=1',
  destructiveFallbacks: 0
}, null, 2));
