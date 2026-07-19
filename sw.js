// MARKET BASE V273 R71 highlight re-audit and unified UI service worker
// Network-first/no custom cache.
const MARKET_BASE_SW_VERSION = 'V273_R71_HIGHLIGHT_REAUDIT_RC_20260719';
self.addEventListener('install', event => { self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', event => {});
