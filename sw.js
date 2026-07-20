// MARKET BASE R92 mobile recent-country freeze fix; network-first/no custom cache.
const MARKET_BASE_SW_VERSION = 'V273_R92_MOBILE_RECENT_COUNTRY_FREEZE_FIX_20260720';
self.addEventListener('install', event => { self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', event => {});
