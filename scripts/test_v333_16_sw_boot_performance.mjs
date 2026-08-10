#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const swSource = read('sw.js');
const indexHtml = read('index.html');
const mainSource = read('assets/js/app-v273-country-profile-r28-refresh-route-header-r97.js');
const FULL_INDEX = 'embedded-cross-db-search-index-v273-db-title-r27.js';
const SUMMARY_INDEX = 'embedded-cross-db-search-summary-v333-16.js';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function response(label) {
  return {
    label,
    ok: true,
    status: 200,
    clone() { return response(`${label}:clone`); }
  };
}

class HeadersMock {
  constructor(values = {}) {
    this.values = new Map(
      Object.entries(values).map(([key, value]) => [key.toLowerCase(), String(value)])
    );
  }
  has(name) { return this.values.has(String(name).toLowerCase()); }
  get(name) { return this.values.get(String(name).toLowerCase()) ?? null; }
}

function makeRequest(url, options = {}) {
  return {
    method: options.method || 'GET',
    destination: options.destination || '',
    headers: new HeadersMock(options.headers),
    url,
    mode: options.mode || 'cors',
    cache: options.cache || 'default'
  };
}

function createServiceWorkerHarness({ exactCache = new Map() } = {}) {
  const listeners = new Map();
  const fetchCalls = [];
  const matchCalls = [];
  const putCalls = [];
  const workerLocation = new URL(
    'https://example.test/market-base/sw.js?v=20260810-v333-16-radio-lifecycle-ui-performance'
  );

  const offlineStateCache = {
    async match(request, options) {
      matchCalls.push({ cache: 'offline-state', request, options });
      return null;
    },
    put() { throw new Error('offline state cache put was not expected'); }
  };
  const coreCache = {
    async match(request, options) {
      matchCalls.push({ cache: 'core', request, options });
      if (!options && exactCache.has(request?.url || String(request))) {
        return exactCache.get(request?.url || String(request));
      }
      return null;
    },
    put(request, savedResponse) {
      const pending = deferred();
      putCalls.push({ request, response: savedResponse, pending });
      return pending.promise;
    }
  };
  const caches = {
    async open(name) {
      return name === 'mb-user-offline-v324-state' ? offlineStateCache : coreCache;
    },
    async keys() { return []; },
    async delete() { return true; }
  };
  const self = {
    location: workerLocation,
    clients: { async claim() {} },
    async skipWaiting() {},
    addEventListener(type, handler) {
      const handlers = listeners.get(type) || [];
      handlers.push(handler);
      listeners.set(type, handlers);
    }
  };
  const context = {
    self,
    caches,
    URL,
    Request,
    Response,
    AbortController,
    Promise,
    console,
    setTimeout,
    clearTimeout,
    importScripts() {},
    async fetch(request, options) {
      fetchCalls.push({ request, options });
      return response('network');
    }
  };
  vm.createContext(context);
  vm.runInContext(swSource, context, { filename: 'sw.js' });

  function dispatchFetch(request) {
    const handlers = listeners.get('fetch') || [];
    assert.equal(handlers.length, 1, 'service worker must install one fetch handler');
    let insideFetchDispatch = true;
    const event = {
      request,
      responsePromise: null,
      lifetimePromises: [],
      respondWith(promise) { this.responsePromise = Promise.resolve(promise); },
      waitUntil(promise) {
        assert.equal(
          insideFetchDispatch,
          true,
          'waitUntil must be registered synchronously during the fetch event'
        );
        this.lifetimePromises.push(Promise.resolve(promise));
      }
    };
    try {
      handlers[0](event);
    } finally {
      insideFetchDispatch = false;
    }
    return event;
  }

  return { dispatchFetch, fetchCalls, matchCalls, putCalls };
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise(resolvePromise => setImmediate(resolvePromise));
}

