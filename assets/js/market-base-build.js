(() => {
  const build = Object.freeze({
    id: 'MARKET_BASE_V333_5_RADIO_STREAM_REFRESH_INDIA_HAWAII_FLAMENCO_20260803',
    label: 'MARKET BASE V.333.5',
    release: 'V.333.5',
    date: '2026-08-03',
    assetVersion: '20260803-v333-5-radio-stream-refresh-india-hawaii-flamenco'
  });
  window.MARKET_BASE_BUILD = build;
  document.documentElement.dataset.marketBaseBuild = build.id;
  ['meta[name="market-base-build"]','meta[name="market-base-site-build"]'].forEach(selector => {
    const meta = document.querySelector(selector); if (meta) meta.setAttribute('content', build.id);
  });
})();
