(() => {
  const build = Object.freeze({
    id: 'MARKET_BASE_V330_WORK_CODE_LATE_TOOL_ORDER_20260802',
    label: 'MARKET BASE V.330',
    release: 'V.330',
    date: '2026-08-02',
    assetVersion: '20260802-v330-work-code-late-order'
  });
  window.MARKET_BASE_BUILD = build;
  document.documentElement.dataset.marketBaseBuild = build.id;
  ['meta[name="market-base-build"]','meta[name="market-base-site-build"]'].forEach(selector => {
    const meta = document.querySelector(selector); if (meta) meta.setAttribute('content', build.id);
  });
})();
