const CACHE_NAME = 'spendex-v3';
const BASE = '/master/expense-tracker/';
const ASSETS = [BASE, BASE + 'index.html', BASE + 'manifest.json', BASE + 'owl.png', BASE + 'icon-192.png', BASE + 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
