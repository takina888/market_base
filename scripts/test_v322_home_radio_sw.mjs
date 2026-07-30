#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const BUILD_ID = 'MARKET_BASE_V324_OFFLINE_MUSIC_PRECISE_NUMBERS_20260730';
const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');

const index = read('index.html');
const currency = read('market-base-currency-converter-v273-r29.html');
const radioIndex = read('world-radio/index.html');
const radioPlayer = read('world-radio/player.html');
const radioStationsSource = read('world-radio/assets/world-radio-stations.js');
const radioIndexJs = read('world-radio/assets/world-radio.js');
const radioPlayerJs = read('world-radio/assets/world-radio-player.js');
const radioDockJs = read('assets/js/market-base-radio-dock-v323.js');
const radioDockCss = read('assets/css/market-base-radio-dock-v323.css');
const radioCss = read('world-radio/assets/world-radio.css');
const radioPlayerCss = read('world-radio/assets/world-radio-player.css');
const updateController = read('assets/js/market-base-update-controller-v322.js');
const sw = read('sw.js');
const runtime = read('assets/js/market-base-runtime-r11348.js');
const scrollController = read('assets/js/market-base-scroll-controls-r11328.js');

assert.ok(index.includes('home-world-radio-entry-section'),
  'the World Radio card must be present on the main page');
assert.ok(index.includes('world-radio-home-card-v307.css?v=20260730-v324'),
  'the main-page World Radio card stylesheet must be loaded');
assert.ok(index.includes('world-radio/index.html?v=20260730-v324') &&
  index.includes('世界のラジオ'),
  'the main-page World Radio card must link to the radio page');

const homeStart = index.indexOf('<div id="homeViewContent"');
const homeEnd = index.indexOf('<nav aria-label="メインナビゲーション"', homeStart);
const home = index.slice(homeStart, homeEnd);
const historyMount = '<div id="historyLearningMount"></div>';
assert.equal((index.match(/id="historyLearningMount"/g) || []).length, 1,
  'the history mount must exist exactly once');
const radioCard = '<section class="home-world-radio-entry-section"';
assert.ok(home.indexOf(historyMount) < home.indexOf(radioCard),
  'World History must remain near the bottom, immediately before World Radio');
assert.ok(home.trimEnd().endsWith('</section>\n</div>'),
  'World Radio must be the final card of the main page');

assert.ok(currency.includes('world-radio/index.html?v=20260730-v324'),
  'World Radio must remain accessible from the Tools page');
assert.ok(index.includes('world-route/index.html?v=20260730-v324') &&
  index.includes('machine-container-packing/index.html?v=20260730-v324'),
  'the simplified Route and Packing pages must be enabled on the main page');

function backTarget(relative) {
  const page = new URL(`https://example.test/market-base/${relative}?from=global-search`);
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
  'school-meal-center-v273-db-title-r27.html',
  'world-route/index.html',
  'world-route.html',
  'machine-container-packing/index.html'
]) {
  const target = backTarget(file);
  assert.equal(target.pathname, '/market-base/index.html',
    `${file} BACK must point to the main page`);
  assert.equal(target.search, '', `${file} BACK must not retain another main-page view`);
}

