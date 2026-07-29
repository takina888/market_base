(() => {
  const build = Object.freeze({
    id: 'MARKET_BASE_V303_MAP_READING_QA_HANDOFF_20260728',
    label: 'MARKET BASE V.303 FINAL',
    release: 'V.303',
    date: '2026-07-28',
    assetVersion: '20260728-v303-final'
  });
  window.MARKET_BASE_BUILD = build;
  document.documentElement.dataset.marketBaseBuild = build.id;
  const meta = document.querySelector('meta[name="market-base-build"]');
  if (meta) meta.setAttribute('content', build.id);
})();
