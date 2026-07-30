#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const controllerSource = fs.readFileSync(
  path.join(ROOT, 'assets/js/market-base-update-controller-v322.js'),
  'utf8'
);
const indexSource = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const now = 2_000_000_000_000;
const sixHours = 6 * 60 * 60 * 1000;
const radioGrace = 12 * 60 * 60 * 1000;

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

class FixedDate extends Date {
  static now() { return now; }
}

function controllerRuntime({
  pageUrl = 'https://example.test/market-base/news.html',
  lastActive = now - sixHours - 1,
  radioState = null,
  offlineState = null
} = {}) {
  const parsed = new URL(pageUrl);
  const listeners = new Map();
  const documentListeners = new Map();
  const replaced = [];
  const localStorage = new StorageMock({
    market_base_last_active_at_v1: String(lastActive),
    ...(radioState
      ? { market_base_radio_state_v1: JSON.stringify(radioState) }
      : {}),
    ...(offlineState
      ? { market_base_offline_mode_v1: JSON.stringify(offlineState) }
      : {})
  });
  const document = {
    currentScript: {
      src: 'https://example.test/market-base/assets/js/market-base-update-controller-v322.js?v=20260730-v324'
    },
    readyState: 'loading',
    hidden: false,
    documentElement: { dataset: {} },
    body: { appendChild() {} },
    addEventListener(type, handler) { documentListeners.set(type, handler); },
    querySelector(selector) {
      if (selector === 'meta[name="market-base-site-build"]') {
        return {
          content: 'MARKET_BASE_V324_OFFLINE_MUSIC_PRECISE_NUMBERS_20260730'
        };
      }
      return null;
    },
    querySelectorAll() { return []; },
    getElementById() { return null; },
    createElement() {
      return {
        dataset: {},
        style: {},
        setAttribute() {},
        removeAttribute() {}
      };
    }
  };
  const location = {
    href: parsed.href,
    protocol: parsed.protocol,
    pathname: parsed.pathname,
    search: parsed.search,
    replace(url) { replaced.push(String(url)); }
  };
  const runtime = {
    URL,
    Date: FixedDate,
    Math,
    Object,
    Array,
    Promise,
    Set,
    Map,
    console,
    document,
    location,
    navigator: {},
    localStorage,
    sessionStorage: new StorageMock(),
    async fetch() {
      return {
        ok: true,
        status: 200,
        async text() {
          return 'MARKET_BASE_V324_OFFLINE_MUSIC_PRECISE_NUMBERS_20260730';
        }
      };
    },
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    addEventListener(type, handler) { listeners.set(type, handler); }
  };
  runtime.window = runtime;
  vm.createContext(runtime);
  vm.runInContext(controllerSource, runtime, {
    filename: 'market-base-update-controller-v322.js'
  });
  documentListeners.get('DOMContentLoaded')();
  return { runtime, replaced, localStorage, listeners, documentListeners };
}

{
  const test = controllerRuntime();
  assert.equal(test.replaced.length, 1, 'an idle subpage must return to the main page');
  const target = new URL(test.replaced[0]);
  assert.equal(target.pathname, '/market-base/index.html');
  assert.equal(target.searchParams.get('from'), 'idle');
}

{
  const test = controllerRuntime({
    pageUrl: 'https://example.test/market-base/index.html?view=learn'
  });
  assert.equal(test.replaced.length, 1, 'an idle restored main-page view must reopen the main entry');
  const target = new URL(test.replaced[0]);
  assert.equal(target.pathname, '/market-base/index.html');
  assert.equal(target.searchParams.get('from'), 'idle');
  assert.equal(target.searchParams.get('view'), null);
}

{
  const test = controllerRuntime({
    radioState: {
      playing: true,
      updatedAt: now - 179_000,
      stationName: 'WNYC'
    }
  });
  assert.deepEqual(test.replaced, [], 'fresh playing-radio state must suppress the idle return');
}

