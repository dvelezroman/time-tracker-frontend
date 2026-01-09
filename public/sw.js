const CACHE_VERSION = 'v2';
const CACHE_NAME = `time-tracker-${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `time-tracker-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `time-tracker-dynamic-${CACHE_VERSION}`;

// Assets that should be cached on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      }),
      // Pre-cache critical Next.js chunks if available
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Dynamic cache initialized');
        return Promise.resolve();
      }),
    ])
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            // Delete old caches that don't match current version
            return name.startsWith('time-tracker-') && 
                   name !== CACHE_NAME && 
                   name !== STATIC_CACHE_NAME && 
                   name !== DYNAMIC_CACHE_NAME;
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
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

// Check if request is for static assets (JS, CSS, images, fonts)
function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.eot'];
  const staticPaths = ['/_next/static/', '/static/', '/_next/webpack'];
  
  // Check extensions
  if (staticExtensions.some(ext => url.includes(ext))) {
    return true;
  }
  
  // Check Next.js static paths
  if (staticPaths.some(path => url.includes(path))) {
    return true;
  }
  
  // Check for common static asset patterns
  if (url.match(/\/_next\/static\/[^/]+\/_buildManifest\.js/) ||
      url.match(/\/_next\/static\/[^/]+\/_ssgManifest\.js/) ||
      url.match(/\/_next\/static\/chunks\//)) {
    return true;
  }
  
  return false;
}

// Check if request is for HTML pages
function isHTMLRequest(request) {
  return request.headers.get('accept')?.includes('text/html') || 
         request.url.endsWith('/') ||
         !request.url.includes('.');
}

// Cache-First strategy for static assets
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      // Clone response before caching
      const responseToCache = response.clone();
      cache.put(request, responseToCache).catch(err => {
        console.warn('[SW] Failed to cache static asset:', request.url, err);
      });
    }
    return response;
  } catch (error) {
    console.warn('[SW] Failed to fetch static asset:', request.url, error);
    // Return a fallback if available
    const cached = await cache.match('/');
    return cached || new Response('Offline', { status: 503 });
  }
}

// Network-First strategy for HTML pages
async function networkFirst(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      // Clone response before caching
      const responseToCache = response.clone();
      cache.put(request, responseToCache).catch(err => {
        console.warn('[SW] Failed to cache page:', request.url, err);
      });
    }
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache for:', request.url);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    // Fallback to home page if available
    const homePage = await cache.match('/');
    return homePage || new Response('Offline - No cached page available', { 
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API calls - they're handled by offline client
  if (request.url.includes('/v0/') || request.url.includes('/api/')) {
    return;
  }

  // Skip requests from unsupported schemes (chrome-extension, etc.)
  if (!canCacheRequest(request)) {
    return;
  }

  // Use Cache-First for static assets
  if (isStaticAsset(request.url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Use Network-First for HTML pages
  if (isHTMLRequest(request)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Default: Network-First with cache fallback
  event.respondWith(networkFirst(request));
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});
