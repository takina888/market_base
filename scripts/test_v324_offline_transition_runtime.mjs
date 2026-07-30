#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = fs.readFileSync(
  path.join(ROOT, 'assets/js/market-base-update-controller-v322.js'),
  'utf8'
);
const BUILD_ID = 'MARKET_BASE_V324_OFFLINE_MUSIC_PRECISE_NUMBERS_20260730';
const TEXT_CACHE = 'mb-user-offline-v324-text';
const IMAGE_CACHE = 'mb-user-offline-v324-images';
const STATE_CACHE = 'mb-user-offline-v324-state';

class StorageMock {
  constructor(values = {}) { this.values = new Map(Object.entries(values)); }
  get length() { return this.values.size; }
  key(index) { return Array.from(this.values.keys())[index] ?? null; }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(String(key), String(value)); }
  removeItem(key) { this.values.delete(String(key)); }
}

function makeRuntime({ remote = BUILD_ID, fetchFails = false } = {}) {
  const events = [];
  const replacements = [];
  const localStorage = new StorageMock({
    market_base_offline_mode_v1: JSON.stringify({
      enabled: false,
      pendingCleanup: true,
      phase: 'waiting-online',
      buildId: BUILD_ID,
      savedAt: 12345,
      textSaved: 280,
      imageSaved: 12
    })
  });
  const locationUrl = new URL('https://example.test/market-base/settings/index.html');
  const document = {
    currentScript: {
      src: 'https://example.test/market-base/assets/js/market-base-update-controller-v322.js?v=20260730-v324'
    },
    readyState: 'loading',
    body: { appendChild() {} },
    documentElement: { dataset: {} },
    addEventListener() {},
    querySelector(selector) {
      if (selector === 'meta[name="market-base-site-build"]') return { content: BUILD_ID };
      return null;
    },
    querySelectorAll() { return []; },
    getElementById() { return null; },
    createElement() {
      return {
        style: {},
        dataset: {},
        setAttribute() {},
        removeAttribute() {}
      };
    }
  };
  const cacheObjects = new Map();
  const caches = {
    async keys() {
      return ['market-base-old-build', TEXT_CACHE, IMAGE_CACHE, STATE_CACHE];
    },
    async delete(name) {
      events.push(`delete:${name}`);
      cacheObjects.delete(name);
      return true;
    },
    async open(name) {
      if (!cacheObjects.has(name)) {
        cacheObjects.set(name, {
          async put(request) { events.push(`put:${name}:${String(request)}`); },
          async match() { return null; }
        });
      }
      return cacheObjects.get(name);
    }
  };
  const runtime = {
    URL,
    URLSearchParams,
    Response,
    CustomEvent: class CustomEvent {
      constructor(type, options = {}) { this.type = type; this.detail = options.detail; }
    },
    Date,
    Math,
    Object,
    Array,
    Promise,
    Set,
    Map,
    console,
    document,
    location: {
      href: locationUrl.href,
      protocol: locationUrl.protocol,
      pathname: locationUrl.pathname,
      replace(value) { replacements.push(String(value)); }
    },
    navigator: { onLine: true },
    localStorage,
    sessionStorage: new StorageMock(),
    caches,
    async fetch() {
      events.push('fetch:version');
      if (fetchFails) throw new Error('offline');
      return {
        ok: true,
        status: 200,
        async text() { return remote; }
      };
    },
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    addEventListener() {},
    dispatchEvent() {}
  };
  runtime.window = runtime;
  vm.createContext(runtime);
  vm.runInContext(SOURCE, runtime, {
    filename: 'market-base-update-controller-v322.js'
  });
  return { runtime, localStorage, events, replacements };
}

{
  const test = makeRuntime();
  assert.equal(
    await test.runtime.MarketBaseUpdate.finishPendingOnlineTransition(),
    true
  );
  const state = JSON.parse(test.localStorage.getItem('market_base_offline_mode_v1'));
  assert.equal(state.phase, 'online');
  assert.equal(state.pendingCleanup, false);
  const fetchAt = test.events.indexOf('fetch:version');
  assert.ok(fetchAt > test.events.indexOf(`delete:${STATE_CACHE}`),
    'only the sentinel must be released before the network check');
  assert.ok(test.events.lastIndexOf(`delete:${TEXT_CACHE}`) > fetchAt);
  assert.ok(test.events.lastIndexOf(`delete:${IMAGE_CACHE}`) > fetchAt);
  assert.deepEqual(test.replacements, []);
}

{
  const nextBuild = 'MARKET_BASE_V325_TEST';
  const test = makeRuntime({ remote: nextBuild });
  assert.equal(
    await test.runtime.MarketBaseUpdate.finishPendingOnlineTransition(),
    true
  );
  assert.equal(test.replacements.length, 1, 'a newer build must reload once');
  assert.equal(new URL(test.replacements[0]).searchParams.get('v'), nextBuild);
  assert.ok(!test.events.includes(`delete:${TEXT_CACHE}`),
    'text snapshot must survive until the new page build is confirmed');
  assert.ok(!test.events.includes(`delete:${IMAGE_CACHE}`),
    'photo snapshot must survive until the new page build is confirmed');
  const state = JSON.parse(test.localStorage.getItem('market_base_offline_mode_v1'));
  assert.equal(state.pendingCleanup, true);
  assert.equal(state.phase, 'updating-online');
  assert.equal(state.targetVersion, nextBuild);
}

{
  const test = makeRuntime({ fetchFails: true });
  assert.equal(
    await test.runtime.MarketBaseUpdate.finishPendingOnlineTransition(),
    false
  );
  assert.ok(!test.events.includes(`delete:${TEXT_CACHE}`));
  assert.ok(!test.events.includes(`delete:${IMAGE_CACHE}`));
  assert.ok(test.events.some(event => event.startsWith(`put:${STATE_CACHE}:`)),
    'failed update must restore the offline sentinel');
  const state = JSON.parse(test.localStorage.getItem('market_base_offline_mode_v1'));
  assert.equal(state.pendingCleanup, true);
  assert.equal(state.phase, 'waiting-online');
}

console.log('PASS — V324 offline-to-online transition keeps snapshots until update success');
