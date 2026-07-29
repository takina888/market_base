(() => {
  const build = Object.freeze({
    id: 'MARKET_BASE_V319_PUBLIC_TEXT_CLEANUP_20260729',
    label: 'MARKET BASE V.319',
    release: 'V.319',
    date: '2026-07-29',
    assetVersion: '20260729-v319-public-text'
  });
  window.MARKET_BASE_BUILD = build;
  document.documentElement.dataset.marketBaseBuild = build.id;
  const meta = document.querySelector('meta[name="market-base-build"]');
  if (meta) meta.setAttribute('content', build.id);
})();
