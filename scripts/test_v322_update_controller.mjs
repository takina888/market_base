#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SOURCE = fs.readFileSync(
  path.join(ROOT, 'assets/js/market-base-update-controller-v322.js'),
  'utf8'
);
const BUILD_ID = 'MARKET_BASE_V322_GLOBAL_UPDATE_JOURNEY_STABILITY_20260730';

class StorageMock {
  constructor(values = {}) {
    this.values = new Map(Object.entries(values));
  }
  get length() { return this.values.size; }
  key(index) { return Array.from(this.values.keys())[index] ?? null; }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(String(key), String(value)); }
  removeItem(key) { this.values.delete(String(key)); }
}

function makeRuntime({
  remoteVersion = BUILD_ID,
  pageUrl = 'https://example.test/market-base/tools/page.html?view=learn',
  scriptUrl = 'https://example.test/market-base/assets/js/market-base-update-controller-v322.js?v=20260730-v322',
  legacyMeta = 'MARKET_BASE_OLD_PAGE_BUILD',
  siteMeta = BUILD_ID,
  withServiceWorker = true
} = {}) {
  const replaced = [];
  const deletedCaches = [];
  const fetches = [];
  const localStorage = new StorageMock({
    unrelated: 'keep',
    'mbJourneyImage:old': 'remove',
    market_base_photo_registry_cache_v1: 'remove'
  });
  const sessionStorage = new StorageMock();
  const serviceWorkerCalls = { register: [], rootUpdates: 0, nestedUpdates: 0 };
  const location = {
    href: pageUrl,
    protocol: new URL(pageUrl).protocol,
    replace(url) { replaced.push(url); }
  };
  const document = {
    currentScript: { src: scriptUrl },
    readyState: 'loading',
    documentElement: { dataset: {} },
    body: { appendChild() {} },
    addEventListener() {},
    querySelector(selector) {
      if (selector === 'meta[name="market-base-site-build"]' && siteMeta) {
        return { content: siteMeta };
      }
      if (selector === 'meta[name="market-base-build"]' && legacyMeta) {
        return { content: legacyMeta };
      }
      return null;
    },
    querySelectorAll() { return []; },
    getElementById() { return null; },
    createElement() {
      return {
        style: {},
        setAttribute() {},
        removeAttribute() {},
        dataset: {}
      };
    }
  };
  const navigator = {};
  if (withServiceWorker) {
    const rootRegistration = {
      scope: 'https://example.test/market-base/',
      active: null,
      waiting: null,
      installing: null,
      async update() { serviceWorkerCalls.rootUpdates += 1; },
      addEventListener() {},
      removeEventListener() {}
    };
    const nestedRegistration = {
      scope: 'https://example.test/market-base/work-basics/',
      active: {
        state: 'activated',
        scriptURL: 'https://example.test/market-base/work-basics/sw.js'
      },
      waiting: null,
      installing: null,
      async update() { serviceWorkerCalls.nestedUpdates += 1; },
      addEventListener() {},
      removeEventListener() {}
    };
    navigator.serviceWorker = {
      async register(url, options) {
        serviceWorkerCalls.register.push({ url: String(url), options });
        rootRegistration.active = {
          state: 'activated',
          scriptURL: String(url),
          postMessage() {}
        };
        return rootRegistration;
      },
      async getRegistrations() { return [rootRegistration, nestedRegistration]; },
      addEventListener() {},
      removeEventListener() {}
    };
  }
  const runtime = {
    URL,
    Date,
    Math,
    Object,
    Array,
    Promise,
    Set,
    Map,
    console,
    document,
    location,
    navigator,
    localStorage,
    sessionStorage,
    caches: {
      async keys() { return ['market-base-old-a', 'other-site-cache', 'market-base-old-b']; },
      async delete(key) { deletedCaches.push(key); return true; }
    },
    async fetch(url, options) {
      fetches.push({ url: String(url), options });
      return {
        ok: true,
        status: 200,
        async text() { return remoteVersion; }
      };
    },
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    addEventListener() {}
  };
  runtime.window = runtime;
  vm.createContext(runtime);
  vm.runInContext(SOURCE, runtime, { filename: 'market-base-update-controller-v322.js' });
  return {
    runtime,
    replaced,
    deletedCaches,
    fetches,
    localStorage,
    sessionStorage,
    serviceWorkerCalls
  };
}

