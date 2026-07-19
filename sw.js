// MARKET BASE V273 R76 cumulative patch from R71.
// Includes R72 mobile readability, R73 recent countries 6-grid,
// R74 ranking-style unified headers, and R76 manufacturer card action priority.
// Network-first/no custom cache.
const MARKET_BASE_SW_VERSION = 'V273_R76_CUMULATIVE_FROM_R71_COMPANY_INFO_PRIORITY_RC_20260719';
self.addEventListener('install', event => { self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', event => {});
