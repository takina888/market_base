(() => {
  const build = Object.freeze({
    id: 'MARKET_BASE_V316_PC_MAP_HISTORY_IMAGE_SIZE_20260729',
    label: 'MARKET BASE V.315',
    release: 'V.315',
    date: '2026-07-29',
    assetVersion: '20260729-v316'
  });
  window.MARKET_BASE_BUILD = build;
  document.documentElement.dataset.marketBaseBuild = build.id;
  const meta = document.querySelector('meta[name="market-base-build"]');
  if (meta) meta.setAttribute('content', build.id);
})();
