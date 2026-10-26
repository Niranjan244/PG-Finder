// PG Finder Service Worker for Windows 11 Native Action Center Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const conversationId = event.notification.data?.conversationId;
  const targetUrl = conversationId ? `/chat?conversationId=${conversationId}` : '/chat';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (conversationId && client.navigate) {
            client.navigate(targetUrl);
          }
          client.postMessage({
            type: 'open_chat_conversation',
            conversationId,
          });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
