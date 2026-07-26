const CACHE_NAME = "market-base-work-basics-v010-r11365";
const FILES = ["./", "./index.html?v=20260726-r11365", "./assets/styles.css?v=20260726-r11365", "./assets/app.js?v=20260726-r11365", "./assets/data.js?v=20260726-r11365", "./assets/icon.svg?v=20260726-r11365", "./manifest.webmanifest?v=20260726-r11365"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES))));
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("market-base-work-basics-") && key !== CACHE_NAME).map((key) => caches.delete(key))))));
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match("./index.html?v=20260726-r11365"))));
});
