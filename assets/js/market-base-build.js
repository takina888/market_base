(() => {
  const build = Object.freeze({
    id: 'MARKET_BASE_V333_3_RADIO_RESTORE_V331_CURRENCY_RUNTIME_FIX_20260803',
    label: 'MARKET BASE V.333.3',
    release: 'V.333.3',
    date: '2026-08-03',
    assetVersion: '20260803-v333-3-radio-restore-v331-currency-runtime-fix'
  });
  window.MARKET_BASE_BUILD = build;
  document.documentElement.dataset.marketBaseBuild = build.id;
  ['meta[name="market-base-build"]','meta[name="market-base-site-build"]'].forEach(selector => {
    const meta = document.querySelector(selector); if (meta) meta.setAttribute('content', build.id);
  });
})();
