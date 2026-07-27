(() => {
  const build = Object.freeze({
    id: 'MARKET_BASE_R113_86_MOBILE_NEWS_READABILITY_20260727',
    label: 'MARKET BASE R113.86 MOBILE NEWS READABILITY',
    release: 'R113.86',
    date: '2026-07-27',
    assetVersion: '20260727-r11386'
  });
  window.MARKET_BASE_BUILD = build;
  document.documentElement.dataset.marketBaseBuild = build.id;
  const meta = document.querySelector('meta[name="market-base-build"]');
  if (meta) meta.setAttribute('content', build.id);
})();
