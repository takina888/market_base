// MARKET BASE R91 cumulative from R75; network-first/no custom cache.
// Network-first/no custom cache. photo_registry.json is fetched with cache:no-store.
const MARKET_BASE_SW_VERSION = 'V273_R91_R75_CUMULATIVE_FOOD_FACTORY_ADD_20260720';
self.addEventListener('install', event => { self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', event => {});
