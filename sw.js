// sw.js — Service Worker para One Piecedle Infinito
const VERSION = 'v1.0.0';
const APP_CACHE = `piecedle-${VERSION}`;
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './sw.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k.startsWith('piecedle-') && k !== APP_CACHE) ? caches.delete(k) : null))
    )
  );
  self.clients.claim();
});

// Estratégia: network-first para index.html; cache-first para estáticos
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // same-origin only
  if (url.origin !== location.origin) return;

  if (url.pathname.endsWith('/') || url.pathname.endsWith('index.html')) {
    // Network-first for HTML
    event.respondWith(
      fetch(event.request).then((res) => {
        const resClone = res.clone();
        caches.open(APP_CACHE).then(cache => cache.put(event.request, resClone));
        return res;
      }).catch(() => caches.match(event.request))
    );
  } else {
    // Cache-first for assets
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((res) => {
          const resClone = res.clone();
          caches.open(APP_CACHE).then(cache => cache.put(event.request, resClone));
          return res;
        });
      })
    );
  }
});
