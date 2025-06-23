self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('v1').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/icon-192.png',
        '/icon-512.png',
        '/screenshot_mobile.png'
      ]).catch(error => {
        console.error('Cache addAll failed:', error);
      });
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response;
      }
      return fetch(event.request).catch(error => {
        // Fallback for navigation requests (e.g., SPA)
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        console.error('Fetch failed:', event.request.url, error);
        throw error;
      });
    })
  );
});
