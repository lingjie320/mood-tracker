// Service worker for 心情记录 PWA.
// Strategy: cache-first for the app shell (HTML/CSS/JS/icons), network-first otherwise.
// On install, pre-cache the shell so the app loads offline.

const CACHE_NAME = 'mood-tracker-v2';
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // For navigations and same-origin assets, try cache first, fall back to network,
  // then cache the network response for next time.
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isNavigation = req.mode === 'navigate';

  if (sameOrigin || isNavigation) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((res) => {
            if (res && res.status === 200 && res.type === 'basic') {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
            }
            return res;
          })
          .catch(() => {
            // Offline + not in cache → return index.html so the app still boots.
            if (isNavigation) return caches.match('./index.html');
          });
      })
    );
  }
});
