(() => {
  const build = Object.freeze({
    id: 'MARKET_BASE_V317_MAIN_APP_MOBILE_WIDTH_RESTORE_20260729',
    label: 'MARKET BASE V.317',
    release: 'V.317',
    date: '2026-07-29',
    assetVersion: '20260729-v317'
  });
  window.MARKET_BASE_BUILD = build;
  document.documentElement.dataset.marketBaseBuild = build.id;
  const meta = document.querySelector('meta[name="market-base-build"]');
  if (meta) meta.setAttribute('content', build.id);
})();
