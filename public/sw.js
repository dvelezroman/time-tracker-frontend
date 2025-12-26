const CACHE_NAME = 'time-tracker-v1';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/events',
  '/settings',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
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

// Helper function to check if a request can be cached
function canCacheRequest(request) {
  try {
    const url = new URL(request.url);
    // Only cache http/https requests from same origin
    const supportedSchemes = ['http:', 'https:'];
    return supportedSchemes.includes(url.protocol) && url.origin === self.location.origin;
  } catch (error) {
    // If URL parsing fails, don't cache
    return false;
  }
}

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip API calls - they're handled by offline client
  if (event.request.url.includes('/v0/')) {
    return;
  }

  // Skip requests from unsupported schemes (chrome-extension, etc.)
  if (!canCacheRequest(event.request)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Only cache if request is cacheable
        if (canCacheRequest(event.request)) {
          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            try {
              cache.put(event.request, responseToCache);
            } catch (error) {
              // Silently fail if caching fails (e.g., unsupported scheme)
              console.warn('Failed to cache request:', event.request.url, error);
            }
          });
        }

        return response;
      }).catch(() => {
        // Return offline page if available
        return caches.match('/');
      });
    })
  );
});
