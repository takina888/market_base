// MARKET BASE V273 desktop country-dialog R32 public service worker
// Network-first/no custom cache. Manual and automatic refresh can unregister this SW if needed.
const MARKET_BASE_SW_VERSION = 'V273_EIGHT_SPECIALIST_DB_20260716_R32U8_ACCESSIBILITY_UPDATE';
self.addEventListener('install', event => { self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', event => {});
