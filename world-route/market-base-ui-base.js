/* MARKET BASE CLEAN UI BASE — behavior helpers only. */
(() => {
  'use strict';

  function activateTabs(root = document) {
    root.querySelectorAll('[data-mbx-tabs]').forEach((tabs) => {
      const buttons = [...tabs.querySelectorAll('[data-mbx-tab]')];
      if (!buttons.length) return;

      const select = (button, focus = false) => {
        const target = button.getAttribute('data-mbx-tab');
        buttons.forEach((item) => {
          const active = item === button;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-selected', active ? 'true' : 'false');
          item.tabIndex = active ? 0 : -1;
        });
        root.querySelectorAll('[data-mbx-panel]').forEach((panel) => {
          panel.hidden = panel.getAttribute('data-mbx-panel') !== target;
        });
        if (focus) button.focus();
        const url = new URL(window.location.href);
        url.searchParams.set('tab', target);
        window.history.replaceState(null, '', url);
      };

      buttons.forEach((button, index) => {
        button.addEventListener('click', () => select(button));
        button.addEventListener('keydown', (event) => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          let next = index;
          if (event.key === 'ArrowLeft') next = (index - 1 + buttons.length) % buttons.length;
          if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
          if (event.key === 'Home') next = 0;
          if (event.key === 'End') next = buttons.length - 1;
          select(buttons[next], true);
        });
      });

      const requested = new URL(window.location.href).searchParams.get('tab');
      const initial = buttons.find((button) => button.getAttribute('data-mbx-tab') === requested)
        || buttons.find((button) => button.getAttribute('aria-selected') === 'true')
        || buttons[0];
      select(initial);
    });
  }

  function activateHeader(root = document) {
    root.querySelectorAll('[data-mbx-back]').forEach((button) => {
      button.addEventListener('click', () => {
        const fallback = button.getAttribute('data-mbx-back') || '';
        const fallbackUrl = fallback ? new URL(fallback, window.location.href).href : '';
        const samePageFallback = fallbackUrl === window.location.href;
        if (fallbackUrl && !samePageFallback) {
          window.location.replace(fallbackUrl);
          return;
        }
        button.disabled = true;
        button.setAttribute('aria-disabled', 'true');
        button.title = '戻る履歴がありません';
      });
    });

    root.querySelectorAll('[data-mbx-refresh]').forEach((button) => {
      button.addEventListener('click', () => {
        if (button.disabled) return;
        button.disabled = true;
        const original = button.textContent;
        button.textContent = '更新中';
        window.setTimeout(() => window.location.reload(), 120);
        window.setTimeout(() => {
          button.disabled = false;
          button.textContent = original;
        }, 3000);
      });
    });
  }

  function init(root = document) {
    activateTabs(root);
    activateHeader(root);
  }

  window.MarketBaseUI = Object.freeze({ init, activateTabs, activateHeader });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init());
  else init();
})();
