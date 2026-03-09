/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data: {
    title?: string;
    body?: string;
    icon?: string;
    badge?: string;
    url?: string;
  } = {};

  try {
    data = event.data.json();
  } catch {
    data = { title: 'Mini Games Portal', body: event.data.text() };
  }

  const title = data.title || 'Mini Games Portal';
  const options: NotificationOptions = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/favicon-32.png',
    data: { url: data.url || '/' },
    tag: 'mini-games-notification',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click — open or focus the target URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url: string = (event.notification.data as { url?: string })?.url || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Focus existing tab if open
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        // Otherwise open new tab
        return self.clients.openWindow(url);
      })
  );
});