{
  const test = controllerRuntime({
    radioState: {
      playing: true,
      updatedAt: now - radioGrace - 1,
      stationName: 'WNYC'
    }
  });
  assert.equal(test.replaced.length, 1, 'stale radio state must not suppress idle return forever');
}

{
  const test = controllerRuntime({
    pageUrl: 'https://example.test/market-base/world-radio/player.html?id=wnyc'
  });
  assert.deepEqual(test.replaced, [], 'the radio player itself must never be redirected for inactivity');
}

{
  const test = controllerRuntime({
    offlineState: { enabled: true, pendingCleanup: false, phase: 'complete' }
  });
  assert.deepEqual(test.replaced, [],
    'offline mode must keep the last page instead of forcing the splash/main page');
}

{
  const test = controllerRuntime({ lastActive: now });
  assert.deepEqual(test.replaced, []);
  test.localStorage.setItem('market_base_last_active_at_v1', String(now - sixHours - 1));
  test.listeners.get('pageshow')();
  assert.equal(test.replaced.length, 1, 'a page restored from browser memory must recheck inactivity');
}

const splashMatch = indexSource.match(
  /<script>\s*(try\{\s*const splashKey='market_base_splash_seen_v273';[\s\S]*?)<\/script>/
);
assert.ok(splashMatch, 'main-page splash decision script is missing');

function splashRuntime({
  pageUrl = 'https://example.test/market-base/index.html',
  lastActive = now - sixHours - 1,
  radioState = null,
  offlineState = null,
  splashSeen = '1'
} = {}) {
  const parsed = new URL(pageUrl);
  const localStorage = new StorageMock({
    market_base_last_active_at_v1: String(lastActive),
    ...(radioState
      ? { market_base_radio_state_v1: JSON.stringify(radioState) }
      : {}),
    ...(offlineState
      ? { market_base_offline_mode_v1: JSON.stringify(offlineState) }
      : {})
  });
  const sessionStorage = new StorageMock(
    splashSeen ? { market_base_splash_seen_v273: splashSeen } : {}
  );
  const classes = new Set();
  const replaced = [];
  const location = {
    href: parsed.href,
    search: parsed.search,
    pathname: parsed.pathname,
    hash: parsed.hash
  };
  const runtime = {
    URL,
    URLSearchParams,
    Date: FixedDate,
    JSON,
    location,
    history: {
      replaceState(_state, _title, url) { replaced.push(String(url)); }
    },
    localStorage,
    sessionStorage,
    document: {
      documentElement: {
        classList: { add(name) { classes.add(name); } },
        dataset: {}
      }
    }
  };
  vm.createContext(runtime);
  vm.runInContext(splashMatch[1], runtime, { filename: 'index-splash-inline.js' });
  return { runtime, localStorage, sessionStorage, classes, replaced };
}

{
  const test = splashRuntime();
  assert.equal(test.runtime.document.documentElement.dataset.marketBaseIdleEntry, '1');
  assert.ok(!test.classes.has('mb-splash-skip'), 'idle entry must show the splash');
  assert.deepEqual(test.replaced, ['/market-base/index.html']);
}

{
  const test = splashRuntime({
    pageUrl: 'https://example.test/market-base/index.html?from=idle',
    radioState: {
      playing: true,
      updatedAt: now - 5_000,
      stationName: 'WNYC'
    }
  });
  assert.equal(test.runtime.document.documentElement.dataset.marketBaseIdleEntry, '0');
  assert.ok(test.classes.has('mb-splash-skip'),
    'active radio must suppress even an already queued idle splash');
}

{
  const test = splashRuntime({
    offlineState: { enabled: true, pendingCleanup: false, phase: 'complete' }
  });
  assert.equal(test.runtime.document.documentElement.dataset.marketBaseIdleEntry, '0');
  assert.ok(test.classes.has('mb-splash-skip'),
    'offline mode must skip the splash even after a long idle period');
}

console.log('PASS — V324 inactivity, main-page splash, and radio exception checks');
