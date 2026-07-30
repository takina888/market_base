(() => {
  const build = Object.freeze({
    id: 'MARKET_BASE_V324_OFFLINE_MUSIC_PRECISE_NUMBERS_20260730',
    label: 'MARKET BASE V.324',
    release: 'V.324',
    date: '2026-07-30',
    assetVersion: '20260730-v324-offline-music-precise-numbers'
  });
  window.MARKET_BASE_BUILD = build;
  document.documentElement.dataset.marketBaseBuild = build.id;
  [
    'meta[name="market-base-build"]',
    'meta[name="market-base-site-build"]'
  ].forEach(selector => {
    const meta = document.querySelector(selector);
    if (meta) meta.setAttribute('content', build.id);
  });
})();
