// MARKET BASE V243 public clean service worker
// Network-first/no custom cache. Manual and automatic refresh can unregister this SW if needed.
const MARKET_BASE_SW_VERSION = 'V243_CVS_PASS53_RC_V5_DISPLAY_REPLACE_20260707';
self.addEventListener('install', event => { self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', event => {});