const stationContext = { window: {} };
vm.createContext(stationContext);
vm.runInContext(radioStationsSource, stationContext, {
  filename: 'world-radio-stations.js'
});
const stations = stationContext.window.MarketBaseRadioStations;
assert.equal(stations.length, 10, 'the direct-play shortlist must contain ten stations');
assert.deepEqual(
  Array.from(stations, station => station.name),
  [
    'WNYC', 'WHYY', 'WBUR', 'KQED', 'BBC World Service', 'RNZ National',
    'KPOA 93.5 FM', 'Radio Estilo Leblon', 'LOUNGE-RADIO.COM', '181.FM The Mix'
  ]
);
assert.equal(stations[0].stream, 'https://fm939.wnyc.org/wnycfm');
assert.equal(stations.filter(station => station.category === 'english').length, 6);
assert.equal(stations.filter(station => station.category === 'music').length, 4);
for (const station of stations) {
  assert.match(station.stream, /^https:\/\//);
  assert.match(station.official, /^https:\/\//);
  assert.ok(station.country && station.city);
}

for (const [name, source] of Object.entries({
  'world-radio/index.html': radioIndex,
  'world-radio/player.html': radioPlayer,
  'world-radio/assets/world-radio-stations.js': radioStationsSource,
  'world-radio/assets/world-radio.js': radioIndexJs,
  'world-radio/assets/world-radio-player.js': radioPlayerJs,
  'world-radio/assets/world-radio.css': radioCss,
  'world-radio/assets/world-radio-player.css': radioPlayerCss,
  'assets/js/market-base-radio-dock-v323.js': radioDockJs,
  'assets/css/market-base-radio-dock-v323.css': radioDockCss
})) {
  assert.ok(!/sleep.?timer|スリープタイマー|タイマー/i.test(source),
    `${name} still contains timer UI or logic`);
}

assert.match(radioPlayer, /<audio id="radioAudio" preload="none" playsinline>/);
assert.match(radioPlayer, /MARKET BASEへ（再生を続ける）/);
assert.match(radioPlayer, /target="_blank" rel="noopener noreferrer"/);
assert.match(radioPlayer, /market-base-update-controller-v322\.js\?v=20260730-v324/);
assert.match(radioIndex, /target="_blank" rel="noopener"/);
assert.match(radioIndexJs, /target="_blank" rel="noopener"/);
assert.ok(!radioIndexJs.includes('window.open(') && !radioIndexJs.includes('location.href'),
  'station selection must use real separate-tab links');
assert.ok(!radioPlayerJs.includes('crossOrigin') && !radioPlayer.includes('crossorigin'),
  'the audio stream must not request unnecessary CORS access');
assert.match(radioPlayerJs, /new MediaMetadata/);
assert.match(radioPlayerJs, /BroadcastChannel/);
assert.match(radioPlayerJs, /market_base_radio_state_v1/);
assert.match(radioPlayerJs, /market_base_radio_command_v1/);
assert.match(radioPlayerJs, /if \(!shuttingDown && ownsState\) publishState\(\)/);
assert.match(radioPlayerJs, /window\.addEventListener\('pagehide'/);

for (const marker of [
  'market_base_radio_dock_collapsed_v1',
  'market_base_radio_dock_position_v1',
  'data-radio-command="previous"',
  'data-radio-command="toggle"',
  'data-radio-command="next"',
  'aria-controls="mbRadioDockPanel"',
  'setPointerCapture',
  'pointermove',
  'ratioFromPosition',
  'orientationchange'
]) {
  assert.ok(radioDockJs.includes(marker), `movable radio dock is missing ${marker}`);
}
assert.match(radioDockCss, /position:\s*fixed/);
assert.match(radioDockCss, /touch-action:\s*none/);
assert.match(radioDockCss, /\[data-collapsed="true"\]/);
assert.match(radioDockCss, /prefers-reduced-motion/);
assert.match(updateController, /market-base-radio-dock-v323\.js\?v=20260730-v324/);
assert.match(updateController, /RADIO_GRACE_MS = 12 \* 60 \* 60 \* 1000/);

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
assert.match(sw, /key\.startsWith\('market-base-'\)\s*&&\s*key!==CACHE_NAME/,
  'cache-clear messages must preserve the active cache');
assert.match(sw, /\.match\((?:event\.)?request,\{ignoreSearch:true\}\)/,
  'offline lookups must normalize cache-busting queries');
assert.ok(!/if\(response\.ok\)cache\.put/.test(sw),
  'service worker cache writes must be awaited');
for (const asset of [
  'world-radio/index.html',
  'world-radio/player.html',
  'world-radio/assets/world-radio-stations.js',
  'world-radio/assets/world-radio-player.js',
  'assets/css/world-radio-home-card-v307.css',
  'assets/js/market-base-radio-dock-v323.js',
  'assets/css/market-base-radio-dock-v323.css',
  'world-route/index.html',
  'world-route/world-route-data.js',
  'machine-container-packing/index.html',
  'machine-container-packing/data/machine-container-packing-data.js'
]) {
  assert.ok(sw.includes(asset), `service worker CORE is missing ${asset}`);
}
assert.ok(runtime.includes('encodeURIComponent(build.id)') &&
  runtime.includes("updateViaCache:'none'"),
  'runtime and common updater must use the same full build ID for the root worker');
assert.ok(sw.includes(`const BUILD_ID='${BUILD_ID}'`));

for (const relative of [
  'assets/js/market-base-runtime-r11348.js',
  'assets/js/market-base-update-controller-v322.js',
  'assets/js/market-base-radio-dock-v323.js',
  'sw.js',
  'world-radio/assets/world-radio-stations.js',
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

console.log('PASS — V324 home, direct radio/music, movable dock, BACK, and service-worker checks');
