// MARKET BASE V251 public service worker
// Network-first/no custom cache. Manual and automatic refresh can unregister this SW if needed.
const MARKET_BASE_SW_VERSION = 'V256_SPECIALIST_REFRESH_BUTTONS_20260713';
self.addEventListener('install', event => { self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', event => {});
