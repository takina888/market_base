(function (global) {
  'use strict';

  if (global.MarketBaseRadioDock) return;

  const STATE_KEY = 'market_base_radio_state_v1';
  const COMMAND_KEY = 'market_base_radio_command_v1';
  const COLLAPSED_KEY = 'market_base_radio_dock_collapsed_v1';
  const POSITION_KEY = 'market_base_radio_dock_position_v1';
  const DISMISSED_KEY = 'market_base_radio_dock_dismissed_v1';
  const CHANNEL_NAME = 'market-base-radio-v1';
  const LEGACY_STATE_GRACE_MS = 12 * 60 * 60 * 1000;
  const COMMAND_ACK_TIMEOUT_MS = 3200;
  const VERTICAL_EDGE_GAP = 10;
  const SCROLL_CONTROL_GAP = 10;
  const DRAG_THRESHOLD_PX = 6;
  const ASSET_VERSION = '20260810-v333-18-cache-radio-navigation-stability';
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
  let commandAckHandle = 0;
  let pendingCommandId = '';
  let pendingCommandSentAt = 0;
  let pendingCommandTargetId = '';
  let positionFrame = 0;
  let dragState = null;
  let suppressTabClickUntil = 0;
  let scrollControlsObserver = null;
  let scrollControlsResizeObserver = null;
  let observedScrollControls = null;

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

  function storageRemove(key) {
    try { localStorage.removeItem(key); }
    catch (_) {}
  }

  function readJson(key) {
    try { return JSON.parse(storageGet(key) || 'null'); }
    catch (_) { return null; }
  }

  function readState() {
    return readJson(STATE_KEY);
  }

  function stateIsFresh(state) {
    if (!state || Number(state.version || 0) < 2 || !state.stationId) return false;
    const now = Date.now();
    const updatedAt = Number(state.updatedAt);
    if (!Number.isFinite(updatedAt) || now - updatedAt < 0) return false;
    const validUntil = Number(state.validUntil);
    if (Number.isFinite(validUntil) && validUntil > 0) return validUntil > now;
    return now - updatedAt < LEGACY_STATE_GRACE_MS;
  }

  function addBootstrapStyle() {
    if (document.querySelector('style[data-mb-radio-dock-bootstrap]')) return;
    const style = document.createElement('style');
    style.dataset.mbRadioDockBootstrap = '';
    style.textContent = [
      '.mb-radio-dock[data-style-ready="false"]{visibility:hidden!important}',
      '.mb-radio-dock[data-style-ready="false"],',
      '.mb-radio-dock[data-style-ready="false"] *{transition:none!important}'
    ].join('');
    document.head.appendChild(style);
  }

  function addStylesheet() {
    const existing = document.querySelector('link[data-mb-radio-dock-style]');
    if (existing) return existing;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL(
      `assets/css/market-base-radio-dock-v333-16.css?v=${ASSET_VERSION}`,
      siteRoot
    ).href;
    link.dataset.mbRadioDockStyle = '';
    document.head.appendChild(link);
    return link;
  }

  function createDock() {
    const node = document.createElement('aside');
    node.className = 'mb-radio-dock';
    node.id = 'marketBaseRadioDock';
    node.dataset.dockKind = 'radio';
    node.dataset.collapsed = String(collapsed);
    node.dataset.styleReady = 'false';
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
            <span class="mb-radio-dock-track" id="mbRadioDockTrack" hidden>
              <b id="mbRadioDockTrackTitle"></b>
              <small id="mbRadioDockTrackArtist"></small>
            </span>
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
            href="${new URL(`world-radio/player.html?id=wnyc&autoplay=1&v=${ASSET_VERSION}`, siteRoot).href}"
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
    const initialPanel = node.querySelector('#mbRadioDockPanel');
    const initialTab = node.querySelector('#mbRadioDockTab');
    const initialArrow = node.querySelector('#mbRadioDockTabArrow');
    initialPanel?.setAttribute('aria-hidden', String(collapsed));
    initialTab?.setAttribute('aria-expanded', String(!collapsed));
    initialTab?.setAttribute(
      'aria-label',
      collapsed ? 'ラジオ小窓を開く' : 'ラジオ小窓をしまう'
    );
    if (initialArrow) initialArrow.textContent = collapsed ? '‹' : '›';
    document.body.appendChild(node);
    return node;
  }

  currentState = stateIsFresh(readState()) ? readState() : null;
  if (collapsedPreference === '1') collapsed = true;
  else if (collapsedPreference === '0') collapsed = false;
  else collapsed = !currentState;
  addBootstrapStyle();
  const dockStylesheet = addStylesheet();
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
  const trackBox = dock.querySelector('#mbRadioDockTrack');
  const trackTitleLabel = dock.querySelector('#mbRadioDockTrackTitle');
  const trackArtistLabel = dock.querySelector('#mbRadioDockTrackArtist');
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
    dock.hidden = dismissed || !global.navigator.onLine;
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
    const safeRight = cssPixels('--dock-safe-right');
    const safeBottom = cssPixels('--dock-safe-bottom');
    const panelWidth = Math.max(1, dock.offsetWidth || 0, panel.offsetWidth || 280);
    const panelHeight = Math.max(
      1,
      dock.offsetHeight || 0,
      panel.offsetHeight || 132,
      dockTab.offsetHeight || 108
    );
    const tabWidth = Math.max(1, dockTab.offsetWidth || 38);
    const minimumX = tabWidth;
    /* innerWidth includes the classic PC scrollbar in some browsers. Use the
       layout viewport so the collapsed tab is flush on touch screens while
       still staying clear of a classic PC scrollbar. */
    const viewportWidth = Math.max(
      1,
      document.documentElement?.clientWidth || global.innerWidth || 1
    );
    const maximumX = Math.max(
      minimumX,
      viewportWidth - safeRight - panelWidth
    );
    const minimumY = VERTICAL_EDGE_GAP + safeTop;
    const viewportHeight = Math.max(
      1,
      document.documentElement?.clientHeight || global.innerHeight || 1
    );
    let maximumY = viewportHeight - VERTICAL_EDGE_GAP - safeBottom - panelHeight;
    let scrollControlTop = 0;
    const upButton = document.querySelector(
      '[data-mb-scroll-controls]:not([hidden]) .mb-scroll-control-up:not([hidden])'
    );
    if (upButton) {
      const upRect = upButton.getBoundingClientRect();
      if (
        upRect.width > 0 &&
        upRect.height > 0 &&
        upRect.bottom > 0 &&
        upRect.top < viewportHeight
      ) {
        scrollControlTop = upRect.top;
        maximumY = Math.min(
          maximumY,
          scrollControlTop - SCROLL_CONTROL_GAP - panelHeight
        );
      }
    }
    maximumY = Math.max(minimumY, maximumY);
    return {
      panelWidth,
      panelHeight,
      tabWidth,
      minimumX,
      maximumX,
      minimumY,
      maximumY,
      scrollControlTop
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
        ? (bounds.scrollControlTop
          ? bounds.maximumY
          : Math.max(bounds.minimumY, bounds.maximumY - 82))
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

  function markDockStyleReady() {
    if (dock.dataset.styleReady === 'true') return;
    global.requestAnimationFrame(() => {
      restorePosition();
      global.requestAnimationFrame(() => {
        dock.dataset.styleReady = 'true';
      });
    });
  }

  function waitForDockStylesheet() {
    if (!dockStylesheet) {
      markDockStyleReady();
      return;
    }
    if (dockStylesheet.sheet) {
      markDockStyleReady();
      return;
    }
    dockStylesheet.addEventListener('load', markDockStyleReady, { once: true });
    dockStylesheet.addEventListener('error', () => {
      dock.hidden = true;
      console.warn('MARKET BASE radio dock stylesheet failed to load');
    }, { once: true });
  }

  function attachScrollControlsObserver() {
    const rail = document.querySelector('[data-mb-scroll-controls]');
    if (rail === observedScrollControls) {
      schedulePositionRestore();
      return;
    }
    if (observedScrollControls) scrollControlsResizeObserver?.unobserve(observedScrollControls);
    observedScrollControls = rail;
    if (rail) scrollControlsResizeObserver?.observe(rail);
    schedulePositionRestore();
  }

  function observeScrollControls() {
    if ('ResizeObserver' in global) {
      scrollControlsResizeObserver = new ResizeObserver(schedulePositionRestore);
    }
    attachScrollControlsObserver();
    if ('MutationObserver' in global && document.body) {
      scrollControlsObserver = new MutationObserver(records => {
        const relevant = records.some(record => {
          if (record.type === 'attributes') {
            if (record.target === document.body) return true;
            return record.target === observedScrollControls ||
              record.target.closest?.('[data-mb-scroll-controls]');
          }
          return [...record.addedNodes, ...record.removedNodes].some(node =>
            node.nodeType === 1 && (
              node.matches?.('[data-mb-scroll-controls]') ||
              node.querySelector?.('[data-mb-scroll-controls]')
            )
          );
        });
        if (relevant) attachScrollControlsObserver();
      });
      scrollControlsObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['hidden', 'class', 'style']
      });
    }
  }

  function renderTrack(state) {
    const title = String(state?.trackTitle || '').trim();
    const artist = String(state?.trackArtist || '').trim();
    const visible = !!title;
    trackBox.hidden = !visible;
    placeLabel.hidden = visible;
    if (!visible) {
      trackTitleLabel.textContent = '';
      trackArtistLabel.textContent = '';
      trackTitleLabel.removeAttribute('title');
      trackArtistLabel.removeAttribute('title');
      return;
    }
    trackTitleLabel.textContent = title;
    trackArtistLabel.textContent = artist || state?.stationName || '';
    trackTitleLabel.title = title;
    trackArtistLabel.title = artist || state?.stationName || '';
  }

  function render(state = readState()) {
    dock.hidden = dismissed || !global.navigator.onLine;
    if (!global.navigator.onLine) {
      currentState = null;
      controls.hidden = true;
      stateLabel.textContent = 'オフライン';
      stationLabel.textContent = '世界のラジオ';
      placeLabel.textContent = 'オンライン時に利用できます';
      renderTrack(null);
      message.textContent = '';
      return;
    }
    currentState = stateIsFresh(state) ? state : null;
    dock.dataset.playing = String(!!currentState?.playing);
    dock.dataset.state = currentState?.needsGesture
      ? 'gesture'
      : (currentState?.playing || currentState?.status === 'playing')
        ? 'playing'
        : currentState?.status || 'idle';

    if (!currentState) {
      stateLabel.textContent = '停止中';
      stationLabel.textContent = '世界のラジオ';
      placeLabel.textContent = 'WNYCから聴く';
      renderTrack(null);
      controls.hidden = true;
      openLink.href = new URL(
        `world-radio/player.html?id=wnyc&autoplay=1&v=${ASSET_VERSION}`,
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
    renderTrack(currentState);
    controls.hidden = false;
    const active = currentState.playing || currentState.status === 'loading';
    toggleButton.textContent = active ? 'Ⅱ' : '▶';
    toggleButton.setAttribute(
      'aria-label',
      active ? '再生を停止する' : '再生する'
    );
    openLink.href = new URL(
      `world-radio/player.html?id=${encodeURIComponent(currentState.stationId)}&autoplay=1&v=${ASSET_VERSION}`,
      siteRoot
    ).href;
    if (currentState.needsGesture && currentState.interrupted) {
      message.textContent = '外部アプリで中断されました。▶を押して再開してください。';
    } else if (currentState.interrupted) {
      message.textContent = 'ラジオを再開しています…';
    } else if (currentState.needsGesture) {
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
    if (!global.navigator.onLine) { temporaryMessage('オンライン時に利用できます。'); return; }
    if (pendingCommandId) {
      temporaryMessage('前の操作を処理しています…');
      return;
    }
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
    pendingCommandId = command.id;
    pendingCommandSentAt = command.sentAt;
    pendingCommandTargetId = command.targetInstanceId;
    global.clearTimeout(commandAckHandle);
    commandAckHandle = global.setTimeout(() => {
      if (pendingCommandId !== command.id) return;
      const stored = readState();
      if (
        stored?.instanceId === command.targetInstanceId &&
        Number(stored.updatedAt || 0) >= command.sentAt
      ) {
        pendingCommandId = '';
        pendingCommandSentAt = 0;
        pendingCommandTargetId = '';
        render(stored);
        return;
      }
      pendingCommandId = '';
      pendingCommandSentAt = 0;
      pendingCommandTargetId = '';
      if (stored?.instanceId === command.targetInstanceId) storageRemove(STATE_KEY);
      render(null);
      temporaryMessage('再生タブとの接続が切れました。別タブを開いてください。');
    }, COMMAND_ACK_TIMEOUT_MS);
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
      captureTarget: event.currentTarget,
      moved: false
    };
    dragState.captureTarget.setPointerCapture?.(event.pointerId);
  }

  function moveDrag(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    if (!dragState.moved) {
      if (Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD_PX) return;
      dragState.moved = true;
      dock.dataset.dragging = 'true';
    }
    applyPosition(
      dragState.left + deltaX,
      dragState.top + deltaY,
      false
    );
    event.preventDefault();
  }

  function finishDrag(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    const moved = dragState.moved;
    const rect = moved ? dock.getBoundingClientRect() : null;
    const captureTarget = dragState.captureTarget;
    captureTarget.releasePointerCapture?.(event.pointerId);
    dragState = null;
    delete dock.dataset.dragging;
    if (moved && rect) {
      suppressTabClickUntil = Date.now() + 400;
      applyPosition(rect.left, rect.top, true);
      event.preventDefault();
    }
  }

  dockTab.addEventListener('click', event => {
    if (Date.now() < suppressTabClickUntil) {
      event.preventDefault();
      return;
    }
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
  dockTab.addEventListener('pointerdown', beginDrag);
  dockTab.addEventListener('pointermove', moveDrag);
  dockTab.addEventListener('pointerup', finishDrag);
  dockTab.addEventListener('pointercancel', finishDrag);

  function openChannel() {
    if (channel || !('BroadcastChannel' in global)) return;
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.addEventListener('message', event => {
        if (event.data?.type === 'STATE') render(event.data.state);
        if (event.data?.type === 'ACK') {
          if (
            pendingCommandId &&
            event.data.commandId === pendingCommandId
          ) {
            pendingCommandId = '';
            pendingCommandSentAt = 0;
            pendingCommandTargetId = '';
            global.clearTimeout(commandAckHandle);
          }
          if (event.data.state) render(event.data.state);
        }
      });
    } catch (_) { channel = null; }
  }

  function closeChannel() {
    try { channel?.close(); } catch (_) {}
    channel = null;
  }

  openChannel();

  global.addEventListener('storage', event => {
    if (event.key === STATE_KEY) {
      const state = readState();
      if (
        pendingCommandId &&
        state?.instanceId === pendingCommandTargetId &&
        Number(state.updatedAt || 0) >= pendingCommandSentAt
      ) {
        pendingCommandId = '';
        pendingCommandSentAt = 0;
        pendingCommandTargetId = '';
        global.clearTimeout(commandAckHandle);
      }
      render(state);
    }
    if (event.key === COLLAPSED_KEY) {
      collapsedPreference = event.newValue;
      syncAutomaticCollapse();
    }
    if (event.key === POSITION_KEY) schedulePositionRestore();
    if (event.key === DISMISSED_KEY) {
      applyDismissed(event.newValue === '1', false);
    }
  });

  global.addEventListener('online', () => { applyDismissed(dismissed, false); render(); });
  global.addEventListener('offline', () => { dock.hidden = true; render(); });
  global.addEventListener('resize', schedulePositionRestore, { passive: true });
  global.addEventListener('orientationchange', schedulePositionRestore, {
    passive: true
  });
  global.addEventListener('load', schedulePositionRestore, { once: true });


  let recoveryRequestedAt = 0;
  function requestRecoveryOnReturn() {
    render();
    const state = readState();
    if (!stateIsFresh(state) || !state.interrupted || !state.instanceId) return;
    if (Date.now() - recoveryRequestedAt < 2500) return;
    recoveryRequestedAt = Date.now();
    currentState = state;
    sendCommand('resume');
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) global.setTimeout(requestRecoveryOnReturn, 120);
  });
  global.addEventListener('pageshow', () => {
    openChannel();
    global.setTimeout(requestRecoveryOnReturn, 120);
    schedulePositionRestore();
  });

  applyDismissed(dismissed, false);
  render();
  waitForDockStylesheet();
  observeScrollControls();
  const renderInterval = global.setInterval(() => render(), 30000);
  global.addEventListener('pagehide', event => {
    if (event.persisted) {
      closeChannel();
      return;
    }
    global.clearTimeout(commandAckHandle);
    global.clearInterval(renderInterval);
    scrollControlsObserver?.disconnect();
    scrollControlsResizeObserver?.disconnect();
    closeChannel();
  });

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
