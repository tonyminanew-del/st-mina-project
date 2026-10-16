/* St. Mina Web Push Service Worker. Place at the ROOT of the GitHub Pages site. */
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBcUuUmMe8Lok8Ap7IspdQP5Zp8VHykUWE',
  authDomain: 'st-mina-c01ec.firebaseapp.com',
  databaseURL: 'https://st-mina-c01ec-default-rtdb.firebaseio.com',
  projectId: 'st-mina-c01ec',
  storageBucket: 'st-mina-c01ec.firebasestorage.app',
  messagingSenderId: '792349150559',
  appId: '1:792349150559:web:8a86bbf57c2c7e351f3aea',
  measurementId: 'G-XZGSBG05KR'
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const notification = payload.notification || {};
  const title = notification.title || data.title || 'St. Mina';
  const options = {
    body: notification.body || data.body || 'لديك رسالة جديدة من الكنيسة',
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: data.tag || 'st-mina-' + Date.now(),
    data: { url: data.url || './' },
    // Browser/Android chooses the actual sound; web pages cannot force a custom sound file.
    renotify: true
  };
  return self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || './', self.location.href).href;
  event.waitUntil((async () => {
    const clientsList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientsList) {
      if (client.url.startsWith(self.location.origin) && 'focus' in client) {
        await client.focus();
        if ('navigate' in client) await client.navigate(target);
        return;
      }
    }
    if (clients.openWindow) await clients.openWindow(target);
  })());
});
