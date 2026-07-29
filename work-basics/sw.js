self.addEventListener("install", event => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(key => key.startsWith("market-base-work-basics-"))
        .map(key => caches.delete(key))
    );
    await self.registration.unregister();
    await self.clients.claim();
  })());
});
