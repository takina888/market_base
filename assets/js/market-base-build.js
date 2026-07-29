(() => {
  const build = Object.freeze({
    id: 'MARKET_BASE_V321_MODULES_UNDER_CONSTRUCTION_20260730',
    label: 'MARKET BASE V.321',
    release: 'V.321',
    date: '2026-07-30',
    assetVersion: '20260730-v321-building-modules'
  });
  window.MARKET_BASE_BUILD = build;
  document.documentElement.dataset.marketBaseBuild = build.id;
  const meta = document.querySelector('meta[name="market-base-build"]');
  if (meta) meta.setAttribute('content', build.id);
})();
