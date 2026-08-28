const cacheName = "__CACHE_NAME__";
const shell = __PRECACHE_MANIFEST__;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(shell)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== cacheName).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  // Module requests can carry a different Vary header than cache.addAll's
  // prefetches. These are immutable, same-origin files, so matching by URL is
  // both safe and necessary for a true first offline reload.
  const fromCacheOrNetwork = caches.match(event.request, { ignoreVary: true }).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) void caches.open(cacheName).then((cache) => cache.put(event.request, response.clone()));
    return response;
  }));

  // Only document navigations may fall back to the cached shell. Returning HTML
  // for a missing JS or CSS file makes a first offline reload unusable.
  if (event.request.mode === "navigate") {
    event.respondWith(fromCacheOrNetwork.catch(() => caches.match("/")));
    return;
  }

  event.respondWith(fromCacheOrNetwork);
});
