(function (global) {
  'use strict';

  if (global.MarketBaseRadioDock) return;

  const STATE_KEY = 'market_base_radio_state_v1';
  const COMMAND_KEY = 'market_base_radio_command_v1';
  const COLLAPSED_KEY = 'market_base_radio_dock_collapsed_v1';
  const POSITION_KEY = 'market_base_radio_dock_position_v1';
  const DISMISSED_KEY = 'market_base_radio_dock_dismissed_v1';
  const CHANNEL_NAME = 'market-base-radio-v1';
  const STATE_GRACE_MS = 12 * 60 * 60 * 1000;
  const VERTICAL_EDGE_GAP = 10;
  const sourceId = `dock-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const scriptNode = document.currentScript ||
    document.querySelector('script[data-mb-radio-dock]');
  let siteRoot;
  try {
    siteRoot = scriptNode?.src
      ? new URL('../../', scriptNode.src)
      : new URL('./', global.location.href);
  } catch (_) {
    siteRoot = new URL('./', global.location.href);
  }

  if (/\/world-radio\/player\.html$/i.test(global.location.pathname)) return;

  let channel = null;
  let currentState = null;
  let collapsedPreference = storageGet(COLLAPSED_KEY);
  let collapsed = collapsedPreference === '1';
  let dismissed = storageGet(DISMISSED_KEY) === '1';
  let messageResetHandle = 0;
  let positionFrame = 0;
  let dragState = null;

  function storageGet(key) {
    try { return localStorage.getItem(key); }
    catch (_) { return null; }
  }

  function storageSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (_) {
      return false;
    }
  }

  function readJson(key) {
    try { return JSON.parse(storageGet(key) || 'null'); }
    catch (_) { return null; }
  }

  function readState() {
    return readJson(STATE_KEY);
  }

  function stateIsFresh(state) {
    return !!(
      state &&
      state.stationId &&
      Number.isFinite(Number(state.updatedAt)) &&
      (
        Number(state.validUntil || 0) > Date.now() ||
        Date.now() - Number(state.updatedAt) < STATE_GRACE_MS
      )
    );
  }

  function addStylesheet() {
    if (document.querySelector('link[data-mb-radio-dock-style]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL(
      'assets/css/market-base-radio-dock-v323.css?v=20260730-v324-edge',
      siteRoot
    ).href;
    link.dataset.mbRadioDockStyle = '';
    document.head.appendChild(link);
  }

  function createDock() {
    const node = document.createElement('aside');
    node.className = 'mb-radio-dock';
    node.id = 'marketBaseRadioDock';
    node.setAttribute('aria-label', '世界のラジオ');
    node.innerHTML = `
      <section class="mb-radio-dock-panel" id="mbRadioDockPanel" aria-label="世界のラジオ操作">
        <div class="mb-radio-dock-head">
          <button class="mb-radio-dock-drag" id="mbRadioDockDrag" type="button"
            aria-label="ラジオ小窓を移動">
            <span aria-hidden="true">⠿</span>
          </button>
          <div class="mb-radio-dock-copy">
            <span class="mb-radio-dock-kicker" id="mbRadioDockState">停止中</span>
            <strong id="mbRadioDockName">世界のラジオ</strong>
            <small id="mbRadioDockPlace">WNYCから聴く</small>
          </div>
          <button class="mb-radio-dock-close" id="mbRadioDockClose" type="button"
            aria-label="ラジオ小窓とタブを閉じる" title="閉じる">×</button>
        </div>
        <div class="mb-radio-dock-actions">
          <div class="mb-radio-dock-controls" id="mbRadioDockControls"
            aria-label="ラジオ再生操作" hidden>
            <button type="button" data-radio-command="previous" aria-label="前の放送局">‹</button>
            <button type="button" data-radio-command="toggle" id="mbRadioDockToggle"
              aria-label="再生する">▶</button>
            <button type="button" data-radio-command="next" aria-label="次の放送局">›</button>
          </div>
          <a class="mb-radio-dock-open" id="mbRadioDockOpen"
            href="${new URL('world-radio/player.html?id=wnyc&v=20260730-v324', siteRoot).href}"
            target="_blank" rel="noopener"
            aria-label="世界のラジオプレイヤーを別タブで開く">
            <span aria-hidden="true">↗</span>
            <b>別タブ</b>
          </a>
        </div>
        <p class="mb-radio-dock-message" id="mbRadioDockMessage" aria-live="polite"></p>
      </section>
      <button class="mb-radio-dock-tab" id="mbRadioDockTab" type="button"
        aria-expanded="false" aria-controls="mbRadioDockPanel"
        aria-label="ラジオ小窓を開く">
        <span class="mb-radio-dock-tab-arrow" id="mbRadioDockTabArrow" aria-hidden="true">‹</span>
        <span class="mb-radio-dock-tab-label" aria-hidden="true">RADIO</span>
        <span class="mb-radio-dock-tab-grip" id="mbRadioDockTabGrip"
          aria-hidden="true" title="押したまま移動">⠿</span>
      </button>
    `;
    document.body.appendChild(node);
    return node;
  }

  addStylesheet();
  const dock = createDock();
  const panel = dock.querySelector('#mbRadioDockPanel');
  const dockTab = dock.querySelector('#mbRadioDockTab');
  const dockTabArrow = dock.querySelector('#mbRadioDockTabArrow');
  const dockTabGrip = dock.querySelector('#mbRadioDockTabGrip');
  const dragHandle = dock.querySelector('#mbRadioDockDrag');
  const closeButton = dock.querySelector('#mbRadioDockClose');
  const stateLabel = dock.querySelector('#mbRadioDockState');
  const stationLabel = dock.querySelector('#mbRadioDockName');
  const placeLabel = dock.querySelector('#mbRadioDockPlace');
  const controls = dock.querySelector('#mbRadioDockControls');
  const toggleButton = dock.querySelector('#mbRadioDockToggle');
  const openLink = dock.querySelector('#mbRadioDockOpen');
  const message = dock.querySelector('#mbRadioDockMessage');

  function statusLabel(state) {
    if (state?.needsGesture) return '操作が必要';
    if (state?.status === 'playing' || state?.playing) return '再生中';
    if (state?.status === 'loading') return '接続中';
    if (state?.status === 'error') return '接続できません';
    return '停止中';
  }

  function applyCollapsed(next) {
    collapsed = !!next;
    dock.dataset.collapsed = String(collapsed);
    panel.setAttribute('aria-hidden', String(collapsed));
    dockTab.setAttribute('aria-expanded', String(!collapsed));
    dockTabArrow.textContent = collapsed ? '‹' : '›';
    dockTab.setAttribute(
      'aria-label',
      collapsed ? 'ラジオ小窓を開く' : 'ラジオ小窓をしまう'
    );
  }

  function applyDismissed(next, persist = false) {
    dismissed = !!next;
    dock.hidden = dismissed;
    dock.dataset.dismissed = String(dismissed);
    if (persist) storageSet(DISMISSED_KEY, dismissed ? '1' : '0');
    if (!dismissed) schedulePositionRestore();
  }

  function syncAutomaticCollapse() {
    if (collapsedPreference === '1') {
      applyCollapsed(true);
      return;
    }
    if (collapsedPreference === '0') {
      applyCollapsed(false);
      return;
    }
    applyCollapsed(!currentState);
  }

  function positionBounds() {
    const styles = global.getComputedStyle?.(dock);
    const cssPixels = property => {
      const parsed = Number.parseFloat(styles?.getPropertyValue(property) || '0');
      return Number.isFinite(parsed) ? parsed : 0;
    };
    const safeTop = cssPixels('--dock-safe-top');
    const safeBottom = cssPixels('--dock-safe-bottom');
    const panelWidth = Math.max(1, dock.offsetWidth || panel.offsetWidth || 280);
    const panelHeight = Math.max(1, panel.offsetHeight || 132);
    const tabWidth = Math.max(1, dockTab.offsetWidth || 38);
    const minimumX = tabWidth;
    const maximumX = Math.max(
      minimumX,
      global.innerWidth - panelWidth
    );
    const minimumY = VERTICAL_EDGE_GAP + safeTop;
    const maximumY = Math.max(
      minimumY,
      global.innerHeight - VERTICAL_EDGE_GAP - safeBottom - panelHeight
    );
    return {
      panelWidth,
      panelHeight,
      tabWidth,
      minimumX,
      maximumX,
      minimumY,
      maximumY
    };
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function savedPosition() {
    const saved = readJson(POSITION_KEY);
    if (!saved) return null;
    const xRatio = Number(saved.xRatio);
    const yRatio = Number(saved.yRatio);
    if (!Number.isFinite(xRatio) || !Number.isFinite(yRatio)) return null;
    return {
      xRatio: clamp(xRatio, 0, 1),
      yRatio: clamp(yRatio, 0, 1)
    };
  }

  function positionFromRatio(position, bounds) {
    return {
      x: bounds.minimumX +
        position.xRatio * (bounds.maximumX - bounds.minimumX),
      y: bounds.minimumY +
        position.yRatio * (bounds.maximumY - bounds.minimumY)
    };
  }

  function ratioFromPosition(x, y, bounds) {
    const xRange = bounds.maximumX - bounds.minimumX;
    const yRange = bounds.maximumY - bounds.minimumY;
    return {
      xRatio: xRange > 0 ? (x - bounds.minimumX) / xRange : 1,
      yRatio: yRange > 0 ? (y - bounds.minimumY) / yRange : 1
    };
  }

  function defaultPosition(bounds) {
    const compact = global.innerWidth <= 640;
    return {
      x: bounds.maximumX,
      y: compact
        ? Math.max(bounds.minimumY, bounds.maximumY - 82)
        : bounds.minimumY +
          (bounds.maximumY - bounds.minimumY) * .62
    };
  }

  function applyPosition(x, y, save = false) {
    const bounds = positionBounds();
    const nextX = clamp(x, bounds.minimumX, bounds.maximumX);
    const nextY = clamp(y, bounds.minimumY, bounds.maximumY);
    dock.style.left = `${Math.round(nextX)}px`;
    dock.style.top = `${Math.round(nextY)}px`;
    dock.classList.add('is-positioned');
    if (save) {
      const ratio = ratioFromPosition(nextX, nextY, bounds);
      storageSet(POSITION_KEY, JSON.stringify(ratio));
    }
  }

  function restorePosition() {
    const bounds = positionBounds();
    const saved = savedPosition();
    const next = saved
      ? positionFromRatio(saved, bounds)
      : defaultPosition(bounds);
    applyPosition(next.x, next.y, false);
  }

  function schedulePositionRestore() {
    if (dismissed || dragState) return;
    global.cancelAnimationFrame?.(positionFrame);
    positionFrame = global.requestAnimationFrame(() => {
      if (dragState) return;
      positionFrame = global.requestAnimationFrame(restorePosition);
    });
  }

  function render(state = readState()) {
    currentState = stateIsFresh(state) ? state : null;
    dock.dataset.playing = String(!!currentState?.playing);
    dock.dataset.state = currentState?.needsGesture
      ? 'gesture'
      : currentState?.status || 'idle';

    if (!currentState) {
      stateLabel.textContent = '停止中';
      stationLabel.textContent = '世界のラジオ';
      placeLabel.textContent = 'WNYCから聴く';
      controls.hidden = true;
      openLink.href = new URL(
        'world-radio/player.html?id=wnyc&v=20260730-v324',
        siteRoot
      ).href;
      message.textContent = '';
      syncAutomaticCollapse();
      schedulePositionRestore();
      return;
    }

    stateLabel.textContent = statusLabel(currentState);
    stationLabel.textContent = currentState.stationName || '世界のラジオ';
    placeLabel.textContent = [currentState.city, currentState.country]
      .filter(Boolean)
      .join('・') || 'LIVE RADIO';
    controls.hidden = false;
    const active = currentState.playing || currentState.status === 'loading';
    toggleButton.textContent = active ? 'Ⅱ' : '▶';
    toggleButton.setAttribute(
      'aria-label',
      active ? '再生を停止する' : '再生する'
    );
    openLink.href = new URL(
      `world-radio/player.html?id=${encodeURIComponent(currentState.stationId)}&v=20260730-v324`,
      siteRoot
    ).href;
    if (currentState.needsGesture) {
      message.textContent = 'iPhoneでは別タブを開き、再生を押してください。';
    } else if (message.dataset.temporary !== '1') {
      message.textContent = '';
    }
    syncAutomaticCollapse();
    schedulePositionRestore();
  }

  function temporaryMessage(text) {
    global.clearTimeout(messageResetHandle);
    message.dataset.temporary = '1';
    message.textContent = text;
    messageResetHandle = global.setTimeout(() => {
      delete message.dataset.temporary;
      render(currentState);
    }, 2600);
  }

  function sendCommand(action) {
    if (!currentState?.instanceId) {
      temporaryMessage('別タブのプレイヤーを開いてください。');
      return;
    }
    const command = {
      type: 'COMMAND',
      action,
      id: `${sourceId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      sourceId,
      targetInstanceId: currentState.instanceId,
      sentAt: Date.now()
    };
    try { channel?.postMessage(command); } catch (_) {}
    storageSet(COMMAND_KEY, JSON.stringify(command));
    temporaryMessage(
      action === 'toggle'
        ? (currentState.playing || currentState.status === 'loading'
          ? '停止します…'
          : '再生します…')
        : '放送局を切り替えます…'
    );
  }

  function beginDrag(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const bounds = positionBounds();
    const rect = dock.getBoundingClientRect();
    dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      left: clamp(rect.left, bounds.minimumX, bounds.maximumX),
      top: clamp(rect.top, bounds.minimumY, bounds.maximumY),
      captureTarget: event.currentTarget
    };
    dragState.captureTarget.setPointerCapture?.(event.pointerId);
    dock.dataset.dragging = 'true';
    event.preventDefault();
  }

  function moveDrag(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    applyPosition(
      dragState.left + event.clientX - dragState.startX,
      dragState.top + event.clientY - dragState.startY,
      false
    );
    event.preventDefault();
  }

  function finishDrag(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    const rect = dock.getBoundingClientRect();
    const captureTarget = dragState.captureTarget;
    captureTarget.releasePointerCapture?.(event.pointerId);
    dragState = null;
    delete dock.dataset.dragging;
    applyPosition(rect.left, rect.top, true);
    event.preventDefault();
  }

  dockTab.addEventListener('click', event => {
    if (event.target.closest('.mb-radio-dock-tab-grip')) return;
    const next = !collapsed;
    collapsedPreference = next ? '1' : '0';
    storageSet(COLLAPSED_KEY, collapsedPreference);
    applyCollapsed(next);
  });

  closeButton.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    applyDismissed(true, true);
  });

  document.addEventListener('click', event => {
    const radioEntry = event.target.closest?.(
      '[data-mb-radio-dock-show],a[href*="world-radio/"]'
    );
    if (!radioEntry || !dismissed) return;
    applyDismissed(false, true);
  }, true);

  global.addEventListener('marketbase:radio-dock-show', () => {
    applyDismissed(false, true);
  });

  controls.addEventListener('click', event => {
    const button = event.target.closest('[data-radio-command]');
    if (!button) return;
    sendCommand(button.dataset.radioCommand);
  });

  dragHandle.addEventListener('pointerdown', beginDrag);
  dragHandle.addEventListener('pointermove', moveDrag);
  dragHandle.addEventListener('pointerup', finishDrag);
  dragHandle.addEventListener('pointercancel', finishDrag);
  dockTabGrip.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
  });
  dockTabGrip.addEventListener('pointerdown', beginDrag);
  dockTabGrip.addEventListener('pointermove', moveDrag);
  dockTabGrip.addEventListener('pointerup', finishDrag);
  dockTabGrip.addEventListener('pointercancel', finishDrag);

  if ('BroadcastChannel' in global) {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.addEventListener('message', event => {
        if (event.data?.type === 'STATE') render(event.data.state);
        if (event.data?.type === 'ACK' && event.data.state) render(event.data.state);
      });
    } catch (_) {}
  }

  global.addEventListener('storage', event => {
    if (event.key === STATE_KEY) render();
    if (event.key === COLLAPSED_KEY) {
      collapsedPreference = event.newValue;
      syncAutomaticCollapse();
    }
    if (event.key === POSITION_KEY) schedulePositionRestore();
    if (event.key === DISMISSED_KEY) {
      applyDismissed(event.newValue === '1', false);
    }
  });

  global.addEventListener('resize', schedulePositionRestore, { passive: true });
  global.addEventListener('orientationchange', schedulePositionRestore, {
    passive: true
  });
  global.addEventListener('load', schedulePositionRestore, { once: true });

  applyDismissed(dismissed, false);
  render();
  global.setInterval(() => render(), 30000);
  global.addEventListener('pagehide', () => {
    try { channel?.close(); } catch (_) {}
  }, { once: true });

  global.MarketBaseRadioDock = Object.freeze({
    root: siteRoot.href,
    refresh: render,
    sendCommand,
    restorePosition,
    show: () => applyDismissed(false, true),
    hide: () => applyDismissed(true, true),
    isHidden: () => dismissed
  });
})(window);
