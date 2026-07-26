(() => {
  const build = Object.freeze({
    id: 'MARKET_BASE_R113_67_BOTTOM_NAV_PRESS_FEEDBACK_20260726',
    label: 'MARKET BASE R113.67 BOTTOM NAV PRESS FEEDBACK',
    release: 'R113.67',
    date: '2026-07-26',
    assetVersion: '20260726-r11367'
  });
  window.MARKET_BASE_BUILD = build;
  document.documentElement.dataset.marketBaseBuild = build.id;
  const meta = document.querySelector('meta[name="market-base-build"]');
  if (meta) meta.setAttribute('content', build.id);
})();
