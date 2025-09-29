
const CACHE_NAME = 'nomads-bikers-cache-v2';
const MAP_CACHE_NAME = 'nomads-bikers-map-tiles-v1';

// App shell files
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// --- Map Precaching Configuration ---
// A bounding box covering the greater Nyeri County area.
const NYERI_BOUNDS = {
  minLat: -0.8,
  maxLat: -0.1,
  minLon: 36.5,
  maxLon: 37.3,
};
// Zoom levels to precache. Higher levels mean more tiles and more data.
// This range provides a good balance of detail and storage size.
const PRECACHE_ZOOMS = [10, 11, 12, 13];

/**
 * Converts latitude and longitude to Slippy Map tile coordinates.
 * @param {number} lat Latitude.
 * @param {number} lon Longitude.
 * @param {number} zoom Zoom level.
 * @returns {{x: number, y: number}} Tile coordinates.
 */
function latLonToTile(lat, lon, zoom) {
  const latRad = lat * Math.PI / 180;
  const n = Math.pow(2, zoom);
  const x = Math.floor((lon + 180) / 360 * n);
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return { x, y };
}

/**
 * Generates an array of tile URLs for a given bounding box and zoom levels.
 * @returns {string[]} An array of tile URLs.
 */
function getTileUrlsToPrecache() {
  const urls = [];
  const subdomains = ['a', 'b', 'c'];

  PRECACHE_ZOOMS.forEach(zoom => {
    const minTile = latLonToTile(NYERI_BOUNDS.maxLat, NYERI_BOUNDS.minLon, zoom);
    const maxTile = latLonToTile(NYERI_BOUNDS.minLat, NYERI_BOUNDS.maxLon, zoom);

    for (let x = minTile.x; x <= maxTile.x; x++) {
      for (let y = minTile.y; y <= maxTile.y; y++) {
        const subdomain = subdomains[(x + y) % subdomains.length];
        urls.push(`https://${subdomain}.tile.openstreetmap.org/${zoom}/${x}/${y}.png`);
      }
    }
  });
  console.log(`Generated ${urls.length} map tile URLs to precache.`);
  return urls;
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened main cache, caching app shell.');
        return cache.addAll(urlsToCache);
      })
      .then(() => caches.open(MAP_CACHE_NAME))
      .then(mapCache => {
        console.log('Opened map cache. Starting tile precaching...');
        const tileUrls = getTileUrlsToPrecache();
        // Add tiles one by one, ignoring failures. This is more robust for large lists than cache.addAll().
        const promises = tileUrls.map(url =>
          mapCache.add(url).catch(err => {
            // Don't let a single failed tile stop the entire service worker installation.
            console.warn(`Failed to cache tile: ${url}`, err);
          })
        );
        return Promise.all(promises);
      })
      .then(() => {
        console.log('Map tile precaching complete.');
        return self.skipWaiting(); // Activate the new service worker immediately.
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
          // Return cached response immediately if available, while updating the cache in the background.
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
    }).then(() => self.clients.claim()) // Take control of all open clients.
  );
});
