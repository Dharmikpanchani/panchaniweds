// Progressive Web App (PWA) Controller for Panchani Wedding Invitation
(function () {
  'use strict';

  // 1. Service Worker Management (Dev bypass + production auto-purge)
  if ('serviceWorker' in navigator) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // Unregister any active service worker during local development and clear all caches so changes reflect instantly
      navigator.serviceWorker.getRegistrations().then(function (registrations) {
        for (var i = 0; i < registrations.length; i++) {
          registrations[i].unregister();
        }
      });
      if ('caches' in window) {
        caches.keys().then(function (names) {
          names.forEach(function (name) {
            caches.delete(name);
          });
        });
      }
    } else {
      window.addEventListener('load', function () {
        navigator.serviceWorker
          .register('./sw.js')
          .then(function (reg) {
            reg.update();
          })
          .catch(function () {});
      });
      if ('caches' in window) {
        caches.keys().then(function (names) {
          names.forEach(function (name) {
            if (name !== 'panchani-wedding-v52') {
              caches.delete(name);
            }
          });
        });
      }
    }
  }

  // 2. Check if already running as installed standalone app
  var isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  if (isStandalone) {
    return;
  }

  var deferredPrompt = null;
  var hasDismissed = sessionStorage.getItem('pwa_prompt_dismissed');

  // Detect iOS Safari
  var isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  var isSafari = isIos && !window.navigator.userAgent.includes('CriOS') && !window.navigator.userAgent.includes('FxiOS');

  function createInstallBanner() {
    if (document.getElementById('pwaInstallBanner')) return;

    var banner = document.createElement('div');
    banner.id = 'pwaInstallBanner';
    banner.className = 'pwa-banner';

    banner.innerHTML =
      '<div class="pwa-banner__glow"></div>' +
      '<div class="pwa-banner__content">' +
        '<div class="pwa-banner__icon-box">' +
          '<img src="icon-192.png" alt="Panchani Wedding App" class="pwa-banner__icon">' +
        '</div>' +
        '<div class="pwa-banner__info">' +
          '<strong class="pwa-banner__title">પાંચાણી પરિવાર વેડિંગ એપ</strong>' +
          '<p class="pwa-banner__desc">મોબાઈલમાં એપ ઇન્સ્ટોલ કરી સરળતાથી જુઓ</p>' +
        '</div>' +
        '<button type="button" class="pwa-banner__btn" id="pwaInstallBtn">' +
          '<span>ઇન્સ્ટોલ કરો</span>' +
        '</button>' +
        '<button type="button" class="pwa-banner__close" id="pwaCloseBtn" aria-label="Close">&times;</button>' +
      '</div>';

    document.body.appendChild(banner);

    // Fade in banner smoothly after brief delay
    setTimeout(function () {
      banner.classList.add('is-visible');
    }, 1500);

    var installBtn = document.getElementById('pwaInstallBtn');
    var closeBtn = document.getElementById('pwaCloseBtn');

    if (installBtn) {
      installBtn.addEventListener('click', function () {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then(function () {
            deferredPrompt = null;
            banner.classList.remove('is-visible');
            setTimeout(function () { banner.remove(); }, 400);
          });
        } else if (isSafari) {
          // Show iOS specific guide
          alert("iPhone માં એપ ઇન્સ્ટોલ કરવા માટે:\n૧. નીચે 'Share' (શેર) બટન ⎋ દબાવો.\n૨. સ્ક્રોલ કરીને 'Add to Home Screen' ➕ પસંદ કરો.");
        }
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        banner.classList.remove('is-visible');
        sessionStorage.setItem('pwa_prompt_dismissed', 'true');
        setTimeout(function () { banner.remove(); }, 400);
      });
    }
  }

  // 3. Android / Chromium BeforeInstallPrompt Event
  window.addEventListener('beforeinstallprompt', function (e) {
    // Prevent default mini-infobar on mobile Chrome
    e.preventDefault();
    deferredPrompt = e;

    if (!hasDismissed) {
      createInstallBanner();
    }
  });

  // 4. iOS Safari Helper (shown once per session if not installed)
  if (isSafari && !hasDismissed && !isStandalone) {
    window.addEventListener('DOMContentLoaded', function () {
      setTimeout(function () {
        createInstallBanner();
      }, 2500);
    });
  }

  // Hide banner if app is installed
  window.addEventListener('appinstalled', function () {
    var banner = document.getElementById('pwaInstallBanner');
    if (banner) {
      banner.classList.remove('is-visible');
      setTimeout(function () { banner.remove(); }, 400);
    }
  });

})();
