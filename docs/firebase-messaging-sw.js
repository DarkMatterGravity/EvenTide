// Firebase Messaging Service Worker
// Handles background push notifications

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase configuration (must match the app config)
const firebaseConfig = {
  apiKey: "AIzaSyDYUm2M3I1hkWxaAjeJYkaID9FH_sVNO4U",
  authDomain: "keepers-report.firebaseapp.com",
  projectId: "keepers-report",
  storageBucket: "keepers-report.firebasestorage.app",
  messagingSenderId: "878621210730",
  appId: "1:878621210730:web:154390c9168dc3a9f8f213"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Keepers Report';
  const notificationOptions = {
    body: payload.notification?.body || 'New surf conditions update',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    tag: payload.data?.tag || 'surf-notification',
    data: payload.data || {},
    actions: [
      { action: 'open', title: 'View Forecast' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Open the app
  const urlToOpen = event.notification.data?.url || '/surf.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window open
      for (const client of windowClients) {
        if (client.url.includes('TheKeepersReport') && 'focus' in client) {
          return client.focus();
        }
      }
      // Open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
