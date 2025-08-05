// service-worker.js
const CACHE_NAME = 'psw-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/styles.css',   // if you created custom CSS
  '/js/app.js',
  '/images/icon-192.png',
  '/images/icon-512.png',
  // add any other static assets you want cached
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => { if (k !== CACHE_NAME) return caches.delete(k); })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network-first for HTML, cache-first for other assets (simple approach)
  const req = event.request;
  if (req.method !== 'GET') return;
  const accept = req.headers.get('accept') || '';
  if (accept.includes('text/html')) {
    // network-first
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return res;
      }).catch(() => caches.match('/index.html'))
    );
  } else {
    // cache-first
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return res;
      })).catch(() => caches.match('/index.html'))
    );
  }
});
