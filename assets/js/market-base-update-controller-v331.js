(function (global) {
  'use strict';
  if (global.MarketBaseUpdate || document.querySelector('script[data-mb-controller-legacy-shim]')) return;
  const source = document.currentScript?.src || global.location.href;
  let root;
  try { root = new URL('../../', source); } catch (_) { root = new URL('./', global.location.href); }
  const target = new URL('assets/js/market-base-update-controller-v335.js', root);
  target.searchParams.set('v', '20260810-v333-18-cache-radio-navigation-stability');
  const script = document.createElement('script');
  script.src = target.href;
  script.async = false;
  script.dataset.mbUpdateController = '';
  script.dataset.mbControllerLegacyShim = '';
  document.head.appendChild(script);
})(window);
