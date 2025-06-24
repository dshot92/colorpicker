const BASE_PATH = '/colorpicker';

self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install (no caching)');
  // No caching during install
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate (no caching)');
  // No cache cleanup needed
  self.skipWaiting();
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  console.log('[ServiceWorker] Fetch (no caching):', event.request.url);
  // Just fetch from network, no cache fallback
  event.respondWith(fetch(event.request));
});