const CACHE_NAME = 'forge-v3';

self.addEventListener('install', e => {
  self.skipWaiting(); // take over immediately
});

self.addEventListener('activate', e => {
  // Delete ALL old caches
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Always network first — never serve stale HTML
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();
  e.waitUntil(self.registration.showNotification(data.title || 'FORGE', {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: data,
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/'));
});
