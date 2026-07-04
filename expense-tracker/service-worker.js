const CACHE_NAME = 'spendex-v15';
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

// network-first：在线永远拿最新版，离线回退到最近一次成功加载的缓存
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).then(r => {
      const clone = r.clone();
      caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      return r;
    }).catch(() => caches.match(e.request))
  );
});
