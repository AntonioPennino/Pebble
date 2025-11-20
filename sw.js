// Service Worker per PWA OtterCare
const CACHE_NAME = 'ottercare-v6';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './icon.svg',
  './dist/index.js',
  './dist/ui.js',
  './dist/state.js',
  './dist/audio.js',
  './dist/minigame.js',
  './dist/gameActions.js',
  './dist/analytics.js',
  './dist/types.js',
  './src/assets/otter/otter_neutral.png',
  './src/assets/otter/otter_happy.png',
  './src/assets/otter/otter_sad.png',
  './src/assets/otter/otter_sleep.png',
  './src/assets/otter/otter_eat.png',
  './src/assets/otter/otter_bath.png',
  './src/assets/otter/hat.png',
  './src/assets/otter/sunglasses.png',
  './src/assets/otter/scarf.png'
];

// Installazione - cache delle risorse
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Attivazione - pulizia cache vecchie
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - serve da cache, fallback a network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
      )
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
