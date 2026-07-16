// MARKET BASE V273 database title R27 public service worker
// Network-first/no custom cache. Manual and automatic refresh can unregister this SW if needed.
const MARKET_BASE_SW_VERSION = 'V273_DB_TITLE_20260716_R27';
self.addEventListener('install', event => { self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', event => {});
