(() => {
  const build = Object.freeze({
    id: 'MARKET_BASE_V333_18_CACHE_RADIO_NAVIGATION_STABILITY_20260810',
    label: 'MARKET BASE V.333.18',
    release: 'V.333.18',
    date: '2026-08-10',
    assetVersion: '20260810-v333-18-cache-radio-navigation-stability'
  });
  window.MARKET_BASE_BUILD = build;
  document.documentElement.dataset.marketBaseRuntimeBuild = build.id;
  ['meta[name="market-base-build"]','meta[name="market-base-site-build"]'].forEach(selector => {
    // Preserve the HTML shell's deployed marker. The update controller compares
    // it with this runtime build to detect a mixed old-document/new-script load.
    const meta = document.querySelector(selector);
    if (meta && !String(meta.getAttribute('content') || '').trim()) meta.setAttribute('content', build.id);
  });
})();
