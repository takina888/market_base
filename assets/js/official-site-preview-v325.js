(() => {
  'use strict';

  const config = window.MB_OFFICIAL_SITE_PREVIEW_ALLOWLIST || { urls: [] };
  const verified = new Set();
  const processed = new WeakSet();
  const enhancedEntityUrls = new Set();
  let observer = null;
  let lastFocused = null;
  let modal = null;

  function normalizeUrl(raw) {
    try {
      const url = new URL(String(raw || '').trim(), document.baseURI);
      if (!/^https?:$/.test(url.protocol)) return '';
      url.hash = '';
      url.username = '';
      url.password = '';
      if ((url.protocol === 'https:' && url.port === '443') || (url.protocol === 'http:' && url.port === '80')) {
        url.port = '';
      }
      return url.href;
    } catch (_error) {
      return '';
    }
  }

  function variants(raw) {
    const normalized = normalizeUrl(raw);
    if (!normalized) return [];
    const out = new Set([normalized]);
    try {
      const url = new URL(normalized);
      if (url.pathname === '/' && !url.search) {
        out.add(`${url.origin}/`);
        out.add(url.origin);
      } else if (!url.search) {
        if (url.pathname.endsWith('/')) {
          url.pathname = url.pathname.replace(/\/+$/, '');
        } else {
          url.pathname += '/';
        }
        out.add(url.href);
      }
    } catch (_error) {}
    return [...out];
  }

  (Array.isArray(config.urls) ? config.urls : []).forEach((value) => {
    variants(value).forEach((item) => verified.add(item));
  });

  function isVerified(raw) {
    return variants(raw).some((item) => verified.has(item));
  }

  function compactText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function pageName() {
    const path = window.location.pathname.split('/').filter(Boolean);
    return path[path.length - 1] || 'index.html';
  }

  function entityTitle(anchor) {
    const host = anchor.closest('[data-entity-id], article, .company, .result-card, .manufacturer-card');
    const heading = host?.querySelector('.card-title, .title h2, h2, h3, .manufacturer-name, .maker-name');
    const value = compactText(heading?.textContent);
    return value || '公式サイト';
  }

  function buildModal() {
    if (modal) return modal;

    const layer = document.createElement('div');
    layer.className = 'mb-official-preview-layer';
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = `
      <section class="mb-official-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="mbOfficialPreviewTitle">
        <header class="mb-official-preview-head">
          <div class="mb-official-preview-heading">
            <h2 class="mb-official-preview-title" id="mbOfficialPreviewTitle">公式サイト</h2>
            <div class="mb-official-preview-domain"></div>
          </div>
          <div class="mb-official-preview-actions">
            <a class="mb-official-preview-external" target="_blank" rel="noopener noreferrer"><span>外部で開く</span></a>
            <button class="mb-official-preview-close" type="button" aria-label="小窓を閉じる">×</button>
          </div>
        </header>
        <div class="mb-official-preview-frame-wrap">
          <div class="mb-official-preview-loading">公式サイトを読み込んでいます…</div>
          <iframe class="mb-official-preview-frame" title="公式サイトの小窓表示" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" sandbox="allow-downloads allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"></iframe>
        </div>
      </section>`;

    document.body.appendChild(layer);
    const dialog = layer.querySelector('.mb-official-preview-dialog');
    const frame = layer.querySelector('.mb-official-preview-frame');
    const loading = layer.querySelector('.mb-official-preview-loading');
    const close = layer.querySelector('.mb-official-preview-close');

    const closeModal = () => {
      layer.classList.remove('is-open');
      layer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('mb-official-preview-open');
      frame.removeAttribute('src');
      loading.classList.remove('is-hidden');
      if (lastFocused instanceof HTMLElement) lastFocused.focus({ preventScroll: true });
    };

    close.addEventListener('click', closeModal);
    layer.addEventListener('click', (event) => {
      if (event.target === layer) closeModal();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && layer.classList.contains('is-open')) closeModal();
    });
    frame.addEventListener('load', () => {
      window.setTimeout(() => loading.classList.add('is-hidden'), 180);
    });
    dialog.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const focusable = [...dialog.querySelectorAll('a[href], button:not([disabled])')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    modal = {
      layer,
      frame,
      loading,
      close,
      title: layer.querySelector('.mb-official-preview-title'),
      domain: layer.querySelector('.mb-official-preview-domain'),
      external: layer.querySelector('.mb-official-preview-external'),
      closeModal
    };
    return modal;
  }

  function openPreview(anchor, trigger) {
    if (!navigator.onLine) return;
    const url = normalizeUrl(anchor.href);
    if (!url || !isVerified(url)) return;

    const ui = buildModal();
    lastFocused = trigger;
    ui.title.textContent = entityTitle(anchor);
    try { ui.domain.textContent = new URL(url).hostname; } catch (_error) { ui.domain.textContent = ''; }
    ui.external.href = url;
    ui.loading.classList.remove('is-hidden');
    ui.frame.src = url;
    ui.layer.classList.add('is-open');
    ui.layer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('mb-official-preview-open');
    window.setTimeout(() => ui.close.focus({ preventScroll: true }), 0);
  }

  function enhance(anchor) {
    if (!(anchor instanceof HTMLAnchorElement) || processed.has(anchor)) return;
    processed.add(anchor);

    const url = normalizeUrl(anchor.href);
    if (!url || !isVerified(url)) return;

    const entity = anchor.closest('[data-entity-id]');
    if (!entity) return;
    const entityId = compactText(entity.getAttribute('data-entity-id')) || 'entity';
    const key = `${pageName()}|${entityId}|${url}`;
    if (enhancedEntityUrls.has(key)) return;
    enhancedEntityUrls.add(key);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mb-official-preview-trigger';
    button.textContent = '小窓で見る';
    button.setAttribute('aria-label', `${entityTitle(anchor)}の公式サイトを小窓で見る`);
    button.hidden = !navigator.onLine;
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openPreview(anchor, button);
    });
    anchor.insertAdjacentElement('afterend', button);
  }

  function scan(root = document) {
    root.querySelectorAll?.('a[href]').forEach(enhance);
  }

  function syncOnlineState() {
    document.querySelectorAll('.mb-official-preview-trigger').forEach((button) => {
      button.hidden = !navigator.onLine;
    });
    if (!navigator.onLine && modal?.layer.classList.contains('is-open')) modal.closeModal();
  }

  function init() {
    if (!verified.size) return;
    scan(document);
    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches('a[href]')) enhance(node);
          scan(node);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('online', syncOnlineState);
    window.addEventListener('offline', syncOnlineState);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
