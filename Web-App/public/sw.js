const CACHE = 'money-v7';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
  '/assets/css/app.css',
  '/assets/js/config.js',
  '/assets/js/auth.js',
  '/assets/js/db.js',
  '/assets/js/app.js',
  '/assets/js/dashboard.js',
  '/assets/js/transactions.js',
  '/assets/js/charts.js',
  '/assets/js/budget.js',
  '/assets/js/dataio.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(err => console.warn('SW cache error:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(response => {
      if (response.ok && e.request.url.startsWith(self.location.origin)) {
        const clone = response.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return response;
    }))
  );
});
