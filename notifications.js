// Wedding Countdown & Firebase Push Notifications Manager
(function () {
  'use strict';

  // Config: 100 days for testing (will be updated to 5 days in future)
  const NOTIFICATION_THRESHOLD_DAYS = 100;
  const WEDDING_DATE = new Date('2027-01-29T00:00:00+05:30');

  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAQ0CsjlAg00rTnqKQROZAadsI5OwVUUpo",
    authDomain: "vidyasetu-f9452.firebaseapp.com",
    projectId: "vidyasetu-f9452",
    storageBucket: "vidyasetu-f9452.firebasestorage.app",
    messagingSenderId: "1092468646860",
    appId: "1:1092468646860:web:57a46c0237d378505ab369",
    measurementId: "G-98MS8VTVMX"
  };

  const FIREBASE_VAPID_KEY =
    'BFEDUTTU5412Gd8FJbRQ06AbK9iB_6I0E5cgP5rz4cK5DNxU-fAs1nwyEMzp8ufv4Y863MN7sjUwPBzE_JQQQU0';

  function getDaysLeft() {
    const now = new Date();
    const diff = WEDDING_DATE.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function getNotificationMessage(days) {
    if (days <= 0) {
      return 'આજે છે ચિ. ધાર્મિક અને ચિ. નિશાના શુભ લગ્નનો માંગલિક દિવસ! આપ સહપરિવાર પધારી નવદંપતીને આશીર્વાદ આપશોજી. 💍';
    } else if (days === 1) {
      return 'કાલે છે શુભ લગ્નનો રૂડો અવસર! આપશ્રી સહપરિવાર અવશ્ય પધારશોજી. 🪕';
    } else {
      return 'ચિ. ધાર્મિક અને ચિ. નિશાના શુભ લગ્નને હવે માત્ર ' + days + ' દિવસ બાકી છે! 🌸';
    }
  }

  // Show rich notification via Service Worker
  function triggerLocalNotification(days, isTest) {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    navigator.serviceWorker.ready.then(function (reg) {
      const title = '॥ શુભ લગ્ન વધામણાં ॥';
      const body = getNotificationMessage(days);
      reg.showNotification(title, {
        body: body,
        icon: 'icon-192.png',
        badge: 'badge-96.png',
        vibrate: [200, 100, 200],
        tag: isTest ? 'wedding-test-' + Date.now() : 'wedding-countdown-' + days,
        renotify: true,
        data: { url: './index.html', daysLeft: days }
      }).catch(function () {});
    });
  }

  // Load Firebase scripts dynamically if needed
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[src="' + src + '"]')) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // Register device FCM token with backend API and Firebase Firestore
  function registerFcmToken() {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    Promise.all([
      loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js'),
      loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js'),
      loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js')
    ])
      .then(function () {
        if (!window.firebase) return;
        if (!window.firebase.apps.length) {
          window.firebase.initializeApp(FIREBASE_CONFIG);
        }
        const messaging = window.firebase.messaging();

        return navigator.serviceWorker.ready.then(function (swReg) {
          return messaging.getToken({
            vapidKey: FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: swReg
          });
        });
      })
      .then(function (token) {
        if (!token) return;

        // Save locally for quick access
        try {
          localStorage.setItem('fcm_device_token', token);
        } catch (_) {}

        console.log('[FCM] Device Token:', token);

        // 1. Sync to Firebase Firestore (collection: fcm_tokens)
        if (window.firebase && window.firebase.firestore) {
          try {
            const db = window.firebase.firestore();
            // Create a safe document ID from token prefix
            const docId = btoa(token.slice(0, 32)).replace(/[/+=]/g, '_');
            db.collection('fcm_tokens').doc(docId).set({
              token: token,
              userAgent: navigator.userAgent || 'Unknown',
              platform: navigator.platform || 'Unknown',
              updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true })
              .then(function () {
                console.log('[FCM] Token synced to Firestore collection "fcm_tokens"');
              })
              .catch(function (err) {
                console.warn('[FCM] Firestore sync note:', err.message);
              });
          } catch (e) {
            console.warn('[FCM] Firestore init note:', e);
          }
        }

        // 2. Fallback to API route (if running in local or Node server environment)
        fetch('api/fcm-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: token,
            userAgent: navigator.userAgent
          })
        }).catch(function () {});
      })
      .catch(function (err) {
        console.error('[FCM] Token generation error:', err);
      });
  }

  // Create UI prompt banner if user hasn't enabled notifications yet
  function createNotificationBanner() {
    if (document.getElementById('ryNotificationBanner')) return;
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted' || Notification.permission === 'denied') return;

    const daysLeft = getDaysLeft();
    if (daysLeft > NOTIFICATION_THRESHOLD_DAYS) return;

    const banner = document.createElement('div');
    banner.id = 'ryNotificationBanner';
    banner.className = 'ry-notification-banner';
    banner.innerHTML =
      '<div class="ry-notif-content">' +
        '<span class="ry-notif-icon">🔔</span>' +
        '<div class="ry-notif-text">' +
          '<div class="ry-notif-title">લગ્ન કાઉન્ટડાઉન નોટિફિકેશન</div>' +
          '<div class="ry-notif-sub">લગ્નના બાકી દિવસોના વધામણાં માટે નોટિફિકેશન શરૂ કરો</div>' +
        '</div>' +
        '<button type="button" class="ry-notif-btn" id="ryNotifAllowBtn">શરૂ કરો</button>' +
        '<button type="button" class="ry-notif-close" id="ryNotifCloseBtn" aria-label="બંધ કરો">×</button>' +
      '</div>';

    document.body.appendChild(banner);

    setTimeout(function () {
      banner.classList.add('is-visible');
    }, 1800);

    const allowBtn = document.getElementById('ryNotifAllowBtn');
    if (allowBtn) {
      allowBtn.addEventListener('click', function () {
        Notification.requestPermission().then(function (perm) {
          if (perm === 'granted') {
            banner.classList.remove('is-visible');
            setTimeout(function () { banner.remove(); }, 400);
            triggerLocalNotification(daysLeft, true);
            registerFcmToken();
          }
        });
      });
    }

    const closeBtn = document.getElementById('ryNotifCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        banner.classList.remove('is-visible');
        setTimeout(function () { banner.remove(); }, 400);
        sessionStorage.setItem('ry_notif_dismissed', '1');
      });
    }
  }

  // Daily check
  function checkDailyNotification() {
    const daysLeft = getDaysLeft();
    if (daysLeft > NOTIFICATION_THRESHOLD_DAYS) return;

    if (Notification.permission === 'granted') {
      // For testing: trigger notification so user gets instant confirmation
      triggerLocalNotification(daysLeft, false);
      registerFcmToken();
    } else {
      createNotificationBanner();
    }
  }

  // Run on page load
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', checkDailyNotification);
  } else {
    setTimeout(checkDailyNotification, 1000);
  }

  // Also check immediately when user switches back to this app (without needing refresh)
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      checkDailyNotification();
    }
  });

  // Expose global helper for testing
  window.testWeddingNotification = function () {
    if (!('Notification' in window)) {
      alert('તમારા બ્રાઉઝરમાં નોટિફિકેશન સપોર્ટ નથી.');
      return;
    }
    Notification.requestPermission().then(function (perm) {
      if (perm === 'granted') {
        const days = getDaysLeft();
        triggerLocalNotification(days, true);
        registerFcmToken();
      } else {
        alert('કૃપા કરીને બ્રાઉઝર સેટિંગ્સમાંથી Notification Allow કરો.');
      }
    });
  };

  // Helper to copy device token for manual push testing
  window.copyMyFcmToken = function () {
    const token = localStorage.getItem('fcm_device_token');
    if (!token) {
      alert('FCM Token હજી મળ્યો નથી. કૃપા કરીને નોટિફિકેશન Allow કરો.');
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(token).then(function () {
        alert('FCM Token ક્લિપબોર્ડમાં કોપી થઈ ગયો છે:\n' + token);
      });
    } else {
      prompt('તમારો FCM Token (કોપી કરી લો):', token);
    }
  };

})();

