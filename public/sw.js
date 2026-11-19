// Service Worker for Panchani Royal Wedding PWA
const CACHE_NAME = 'panchani-wedding-v10';
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './manifest.json',
  './config.js',
  './render.js',
  './app.js',
  './date-reveal.js',
  './gallery.js',
  './wishes.js',
  './gudiya.js',
  './outro.js',
  './scroll.js',
  './platform-adapter.js',
  './_platform/vendor/gsap.min.js',
  './_platform/vendor/ScrollTrigger.min.js',
  './_platform/vendor/lenis.min.js',
  './_platform/vendor/email.min.js',
  './_platform/vendor/fonts/fonts.css',
  './_platform/music.js',
  './_platform/music.css',
  './_platform/toolbar.css',
  './media/ganesha.svg',
  './media/garden_palace_poster.webp',
  './media/mandap_dusk.webp'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW Precache warning]', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Purging outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Don't intercept analytics or third-party APIs like emailjs
  if (url.origin.includes('api.emailjs.com') || url.origin.includes('google-analytics')) {
    return;
  }

  // Bypass Service Worker completely for audio, video, and byte-range streaming (fixes iOS Safari & Android audio playback)
  if (
    url.pathname.endsWith('.mp3') ||
    url.pathname.endsWith('.mp4') ||
    url.pathname.endsWith('.wav') ||
    url.pathname.endsWith('.m4a') ||
    url.pathname.endsWith('.ogg') ||
    event.request.headers.get('range')
  ) {
    return;
  }

  // For localhost, navigation, HTML, CSS, and JS: ALWAYS fetch Network-First!
  const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  const isCodeAsset = url.pathname.endsWith('.html') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname === '/' || url.pathname.endsWith('/');

  if (isLocalhost || isCodeAsset) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Offline fallback
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
