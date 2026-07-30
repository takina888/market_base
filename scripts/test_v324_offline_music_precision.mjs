#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const BUILD_ID = 'MARKET_BASE_V324_OFFLINE_MUSIC_PRECISE_NUMBERS_20260730';
const CACHE_NAMES = [
  'mb-user-offline-v324-text',
  'mb-user-offline-v324-images',
  'mb-user-offline-v324-state'
];

const index = read('index.html');
const settingsHtml = read('settings/index.html');
const settingsJs = read('settings/assets/offline-settings.js');
const controller = read('assets/js/market-base-update-controller-v322.js');
const serviceWorker = read('sw.js');
const currency = read('market-base-currency-converter-v273-r29.html');
const app = read('assets/js/app-v273-country-profile-r28-refresh-route-header-r95.js');
const manifestJson = JSON.parse(read('manifest.json'));
const buildJs = read('assets/js/market-base-build.js');

assert.equal(read('version.txt').trim(), BUILD_ID);
assert.match(buildJs, new RegExp(BUILD_ID));
assert.match(buildJs, /label: 'MARKET BASE V\.324'/);
assert.equal(manifestJson.name, 'MARKET BASE V.324');
assert.equal(manifestJson.build_id, BUILD_ID);
assert.equal(manifestJson.id, 'market-base-v322',
  'the PWA identity must remain stable for installed users');
assert.equal(manifestJson.scope, './');

assert.match(index, /aria-label="設定を開く"/);
assert.match(index, /settings\/index\.html\?v=20260730-v324/);
assert.match(index, /offlineActive\|\|radioActive\|\|sessionStorage/);
assert.doesNotMatch(
  index.match(/class="mb-global-header mb-primary-header"[\s\S]*?<\/div><\/div>/)?.[0] || '',
  />\s*196\s*</,
  'the home-header count must be replaced by the Settings gear'
);

for (const label of [
  '保存準備中',
  '文章を保存中',
  '写真を圧縮して保存中',
  '保存完了'
]) {
  assert.ok(settingsHtml.includes(label) || settingsJs.includes(label),
    `offline progress is missing: ${label}`);
}
for (const copy of [
  '写真は容量を抑えるため、オフラインでは圧縮表示になります。',
  '明日以降の写真を保存しません。',
  'オフラインモード中は、時間が経過してもスプラッシュ画面へ戻りません。'
]) {
  assert.ok(settingsHtml.includes(copy), `Settings explanation is missing: ${copy}`);
}
assert.match(settingsJs, /target\.setDate\(base\.getDate\(\) - offset\)/,
  'dated photo selection must walk backward from today');
assert.doesNotMatch(settingsJs, /target\.setDate\(base\.getDate\(\) \+ offset\)/,
  'future photos must not be selected');
assert.match(settingsJs, /X-Market-Base-Offline-Compressed/);
assert.match(settingsJs, /navigator\.storage\?\.(?:persist|estimate)/);

for (const name of CACHE_NAMES) {
  assert.ok(settingsJs.includes(name), `Settings is missing ${name}`);
  assert.ok(controller.includes(name), `update controller is missing ${name}`);
  assert.ok(serviceWorker.includes(name), `service worker is missing ${name}`);
}
assert.doesNotMatch(settingsJs, /market-base-offline-(?:text|images|state)-v1/,
  'user snapshots must not use the ordinary cache-pruning prefix');
