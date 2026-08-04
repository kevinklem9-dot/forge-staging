const CACHE_NAME = 'forge-staging-v2';
const SHELL = [
  '/',
  '/app.html',
  '/index.html',
  '/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(k => k !== CACHE_NAME)
        .map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('/api/')) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME)
          .then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

self.addEventListener('push', e => {
  if (!e.data) return;
  let data;
  try { data = e.data.json(); }
  catch { data = { title: 'FORGE', body: e.data.text() }; }

  const title = data.title || 'FORGE';
  const options = {
    body: data.body || '',
    icon: '/apple-touch-icon.png',
    badge: '/apple-touch-icon.png',
    data: { url: data.url || '/app.html' },
    requireInteraction: false,
    silent: false
  };
  e.waitUntil(
    self.registration.showNotification(title, options)
  );

  // Notify open clients so they refresh
  // unread counts immediately
  self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then(clients => {
    clients.forEach(client =>
      client.postMessage({
        type: 'PUSH_RECEIVED'
      })
    );
  });
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/app.html';
  e.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(list => {
      for (const client of list) {
        if (new URL(client.url).origin === self.location.origin && 'focus' in client) {
          client.navigate(url);
          client.postMessage({ type: 'NOTIF_TAPPED', url: url });
          return client.focus();
        }
      }
      return clients.openWindow(url).then(win => {
        if (win) win.postMessage({ type: 'NOTIF_TAPPED', url: url });
      });
    })
  );
});
