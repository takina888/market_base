(() => {
  const build = Object.freeze({
    id: 'MARKET_BASE_V333_7_LAYOUT_NAV_ROUTE_MAP_UNIFICATION_20260803',
    label: 'MARKET BASE V.333.7',
    release: 'V.333.7',
    date: '2026-08-03',
    assetVersion: '20260803-v333-7-layout-nav-route-map-unification'
  });
  window.MARKET_BASE_BUILD = build;
  document.documentElement.dataset.marketBaseBuild = build.id;
  ['meta[name="market-base-build"]','meta[name="market-base-site-build"]'].forEach(selector => {
    const meta = document.querySelector(selector); if (meta) meta.setAttribute('content', build.id);
  });
})();
