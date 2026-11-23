// Firebase Messaging Service Worker for Panchani Wedding PWA
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAQ0CsjlAg00rTnqKQROZAadsI5OwVUUpo",
  authDomain: "vidyasetu-f9452.firebaseapp.com",
  projectId: "vidyasetu-f9452",
  storageBucket: "vidyasetu-f9452.firebasestorage.app",
  messagingSenderId: "1092468646860",
  appId: "1:1092468646860:web:57a46c0237d378505ab369",
  measurementId: "G-98MS8VTVMX"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || '॥ શુભ લગ્ન વધામણાં ॥';
  const body = payload.notification?.body || payload.data?.body || 'પાંચાણી પરિવાર શુભ વિવાહ ઉત્સવ';
  const icon = payload.notification?.image || payload.data?.icon || 'https://dharmikpanchani.github.io/panchaniweds/icon-192.png';

  const notificationOptions = {
    body: body,
    icon: icon,
    badge: 'https://dharmikpanchani.github.io/panchaniweds/badge-96.png',
    image: payload.notification?.image,
    data: payload.data || { url: './index.html' },
    vibrate: [200, 100, 200],
    tag: payload.tag || 'wedding-countdown',
    renotify: true,
    requireInteraction: true,
  };

  self.registration.showNotification(title, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./index.html');
      }
    })
  );
});

