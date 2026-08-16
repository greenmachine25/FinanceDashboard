const CACHE_NAME = 'financehub-v3.0';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './favicon.svg',
  './icon.png',
  './src/css/style.css',
  './src/js/main.js',
  './src/js/state.js',
  './src/js/utils.js',
  './src/js/calculations.js',
  './src/js/charts.js',
  './src/js/firebase.js',
  './src/js/ui/toast.js',
  './src/js/ui/modals.js',
  './src/js/ui/tabs.js',
  './src/js/ui/dragDrop.js',
  './src/js/ui/renderOverview.js',
  './src/js/ui/renderBudgets.js',
  './src/js/ui/renderGoals.js',
  './src/js/ui/renderRents.js',
  './src/js/ui/renderLoans.js',
  './src/js/ui/renderInvestments.js',
];

// Install & Pre-cache
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Network First with Cache Fallback for dynamic / offline resilience
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh in background
        fetch(e.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }
      return fetch(e.request);
    })
  );
});

// Clean up old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});
