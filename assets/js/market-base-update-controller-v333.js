(function (global) {
  'use strict';

  if (global.MarketBaseUpdate) return;

  const BUILD_ID = 'MARKET_BASE_V333_1_BOTTOM_TOOL_MENU_RADIO_CURRENCY_SAFE_20260803';
  const LEGACY_PAGE_BUILD = 'MARKET_BASE_LEGACY_PAGE';
  const CHANNEL_NAME = 'market-base-update-v1';
  const SIGNAL_KEY = 'market_base_global_refresh_signal';
  const LAST_ACTIVE_KEY = 'market_base_last_active_at_v1';
  const RADIO_STATE_KEY = 'market_base_radio_state_v1';
  const OFFLINE_STATE_KEY = 'market_base_offline_mode_v1';
  const OFFLINE_CACHE_NAMES = [
    'mb-user-offline-v324-text',
    'mb-user-offline-v324-images',
    'mb-user-offline-v324-state'
  ];
  const INACTIVITY_MS = 6 * 60 * 60 * 1000;
  const RADIO_GRACE_MS = 12 * 60 * 60 * 1000;
  const SERVICE_WORKER_TIMEOUT_MS = 2800;
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
    sourceId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    channel: null
  };
  const radioDockUrl = new URL(
    'assets/js/market-base-radio-dock-v333.js?v=20260803-v333-1-bottom-tool-menu-radio-currency-safe',
    siteRoot
  );
  const toolMenuUrl = new URL(
    'assets/js/market-base-tool-menu-v333.js?v=20260803-v333-1-bottom-tool-menu-radio-currency-safe',
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

  function versionToken(value) {
    return String(value || '').split(/\r?\n/)[0].trim();
  }

  function radioIsPlaying() {
    try {
      const radio = JSON.parse(storageGet('localStorage', RADIO_STATE_KEY) || 'null');
      return !!(
        radio &&
        radio.playing &&
        (
          Number(radio.validUntil || 0) > Date.now() ||
          Date.now() - Number(radio.updatedAt || 0) < RADIO_GRACE_MS
        )
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

  function currentBuildId() {
    // The controller itself is the authoritative site generation. Some
    // specialist pages intentionally keep older static metadata, which must
    // not trigger an automatic refresh loop on every open.
    return versionToken(BUILD_ID || LEGACY_PAGE_BUILD);
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
    global.clearTimeout(setWorking.safetyTimer);
    if (working) {
      setWorking.safetyTimer = global.setTimeout(() => {
        state.working = false;
        setWorking(false);
      }, 5000);
    }
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

  async function fetchRemoteVersion() {
    if (!/^https?:$/.test(global.location.protocol)) return currentBuildId();
    const url = new URL('version.txt', siteRoot);
    url.searchParams.set('check', Date.now().toString());
    const abortController = 'AbortController' in global ? new AbortController() : null;
    const timeout = global.setTimeout(() => abortController?.abort(), 2500);
    try {
      const response = await fetch(url.href, {
        cache: 'no-store',
        credentials: 'same-origin',
        headers: { 'Cache-Control': 'no-cache' },
        signal: abortController?.signal
      });
      if (!response.ok) throw new Error(`version check ${response.status}`);
      const remote = versionToken(await response.text());
      if (!remote) throw new Error('empty version');
      return remote;
    } finally {
      global.clearTimeout(timeout);
    }
  }

  function workerVersion(worker) {
    try { return new URL(worker?.scriptURL || '').searchParams.get('v') || ''; }
    catch (_) { return ''; }
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

  async function updateServiceWorkersInternal(remoteVersion) {
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(global.location.protocol)) return;
    const rootScope = sitePath();
    const swUrl = new URL('sw.js', siteRoot);
    swUrl.searchParams.set('v', remoteVersion);
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
      workerVersion(rootRegistration.active) !== remoteVersion
    ) {
      await waitForTargetWorker(rootRegistration, remoteVersion);
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

  function updateServiceWorkers(remoteVersion) {
    return withTimeout(
      updateServiceWorkersInternal(remoteVersion),
      SERVICE_WORKER_TIMEOUT_MS,
      'service worker update timed out'
    );
  }

  async function pruneOldSiteCaches(remoteVersion) {
    if ('caches' in global) {
      const currentCache = `market-base-${remoteVersion}`;
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(key => (
            String(key).startsWith('market-base-') &&
            key !== currentCache
          ))
          .map(key => caches.delete(key))
      );
    }
  }

  async function clearOfflineDownloadCaches() {
    if (!('caches' in global)) return;
    await Promise.all(OFFLINE_CACHE_NAMES.map(name => caches.delete(name)));
  }

  async function clearOfflineSentinel() {
    if (!('caches' in global)) return;
    await caches.delete(OFFLINE_CACHE_NAMES[2]);
  }

  async function restoreOfflineSentinel(stored) {
    if (!('caches' in global)) return;
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
  }

  async function clearClientCaches() {
    try {
      const removable = [];
      const storage = global.localStorage;
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (
          key === 'market_base_photo_registry_cache_v1' ||
          String(key || '').startsWith('mbJourneyImage:')
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

  function broadcastReload(remoteVersion) {
    const message = {
      type: 'MARKET_BASE_RELOAD',
      version: remoteVersion,
      sourceId: state.sourceId,
      sentAt: Date.now()
    };
    try { state.channel?.postMessage(message); } catch (_) {}
    try { localStorage.setItem(SIGNAL_KEY, JSON.stringify(message)); } catch (_) {}
  }

  async function performRefresh(remoteVersion, options) {
    if (state.working) return true;
    setWorking(true);
    try {
      // Start worker reconciliation, but never wait for it before the visible
      // cache-busting reload. CSS, JS and documents are network-first online.
      updateServiceWorkers(remoteVersion).catch(error => {
        console.warn('MARKET BASE service worker update continued in background', error);
      });
      await withTimeout(pruneOldSiteCaches(remoteVersion), 1200, 'cache cleanup timed out').catch(() => {});
      await clearClientCaches();
      storageSet('sessionStorage', 'market_base_auto_refresh_target', remoteVersion);
      storageSet('localStorage', 'market_base_last_auto_refresh_version', remoteVersion);
      storageSet('localStorage', 'market_base_last_cache_refresh', new Date().toISOString());
      if (options.broadcast) broadcastReload(remoteVersion);
      global.location.replace(reloadUrl(remoteVersion, options.mode));
      return true;
    } catch (error) {
      console.warn('MARKET BASE update failed', error);
      storageRemove('sessionStorage', 'market_base_auto_refresh_target');
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
      const remote = await fetchRemoteVersion();
      setWorking(false);
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

  async function checkOnOpen() {
    if (isRadioPlayerPage()) return false;
    if (offlineModeActive()) return false;
    if (state.autoPromise) return state.autoPromise;
    state.autoPromise = (async () => {
      let remote;
      try {
        remote = await fetchRemoteVersion();
      } catch (error) {
        console.warn('MARKET BASE automatic version check skipped', error);
        return false;
      }
      const current = currentBuildId();
      if (!remote || remote === current) {
        storageRemove('sessionStorage', 'market_base_auto_refresh_target');
        updateServiceWorkers(remote || current).catch(error => {
          console.warn('MARKET BASE service worker reconciliation skipped', error);
        });
        return false;
      }
      if (storageGet('sessionStorage', 'market_base_auto_refresh_target') === remote) return false;
      return performRefresh(remote, { mode: 'auto', broadcast: false, silent: true });
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
      message.sourceId === state.sourceId ||
      Date.now() - Number(message.sentAt || 0) > 15000
    ) return;
    const guard = `market_base_remote_reload_${message.version}`;
    if (storageGet('sessionStorage', guard)) return;
    storageSet('sessionStorage', guard, '1');
    announce('別の画面から更新されました。最新の内容を読み込みます。', false);
    global.setTimeout(() => {
      global.location.replace(reloadUrl(versionToken(message.version) || BUILD_ID, 'manual'));
    }, 350);
  }

  async function finishPendingOnlineTransition() {
    const stored = offlineState();
    if (
      !stored.pendingCleanup ||
      stored.enabled ||
      !navigator.onLine
    ) return false;
    if (state.onlineTransitionPromise) return state.onlineTransitionPromise;
    state.onlineTransitionPromise = (async () => {
      let sentinelRemoved = false;
      try {
        writeOfflineState({
          ...stored,
          enabled: false,
          pendingCleanup: true,
          phase: 'checking-online'
        });
        // The sentinel makes the service worker intentionally cache-first.
        // Remove only that marker so the version check can reach the network;
        // text and compressed-photo caches remain recoverable until success.
        await clearOfflineSentinel();
        sentinelRemoved = true;
        const remote = await fetchRemoteVersion();
        const current = currentBuildId();
        if (remote !== current) {
          writeOfflineState({
            ...stored,
            enabled: false,
            pendingCleanup: true,
            phase: 'updating-online',
            targetVersion: remote
          });
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
        await clearOfflineDownloadCaches();
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
          switchedOnlineAt: Date.now()
        });
        return true;
      } catch (error) {
        console.warn('MARKET BASE online transition skipped', error);
        if (sentinelRemoved) {
          try { await restoreOfflineSentinel(stored); } catch (_) {}
        }
        writeOfflineState({
          ...stored,
          enabled: false,
          pendingCleanup: true,
          phase: 'waiting-online',
          targetVersion: null
        });
        return false;
      }
    })().finally(() => {
      state.onlineTransitionPromise = null;
    });
    return state.onlineTransitionPromise;
  }

  function initCrossPageSignals() {
    if ('BroadcastChannel' in global) {
      try {
        state.channel = new BroadcastChannel(CHANNEL_NAME);
        state.channel.addEventListener('message', event => handleRemoteReload(event.data));
      } catch (_) {}
    }
    global.addEventListener('storage', event => {
      if (event.key !== SIGNAL_KEY || !event.newValue) return;
      try { handleRemoteReload(JSON.parse(event.newValue)); } catch (_) {}
    });
  }

  function init() {
    if (redirectAfterInactivity()) return;
    initActivityTracking();
    document.addEventListener('click', handleRefreshClick, true);
    initCrossPageSignals();
    loadRadioDock();
    global.addEventListener('online', finishPendingOnlineTransition);
    if (offlineState().pendingCleanup && navigator.onLine) {
      finishPendingOnlineTransition();
    } else {
      checkOnOpen();
    }
  }

  global.MarketBaseUpdate = Object.freeze({
    buildId: BUILD_ID,
    root: siteRoot.href,
    inactivityMs: INACTIVITY_MS,
    offlineModeActive,
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
