(() => {
  const build = Object.freeze({
    id: 'MARKET_BASE_V333_7_2_WORK_CODE_CONTROLS_20260803',
    label: 'MARKET BASE V.333.7.2',
    release: 'V.333.7.2',
    date: '2026-08-03',
    assetVersion: '20260803-v333-7-2-work-code-controls'
  });
  window.MARKET_BASE_BUILD = build;
  document.documentElement.dataset.marketBaseBuild = build.id;
  ['meta[name="market-base-build"]','meta[name="market-base-site-build"]'].forEach(selector => {
    const meta = document.querySelector(selector); if (meta) meta.setAttribute('content', build.id);
  });
})();
