(() => {
  const build = Object.freeze({
    id: 'MARKET_BASE_V324_FLIGHT_LOCATION_CLEANUP_20260730',
    label: 'MARKET BASE V.324',
    release: 'V.324',
    date: '2026-07-30',
    assetVersion: '20260730-v324-flight-location-cleanup'
  });
  window.MARKET_BASE_BUILD = build;
  document.documentElement.dataset.marketBaseBuild = build.id;
  const meta = document.querySelector('meta[name="market-base-build"]');
  if (meta) meta.setAttribute('content', build.id);
})();
