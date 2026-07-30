(function (global) {
  'use strict';

  const STATE_KEY = 'market_base_offline_mode_v1';

  function readOfflineEnabled() {
    try {
      const state = JSON.parse(global.localStorage.getItem(STATE_KEY) || 'null');
      return !!state?.enabled;
    } catch (_) {
      return false;
    }
  }

  function init() {
    const badge = document.getElementById('mbHomeOfflineModeBadge');
    const header = badge?.closest('.mb-home-header');
    if (!badge || !header) return;

    function render(explicitState) {
      const active = explicitState && typeof explicitState === 'object'
        ? !!explicitState.enabled
        : readOfflineEnabled();
      badge.hidden = !active;
      header.classList.toggle('mb-has-offline-badge', active);
    }

    render();
    global.addEventListener('marketbase:offline-state-changed', event => {
      render(event.detail);
    });
    global.addEventListener('storage', event => {
      if (event.key === STATE_KEY) render();
    });
    global.addEventListener('pageshow', () => render());
    global.addEventListener('focus', () => render());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})(window);