// Live audio and every Range request belong to the browser/network stack. The
// service worker must return before even claiming the fetch event.
{
  const harness = createServiceWorkerHarness();
  const audioEvent = harness.dispatchFetch(makeRequest(
    'https://radio.example/live.mp3',
    { destination: 'audio' }
  ));
  assert.equal(audioEvent.responsePromise, null, 'audio request must not call respondWith');
  assert.equal(audioEvent.lifetimePromises.length, 0, 'audio request must not call waitUntil');

  const rangeEvent = harness.dispatchFetch(makeRequest(
    'https://example.test/market-base/media/live.aac',
    { headers: { Range: 'bytes=100-' } }
  ));
  assert.equal(rangeEvent.responsePromise, null, 'Range request must not call respondWith');
  assert.equal(rangeEvent.lifetimePromises.length, 0, 'Range request must not call waitUntil');
  assert.equal(harness.fetchCalls.length, 0, 'bypassed requests must not be re-fetched by the worker');
}

// A versioned static asset is exact-key cache-first. A hit must not trigger a
// network request or an ignoreSearch fallback that could mix release versions.
{
  const url = 'https://example.test/market-base/assets/js/example.js?v=release-a';
  const cached = response('exact-cache');
  const harness = createServiceWorkerHarness({ exactCache: new Map([[url, cached]]) });
  const event = harness.dispatchFetch(makeRequest(url, { destination: 'script' }));
  assert.ok(event.responsePromise, 'handled static request must call respondWith');
  assert.equal(event.lifetimePromises.length, 1, 'handled fetch must register one lifetime promise');
  assert.equal(await event.responsePromise, cached);
  await Promise.all(event.lifetimePromises);
  assert.equal(harness.fetchCalls.length, 0, 'exact cache hit must avoid network fetch');
  const coreMatches = harness.matchCalls.filter(call => call.cache === 'core');
  assert.equal(coreMatches.length, 1);
  assert.equal(coreMatches[0].options, undefined, 'versioned lookup must use the exact request key');
}

// A cache miss responds as soon as the network response is available. The
// runtime cache.put remains attached to waitUntil, but cannot delay respondWith.
{
  const url = 'https://example.test/market-base/assets/js/example.js?v=release-b';
  const harness = createServiceWorkerHarness();
  const event = harness.dispatchFetch(makeRequest(url, { destination: 'script' }));
  assert.ok(event.responsePromise);
  assert.equal(event.lifetimePromises.length, 1, 'waitUntil must be registered synchronously once');

  const result = await Promise.race([
    event.responsePromise.then(value => ({ kind: 'response', value })),
    new Promise(resolvePromise => setTimeout(() => resolvePromise({ kind: 'timeout' }), 50))
  ]);
  assert.equal(result.kind, 'response', 'slow cache.put must not block the fetch response');
  assert.equal(result.value.label, 'network');
  await flushPromises();
  assert.equal(harness.fetchCalls.length, 1);
  assert.equal(harness.putCalls.length, 1, 'successful network response must be queued for caching');

  let lifetimeSettled = false;
  event.lifetimePromises[0].then(() => { lifetimeSettled = true; });
  await flushPromises();
  assert.equal(lifetimeSettled, false, 'worker lifetime must remain open for pending cache.put');
  harness.putCalls[0].pending.resolve();
  await event.lifetimePromises[0];
  assert.equal(lifetimeSettled, true);
}

