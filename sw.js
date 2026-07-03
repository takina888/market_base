// MARKET BASE public clean service worker
// Minimal no-op service worker kept for fixed-file compatibility.
self.addEventListener('install', event => {
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', event => {
  // Network-first/no custom cache.
});
