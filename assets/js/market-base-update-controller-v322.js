(function (global) {
  'use strict';

  if (global.MarketBaseUpdate) return;

  const BUILD_ID = 'MARKET_BASE_V322_GLOBAL_UPDATE_JOURNEY_STABILITY_20260730';
  const LEGACY_PAGE_BUILD = 'MARKET_BASE_LEGACY_PAGE';
  const CHANNEL_NAME = 'market-base-update-v1';
  const SIGNAL_KEY = 'market_base_global_refresh_signal';
  const SCRIPT_URL = document.currentScript?.src || '';
  let siteRoot;
  try {
    siteRoot = SCRIPT_URL ? new URL('../../', SCRIPT_URL) : new URL('./', global.location.href);
  } catch (_) {
    siteRoot = new URL('./', global.location.href);
  }

  const state = {
    autoPromise: null,
    working: false,
    sourceId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    channel: null
  };

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

  function currentBuildId() {
    return versionToken(
      document.querySelector('meta[name="market-base-site-build"]')?.content ||
      LEGACY_PAGE_BUILD
    );
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

  async function fetchRemoteVersion() {
    if (!/^https?:$/.test(global.location.protocol)) return currentBuildId();
    const url = new URL('version.txt', siteRoot);
    url.searchParams.set('check', Date.now().toString());
    const abortController = 'AbortController' in global ? new AbortController() : null;
    const timeout = global.setTimeout(() => abortController?.abort(), 4500);
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

  function waitForTargetWorker(registration, remoteVersion) {
    return new Promise((resolve, reject) => {
      let finished = false;
      const finish = error => {
        if (finished) return;
        finished = true;
        global.clearTimeout(timeout);
        global.clearInterval(poll);
        registration.removeEventListener?.('updatefound', inspect);
        navigator.serviceWorker.removeEventListener?.('controllerchange', inspect);
        if (error) reject(error);
        else resolve(registration);
      };
      const inspect = () => {
        const target = [registration.waiting, registration.installing]
          .find(worker => worker && workerVersion(worker) === remoteVersion);
        if (target) {
          if (target.state === 'installed') target.postMessage({ type: 'SKIP_WAITING' });
          if (target.state === 'redundant') {
            finish(new Error('service worker install failed'));
          }
          return;
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
        45000
      );
      const poll = global.setInterval(inspect, 100);
      registration.addEventListener?.('updatefound', inspect);
      navigator.serviceWorker.addEventListener?.('controllerchange', inspect);
      inspect();
    });
  }

  async function updateServiceWorkers(remoteVersion) {
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(global.location.protocol)) return;
    const rootScope = sitePath();
    const swUrl = new URL('sw.js', siteRoot);
    swUrl.searchParams.set('v', remoteVersion);
    const rootRegistration = await navigator.serviceWorker.register(swUrl.href, {
      scope: rootScope,
      updateViaCache: 'none'
    });
    if (
      workerVersion(rootRegistration.active) === remoteVersion &&
      typeof rootRegistration.update === 'function'
    ) {
      await rootRegistration.update();
    }
    rootRegistration.waiting?.postMessage({ type: 'SKIP_WAITING' });
    rootRegistration.installing?.postMessage({ type: 'SKIP_WAITING' });
    await waitForTargetWorker(rootRegistration, remoteVersion);

    const registrations = await navigator.serviceWorker.getRegistrations();
    const nestedRegistrations = registrations.filter(registration => {
      if (!isSiteRegistration(registration)) return false;
      try { return new URL(registration.scope).pathname !== rootScope; }
      catch (_) { return false; }
    });
    await Promise.all(nestedRegistrations.map(async registration => {
      try {
        await registration.update();
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
        registration.installing?.postMessage({ type: 'SKIP_WAITING' });
      } catch (_) {
        // A legacy nested registration must not block the root update.
      }
    }));
  }

  async function pruneOldSiteCaches(remoteVersion) {
    if ('caches' in global) {
      const currentCache = `market-base-${remoteVersion}`;
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(key => String(key).startsWith('market-base-') && key !== currentCache)
          .map(key => caches.delete(key))
      );
    }
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
      await updateServiceWorkers(remoteVersion);
      await pruneOldSiteCaches(remoteVersion);
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
    document.addEventListener('click', handleRefreshClick, true);
    initCrossPageSignals();
    checkOnOpen();
  }

  global.MarketBaseUpdate = Object.freeze({
    buildId: BUILD_ID,
    root: siteRoot.href,
    refresh,
    checkOnOpen
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})(window);
