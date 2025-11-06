const APP_CACHE = 'liveboard-app-v2'; // Increment version to force update
const RUNTIME_CACHE = 'liveboard-runtime-v2';
const APP_ASSETS = [
  '/',
  '/index.html',
  '/display',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) => cache.addAll(APP_ASSETS)).catch(() => null)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clear all old caches
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (![APP_CACHE, RUNTIME_CACHE].includes(key)) {
            console.log('Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
      // Take control of all pages immediately
      await self.clients.claim();
      
      // Notify all clients to reload
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(client => {
        client.postMessage({ type: 'SW_UPDATED' });
      });
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Network-first for API
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // App shell for SPA navigations
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((cached) => cached || fetch(request).catch(() => caches.match('/index.html')))
    );
    return;
  }

  // Cache-first for static assets
  if (request.method === 'GET') {
    event.respondWith(cacheFirst(request));
  }
});

async function cacheFirst(request) {
  const cache = await caches.open(APP_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res && res.ok) cache.put(request, res.clone());
  return res;
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const res = await fetch(request);
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  } catch (e) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw e;
  }
}
