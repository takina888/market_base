(() => {
  const build = Object.freeze({
    id: 'MARKET_BASE_V322_GLOBAL_UPDATE_JOURNEY_STABILITY_20260730',
    label: 'MARKET BASE V.322',
    release: 'V.322',
    date: '2026-07-30',
    assetVersion: '20260730-v322-global-update-journey-stability'
  });
  window.MARKET_BASE_BUILD = build;
  document.documentElement.dataset.marketBaseBuild = build.id;
  const meta = document.querySelector('meta[name="market-base-build"]');
  if (meta) meta.setAttribute('content', build.id);
})();