assert.match(serviceWorker, /if\(await offlineModeIsActive\(\)\)\{[\s\S]*?return offlineFallback\(event\.request\)/,
  'offline mode must not fall through to a network refresh');
assert.match(controller, /if \(offlineModeActive\(\)\) return false;/,
  'automatic version checks must pause while offline');
assert.match(controller, /async function finishPendingOnlineTransition\(\)/);
assert.match(controller, /await clearOfflineSentinel\(\);[\s\S]*?const remote = await fetchRemoteVersion\(\)/,
  'online transition must release only the sentinel before checking the network');
assert.match(controller, /await updateServiceWorkers\(remote\);[\s\S]*?await clearOfflineDownloadCaches\(\)/,
  'download caches may be deleted only after the current build is confirmed');
assert.match(controller, /await restoreOfflineSentinel\(stored\)/,
  'a failed online transition must restore offline delivery');

const offlineManifestContext = { self: {} };
vm.createContext(offlineManifestContext);
vm.runInContext(read('assets/js/market-base-offline-manifest-v324.js'), offlineManifestContext);
const offlineManifest = offlineManifestContext.self.MARKET_BASE_OFFLINE_MANIFEST;
assert.ok(offlineManifest.textAssets.length >= 250);
assert.ok(offlineManifest.supportAssets.length >= 4);
assert.ok(offlineManifest.localPhotoAssets.length >= 1);
for (const relative of [
  ...offlineManifest.textAssets,
  ...offlineManifest.supportAssets,
  ...offlineManifest.localPhotoAssets
]) {
  const local = path.join(ROOT, relative.replace(/^\.\//, ''));
  assert.ok(fs.existsSync(local), `offline manifest points to a missing file: ${relative}`);
}
assert.match(read('world-radio/assets/world-radio-player.js'),
  /visibilitychange[\s\S]*?Do not pause when the user locks the screen or opens another app/);
assert.match(read('world-radio/player.html'),
  /別のアプリへ切り替えたり画面をロックしたりしても/);

assert.match(currency, /minimumFractionDigits:2,maximumFractionDigits:2/);
assert.match(currency, /function inputNumber\(value\)\{return Number\.isFinite\(value\)\?value\.toFixed\(2\):'0\.00'\}/);
assert.match(currency, /step="0\.01" type="number" value="1000\.00"/);
assert.match(app, /function fmtJapaneseRankingPopulation\(n\)\{[\s\S]*?toLocaleString\('ja-JP'\)[\s\S]*?人/);
assert.match(app, /if\(metric==='population'\) return `\$\{Math\.round\(n\)\.toLocaleString\('ja-JP'\)\}人`/);
assert.doesNotMatch(
  app.match(/function fmtJapaneseRankingPopulation\(n\)\{[\s\S]*?\n\}/)?.[0] || '',
  /万|億/,
  'person rankings must not abbreviate counts'
);

const stationContext = { window: {} };
vm.createContext(stationContext);
vm.runInContext(read('world-radio/assets/world-radio-stations.js'), stationContext);
const stations = stationContext.window.MarketBaseRadioStations;
assert.equal(stations.filter(station => station.category === 'english').length, 6);
assert.equal(stations.filter(station => station.category === 'music').length, 4);
assert.ok(stations.some(station => station.id === 'wnyc'));
assert.ok(stations.some(station => /hawai|ハワイ/i.test(
  `${station.name} ${station.description} ${station.place}`
)));
assert.ok(stations.some(station => /ボサノバ/.test(station.description)));
assert.ok(stations.some(station => /ポップ/.test(station.description)));
assert.ok(stations.every(station => /^https:\/\//.test(station.stream)));
assert.ok(stations.every(station => /^https:\/\//.test(station.official)));

for (const relative of [
  'world-radio/index.html',
  'world-radio/player.html',
  'world-radio/assets/world-radio-stations.js',
  'world-radio/assets/world-radio.js',
  'world-radio/assets/world-radio-player.js',
  'assets/js/market-base-radio-dock-v323.js'
]) {
  assert.doesNotMatch(read(relative), /スリープタイマー|sleep.?timer|再生タイマー/i,
    `${relative} must not contain a radio timer`);
}

for (const relative of fs.readdirSync(ROOT).filter(name => name.endsWith('.html'))) {
  assert.doesNotMatch(read(relative), /MARKET_BASE_V323_DIRECT_RADIO_SIMPLE_ROUTE_PACKING_IDLE_HOME_20260730/);
}

console.log('PASS — V324 offline mode, music radio, precise currency/person counts, and build checks');
