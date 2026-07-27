(() => {
  const build = Object.freeze({
    id: 'MARKET_BASE_R113_79_RETAIL_LOGO_DIRECTORY_20260727',
    label: 'MARKET BASE R113.79 RETAIL LOGO DIRECTORY',
    release: 'R113.79',
    date: '2026-07-27',
    assetVersion: '20260727-r11379'
  });
  window.MARKET_BASE_BUILD = build;
  document.documentElement.dataset.marketBaseBuild = build.id;
  const meta = document.querySelector('meta[name="market-base-build"]');
  if (meta) meta.setAttribute('content', build.id);
})();
