/**
 * LWS Sổ Thu Bảo Hiểm Online - Service Worker
 * @license Apache-2.0
 */

const CACHE_NAME = 'lws-so-thu-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/site.webmanifest',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/og-image.jpg'
];

// Install Event: Cache App Shell & Core Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[LWS SW] Caching app shell & static assets...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[LWS SW] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Stale-While-Revalidate & Offline Navigation Fallback
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests and GraphQL/API/WordPress requests from caching strategy
  if (
    event.request.method !== 'GET' || 
    url.pathname.includes('/graphql') || 
    url.pathname.includes('wp-json') ||
    url.hostname.includes('longwebstudio.net')
  ) {
    return;
  }

  // Handle SPA navigation requests (returns index.html if network fails or offline)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // Stale-While-Revalidate strategy for static assets (JS, CSS, images, webmanifest)
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
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
