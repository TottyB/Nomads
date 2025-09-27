
const CACHE_NAME = 'nomads-bikers-cache-v2';
const MAP_CACHE_NAME = 'nomads-bikers-map-tiles-v1';

// App shell files
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened main cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Handle map tile requests with a cache-first strategy
  if (requestUrl.hostname.endsWith('tile.openstreetmap.org')) {
    event.respondWith(
      caches.open(MAP_CACHE_NAME).then(cache => {
        return cache.match(event.request).then(response => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
          // Return cached response immediately if available, and update cache in background.
          return response || fetchPromise;
        });
      })
    );
    return;
  }

  // For all other requests, use a network-first, then cache-fallback strategy.
  event.respondWith(
    fetch(event.request).catch(() => {
        return caches.match(event.request).then(response => {
            if (response) {
                return response;
            }
            // Optional: return a fallback offline page if nothing is cached
        });
    })
  );
});


self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME, MAP_CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});