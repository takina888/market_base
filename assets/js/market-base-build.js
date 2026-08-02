(() => {
  const build = Object.freeze({
    id: 'MARKET_BASE_V331_DOCK_LIST_UPDATE_HOTFIX_20260802',
    label: 'MARKET BASE V.331',
    release: 'V.331',
    date: '2026-08-02',
    assetVersion: '20260802-v331-dock-list-update-hotfix'
  });
  window.MARKET_BASE_BUILD = build;
  document.documentElement.dataset.marketBaseBuild = build.id;
  ['meta[name="market-base-build"]','meta[name="market-base-site-build"]'].forEach(selector => {
    const meta = document.querySelector(selector); if (meta) meta.setAttribute('content', build.id);
  });
})();
