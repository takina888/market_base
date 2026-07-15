// MARKET BASE V273 public service worker
// Network-first/no custom cache. Manual and automatic refresh can unregister this SW if needed.
const MARKET_BASE_SW_VERSION = 'V273_GOHAN_FOOD_MANUFACTURERS_LINK_READY_20260715_R3';
self.addEventListener('install', event => { self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', event => {});
