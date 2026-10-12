// RMS Face AI — Enterprise Progressive Web App Service Worker
const CACHE_NAME = 'rms-pwa-v1.0.0';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/maskable-icon-512x512.png',
  '/apple-touch-icon.png'
];

// Install Event — precache core app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[PWA SW] Precache partial error:', err);
      });
    })
  );
  // Do not automatically skipWaiting; wait for user confirmation or activation trigger
});

// Activate Event — cleanup outdated cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[PWA SW] Purging old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event — smart caching strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Bypass all API calls and Socket.IO streams — always live network
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/socket.io')) {
    return;
  }

  // 2. Navigation requests (HTML pages) — Network first, fallback to cached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Update cached copy of the shell
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // 3. Static assets (.js, .css, images, fonts) — Stale-While-Revalidate
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff|woff2|ttf)$/) ||
    url.origin === self.location.origin
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Offline fallback
            return cachedResponse;
          });

        return cachedResponse || fetchPromise;
      })
    );
  }
});

// Listen for messages from client (e.g. skipWaiting on update)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
