const CACHE_NAME = 'shoplist-v1';
const BASE = '/ShopList/';

// File da cachare per il funzionamento offline
const PRECACHE_URLS = [
  BASE,
  BASE + 'index.html',
  BASE + 'diet.json',
  BASE + 'manifest.json',
  BASE + 'icons/icon-192.png',
  BASE + 'icons/icon-512.png',
];

// Install: pre-cache risorse statiche
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate: pulisci cache vecchie
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Salva in cache la risposta fresca
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Offline: usa la cache
        return caches.match(event.request).then((cached) => {
          return cached || caches.match(BASE + 'index.html');
        });
      })
  );
});
