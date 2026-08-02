(() => {
  const build = Object.freeze({
    id: 'MARKET_BASE_V333_1_BOTTOM_TOOL_MENU_RADIO_CURRENCY_SAFE_20260803',
    label: 'MARKET BASE V.333.1',
    release: 'V.333.1',
    date: '2026-08-03',
    assetVersion: '20260803-v333-1-bottom-tool-menu-radio-currency-safe'
  });
  window.MARKET_BASE_BUILD = build;
  document.documentElement.dataset.marketBaseBuild = build.id;
  ['meta[name="market-base-build"]','meta[name="market-base-site-build"]'].forEach(selector => {
    const meta = document.querySelector(selector); if (meta) meta.setAttribute('content', build.id);
  });
})();