assert.match(swSource, /const BUILD_ID='MARKET_BASE_V333_16_/);
assert.match(swSource, /const isLiveMedia=event\.request\.destination==='audio'/);
assert.match(swSource, /event\.request\.headers\.has\('Range'\)/);
assert.match(swSource, /if\(isLiveMedia\)return;/);
assert.match(swSource, /function cacheResponseInBackground\(backgroundTasks,cache,request,response\)/);
assert.match(swSource, /event\.waitUntil\(responseFinished\.then\(\(\)=>Promise\.all\(backgroundTasks\)\)\);/);
assert.match(swSource, /const installRequired=\[\.\.\.REQUIRED\.slice\(0,9\)\];/);

// The multi-database full search file must no longer be a parser-blocking tag.
// Only its summary is in initial HTML; r97 loads the full index on interaction.
const initialScriptSources = [...indexHtml.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
  .map(match => match[1]);
assert.ok(
  initialScriptSources.some(source => source.startsWith(SUMMARY_INDEX)),
  'main page must initially load the compact search summary'
);
assert.ok(
  !initialScriptSources.some(source => source.startsWith(FULL_INDEX)),
  'full cross-database index must not be an initial script tag'
);
const summaryPosition = initialScriptSources.findIndex(source => source.startsWith(SUMMARY_INDEX));
const appPosition = initialScriptSources.findIndex(source =>
  source.startsWith('assets/js/app-v273-country-profile-r28-refresh-route-header-r97.js')
);
assert.ok(summaryPosition >= 0 && appPosition > summaryPosition, 'summary must be available before the r97 app');
assert.match(mainSource, /const CROSS_DB_SEARCH_INDEX_PATH='embedded-cross-db-search-index-v273-db-title-r27\.js';/);
assert.match(mainSource, /function ensureCrossDbSearchIndex\(\)/);
assert.match(mainSource, /document\.createElement\('script'\)/);
assert.match(mainSource, /document\.head\.appendChild\(script\)/);
assert.match(
  mainSource,
  /input\.addEventListener\('focus',\(\)=>\{ ensureCrossDbSearchIndex\(\); \},\{once:true\}\);/,
  'full index must be requested on search interaction'
);

const requiredLiteral = swSource.match(/const REQUIRED=(\[[\s\S]*?\]);/)?.[1];
assert.ok(requiredLiteral, 'service worker REQUIRED list is missing');
const required = vm.runInNewContext(requiredLiteral);
assert.ok(
  !required.slice(0, 9).some(asset => String(asset).includes(FULL_INDEX)),
  'full search index must not enter the installation-blocking shell'
);

// Hidden primary screens must not manufacture hundreds of flag SVG nodes on
// the home-page critical path. They are rendered only when the screen opens.
const renderAllBody = mainSource.match(/function renderAll\(\)\{([\s\S]*?)\n\}/)?.[1] || '';
for (const eagerCall of [
  'renderCountries()',
  'renderRankings()',
  'renderCompare()',
  'renderSources()',
  'renderQA()'
]) {
  assert.ok(
    !renderAllBody.includes(eagerCall),
    `${eagerCall} must not run during the hidden-view home boot`
  );
}
assert.match(mainSource, /function renderPrimaryViewOnDemand\(view\)/);
assert.match(mainSource, /if\(view==='countries'\) renderCountries\(\);/);
assert.match(mainSource, /else if\(view==='rankings'\) renderRankings\(\);/);

// The three home-critical JSON payloads must settle and render before the ten
// optional domain payloads begin. This keeps slow connections interactive and
// also guarantees that a view opened during boot is rehydrated after data.
const bootStart = mainSource.indexOf('async function boot()');
const coreApply = mainSource.indexOf('applyMarketBaseDataset({', bootStart);
const optionalStart = mainSource.indexOf('const optionalResult=Promise.all([', bootStart);
assert.ok(bootStart >= 0 && coreApply > bootStart && optionalStart > coreApply,
  'optional JSON downloads must start only after the core dataset is applied');
assert.match(mainSource, /const activeView=activePrimaryView\(\);/);
assert.match(mainSource, /else if\(activeView\)\{\s*renderPrimaryViewOnDemand\(activeView\);\s*\}/);
assert.match(mainSource, /function applyOptionalMarketBaseDataset\(bundle\)/);
assert.match(mainSource, /function refreshRankingMetricOptions\(\{reset=false\}=\{\}\)/);
assert.match(
  mainSource,
  /function applyOptionalMarketBaseDataset\(bundle\)[\s\S]*?refreshRankingMetricOptions\(\);[\s\S]*?renderedPrimaryViews\.delete/,
  'optional ranking data must rebuild the metric selector before rerendering a visible ranking view'
);
assert.match(mainSource, /fetch\(scoped,\{cache:'default'\}\)/,
  'versioned JSON should be allowed to use the exact-key static cache');

const summaryBytes = fs.statSync(path.join(ROOT, SUMMARY_INDEX)).size;
const fullIndexBytes = fs.statSync(path.join(ROOT, FULL_INDEX)).size;
assert.ok(summaryBytes < 20_000, 'initial search summary must remain compact');
assert.ok(fullIndexBytes > 1_000_000, 'test fixture must represent the real heavy full index');
assert.ok(summaryBytes * 100 < fullIndexBytes,
  'initial search payload should be at least 100x smaller than the full index');

console.log('PASS — V333.16 SW/cache, staged core boot, hidden-view rendering, and lazy full-index performance');
