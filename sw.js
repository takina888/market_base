// MARKET BASE V273 R64 news expansion batch 1 + in-page popup service worker
// Network-first/no custom cache.
const MARKET_BASE_SW_VERSION = 'V273_R64_NEWS_EXPANSION_BATCH1_POPUP_RC_20260719';
self.addEventListener('install', event => { self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', event => {});
