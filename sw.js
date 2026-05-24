// FORGE Service Worker — push notifications only
self.addEventListener('install', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', e => {
  e.waitUntil(
    self.clients.claim()
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then(list => {
        for (const c of list) {
          try { c.postMessage({ type: 'SW_ACTIVATED' }); } catch(err) {}
        }
      })
  );
});

self.addEventListener('push', e => {
  if (!e.data) return;
  let data = {};
  try { data = e.data.json(); } catch(err) { data = { title: 'FORGE', body: e.data.text() }; }
  e.waitUntil(self.registration.showNotification(data.title || 'FORGE', {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
    data: data.url ? { url: data.url } : {},
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/app.html';
  e.waitUntil(clients.matchAll({ type: 'window' }).then(list => {
    for (const c of list) { if (c.url.includes('klemforge') && 'focus' in c) return c.focus(); }
    if (clients.openWindow) return clients.openWindow(url);
  }));
});
