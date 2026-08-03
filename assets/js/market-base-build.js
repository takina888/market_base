(() => {
  const build = Object.freeze({
    id: 'MARKET_BASE_V333_6_RADIO_DOCK_READING_HALF_PC_UNIFICATION_20260803',
    label: 'MARKET BASE V.333.6',
    release: 'V.333.6',
    date: '2026-08-03',
    assetVersion: '20260803-v333-6-radio-dock-reading-half-pc-unification'
  });
  window.MARKET_BASE_BUILD = build;
  document.documentElement.dataset.marketBaseBuild = build.id;
  ['meta[name="market-base-build"]','meta[name="market-base-site-build"]'].forEach(selector => {
    const meta = document.querySelector(selector); if (meta) meta.setAttribute('content', build.id);
  });
})();
