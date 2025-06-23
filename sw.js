const CACHE_NAME = 'color-picker-v1';
const urlsToCache = [
  '/', // This is crucial - make sure this actually resolves to your index.html
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/screenshot_mobile.png'
  // Add ALL your CSS, JS, and other assets here
];

self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching app shell');
        // Cache each URL individually to see which ones fail
        return Promise.all(
          urlsToCache.map(url => {
            return cache.add(url).catch(error => {
              console.error(`[ServiceWorker] Failed to cache ${url}:`, error);
              // Continue with other URLs even if one fails
              return Promise.resolve();
            });
          })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] Skip waiting');
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  console.log('[ServiceWorker] Fetch:', url.pathname);

  // Handle navigation requests (like when the PWA starts)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            console.log('[ServiceWorker] Serving from cache:', event.request.url);
            return response;
          }

          // For navigation requests, try to serve index.html
          console.log('[ServiceWorker] Navigation request, trying index.html');
          return caches.match('/index.html')
            .then(indexResponse => {
              if (indexResponse) {
                return indexResponse;
              }

              // If index.html not in cache, try to fetch it
              return fetch('/index.html')
                .then(fetchResponse => {
                  if (fetchResponse.ok) {
                    // Cache it for future use
                    caches.open(CACHE_NAME).then(cache => {
                      cache.put('/index.html', fetchResponse.clone());
                    });
                    return fetchResponse;
                  }
                  throw new Error('index.html not found');
                })
                .catch(error => {
                  console.error('[ServiceWorker] Failed to serve navigation:', error);
                  // Return a basic error page
                  return new Response(
                    `<!DOCTYPE html>
                    <html><head><title>App Offline</title></head>
                    <body><h1>App is offline</h1><p>Please check your connection and try again.</p></body>
                    </html>`,
                    { headers: { 'Content-Type': 'text/html' } }
                  );
                });
            });
        })
    );
    return;
  }

  // Handle all other requests
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          console.log('[ServiceWorker] Serving from cache:', event.request.url);
          return response;
        }

        console.log('[ServiceWorker] Fetching from network:', event.request.url);
        return fetch(event.request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Cache successful responses
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.error('[ServiceWorker] Fetch failed:', error);
            throw error;
          });
      })
  );
});