const CACHE = 'money-v29';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
  '/assets/css/app.css',
  '/assets/js/config.js',
  '/assets/js/auth.js',
  '/assets/js/categories.js',
  '/assets/js/db.js',
  '/assets/js/app.js',
  '/assets/js/dashboard.js',
  '/assets/js/transactions.js',
  '/assets/js/charts.js',
  '/assets/js/budget.js',
  '/assets/js/portfolio.js',
  '/assets/js/dataio.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.all(ASSETS.map(url => fetch(url, { cache: 'reload' }).then(res => res.ok ? c.put(url, res) : null)))
    ).catch(err => console.warn('SW cache error:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network-first strategy (falls back to Cache when offline) so iOS/iPadOS/Web always gets the latest version
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then(response => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
