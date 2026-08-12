const CACHE_NAME = 'aside-v2';
const BASE = '/master/aside/';
const ASSETS = [BASE, BASE + 'index.html', BASE + 'manifest.json'];

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
  // 云同步是跨域 POST。Cache API 只认 GET，硬走下面的 put 会 reject 刷一片报错；
  // 离线时 caches.match 又只会返回 undefined，白白把请求变成网络错误。直接放行
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(r => {
      const clone = r.clone();
      caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      return r;
    }).catch(() => caches.match(e.request))
  );
});
