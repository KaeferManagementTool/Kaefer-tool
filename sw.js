// KAEFER Safety Tool - Service Worker
const CACHE = 'kaefer-safety-v1';
const OFFLINE_FILES = ['./critical_control_wheel.html', './manifest.json'];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(OFFLINE_FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // For Google Apps Script requests - always go network
  if (e.request.url.includes('script.google.com')) {
    e.respondWith(fetch(e.request).catch(function(){return new Response('{"ok":false,"error":"Offline"}',{headers:{'Content-Type':'application/json'}});}));
    return;
  }
  // For everything else - cache first, network fallback
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(response) {
        var clone = response.clone();
        caches.open(CACHE).then(function(cache){cache.put(e.request, clone);});
        return response;
      });
    }).catch(function() {
      return caches.match('./critical_control_wheel.html');
    })
  );
});