{
  const test = makeRuntime();
  const changed = await test.runtime.MarketBaseUpdate.checkOnOpen();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(changed, false, 'same V322 build must not auto-reload');
  assert.deepEqual(test.replaced, [], 'legacy page meta must not trigger a false update');
  assert.deepEqual(test.deletedCaches, [], 'same build must not clear caches');
  assert.equal(
    test.runtime.MarketBaseUpdate.root,
    'https://example.test/market-base/',
    'site root must be derived correctly on nested pages'
  );
  assert.equal(test.fetches.length, 1);
  assert.equal(test.fetches[0].options.cache, 'no-store');
  assert.equal(test.fetches[0].options.headers['Cache-Control'], 'no-cache');
  assert.equal(test.serviceWorkerCalls.register.length, 1,
    'same-build opens must still reconcile the root service worker');
  const registration = test.serviceWorkerCalls.register[0];
  assert.equal(new URL(registration.url).searchParams.get('v'), BUILD_ID);
  assert.equal(registration.options.updateViaCache, 'none');
  assert.equal(test.serviceWorkerCalls.rootUpdates, 1,
    'same-build opens must explicitly check the root worker script');
  assert.equal(test.serviceWorkerCalls.nestedUpdates, 1,
    'same-build opens must reconcile legacy nested registrations');
}

{
  const test = makeRuntime({ siteMeta: '' });
  const changed = await test.runtime.MarketBaseUpdate.checkOnOpen();
  assert.equal(changed, true, 'a cached legacy page without the V322 site meta must migrate');
  assert.equal(test.replaced.length, 1, 'legacy page migration must reload once');
  assert.equal(new URL(test.replaced[0]).searchParams.get('v'), BUILD_ID);
}

{
  const nextBuild = 'MARKET_BASE_V323_TEST_BUILD';
  const test = makeRuntime({ remoteVersion: nextBuild });
  const changed = await test.runtime.MarketBaseUpdate.checkOnOpen();
  assert.equal(changed, true, 'a new remote build must auto-refresh');
  assert.deepEqual(
    test.deletedCaches.sort(),
    ['market-base-old-a', 'market-base-old-b'],
    'auto-refresh must delete every MARKET BASE cache and preserve unrelated caches'
  );
  assert.equal(test.localStorage.getItem('unrelated'), 'keep');
  assert.equal(test.localStorage.getItem('mbJourneyImage:old'), null);
  assert.equal(test.localStorage.getItem('market_base_photo_registry_cache_v1'), null);
  assert.equal(test.replaced.length, 1);
  const reload = new URL(test.replaced[0]);
  assert.equal(reload.searchParams.get('view'), 'learn', 'existing page state must be preserved');
  assert.equal(reload.searchParams.get('v'), nextBuild);
  assert.ok(reload.searchParams.get('autoRefresh'));
  assert.equal(test.sessionStorage.getItem('market_base_auto_refresh_target'), nextBuild);
  assert.equal(
    new URL(test.serviceWorkerCalls.register[0].url).searchParams.get('v'),
    nextBuild,
    'new builds must be registered with the desired worker script URL'
  );
}

{
  const test = makeRuntime();
  const changed = await test.runtime.MarketBaseUpdate.refresh({ broadcast: false });
  assert.equal(changed, true, 'manual update must refresh even when the build is unchanged');
  assert.equal(test.replaced.length, 1);
  const reload = new URL(test.replaced[0]);
  assert.ok(reload.searchParams.get('refresh'));
  assert.equal(reload.searchParams.get('autoRefresh'), null);
}

console.log('PASS — V322 update controller runtime checks');
console.log('Same-build open, new-build auto-refresh, cache scope, nested root, and manual refresh are valid.');
