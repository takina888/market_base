(function (global) {
  'use strict';

  if (global.MarketBaseUpdate) return;

  const BUILD_ID = 'MARKET_BASE_V333_18_CACHE_RADIO_NAVIGATION_STABILITY_20260810';
  const ASSET_VERSION = '20260810-v333-18-cache-radio-navigation-stability';
  const LEGACY_PAGE_BUILD = 'MARKET_BASE_LEGACY_PAGE';
  const CHANNEL_NAME = 'market-base-update-v1';
  const SIGNAL_KEY = 'market_base_global_refresh_signal';
  const LAST_ACTIVE_KEY = 'market_base_last_active_at_v1';
  const LAST_VERSION_CHECK_KEY = 'market_base_last_version_check_v3';
  const UPDATE_LEASE_KEY = 'market_base_update_lease_v3';
  const RADIO_STATE_KEY = 'market_base_radio_state_v1';
  const OFFLINE_STATE_KEY = 'market_base_offline_mode_v1';
  const OFFLINE_CACHE_NAMES = [
    'mb-user-offline-v324-text',
    'mb-user-offline-v324-images',
    'mb-user-offline-v324-state'
  ];
  const INACTIVITY_MS = 6 * 60 * 60 * 1000;
  const LEGACY_RADIO_GRACE_MS = 12 * 60 * 60 * 1000;
  const SERVICE_WORKER_TIMEOUT_MS = 15000;
  const VERSION_CHECK_TTL_MS = 2 * 60 * 1000;
  const AUTO_REFRESH_STATE_KEY = 'market_base_auto_refresh_state_v2';
  const SCRIPT_URL = document.currentScript?.src || '';
  let siteRoot;
  try {
    siteRoot = SCRIPT_URL ? new URL('../../', SCRIPT_URL) : new URL('./', global.location.href);
  } catch (_) {
    siteRoot = new URL('./', global.location.href);
  }

  const state = {
    autoPromise: null,
    onlineTransitionPromise: null,
    working: false,
    hiddenAt: 0,
    sourceId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    channel: null
  };
  const radioDockUrl = new URL(
    `assets/js/market-base-radio-dock-v333-16.js?v=${ASSET_VERSION}`,
    siteRoot
  );
  const toolMenuUrl = new URL(
    `assets/js/market-base-tool-menu-v333.js?v=${ASSET_VERSION}`,
    siteRoot
  );
  const navigationUrl = new URL(
    `assets/js/market-base-navigation-v333-18.js?v=${ASSET_VERSION}`,
    siteRoot
  );

  function storageGet(areaName, key) {
    try { return global[areaName]?.getItem(key) || null; }
    catch (_) { return null; }
  }

  function storageSet(areaName, key, value) {
    try { global[areaName]?.setItem(key, value); return true; }
    catch (_) { return false; }
  }

  function storageRemove(areaName, key) {
    try { global[areaName]?.removeItem(key); }
    catch (_) {}
  }

  async function withCrossTabLock(name, task) {
    if (navigator.locks?.request) {
      return navigator.locks.request(`market-base-${name}-v3`, { mode: 'exclusive' }, task);
    }
    const now = Date.now();
    let existing = null;
    try { existing = JSON.parse(storageGet('localStorage', UPDATE_LEASE_KEY) || 'null'); } catch (_) {}
    if (existing && existing.owner !== state.sourceId && Number(existing.expiresAt || 0) > now) {
      return false;
    }
    const lease = { owner: state.sourceId, name, expiresAt: now + 30000 };
    storageSet('localStorage', UPDATE_LEASE_KEY, JSON.stringify(lease));
    let confirmed = null;
    try { confirmed = JSON.parse(storageGet('localStorage', UPDATE_LEASE_KEY) || 'null'); } catch (_) {}
    if (confirmed?.owner !== state.sourceId || confirmed?.name !== name) return false;
    try {
      return await task();
    } finally {
      let current = null;
      try { current = JSON.parse(storageGet('localStorage', UPDATE_LEASE_KEY) || 'null'); } catch (_) {}
      if (current?.owner === state.sourceId) storageRemove('localStorage', UPDATE_LEASE_KEY);
    }
  }

  function versionToken(value) {
    return String(value || '').split(/\r?\n/)[0].trim();
  }

  function readAutoRefreshState() {
    try {
      const parsed = JSON.parse(storageGet('sessionStorage', AUTO_REFRESH_STATE_KEY) || 'null');
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  function writeAutoRefreshState(remoteVersion, mode) {
    const previous = readAutoRefreshState();
    const sameAttempt = !!(
      previous &&
      previous.target === remoteVersion &&
      previous.fromBuild === currentBuildId() &&
      Date.now() - Number(previous.updatedAt || 0) < 30000
    );
    const value = {
      target: remoteVersion,
      fromBuild: currentBuildId(),
      mode,
      attempts: sameAttempt ? Number(previous.attempts || 0) + 1 : 1,
      updatedAt: Date.now()
    };
    storageSet('sessionStorage', AUTO_REFRESH_STATE_KEY, JSON.stringify(value));
    storageRemove('sessionStorage', 'market_base_auto_refresh_target');
    return value;
  }

  function clearAutoRefreshState() {
    storageRemove('sessionStorage', AUTO_REFRESH_STATE_KEY);
    storageRemove('sessionStorage', 'market_base_auto_refresh_target');
  }

  function radioIsPlaying() {
    try {
      const radio = JSON.parse(storageGet('localStorage', RADIO_STATE_KEY) || 'null');
      const now = Date.now();
      const validUntil = Number(radio?.validUntil || 0);
      const fresh = validUntil > 0
        ? validUntil > now
        : now - Number(radio?.updatedAt || 0) < LEGACY_RADIO_GRACE_MS;
      return !!(
        radio &&
        radio.playing &&
        fresh
      );
    } catch (_) {
      return false;
    }
  }

  function offlineState() {
    try {
      return JSON.parse(storageGet('localStorage', OFFLINE_STATE_KEY) || 'null') || {
        enabled: false,
        pendingCleanup: false
      };
    } catch (_) {
      return { enabled: false, pendingCleanup: false };
    }
  }

  function offlineModeActive() {
    const offline = offlineState();
    return !!(offline.enabled || offline.pendingCleanup);
  }

  function writeOfflineState(next) {
    const value = { ...offlineState(), ...next, updatedAt: Date.now() };
    storageSet('localStorage', OFFLINE_STATE_KEY, JSON.stringify(value));
    try {
      global.dispatchEvent(new CustomEvent('marketbase:offline-state-changed', {
        detail: value
      }));
    } catch (_) {}
    return value;
  }

  function isHomePage() {
    const home = new URL('index.html', siteRoot);
    return normalizedPath(global.location.pathname) === normalizedPath(home.pathname);
  }

  function isRadioPlayerPage() {
    return /\/world-radio\/player\.html$/i.test(global.location.pathname);
  }

  function isStandaloneCodePage() {
    return /\/market-base-code-tool\.html$/i.test(global.location.pathname);
  }

  function normalizedPath(pathname) {
    return String(pathname || '').replace(/\/index\.html$/i, '/');
  }

  function redirectAfterInactivity() {
    if (!/^https?:$/.test(global.location.protocol)) return false;
    if (offlineModeActive()) return false;
    if (isRadioPlayerPage()) return false;
    const lastActive = Number(storageGet('localStorage', LAST_ACTIVE_KEY) || 0);
    const idle = (
      lastActive > 0 &&
      Date.now() - lastActive >= INACTIVITY_MS &&
      !radioIsPlaying()
    );
    if (!idle) return false;
    const current = new URL(global.location.href);
    if (isHomePage() && current.searchParams.get('from') === 'idle') return false;
    const home = new URL('index.html', siteRoot);
    home.searchParams.set('from', 'idle');
    global.location.replace(home.href);
    return true;
  }

  function markActive(force = false) {
    const now = Date.now();
    const previous = Number(storageGet('localStorage', LAST_ACTIVE_KEY) || 0);
    if (!force && now - previous < 30000) return;
    storageSet('localStorage', LAST_ACTIVE_KEY, String(now));
  }

  function initActivityTracking() {
    const activity = () => markActive(false);
    const resume = () => {
      if (!redirectAfterInactivity()) markActive(true);
    };
    global.addEventListener('pointerdown', activity, { passive: true });
    global.addEventListener('keydown', activity);
    global.addEventListener('focus', resume);
    global.addEventListener('pageshow', resume);
    global.addEventListener('pagehide', () => markActive(true));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) markActive(true);
      else resume();
    });
    markActive(true);
  }

  function appendDockScript(url, dataKey) {
    if (document.querySelector(`script[${dataKey}]`)) return;
    const script = document.createElement('script');
    script.src = url.href;
    script.async = false;
    script.setAttribute(dataKey, '');
    document.body?.appendChild(script);
  }

  function loadRadioDock() {
    if (isRadioPlayerPage()) return;
    appendDockScript(radioDockUrl, 'data-mb-radio-dock');
    appendDockScript(toolMenuUrl, 'data-mb-tool-menu');
  }

  function loadNavigationEnhancements() {
    appendDockScript(navigationUrl, 'data-mb-navigation');
  }

  function currentBuildId() {
    return versionToken(BUILD_ID || LEGACY_PAGE_BUILD);
  }

  function documentBuildId() {
    const meta = document.querySelector('meta[name="market-base-build"]');
    return versionToken(meta?.getAttribute('content') || document.documentElement.dataset.marketBaseBuild || '');
  }

  function pageShellIsCurrent() {
    return documentBuildId() === currentBuildId();
  }

  function sitePath() {
    return siteRoot.pathname.endsWith('/') ? siteRoot.pathname : `${siteRoot.pathname}/`;
  }

  function isSiteRegistration(registration) {
    try {
      return new URL(registration.scope).pathname.startsWith(sitePath());
    } catch (_) {
      return false;
    }
  }

  function isUpdateControl(node) {
    const button = node?.closest?.('button');
    if (!button) return null;
    if (button.matches(
      '[data-mb-site-refresh],#cacheRefreshBtn,#globalCacheRefreshBtn,[data-view-refresh],' +
      '[data-mbu-refresh],[data-mbx-refresh],[data-mb-refresh="reload"],' +
      '#pageRefreshButton,#refreshButton,#hsRefreshButton,#flightRefreshBtn,' +
      '#reloadButton,#historyRefreshButton,#compassRefreshButton,#refresh,#resetBtn'
    )) return button;
    const label = String(button.textContent || '').replace(/\s+/g, '').trim();
    if (label !== '更新') return null;
    return button.closest('header,.mb-global-header,.mbu-header,.market-header,.topbar,.mbx-header')
      ? button
      : null;
  }

  function updateControls() {
    return Array.from(document.querySelectorAll(
      '[data-mb-site-refresh],#cacheRefreshBtn,#globalCacheRefreshBtn,[data-view-refresh],' +
      '[data-mbu-refresh],[data-mbx-refresh],[data-mb-refresh="reload"],' +
      '#pageRefreshButton,#refreshButton,#hsRefreshButton,#flightRefreshBtn,' +
      '#reloadButton,#historyRefreshButton,#compassRefreshButton,#refresh,#resetBtn'
    )).filter(button => {
      const label = String(button.textContent || '').replace(/\s+/g, '').trim();
      return label === '更新' || button.dataset.mbUpdateOriginalText;
    });
  }

  function setWorking(working) {
    state.working = working;
    updateControls().forEach(button => {
      if (working) {
        if (!button.dataset.mbUpdateOriginalText) {
          button.dataset.mbUpdateOriginalText = button.textContent || '更新';
        }
        button.disabled = true;
        button.textContent = '更新中';
        button.setAttribute('aria-busy', 'true');
      } else {
        button.disabled = false;
        button.textContent = button.dataset.mbUpdateOriginalText || '更新';
        button.removeAttribute('aria-busy');
      }
    });
  }

  function announce(message, isError) {
    let box = document.getElementById('marketBaseUpdateStatus');
    if (!box) {
      box = document.createElement('div');
      box.id = 'marketBaseUpdateStatus';
      box.setAttribute('role', 'status');
      box.setAttribute('aria-live', 'polite');
      Object.assign(box.style, {
        position: 'fixed',
        left: '50%',
        bottom: '24px',
        zIndex: '2147483647',
        maxWidth: 'min(88vw, 560px)',
        transform: 'translateX(-50%)',
        padding: '11px 16px',
        borderRadius: '12px',
        color: '#fff',
        font: '600 14px/1.5 system-ui, sans-serif',
        boxShadow: '0 8px 30px rgba(0,0,0,.24)'
      });
      document.body.appendChild(box);
    }
    box.style.background = isError ? '#8f2f2f' : '#174f87';
    box.textContent = message;
    box.hidden = false;
    global.clearTimeout(announce.timer);
    announce.timer = global.setTimeout(() => { box.hidden = true; }, isError ? 6500 : 3200);
  }

  function readVersionCheckCache() {
    try {
      const parsed = JSON.parse(storageGet('localStorage', LAST_VERSION_CHECK_KEY) || 'null');
      if (!parsed || typeof parsed !== 'object') return null;
      const version = versionToken(parsed.version);
      const checkedAt = Number(parsed.checkedAt || 0);
      return version && checkedAt ? { version, checkedAt } : null;
    } catch (_) {
      return null;
    }
  }

  async function fetchRemoteVersion(options = {}) {
    if (!/^https?:$/.test(global.location.protocol)) return currentBuildId();
    const cached = readVersionCheckCache();
    if (
      !options.force &&
      cached &&
      Date.now() - cached.checkedAt < VERSION_CHECK_TTL_MS
    ) return cached.version;
    const url = new URL('version.txt', siteRoot);
    url.searchParams.set('check', Date.now().toString());
    url.searchParams.set('mb-network-only', '1');
    const abortController = 'AbortController' in global ? new AbortController() : null;
    const timeout = global.setTimeout(() => abortController?.abort(), 2500);
    try {
      const response = await fetch(url.href, {
        cache: 'no-store',
        credentials: 'same-origin',
        headers: {
          'Cache-Control': 'no-cache',
          'X-Market-Base-Network-Only': '1'
        },
        signal: abortController?.signal
      });
      if (!response.ok) throw new Error(`version check ${response.status}`);
      const remote = versionToken(await response.text());
      if (!remote) throw new Error('empty version');
      storageSet('localStorage', LAST_VERSION_CHECK_KEY, JSON.stringify({
        version: remote,
        checkedAt: Date.now(),
        sourceId: state.sourceId
      }));
      return remote;
    } finally {
      global.clearTimeout(timeout);
    }
  }

  function workerVersion(worker) {
    try { return new URL(worker?.scriptURL || '').searchParams.get('v') || ''; }
    catch (_) { return ''; }
  }

  function workerBuildInfo(worker) {
    if (!worker || !('MessageChannel' in global)) return Promise.resolve(null);
    return withTimeout(new Promise(resolve => {
      const channel = new global.MessageChannel();
      channel.port1.onmessage = event => resolve(event.data || null);
      try {
        worker.postMessage({ type: 'GET_BUILD_INFO' }, [channel.port2]);
      } catch (_) {
        resolve(null);
      }
    }), 1500, 'service worker build handshake timed out').catch(() => null);
  }

  function workerMessageAck(worker, message, expectedType, timeoutMs = 1800) {
    if (!worker || !('MessageChannel' in global)) {
      return Promise.reject(new Error('service worker messaging unavailable'));
    }
    const requestId = message.requestId ||
      `${state.sourceId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return withTimeout(new Promise((resolve, reject) => {
      const channel = new global.MessageChannel();
      channel.port1.onmessage = event => {
        const reply = event.data || {};
        if (reply.type !== expectedType || reply.requestId !== requestId || reply.ok !== true) {
          reject(new Error(`${expectedType} rejected`));
          return;
        }
        resolve(reply);
      };
      try {
        worker.postMessage({ ...message, requestId }, [channel.port2]);
      } catch (error) {
        reject(error);
      }
    }), timeoutMs, `${expectedType} timed out`);
  }

  async function notifyOfflineModeChanged(active, generation) {
    if (!('serviceWorker' in navigator)) {
      throw new Error('service worker unavailable');
    }
    const normalizedGeneration = String(generation || '');
    const requireCurrentGeneration = () => {
      if (
        normalizedGeneration &&
        String(offlineState().generation || '') !== normalizedGeneration
      ) {
        const error = new Error('stale offline operation generation');
        error.code = 'MB_STALE_OFFLINE_GENERATION';
        throw error;
      }
    };
    requireCurrentGeneration();
    let registration = await navigator.serviceWorker.getRegistration?.(
      new URL('.', siteRoot).href
    );
    if (!registration?.active || !(await workerIsVerified(registration.active, currentBuildId()))) {
      await updateServiceWorkers(currentBuildId());
      registration = await navigator.serviceWorker.getRegistration?.(
        new URL('.', siteRoot).href
      );
    }
    requireCurrentGeneration();
    if (!registration?.active || registration.active.state !== 'activated') {
      throw new Error('active service worker unavailable');
    }
    const reply = await workerMessageAck(registration.active, {
      type: 'OFFLINE_MODE_CHANGED',
      active: !!active,
      generation: normalizedGeneration
    }, 'OFFLINE_MODE_CHANGED_ACK');
    if (
      reply.active !== !!active ||
      String(reply.generation || '') !== normalizedGeneration
    ) throw new Error('offline mode acknowledgement mismatch');
    requireCurrentGeneration();
    return reply;
  }

  async function workerIsVerified(worker, remoteVersion) {
    if (!worker || worker.state !== 'activated') return false;
    const info = await workerBuildInfo(worker);
    return !!(
      info &&
      versionToken(info.buildId) === remoteVersion &&
      info.assetVersion === ASSET_VERSION
    );
  }

  function withTimeout(promise, timeoutMs, message) {
    let timeout = 0;
    const timed = new Promise((_, reject) => {
      timeout = global.setTimeout(
        () => reject(new Error(message || 'operation timed out')),
        timeoutMs
      );
    });
    return Promise.race([Promise.resolve(promise), timed])
      .finally(() => global.clearTimeout(timeout));
  }

  function waitForTargetWorker(registration, remoteVersion) {
    return new Promise((resolve, reject) => {
      let finished = false;
      const observed = new Set();
      const finish = error => {
        if (finished) return;
        finished = true;
        global.clearTimeout(timeout);
        global.clearInterval(poll);
        registration.removeEventListener?.('updatefound', inspect);
        navigator.serviceWorker.removeEventListener?.('controllerchange', inspect);
        observed.forEach(worker => {
          worker.removeEventListener?.('statechange', inspect);
        });
        if (error) reject(error);
        else resolve(registration);
      };
      const observe = worker => {
        if (
          !worker ||
          workerVersion(worker) !== remoteVersion ||
          observed.has(worker)
        ) return;
        observed.add(worker);
        worker.addEventListener?.('statechange', inspect);
      };
      const inspect = () => {
        [registration.waiting, registration.installing].forEach(observe);
        const target = Array.from(observed)
          .find(worker => worker && workerVersion(worker) === remoteVersion);
        if (target) {
          if (target.state === 'installed') target.postMessage({ type: 'SKIP_WAITING' });
          if (target.state === 'activated') {
            finish();
            return;
          }
          if (target.state === 'redundant') {
            finish(new Error('service worker install failed'));
            return;
          }
        }
        const active = registration.active;
        if (
          active &&
          active.state === 'activated' &&
          workerVersion(active) === remoteVersion
        ) {
          finish();
        }
      };
      const timeout = global.setTimeout(
        () => finish(new Error('service worker activation timed out')),
        SERVICE_WORKER_TIMEOUT_MS
      );
      const poll = global.setInterval(inspect, 100);
      registration.addEventListener?.('updatefound', inspect);
      navigator.serviceWorker.addEventListener?.('controllerchange', inspect);
      inspect();
    });
  }

  async function updateServiceWorkersInternal(remoteVersion, options = {}) {
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(global.location.protocol)) return;
    const rootScope = sitePath();
    const swUrl = new URL('sw.js', siteRoot);
    swUrl.searchParams.set('v', remoteVersion);
    if (!options.force && typeof navigator.serviceWorker.getRegistration === 'function') {
      try {
        const existing = await navigator.serviceWorker.getRegistration(new URL('.', siteRoot).href);
        if (existing && await workerIsVerified(existing.active, remoteVersion)) return existing;
      } catch (_) {}
    }
    const rootRegistration = await navigator.serviceWorker.register(swUrl.href, {
      scope: rootScope,
      updateViaCache: 'none'
    });
    if (typeof rootRegistration.update === 'function') {
      await withTimeout(
        rootRegistration.update(),
        Math.min(7000, SERVICE_WORKER_TIMEOUT_MS),
        'service worker update check timed out'
      );
    }
    rootRegistration.waiting?.postMessage({ type: 'SKIP_WAITING' });
    rootRegistration.installing?.postMessage({ type: 'SKIP_WAITING' });
    if (
      rootRegistration.waiting ||
      rootRegistration.installing ||
      workerVersion(rootRegistration.active) !== remoteVersion ||
      !(await workerIsVerified(rootRegistration.active, remoteVersion))
    ) {
      await waitForTargetWorker(rootRegistration, remoteVersion);
    }
    if (!(await workerIsVerified(rootRegistration.active, remoteVersion))) {
      throw new Error('service worker build handshake failed');
    }

    // Legacy nested registrations are reconciled in the background. A single
    // stalled child worker must never keep the global update button busy.
    Promise.resolve(navigator.serviceWorker.getRegistrations())
      .then(registrations => registrations.filter(registration => {
        if (!isSiteRegistration(registration)) return false;
        try { return new URL(registration.scope).pathname !== rootScope; }
        catch (_) { return false; }
      }))
      .then(nestedRegistrations => {
        nestedRegistrations.forEach(registration => {
          Promise.resolve(registration.update?.())
            .then(() => {
              registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
              registration.installing?.postMessage({ type: 'SKIP_WAITING' });
            })
            .catch(() => {});
        });
      })
      .catch(() => {});
  }

  function updateServiceWorkers(remoteVersion, options = {}) {
    return withTimeout(
      updateServiceWorkersInternal(remoteVersion, options),
      SERVICE_WORKER_TIMEOUT_MS,
      'service worker update timed out'
    );
  }

  async function clearOfflineDownloadCaches() {
    if (!('caches' in global)) return;
    await Promise.all(OFFLINE_CACHE_NAMES.map(name => caches.delete(name)));
  }

  async function clearOfflineSentinel(generation) {
    if (!('caches' in global)) throw new Error('CacheStorage unavailable');
    await caches.delete(OFFLINE_CACHE_NAMES[2]);
    // Do not begin connectivity probing or content deletion until the worker
    // confirms its one-second offline memo was invalidated.
    await notifyOfflineModeChanged(false, generation);
  }

  async function restoreOfflineSentinel(stored, generation) {
    if (!('caches' in global)) throw new Error('CacheStorage unavailable');
    const cache = await caches.open(OFFLINE_CACHE_NAMES[2]);
    const request = new URL('__market_base_offline_mode__', siteRoot).href;
    await cache.put(request, new Response(JSON.stringify({
      enabled: true,
      buildId: stored.buildId || BUILD_ID,
      savedAt: stored.savedAt || null
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    }));
    await notifyOfflineModeChanged(true, generation);
  }

  async function clearClientCaches() {
    try {
      const removable = [];
      const storage = global.localStorage;
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (
          key === 'market_base_photo_registry_cache_v1' ||
          String(key || '').startsWith('mbJourneyImage:') ||
          String(key || '').startsWith('mb_rates_')
        ) removable.push(key);
      }
      removable.forEach(key => storage.removeItem(key));
    } catch (_) {
      // Storage can be unavailable in private or restricted browsing.
    }
  }

  function reloadUrl(remoteVersion, mode) {
    const url = new URL(global.location.href);
    url.searchParams.set('v', remoteVersion.replace(/[^A-Za-z0-9_-]/g, '_'));
    url.searchParams.set(mode === 'auto' ? 'autoRefresh' : 'refresh', Date.now().toString());
    url.searchParams.delete(mode === 'auto' ? 'refresh' : 'autoRefresh');
    return url.href;
  }

  async function beginManualRefreshBurst(remoteVersion) {
    if (!('serviceWorker' in navigator)) {
      throw new Error('service worker unavailable');
    }
    const registration = await navigator.serviceWorker.getRegistration?.(new URL('.', siteRoot).href);
    if (!registration?.active || !(await workerIsVerified(registration.active, remoteVersion))) {
      throw new Error('manual refresh worker verification failed');
    }
    const reply = await workerMessageAck(registration.active, {
      type: 'BEGIN_MANUAL_REFRESH'
    }, 'BEGIN_MANUAL_REFRESH_ACK', 2500);
    if (
      versionToken(reply.buildId) !== remoteVersion ||
      reply.assetVersion !== ASSET_VERSION ||
      Number(reply.until || 0) <= Date.now()
    ) throw new Error('manual refresh acknowledgement mismatch');
    return reply;
  }


  function finishRefreshUi() {
    setWorking(false);
    let url;
    try { url = new URL(global.location.href); }
    catch (_) { return; }
    const manual = url.searchParams.has('refresh');
    const automatic = url.searchParams.has('autoRefresh');
    if (!manual && !automatic) return;
    url.searchParams.delete('refresh');
    url.searchParams.delete('autoRefresh');
    url.searchParams.delete('v');
    try { global.history.replaceState(global.history.state, '', url.href); } catch (_) {}
    if (pageShellIsCurrent()) {
      clearAutoRefreshState();
      global.setTimeout(() => announce('最新の内容に更新しました。', false), 80);
    }
  }

  function broadcastReload(remoteVersion) {
    const message = {
      type: 'MARKET_BASE_RELOAD',
      version: remoteVersion,
      id: `${state.sourceId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      sourceId: state.sourceId,
      sentAt: Date.now()
    };
    try { state.channel?.postMessage(message); } catch (_) {}
    try { localStorage.setItem(SIGNAL_KEY, JSON.stringify(message)); } catch (_) {}
  }

  async function performRefresh(remoteVersion, options) {
    setWorking(true);
    try {
      // Never prune or reload before the target worker proves its actual build.
      // Old generation cleanup is owned by the successfully activated worker.
      const reconcile = () => updateServiceWorkers(remoteVersion, {
        force: options.mode === 'manual'
      });
      if (navigator.locks?.request) {
        await navigator.locks.request(
          'market-base-worker-update-v3',
          { mode: 'exclusive' },
          reconcile
        );
      } else {
        await reconcile();
      }
      if (options.mode === 'manual') await beginManualRefreshBurst(remoteVersion);
      await clearClientCaches();
      writeAutoRefreshState(remoteVersion, options.mode);
      storageSet('localStorage', 'market_base_last_auto_refresh_version', remoteVersion);
      storageSet('localStorage', 'market_base_last_cache_refresh', new Date().toISOString());
      if (options.broadcast) broadcastReload(remoteVersion);
      global.location.replace(reloadUrl(remoteVersion, options.mode));
      return true;
    } catch (error) {
      console.warn('MARKET BASE update failed', error);
      clearAutoRefreshState();
      setWorking(false);
      if (!options.silent) {
        announce('更新できませんでした。通信状態を確認して、もう一度お試しください。', true);
      }
      return false;
    }
  }

  async function refresh(options = {}) {
    const event = options.event;
    if (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    if (offlineModeActive()) {
      announce('オフラインモード中です。設定からオンラインモードへ切り替えてください。', false);
      return false;
    }
    if (state.working) return true;
    setWorking(true);
    try {
      const remote = await fetchRemoteVersion({ force: true });
      return performRefresh(remote, {
        mode: 'manual',
        broadcast: options.broadcast !== false,
        silent: false
      });
    } catch (error) {
      console.warn('MARKET BASE manual version check failed', error);
      setWorking(false);
      announce('更新できませんでした。通信状態を確認して、もう一度お試しください。', true);
      return false;
    }
  }

  async function checkOnOpen(options = {}) {
    if (isRadioPlayerPage()) return false;
    if (offlineModeActive()) return false;
    if (state.autoPromise) return state.autoPromise;
    state.autoPromise = (async () => {
      let remote;
      try {
        remote = await fetchRemoteVersion({ force: !!options.force });
      } catch (error) {
        console.warn('MARKET BASE automatic version check skipped', error);
        return false;
      }
      const current = currentBuildId();
      const shellCurrent = pageShellIsCurrent();
      if (!remote || (remote === current && shellCurrent)) {
        clearAutoRefreshState();
        updateServiceWorkers(remote || current).catch(error => {
          console.warn('MARKET BASE service worker reconciliation skipped', error);
        });
        return false;
      }
      const previous = readAutoRefreshState();
      if (
        previous &&
        previous.target === remote &&
        previous.fromBuild === current &&
        Number(previous.attempts || 0) >= 2 &&
        Date.now() - Number(previous.updatedAt || 0) < 30000
      ) {
        // Two automatic attempts are enough to avoid an endless reload loop
        // during a partially uploaded deployment. Manual update remains usable.
        return false;
      }
      return performRefresh(remote, { mode: 'auto', broadcast: true, silent: true });
    })().finally(() => {
      state.autoPromise = null;
    });
    return state.autoPromise;
  }

  function handleRefreshClick(event) {
    const button = isUpdateControl(event.target);
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    refresh({ event, broadcast: true });
  }

  function handleRemoteReload(message) {
    if (
      isRadioPlayerPage() ||
      offlineModeActive() ||
      !message ||
      message.type !== 'MARKET_BASE_RELOAD' ||
      message.sourceId === state.sourceId
    ) return;
    if (Date.now() - Number(message.sentAt || 0) > 15000) {
      checkOnOpen({ force: true, resume: true });
      return;
    }
    const guard = `market_base_remote_reload_${message.id || message.sentAt || message.version}`;
    if (storageGet('sessionStorage', guard)) return;
    storageSet('sessionStorage', guard, '1');
    announce('別の画面から更新されました。最新の内容を読み込みます。', false);
    global.setTimeout(() => {
      global.location.replace(reloadUrl(versionToken(message.version) || BUILD_ID, 'manual'));
    }, 350);
  }

  async function finishPendingOnlineTransition() {
    const initial = offlineState();
    if (
      !initial.pendingCleanup ||
      initial.enabled ||
      !navigator.onLine
    ) return false;
    if (state.onlineTransitionPromise) return state.onlineTransitionPromise;
    state.onlineTransitionPromise = withCrossTabLock('online-transition', async () => {
      const stored = offlineState();
      if (!stored.pendingCleanup || stored.enabled || !navigator.onLine) return false;
      const transitionId = `${state.sourceId}-${Date.now()}`;
      const generation = String(stored.generation ||
        `${Date.now()}-${Math.random().toString(36).slice(2)}`);
      let sentinelRemoved = false;
      const transitionIsCurrent = () => {
        const latest = offlineState();
        return !!(
          latest.pendingCleanup &&
          !latest.enabled &&
          String(latest.generation || '') === generation &&
          latest.transitionId === transitionId
        );
      };
      const requireCurrentTransition = () => {
        if (transitionIsCurrent()) return;
        const error = new Error('stale offline transition generation');
        error.code = 'MB_STALE_OFFLINE_GENERATION';
        throw error;
      };
      try {
        writeOfflineState({
          ...stored,
          enabled: false,
          pendingCleanup: true,
          phase: 'checking-online',
          generation,
          transitionId
        });
        // The sentinel makes the service worker intentionally cache-first.
        // Remove only that marker so the version check can reach the network;
        // text and compressed-photo caches remain recoverable until success.
        sentinelRemoved = true;
        await clearOfflineSentinel(generation);
        requireCurrentTransition();
        const remote = await fetchRemoteVersion({ force: true });
        requireCurrentTransition();
        const current = currentBuildId();
        if (remote !== current) {
          writeOfflineState({
            ...stored,
            enabled: false,
            pendingCleanup: true,
            phase: 'updating-online',
            targetVersion: remote,
            generation,
            transitionId
          });
          requireCurrentTransition();
          const refreshed = await performRefresh(remote, {
            mode: 'auto',
            broadcast: true,
            silent: true
          });
          if (!refreshed) throw new Error('online refresh failed');
          return true;
        }

        // A matching page build and an activated matching worker together mark
        // the safe point at which the user-created offline snapshot can go.
        await updateServiceWorkers(remote);
        requireCurrentTransition();
        await clearOfflineDownloadCaches();
        requireCurrentTransition();
        sentinelRemoved = false;
        writeOfflineState({
          ...stored,
          enabled: false,
          pendingCleanup: false,
          phase: 'online',
          textSaved: 0,
          textTotal: 0,
          imageSaved: 0,
          imageTotal: 0,
          savedAt: null,
          targetVersion: null,
          generation,
          transitionId: null,
          switchedOnlineAt: Date.now()
        });
        return true;
      } catch (error) {
        console.warn('MARKET BASE online transition skipped', error);
        const latest = offlineState();
        if (
          !latest.pendingCleanup ||
          latest.enabled ||
          String(latest.generation || '') !== generation ||
          latest.transitionId !== transitionId
        ) return false;
        if (sentinelRemoved) {
          try { await restoreOfflineSentinel(stored, generation); } catch (_) {}
        }
        writeOfflineState({
          ...stored,
          enabled: false,
          pendingCleanup: true,
          phase: 'waiting-online',
          targetVersion: null,
          generation,
          transitionId: null
        });
        return false;
      }
    }).finally(() => {
      state.onlineTransitionPromise = null;
    });
    return state.onlineTransitionPromise;
  }

  function openUpdateChannel() {
    if (state.channel || !('BroadcastChannel' in global)) return;
    if ('BroadcastChannel' in global) {
      try {
        state.channel = new BroadcastChannel(CHANNEL_NAME);
        state.channel.addEventListener('message', event => handleRemoteReload(event.data));
      } catch (_) {}
    }
  }

  function closeUpdateChannel() {
    try { state.channel?.close(); } catch (_) {}
    state.channel = null;
  }

  function initCrossPageSignals() {
    openUpdateChannel();
    global.addEventListener('storage', event => {
      if (event.key === SIGNAL_KEY && event.newValue) {
        try { handleRemoteReload(JSON.parse(event.newValue)); } catch (_) {}
        return;
      }
      if (event.key === LAST_VERSION_CHECK_KEY && event.newValue && !document.hidden) {
        const cached = readVersionCheckCache();
        if (cached?.version && cached.version !== currentBuildId()) {
          checkOnOpen({ force: false, resume: true });
        }
      }
    });
  }

  function initRefreshLifecycle() {
    global.addEventListener('pagehide', () => closeUpdateChannel());
    global.addEventListener('pageshow', event => {
      openUpdateChannel();
      finishRefreshUi();
      if (event.persisted) checkOnOpen({ force: true, resume: true });
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        state.hiddenAt = Date.now();
        return;
      }
      if (state.hiddenAt && Date.now() - state.hiddenAt >= VERSION_CHECK_TTL_MS) {
        checkOnOpen({ force: true, resume: true });
      }
      state.hiddenAt = 0;
    });
  }

  function init() {
    if (redirectAfterInactivity()) return;
    initActivityTracking();
    document.addEventListener('click', handleRefreshClick, true);
    initCrossPageSignals();
    loadNavigationEnhancements();
    loadRadioDock();
    finishRefreshUi();
    initRefreshLifecycle();
    global.addEventListener('online', finishPendingOnlineTransition);
    if (offlineState().pendingCleanup && navigator.onLine) {
      finishPendingOnlineTransition();
    } else {
      checkOnOpen();
    }
  }

  global.MarketBaseUpdate = Object.freeze({
    buildId: BUILD_ID,
    controllerRevision: 'v336',
    assetVersion: ASSET_VERSION,
    root: siteRoot.href,
    inactivityMs: INACTIVITY_MS,
    offlineModeActive,
    notifyOfflineModeChanged,
    finishPendingOnlineTransition,
    refresh,
    checkOnOpen
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})(window);
