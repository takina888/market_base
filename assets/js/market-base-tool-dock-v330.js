(function (global) {
  'use strict';

  if (global.MarketBaseToolDock) return;
  if (/\/world-radio\/player\.html$/i.test(global.location.pathname)) return;

  const COLLAPSED_KEY = 'market_base_secondary_dock_collapsed_v1';
  const POSITION_KEY = 'market_base_secondary_dock_position_v1';
  const MAGNET_KEY = 'market_base_secondary_radio_magnet_v1';
  const LAST_TOOL_KEY = 'market_base_last_tool_v1';
  const SNAP_VERTICAL_PX = 18;
  const SNAP_HORIZONTAL_PX = 28;
  const EDGE_GAP = 0;
  const VIEWPORT_GAP = 10;
  const scriptNode = document.currentScript ||
    document.querySelector('script[data-mb-secondary-dock]');

  let siteRoot;
  try {
    siteRoot = scriptNode?.src
      ? new URL('../../', scriptNode.src)
      : new URL('./', global.location.href);
  } catch (_) {
    siteRoot = new URL('./', global.location.href);
  }

  // order 30-890 is intentionally reserved for tools added later; WORK CODE stays toward the back.
  const defaults = Object.freeze({
    tabLabel: 'TOOLS',
    ariaLabel: 'ツール',
    tools: [
      {
        id: 'calculator',
        order: 10,
        label: '計算機・単位換算',
        icon: 'calculator',
        href: 'market-base-currency-converter-v273-r29.html?tool=calculator&v=20260803-v333-7-2-work-code-controls'
      },
      {
        id: 'currency',
        order: 20,
        label: '為替換算',
        icon: 'currency',
        href: 'market-base-currency-converter-v273-r29.html?tool=currency&v=20260803-v333-7-2-work-code-controls'
      },
      {
        id: 'code',
        order: 900,
        label: 'WORK CODE',
        icon: 'code',
        href: 'market-base-code-tool.html?v=20260803-v333-7-2-work-code-controls'
      }
    ]
  });

  let config = normalizeConfig(global.MARKET_BASE_SECOND_DOCK_CONFIG || {});
  let radioDock = null;
  let dock = null;
  let panel = null;
  let dockTab = null;
  let dockTabArrow = null;
  let dockTabGrip = null;
  let dragHandle = null;
  let closeButton = null;
  let collapsed = storageGet(COLLAPSED_KEY) !== '0';
  let magnetized = storageGet(MAGNET_KEY) !== '0';
  let dragState = null;
  let reflowFrame = 0;
  let observer = null;
  let suppressObserver = false;

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

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function text(value, fallback) {
    const next = String(value ?? '').trim();
    return next || fallback;
  }

  function normalizeConfig(input) {
    const supplied = Array.isArray(input.tools) && input.tools.length
      ? input.tools
      : (Array.isArray(input.links) && input.links.length ? input.links : defaults.tools);
    return {
      tabLabel: text(input.tabLabel, defaults.tabLabel).slice(0, 8),
      ariaLabel: text(input.ariaLabel, defaults.ariaLabel),
      tools: supplied.slice(0, 24).map((item, index) => ({
        id: text(item?.id, `tool-${index + 1}`).toLowerCase().replace(/[^a-z0-9_-]+/g, '-'),
        order: Number.isFinite(Number(item?.order)) ? Number(item.order) : (index + 1) * 10,
        label: text(item?.label, `ツール${index + 1}`),
        icon: text(item?.icon, 'external').toLowerCase(),
        href: text(item?.href, 'index.html')
      })).sort((a, b) => a.order - b.order)
    };
  }

  function safeHref(href) {
    try { return new URL(href, siteRoot).href; }
    catch (_) { return new URL('index.html', siteRoot).href; }
  }

  function createDock() {
    const node = document.createElement('aside');
    node.className = 'mb-radio-dock mb-secondary-dock mb-tool-dock';
    node.id = 'marketBaseSecondaryDock';
    node.dataset.dockKind = 'tools';
    node.setAttribute('aria-label', config.ariaLabel);
    node.innerHTML = `
      <section class="mb-radio-dock-panel mb-tool-dock-panel" id="mbSecondaryDockPanel"
        aria-label="${escapeHtml(config.ariaLabel)}の操作">
        <div class="mb-tool-dock-compact">
          <button class="mb-radio-dock-drag" id="mbSecondaryDockDrag" type="button"
            aria-label="ツール小窓を移動">
            <span aria-hidden="true">⠿</span>
          </button>
          <div class="mb-secondary-dock-links" id="mbSecondaryDockLinks"
            role="list" aria-label="ツール一覧"></div>
          <button class="mb-radio-dock-close" id="mbSecondaryDockClose" type="button"
            aria-label="ツール小窓をしまう" title="しまう">×</button>
        </div>
      </section>
      <button class="mb-radio-dock-tab" id="mbSecondaryDockTab" type="button"
        aria-expanded="false" aria-controls="mbSecondaryDockPanel"
        aria-label="ツール小窓を開く">
        <span class="mb-radio-dock-tab-arrow" id="mbSecondaryDockTabArrow"
          aria-hidden="true">‹</span>
        <span class="mb-radio-dock-tab-label" aria-hidden="true">${escapeHtml(config.tabLabel)}</span>
        <span class="mb-radio-dock-tab-grip" id="mbSecondaryDockTabGrip"
          aria-hidden="true" title="押したまま移動">⠿</span>
      </button>
    `;
    document.body.appendChild(node);
    return node;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function iconSvg(name) {
    const icons = {
      calculator: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="10" y="5" width="28" height="38" rx="7"></rect><rect x="15" y="10" width="18" height="8" rx="2"></rect><path d="M16 25h3M24 25h3M32 25h1M16 31h3M24 31h3M32 31h1M16 37h3M24 37h3M31 35v4M29 37h4"></path></svg>',
      currency: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="16" cy="18" r="10"></circle><circle cx="32" cy="30" r="10"></circle><path d="M12 13l4 5 4-5M16 18v7M12 20h8M29 25h6M32 22v16M28 34h8M9 34c3 4 8 6 13 6M39 14c-3-4-8-6-13-6"></path></svg>',
      code: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 8h12v12H8zM28 8h12v12H28zM8 28h12v12H8zM29 29h4v4h-4zM36 28v6M28 38h6M38 36v4M35 35h5"></path></svg>',
      external: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="8" y="8" width="32" height="32" rx="8"></rect><path d="M19 29 31 17M23 17h8v8"></path></svg>'
    };
    return icons[name] || icons.external;
  }

  function toolById(id) {
    return config.tools.find(item => item.id === id) || config.tools[0] || defaults.tools[0];
  }

  function currentToolId() {
    const stored = String(storageGet(LAST_TOOL_KEY) || '').trim();
    return toolById(stored).id;
  }

  function rememberTool(id, broadcast = true) {
    const tool = toolById(id);
    storageSet(LAST_TOOL_KEY, tool.id);
    if (broadcast) {
      try {
        global.dispatchEvent(new CustomEvent('marketbase:tool-used', {
          detail: { id: tool.id, href: safeHref(tool.href) }
        }));
      } catch (_) {}
    }
    syncToolLinks();
    const host = dock?.querySelector('#mbSecondaryDockLinks');
    host?.querySelectorAll('[data-tool-id]').forEach(link => {
      link.dataset.active = String(link.dataset.toolId === tool.id);
    });
    return tool;
  }

  function toolHref(id = currentToolId()) {
    return safeHref(toolById(id).href);
  }

  function syncToolLinks() {
    const href = toolHref();
    const selector = [
      'a[href*="market-base-currency-converter-v273-r29.html"]',
      'a[href*="market-base-code-tool.html"]',
      'a[data-mb-global-nav="tools"]',
      'a[data-mb-last-tool-link]'
    ].join(',');
    document.querySelectorAll(selector).forEach(link => {
      link.href = href;
      link.dataset.mbLastToolLink = currentToolId();
    });
  }

  function renderLinks() {
    const host = dock?.querySelector('#mbSecondaryDockLinks');
    if (!host) return;
    const activeId = currentToolId();
    host.replaceChildren();
    config.tools.forEach(item => {
      const link = document.createElement('a');
      link.className = 'mb-secondary-dock-link';
      link.href = safeHref(item.href);
      link.dataset.toolId = item.id;
      link.dataset.active = String(item.id === activeId);
      link.setAttribute('role', 'listitem');
      link.setAttribute('aria-label', item.label);
      link.setAttribute('title', item.label);
      link.innerHTML = iconSvg(item.icon);
      link.addEventListener('click', () => rememberTool(item.id, true));
      host.appendChild(link);
    });
  }

  function cssPixel(node, property) {
    const style = global.getComputedStyle?.(node);
    const parsed = Number.parseFloat(style?.getPropertyValue(property) || '0');
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function metrics() {
    const panelWidth = Math.max(1, dock?.offsetWidth || panel?.offsetWidth || 280);
    const panelHeight = Math.max(1, panel?.offsetHeight || dock?.offsetHeight || 112);
    const tabWidth = Math.max(1, dockTab?.offsetWidth || 38);
    const safeTop = cssPixel(radioDock || dock, '--dock-safe-top');
    const safeRight = cssPixel(radioDock || dock, '--dock-safe-right');
    const safeBottom = cssPixel(radioDock || dock, '--dock-safe-bottom');
    return {
      panelWidth,
      panelHeight,
      tabWidth,
      minimumX: tabWidth,
      maximumX: Math.max(tabWidth, global.innerWidth - safeRight - panelWidth),
      minimumY: VIEWPORT_GAP + safeTop,
      maximumY: Math.max(
        VIEWPORT_GAP + safeTop,
        global.innerHeight - VIEWPORT_GAP - safeBottom - panelHeight
      )
    };
  }

  function radioVisible() {
    if (!radioDock || radioDock.hidden) return false;
    const style = global.getComputedStyle?.(radioDock);
    return style?.display !== 'none' && style?.visibility !== 'hidden';
  }

  function radioRect() {
    return radioDock?.getBoundingClientRect?.() || null;
  }

  function currentRect() {
    return dock?.getBoundingClientRect?.() || null;
  }

  function setMagnetized(next, persist = true) {
    magnetized = !!next;
    dock.dataset.magnet = String(magnetized);
    if (persist) storageSet(MAGNET_KEY, magnetized ? '1' : '0');
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

  function savePosition(left, top) {
    const bounds = metrics();
    const xRange = bounds.maximumX - bounds.minimumX;
    const yRange = bounds.maximumY - bounds.minimumY;
    storageSet(POSITION_KEY, JSON.stringify({
      xRatio: xRange > 0 ? (left - bounds.minimumX) / xRange : 1,
      yRatio: yRange > 0 ? (top - bounds.minimumY) / yRange : 0
    }));
  }

  function positionFromSaved(saved, bounds) {
    return {
      left: bounds.minimumX + saved.xRatio * (bounds.maximumX - bounds.minimumX),
      top: bounds.minimumY + saved.yRatio * (bounds.maximumY - bounds.minimumY)
    };
  }

  function applyPosition(left, top, save = false) {
    if (!dock) return;
    const bounds = metrics();
    let nextLeft = clamp(left, bounds.minimumX, bounds.maximumX);
    let nextTop = clamp(top, bounds.minimumY, bounds.maximumY);
    const radio = radioRect();

    if (radioVisible() && radio) {
      const collisionTop = radio.top - bounds.panelHeight - EDGE_GAP;
      if (collisionTop < bounds.minimumY) {
        const requiredRadioTop = bounds.minimumY + bounds.panelHeight + EDGE_GAP;
        if (radio.top < requiredRadioTop) {
          suppressObserver = true;
          radioDock.style.top = `${requiredRadioTop}px`;
          suppressObserver = false;
        }
      }
      const updatedRadio = radioRect();
      if (updatedRadio) {
        const maximumWithoutOverlap = updatedRadio.top - bounds.panelHeight - EDGE_GAP;
        nextTop = Math.min(nextTop, maximumWithoutOverlap);
        if (maximumWithoutOverlap < bounds.minimumY) nextTop = bounds.minimumY;

        const verticalDistance = Math.abs(
          nextTop + bounds.panelHeight + EDGE_GAP - updatedRadio.top
        );
        const horizontalDistance = Math.abs(nextLeft - updatedRadio.left);
        if (
          verticalDistance <= SNAP_VERTICAL_PX &&
          horizontalDistance <= SNAP_HORIZONTAL_PX
        ) {
          nextTop = updatedRadio.top - bounds.panelHeight - EDGE_GAP;
          nextLeft = clamp(updatedRadio.left, bounds.minimumX, bounds.maximumX);
          setMagnetized(true, save);
        } else if (dragState) {
          setMagnetized(false, save);
        }
      }
    }

    dock.style.left = `${nextLeft}px`;
    dock.style.top = `${nextTop}px`;
    dock.classList.add('is-positioned');
    if (save) savePosition(nextLeft, nextTop);
  }

  function placeMagnetized() {
    if (!radioVisible()) return false;
    const bounds = metrics();
    let radio = radioRect();
    if (!radio) return false;
    const minimumRadioTop = bounds.minimumY + bounds.panelHeight + EDGE_GAP;
    if (radio.top < minimumRadioTop) {
      suppressObserver = true;
      radioDock.style.top = `${minimumRadioTop}px`;
      suppressObserver = false;
      radio = radioRect();
    }
    if (!radio) return false;
    applyPosition(
      clamp(radio.left, bounds.minimumX, bounds.maximumX),
      radio.top - bounds.panelHeight - EDGE_GAP,
      false
    );
    return true;
  }

  function restorePosition() {
    if (!dock || dragState) return;
    if (magnetized && placeMagnetized()) return;
    const bounds = metrics();
    const saved = savedPosition();
    const fallback = radioVisible() && radioRect()
      ? {
          left: clamp(radioRect().left, bounds.minimumX, bounds.maximumX),
          top: clamp(
            radioRect().top - bounds.panelHeight - EDGE_GAP,
            bounds.minimumY,
            bounds.maximumY
          )
        }
      : {
          left: bounds.maximumX,
          top: bounds.minimumY + (bounds.maximumY - bounds.minimumY) * .35
        };
    const next = saved ? positionFromSaved(saved, bounds) : fallback;
    applyPosition(next.left, next.top, false);
  }

  function scheduleReflow() {
    if (!dock || dragState || suppressObserver) return;
    global.cancelAnimationFrame?.(reflowFrame);
    reflowFrame = global.requestAnimationFrame(() => {
      if (!dragState) restorePosition();
    });
  }

  function applyCollapsed(next, persist = true) {
    collapsed = !!next;
    dock.dataset.collapsed = String(collapsed);
    panel.setAttribute('aria-hidden', String(collapsed));
    dockTab.setAttribute('aria-expanded', String(!collapsed));
    dockTabArrow.textContent = collapsed ? '‹' : '›';
    dockTab.setAttribute(
      'aria-label',
      collapsed ? '追加タブの小窓を開く' : '追加タブの小窓をしまう'
    );
    if (persist) storageSet(COLLAPSED_KEY, collapsed ? '1' : '0');
    scheduleReflow();
  }

  function beginDrag(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const rect = currentRect();
    if (!rect) return;
    dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      left: rect.left,
      top: rect.top,
      captureTarget: event.currentTarget
    };
    setMagnetized(false, false);
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
    const rect = currentRect();
    const captureTarget = dragState.captureTarget;
    captureTarget.releasePointerCapture?.(event.pointerId);
    dragState = null;
    delete dock.dataset.dragging;
    if (rect) applyPosition(rect.left, rect.top, true);
    storageSet(MAGNET_KEY, magnetized ? '1' : '0');
    event.preventDefault();
  }

  function attachEvents() {
    dockTab.addEventListener('click', event => {
      if (event.target.closest('.mb-radio-dock-tab-grip')) return;
      applyCollapsed(!collapsed, true);
    });

    closeButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      applyCollapsed(true, true);
    });

    [dragHandle, dockTabGrip].forEach(handle => {
      handle.addEventListener('pointerdown', beginDrag);
      handle.addEventListener('pointermove', moveDrag);
      handle.addEventListener('pointerup', finishDrag);
      handle.addEventListener('pointercancel', finishDrag);
    });
    dockTabGrip.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
    });

    global.addEventListener('resize', scheduleReflow, { passive: true });
    global.addEventListener('orientationchange', scheduleReflow, { passive: true });
    global.addEventListener('online', scheduleReflow);
    global.addEventListener('offline', scheduleReflow);
    global.addEventListener('load', scheduleReflow, { once: true });

    global.addEventListener('storage', event => {
      if (event.key === COLLAPSED_KEY) applyCollapsed(event.newValue !== '0', false);
      if (event.key === LAST_TOOL_KEY) { syncToolLinks(); renderLinks(); }
      if (event.key === POSITION_KEY || event.key === MAGNET_KEY) {
        if (event.key === MAGNET_KEY) magnetized = event.newValue !== '0';
        scheduleReflow();
      }
    });
  }

  function observeRadio() {
    observer?.disconnect();
    observer = new MutationObserver(() => scheduleReflow());
    observer.observe(radioDock, {
      attributes: true,
      attributeFilter: ['style', 'hidden', 'data-collapsed', 'class']
    });
  }

  function configure(nextConfig) {
    config = normalizeConfig({ ...config, ...(nextConfig || {}) });
    if (!dock) return config;
    dock.setAttribute('aria-label', config.ariaLabel);
    dock.querySelector('.mb-radio-dock-tab-label').textContent = config.tabLabel;
    renderLinks();
    syncToolLinks();
    scheduleReflow();
    return config;
  }

  function init() {
    radioDock = document.querySelector('#marketBaseRadioDock');
    if (!radioDock) return false;
    dock = createDock();
    panel = dock.querySelector('#mbSecondaryDockPanel');
    dockTab = dock.querySelector('#mbSecondaryDockTab');
    dockTabArrow = dock.querySelector('#mbSecondaryDockTabArrow');
    dockTabGrip = dock.querySelector('#mbSecondaryDockTabGrip');
    dragHandle = dock.querySelector('#mbSecondaryDockDrag');
    closeButton = dock.querySelector('#mbSecondaryDockClose');
    renderLinks();
    syncToolLinks();
    setMagnetized(magnetized, false);
    applyCollapsed(collapsed, false);
    attachEvents();
    observeRadio();
    global.requestAnimationFrame(() => {
      restorePosition();
      global.requestAnimationFrame(restorePosition);
    });
    return true;
  }

  function waitForRadio() {
    if (init()) return;
    const bodyObserver = new MutationObserver(() => {
      if (!document.querySelector('#marketBaseRadioDock')) return;
      bodyObserver.disconnect();
      init();
    });
    bodyObserver.observe(document.documentElement, { childList: true, subtree: true });
  }

  global.MarketBaseToolMemory = Object.freeze({
    key: LAST_TOOL_KEY,
    current: currentToolId,
    href: toolHref,
    remember: rememberTool,
    sync: syncToolLinks
  });

  const dockApi = Object.freeze({
    root: siteRoot.href,
    configure,
    refresh: scheduleReflow,
    attach: () => {
      setMagnetized(true, true);
      restorePosition();
    },
    detach: () => setMagnetized(false, true),
    isAttached: () => magnetized,
    open: () => applyCollapsed(false, true),
    close: () => applyCollapsed(true, true),
    lastTool: currentToolId,
    rememberTool
  });
  global.MarketBaseToolDock = dockApi;
  global.MarketBaseSecondaryDock = dockApi;

  syncToolLinks();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForRadio, { once: true });
  } else {
    waitForRadio();
  }
})(window);
